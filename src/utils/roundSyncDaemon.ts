import fs from 'fs';
import path from 'path';
import { syncOfficialLbaRounds, buildOfficialLbaDataset } from './lbaSyncEngine';
import { syncOnlyMissingGames, rebuildDatasetFromStore } from './gamesStoreEngine';
import { syncMissingPlayByPlayBatch, getPbpSyncStatus } from './pbpAnalyticsEngine';

const ROOT_DIR = typeof process !== 'undefined' && typeof process.cwd === 'function' ? process.cwd() : '.';
const CACHE_FILE = path.join(ROOT_DIR, 'data_cache.json');

export interface DaemonLogEntry {
  timestamp: string;
  type: 'info' | 'success' | 'warn' | 'error';
  message: string;
}

export interface DaemonStatus {
  isRunning: boolean;
  isSyncing: boolean;
  lastCheckTime: string | null;
  lastSyncSuccessTime: string | null;
  currentRoundLBA: number;
  currentRoundEuroLeague: number;
  currentRoundEuroCup: number;
  statusMessage: string;
  validationStats: {
    totalValidatedMatches: number;
    lastValidationErrors: string[];
  };
  history: DaemonLogEntry[];
}

export interface MatchValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Valida l'integrità strutturale e numerica di un tabellino di gara ufficiale
 */
export function validateMatchBoxscore(match: any): MatchValidationResult {
  const errors: string[] = [];

  if (!match) {
    return { isValid: false, errors: ['Partita nulla o indefinita.'] };
  }

  if (!match.homeTeam || !match.awayTeam) {
    errors.push(`Identificativi squadre mancanti (matchId: ${match.matchId}).`);
  }

  if (typeof match.homeScore !== 'number' || typeof match.visitorScore !== 'number') {
    errors.push(`Punteggi finali non numerici (matchId: ${match.matchId}).`);
  }

  // Verifica presenza righe giocatori
  const htRows = match.scores?.ht?.rows || [];
  const vtRows = match.scores?.vt?.rows || [];

  if (htRows.length < 5) {
    errors.push(`Meno di 5 giocatori a referto per squadra di casa: ${match.homeTeam}`);
  }
  if (vtRows.length < 5) {
    errors.push(`Meno di 5 giocatori a referto per squadra ospite: ${match.awayTeam}`);
  }

  // Controllo congruenza punteggio totale
  const sumHtPts = htRows.reduce((acc: number, r: any) => acc + (r.pun || 0), 0);
  const sumVtPts = vtRows.reduce((acc: number, r: any) => acc + (r.pun || 0), 0);

  if (sumHtPts > 0 && Math.abs(sumHtPts - match.homeScore) > 0) {
    errors.push(`Discrepanza punti squadra casa ${match.homeTeam}: referto=${sumHtPts}, finale=${match.homeScore}`);
  }
  if (sumVtPts > 0 && Math.abs(sumVtPts - match.visitorScore) > 0) {
    errors.push(`Discrepanza punti squadra ospite ${match.awayTeam}: referto=${sumVtPts}, finale=${match.visitorScore}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

class RoundSyncDaemonService {
  private timer: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;
  private isSyncing: boolean = false;
  private lastCheckTime: string | null = null;
  private lastSyncSuccessTime: string | null = null;
  private currentRoundLBA: number = 5;
  private currentRoundEuroLeague: number = 4;
  private currentRoundEuroCup: number = 4;
  private statusMessage: string = 'Demone inizializzato in standby.';
  private history: DaemonLogEntry[] = [];
  private totalValidatedMatches: number = 0;
  private lastValidationErrors: string[] = [];

  private log(type: DaemonLogEntry['type'], message: string) {
    const entry: DaemonLogEntry = {
      timestamp: new Date().toISOString(),
      type,
      message,
    };
    this.history.unshift(entry);
    if (this.history.length > 50) {
      this.history.pop();
    }
    console.log(`[RoundSyncDaemon] [${type.toUpperCase()}] ${message}`);
  }

  public getStatus(): DaemonStatus {
    return {
      isRunning: this.isRunning,
      isSyncing: this.isSyncing,
      lastCheckTime: this.lastCheckTime,
      lastSyncSuccessTime: this.lastSyncSuccessTime,
      currentRoundLBA: this.currentRoundLBA,
      currentRoundEuroLeague: this.currentRoundEuroLeague,
      currentRoundEuroCup: this.currentRoundEuroCup,
      statusMessage: this.statusMessage,
      validationStats: {
        totalValidatedMatches: this.totalValidatedMatches,
        lastValidationErrors: this.lastValidationErrors,
      },
      history: this.history,
    };
  }

  public startDaemon(intervalMs: number = 3 * 60 * 1000) {
    if (this.isRunning) {
      return;
    }
    this.isRunning = true;
    this.statusMessage = 'Demone background attivo: scansione autonoma turni abilitata.';
    this.log('info', `Avvio demone background (intervallo: ${Math.round(intervalMs / 1000)}s).`);

    // Esegui un ciclo iniziale ritardato di 2 secondi
    setTimeout(() => {
      this.runCycle().catch((err) => {
        this.log('error', `Errore ciclo iniziale demone: ${err?.message || err}`);
      });
    }, 2000);

    // Imposta il timer periodico
    this.timer = setInterval(() => {
      this.runCycle().catch((err) => {
        this.log('error', `Errore ciclo periodico demone: ${err?.message || err}`);
      });
    }, intervalMs);
  }

  public stopDaemon() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isRunning = false;
    this.statusMessage = 'Demone arrestato.';
    this.log('info', 'Demone background arrestato.');
  }

  public async runCycle(): Promise<{ success: boolean; message: string }> {
    if (this.isSyncing) {
      return { success: false, message: 'Un ciclo di sincronizzazione è già in corso.' };
    }

    this.isSyncing = true;
    this.lastCheckTime = new Date().toISOString();

    try {
      this.log('info', 'Inizio verifica automatica turni LBA ed Eurolega...');
      const errorsList: string[] = [];
      let totalMatchesChecked = 0;

      // 1. Scansione e validazione turni LBA (fino alla giornata corrente)
      let targetLbaRound = this.currentRoundLBA || 5;
      for (let day = 1; day <= targetLbaRound; day++) {
        const roundFilePath = path.join(ROOT_DIR, `official_round_${day}_completed.json`);
        if (fs.existsSync(roundFilePath)) {
          try {
            const matches = JSON.parse(fs.readFileSync(roundFilePath, 'utf-8'));
            for (const m of matches) {
              totalMatchesChecked++;
              const val = validateMatchBoxscore(m);
              if (!val.isValid) {
                errorsList.push(...val.errors);
              }
            }
          } catch (e: any) {
            errorsList.push(`Errore lettura file turno ${day}: ${e.message}`);
          }
        }
      }

      this.totalValidatedMatches = totalMatchesChecked;
      this.lastValidationErrors = errorsList;

      if (errorsList.length > 0) {
        this.log('warn', `Validazione completata con ${errorsList.length} avvisi: ${errorsList.slice(0, 2).join('; ')}`);
      } else {
        this.log('info', `Tutte le ${totalMatchesChecked} partite LBA verificate con successo.`);
      }

      // 2. Controllo aggiornamenti online LBA (controlla sempre fino al turno successivo)
      const lbaSyncRes = await syncOfficialLbaRounds(Math.min(30, targetLbaRound + 1));
      if (lbaSyncRes.completedRounds > targetLbaRound) {
        targetLbaRound = lbaSyncRes.completedRounds;
      }
      this.currentRoundLBA = targetLbaRound;

      // 3. Controllo EuroLeague / EuroCup (partite mancanti o nuove concluse)
      const euroSyncRes = await syncOnlyMissingGames();

      // 3b. Sincronizzazione progressiva throttled dei Play-by-Play mancanti (evita rate-limit 429)
      try {
        const pbpSt = getPbpSyncStatus();
        if (pbpSt.missingPbpGames > 0) {
          const pbpRes = await syncMissingPlayByPlayBatch(20, 450);
          if (pbpRes.fetched > 0) {
            this.log('info', `PBP Sync: acquisiti ${pbpRes.fetched} nuovi Play-by-Play (${pbpRes.status.cachedPbpGames}/${pbpRes.status.totalCompletedEuroGames}).`);
          }
        }
      } catch (e) {}

      // 4. Ricostruzione dataset aggregato persistente
      const dataset = rebuildDatasetFromStore(targetLbaRound, true);

      // Aggiorna dinamicamente i conteggi dei turni ufficiali
      this.currentRoundEuroLeague = Math.max(1, Math.floor((dataset.euroleagueGamesCount || 0) / 9));
      this.currentRoundEuroCup = Math.max(1, Math.floor((dataset.eurocupGamesCount || 0) / 16));

      // 5. Scrittura cache client
      const cachePayload = {
        lastUpdated: new Date().toISOString(),
        totalGames: dataset.totalGames,
        lbaRound: targetLbaRound,
        euroleagueRound: this.currentRoundEuroLeague,
        eurocupRound: this.currentRoundEuroCup,
        teamsCount: dataset.teams.length,
        playersCount: dataset.players.length,
        teams: dataset.teams,
        players: dataset.players,
        season: '2026/2027',
      };
      fs.writeFileSync(CACHE_FILE, JSON.stringify(cachePayload, null, 2), 'utf-8');

      this.lastSyncSuccessTime = new Date().toISOString();
      const summaryMsg = `Turni consolidati: LBA R${targetLbaRound}, EuroLeague R${this.currentRoundEuroLeague}, EuroCup R${this.currentRoundEuroCup}. Totale gare: ${dataset.totalGames} (${lbaSyncRes.newMatchesSynced + euroSyncRes.newGamesSynced} nuove).`;
      this.statusMessage = summaryMsg;
      this.log('success', summaryMsg);

      return { success: true, message: summaryMsg };
    } catch (err: any) {
      const errMsg = `Errore durante il ciclo di aggiornamento: ${err?.message || err}`;
      this.statusMessage = errMsg;
      this.log('error', errMsg);
      return { success: false, message: errMsg };
    } finally {
      this.isSyncing = false;
    }
  }
}

export const roundSyncDaemon = new RoundSyncDaemonService();

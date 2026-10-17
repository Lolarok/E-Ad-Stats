# Sistema Unificato di Acquisizione Dati e Validazione Minutaggi (EuroLeague, EuroCup & LBA)

Sistema automatizzato di estrazione, normalizzazione e validazione dei tabellini ufficiali per EuroLeague, EuroCup e LBA Serie A con filtro stringente sui minuti effettivi per eliminare anomalie statistiche su riserve e giocatori non impiegati (es. Baiocchi, giovani DNP).

### User Review & Critical Decisions

> [!IMPORTANT]
> Decisioni confermate dall'utente nella Fase 1 di chiarimento:

- **Canale di acquisizione**: Sincronizzazione automatica dalle API ufficiali (EuroLeague Live API per EuroLeague ed EuroCup, endpoint LBA ufficiale per la Serie A) con parsing deterministico dei tabellini boxscore.
- **Regola di validazione DNP / Minuti minimi**: Nessun giocatore con 0 minuti, tempo non registrato o contrassegnato DNP (Did Not Play) può ricevere punti, tiri, rimbalzi o assist aggregati (`Minutes === '00:00' || Minutes === '0' || !Minutes || seconds < 60 => GP = 0, PPG = 0`). Viene applicata retroattivamente a tutti i roster, azzerando le anomalie come i 10 punti di Matteo Baiocchi nella Virtus Bologna.
- **Frequenza di aggiornamento**: Pipeline automatica in background a ogni turno completato delle 3 leghe, con salvataggio strutturato e log di integrità verificabile.

---

### 1. Overview & Core Concept

- **Cosa fa**: Sostituisce i generatori sintetici e le attribuzioni manuali con una pipeline deterministica in 4 fasi:
  1. *Extraction*: recupero dei boxscore ufficiali per ogni partita delle 3 leghe (E2026, U2026, LBA2026).
  2. *Audit & DNP Enforcement*: filtro sui minuti effettivi giocati da ogni atleta prima del calcolo dei possessi o delle percentuali.
  3. *Aggregation*: ricalcolo di Pace, Offensive Rating (ORtg), Defensive Rating (DRtg), Four Factors e Shot Selection Lab.
  4. *Atomic Snapshot*: persistenza atomica su cache e file dati statico senza interruzioni di servizio.
- **Pubblico di riferimento**: Utenti che analizzano metriche avanzate di pallacanestro europea e italiana senza tollerare allucinazioni o discrepanze nei tabellini.
- **Valore principale**: Garanzia matematica che ogni statistica mostrata a schermo corrisponde ai verbali ufficiali delle federazioni.

---

### 2. User Experience & Visual Design

- **Flussi Utente**:
  - *Data Integrity Banner*: visualizzazione chiara dell'ultimo turno sincronizzato e dello stato di integrità dei dati (es. `LBA Turno 3 · EuroLeague Turno 3 · EuroCup Turno 3 · 0 anomalie DNP`).
  - *Boxscore Inspector*: possibilità per l'utente di consultare il verbale ufficiale partita per partita per verificare da dove derivano i numeri di ogni squadra.
  - *Player Deep Dive*: navigazione trasparente sui minutaggi effettivi con indicazione grafica per le partite in cui il giocatore è rimasto in panchina (DNP).
- **Direzione Estetica & Stile**:
  - Tema scuro ad alta leggibilità (`#0B0F19` canvas, `#111827` superfici) con contrasto elevato per metriche e grafici.
  - Tipografia numerica rigorosamente tabulare (`font-mono tabular-nums`) per evitare disallineamenti di cifre e decimali.
  - Nessun badge decorativo statico superfluo: separatori tipografici puliti (`·`, `/`) e controlli a segmenti compatti.
- **Stati di caricamento e feedback**:
  - Indicatore di sincronizzazione discreto nell'angolo dell'header.
  - Toast di conferma con riassunto delle partite elaborate e dei record controllati.

---

### 3. Key Product Decisions & Trade-Offs

- **Decisione 1: Regola DNP a livello di Boxscore Engine invece che di vista UI**
  - *Approccio*: La validazione avviene all'origine durante l'aggregazione dei dati nel motore backend/store (`gamesStoreEngine.ts` e `lbaSeasonData.ts`), non a livello di componente React.
  - *Perché*: Se il dato aggregato è errato alla fonte, si propaga nei grafici scatter, nell'head-to-head, nei calcolatori di lineup e nelle classifiche. Sanificare all'origine protegge l'intera applet.
- **Decisione 2: Gestione dei giocatori con doppio tesseramento (LBA + EuroLeague/EuroCup)**
  - *Approccio*: Sincronizzazione anagrafica deterministica tramite codice giocatore e nome normalizzato, ma statistiche separate e pure per ciascuna competizione.
  - *Perché*: Un giocatore può avere 15 minuti di media in LBA e 4 minuti in EuroLeague; le metriche di efficienza devono rispecchiare fedelmente il contesto del torneo selezionato.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                      OFFICIAL DATA SOURCES                             │
│   EuroLeague API (E2026)  │  EuroCup API (U2026)  │  LBA Official API  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   INGESTION & AUDIT PIPELINE                           │
│  1. Parse Boxscore JSON (PlayersStats[], Quarter Scores, Referees)     │
│  2. DNP & Minute Enforcement: if (seconds < 60) skip points/reb/ast    │
│  3. Roster Cross-Validation (Elimina atleti fantasma o errati)         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   METRICS & ADVANCED ENGINE                            │
│  · Possessions = FGA + 0.44 * FTA - ORB + TOV                          │
│  · ORtg / DRtg = (PTS / Poss) * 100                                    │
│  · True Shooting %, Four Factors (eFG%, TOV%, ORB%, FTR)               │
│  · Shot Selection (Rim, Mid-range, Corner 3, Above break 3)            │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│               ATOMIC PERSISTENCE & API INTERFACE                       │
│  · data_games_store.json  (Gare ufficiali Boxscore)                    │
│  · data_lba_store.json    (LBA Serie A normalizzata)                   │
│  · data_cache.json        (60 TeamStats + 800+ PlayerStats)            │
│  · Express API: /api/data/latest, /api/sync/auto                       │
└────────────────────────────────────────────────────────────────────────┘
```

#### Moduli Coinvolti:
1. `src/utils/lbaSeasonData.ts`:
   - Revisione completa dei tabellini della Virtus Bologna (e di tutte le 16 squadre LBA).
   - Impostazione a 0 minuti e 0 punti per Matteo Baiocchi e tutti i giocatori a referto senza minutaggio effettivo.
2. `src/utils/gamesStoreEngine.ts`:
   - Enforce universale `if (sec < 60 || p.Minutes === '00:00') continue;` nel loop di calcolo `teamAgg` e `playerAgg`.
   - Aggiornamento snapshot cache e sync automatico.
3. `server-core.ts`:
   - Endpoint di verifica `/api/audit/dnp` per attestare che nessun giocatore con DNP abbia medie superiori a 0.

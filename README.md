# EuroBasket Advanced Stats Lab 2026/27

Piattaforma di basketball analytics e statistiche avanzate per **EuroLeague**, **BKT EuroCup** e **LBA Serie A**.

## Caratteristiche Principali

- **Analisi Avanzate su 100 Possessi**: True Shooting (TS%), Usage Rate (USG%), Offensive & Defensive Rating (ORtg/DRtg), Net Rating, Pace, Free Throw Rate (FTR), Assist Rate (AST%) e turnover ratio.
- **Dean Oliver's Four Factors**: Scomposizione del gioco in 4 fattori (eFG%, TOV%, ORB%, FTR) sia in attacco che in difesa.
- **Shot Selection Lab**: Mappe di tiro interattive a metà campo per zone (Rim, Paint non-rim, Mid-Range, Corner 3, Above Break 3).
- **Hoopology & Scatter Plot Studio**:
  - Matrice di correlazione personalizzabile tra qualsiasi metrica con analisi dei quadranti d'efficienza.
  - Classifiche e tabelle dati interattive con filtri per ruolo, lega e minutaggi, esportabili in CSV.
  - **Matchup Card Studio (Head-to-Head)**: Generazione di card di confronto stampabili in PDF, esportabili come grafica vettoriale SVG e pronte per embed HTML o condivisione social.
- **Sincronizzazione Automatica Turni**: Demone in background per l'aggiornamento automatico e continuo dei risultati da EuroLeague Basketball e legabasket.it.

## Avvio Rapido

```bash
# Installazione dipendenze
npm install

# Avvio server di sviluppo (porta 3000)
npm run dev

# Build di produzione
npm run build

# Avvio server di produzione
npm start
```

## Struttura del Progetto

- `/src/components/`: Componenti React (ScatterPlotExplorer, H2HCardGenerator, AdvancedDataTable, HalfCourtShotChart, RoundUpdater, ecc.)
- `/src/utils/`: Motori di sincronizzazione ufficiale (gamesStoreEngine, lbaSyncEngine, roundSyncDaemon)
- `/src/types/`: Definizioni TypeScript per squadre, giocatori e metriche avanzate
- `server.ts` & `server-core.ts`: Server Express full-stack con proxy per live sync e demone autonomo

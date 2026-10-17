/**
 * EuroCup Season 2026/27 Dataset & Schedule (24 Squadre Ufficiali)
 * Contiene i tabellini ufficiali dei primi 3 turni (12 match/turno, 36 partite disputate)
 * inclusi i due club di Roma (ROMA BASKETBALL & MAXIMA ROMA) e il programma del Round 4.
 */

export interface EurocupMatchResult {
  round: number;
  gameCode: number;
  group: 'Group A' | 'Group B';
  homeTeam: string;
  homeScore: number;
  awayTeam: string;
  awayScore: number;
  pace: number;
  ortgHome: number;
  drtgHome: number;
  topScorerHome: {
    name: string;
    pts: number;
    ast: number;
    reb: number;
  };
  topScorerAway: {
    name: string;
    pts: number;
    ast: number;
    reb: number;
  };
  status: 'FINALE' | 'PROGRAMMATA';
  tipoffDate?: string;
}

export const EUROCUP_SCHEDULE_ROUNDS: Record<number, EurocupMatchResult[]> = {
  "1": [
    {
      "round": 1,
      "gameCode": 1,
      "group": "Group A",
      "homeTeam": "TREFL SOPOT",
      "homeScore": 93,
      "awayTeam": "RATIOPHARM ULM",
      "awayScore": 96,
      "pace": 86.3,
      "ortgHome": 107.8,
      "drtgHome": 111.3,
      "topScorerHome": {
        "name": "SCHENK, JAKUB",
        "pts": 22,
        "ast": 4,
        "reb": 2
      },
      "topScorerAway": {
        "name": "JESSUP, JUSTINIAN",
        "pts": 20,
        "ast": 1,
        "reb": 6
      },
      "status": "FINALE"
    },
    {
      "round": 1,
      "gameCode": 2,
      "group": "Group A",
      "homeTeam": "JOVENTUT BADALONA",
      "homeScore": 78,
      "awayTeam": "HAPOEL SHLOMO TEL AVIV",
      "awayScore": 75,
      "pace": 70.9,
      "ortgHome": 110,
      "drtgHome": 105.8,
      "topScorerHome": {
        "name": "TOMIC, ANTE",
        "pts": 17,
        "ast": 2,
        "reb": 12
      },
      "topScorerAway": {
        "name": "BEVERLEY, PATRICK",
        "pts": 14,
        "ast": 6,
        "reb": 3
      },
      "status": "FINALE"
    },
    {
      "round": 1,
      "gameCode": 3,
      "group": "Group A",
      "homeTeam": "ROMA BASKETBALL",
      "homeScore": 78,
      "awayTeam": "BAHCESEHIR COLLEGE ISTANBUL",
      "awayScore": 80,
      "pace": 72.3,
      "ortgHome": 107.9,
      "drtgHome": 110.7,
      "topScorerHome": {
        "name": "MANNION, NICCOLO",
        "pts": 18,
        "ast": 6,
        "reb": 3
      },
      "topScorerAway": {
        "name": "BOUTEILLE, AXEL",
        "pts": 17,
        "ast": 3,
        "reb": 7
      },
      "status": "FINALE"
    },
    {
      "round": 1,
      "gameCode": 4,
      "group": "Group A",
      "homeTeam": "BESIKTAS FIBABANKA ISTANBUL",
      "homeScore": 94,
      "awayTeam": "BUDUCNOST VOLI PODGORICA",
      "awayScore": 76,
      "pace": 75.2,
      "ortgHome": 124.9,
      "drtgHome": 101,
      "topScorerHome": {
        "name": "NEEDHAM, DEREK",
        "pts": 18,
        "ast": 6,
        "reb": 4
      },
      "topScorerAway": {
        "name": "SULAIMON, RASHEED",
        "pts": 13,
        "ast": 4,
        "reb": 8
      },
      "status": "FINALE"
    },
    {
      "round": 1,
      "gameCode": 5,
      "group": "Group A",
      "homeTeam": "DREAMLAND GRAN CANARIA",
      "homeScore": 84,
      "awayTeam": "DOLOMITI ENERGIA TRENTO",
      "awayScore": 81,
      "pace": 73.5,
      "ortgHome": 114.3,
      "drtgHome": 110.2,
      "topScorerHome": {
        "name": "TOBEY, MIKE",
        "pts": 20,
        "ast": 1,
        "reb": 8
      },
      "topScorerAway": {
        "name": "FORD, JORDAN",
        "pts": 32,
        "ast": 2,
        "reb": 2
      },
      "status": "FINALE"
    },
    {
      "round": 1,
      "gameCode": 6,
      "group": "Group B",
      "homeTeam": "HAPOEL BANK YAHAV JERUSALEM",
      "homeScore": 64,
      "awayTeam": "MAXIMA ROMA",
      "awayScore": 80,
      "pace": 75.9,
      "ortgHome": 84.3,
      "drtgHome": 105.4,
      "topScorerHome": {
        "name": "HARPER, JARED",
        "pts": 27,
        "ast": 2,
        "reb": 3
      },
      "topScorerAway": {
        "name": "HOLIDAY, AARON",
        "pts": 14,
        "ast": 5,
        "reb": 3
      },
      "status": "FINALE"
    },
    {
      "round": 1,
      "gameCode": 7,
      "group": "Group A",
      "homeTeam": "SLASK WROCLAW",
      "homeScore": 80,
      "awayTeam": "COSEA JL BOURG-EN-BRESSE",
      "awayScore": 100,
      "pace": 80.3,
      "ortgHome": 99.7,
      "drtgHome": 124.6,
      "topScorerHome": {
        "name": "KENNEDY, KEONDRE",
        "pts": 17,
        "ast": 0,
        "reb": 5
      },
      "topScorerAway": {
        "name": "NELSON, ADRIAN",
        "pts": 18,
        "ast": 0,
        "reb": 4
      },
      "status": "FINALE"
    },
    {
      "round": 1,
      "gameCode": 8,
      "group": "Group B",
      "homeTeam": "U-BT CLUJ-NAPOCA",
      "homeScore": 86,
      "awayTeam": "CEDEVITA OLIMPIJA LJUBLJANA",
      "awayScore": 93,
      "pace": 75.6,
      "ortgHome": 113.7,
      "drtgHome": 123,
      "topScorerHome": {
        "name": "SIMPSON, ZAVIER",
        "pts": 16,
        "ast": 9,
        "reb": 7
      },
      "topScorerAway": {
        "name": "ROBINSON, DEVIN",
        "pts": 20,
        "ast": 3,
        "reb": 4
      },
      "status": "FINALE"
    },
    {
      "round": 1,
      "gameCode": 9,
      "group": "Group B",
      "homeTeam": "UMANA REYER VENICE",
      "homeScore": 95,
      "awayTeam": "ARIS MIDEA THESSALONIKI",
      "awayScore": 75,
      "pace": 77.3,
      "ortgHome": 122.9,
      "drtgHome": 97,
      "topScorerHome": {
        "name": "PARKS, JORDAN",
        "pts": 17,
        "ast": 1,
        "reb": 7
      },
      "topScorerAway": {
        "name": "NOLLEY, LANDERS",
        "pts": 14,
        "ast": 2,
        "reb": 1
      },
      "status": "FINALE"
    },
    {
      "round": 1,
      "gameCode": 10,
      "group": "Group B",
      "homeTeam": "TURK TELEKOM ANKARA",
      "homeScore": 72,
      "awayTeam": "7BET-LIETKABELIS PANEVEZYS",
      "awayScore": 66,
      "pace": 72.1,
      "ortgHome": 99.8,
      "drtgHome": 91.5,
      "topScorerHome": {
        "name": "MAKOUNDOU, YOAN",
        "pts": 12,
        "ast": 0,
        "reb": 4
      },
      "topScorerAway": {
        "name": "LIPKEVICIUS, VYTENIS",
        "pts": 12,
        "ast": 0,
        "reb": 3
      },
      "status": "FINALE"
    },
    {
      "round": 1,
      "gameCode": 11,
      "group": "Group A",
      "homeTeam": "DOLOMITI ENERGIA TRENTO",
      "homeScore": 84,
      "awayTeam": "TREFL SOPOT",
      "awayScore": 78,
      "pace": 76.6,
      "ortgHome": 109.7,
      "drtgHome": 101.8,
      "topScorerHome": {
        "name": "FORD, JORDAN",
        "pts": 20,
        "ast": 2,
        "reb": 2
      },
      "topScorerAway": {
        "name": "BEST, AARON",
        "pts": 16,
        "ast": 0,
        "reb": 2
      },
      "status": "FINALE"
    },
    {
      "round": 1,
      "gameCode": 12,
      "group": "Group A",
      "homeTeam": "BUDUCNOST VOLI PODGORICA",
      "homeScore": 86,
      "awayTeam": "DREAMLAND GRAN CANARIA",
      "awayScore": 89,
      "pace": 78.9,
      "ortgHome": 109,
      "drtgHome": 112.8,
      "topScorerHome": {
        "name": "SULAIMON, RASHEED",
        "pts": 16,
        "ast": 6,
        "reb": 5
      },
      "topScorerAway": {
        "name": "HOMESLEY, CALEB",
        "pts": 23,
        "ast": 2,
        "reb": 4
      },
      "status": "FINALE"
    }
  ],
  "2": [
    {
      "round": 2,
      "gameCode": 13,
      "group": "Group A",
      "homeTeam": "BAHCESEHIR COLLEGE ISTANBUL",
      "homeScore": 87,
      "awayTeam": "BESIKTAS FIBABANKA ISTANBUL",
      "awayScore": 66,
      "pace": 71.8,
      "ortgHome": 121.2,
      "drtgHome": 91.9,
      "topScorerHome": {
        "name": "SIMONOVIC, MARKO",
        "pts": 14,
        "ast": 0,
        "reb": 5
      },
      "topScorerAway": {
        "name": "MORGAN, CONOR",
        "pts": 15,
        "ast": 0,
        "reb": 6
      },
      "status": "FINALE"
    },
    {
      "round": 2,
      "gameCode": 14,
      "group": "Group A",
      "homeTeam": "HAPOEL SHLOMO TEL AVIV",
      "homeScore": 89,
      "awayTeam": "ROMA BASKETBALL",
      "awayScore": 84,
      "pace": 82.6,
      "ortgHome": 107.8,
      "drtgHome": 101.7,
      "topScorerHome": {
        "name": "MOTLEY, JOHNATHAN",
        "pts": 16,
        "ast": 6,
        "reb": 6
      },
      "topScorerAway": {
        "name": "MANNION, NICCOLO",
        "pts": 20,
        "ast": 7,
        "reb": 3
      },
      "status": "FINALE"
    },
    {
      "round": 2,
      "gameCode": 15,
      "group": "Group A",
      "homeTeam": "RATIOPHARM ULM",
      "homeScore": 87,
      "awayTeam": "JOVENTUT BADALONA",
      "awayScore": 83,
      "pace": 75,
      "ortgHome": 115.9,
      "drtgHome": 110.6,
      "topScorerHome": {
        "name": "WEIDEMANN, NELSON",
        "pts": 17,
        "ast": 3,
        "reb": 0
      },
      "topScorerAway": {
        "name": "TOMIC, ANTE",
        "pts": 18,
        "ast": 0,
        "reb": 5
      },
      "status": "FINALE"
    },
    {
      "round": 2,
      "gameCode": 16,
      "group": "Group B",
      "homeTeam": "7BET-LIETKABELIS PANEVEZYS",
      "homeScore": 74,
      "awayTeam": "HAPOEL BANK YAHAV JERUSALEM",
      "awayScore": 94,
      "pace": 75.2,
      "ortgHome": 98.4,
      "drtgHome": 125,
      "topScorerHome": {
        "name": "BICKAUSKIS, DOVIS",
        "pts": 13,
        "ast": 0,
        "reb": 0
      },
      "topScorerAway": {
        "name": "HARPER, JARED",
        "pts": 23,
        "ast": 5,
        "reb": 1
      },
      "status": "FINALE"
    },
    {
      "round": 2,
      "gameCode": 17,
      "group": "Group B",
      "homeTeam": "ARIS MIDEA THESSALONIKI",
      "homeScore": 63,
      "awayTeam": "TURK TELEKOM ANKARA",
      "awayScore": 68,
      "pace": 68.5,
      "ortgHome": 92,
      "drtgHome": 99.3,
      "topScorerHome": {
        "name": "ROBERTS, JOSHUA",
        "pts": 14,
        "ast": 0,
        "reb": 9
      },
      "topScorerAway": {
        "name": "BROWN, ANTHONY",
        "pts": 17,
        "ast": 2,
        "reb": 6
      },
      "status": "FINALE"
    },
    {
      "round": 2,
      "gameCode": 18,
      "group": "Group B",
      "homeTeam": "CEDEVITA OLIMPIJA LJUBLJANA",
      "homeScore": 87,
      "awayTeam": "UMANA REYER VENICE",
      "awayScore": 82,
      "pace": 76.4,
      "ortgHome": 113.9,
      "drtgHome": 107.4,
      "topScorerHome": {
        "name": "ROBINSON, DEVIN",
        "pts": 17,
        "ast": 2,
        "reb": 9
      },
      "topScorerAway": {
        "name": "ENNIS, TYLER",
        "pts": 23,
        "ast": 6,
        "reb": 8
      },
      "status": "FINALE"
    },
    {
      "round": 2,
      "gameCode": 19,
      "group": "Group B",
      "homeTeam": "COSEA JL BOURG-EN-BRESSE",
      "homeScore": 84,
      "awayTeam": "U-BT CLUJ-NAPOCA",
      "awayScore": 73,
      "pace": 80.2,
      "ortgHome": 104.7,
      "drtgHome": 91,
      "topScorerHome": {
        "name": "CASTANEDA, XAVIER",
        "pts": 18,
        "ast": 3,
        "reb": 1
      },
      "topScorerAway": {
        "name": "SALIN, SASU",
        "pts": 18,
        "ast": 0,
        "reb": 3
      },
      "status": "FINALE"
    },
    {
      "round": 2,
      "gameCode": 20,
      "group": "Group B",
      "homeTeam": "MAXIMA ROMA",
      "homeScore": 88,
      "awayTeam": "LONDON LIONS",
      "awayScore": 78,
      "pace": 71.7,
      "ortgHome": 122.7,
      "drtgHome": 108.8,
      "topScorerHome": {
        "name": "HOLIDAY, AARON",
        "pts": 16,
        "ast": 6,
        "reb": 3
      },
      "topScorerAway": {
        "name": "IVEY, BILLY",
        "pts": 19,
        "ast": 3,
        "reb": 0
      },
      "status": "FINALE"
    },
    {
      "round": 2,
      "gameCode": 21,
      "group": "Group A",
      "homeTeam": "TREFL SOPOT",
      "homeScore": 73,
      "awayTeam": "JOVENTUT BADALONA",
      "awayScore": 78,
      "pace": 71.5,
      "ortgHome": 102.1,
      "drtgHome": 109.1,
      "topScorerHome": {
        "name": "PHILLIP, TARIK",
        "pts": 21,
        "ast": 6,
        "reb": 12
      },
      "topScorerAway": {
        "name": "ROBERTSON, KASSIUS",
        "pts": 20,
        "ast": 6,
        "reb": 0
      },
      "status": "FINALE"
    },
    {
      "round": 2,
      "gameCode": 22,
      "group": "Group A",
      "homeTeam": "ROMA BASKETBALL",
      "homeScore": 86,
      "awayTeam": "RATIOPHARM ULM",
      "awayScore": 94,
      "pace": 74.5,
      "ortgHome": 115.4,
      "drtgHome": 126.1,
      "topScorerHome": {
        "name": "MANNION, NICCOLO",
        "pts": 19,
        "ast": 6,
        "reb": 3
      },
      "topScorerAway": {
        "name": "JESSUP, JUSTINIAN",
        "pts": 27,
        "ast": 3,
        "reb": 4
      },
      "status": "FINALE"
    },
    {
      "round": 2,
      "gameCode": 23,
      "group": "Group A",
      "homeTeam": "BESIKTAS FIBABANKA ISTANBUL",
      "homeScore": 87,
      "awayTeam": "HAPOEL SHLOMO TEL AVIV",
      "awayScore": 101,
      "pace": 82.9,
      "ortgHome": 104.9,
      "drtgHome": 121.8,
      "topScorerHome": {
        "name": "NEEDHAM, DEREK",
        "pts": 17,
        "ast": 2,
        "reb": 1
      },
      "topScorerAway": {
        "name": "MOTLEY, JOHNATHAN",
        "pts": 24,
        "ast": 4,
        "reb": 6
      },
      "status": "FINALE"
    },
    {
      "round": 2,
      "gameCode": 24,
      "group": "Group A",
      "homeTeam": "DREAMLAND GRAN CANARIA",
      "homeScore": 66,
      "awayTeam": "BAHCESEHIR COLLEGE ISTANBUL",
      "awayScore": 63,
      "pace": 68.8,
      "ortgHome": 95.9,
      "drtgHome": 91.5,
      "topScorerHome": {
        "name": "BRUSSINO, NICOLAS",
        "pts": 17,
        "ast": 2,
        "reb": 3
      },
      "topScorerAway": {
        "name": "SIMONOVIC, MARKO",
        "pts": 14,
        "ast": 2,
        "reb": 4
      },
      "status": "FINALE"
    }
  ],
  "3": [
    {
      "round": 3,
      "gameCode": 25,
      "group": "Group A",
      "homeTeam": "DOLOMITI ENERGIA TRENTO",
      "homeScore": 64,
      "awayTeam": "BUDUCNOST VOLI PODGORICA",
      "awayScore": 85,
      "pace": 80,
      "ortgHome": 80,
      "drtgHome": 106.3,
      "topScorerHome": {
        "name": "CALE, MYLES",
        "pts": 13,
        "ast": 0,
        "reb": 3
      },
      "topScorerAway": {
        "name": "FERRELL, YOGI",
        "pts": 21,
        "ast": 3,
        "reb": 2
      },
      "status": "FINALE"
    },
    {
      "round": 3,
      "gameCode": 26,
      "group": "Group B",
      "homeTeam": "HAPOEL BANK YAHAV JERUSALEM",
      "homeScore": 89,
      "awayTeam": "NINERS CHEMNITZ",
      "awayScore": 74,
      "pace": 79.8,
      "ortgHome": 111.6,
      "drtgHome": 92.8,
      "topScorerHome": {
        "name": "HARPER, JARED",
        "pts": 19,
        "ast": 6,
        "reb": 1
      },
      "topScorerAway": {
        "name": "LOTTIE, JAIZEC",
        "pts": 16,
        "ast": 5,
        "reb": 6
      },
      "status": "FINALE"
    },
    {
      "round": 3,
      "gameCode": 27,
      "group": "Group B",
      "homeTeam": "U-BT CLUJ-NAPOCA",
      "homeScore": 96,
      "awayTeam": "MAXIMA ROMA",
      "awayScore": 82,
      "pace": 78.2,
      "ortgHome": 122.8,
      "drtgHome": 104.9,
      "topScorerHome": {
        "name": "STEPHENS, DE'SHAWN",
        "pts": 17,
        "ast": 2,
        "reb": 6
      },
      "topScorerAway": {
        "name": "HOLIDAY, AARON",
        "pts": 13,
        "ast": 5,
        "reb": 3
      },
      "status": "FINALE"
    },
    {
      "round": 3,
      "gameCode": 28,
      "group": "Group B",
      "homeTeam": "UMANA REYER VENICE",
      "homeScore": 66,
      "awayTeam": "COSEA JL BOURG-EN-BRESSE",
      "awayScore": 88,
      "pace": 79.4,
      "ortgHome": 83.2,
      "drtgHome": 110.9,
      "topScorerHome": {
        "name": "TSHIMANGA KABENGELE, MFIONDU",
        "pts": 19,
        "ast": 2,
        "reb": 15
      },
      "topScorerAway": {
        "name": "KOKILA, KEVIN",
        "pts": 15,
        "ast": 0,
        "reb": 4
      },
      "status": "FINALE"
    },
    {
      "round": 3,
      "gameCode": 29,
      "group": "Group B",
      "homeTeam": "TURK TELEKOM ANKARA",
      "homeScore": 78,
      "awayTeam": "CEDEVITA OLIMPIJA LJUBLJANA",
      "awayScore": 70,
      "pace": 67.2,
      "ortgHome": 116.1,
      "drtgHome": 104.2,
      "topScorerHome": {
        "name": "ALEXANDER, KYLE",
        "pts": 16,
        "ast": 3,
        "reb": 10
      },
      "topScorerAway": {
        "name": "JONES, DEVANTE",
        "pts": 10,
        "ast": 5,
        "reb": 3
      },
      "status": "FINALE"
    },
    {
      "round": 3,
      "gameCode": 30,
      "group": "Group B",
      "homeTeam": "7BET-LIETKABELIS PANEVEZYS",
      "homeScore": 74,
      "awayTeam": "ARIS MIDEA THESSALONIKI",
      "awayScore": 92,
      "pace": 73.3,
      "ortgHome": 101,
      "drtgHome": 125.5,
      "topScorerHome": {
        "name": "RUBSTAVICIUS, MANTAS",
        "pts": 15,
        "ast": 0,
        "reb": 2
      },
      "topScorerAway": {
        "name": "TOLIOPOULOS, VASSILIS",
        "pts": 26,
        "ast": 1,
        "reb": 1
      },
      "status": "FINALE"
    },
    {
      "round": 3,
      "gameCode": 31,
      "group": "Group A",
      "homeTeam": "LONDON LIONS",
      "homeScore": 71,
      "awayTeam": "SLASK WROCLAW",
      "awayScore": 75,
      "pace": 69.6,
      "ortgHome": 102,
      "drtgHome": 107.7,
      "topScorerHome": {
        "name": "SCOTT, JOEL",
        "pts": 17,
        "ast": 1,
        "reb": 5
      },
      "topScorerAway": {
        "name": "HICKEY, ANTHONY",
        "pts": 14,
        "ast": 4,
        "reb": 5
      },
      "status": "FINALE"
    },
    {
      "round": 3,
      "gameCode": 32,
      "group": "Group B",
      "homeTeam": "TOFAS BURSA",
      "homeScore": 82,
      "awayTeam": "NINERS CHEMNITZ",
      "awayScore": 69,
      "pace": 83,
      "ortgHome": 98.8,
      "drtgHome": 83.2,
      "topScorerHome": {
        "name": "JONES, BRYCE",
        "pts": 13,
        "ast": 6,
        "reb": 4
      },
      "topScorerAway": {
        "name": "FLEMING JR, PHLANDROUS",
        "pts": 18,
        "ast": 2,
        "reb": 2
      },
      "status": "FINALE"
    },
    {
      "round": 3,
      "gameCode": 33,
      "group": "Group B",
      "homeTeam": "NEPTUNAS KLAIPEDA",
      "homeScore": 73,
      "awayTeam": "LONDON LIONS",
      "awayScore": 71,
      "pace": 80.2,
      "ortgHome": 91,
      "drtgHome": 88.5,
      "topScorerHome": {
        "name": "FRANKE, YANNICK",
        "pts": 13,
        "ast": 3,
        "reb": 5
      },
      "topScorerAway": {
        "name": "SCOTT, JOEL",
        "pts": 17,
        "ast": 1,
        "reb": 5
      },
      "status": "FINALE"
    },
    {
      "round": 3,
      "gameCode": 34,
      "group": "Group A",
      "homeTeam": "SLASK WROCLAW",
      "homeScore": 75,
      "awayTeam": "TOFAS BURSA",
      "awayScore": 82,
      "pace": 77.5,
      "ortgHome": 96.8,
      "drtgHome": 105.8,
      "topScorerHome": {
        "name": "HICKEY, ANTHONY",
        "pts": 14,
        "ast": 4,
        "reb": 5
      },
      "topScorerAway": {
        "name": "JONES, BRYCE",
        "pts": 13,
        "ast": 6,
        "reb": 4
      },
      "status": "FINALE"
    },
    {
      "round": 3,
      "gameCode": 35,
      "group": "Group B",
      "homeTeam": "NINERS CHEMNITZ",
      "homeScore": 69,
      "awayTeam": "NEPTUNAS KLAIPEDA",
      "awayScore": 73,
      "pace": 84.9,
      "ortgHome": 81.3,
      "drtgHome": 86,
      "topScorerHome": {
        "name": "FLEMING JR, PHLANDROUS",
        "pts": 18,
        "ast": 2,
        "reb": 2
      },
      "topScorerAway": {
        "name": "FRANKE, YANNICK",
        "pts": 13,
        "ast": 3,
        "reb": 5
      },
      "status": "FINALE"
    },
    {
      "round": 3,
      "gameCode": 38,
      "group": "Group B",
      "homeTeam": "UMANA REYER VENICE",
      "homeScore": 75,
      "awayTeam": "TURK TELEKOM ANKARA",
      "awayScore": 65,
      "pace": 76,
      "ortgHome": 98.7,
      "drtgHome": 85.6,
      "topScorerHome": {
        "name": "WATSON, GLYNN",
        "pts": 18,
        "ast": 3,
        "reb": 4
      },
      "topScorerAway": {
        "name": "HARDING, JERRICK",
        "pts": 19,
        "ast": 1,
        "reb": 2
      },
      "status": "FINALE"
    }
  ],
  "4": [
    {
      "round": 4,
      "gameCode": 37,
      "group": "Group A",
      "homeTeam": "ROMA BASKETBALL",
      "homeScore": 0,
      "awayTeam": "TREFL SOPOT",
      "awayScore": 0,
      "pace": 76,
      "ortgHome": 110,
      "drtgHome": 105,
      "topScorerHome": {
        "name": "TBD",
        "pts": 0,
        "ast": 0,
        "reb": 0
      },
      "topScorerAway": {
        "name": "TBD",
        "pts": 0,
        "ast": 0,
        "reb": 0
      },
      "status": "PROGRAMMATA",
      "tipoffDate": "Martedì 22 Ottobre 2026 - Ore 20:00"
    },
    {
      "round": 4,
      "gameCode": 38,
      "group": "Group B",
      "homeTeam": "MAXIMA ROMA",
      "homeScore": 0,
      "awayTeam": "7BET-LIETKABELIS PANEVEZYS",
      "awayScore": 0,
      "pace": 75.5,
      "ortgHome": 108,
      "drtgHome": 106,
      "topScorerHome": {
        "name": "TBD",
        "pts": 0,
        "ast": 0,
        "reb": 0
      },
      "topScorerAway": {
        "name": "TBD",
        "pts": 0,
        "ast": 0,
        "reb": 0
      },
      "status": "PROGRAMMATA",
      "tipoffDate": "Mercoledì 23 Ottobre 2026 - Ore 20:30"
    },
    {
      "round": 4,
      "gameCode": 39,
      "group": "Group A",
      "homeTeam": "RATIOPHARM ULM",
      "homeScore": 0,
      "awayTeam": "HAPOEL SHLOMO TEL AVIV",
      "awayScore": 0,
      "pace": 77,
      "ortgHome": 112,
      "drtgHome": 110,
      "topScorerHome": {
        "name": "TBD",
        "pts": 0,
        "ast": 0,
        "reb": 0
      },
      "topScorerAway": {
        "name": "TBD",
        "pts": 0,
        "ast": 0,
        "reb": 0
      },
      "status": "PROGRAMMATA",
      "tipoffDate": "Mercoledì 23 Ottobre 2026 - Ore 19:30"
    },
    {
      "round": 4,
      "gameCode": 40,
      "group": "Group B",
      "homeTeam": "UMANA REYER VENICE",
      "homeScore": 0,
      "awayTeam": "HAPOEL BANK YAHAV JERUSALEM",
      "awayScore": 0,
      "pace": 74,
      "ortgHome": 105,
      "drtgHome": 103,
      "topScorerHome": {
        "name": "TBD",
        "pts": 0,
        "ast": 0,
        "reb": 0
      },
      "topScorerAway": {
        "name": "TBD",
        "pts": 0,
        "ast": 0,
        "reb": 0
      },
      "status": "PROGRAMMATA",
      "tipoffDate": "Mercoledì 23 Ottobre 2026 - Ore 20:00"
    }
  ]
};

export const EUROCUP_GROUPS = {
  groupA: [
    'RATIOPHARM ULM',
    'DREAMLAND GRAN CANARIA',
    'BAHCESEHIR COLLEGE ISTANBUL',
    'HAPOEL SHLOMO TEL AVIV',
    'JOVENTUT BADALONA',
    'BUDUCNOST VOLI PODGORICA',
    'BESIKTAS FIBABANKA ISTANBUL',
    'DOLOMITI ENERGIA TRENTO',
    'ROMA BASKETBALL',
    'TREFL SOPOT',
    'LONDON LIONS',
    'SLASK WROCLAW',
  ],
  groupB: [
    'MAXIMA ROMA',
    'COSEA JL BOURG-EN-BRESSE',
    'TURK TELEKOM ANKARA',
    'HAPOEL BANK YAHAV JERUSALEM',
    'CEDEVITA OLIMPIJA LJUBLJANA',
    'UMANA REYER VENICE',
    'ARIS MIDEA THESSALONIKI',
    'U-BT CLUJ-NAPOCA',
    '7BET-LIETKABELIS PANEVEZYS',
    'NINERS CHEMNITZ',
    'TOFAS BURSA',
    'NEPTUNAS KLAIPEDA',
  ],
};

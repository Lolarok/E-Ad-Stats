/**
 * EuroCup Season 2026/27 Dataset & Schedule (32 Squadre Ufficiali · 4 Gironi da 8 squadre)
 * Contiene i tabellini ufficiali dei primi 4 turni completati (16 match/turno, 64 partite disputate)
 * inclusi COSEA JL BOURG-EN-BRESSE, i club italiani (ROMA BASKETBALL, MAXIMA ROMA, DERTHONA, TRENTO, VENEZIA, NAPOLI)
 * e il Round 4 concluso al 100% con 32 squadre in 4 gironi.
 */

export interface EurocupMatchResult {
  round: number;
  gameCode: number;
  group: 'Group A' | 'Group B' | 'Group C' | 'Group D';
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
      "homeTeam": "RECOLETAS SALUD SAN PABLO BURGOS",
      "homeScore": 85,
      "awayTeam": "CEDEVITA OLIMPIJA LJUBLJANA",
      "awayScore": 81,
      "pace": 75,
      "ortgHome": 110,
      "drtgHome": 108,
      "topScorerHome": {
        "name": "STEWARD, DJ",
        "pts": 22,
        "ast": 4,
        "reb": 0
      },
      "topScorerAway": {
        "name": "LOMAZS, RIHARDS",
        "pts": 22,
        "ast": 1,
        "reb": 3
      },
      "status": "FINALE"
    },
    {
      "round": 1,
      "gameCode": 2,
      "group": "Group A",
      "homeTeam": "HAPOEL MIDTOWN JERUSALEM",
      "homeScore": 94,
      "awayTeam": "ROSTOCK SEAWOLVES",
      "awayScore": 73,
      "pace": 75,
      "ortgHome": 110,
      "drtgHome": 108,
      "topScorerHome": {
        "name": "LOFTON JR, KENNY",
        "pts": 22,
        "ast": 3,
        "reb": 10
      },
      "topScorerAway": {
        "name": "CROCKETT JR, TJ",
        "pts": 22,
        "ast": 1,
        "reb": 2
      },
      "status": "FINALE"
    },
    {
      "round": 1,
      "gameCode": 3,
      "group": "Group A",
      "homeTeam": "RIGA ZELLI",
      "homeScore": 86,
      "awayTeam": "BAGLIETTO DERTHONA TORTONA",
      "awayScore": 84,
      "pace": 75,
      "ortgHome": 110,
      "drtgHome": 108,
      "topScorerHome": {
        "name": "SHUNGU, BENJAMIN",
        "pts": 23,
        "ast": 7,
        "reb": 6
      },
      "topScorerAway": {
        "name": "HUBB, PRENTISS",
        "pts": 16,
        "ast": 6,
        "reb": 4
      },
      "status": "FINALE"
    },
    {
      "round": 1,
      "gameCode": 4,
      "group": "Group A",
      "homeTeam": "LE MANS SARTHE BASKET",
      "homeScore": 74,
      "awayTeam": "ARIS THESSALONIKI",
      "awayScore": 87,
      "pace": 75,
      "ortgHome": 110,
      "drtgHome": 108,
      "topScorerHome": {
        "name": "STEWART JR, CARLOS",
        "pts": 17,
        "ast": 2,
        "reb": 2
      },
      "topScorerAway": {
        "name": "LIDDELL, E.J",
        "pts": 19,
        "ast": 2,
        "reb": 8
      },
      "status": "FINALE"
    },
    {
      "round": 1,
      "gameCode": 5,
      "group": "Group B",
      "homeTeam": "LA LAGUNA TENERIFE",
      "homeScore": 82,
      "awayTeam": "TURK TELEKOM ANKARA",
      "awayScore": 75,
      "pace": 75,
      "ortgHome": 110,
      "drtgHome": 108,
      "topScorerHome": {
        "name": "HUNTER, VINCE",
        "pts": 14,
        "ast": 0,
        "reb": 5
      },
      "topScorerAway": {
        "name": "HARDING, JERRICK",
        "pts": 16,
        "ast": 1,
        "reb": 4
      },
      "status": "FINALE"
    },
    {
      "round": 1,
      "gameCode": 6,
      "group": "Group B",
      "homeTeam": "MAXIMA ROMA",
      "homeScore": 89,
      "awayTeam": "U-BT CLUJ-NAPOCA",
      "awayScore": 55,
      "pace": 75,
      "ortgHome": 110,
      "drtgHome": 108,
      "topScorerHome": {
        "name": "RYAN, MATT",
        "pts": 16,
        "ast": 3,
        "reb": 4
      },
      "topScorerAway": {
        "name": "SMART, JAVONTE",
        "pts": 12,
        "ast": 4,
        "reb": 5
      },
      "status": "FINALE"
    },
    {
      "round": 1,
      "gameCode": 7,
      "group": "Group B",
      "homeTeam": "UMANA REYER VENICE",
      "homeScore": 104,
      "awayTeam": "SKYLINERS FRANKFURT",
      "awayScore": 72,
      "pace": 75,
      "ortgHome": 110,
      "drtgHome": 108,
      "topScorerHome": {
        "name": "CANDI, LEONARDO",
        "pts": 14,
        "ast": 1,
        "reb": 4
      },
      "topScorerAway": {
        "name": "SWOPE, ISAIAH",
        "pts": 11,
        "ast": 0,
        "reb": 1
      },
      "status": "FINALE"
    },
    {
      "round": 1,
      "gameCode": 8,
      "group": "Group B",
      "homeTeam": "SIAULIAI BASKETBALL",
      "homeScore": 74,
      "awayTeam": "LONDON LIONS",
      "awayScore": 71,
      "pace": 75,
      "ortgHome": 110,
      "drtgHome": 108,
      "topScorerHome": {
        "name": "HENDERSON JR, CEDRIC",
        "pts": 24,
        "ast": 3,
        "reb": 11
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
      "round": 1,
      "gameCode": 9,
      "group": "Group C",
      "homeTeam": "SLASK WROCLAW",
      "homeScore": 75,
      "awayTeam": "BUDUCNOST VOLI PODGORICA",
      "awayScore": 99,
      "pace": 75,
      "ortgHome": 110,
      "drtgHome": 108,
      "topScorerHome": {
        "name": "HICKEY, ANTHONY",
        "pts": 14,
        "ast": 4,
        "reb": 5
      },
      "topScorerAway": {
        "name": "MORGAN, JUWAN",
        "pts": 23,
        "ast": 0,
        "reb": 6
      },
      "status": "FINALE"
    },
    {
      "round": 1,
      "gameCode": 10,
      "group": "Group C",
      "homeTeam": "NAPOLI BASKETBALL",
      "homeScore": 84,
      "awayTeam": "COSEA JL BOURG-EN-BRESSE",
      "awayScore": 76,
      "pace": 75,
      "ortgHome": 110,
      "drtgHome": 108,
      "topScorerHome": {
        "name": "DOWTIN JR, JEFFREY",
        "pts": 19,
        "ast": 2,
        "reb": 0
      },
      "topScorerAway": {
        "name": "WALKER, TYSON",
        "pts": 20,
        "ast": 3,
        "reb": 2
      },
      "status": "FINALE"
    },
    {
      "round": 1,
      "gameCode": 11,
      "group": "Group C",
      "homeTeam": "TOFAS BURSA",
      "homeScore": 82,
      "awayTeam": "NINERS CHEMNITZ",
      "awayScore": 69,
      "pace": 75,
      "ortgHome": 110,
      "drtgHome": 108,
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
      "round": 1,
      "gameCode": 12,
      "group": "Group C",
      "homeTeam": "NEPTUNAS KLAIPEDA",
      "homeScore": 73,
      "awayTeam": "DOLOMITI ENERGIA TRENTO",
      "awayScore": 76,
      "pace": 75,
      "ortgHome": 110,
      "drtgHome": 108,
      "topScorerHome": {
        "name": "FRANKE, YANNICK",
        "pts": 13,
        "ast": 3,
        "reb": 5
      },
      "topScorerAway": {
        "name": "OLIVARI, QUINCY",
        "pts": 23,
        "ast": 4,
        "reb": 5
      },
      "status": "FINALE"
    },
    {
      "round": 1,
      "gameCode": 13,
      "group": "Group D",
      "homeTeam": "LIETKABELIS PANEVEZYS",
      "homeScore": 75,
      "awayTeam": "BOSNA BH TELECOM SARAJEVO",
      "awayScore": 72,
      "pace": 75,
      "ortgHome": 110,
      "drtgHome": 108,
      "topScorerHome": {
        "name": "FEVRIER, IVAN",
        "pts": 17,
        "ast": 1,
        "reb": 9
      },
      "topScorerAway": {
        "name": "PERRY, REGINALD",
        "pts": 14,
        "ast": 1,
        "reb": 5
      },
      "status": "FINALE"
    },
    {
      "round": 1,
      "gameCode": 14,
      "group": "Group D",
      "homeTeam": "PAOK THESSALONIKI",
      "homeScore": 93,
      "awayTeam": "KIDS&US MANRESA",
      "awayScore": 78,
      "pace": 75,
      "ortgHome": 110,
      "drtgHome": 108,
      "topScorerHome": {
        "name": "OSMAN, CEDI",
        "pts": 23,
        "ast": 2,
        "reb": 5
      },
      "topScorerAway": {
        "name": "NOTAE, JD",
        "pts": 16,
        "ast": 4,
        "reb": 1
      },
      "status": "FINALE"
    },
    {
      "round": 1,
      "gameCode": 15,
      "group": "Group D",
      "homeTeam": "RATIOPHARM ULM",
      "homeScore": 98,
      "awayTeam": "BALKAN BOTEVGRAD",
      "awayScore": 84,
      "pace": 75,
      "ortgHome": 110,
      "drtgHome": 108,
      "topScorerHome": {
        "name": "WATSON, IBI",
        "pts": 19,
        "ast": 4,
        "reb": 3
      },
      "topScorerAway": {
        "name": "MCCOY, JAVANTE",
        "pts": 32,
        "ast": 4,
        "reb": 2
      },
      "status": "FINALE"
    },
    {
      "round": 1,
      "gameCode": 16,
      "group": "Group D",
      "homeTeam": "BAHCESEHIR COLLEGE ISTANBUL",
      "homeScore": 91,
      "awayTeam": "ROMA BASKETBALL",
      "awayScore": 78,
      "pace": 75,
      "ortgHome": 110,
      "drtgHome": 108,
      "topScorerHome": {
        "name": "REED, MARCQUISE",
        "pts": 15,
        "ast": 2,
        "reb": 4
      },
      "topScorerAway": {
        "name": "MANNION, NICCOLO",
        "pts": 29,
        "ast": 5,
        "reb": 2
      },
      "status": "FINALE"
    }
  ],
  "2": [
    {
      "round": 2,
      "gameCode": 17,
      "group": "Group A",
      "homeTeam": "ARIS THESSALONIKI",
      "homeScore": 93,
      "awayTeam": "RECOLETAS SALUD SAN PABLO BURGOS",
      "awayScore": 80,
      "pace": 75,
      "ortgHome": 110,
      "drtgHome": 108,
      "topScorerHome": {
        "name": "DIMITRIJEVIC, NENO",
        "pts": 21,
        "ast": 6,
        "reb": 2
      },
      "topScorerAway": {
        "name": "AUDIGE, CHASE",
        "pts": 25,
        "ast": 3,
        "reb": 1
      },
      "status": "FINALE"
    },
    {
      "round": 2,
      "gameCode": 18,
      "group": "Group A",
      "homeTeam": "BAGLIETTO DERTHONA TORTONA",
      "homeScore": 89,
      "awayTeam": "LE MANS SARTHE BASKET",
      "awayScore": 83,
      "pace": 75,
      "ortgHome": 110,
      "drtgHome": 108,
      "topScorerHome": {
        "name": "GORHAM, JUSTIN",
        "pts": 22,
        "ast": 2,
        "reb": 8
      },
      "topScorerAway": {
        "name": "WOOD, MOSES",
        "pts": 18,
        "ast": 2,
        "reb": 5
      },
      "status": "FINALE"
    },
    {
      "round": 2,
      "gameCode": 19,
      "group": "Group A",
      "homeTeam": "ROSTOCK SEAWOLVES",
      "homeScore": 87,
      "awayTeam": "RIGA ZELLI",
      "awayScore": 86,
      "pace": 75,
      "ortgHome": 110,
      "drtgHome": 108,
      "topScorerHome": {
        "name": "KLASSEN, OWEN",
        "pts": 14,
        "ast": 0,
        "reb": 12
      },
      "topScorerAway": {
        "name": "PERKINS, TONY",
        "pts": 35,
        "ast": 2,
        "reb": 3
      },
      "status": "FINALE"
    },
    {
      "round": 2,
      "gameCode": 20,
      "group": "Group A",
      "homeTeam": "CEDEVITA OLIMPIJA LJUBLJANA",
      "homeScore": 64,
      "awayTeam": "HAPOEL MIDTOWN JERUSALEM",
      "awayScore": 75,
      "pace": 75,
      "ortgHome": 110,
      "drtgHome": 108,
      "topScorerHome": {
        "name": "KIRKWOOD, NOAH",
        "pts": 17,
        "ast": 0,
        "reb": 3
      },
      "topScorerAway": {
        "name": "MILETIC, DUSAN",
        "pts": 14,
        "ast": 0,
        "reb": 8
      },
      "status": "FINALE"
    },
    {
      "round": 2,
      "gameCode": 21,
      "group": "Group B",
      "homeTeam": "LONDON LIONS",
      "homeScore": 89,
      "awayTeam": "LA LAGUNA TENERIFE",
      "awayScore": 77,
      "pace": 75,
      "ortgHome": 110,
      "drtgHome": 108,
      "topScorerHome": {
        "name": "KENNEDY, THOMAS",
        "pts": 26,
        "ast": 2,
        "reb": 8
      },
      "topScorerAway": {
        "name": "SHERMADINI, GIORGI",
        "pts": 18,
        "ast": 0,
        "reb": 3
      },
      "status": "FINALE"
    },
    {
      "round": 2,
      "gameCode": 22,
      "group": "Group B",
      "homeTeam": "SKYLINERS FRANKFURT",
      "homeScore": 79,
      "awayTeam": "SIAULIAI BASKETBALL",
      "awayScore": 71,
      "pace": 75,
      "ortgHome": 110,
      "drtgHome": 108,
      "topScorerHome": {
        "name": "MINTZ, JUDAH",
        "pts": 16,
        "ast": 2,
        "reb": 1
      },
      "topScorerAway": {
        "name": "MCKNIGHT, DAYVION",
        "pts": 16,
        "ast": 5,
        "reb": 3
      },
      "status": "FINALE"
    },
    {
      "round": 2,
      "gameCode": 23,
      "group": "Group B",
      "homeTeam": "U-BT CLUJ-NAPOCA",
      "homeScore": 98,
      "awayTeam": "UMANA REYER VENICE",
      "awayScore": 92,
      "pace": 75,
      "ortgHome": 110,
      "drtgHome": 108,
      "topScorerHome": {
        "name": "SMART, JAVONTE",
        "pts": 26,
        "ast": 2,
        "reb": 9
      },
      "topScorerAway": {
        "name": "WILTJER, KYLE",
        "pts": 19,
        "ast": 1,
        "reb": 4
      },
      "status": "FINALE"
    },
    {
      "round": 2,
      "gameCode": 24,
      "group": "Group B",
      "homeTeam": "TURK TELEKOM ANKARA",
      "homeScore": 92,
      "awayTeam": "MAXIMA ROMA",
      "awayScore": 77,
      "pace": 75,
      "ortgHome": 110,
      "drtgHome": 108,
      "topScorerHome": {
        "name": "HARDING, JERRICK",
        "pts": 20,
        "ast": 2,
        "reb": 6
      },
      "topScorerAway": {
        "name": "BILAN, MIRO",
        "pts": 14,
        "ast": 1,
        "reb": 9
      },
      "status": "FINALE"
    },
    {
      "round": 2,
      "gameCode": 25,
      "group": "Group C",
      "homeTeam": "DOLOMITI ENERGIA TRENTO",
      "homeScore": 81,
      "awayTeam": "SLASK WROCLAW",
      "awayScore": 94,
      "pace": 75,
      "ortgHome": 110,
      "drtgHome": 108,
      "topScorerHome": {
        "name": "OLIVARI, QUINCY",
        "pts": 17,
        "ast": 5,
        "reb": 7
      },
      "topScorerAway": {
        "name": "PARSONS, MALIK",
        "pts": 17,
        "ast": 1,
        "reb": 4
      },
      "status": "FINALE"
    },
    {
      "round": 2,
      "gameCode": 26,
      "group": "Group C",
      "homeTeam": "NINERS CHEMNITZ",
      "homeScore": 93,
      "awayTeam": "NEPTUNAS KLAIPEDA",
      "awayScore": 84,
      "pace": 75,
      "ortgHome": 110,
      "drtgHome": 108,
      "topScorerHome": {
        "name": "SERIC, MATEO",
        "pts": 17,
        "ast": 1,
        "reb": 1
      },
      "topScorerAway": {
        "name": "DRELL, HENRI",
        "pts": 21,
        "ast": 1,
        "reb": 6
      },
      "status": "FINALE"
    },
    {
      "round": 2,
      "gameCode": 27,
      "group": "Group C",
      "homeTeam": "COSEA JL BOURG-EN-BRESSE",
      "homeScore": 82,
      "awayTeam": "TOFAS BURSA",
      "awayScore": 89,
      "pace": 75,
      "ortgHome": 110,
      "drtgHome": 108,
      "topScorerHome": {
        "name": "MOULARE, ASSEMIAN",
        "pts": 16,
        "ast": 4,
        "reb": 2
      },
      "topScorerAway": {
        "name": "JONES, BRYCE",
        "pts": 18,
        "ast": 8,
        "reb": 6
      },
      "status": "FINALE"
    },
    {
      "round": 2,
      "gameCode": 28,
      "group": "Group C",
      "homeTeam": "BUDUCNOST VOLI PODGORICA",
      "homeScore": 75,
      "awayTeam": "NAPOLI BASKETBALL",
      "awayScore": 93,
      "pace": 75,
      "ortgHome": 110,
      "drtgHome": 108,
      "topScorerHome": {
        "name": "FERRELL, YOGI",
        "pts": 19,
        "ast": 6,
        "reb": 4
      },
      "topScorerAway": {
        "name": "SELJAAS, ZACHARY",
        "pts": 23,
        "ast": 4,
        "reb": 7
      },
      "status": "FINALE"
    },
    {
      "round": 2,
      "gameCode": 29,
      "group": "Group D",
      "homeTeam": "ROMA BASKETBALL",
      "homeScore": 92,
      "awayTeam": "LIETKABELIS PANEVEZYS",
      "awayScore": 87,
      "pace": 75,
      "ortgHome": 110,
      "drtgHome": 108,
      "topScorerHome": {
        "name": "MANNION, NICCOLO",
        "pts": 21,
        "ast": 4,
        "reb": 4
      },
      "topScorerAway": {
        "name": "KENNEDY, KEONDRE",
        "pts": 15,
        "ast": 0,
        "reb": 1
      },
      "status": "FINALE"
    },
    {
      "round": 2,
      "gameCode": 30,
      "group": "Group D",
      "homeTeam": "BALKAN BOTEVGRAD",
      "homeScore": 61,
      "awayTeam": "BAHCESEHIR COLLEGE ISTANBUL",
      "awayScore": 100,
      "pace": 75,
      "ortgHome": 110,
      "drtgHome": 108,
      "topScorerHome": {
        "name": "EDGE, DARNELL",
        "pts": 11,
        "ast": 3,
        "reb": 0
      },
      "topScorerAway": {
        "name": "AVRAMOVIC, ALEKSA",
        "pts": 15,
        "ast": 1,
        "reb": 2
      },
      "status": "FINALE"
    },
    {
      "round": 2,
      "gameCode": 31,
      "group": "Group D",
      "homeTeam": "KIDS&US MANRESA",
      "homeScore": 101,
      "awayTeam": "RATIOPHARM ULM",
      "awayScore": 89,
      "pace": 75,
      "ortgHome": 110,
      "drtgHome": 108,
      "topScorerHome": {
        "name": "ALLEN, TIMMY",
        "pts": 30,
        "ast": 1,
        "reb": 1
      },
      "topScorerAway": {
        "name": "SCHMIDT, DEVIN",
        "pts": 18,
        "ast": 0,
        "reb": 5
      },
      "status": "FINALE"
    },
    {
      "round": 2,
      "gameCode": 32,
      "group": "Group D",
      "homeTeam": "BOSNA BH TELECOM SARAJEVO",
      "homeScore": 72,
      "awayTeam": "PAOK THESSALONIKI",
      "awayScore": 75,
      "pace": 75,
      "ortgHome": 110,
      "drtgHome": 108,
      "topScorerHome": {
        "name": "PIPES JR, SHAWN",
        "pts": 16,
        "ast": 3,
        "reb": 2
      },
      "topScorerAway": {
        "name": "OSMAN, CEDI",
        "pts": 17,
        "ast": 2,
        "reb": 7
      },
      "status": "FINALE"
    }
  ],
  "3": [
    {
      "round": 3,
      "gameCode": 33,
      "group": "Group A",
      "homeTeam": "RECOLETAS SALUD SAN PABLO BURGOS",
      "homeScore": 84,
      "awayTeam": "HAPOEL MIDTOWN JERUSALEM",
      "awayScore": 85,
      "pace": 75,
      "ortgHome": 110,
      "drtgHome": 108,
      "topScorerHome": {
        "name": "TABOADA, JOAQUIN",
        "pts": 20,
        "ast": 0,
        "reb": 1
      },
      "topScorerAway": {
        "name": "LOFTON JR, KENNY",
        "pts": 28,
        "ast": 0,
        "reb": 6
      },
      "status": "FINALE"
    },
    {
      "round": 3,
      "gameCode": 34,
      "group": "Group A",
      "homeTeam": "RIGA ZELLI",
      "homeScore": 89,
      "awayTeam": "CEDEVITA OLIMPIJA LJUBLJANA",
      "awayScore": 79,
      "pace": 75,
      "ortgHome": 110,
      "drtgHome": 108,
      "topScorerHome": {
        "name": "WAHL, TYLER",
        "pts": 21,
        "ast": 2,
        "reb": 7
      },
      "topScorerAway": {
        "name": "COWAN JR, ANTHONY",
        "pts": 23,
        "ast": 3,
        "reb": 3
      },
      "status": "FINALE"
    },
    {
      "round": 3,
      "gameCode": 35,
      "group": "Group A",
      "homeTeam": "LE MANS SARTHE BASKET",
      "homeScore": 82,
      "awayTeam": "ROSTOCK SEAWOLVES",
      "awayScore": 70,
      "pace": 75,
      "ortgHome": 110,
      "drtgHome": 108,
      "topScorerHome": {
        "name": "STEWART JR, CARLOS",
        "pts": 12,
        "ast": 1,
        "reb": 4
      },
      "topScorerAway": {
        "name": "CROCKETT JR, TJ",
        "pts": 22,
        "ast": 1,
        "reb": 4
      },
      "status": "FINALE"
    },
    {
      "round": 3,
      "gameCode": 36,
      "group": "Group A",
      "homeTeam": "ARIS THESSALONIKI",
      "homeScore": 88,
      "awayTeam": "BAGLIETTO DERTHONA TORTONA",
      "awayScore": 68,
      "pace": 75,
      "ortgHome": 110,
      "drtgHome": 108,
      "topScorerHome": {
        "name": "MORGAN, MATTHEW",
        "pts": 23,
        "ast": 3,
        "reb": 4
      },
      "topScorerAway": {
        "name": "MADDOX JR, DANTE",
        "pts": 26,
        "ast": 0,
        "reb": 4
      },
      "status": "FINALE"
    },
    {
      "round": 3,
      "gameCode": 37,
      "group": "Group B",
      "homeTeam": "LA LAGUNA TENERIFE",
      "homeScore": 96,
      "awayTeam": "MAXIMA ROMA",
      "awayScore": 71,
      "pace": 75,
      "ortgHome": 110,
      "drtgHome": 108,
      "topScorerHome": {
        "name": "SHERMADINI, GIORGI",
        "pts": 15,
        "ast": 4,
        "reb": 5
      },
      "topScorerAway": {
        "name": "TYSON, HUNTER",
        "pts": 14,
        "ast": 0,
        "reb": 4
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
      "pace": 75,
      "ortgHome": 110,
      "drtgHome": 108,
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
    },
    {
      "round": 3,
      "gameCode": 39,
      "group": "Group B",
      "homeTeam": "SIAULIAI BASKETBALL",
      "homeScore": 75,
      "awayTeam": "U-BT CLUJ-NAPOCA",
      "awayScore": 94,
      "pace": 75,
      "ortgHome": 110,
      "drtgHome": 108,
      "topScorerHome": {
        "name": "CAFFEY, MICHAEL",
        "pts": 13,
        "ast": 2,
        "reb": 4
      },
      "topScorerAway": {
        "name": "SMART, JAVONTE",
        "pts": 20,
        "ast": 5,
        "reb": 4
      },
      "status": "FINALE"
    },
    {
      "round": 3,
      "gameCode": 40,
      "group": "Group B",
      "homeTeam": "LONDON LIONS",
      "homeScore": 76,
      "awayTeam": "SKYLINERS FRANKFURT",
      "awayScore": 81,
      "pace": 75,
      "ortgHome": 110,
      "drtgHome": 108,
      "topScorerHome": {
        "name": "SCOTT, JOEL",
        "pts": 16,
        "ast": 4,
        "reb": 8
      },
      "topScorerAway": {
        "name": "MINTZ, JUDAH",
        "pts": 20,
        "ast": 2,
        "reb": 2
      },
      "status": "FINALE"
    },
    {
      "round": 3,
      "gameCode": 41,
      "group": "Group C",
      "homeTeam": "SLASK WROCLAW",
      "homeScore": 82,
      "awayTeam": "NAPOLI BASKETBALL",
      "awayScore": 86,
      "pace": 75,
      "ortgHome": 110,
      "drtgHome": 108,
      "topScorerHome": {
        "name": "ROBINSON, DEVIN",
        "pts": 22,
        "ast": 1,
        "reb": 9
      },
      "topScorerAway": {
        "name": "BROWN, MARKEL",
        "pts": 15,
        "ast": 3,
        "reb": 5
      },
      "status": "FINALE"
    },
    {
      "round": 3,
      "gameCode": 42,
      "group": "Group C",
      "homeTeam": "TOFAS BURSA",
      "homeScore": 90,
      "awayTeam": "BUDUCNOST VOLI PODGORICA",
      "awayScore": 85,
      "pace": 75,
      "ortgHome": 110,
      "drtgHome": 108,
      "topScorerHome": {
        "name": "NUTALL, ZACH",
        "pts": 20,
        "ast": 1,
        "reb": 4
      },
      "topScorerAway": {
        "name": "FERRELL, YOGI",
        "pts": 18,
        "ast": 5,
        "reb": 2
      },
      "status": "FINALE"
    },
    {
      "round": 3,
      "gameCode": 43,
      "group": "Group C",
      "homeTeam": "NEPTUNAS KLAIPEDA",
      "homeScore": 93,
      "awayTeam": "COSEA JL BOURG-EN-BRESSE",
      "awayScore": 89,
      "pace": 75,
      "ortgHome": 110,
      "drtgHome": 108,
      "topScorerHome": {
        "name": "FRANKE, YANNICK",
        "pts": 25,
        "ast": 4,
        "reb": 4
      },
      "topScorerAway": {
        "name": "MOULARE, ASSEMIAN",
        "pts": 17,
        "ast": 5,
        "reb": 4
      },
      "status": "FINALE"
    },
    {
      "round": 3,
      "gameCode": 44,
      "group": "Group C",
      "homeTeam": "DOLOMITI ENERGIA TRENTO",
      "homeScore": 80,
      "awayTeam": "NINERS CHEMNITZ",
      "awayScore": 88,
      "pace": 75,
      "ortgHome": 110,
      "drtgHome": 108,
      "topScorerHome": {
        "name": "BROWN II, DARIUS",
        "pts": 21,
        "ast": 9,
        "reb": 4
      },
      "topScorerAway": {
        "name": "WILLIAMS, COBE",
        "pts": 30,
        "ast": 2,
        "reb": 2
      },
      "status": "FINALE"
    },
    {
      "round": 3,
      "gameCode": 45,
      "group": "Group D",
      "homeTeam": "LIETKABELIS PANEVEZYS",
      "homeScore": 95,
      "awayTeam": "PAOK THESSALONIKI",
      "awayScore": 86,
      "pace": 75,
      "ortgHome": 110,
      "drtgHome": 108,
      "topScorerHome": {
        "name": "SCHUMACHER, ALEXANDER",
        "pts": 23,
        "ast": 2,
        "reb": 2
      },
      "topScorerAway": {
        "name": "FOSTER, MARCUS",
        "pts": 21,
        "ast": 0,
        "reb": 3
      },
      "status": "FINALE"
    },
    {
      "round": 3,
      "gameCode": 46,
      "group": "Group D",
      "homeTeam": "RATIOPHARM ULM",
      "homeScore": 102,
      "awayTeam": "BOSNA BH TELECOM SARAJEVO",
      "awayScore": 93,
      "pace": 75,
      "ortgHome": 110,
      "drtgHome": 108,
      "topScorerHome": {
        "name": "SIMS, JAYLEN",
        "pts": 20,
        "ast": 2,
        "reb": 4
      },
      "topScorerAway": {
        "name": "DOMASK, MARCUS",
        "pts": 24,
        "ast": 4,
        "reb": 5
      },
      "status": "FINALE"
    },
    {
      "round": 3,
      "gameCode": 47,
      "group": "Group D",
      "homeTeam": "BAHCESEHIR COLLEGE ISTANBUL",
      "homeScore": 100,
      "awayTeam": "KIDS&US MANRESA",
      "awayScore": 88,
      "pace": 75,
      "ortgHome": 110,
      "drtgHome": 108,
      "topScorerHome": {
        "name": "REED, MARCQUISE",
        "pts": 22,
        "ast": 2,
        "reb": 4
      },
      "topScorerAway": {
        "name": "ALLEN, TIMMY",
        "pts": 21,
        "ast": 3,
        "reb": 3
      },
      "status": "FINALE"
    },
    {
      "round": 3,
      "gameCode": 48,
      "group": "Group D",
      "homeTeam": "ROMA BASKETBALL",
      "homeScore": 77,
      "awayTeam": "BALKAN BOTEVGRAD",
      "awayScore": 72,
      "pace": 75,
      "ortgHome": 110,
      "drtgHome": 108,
      "topScorerHome": {
        "name": "STRAUTINS, ARTURS",
        "pts": 17,
        "ast": 1,
        "reb": 8
      },
      "topScorerAway": {
        "name": "STOIMENOV, ALEKSANDAR",
        "pts": 16,
        "ast": 1,
        "reb": 3
      },
      "status": "FINALE"
    }
  ],
  "4": [
      {
          "round": 4,
          "gameCode": 49,
          "group": "Group A",
          "homeTeam": "BAGLIETTO DERTHONA TORTONA",
          "homeScore": 89,
          "awayTeam": "RECOLETAS SALUD SAN PABLO BURGOS",
          "awayScore": 79,
          "pace": 78,
          "ortgHome": 111,
          "drtgHome": 103,
          "topScorerHome": {
              "name": "BORTOLANI, GIORDANO",
              "pts": 18,
              "ast": 1,
              "reb": 2
          },
          "topScorerAway": {
              "name": "STEWARD, DJ",
              "pts": 22,
              "ast": 4,
              "reb": 3
          },
          "status": "FINALE"
      },
      {
          "round": 4,
          "gameCode": 50,
          "group": "Group A",
          "homeTeam": "ROSTOCK SEAWOLVES",
          "homeScore": 79,
          "awayTeam": "ARIS THESSALONIKI",
          "awayScore": 110,
          "pace": 83,
          "ortgHome": 94,
          "drtgHome": 136,
          "topScorerHome": {
              "name": "WITHERS, TODD",
              "pts": 22,
              "ast": 2,
              "reb": 5
          },
          "topScorerAway": {
              "name": "ROBINSON - EARL, JEREMIAH",
              "pts": 21,
              "ast": 2,
              "reb": 10
          },
          "status": "FINALE"
      },
      {
          "round": 4,
          "gameCode": 51,
          "group": "Group A",
          "homeTeam": "CEDEVITA OLIMPIJA LJUBLJANA",
          "homeScore": 66,
          "awayTeam": "LE MANS SARTHE BASKET",
          "awayScore": 84,
          "pace": 80,
          "ortgHome": 81,
          "drtgHome": 107,
          "topScorerHome": {
              "name": "HURT, MATTHEW",
              "pts": 12,
              "ast": 0,
              "reb": 0
          },
          "topScorerAway": {
              "name": "DUFEAL, LUCAS",
              "pts": 16,
              "ast": 0,
              "reb": 4
          },
          "status": "FINALE"
      },
      {
          "round": 4,
          "gameCode": 52,
          "group": "Group A",
          "homeTeam": "HAPOEL MIDTOWN JERUSALEM",
          "homeScore": 100,
          "awayTeam": "RIGA ZELLI",
          "awayScore": 64,
          "pace": 77,
          "ortgHome": 127,
          "drtgHome": 84,
          "topScorerHome": {
              "name": "LOFTON JR, KENNY",
              "pts": 18,
              "ast": 4,
              "reb": 5
          },
          "topScorerAway": {
              "name": "SULCS, ROLANDS",
              "pts": 12,
              "ast": 1,
              "reb": 0
          },
          "status": "FINALE"
      },
      {
          "round": 4,
          "gameCode": 53,
          "group": "Group B",
          "homeTeam": "SKYLINERS FRANKFURT",
          "homeScore": 94,
          "awayTeam": "LA LAGUNA TENERIFE",
          "awayScore": 104,
          "pace": 78,
          "ortgHome": 127,
          "drtgHome": 127,
          "topScorerHome": {
              "name": "MINTZ, JUDAH",
              "pts": 20,
              "ast": 5,
              "reb": 0
          },
          "topScorerAway": {
              "name": "GUY, KYLE",
              "pts": 26,
              "ast": 6,
              "reb": 1
          },
          "status": "FINALE"
      },
      {
          "round": 4,
          "gameCode": 54,
          "group": "Group B",
          "homeTeam": "U-BT CLUJ-NAPOCA",
          "homeScore": 72,
          "awayTeam": "LONDON LIONS",
          "awayScore": 89,
          "pace": 82,
          "ortgHome": 91,
          "drtgHome": 105,
          "topScorerHome": {
              "name": "SMART, JAVONTE",
              "pts": 14,
              "ast": 5,
              "reb": 3
          },
          "topScorerAway": {
              "name": "KENNEDY, THOMAS",
              "pts": 16,
              "ast": 0,
              "reb": 2
          },
          "status": "FINALE"
      },
      {
          "round": 4,
          "gameCode": 55,
          "group": "Group B",
          "homeTeam": "TURK TELEKOM ANKARA",
          "homeScore": 84,
          "awayTeam": "SIAULIAI BASKETBALL",
          "awayScore": 94,
          "pace": 81,
          "ortgHome": 100,
          "drtgHome": 120,
          "topScorerHome": {
              "name": "SCHNEIDER, TIM",
              "pts": 16,
              "ast": 0,
              "reb": 6
          },
          "topScorerAway": {
              "name": "HENDERSON JR, CEDRIC",
              "pts": 16,
              "ast": 0,
              "reb": 1
          },
          "status": "FINALE"
      },
      {
          "round": 4,
          "gameCode": 56,
          "group": "Group B",
          "homeTeam": "MAXIMA ROMA",
          "homeScore": 90,
          "awayTeam": "UMANA REYER VENICE",
          "awayScore": 79,
          "pace": 77,
          "ortgHome": 120,
          "drtgHome": 101,
          "topScorerHome": {
              "name": "BILAN, MIRO",
              "pts": 22,
              "ast": 2,
              "reb": 8
          },
          "topScorerAway": {
              "name": "WATSON, GLYNN",
              "pts": 20,
              "ast": 4,
              "reb": 1
          },
          "status": "FINALE"
      },
      {
          "round": 4,
          "gameCode": 57,
          "group": "Group C",
          "homeTeam": "NINERS CHEMNITZ",
          "homeScore": 95,
          "awayTeam": "SLASK WROCLAW",
          "awayScore": 67,
          "pace": 78,
          "ortgHome": 125,
          "drtgHome": 84,
          "topScorerHome": {
              "name": "WILLIAMS, COBE",
              "pts": 21,
              "ast": 5,
              "reb": 0
          },
          "topScorerAway": {
              "name": "ROBINSON, DEVIN",
              "pts": 17,
              "ast": 2,
              "reb": 5
          },
          "status": "FINALE"
      },
      {
          "round": 4,
          "gameCode": 58,
          "group": "Group C",
          "homeTeam": "COSEA JL BOURG-EN-BRESSE",
          "homeScore": 90,
          "awayTeam": "DOLOMITI ENERGIA TRENTO",
          "awayScore": 79,
          "pace": 75,
          "ortgHome": 119,
          "drtgHome": 106,
          "topScorerHome": {
              "name": "GAUDOUX, LIONEL",
              "pts": 20,
              "ast": 2,
              "reb": 7
          },
          "topScorerAway": {
              "name": "BAYEHE, JORDAN",
              "pts": 15,
              "ast": 1,
              "reb": 3
          },
          "status": "FINALE"
      },
      {
          "round": 4,
          "gameCode": 59,
          "group": "Group C",
          "homeTeam": "BUDUCNOST VOLI PODGORICA",
          "homeScore": 104,
          "awayTeam": "NEPTUNAS KLAIPEDA",
          "awayScore": 89,
          "pace": 79,
          "ortgHome": 135,
          "drtgHome": 110,
          "topScorerHome": {
              "name": "FERRELL, YOGI",
              "pts": 21,
              "ast": 6,
              "reb": 5
          },
          "topScorerAway": {
              "name": "TAROLIS, DONATAS",
              "pts": 22,
              "ast": 1,
              "reb": 9
          },
          "status": "FINALE"
      },
      {
          "round": 4,
          "gameCode": 60,
          "group": "Group C",
          "homeTeam": "NAPOLI BASKETBALL",
          "homeScore": 105,
          "awayTeam": "TOFAS BURSA",
          "awayScore": 101,
          "pace": 89,
          "ortgHome": 117,
          "drtgHome": 114,
          "topScorerHome": {
              "name": "SELJAAS, ZACHARY",
              "pts": 28,
              "ast": 2,
              "reb": 6
          },
          "topScorerAway": {
              "name": "JONES, BRYCE",
              "pts": 32,
              "ast": 2,
              "reb": 4
          },
          "status": "FINALE"
      },
      {
          "round": 4,
          "gameCode": 61,
          "group": "Group D",
          "homeTeam": "BALKAN BOTEVGRAD",
          "homeScore": 57,
          "awayTeam": "LIETKABELIS PANEVEZYS",
          "awayScore": 64,
          "pace": 71,
          "ortgHome": 80,
          "drtgHome": 91,
          "topScorerHome": {
              "name": "STOIMENOV, ALEKSANDAR",
              "pts": 17,
              "ast": 4,
              "reb": 3
          },
          "topScorerAway": {
              "name": "FEVRIER, IVAN",
              "pts": 17,
              "ast": 0,
              "reb": 8
          },
          "status": "FINALE"
      },
      {
          "round": 4,
          "gameCode": 62,
          "group": "Group D",
          "homeTeam": "KIDS&US MANRESA",
          "homeScore": 108,
          "awayTeam": "ROMA BASKETBALL",
          "awayScore": 88,
          "pace": 83,
          "ortgHome": 130,
          "drtgHome": 106,
          "topScorerHome": {
              "name": "BENITEZ, HUGO",
              "pts": 24,
              "ast": 7,
              "reb": 5
          },
          "topScorerAway": {
              "name": "MANNION, NICCOLO",
              "pts": 21,
              "ast": 7,
              "reb": 1
          },
          "status": "FINALE"
      },
      {
          "round": 4,
          "gameCode": 63,
          "group": "Group D",
          "homeTeam": "BOSNA BH TELECOM SARAJEVO",
          "homeScore": 86,
          "awayTeam": "BAHCESEHIR COLLEGE ISTANBUL",
          "awayScore": 77,
          "pace": 79,
          "ortgHome": 109,
          "drtgHome": 98,
          "topScorerHome": {
              "name": "PIPES JR, SHAWN",
              "pts": 18,
              "ast": 0,
              "reb": 2
          },
          "topScorerAway": {
              "name": "PONITKA, MATEUSZ",
              "pts": 20,
              "ast": 2,
              "reb": 3
          },
          "status": "FINALE"
      },
      {
          "round": 4,
          "gameCode": 64,
          "group": "Group D",
          "homeTeam": "PAOK THESSALONIKI",
          "homeScore": 87,
          "awayTeam": "RATIOPHARM ULM",
          "awayScore": 78,
          "pace": 85,
          "ortgHome": 104,
          "drtgHome": 91,
          "topScorerHome": {
              "name": "OSMAN, CEDI",
              "pts": 21,
              "ast": 1,
              "reb": 4
          },
          "topScorerAway": {
              "name": "SIMS, JAYLEN",
              "pts": 17,
              "ast": 3,
              "reb": 3
          },
          "status": "FINALE"
      }
  ]
};

export const EUROCUP_GROUPS = {
  groupA: [
  "LE MANS SARTHE BASKET",
  "HAPOEL MIDTOWN JERUSALEM",
  "RECOLETAS SALUD SAN PABLO BURGOS",
  "CEDEVITA OLIMPIJA LJUBLJANA",
  "BAGLIETTO DERTHONA TORTONA",
  "ARIS THESSALONIKI",
  "ROSTOCK SEAWOLVES",
  "RIGA ZELLI"
],
  groupB: [
  "TURK TELEKOM ANKARA",
  "U-BT CLUJ-NAPOCA",
  "LA LAGUNA TENERIFE",
  "UMANA REYER VENICE",
  "MAXIMA ROMA",
  "SIAULIAI BASKETBALL",
  "LONDON LIONS",
  "SKYLINERS FRANKFURT"
],
  groupC: [
  "COSEA JL BOURG-EN-BRESSE",
  "TOFAS BURSA",
  "BUDUCNOST VOLI PODGORICA",
  "DOLOMITI ENERGIA TRENTO",
  "NAPOLI BASKETBALL",
  "NEPTUNAS KLAIPEDA",
  "NINERS CHEMNITZ",
  "SLASK WROCLAW"
],
  groupD: [
  "BOSNA BH TELECOM SARAJEVO",
  "BAHCESEHIR COLLEGE ISTANBUL",
  "KIDS&US MANRESA",
  "RATIOPHARM ULM",
  "ROMA BASKETBALL",
  "LIETKABELIS PANEVEZYS",
  "PAOK THESSALONIKI",
  "BALKAN BOTEVGRAD"
],
};

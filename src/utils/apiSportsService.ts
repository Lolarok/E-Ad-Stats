/**
 * Integrazione con API-Sports Basketball (https://api-sports.io/sports/basketball)
 * Offre 100 chiamate/giorno gratuite per EuroLeague, EuroCup e LBA Serie A (Stagione 2026/27).
 */

export interface ApiSportsStatusResponse {
  configured: boolean;
  active: boolean;
  account?: string;
  requestsRemaining?: number;
  requestsLimit?: number;
  message: string;
}

export const API_SPORTS_LEAGUES = {
  EUROLEAGUE: 120,
  EUROCUP: 121,
  LBA_SERIE_A: 52,
};

export async function checkApiSportsStatus(): Promise<ApiSportsStatusResponse> {
  const apiKey = (process.env.API_SPORTS_KEY || process.env.BASKETBALL_API_KEY || 'c1c92407f99635a0e8c2879ac8c2172f').trim();

  if (!apiKey) {
    return {
      configured: false,
      active: false,
      message: 'API-Sports Key non configurata in variabili d\'ambiente (attiva motore 2026/27 interno). Per attivare API-Sports 100 chiamate/giorno: aggiungi API_SPORTS_KEY.',
    };
  }

  try {
    const res = await fetch('https://v1.basketball.api-sports.io/status', {
      headers: {
        'x-apisports-key': apiKey.trim(),
      },
    });

    if (!res.ok) {
      return {
        configured: true,
        active: false,
        message: `Errore HTTP ${res.status} da API-Sports.`,
      };
    }

    const data = await res.json();
    if (data.errors && Object.keys(data.errors).length > 0) {
      return {
        configured: true,
        active: false,
        message: Object.values(data.errors).join(', '),
      };
    }

    const account = data.response?.account?.firstname || 'Utente API-Sports';
    const limit = data.response?.requests?.limit_day || 100;
    const current = data.response?.requests?.current || 0;
    const remaining = Math.max(0, limit - current);

    return {
      configured: true,
      active: true,
      account,
      requestsLimit: limit,
      requestsRemaining: remaining,
      message: `API-Sports collegata! Rimaste ${remaining}/${limit} chiamate oggi per la stagione 2026/27.`,
    };
  } catch (err: any) {
    return {
      configured: true,
      active: false,
      message: `Impossibile contattare api-sports.io: ${err.message}`,
    };
  }
}

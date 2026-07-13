export interface ExchangeRates {
  usdTry: number;
  eurTry: number;
  updatedAt: string;
  source: "live" | "mock";
}

const CACHE_TTL_MS = 60 * 60 * 1000;
let cache: { data: ExchangeRates; expiresAt: number } | null = null;

function buildMockRates(): ExchangeRates {
  return {
    usdTry: 34.42,
    eurTry: 37.15,
    updatedAt: new Date().toISOString(),
    source: "mock",
  };
}

async function fetchLiveRates(): Promise<ExchangeRates> {
  const response = await fetch("https://api.frankfurter.app/latest?from=TRY&to=USD,EUR", {
    signal: AbortSignal.timeout(6000),
  });
  if (!response.ok) throw new Error(`exchange rate upstream ${response.status}`);
  const data = await response.json();
  const usdPerTry = data.rates.USD as number;
  const eurPerTry = data.rates.EUR as number;

  return {
    usdTry: Math.round((1 / usdPerTry) * 100) / 100,
    eurTry: Math.round((1 / eurPerTry) * 100) / 100,
    updatedAt: new Date().toISOString(),
    source: "live",
  };
}

/** Sonuç 1 saat boyunca process içi bellekte önbelleğe alınır. */
export async function getExchangeRates(): Promise<ExchangeRates> {
  if (cache && cache.expiresAt > Date.now()) {
    return cache.data;
  }

  try {
    const data = await fetchLiveRates();
    cache = { data, expiresAt: Date.now() + CACHE_TTL_MS };
    return data;
  } catch {
    const mock = buildMockRates();
    cache = { data: mock, expiresAt: Date.now() + CACHE_TTL_MS };
    return mock;
  }
}

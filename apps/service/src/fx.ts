// Frankfurter (ECB-based) does not carry NGN — it only covers the ~30
// currencies the European Central Bank itself publishes. fawazahmed0's
// currency-api covers 200+ currencies including NGN, is free, keyless,
// and ships a documented CDN fallback chain, which is why it's used here
// instead. Source: https://github.com/fawazahmed0/exchange-api
const PRIMARY = "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/ngn/usd.json";
const FALLBACK = "https://latest.currency-api.pages.dev/v1/currencies/ngn/usd.json";

let cached: { rate: number; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour — this is a donation flow, not a trading desk

async function fetchRate(url: string): Promise<number> {
  const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
  if (!res.ok) throw new Error(`FX source responded ${res.status}`);
  const data = (await res.json()) as { ngn: { usd: number } };
  return data.ngn.usd;
}

export async function ngnToUsdRate(): Promise<number> {
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.rate;
  }

  try {
    const rate = await fetchRate(PRIMARY);
    cached = { rate, fetchedAt: Date.now() };
    return rate;
  } catch {
    try {
      const rate = await fetchRate(FALLBACK);
      cached = { rate, fetchedAt: Date.now() };
      return rate;
    } catch {
      if (cached) return cached.rate; // stale beats broken for a tip flow
      throw new Error("NGN/USD rate unavailable from both primary and fallback sources");
    }
  }
}

export async function ngnToUsd(ngn: number): Promise<number> {
  const rate = await ngnToUsdRate();
  return Math.round(ngn * rate * 100) / 100;
}

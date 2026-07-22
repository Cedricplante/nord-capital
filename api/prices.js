// Cryptos à fetcher via CoinGecko (Yahoo Finance les gère mal)
// Source unique : api/_lib/valuation.js — partagée avec snapshot.js et
// monthly-report.js pour que le dashboard live et les calculs cron ne
// puissent jamais lister des cryptos différentes.
import { COINGECKO_MAP } from './_lib/valuation.js';

async function fetchCoinGecko(symbols) {
  const prices = {};
  const ids = [...new Set(symbols.map(s => COINGECKO_MAP[s]).filter(Boolean))];
  if (!ids.length) return prices;
  try {
    const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(',')}&vs_currencies=usd`);
    const data = await res.json();
    for (const sym of symbols) {
      const id = COINGECKO_MAP[sym];
      if (id && data[id]?.usd) prices[sym] = data[id].usd;
    }
  } catch(e) {
    console.error('[prices] CoinGecko error:', e.message);
  }
  return prices;
}

async function fetchYahooSingle(symbol, detail = false) {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/json',
    'Referer': 'https://finance.yahoo.com',
  };

  try {
    const url = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
    const r = await fetch(url, { headers });
    const data = await r.json();
    const meta = data?.chart?.result?.[0]?.meta;
    const price = meta?.regularMarketPrice;
    if (price && price > 0) {
      if (detail) return {
        price,
        changePct: meta?.regularMarketChangePercent ?? null,
        name: meta?.shortName ?? symbol,
        high52: meta?.fiftyTwoWeekHigh ?? null,
        low52: meta?.fiftyTwoWeekLow ?? null,
        volume: meta?.regularMarketVolume ?? null,
      };
      return price;
    }
  } catch(e) {}

  try {
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbol)}&fields=regularMarketPrice,regularMarketChangePercent,shortName,fiftyTwoWeekHigh,fiftyTwoWeekLow,regularMarketVolume`;
    const r = await fetch(url, { headers });
    const data = await r.json();
    const q = data?.quoteResponse?.result?.[0];
    const price = q?.regularMarketPrice;
    if (price && price > 0) {
      if (detail) return {
        price,
        changePct: q?.regularMarketChangePercent ?? null,
        name: q?.shortName ?? symbol,
        high52: q?.fiftyTwoWeekHigh ?? null,
        low52: q?.fiftyTwoWeekLow ?? null,
        volume: q?.regularMarketVolume ?? null,
      };
      return price;
    }
  } catch(e) {}

  return null;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { symbols, detail } = req.query;
  const isDetail = detail === '1';
  
  if (!symbols) { res.status(200).json({}); return; }

  const symbolList = symbols.split(',').map(s => s.trim()).filter(Boolean);
  if (!symbolList.length) { res.status(200).json({}); return; }

  const cgSymbols = symbolList.filter(s => COINGECKO_MAP[s]);
  const yahooSymbols = symbolList.filter(s => !COINGECKO_MAP[s]);
  
  const prices = {};

  try {
    const [cgPrices] = await Promise.all([
      cgSymbols.length ? fetchCoinGecko(cgSymbols) : {},
    ]);
    // CoinGecko: wrap en detail si besoin
    for (const [sym, price] of Object.entries(cgPrices)) {
      prices[sym] = isDetail ? { price, changePct: null, name: sym } : price;
    }

    await Promise.all(yahooSymbols.map(async (symbol) => {
      const result = await fetchYahooSingle(symbol, isDetail);
      if (result !== null) prices[symbol] = result;
    }));

    const fetched = Object.keys(prices).length;
    const missing = symbolList.filter(s => !prices[s]);
    console.log(`[prices] ${fetched}/${symbolList.length} fetched.${missing.length ? ' Missing: ' + missing.join(', ') : ''}`);
  } catch (e) {
    console.error('[prices] Fatal:', e.message);
  }

  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=30');
  res.status(200).json(prices);
}

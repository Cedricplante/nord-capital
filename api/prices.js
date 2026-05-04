// ─── SOURCES ──────────────────────────────────────────────────────
// CoinGecko : cryptos que Yahoo Finance gère mal
const COINGECKO_MAP = {
  'TAO-USD':  'bittensor',
  'RNDR-USD': 'render-token',
  'AKT-USD':  'akash-network',
  'PYTH-USD': 'pyth-network',
  'RSR-USD':  'reserve-rights-token',
};

// ─── COINGECKO ────────────────────────────────────────────────────
async function fetchCoinGecko(symbols) {
  const prices = {};
  const ids = [...new Set(symbols.map(s => COINGECKO_MAP[s]).filter(Boolean))];
  if (!ids.length) return prices;
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(',')}&vs_currencies=usd`,
      { headers: { 'Accept': 'application/json' } }
    );
    if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
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

// ─── YAHOO FINANCE ────────────────────────────────────────────────
// Yahoo bloque parfois les requêtes sans crumb/cookie — on essaie deux endpoints
async function fetchYahooSingle(symbol) {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'application/json',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://finance.yahoo.com',
    'Origin': 'https://finance.yahoo.com',
  };

  // Endpoint 1 : v8/finance/chart (le plus stable)
  try {
    const url = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d&includePrePost=false`;
    const r = await fetch(url, { headers });
    if (r.ok) {
      const data = await r.json();
      const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice;
      if (price && price > 0) return price;
    }
  } catch(e) {}

  // Endpoint 2 : v7/finance/quote (fallback)
  try {
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbol)}&fields=regularMarketPrice`;
    const r = await fetch(url, { headers });
    if (r.ok) {
      const data = await r.json();
      const price = data?.quoteResponse?.result?.[0]?.regularMarketPrice;
      if (price && price > 0) return price;
    }
  } catch(e) {}

  return null;
}

// ─── HANDLER ──────────────────────────────────────────────────────
export default async function handler(req, res) {
  // CORS preflight
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { symbols } = req.query;
  if (!symbols) return res.status(400).json({ error: 'No symbols' });

  const symbolList = symbols.split(',').map(s => s.trim()).filter(Boolean);
  if (!symbolList.length) return res.status(400).json({ error: 'Empty symbols' });

  const cgSymbols    = symbolList.filter(s =>  COINGECKO_MAP[s]);
  const yahooSymbols = symbolList.filter(s => !COINGECKO_MAP[s]);

  const prices = {};

  // Fetcher CoinGecko + Yahoo en parallèle
  const [cgPrices, ...yahooPrices] = await Promise.all([
    cgSymbols.length ? fetchCoinGecko(cgSymbols) : {},
    ...yahooSymbols.map(async (symbol) => {
      const price = await fetchYahooSingle(symbol);
      return { symbol, price };
    }),
  ]);

  Object.assign(prices, cgPrices);
  for (const { symbol, price } of yahooPrices) {
    if (price !== null) prices[symbol] = price;
  }

  // Log pour debug dans les Vercel Function Logs
  const fetched = Object.keys(prices).length;
  const missing = symbolList.filter(s => !prices[s]);
  console.log(`[prices] ${fetched}/${symbolList.length} fetched.${missing.length ? ' Missing: ' + missing.join(', ') : ''}`);

  // Cache 60s sur le CDN Vercel, stale-while-revalidate 30s
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=30');
  res.status(200).json(prices);
}

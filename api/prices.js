// Cryptos à fetcher via CoinGecko (Yahoo Finance les gère mal)
const COINGECKO_MAP = {
  'TAO-USD': 'bittensor',
  'RNDR-USD': 'render-token',
  'AKT-USD': 'akash-network',
  'PYTH-USD': 'pyth-network',
  'RSR-USD': 'reserve-rights-token',
};

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

async function fetchYahooSingle(symbol) {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/json',
    'Referer': 'https://finance.yahoo.com',
  };

  try {
    const url = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
    const r = await fetch(url, { headers });
    const data = await r.json();
    const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice;
    if (price && price > 0) return price;
  } catch(e) {}

  try {
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbol)}&fields=regularMarketPrice`;
    const r = await fetch(url, { headers });
    const data = await r.json();
    const price = data?.quoteResponse?.result?.[0]?.regularMarketPrice;
    if (price && price > 0) return price;
  } catch(e) {}

  return null;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { symbols } = req.query;
  
  // Pas de symbols → retourner objet vide (pas 400 pour éviter les erreurs côté client)
  if (!symbols) {
    res.status(200).json({});
    return;
  }

  const symbolList = symbols.split(',').map(s => s.trim()).filter(Boolean);
  
  if (!symbolList.length) {
    res.status(200).json({});
    return;
  }

  const cgSymbols = symbolList.filter(s => COINGECKO_MAP[s]);
  const yahooSymbols = symbolList.filter(s => !COINGECKO_MAP[s]);
  
  const prices = {};

  try {
    const [cgPrices] = await Promise.all([
      cgSymbols.length ? fetchCoinGecko(cgSymbols) : {},
    ]);
    Object.assign(prices, cgPrices);

    await Promise.all(yahooSymbols.map(async (symbol) => {
      const price = await fetchYahooSingle(symbol);
      if (price !== null) prices[symbol] = price;
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

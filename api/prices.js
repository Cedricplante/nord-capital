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
  } catch(e) {}
  return prices;
}

export default async function handler(req, res) {
  const { symbols } = req.query;
  if (!symbols) return res.status(400).json({ error: 'No symbols' });

  const symbolList = symbols.split(',').map(s => s.trim()).filter(Boolean);
  
  // Séparer selon la source
  const cgSymbols = symbolList.filter(s => COINGECKO_MAP[s]);
  const yahooSymbols = symbolList.filter(s => !COINGECKO_MAP[s]);
  
  const prices = {};

  // Fetcher en parallèle
  const [cgPrices] = await Promise.all([
    cgSymbols.length ? fetchCoinGecko(cgSymbols) : {},
  ]);
  Object.assign(prices, cgPrices);

  // Yahoo pour le reste
  await Promise.all(yahooSymbols.map(async (symbol) => {
    try {
      const url = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
      const r = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
          'Referer': 'https://finance.yahoo.com',
        }
      });
      const data = await r.json();
      const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice;
      if (price && price > 0) prices[symbol] = price;
    } catch(e) {}
  }));

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=60');
  res.status(200).json(prices);
}

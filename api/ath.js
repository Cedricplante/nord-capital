// API endpoint dédié au sommet historique (ATH) d'un actif
// Usage: /api/ath?symbol=TQQQ
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: 'No symbol' });

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'application/json',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://finance.yahoo.com',
    'Origin': 'https://finance.yahoo.com',
  };

  try {
    // Range max + interval mensuel pour limiter la taille de la réponse
    const url = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1mo&range=max`;
    const r = await fetch(url, { headers });
    if (!r.ok) throw new Error(`Yahoo ${r.status}`);
    const data = await r.json();
    const result = data?.chart?.result?.[0];
    const highs = result?.indicators?.quote?.[0]?.high || [];
    const timestamps = result?.timestamp || [];
    
    let athValue = 0;
    let athDate = null;
    for (let i = 0; i < highs.length; i++) {
      const h = highs[i];
      if (h && h > 0 && h > athValue) {
        athValue = h;
        athDate = timestamps[i] ? new Date(timestamps[i] * 1000).toISOString().split('T')[0] : null;
      }
    }
    
    if (athValue === 0) {
      return res.status(404).json({ error: 'No ATH data found' });
    }
    
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=600');
    res.status(200).json({ symbol, ath: athValue, ath_date: athDate });
  } catch (e) {
    console.error('[ath] error:', e.message);
    res.status(500).json({ error: e.message });
  }
}

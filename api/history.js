// ============================================================
// api/history.js — Prix historiques Yahoo Finance
// Usage : /api/history?symbol=SPY&range=1mo
// Ranges valides : 5d, 1mo, 3mo, ytd, 1y, 2y, 5y
// Retourne : [{date: "YYYY-MM-DD", close: number}]
// ============================================================

export default async function handler(req, res) {
  const symbol = (req.query.symbol || 'SPY').toUpperCase();
  const range  = req.query.range  || '1y';

  const VALID_RANGES = new Set(['5d','1mo','3mo','6mo','ytd','1y','2y','5y','max']);
  if (!VALID_RANGES.has(range)) {
    return res.status(400).json({ error: 'Invalid range' });
  }

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/json',
    'Referer': 'https://finance.yahoo.com',
  };

  try {
    const url = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=${range}`;
    const r = await fetch(url, { headers });
    if (!r.ok) throw new Error(`Yahoo ${r.status}`);
    const data = await r.json();

    const result = data?.chart?.result?.[0];
    if (!result) return res.status(200).json([]);

    const timestamps = result.timestamp || [];
    const closes     = result.indicators?.quote?.[0]?.close || [];

    const prices = timestamps
      .map((ts, i) => ({
        date:  new Date(ts * 1000).toISOString().split('T')[0],
        close: closes[i],
      }))
      .filter(p => p.close !== null && p.close !== undefined && p.close > 0);

    // Cache 1h côté Vercel CDN
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=600');
    res.status(200).json(prices);
  } catch (e) {
    console.error('[history] Erreur:', e.message);
    res.status(500).json({ error: e.message });
  }
}

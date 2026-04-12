export default async function handler(req, res) {
  const { symbols } = req.query;
  if (!symbols) return res.status(400).json({ error: 'No symbols' });
  
  const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbols)}&fields=regularMarketPrice`;
  
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const data = await response.json();
    const quotes = data?.quoteResponse?.result || [];
    const prices = {};
    quotes.forEach(q => { prices[q.symbol] = q.regularMarketPrice; });
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json(prices);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
}

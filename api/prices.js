export default async function handler(req, res) {
  const { symbols } = req.query;
  if (!symbols) return res.status(400).json({ error: 'No symbols' });
  
  const symbolList = symbols.split(',');
  const prices = {};
  
  try {
    await Promise.all(symbolList.map(async (symbol) => {
      const url = `https://query2.finance.yahoo.com/v8/finance/chart/${symbol.trim()}?interval=1d&range=1d`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': '*/*',
          'Referer': 'https://finance.yahoo.com'
        }
      });
      const data = await response.json();
      const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice;
      if (price) prices[symbol.trim()] = price;
    }));
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json(prices);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
}

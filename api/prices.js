export default async function handler(req, res) {
  const { symbols } = req.query;
  if (!symbols) return res.status(400).json({ error: 'No symbols' });

  const API_KEY = 'be911aeb43d14751898310faa83079ef';
  const symbolList = symbols.split(',').map(s => s.trim());
  const prices = {};

  try {
    await Promise.all(symbolList.map(async (symbol) => {
      const url = `https://api.twelvedata.com/price?symbol=${symbol}&apikey=${API_KEY}`;
      const res2 = await fetch(url);
      const data = await res2.json();
      if (data.price) prices[symbol] = parseFloat(data.price);
    }));

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json(prices);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
}

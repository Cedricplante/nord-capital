// ============================================================
// api/snapshot.js — Vercel Cron Job
// Schedule : 0 20 * * 1-5  (20h UTC = 22h heure de Montréal, lun-ven)
// Rôle     : snapshot quotidien automatique du portfolio
//            lit user_data Supabase → prix live (batch Yahoo + CoinGecko)
//            → upsert portfolio_history
//
// OPTIMISATION : prix fetchés directement ici (batch Yahoo + CoinGecko)
// au lieu de passer par /api/prices, pour rester sous les 10s du plan Hobby.
//
// Env vars Vercel requises :
//   SUPABASE_URL          ex. https://spgcwvmehcixchtsfuaf.supabase.co
//   SUPABASE_SERVICE_KEY  clé service_role (bypass RLS) — ⚠ jamais exposée côté client
//   SUPABASE_USER_ID      UUID Cédric : 871afd38-3c0b-4554-9ed1-a38a2ca966ff
// ============================================================

// Mapping symboles internes → tickers Yahoo Finance
const SYMBOL_MAP = {
  'BTC/USD': 'BTC-USD',    'ETH/USD': 'ETH-USD',    'SOL/USD': 'SOL-USD',
  'BNB/USD': 'BNB-USD',    'XRP/USD': 'XRP-USD',    'ADA/USD': 'ADA-USD',
  'AVAX/USD':'AVAX-USD',   'DOGE/USD':'DOGE-USD',   'MATIC/USD':'MATIC-USD',
  'TAO/USD': 'TAO-USD',    'RNDR/USD':'RNDR-USD',   'AKT/USD': 'AKT-USD',
  'PYTH/USD':'PYTH-USD',   'RSR/USD': 'RSR-USD',
  'AKASH/USD': 'AKT-USD',
  'FET/USD':  'FET-USD',   'ONDO/USD': 'ONDO-USD',  'INJ/USD':  'INJ-USD',
  'RENDER/USD':'RNDR-USD', 'LINK/USD': 'LINK-USD',  'DOT/USD':  'DOT-USD',
  'EUR/USD': 'EURUSD=X',  'GBP/USD': 'GBPUSD=X',  'USD/JPY': 'USDJPY=X',
  'USD/CAD': 'USDCAD=X',  'AUD/USD': 'AUDUSD=X',
  'XAU/USD': 'GC=F',      'XAG/USD': 'SI=F',       'WTI': 'CL=F',
};

// Cryptos à fetcher via CoinGecko
const COINGECKO_MAP = {
  'TAO-USD':    'bittensor',
  'RNDR-USD':   'render-token',
  'AKT-USD':    'akash-network',
  'PYTH-USD':   'pyth-network',
  'RSR-USD':    'reserve-rights-token',
  'AERO-USD':   'aerodrome-finance',
  'PENDLE-USD': 'pendle',
  'JUP-USD':    'jupiter-exchange-solana',
  'ENA-USD':    'ethena',
  'NOT-USD':    'notcoin',
  'MEW-USD':    'cat-in-a-dogs-world',
  'TIA-USD':    'celestia',
  'STX-USD':    'blockstack',
  'POL-USD':    'matic-network',
};

function getYahooTicker(symbol) {
  if (SYMBOL_MAP[symbol]) return SYMBOL_MAP[symbol];
  const upper = symbol.toUpperCase();
  if (SYMBOL_MAP[upper]) return SYMBOL_MAP[upper];
  if (upper.includes('/')) return upper.replace('/', '-');
  return upper;
}

// ── Supabase helpers ─────────────────────────────────────────
const SUPA_URL     = (process.env.SUPABASE_URL || 'https://spgcwvmehcixchtsfuaf.supabase.co').replace(/\/$/, '');
const SUPA_KEY     = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || '';
const SUPA_USER_ID = process.env.SUPABASE_USER_ID || '871afd38-3c0b-4554-9ed1-a38a2ca966ff';

function supabaseHeaders() {
  return {
    'apikey':        SUPA_KEY,
    'Authorization': `Bearer ${SUPA_KEY}`,
    'Content-Type':  'application/json',
  };
}

async function fetchUserData() {
  const url = `${SUPA_URL}/rest/v1/user_data?user_id=eq.${SUPA_USER_ID}&select=positions,cash,currency&limit=1`;
  const res = await fetch(url, { headers: supabaseHeaders() });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`user_data fetch failed (${res.status}): ${text}`);
  }
  const rows = await res.json();
  return rows.length ? rows[0] : null;
}

async function upsertPortfolioHistory(date, value, currency) {
  const url = `${SUPA_URL}/rest/v1/portfolio_history?on_conflict=user_id,date`;
  const payload = JSON.stringify({
    user_id:  SUPA_USER_ID,
    date,
    value:    Math.round(value * 100) / 100,
    currency: currency || 'CAD',
  });
  const res = await fetch(url, {
    method:  'POST',
    headers: { ...supabaseHeaders(), 'Prefer': 'resolution=merge-duplicates,return=minimal' },
    body:    payload,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`portfolio_history upsert failed (${res.status}): ${text}`);
  }
}

// ── Prix en BATCH ─────────────────────────────────────────────
// Yahoo Finance: une seule requête pour tous les symboles Yahoo
async function fetchYahooBatch(tickers) {
  if (!tickers.length) return {};
  const prices = {};
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/json',
    'Referer': 'https://finance.yahoo.com',
  };
  try {
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(tickers.join(','))}&fields=regularMarketPrice`;
    const r = await fetch(url, { headers, signal: AbortSignal.timeout(7000) });
    if (!r.ok) throw new Error(`Yahoo batch HTTP ${r.status}`);
    const data = await r.json();
    const results = data?.quoteResponse?.result || [];
    for (const q of results) {
      if (q.regularMarketPrice && q.regularMarketPrice > 0) {
        prices[q.symbol] = q.regularMarketPrice;
      }
    }
    console.log(`[snapshot] Yahoo batch: ${Object.keys(prices).length}/${tickers.length} prix reçus`);
  } catch (e) {
    console.error('[snapshot] Yahoo batch error:', e.message);
    // Fallback: essayer query2
    try {
      const url2 = `https://query2.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(tickers.join(','))}&fields=regularMarketPrice`;
      const r2 = await fetch(url2, { headers, signal: AbortSignal.timeout(5000) });
      const data2 = await r2.json();
      const results2 = data2?.quoteResponse?.result || [];
      for (const q of results2) {
        if (q.regularMarketPrice && q.regularMarketPrice > 0) {
          prices[q.symbol] = q.regularMarketPrice;
        }
      }
      console.log(`[snapshot] Yahoo batch fallback: ${Object.keys(prices).length}/${tickers.length} prix reçus`);
    } catch (e2) {
      console.error('[snapshot] Yahoo batch fallback error:', e2.message);
    }
  }
  return prices;
}

// CoinGecko: une seule requête pour tous les symboles CG
async function fetchCoinGeckoBatch(tickers) {
  const cgTickers = tickers.filter(t => COINGECKO_MAP[t]);
  if (!cgTickers.length) return {};
  const prices = {};
  const ids = [...new Set(cgTickers.map(t => COINGECKO_MAP[t]))];
  try {
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(',')}&vs_currencies=usd`;
    const r = await fetch(url, { signal: AbortSignal.timeout(5000) });
    const data = await r.json();
    for (const ticker of cgTickers) {
      const id = COINGECKO_MAP[ticker];
      if (id && data[id]?.usd) prices[ticker] = data[id].usd;
    }
    console.log(`[snapshot] CoinGecko: ${Object.keys(prices).length}/${cgTickers.length} prix reçus`);
  } catch (e) {
    console.error('[snapshot] CoinGecko error:', e.message);
  }
  return prices;
}

// ── Parsing positions ─────────────────────────────────────────
function parsePositions(raw) {
  if (!raw) return [];
  try {
    const arr = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!Array.isArray(arr)) return [];
    return arr.filter(p => p && (p.symbol || p.ticker) && p.totalSize > 0);
  } catch {
    console.error('[snapshot] parsePositions failed:', raw);
    return [];
  }
}

function positionValueCAD(pos, prices, usdcad) {
  const symbol    = pos.symbol || pos.ticker || '';
  const ticker    = getYahooTicker(symbol);
  const price     = prices[ticker];
  const avgEntry  = parseFloat(pos.avgEntry || pos.avg_cost || 0);
  const totalSize = parseFloat(pos.totalSize || pos.total_size || 0);
  if (!price || !avgEntry || avgEntry === 0) return 0;
  const shares = totalSize / avgEntry;
  const mktVal = shares * price;
  const isCad = symbol.toUpperCase().endsWith('.TO');
  return isCad ? mktVal : mktVal * usdcad;
}

// ── Handler principal ─────────────────────────────────────────
export default async function handler(req, res) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers['authorization'] || '';
    if (auth !== `Bearer ${cronSecret}`) {
      console.warn('[snapshot] Unauthorized call — CRON_SECRET mismatch');
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  const startTime = Date.now();
  console.log('[snapshot] Démarrage —', new Date().toISOString());

  try {
    // 1. Récupérer user_data
    const userData = await fetchUserData();
    if (!userData) {
      console.warn('[snapshot] Aucune user_data pour', SUPA_USER_ID);
      return res.status(404).json({ error: 'user_data not found' });
    }

    // 2. Parser positions
    const positions = parsePositions(userData.positions);
    const cash      = parseFloat(userData.cash || 0);
    const currency  = userData.currency || 'CAD';

    console.log(`[snapshot] ${positions.length} position(s) | cash=${cash} ${currency}`);

    if (positions.length === 0) {
      return res.status(200).json({ message: 'No positions to snapshot' });
    }

    // 3. Tickers uniques
    const tickers       = [...new Set(positions.map(p => getYahooTicker(p.symbol || p.ticker || '')))];
    const yahooTickers  = [...new Set([...tickers.filter(t => !COINGECKO_MAP[t]), 'USDCAD=X'])];
    const cgTickers     = tickers.filter(t => COINGECKO_MAP[t]);

    // 4. Fetch prix en BATCH (Yahoo + CoinGecko en parallèle = ~1-2 requêtes)
    const [yahooPrices, cgPrices] = await Promise.all([
      fetchYahooBatch(yahooTickers),
      fetchCoinGeckoBatch(cgTickers),
    ]);
    const prices = { ...yahooPrices, ...cgPrices };

    const usdcad = parseFloat(prices['USDCAD=X'] || 0) || 1.3650;

    // 5. Calculer valeur totale CAD
    let totalPositionsCAD = 0;
    const details = [];
    for (const pos of positions) {
      const mktValCAD = positionValueCAD(pos, prices, usdcad);
      totalPositionsCAD += mktValCAD;
      details.push({ symbol: pos.symbol || pos.ticker, mktVal: Math.round(mktValCAD * 100) / 100 });
    }
    const totalCAD = totalPositionsCAD + cash;
    const today    = new Date().toISOString().split('T')[0];
    const elapsed  = Date.now() - startTime;

    console.log(`[snapshot] Total=${totalCAD.toFixed(2)} CAD | USDCAD=${usdcad} | ${elapsed}ms`);

    // 6. Upsert Supabase
    await upsertPortfolioHistory(today, totalCAD, 'CAD');
    console.log(`[snapshot] ✅ ${today} → ${totalCAD.toFixed(2)} CAD (${elapsed}ms)`);

    return res.status(200).json({
      success:       true,
      date:          today,
      total_cad:     Math.round(totalCAD * 100) / 100,
      usdcad,
      positions:     positions.length,
      prices_fetched: Object.keys(prices).length,
      elapsed_ms:    elapsed,
      details,
    });

  } catch (e) {
    console.error('[snapshot] Erreur fatale:', e.message);
    return res.status(500).json({ error: e.message });
  }
}

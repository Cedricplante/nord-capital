// ============================================================
// api/snapshot.js — Vercel Cron Job
// Schedule : 0 20 * * 1-5  (20h UTC = 22h Swiss, lun-ven)
// Rôle     : snapshot quotidien automatique du portfolio
//            lit user_data Supabase → prix live via /api/prices
//            → upsert portfolio_history
//
// Env vars Vercel requises :
//   SUPABASE_URL          ex. https://spgcwvmehcixchtsfuaf.supabase.co
//   SUPABASE_SERVICE_KEY  clé service_role (bypass RLS) — ⚠ jamais exposée côté client
//   SUPABASE_USER_ID      UUID Cédric : 871afd38-3c0b-4554-9ed1-a38a2ca966ff
//   VERCEL_URL            automatiquement injecté par Vercel (pas besoin d'ajouter manuellement)
// ============================================================

// Mapping symboles internes → tickers Yahoo Finance / CoinGecko
const SYMBOL_MAP = {
  'BTC/USD': 'BTC-USD',    'ETH/USD': 'ETH-USD',    'SOL/USD': 'SOL-USD',
  'BNB/USD': 'BNB-USD',    'XRP/USD': 'XRP-USD',    'ADA/USD': 'ADA-USD',
  'AVAX/USD':'AVAX-USD',   'DOGE/USD':'DOGE-USD',   'MATIC/USD':'MATIC-USD',
  'TAO/USD': 'TAO-USD',    'RNDR/USD':'RNDR-USD',   'AKT/USD': 'AKT-USD',
  'PYTH/USD':'PYTH-USD',   'RSR/USD': 'RSR-USD',
  // Akash Network — rebrand AKT→AKASH, CoinGecko utilise encore AKT-USD
  'AKASH/USD': 'AKT-USD',
  // Autres cryptos portefeuille
  'FET/USD':  'FET-USD',   'ONDO/USD': 'ONDO-USD',  'INJ/USD':  'INJ-USD',
  'RENDER/USD':'RNDR-USD', 'LINK/USD': 'LINK-USD',  'DOT/USD':  'DOT-USD',
  // Forex
  'EUR/USD': 'EURUSD=X', 'GBP/USD': 'GBPUSD=X', 'USD/JPY': 'USDJPY=X',
  'USD/CAD': 'USDCAD=X', 'AUD/USD': 'AUDUSD=X',
  // Commodités
  'XAU/USD': 'GC=F', 'XAG/USD': 'SI=F', 'WTI': 'CL=F',
};

// Symboles déjà au format Yahoo (pas de slash)
const COINGECKO_DIRECT = new Set([
  'TAO-USD','RNDR-USD','AKT-USD','PYTH-USD','RSR-USD'
]);

function getYahooTicker(symbol) {
  if (SYMBOL_MAP[symbol]) return SYMBOL_MAP[symbol];
  const upper = symbol.toUpperCase();
  if (SYMBOL_MAP[upper]) return SYMBOL_MAP[upper];
  // Fallback : remplacer '/' par '-' pour les cryptos non mappées (ex. LINK/USD → LINK-USD)
  if (upper.includes('/')) return upper.replace('/', '-');
  return upper;
}

// ── Helpers Supabase REST ────────────────────────────────────
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

// ── Parsing positions ────────────────────────────────────────
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

// Calculer la valeur marché d'une position directement en CAD
// .TO = prix Yahoo déjà en CAD → pas de conversion
// Autres = prix en USD → multiplier par usdcad
function positionValueCAD(pos, prices, usdcad) {
  const symbol    = pos.symbol || pos.ticker || '';
  const ticker    = getYahooTicker(symbol);
  const price     = prices[ticker];
  const avgEntry  = parseFloat(pos.avgEntry || pos.avg_cost || 0);
  const totalSize = parseFloat(pos.totalSize || pos.total_size || 0);

  if (!price || !avgEntry || avgEntry === 0) return 0;

  const shares = totalSize / avgEntry;
  const mktVal = shares * price;

  // Stocks canadiens (.TO) = prix déjà en CAD
  const isCad = symbol.toUpperCase().endsWith('.TO');
  return isCad ? mktVal : mktVal * usdcad;
}

// ── Handler principal ────────────────────────────────────────
export default async function handler(req, res) {
  // Sécurité : Vercel injecte Authorization: Bearer <CRON_SECRET> pour les crons
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers['authorization'] || '';
    if (auth !== `Bearer ${cronSecret}`) {
      console.warn('[snapshot] Unauthorized call — CRON_SECRET mismatch');
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  console.log('[snapshot] Démarrage snapshot portfolio —', new Date().toISOString());

  try {
    // 1. Récupérer user_data depuis Supabase
    const userData = await fetchUserData();
    if (!userData) {
      console.warn('[snapshot] Aucune user_data trouvée pour', SUPA_USER_ID);
      return res.status(404).json({ error: 'user_data not found' });
    }

    // 2. Parser les positions
    const positions = parsePositions(userData.positions);
    const cash      = parseFloat(userData.cash || 0);
    const currency  = userData.currency || 'CAD';

    console.log(`[snapshot] ${positions.length} position(s) | cash=${cash} ${currency}`);

    if (positions.length === 0) {
      console.log('[snapshot] Aucune position — snapshot ignoré.');
      return res.status(200).json({ message: 'No positions to snapshot' });
    }

    // 3. Construire la liste de tickers uniques + USDCAD pour la conversion
    const tickers = [...new Set(positions.map(p => getYahooTicker(p.symbol || p.ticker || '')))];
    const tickersWithFx = [...new Set([...tickers, 'USDCAD=X'])];
    const symbolsParam = tickersWithFx.join(',');

    // 4. Appeler /api/prices (même source que NC frontend)
    const baseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : `https://${process.env.VERCEL_URL || 'nord-capital-cedricplantes-projects.vercel.app'}`;

    const pricesUrl = `${baseUrl}/api/prices?symbols=${encodeURIComponent(symbolsParam)}`;
    console.log('[snapshot] Fetch prix :', pricesUrl);

    const pricesRes = await fetch(pricesUrl);
    if (!pricesRes.ok) throw new Error(`/api/prices error: ${pricesRes.status}`);
    const prices = await pricesRes.json();

    const fetched = Object.keys(prices).length;
    const missing = tickers.filter(t => !prices[t]);
    console.log(`[snapshot] Prix reçus: ${fetched}/${tickersWithFx.length}${missing.length ? ' | manquants: ' + missing.join(', ') : ''}`);

    // 5. Taux USDCAD (pour conversion USD → CAD des positions non-.TO)
    const usdcad = parseFloat(prices['USDCAD=X'] || 0) || 1.3650;

    // 6. Calculer valeur totale en CAD (conversion per-position selon devise)
    let totalPositionsCAD = 0;
    const details = [];

    for (const pos of positions) {
      const mktValCAD = positionValueCAD(pos, prices, usdcad);
      totalPositionsCAD += mktValCAD;
      details.push({
        symbol: pos.symbol || pos.ticker,
        mktVal: Math.round(mktValCAD * 100) / 100,
      });
    }

    // Cash stocké en devise du compte (CAD) depuis la migration nc_cash_migrated_v2
    const cashCAD = cash; // déjà en CAD, pas de conversion nécessaire
    const totalCAD = totalPositionsCAD + cashCAD;

    const today = new Date().toISOString().split('T')[0];

    console.log(`[snapshot] Positions CAD=${totalPositionsCAD.toFixed(2)} | cash=${cashCAD.toFixed(2)} CAD | USDCAD=${usdcad} | Total=${totalCAD.toFixed(2)} CAD`);

    // 7. Upsert dans portfolio_history
    await upsertPortfolioHistory(today, totalCAD, 'CAD');

    console.log(`[snapshot] ✅ portfolio_history upsertée : ${today} → ${totalCAD.toFixed(2)} CAD`);

    return res.status(200).json({
      success:   true,
      date:      today,
      total_cad: Math.round(totalCAD * 100) / 100,
      usdcad,
      positions: positions.length,
      prices_fetched: fetched,
      details,
    });

  } catch (e) {
    console.error('[snapshot] Erreur fatale:', e.message);
    return res.status(500).json({ error: e.message });
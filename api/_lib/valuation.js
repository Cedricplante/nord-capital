// ============================================================
// api/_lib/valuation.js — Logique de valorisation partagée
//
// Utilisé par api/snapshot.js (cron quotidien → portfolio_history)
// et api/monthly-report.js (cron mensuel → email Resend).
//
// But : une seule source de vérité pour "combien vaut le portfolio
// en CAD" — avant, snapshot.js et monthly-report.js recalculaient
// chacun leur version (shares dérivées différemment), avec risque
// de divergence entre le graphique et le rapport mensuel.
// ============================================================

// Mapping symboles internes → tickers Yahoo Finance
export const SYMBOL_MAP = {
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

// Cryptos à fetcher via CoinGecko (Yahoo les gère mal)
export const COINGECKO_MAP = {
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

export function getYahooTicker(symbol) {
  if (SYMBOL_MAP[symbol]) return SYMBOL_MAP[symbol];
  const upper = (symbol || '').toUpperCase();
  if (SYMBOL_MAP[upper]) return SYMBOL_MAP[upper];
  if (upper.includes('/')) return upper.replace('/', '-');
  return upper;
}

// ── Valeur d'une position en CAD ────────────────────────────────
// Source de vérité unique : totalSize (coût d'acquisition $) / avgEntry (prix moyen)
// = nombre de shares, cohérent avec index.html (p.totalSize = p.avgEntry * p.shares).
export function positionValueCAD(pos, prices, usdcad) {
  const symbol    = pos.symbol || pos.ticker || '';
  const ticker    = getYahooTicker(symbol);
  const price     = prices[ticker];
  const avgEntry  = parseFloat(pos.avgEntry || pos.avg_cost || 0);
  const totalSize = parseFloat(pos.totalSize || pos.total_size || 0);

  // Garde-fou : données invalides ou non-finies → position ignorée (valeur 0)
  // plutôt que de propager un NaN qui contaminerait tout le calcul.
  if (!price || !avgEntry || avgEntry === 0 || !Number.isFinite(totalSize) || totalSize <= 0) {
    return 0;
  }
  const shares = totalSize / avgEntry;
  const mktVal = shares * price;
  if (!Number.isFinite(mktVal)) return 0;

  const isCad = symbol.toUpperCase().endsWith('.TO');
  return isCad ? mktVal : mktVal * usdcad;
}

// ── Conversion du cash (devise du compte) → CAD ─────────────────
// Le cash est stocké dans user_data en devise du compte (CAD, USD, EUR, CHF, GBP, JPY —
// cf. migration v2 côté frontend). `crossRates` doit contenir le ticker "{DEVISE}CAD=X"
// si la devise n'est pas CAD (ex: USDCAD=X, EURCAD=X...).
export function cashToCAD(cash, currency, crossRates) {
  const cashNum = Number.isFinite(cash) ? cash : 0;
  const cur = (currency || 'CAD').toUpperCase();
  if (cur === 'CAD') return cashNum;
  const rate = crossRates?.[`${cur}CAD=X`];
  if (rate && Number.isFinite(rate) && rate > 0) return cashNum * rate;
  // Pas de taux dispo : on ne bloque pas le snapshot, mais on ne convertit pas non plus
  // silencieusement au mauvais taux — on retourne la valeur brute (comportement historique)
  // et on laisse l'appelant logger un warning s'il le souhaite.
  return cashNum;
}

// Ticker Yahoo pour convertir la devise du compte vers CAD (null si déjà CAD)
export function accountCurrencyTicker(currency) {
  const cur = (currency || 'CAD').toUpperCase();
  return cur === 'CAD' ? null : `${cur}CAD=X`;
}

// ── Fetch prix en batch ──────────────────────────────────────────
const YAHOO_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept': 'application/json',
  'Referer': 'https://finance.yahoo.com',
};

export async function fetchYahooBatch(tickers, { label = 'valuation', timeoutMs = 7000 } = {}) {
  if (!tickers.length) return {};
  const prices = {};

  // Corrigé 2026-07-23 : le endpoint batch v7/finance/quote est de plus en plus
  // bloqué par Yahoo depuis les IP datacenter (Vercel) — il renvoyait 0 résultat
  // EN SILENCE (pas d'erreur HTTP), donc snapshot.js écrivait des totaux gravement
  // sous-évalués dans portfolio_history sans jamais lever d'alerte (ex: 23k au lieu
  // de 49k, un seul ticker sur deux manquant). /api/prices utilise depuis longtemps
  // le endpoint chart (v8/finance/chart/{symbol}) avec succès — on fait pareil ici,
  // un symbole par requête mais en parallèle (Promise.all), donc pas plus lent.
  await Promise.all(tickers.map(async (t) => {
    try {
      const url = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(t)}?interval=1d&range=1d`;
      const r = await fetch(url, { headers: YAHOO_HEADERS, signal: AbortSignal.timeout(timeoutMs) });
      if (!r.ok) return;
      const data = await r.json();
      const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice;
      if (price && price > 0) prices[t] = price;
    } catch (e) {
      console.warn(`[${label}] Yahoo chart error (${t}):`, e.message);
    }
  }));

  // Fallback : retenter le batch v7 pour ce qui manque encore, au cas où il
  // fonctionne de nouveau pour certains tickers (ne coûte rien si tout est déjà trouvé).
  for (const base of ['https://query1.finance.yahoo.com', 'https://query2.finance.yahoo.com']) {
    const missing = tickers.filter(t => !(t in prices));
    if (!missing.length) break;
    try {
      const url = `${base}/v7/finance/quote?symbols=${encodeURIComponent(missing.join(','))}&fields=regularMarketPrice`;
      const r = await fetch(url, { headers: YAHOO_HEADERS, signal: AbortSignal.timeout(timeoutMs) });
      if (!r.ok) continue;
      const data = await r.json();
      for (const q of (data?.quoteResponse?.result || [])) {
        if (q.regularMarketPrice && q.regularMarketPrice > 0) prices[q.symbol] = q.regularMarketPrice;
      }
    } catch (e) {
      console.warn(`[${label}] Yahoo batch fallback error (${base}):`, e.message);
    }
  }

  return prices;
}

export async function fetchCoinGeckoBatch(tickers, { label = 'valuation', timeoutMs = 5000 } = {}) {
  const cgTickers = tickers.filter(t => COINGECKO_MAP[t]);
  if (!cgTickers.length) return {};
  const prices = {};
  const ids = [...new Set(cgTickers.map(t => COINGECKO_MAP[t]))];
  try {
    const r = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(',')}&vs_currencies=usd`, { signal: AbortSignal.timeout(timeoutMs) });
    const data = await r.json();
    for (const t of cgTickers) {
      const id = COINGECKO_MAP[t];
      if (id && data[id]?.usd) prices[t] = data[id].usd;
    }
  } catch (e) {
    console.warn(`[${label}] CoinGecko error:`, e.message);
  }
  return prices;
}

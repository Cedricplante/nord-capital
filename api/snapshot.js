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
//
// Logique de valorisation (tickers, positions, cash→CAD) centralisée dans
// ./_lib/valuation.js — partagée avec monthly-report.js pour que le graphique
// et le rapport mensuel ne puissent jamais diverger.
// ============================================================

import {
  COINGECKO_MAP,
  getYahooTicker,
  positionValueCAD,
  cashToCAD,
  accountCurrencyTicker,
  fetchYahooBatch,
  fetchCoinGeckoBatch,
} from './_lib/valuation.js';

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

    // 2. Parser positions + cash (cash stocké en devise du compte, cf. cashToCAD)
    const positions = parsePositions(userData.positions);
    const cashRaw    = parseFloat(userData.cash || 0);
    const cash       = Number.isFinite(cashRaw) ? cashRaw : 0;
    const currency   = (userData.currency || 'CAD').toUpperCase();

    console.log(`[snapshot] ${positions.length} position(s) | cash=${cash} ${currency}`);

    if (positions.length === 0) {
      return res.status(200).json({ message: 'No positions to snapshot' });
    }

    // 3. Tickers uniques (+ USDCAD=X pour les positions, + taux devise-compte→CAD si != CAD)
    const tickers      = [...new Set(positions.map(p => getYahooTicker(p.symbol || p.ticker || '')))];
    const acctTicker    = accountCurrencyTicker(currency); // ex: 'USDCAD=X', null si déjà CAD
    const yahooTickers  = [...new Set([
      ...tickers.filter(t => !COINGECKO_MAP[t]),
      'USDCAD=X',
      ...(acctTicker ? [acctTicker] : []),
    ])];
    const cgTickers     = tickers.filter(t => COINGECKO_MAP[t]);

    // 4. Fetch prix en BATCH (Yahoo + CoinGecko en parallèle = ~1-2 requêtes)
    const [yahooPrices, cgPrices] = await Promise.all([
      fetchYahooBatch(yahooTickers, { label: 'snapshot' }),
      fetchCoinGeckoBatch(cgTickers, { label: 'snapshot' }),
    ]);
    const prices = { ...yahooPrices, ...cgPrices };

    const usdcad = parseFloat(prices['USDCAD=X'] || 0) || 1.3650;

    // 5. Calculer valeur totale CAD (positions + cash converti correctement)
    let totalPositionsCAD = 0;
    let missingPriceCount = 0;
    const details = [];
    for (const pos of positions) {
      const mktValCAD = positionValueCAD(pos, prices, usdcad);
      const totalSizeNum = parseFloat(pos.totalSize || pos.total_size || 0);
      // mktVal=0 alors que la position a un coût d'acquisition > 0 => prix manquant,
      // pas une position qui vaut vraiment 0 (cf. audit 2026-07-23 : le endpoint Yahoo
      // batch a déjà renvoyé silencieusement 0 résultat, produisant un total à moitié
      // du vrai montant sans aucune erreur visible).
      if (mktValCAD === 0 && Number.isFinite(totalSizeNum) && totalSizeNum > 0) missingPriceCount++;
      totalPositionsCAD += mktValCAD;
      details.push({ symbol: pos.symbol || pos.ticker, mktVal: Math.round(mktValCAD * 100) / 100 });
    }

    // Garde-fou : si trop de positions n'ont pas pu être valorisées (prix manquant),
    // le total serait gravement sous-évalué mais techniquement "fini" (donc pas
    // attrapé par le garde-fou NaN plus bas). Mieux vaut un snapshot manquant pour
    // aujourd'hui (comblé plus tard) qu'un chiffre faux écrit silencieusement.
    if (positions.length > 0 && missingPriceCount / positions.length > 0.2) {
      throw new Error(`${missingPriceCount}/${positions.length} positions sans prix — snapshot annulé pour éviter un total sous-évalué`);
    }

    const cashCAD = cashToCAD(cash, currency, prices);
    if (currency !== 'CAD' && cashCAD === cash) {
      console.warn(`[snapshot] Taux ${currency}CAD=X indisponible — cash ajouté sans conversion (${cash} ${currency})`);
    }

    const totalCAD = totalPositionsCAD + cashCAD;
    const today    = new Date().toISOString().split('T')[0];
    const elapsed  = Date.now() - startTime;

    // Garde-fou final : ne jamais écrire une valeur non-finie dans portfolio_history.
    // Mieux vaut un snapshot manquant (visible, alertable) qu'un total corrompu à null/NaN.
    if (!Number.isFinite(totalCAD)) {
      throw new Error(`totalCAD non-fini (${totalCAD}) — snapshot annulé pour éviter la corruption`);
    }

    console.log(`[snapshot] Total=${totalCAD.toFixed(2)} CAD | USDCAD=${usdcad} | cash=${cashCAD.toFixed(2)} CAD | ${elapsed}ms`);

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

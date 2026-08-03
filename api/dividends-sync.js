// ============================================================
// api/dividends-sync.js — Vercel Cron Job
// Schedule : 0 23 * * 1-5  (1h après snapshot, même fuseau — voir la note DST dans
// snapshot.js, même ajustement à prévoir vers "0 0 * * 2-6" à l'entrée de l'heure d'hiver
// si on veut garder l'heure locale équivalente)
//
// Rôle : détecte automatiquement les dividendes versés sur les titres détenus (Yahoo
// Finance, endpoint chart avec events=div — même endpoint que /api/prices et snapshot.js,
// juste avec le paramètre events=div en plus) et les ajoute au registre de transactions
// (trades, type='Dividende'), avec dédoublonnage strict pour ne jamais ajouter deux fois
// le même versement.
//
// Décisions prises avec Cédric le 2026-08-03 :
// - Ajout AUTOMATIQUE (pas de revue manuelle avant import) — mais chaque entrée auto-ajoutée
//   porte seen:false, et l'app affiche un popup au prochain login listant tout ce qui a été
//   ajouté depuis la dernière connexion (voir checkNewDividends() dans app.js).
// - Si un titre est détenu dans plusieurs comptes en même temps, le dividende est réparti
//   proportionnellement au nombre d'actions détenues DANS CHAQUE COMPTE (pas au portefeuille
//   total) — une entrée Dividende distincte par compte.
//
// LIMITATION CONNUE : la répartition par compte utilise le nombre d'actions ACTUEL (positions
// au moment où le cron tourne), pas le nombre d'actions réellement détenu à la date ex-dividende
// historique. Pour un usage normal (peu de mouvements entre comptes sur un même titre), c'est
// une approximation raisonnable — mais si Cédric transfère des actions entre comptes, un
// dividende passé pourrait être mal réparti rétroactivement. Reconstruire l'historique exact
// par compte demanderait de rejouer les achats/ventes comme reconstructCashLots() le fait pour
// le cash (hors scope pour une v1).
//
// Env vars Vercel requises : mêmes que snapshot.js (SUPABASE_URL, SUPABASE_SERVICE_KEY,
// SUPABASE_USER_ID, CRON_SECRET).
// ============================================================

import { getYahooTicker, COINGECKO_MAP } from './_lib/valuation.js';

const SUPA_URL     = (process.env.SUPABASE_URL || 'https://spgcwvmehcixchtsfuaf.supabase.co').replace(/\/$/, '');
const SUPA_KEY     = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || '';
const SUPA_USER_ID = process.env.SUPABASE_USER_ID || '871afd38-3c0b-4554-9ed1-a38a2ca966ff';

const YAHOO_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept': 'application/json',
  'Referer': 'https://finance.yahoo.com',
};

function supabaseHeaders(extra) {
  return {
    'apikey':        SUPA_KEY,
    'Authorization': `Bearer ${SUPA_KEY}`,
    'Content-Type':  'application/json',
    ...(extra || {}),
  };
}

async function fetchUserRow() {
  const url = `${SUPA_URL}/rest/v1/user_data?user_id=eq.${SUPA_USER_ID}&select=positions,trades,updated_at&limit=1`;
  const res = await fetch(url, { headers: supabaseHeaders() });
  if (!res.ok) throw new Error(`user_data fetch failed (${res.status}): ${await res.text()}`);
  const rows = await res.json();
  return rows.length ? rows[0] : null;
}

function parseJsonArray(raw) {
  if (!raw) return [];
  try {
    const arr = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

// Fetch l'historique des dividendes d'un ticker via le endpoint chart Yahoo, même famille
// que fetchYahooBatch() dans _lib/valuation.js (v8/finance/chart), avec events=div en plus.
async function fetchDividendHistory(ticker, { timeoutMs = 7000 } = {}) {
  try {
    const url = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1y&events=div`;
    const r = await fetch(url, { headers: YAHOO_HEADERS, signal: AbortSignal.timeout(timeoutMs) });
    if (!r.ok) return { events: [], currency: null };
    const data = await r.json();
    const result = data?.chart?.result?.[0];
    const currency = result?.meta?.currency || null;
    const divMap = result?.events?.dividends || {};
    const events = Object.values(divMap)
      .filter(e => e && Number.isFinite(e.amount) && e.amount > 0 && Number.isFinite(e.date))
      .map(e => ({ date: new Date(e.date * 1000).toISOString().split('T')[0], amountPerShare: e.amount }));
    return { events, currency };
  } catch (e) {
    console.warn(`[dividends-sync] Yahoo chart error (${ticker}):`, e.message);
    return { events: [], currency: null };
  }
}

// PATCH avec verrou optimiste sur updated_at (même principe que saveData() côté client) --
// évite d'écraser une modification faite par Cédric dans l'app pile au moment où le cron
// tourne. En cas de conflit, on relit et on réessaie (jusqu'à 3 fois) plutôt que d'écraser.
async function patchTradesWithRetry(computeNewTrades, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const row = await fetchUserRow();
    if (!row) throw new Error('user_data introuvable');
    const currentTrades = parseJsonArray(row.trades);
    const { newTrades, addedCount, addedSummary } = computeNewTrades(row, currentTrades);
    if (addedCount === 0) return { addedCount: 0, addedSummary: [] };

    const nowIso = new Date().toISOString();
    const guard = row.updated_at ? `&updated_at=eq.${encodeURIComponent(row.updated_at)}` : '';
    const res = await fetch(`${SUPA_URL}/rest/v1/user_data?user_id=eq.${SUPA_USER_ID}${guard}`, {
      method: 'PATCH',
      headers: supabaseHeaders({ 'Prefer': 'return=representation' }),
      body: JSON.stringify({ trades: JSON.stringify(newTrades), updated_at: nowIso }),
    });
    const rows = res.ok ? await res.json().catch(() => []) : [];
    if (res.ok && rows.length > 0) return { addedCount, addedSummary };
    console.warn(`[dividends-sync] Conflit d'écriture (tentative ${attempt + 1}/${maxRetries}), nouvelle lecture...`);
  }
  throw new Error('Échec de la sauvegarde après plusieurs tentatives (conflits répétés)');
}

export default async function handler(req, res) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers['authorization'] || '';
    if (auth !== `Bearer ${cronSecret}`) {
      console.warn('[dividends-sync] Unauthorized call — CRON_SECRET mismatch');
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  const startTime = Date.now();
  console.log('[dividends-sync] Démarrage —', new Date().toISOString());

  try {
    const initialRow = await fetchUserRow();
    if (!initialRow) return res.status(404).json({ error: 'user_data not found' });

    const positions = parseJsonArray(initialRow.positions);
    if (!positions.length) return res.status(200).json({ message: 'No positions', addedCount: 0 });

    // Symboles uniques détenus, en excluant les cryptos (pas de dividendes Yahoo pertinents)
    const symbols = [...new Set(positions.map(p => p.symbol).filter(Boolean))];
    const tickerBySymbol = {};
    const dividendSymbols = symbols.filter(sym => {
      const ticker = getYahooTicker(sym);
      tickerBySymbol[sym] = ticker;
      return !COINGECKO_MAP[ticker] && !ticker.includes('=');
    });

    console.log(`[dividends-sync] ${dividendSymbols.length}/${symbols.length} symbole(s) éligible(s) aux dividendes`);

    // Fetch Yahoo en parallèle pour tous les symboles éligibles
    const histBySymbol = {};
    await Promise.all(dividendSymbols.map(async sym => {
      histBySymbol[sym] = await fetchDividendHistory(tickerBySymbol[sym]);
    }));

    const { addedCount, addedSummary } = await patchTradesWithRetry((row, currentTrades) => {
      const freshPositions = parseJsonArray(row.positions);
      // Clé de dédoublonnage : symbole|date|compte -- une entrée Dividende par compte, jamais
      // deux fois pour le même trio (que l'entrée ait été ajoutée manuellement ou par ce cron).
      const existingKeys = new Set(
        currentTrades
          .filter(t => t.type === 'Dividende')
          .map(t => `${t.symbol}|${t.date}|${t.accountType || t.account || ''}`)
      );

      const newEntries = [];
      for (const sym of dividendSymbols) {
        const { events, currency } = histBySymbol[sym] || { events: [], currency: null };
        if (!events.length) continue;

        // Répartition par compte : actions actuellement détenues de ce symbole, groupées par
        // compte (voir LIMITATION CONNUE en tête de fichier -- approximation sur le nombre
        // d'actions actuel, pas historique).
        const sharesByAccount = {};
        freshPositions.filter(p => p.symbol === sym).forEach(p => {
          const acct = p.account || 'Non spécifié';
          sharesByAccount[acct] = (sharesByAccount[acct] || 0) + (parseFloat(p.shares) || 0);
        });
        const accounts = Object.entries(sharesByAccount).filter(([, shares]) => shares > 0);
        if (!accounts.length) continue;

        for (const ev of events) {
          for (const [acct, shares] of accounts) {
            const key = `${sym}|${ev.date}|${acct}`;
            if (existingKeys.has(key)) continue;
            const amount = Math.round(shares * ev.amountPerShare * 100) / 100;
            if (!(amount > 0)) continue;
            existingKeys.add(key);
            newEntries.push({
              type: 'Dividende',
              date: ev.date,
              symbol: sym,
              accountType: acct,
              originalAmt: amount,
              originalCurrency: currency || 'USD',
              currency: currency || 'USD',
              size: amount,
              autoImported: true,
              seen: false,
            });
          }
        }
      }

      if (!newEntries.length) return { newTrades: currentTrades, addedCount: 0, addedSummary: [] };
      // Trades stockés du plus récent au plus ancien (convention existante -- voir
      // saveDividend()/saveCotisation() côté client qui font trades.unshift()).
      newEntries.sort((a, b) => b.date.localeCompare(a.date));
      return {
        newTrades: [...newEntries, ...currentTrades],
        addedCount: newEntries.length,
        addedSummary: newEntries.map(e => `${e.symbol} ${e.date} ${e.accountType}: ${e.originalAmt} ${e.originalCurrency}`),
      };
    });

    const elapsed = Date.now() - startTime;
    console.log(`[dividends-sync] ✅ ${addedCount} dividende(s) ajouté(s) (${elapsed}ms)`, addedSummary);
    return res.status(200).json({ success: true, addedCount, addedSummary, elapsed_ms: elapsed });

  } catch (e) {
    console.error('[dividends-sync] Erreur fatale:', e.message);
    return res.status(500).json({ error: e.message });
  }
}

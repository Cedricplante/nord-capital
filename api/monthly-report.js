// ============================================================
// api/monthly-report.js — Vercel Cron Job
// Schedule : 0 8 1 * *  (8h UTC le 1er de chaque mois)
// Rôle     : rapport mensuel par email via Resend
//
// Env vars Vercel requises :
//   SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_USER_ID
//   RESEND_API_KEY, REPORT_EMAIL
//
// Logique de valorisation (tickers, positions, cash→CAD) centralisée dans
// ./_lib/valuation.js — partagée avec snapshot.js pour que le rapport mensuel
// et le graphique du dashboard ne puissent jamais diverger.
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

const SUPA_URL     = (process.env.SUPABASE_URL || 'https://spgcwvmehcixchtsfuaf.supabase.co').replace(/\/$/, '');
const SUPA_KEY     = process.env.SUPABASE_SERVICE_KEY || '';
const SUPA_USER_ID = process.env.SUPABASE_USER_ID || '871afd38-3c0b-4554-9ed1-a38a2ca966ff';
const RESEND_KEY   = process.env.RESEND_API_KEY || '';
const TO_EMAIL     = process.env.REPORT_EMAIL || 'cedric.plante@outlook.com';
const APP_URL      = 'https://nord-capital-cedricplantes-projects.vercel.app';

function sbHeaders() {
  return { 'Content-Type': 'application/json', 'apikey': SUPA_KEY, 'Authorization': `Bearer ${SUPA_KEY}` };
}

async function fetchUserData() {
  const res = await fetch(`${SUPA_URL}/rest/v1/user_data?user_id=eq.${SUPA_USER_ID}&select=*`, { headers: sbHeaders() });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.[0] || null;
}

async function fetchHistory() {
  const res = await fetch(`${SUPA_URL}/rest/v1/portfolio_history?user_id=eq.${SUPA_USER_ID}&select=date,value&order=date.asc`, { headers: sbHeaders() });
  if (!res.ok) return [];
  return await res.json();
}

async function fetchAllPrices(positions, currency) {
  const tickers = [...new Set(positions.map(p => getYahooTicker(p.symbol || p.ticker || '')))];
  const acctTicker = accountCurrencyTicker(currency);
  const yahooTickers = [...new Set([
    ...tickers.filter(t => !COINGECKO_MAP[t]),
    'USDCAD=X',
    ...(acctTicker ? [acctTicker] : []),
  ])];
  const [yahoo, cg] = await Promise.all([
    fetchYahooBatch(yahooTickers, { label: 'monthly-report' }),
    fetchCoinGeckoBatch(tickers, { label: 'monthly-report' }),
  ]);
  return { ...yahoo, ...cg };
}

// ── Formatters ────────────────────────────────────────────────
function fmt(n, decimals = 0) {
  return n.toLocaleString('fr-CA', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}
function fmtSign(n) { return (n >= 0 ? '+' : '') + fmt(n, 0); }
function fmtPct(n)  { return (n >= 0 ? '+' : '') + n.toFixed(2) + '%'; }

function positionPnl(pos, prices, usdcad) {
  const sym   = getYahooTicker(pos.symbol || '');
  const price = prices[sym] || pos.current || pos.avgEntry || 0;
  const cur   = (pos.currency || 'USD').toUpperCase();
  const toCAD = cur === 'CAD' ? 1 : usdcad;
  const shares = pos.shares || 0;
  const mktVal = shares * price * toCAD;
  const cost   = shares * (pos.avgEntry || 0) * toCAD;
  const pnl    = pos.dir === 'Short' ? cost - mktVal : mktVal - cost;
  const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0;
  return { symbol: pos.symbol, mktVal, cost, pnl, pnlPct, price, currency: cur };
}

function colorSign(val, label) {
  return `<span style="color:${val >= 0 ? '#00c87a' : '#ff4d6d'};font-weight:600;">${label}</span>`;
}

function buildEmail({ totalCAD, prevMonthCAD, positions, cash, prices, usdcad, monthLabel }) {
  const monthDiff = prevMonthCAD ? totalCAD - prevMonthCAD : null;
  const monthPct  = prevMonthCAD ? (monthDiff / prevMonthCAD) * 100 : null;

  const posWithPnl = positions.map(p => positionPnl(p, prices, usdcad)).filter(p => Math.abs(p.cost) > 50);
  const sorted = [...posWithPnl].sort((a, b) => b.pnlPct - a.pnlPct);
  const top3   = sorted.slice(0, 3);
  const flop3  = sorted.slice(-3).reverse();

  const MILESTONES = [10000, 25000, 50000, 75000, 100000, 150000, 250000, 500000, 1000000];
  const next = MILESTONES.find(m => m > totalCAD);
  const milestoneRow = next
    ? `<p style="margin:0;font-size:13px;color:#a0a0b0;">Prochain milestone : <strong style="color:#fff;">${fmt(next)} CAD</strong> — manque <strong style="color:#f6c843;">${fmt(next - totalCAD)} CAD</strong> (${((totalCAD / next) * 100).toFixed(1)}% atteint)</p>`
    : `<p style="margin:0;font-size:13px;color:#00c87a;">Tous les milestones franchis !</p>`;

  const posRow = p => `<tr>
    <td style="padding:8px 12px;font-family:monospace;color:#fff;font-weight:700;">${p.symbol}</td>
    <td style="padding:8px 12px;color:#a0a0b0;font-family:monospace;">$${p.price > 0.01 ? fmt(p.price, 2) : p.price.toFixed(6)}</td>
    <td style="padding:8px 12px;font-family:monospace;">${colorSign(p.pnlPct, fmtPct(p.pnlPct))}</td>
    <td style="padding:8px 12px;font-family:monospace;">${colorSign(p.pnl, fmtSign(p.pnl) + ' CAD')}</td>
  </tr>`;

  const tableHeader = `<tr style="border-bottom:1px solid #2a2a4a;">
    <th style="padding:4px 12px;text-align:left;font-size:10px;color:#606075;">Symbole</th>
    <th style="padding:4px 12px;text-align:left;font-size:10px;color:#606075;">Prix</th>
    <th style="padding:4px 12px;text-align:left;font-size:10px;color:#606075;">P&L %</th>
    <th style="padding:4px 12px;text-align:left;font-size:10px;color:#606075;">P&L $</th>
  </tr>`;

  const empty = '<tr><td colspan="4" style="padding:8px 12px;color:#606075;">—</td></tr>';
  const monthBlock = monthDiff !== null ? `
    <div style="background:#1a1a2e;border:1px solid #2a2a4a;border-radius:10px;padding:16px 24px;margin-bottom:16px;">
      <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#606075;">Variation du mois</p>
      <p style="margin:0;font-size:28px;font-weight:700;font-family:monospace;">${colorSign(monthDiff, fmtSign(monthDiff) + ' CAD')} <span style="font-size:18px;color:#a0a0b0;">${colorSign(monthPct, fmtPct(monthPct))}</span></p>
    </div>` : '';

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="background:#0d0d1a;color:#e0e0f0;font-family:-apple-system,sans-serif;margin:0;padding:0;">
<div style="max-width:560px;margin:0 auto;padding:32px 16px;">
  <div style="text-align:center;margin-bottom:28px;">
    <h1 style="font-size:22px;font-weight:800;letter-spacing:3px;color:#fff;margin:0;">NORD <span style="color:#00ff88;">CAPITAL</span></h1>
    <p style="margin:6px 0 0;font-size:12px;color:#606075;letter-spacing:1px;">RAPPORT MENSUEL · ${monthLabel.toUpperCase()}</p>
  </div>
  <div style="background:#1a1a2e;border:1px solid #2a2a4a;border-radius:10px;padding:16px 24px;margin-bottom:16px;">
    <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#606075;">Valeur totale du portfolio</p>
    <p style="margin:0;font-size:36px;font-weight:800;font-family:monospace;color:#fff;">${fmt(totalCAD)} <span style="font-size:18px;color:#606075;">CAD</span></p>
    <p style="margin:6px 0 0;font-size:12px;color:#606075;">Positions: ${fmt(totalCAD - cash)} · Cash: ${fmt(cash)}</p>
  </div>
  ${monthBlock}
  <div style="background:#1a1a2e;border:1px solid #2a2a4a;border-radius:10px;padding:14px 24px;margin-bottom:16px;">${milestoneRow}</div>
  <div style="background:#1a1a2e;border:1px solid #2a2a4a;border-radius:10px;padding:16px 24px;margin-bottom:16px;">
    <p style="margin:0 0 12px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#606075;">Top positions (P&amp;L %)</p>
    <table style="width:100%;border-collapse:collapse;">${tableHeader}${top3.map(posRow).join('') || empty}</table>
  </div>
  <div style="background:#1a1a2e;border:1px solid #2a2a4a;border-radius:10px;padding:16px 24px;margin-bottom:24px;">
    <p style="margin:0 0 12px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#606075;">Flop positions (P&amp;L %)</p>
    <table style="width:100%;border-collapse:collapse;">${tableHeader}${flop3.map(posRow).join('') || empty}</table>
  </div>
  <div style="text-align:center;padding-top:16px;border-top:1px solid #1a1a2e;">
    <a href="${APP_URL}" style="display:inline-block;padding:12px 28px;background:#00ff88;color:#000;font-weight:700;font-size:13px;border-radius:8px;text-decoration:none;">Voir le portfolio →</a>
    <p style="margin:16px 0 0;font-size:10px;color:#404055;">Nord Capital · Rapport généré automatiquement le 1er du mois</p>
  </div>
</div></body></html>`;
}

async function sendEmail(subject, html) {
  if (!RESEND_KEY) throw new Error('RESEND_API_KEY manquant');
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${RESEND_KEY}` },
    body: JSON.stringify({ from: 'onboarding@resend.dev', to: [TO_EMAIL], subject, html }),
  });
  if (!res.ok) { const err = await res.text(); throw new Error(`Resend ${res.status}: ${err}`); }
  return await res.json();
}

export default async function handler(req, res) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers['authorization'] || '';
    if (auth !== `Bearer ${cronSecret}`) return res.status(401).json({ error: 'Unauthorized' });
  }

  const startTime = Date.now();
  console.log('[monthly-report] Démarrage —', new Date().toISOString());

  try {
    const [userData, history] = await Promise.all([fetchUserData(), fetchHistory()]);
    if (!userData) return res.status(404).json({ error: 'user_data not found' });

    const positions  = JSON.parse(userData.positions || '[]');
    const cashRaw    = parseFloat(userData.cash || 0);
    const cash       = Number.isFinite(cashRaw) ? cashRaw : 0;
    const currency   = (userData.currency || 'CAD').toUpperCase();

    // Fetch prix batch (Yahoo + CoinGecko directs, pas via /api/prices)
    const prices = await fetchAllPrices(positions, currency);
    const usdcad = parseFloat(prices['USDCAD=X'] || 0) || 1.365;

    // Même fonction de valorisation que snapshot.js (api/_lib/valuation.js) —
    // évite que le total du rapport mensuel diverge de celui du graphique.
    const totalPos = positions.reduce((sum, p) => sum + positionValueCAD(p, prices, usdcad), 0);
    const cashCAD  = cashToCAD(cash, currency, prices);
    const totalCAD = totalPos + cashCAD;

    const now       = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lmStr     = lastMonth.toISOString().split('T')[0].slice(0, 7);
    const lmSnaps   = history.filter(h => h.date.startsWith(lmStr));
    const prevMonthCAD = lmSnaps.length ? lmSnaps[lmSnaps.length - 1].value : null;

    const monthLabel = now.toLocaleDateString('fr-CA', { month: 'long', year: 'numeric' });
    const subject    = `Nord Capital · Rapport ${monthLabel} · ${Math.round(totalCAD).toLocaleString('fr-CA')} CAD`;
    const html       = buildEmail({ totalCAD, prevMonthCAD, positions, cash: cashCAD, prices, usdcad, monthLabel });

    const result = await sendEmail(subject, html);
    const elapsed = Date.now() - startTime;
    console.log(`[monthly-report] Email envoyé: ${result.id} (${elapsed}ms)`);
    return res.status(200).json({ ok: true, emailId: result.id, totalCAD: Math.round(totalCAD), elapsed_ms: elapsed });

  } catch (e) {
    console.error('[monthly-report] Erreur :', e.message);
    return res.status(500).json({ error: e.message });
  }
}

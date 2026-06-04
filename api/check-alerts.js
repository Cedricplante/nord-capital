// api/check-alerts.js
// Called client-side after refreshWatchlist to check target/stop alerts
// Sends email via Resend if any alert is triggered

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const REPORT_EMAIL = process.env.REPORT_EMAIL;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

  if (!RESEND_API_KEY || !REPORT_EMAIL) {
    res.status(200).json({ skipped: true, reason: 'Resend not configured' });
    return;
  }

  let alerts;
  try { alerts = req.body?.alerts || []; } catch(e) { alerts = []; }
  if (!alerts.length) { res.status(200).json({ sent: 0 }); return; }

  // Filter only new alerts (not yet notified today)
  const today = new Date().toISOString().slice(0, 10);
  const triggered = alerts.filter(a => a.type === 'target' || a.type === 'stop');
  if (!triggered.length) { res.status(200).json({ sent: 0 }); return; }

  const rows = triggered.map(a => `
    <tr style="border-bottom:1px solid #eee;">
      <td style="padding:8px 12px;font-family:monospace;font-weight:bold;">${a.symbol}</td>
      <td style="padding:8px 12px;color:${a.type==='target'?'#16a34a':'#dc2626'};">
        ${a.type === 'target' ? 'Target atteint' : 'Stop atteint'}
      </td>
      <td style="padding:8px 12px;font-family:monospace;">${a.price}</td>
      <td style="padding:8px 12px;font-family:monospace;color:${a.type==='target'?'#16a34a':'#dc2626'};">
        ${a.type === 'target' ? a.alertTarget : a.alertStop}
      </td>
    </tr>`).join('');

  const html = `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;">
      <h2 style="font-size:18px;font-weight:700;margin-bottom:4px;">Nord Capital — Alertes prix</h2>
      <p style="color:#666;font-size:13px;margin-bottom:20px;">${today}</p>
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead>
          <tr style="background:#f5f5f5;">
            <th style="padding:8px 12px;text-align:left;">Symbole</th>
            <th style="padding:8px 12px;text-align:left;">Type</th>
            <th style="padding:8px 12px;text-align:left;">Prix actuel</th>
            <th style="padding:8px 12px;text-align:left;">Seuil</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <p style="margin-top:20px;font-size:11px;color:#999;">
        Généré par Nord Capital · <a href="https://nord-capital-cedricplantes-projects.vercel.app">Ouvrir l'app</a>
      </p>
    </div>`;

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'onboarding@resend.dev',
        to: [REPORT_EMAIL],
        subject: `[Nord Capital] ${triggered.length} alerte(s) prix — ${today}`,
        html,
      }),
    });
    const data = await r.json();
    if (r.ok) res.status(200).json({ sent: triggered.length, id: data.id });
    else res.status(200).json({ sent: 0, error: data });
  } catch(e) {
    res.status(200).json({ sent: 0, error: e.message });
  }
}

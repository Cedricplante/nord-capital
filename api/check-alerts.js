// api/check-alerts.js
// Called client-side after refreshWatchlist to check target/stop alerts
// Sends email via Resend if any alert is triggered
//
// Protections (avant : endpoint public sans limite, spammable) :
//   1. Auth  : exige un token Supabase valide correspondant au seul compte de l'app
//              (app mono-utilisateur, cf. SUPABASE_USER_ID utilisé partout ailleurs).
//   2. Dédup : "1 email d'alertes / jour" appliqué côté serveur (user_data.last_alert_date),
//              donc fiable même si l'appel vient de deux appareils différents (portable + PC),
//              contrairement à l'ancien système basé sur localStorage.

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const REPORT_EMAIL   = process.env.REPORT_EMAIL;
const SUPA_URL       = (process.env.SUPABASE_URL || 'https://spgcwvmehcixchtsfuaf.supabase.co').replace(/\/$/, '');
const SUPA_KEY       = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || '';
const SUPA_USER_ID   = process.env.SUPABASE_USER_ID || '871afd38-3c0b-4554-9ed1-a38a2ca966ff';

function sbHeaders() {
  return { 'apikey': SUPA_KEY, 'Authorization': `Bearer ${SUPA_KEY}`, 'Content-Type': 'application/json' };
}

// Échappe les caractères HTML spéciaux avant interpolation dans l'email
// (défense en profondeur — app mono-utilisateur donc risque faible, mais coûte rien).
function esc(v) {
  return String(v ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

// Vérifie que le bearer token envoyé par le client correspond bien à l'unique
// utilisateur de l'app — bloque tout appel externe (curl, script, etc.).
async function verifyOwner(req) {
  const auth = req.headers['authorization'] || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) return false;
  try {
    const r = await fetch(`${SUPA_URL}/auth/v1/user`, {
      headers: { apikey: SUPA_KEY, Authorization: `Bearer ${token}` },
    });
    if (!r.ok) return false;
    const user = await r.json();
    return user?.id === SUPA_USER_ID;
  } catch {
    return false;
  }
}

async function getLastAlertDate() {
  const url = `${SUPA_URL}/rest/v1/user_data?user_id=eq.${SUPA_USER_ID}&select=last_alert_date&limit=1`;
  const r = await fetch(url, { headers: sbHeaders() });
  if (!r.ok) return null;
  const rows = await r.json();
  return rows[0]?.last_alert_date || null;
}

async function setLastAlertDate(date) {
  const url = `${SUPA_URL}/rest/v1/user_data?user_id=eq.${SUPA_USER_ID}`;
  await fetch(url, {
    method: 'PATCH',
    headers: sbHeaders(),
    body: JSON.stringify({ last_alert_date: date }),
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

  const isOwner = await verifyOwner(req);
  if (!isOwner) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  if (!RESEND_API_KEY || !REPORT_EMAIL) {
    res.status(200).json({ skipped: true, reason: 'Resend not configured' });
    return;
  }

  const alerts = Array.isArray(req.body?.alerts) ? req.body.alerts : [];
  if (!alerts.length) { res.status(200).json({ sent: 0 }); return; }

  const triggered = alerts.filter(a => a.type === 'target' || a.type === 'stop');
  if (!triggered.length) { res.status(200).json({ sent: 0 }); return; }

  // Dédup serveur : au plus un email d'alertes par jour, peu importe le nombre
  // d'appareils/appels. Remplace l'ancien système localStorage (non partagé entre appareils).
  const today = new Date().toISOString().slice(0, 10);
  const lastAlertDate = await getLastAlertDate();
  if (lastAlertDate === today) {
    res.status(200).json({ sent: 0, reason: 'already sent today' });
    return;
  }

  const rows = triggered.map(a => `
    <tr style="border-bottom:1px solid #eee;">
      <td style="padding:8px 12px;font-family:monospace;font-weight:bold;">${esc(a.symbol)}</td>
      <td style="padding:8px 12px;color:${a.type==='target'?'#16a34a':'#dc2626'};">
        ${a.type === 'target' ? 'Target atteint' : 'Stop atteint'}
      </td>
      <td style="padding:8px 12px;font-family:monospace;">${esc(a.price)}</td>
      <td style="padding:8px 12px;font-family:monospace;color:${a.type==='target'?'#16a34a':'#dc2626'};">
        ${esc(a.type === 'target' ? a.alertTarget : a.alertStop)}
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
    if (r.ok) {
      await setLastAlertDate(today);
      res.status(200).json({ sent: triggered.length, id: data.id });
    } else {
      res.status(200).json({ sent: 0, error: data });
    }
  } catch(e) {
    res.status(200).json({ sent: 0, error: e.message });
  }
}

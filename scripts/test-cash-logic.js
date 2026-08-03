#!/usr/bin/env node
'use strict';
/*
 * Script de régression pour la logique de reconstruction du cash (reconstructCashLots).
 *
 * Pourquoi : cette logique a déjà produit 2 bugs critiques découverts après coup par un audit
 * manuel (cash fantôme sur une vente perdante, fuite de cash entre comptes via une clé de
 * funding trop large -- corrigés le 2026-07-30, voir les commentaires dans index.html autour
 * de reconstructCashLots()). `node --check` valide seulement la syntaxe, jamais les chiffres.
 * Ce script rejoue quelques scénarios connus et vérifie le résultat numérique, pour attraper
 * une régression AVANT un commit plutôt qu'après.
 *
 * Comment ça marche : les fonctions testées vivent dans app.js (extrait de l'ancien <script> inline de
 * index.html le 2026-08-03, voir commit de split du monolithe). Plutôt que de dupliquer une
 * copie figée ici (qui se périmerait dès qu'on touche à app.js sans y penser), ce script
 * EXTRAIT le code source actuel des fonctions/consts nécessaires directement depuis app.js à
 * chaque exécution, et l'exécute dans un petit bac à sable Node. Ça teste donc toujours le
 * code réel, pas une copie.
 *
 * Usage : node scripts/test-cash-logic.js   (exit code 0 = tout passe, 1 = au moins un échec)
 */

const fs = require('fs');
const path = require('path');

const APP_JS_PATH = path.join(__dirname, '..', 'app.js');
const src = fs.readFileSync(APP_JS_PATH, 'utf8');

// ── Extraction par appariement d'accolades, en ignorant chaînes/commentaires ──────────────
function findDeclStart(source, name, kind) {
  const re = kind === 'function'
    ? new RegExp('function\\s+' + name + '\\s*\\(')
    : new RegExp('const\\s+' + name + '\\s*=');
  const m = re.exec(source);
  if (!m) throw new Error(`Déclaration introuvable dans index.html : ${kind} ${name}`);
  return m.index;
}

function extractDecl(source, from, kind) {
  let i = from, depth = 0, started = false;
  while (i < source.length) {
    const ch = source[i];
    if (ch === '/' && source[i + 1] === '/') { i = source.indexOf('\n', i); if (i === -1) i = source.length; continue; }
    if (ch === '/' && source[i + 1] === '*') { i = source.indexOf('*/', i + 2) + 2; continue; }
    if (ch === '"' || ch === "'" || ch === '`') {
      const quote = ch; i++;
      while (i < source.length && source[i] !== quote) { if (source[i] === '\\') i++; i++; }
      i++; continue;
    }
    if (kind === 'function') {
      if (ch === '{') { depth++; started = true; }
      else if (ch === '}') { depth--; if (started && depth === 0) return i + 1; }
    } else {
      if (ch === '{' || ch === '[' || ch === '(') depth++;
      else if (ch === '}' || ch === ']' || ch === ')') depth--;
      else if (ch === ';' && depth === 0) return i + 1;
    }
    i++;
  }
  throw new Error('Fin de fichier atteinte sans trouver la fin de la déclaration');
}

function extract(name, kind) {
  const start = findDeclStart(src, name, kind);
  const end = extractDecl(src, start, kind);
  return src.slice(start, end);
}

const NAMES = [
  ['FX_FALLBACK', 'const'],
  ['toUSD', 'function'],
  ['fxConvert', 'function'],
  ['CASH_LOTS_BASELINE_DATE', 'const'],
  ['CASH_LOTS_SEED', 'const'],
  ['_clMakeAccount', 'function'],
  ['_clAddLot', 'function'],
  ['_clScaleFunding', 'function'],
  ['_clUniqueChains', 'function'],
  ['_clConsume', 'function'],
  ['reconstructCashLots', 'function'],
  ['_clAccountTotalCAD', 'function'],
];

const extracted = NAMES.map(([name, kind]) => extract(name, kind)).join('\n');

function runScenario(trades, opts) {
  const accountCurrency = (opts && opts.accountCurrency) || 'CAD';
  const fxRate = (opts && opts.fxRate) || 1.37;
  const liveFxRates = {};
  const sandboxSrc = `
    let accountCurrency = ${JSON.stringify(accountCurrency)};
    let fxRate = ${JSON.stringify(fxRate)};
    const liveFxRates = ${JSON.stringify(liveFxRates)};
    let trades = ${JSON.stringify(trades)};
    ${extracted}
    return { reconstructCashLots, _clAccountTotalCAD, CASH_LOTS_SEED, CASH_LOTS_BASELINE_DATE };
  `;
  const fn = new Function(sandboxSrc);
  return fn();
}

let pass = 0, fail = 0;
function approx(a, b, tol) { return Math.abs(a - b) <= (tol == null ? 0.01 : tol); }
function check(label, cond, detail) {
  if (cond) { pass++; console.log(`  ✓ ${label}`); }
  else { fail++; console.error(`  ✗ ${label}${detail ? ' — ' + detail : ''}`); }
}

function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().split('T')[0];
}

(function scenario1() {
  console.log('Scénario 1 — dépôt → achat → vente profitable');
  const d = runScenario([], {}).CASH_LOTS_BASELINE_DATE;
  const trades = [
    { type: 'Vente', symbol: 'TEST', shares: 10, size: 1200, profit: 200, currency: 'USD', accountType: 'TEST_ACCT_1', date: addDays(d, 3) },
    { type: 'Achat', symbol: 'TEST', shares: 10, size: 1000, currency: 'USD', accountType: 'TEST_ACCT_1', date: addDays(d, 2) },
    { type: 'Dépôt', size: 1000, originalAmt: 1370, originalCurrency: 'CAD', accountType: 'TEST_ACCT_1', date: addDays(d, 1) },
  ];
  const { reconstructCashLots: recon2, _clAccountTotalCAD } = runScenario(trades, {});
  const { accounts } = recon2(true);
  const celi = accounts['TEST_ACCT_1'];
  check('compte TEST_ACCT_1 existe', !!celi);
  if (celi) {
    const profitLots = celi.profit.filter(l => l.currency === 'USD');
    check('le profit (200 USD) est tracké séparément du principal',
      profitLots.some(l => approx(l.amount, 200)),
      `lots profit USD: ${JSON.stringify(profitLots)}`);
    check('le principal net reste positif après achat+vente', _clAccountTotalCAD(celi) > 0,
      `total CAD: ${_clAccountTotalCAD(celi)}`);
  }
})();

(function scenario2() {
  console.log('Scénario 2 — vente perdante ne doit pas créer de cash fantôme');
  const d0 = runScenario([], {}).CASH_LOTS_BASELINE_DATE;
  const trades = [
    { type: 'Vente', symbol: 'LOSS', shares: 5, size: 400, profit: -100, currency: 'USD', accountType: 'TEST_ACCT_2', date: addDays(d0, 3) },
    { type: 'Achat', symbol: 'LOSS', shares: 5, size: 500, currency: 'USD', accountType: 'TEST_ACCT_2', date: addDays(d0, 2) },
    { type: 'Dépôt', size: 685, originalAmt: 685, originalCurrency: 'USD', accountType: 'TEST_ACCT_2', date: addDays(d0, 1) },
  ];
  const { reconstructCashLots, _clAccountTotalCAD } = runScenario(trades, {});
  const { accounts } = reconstructCashLots(true);
  const acc = accounts['TEST_ACCT_2'];
  check('compte TEST_ACCT_2 existe', !!acc);
  if (acc) {
    const total = _clAccountTotalCAD(acc);
    const depositCAD_equiv = 685 * 1.37;
    check('le total ne dépasse pas le capital déposé (pas de cash fantôme)',
      total <= depositCAD_equiv + 0.5,
      `total=${total.toFixed(2)} CAD, dépôt=${depositCAD_equiv.toFixed(2)} CAD`);
  }
})();

(function scenario3() {
  console.log('Scénario 3 — pas de fuite de cash entre comptes (même symbole)');
  const d0 = runScenario([], {}).CASH_LOTS_BASELINE_DATE;
  const trades = [
    { type: 'Vente', symbol: 'SAME', shares: 10, size: 1100, profit: 100, currency: 'USD', accountType: 'COMPTE_B', date: addDays(d0, 4) },
    { type: 'Achat', symbol: 'SAME', shares: 10, size: 1000, currency: 'USD', accountType: 'COMPTE_B', date: addDays(d0, 3) },
    { type: 'Dépôt', size: 1370, originalAmt: 1370, originalCurrency: 'CAD', accountType: 'COMPTE_B', date: addDays(d0, 2) },
    { type: 'Achat', symbol: 'SAME', shares: 5, size: 500, currency: 'USD', accountType: 'COMPTE_A', date: addDays(d0, 1) },
    { type: 'Dépôt', size: 685, originalAmt: 685, originalCurrency: 'USD', accountType: 'COMPTE_A', date: d0 },
  ];
  const { reconstructCashLots, _clAccountTotalCAD } = runScenario(trades, {});
  const { accounts } = reconstructCashLots(true);
  const a = accounts['COMPTE_A'], b = accounts['COMPTE_B'];
  check('compte A existe', !!a);
  check('compte B existe', !!b);
  if (a && b) {
    const aUSD = a.principal.filter(l => l.currency === 'USD').reduce((s, l) => s + l.amount, 0);
    check('compte A conserve son cash résiduel (~185 USD), pas vidé par la vente du compte B',
      approx(aUSD, 185, 5),
      `principal USD compte A: ${aUSD.toFixed(2)}`);
  }
})();

(function scenario4() {
  console.log('Scénario 4 — dividende traité comme profit, ne gonfle pas le principal');
  const d0 = runScenario([], {}).CASH_LOTS_BASELINE_DATE;
  const trades = [
    { type: 'Dividende', symbol: 'QYLD', accountType: 'TEST_ACCT_4', originalAmt: 50, originalCurrency: 'USD', currency: 'USD', size: 50, date: addDays(d0, 2) },
    { type: 'Dépôt', size: 685, originalAmt: 685, originalCurrency: 'USD', accountType: 'TEST_ACCT_4', date: addDays(d0, 1) },
  ];
  const { reconstructCashLots, _clAccountTotalCAD } = runScenario(trades, {});
  const { accounts } = reconstructCashLots(true);
  const acc = accounts['TEST_ACCT_4'];
  check('compte TEST_ACCT_4 existe', !!acc);
  if (acc) {
    const profitUSD = acc.profit.filter(l => l.currency === 'USD').reduce((s, l) => s + l.amount, 0);
    const principalUSD = acc.principal.filter(l => l.currency === 'USD').reduce((s, l) => s + l.amount, 0);
    check('le dividende (50 USD) est tracké en "profit", pas en "principal"',
      approx(profitUSD, 50, 0.5) && approx(principalUSD, 685, 0.5),
      `profit=${profitUSD.toFixed(2)}, principal=${principalUSD.toFixed(2)}`);
    check('le total du compte = dépôt + dividende (735 USD ≈ 1007 CAD)',
      approx(_clAccountTotalCAD(acc), 735 * 1.37, 2),
      `total=${_clAccountTotalCAD(acc).toFixed(2)} CAD`);
  }
})();

(function scenario5() {
  console.log('Scénario 5 — un achat en USD consomme le lot USD, pas le lot CAD (cas réel Cédric)');
  const d0 = runScenario([], {}).CASH_LOTS_BASELINE_DATE;
  const trades = [
    { type: 'Achat', symbol: 'TQQQ', shares: 4, size: 271.60, currency: 'USD', accountType: 'TEST_ACCT_5', date: addDays(d0, 2) },
    // Dépôt CAD ajouté AVANT le dépôt USD (même ordre que CASH_LOTS_SEED réel : CAD avant USD)
    // pour reproduire exactement le bug -- le pool CAD était consommé en premier juste parce
    // qu'il était plus ancien dans la file, peu importe la devise réellement dépensée.
    { type: 'Dépôt', size: 15000, originalAmt: 15000, originalCurrency: 'CAD', accountType: 'TEST_ACCT_5', date: addDays(d0, 1) },
    { type: 'Dépôt', size: 2500, originalAmt: 2500, originalCurrency: 'USD', accountType: 'TEST_ACCT_5', date: d0 },
  ];
  const { reconstructCashLots } = runScenario(trades, {});
  const { accounts } = reconstructCashLots(true);
  const acc = accounts['TEST_ACCT_5'];
  check('compte TEST_ACCT_5 existe', !!acc);
  if (acc) {
    const cadPrincipal = acc.principal.filter(l => l.currency === 'CAD').reduce((s, l) => s + l.amount, 0);
    const usdPrincipal = acc.principal.filter(l => l.currency === 'USD').reduce((s, l) => s + l.amount, 0);
    check('le lot CAD (15000) reste intact -- pas touché par un achat en USD',
      approx(cadPrincipal, 15000, 0.5),
      `CAD restant=${cadPrincipal.toFixed(2)}`);
    check('le lot USD (2500) est réduit du montant de l\'achat (271.60) -> ~2228.40',
      approx(usdPrincipal, 2500 - 271.60, 0.5),
      `USD restant=${usdPrincipal.toFixed(2)}`);
  }
})();

console.log(`\n${pass} passés, ${fail} échoués.`);
process.exit(fail > 0 ? 1 : 0);

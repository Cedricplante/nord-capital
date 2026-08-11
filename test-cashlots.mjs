// Prototype + tests pour la reconstruction du cash en lots (principal vs profit, par compte,
// chaine complete de provenance). Phase 1 -- lecture seule, ne touche a rien de live.

const FXRATES = { CADCAD:1, USDUSD:1, CADUSD: 1/1.35, USDCAD: 1.35 };
function fx(amount, fromCur, toCur) {
  if (fromCur === toCur) return amount;
  const key = fromCur + toCur;
  if (FXRATES[key] != null) return amount * FXRATES[key];
  throw new Error('taux FX manquant pour ' + key);
}

function makeAccountState() { return { principal: [], profit: [] }; }
function addLot(state, type, amount, currency, date, chain) {
  if (amount <= 0.0001) return;
  state[type].push({ amount, currency, date, chain: chain || [] });
}
function scaleFunding(funding, frac) {
  return funding.map(f => ({ ...f, amount: f.amount * frac }));
}
function uniqueChains(funding) {
  const seen = new Set(), out = [];
  funding.forEach(f => (f.chain || []).forEach(hop => {
    const k = hop.symbol + '|' + hop.date;
    if (!seen.has(k)) { seen.add(k); out.push(hop); }
  }));
  return out;
}
// Consomme `amountNeeded` (en `currency`) dans un compte, profit d'abord, plus ancien d'abord dans chaque type.
function consumeCash(state, amountNeeded, currency, fx) {
  let remaining = amountNeeded;
  const consumed = [];
  for (const type of ['profit', 'principal']) {
    const queue = state[type];
    while (remaining > 0.005 && queue.length) {
      const lot = queue[0];
      const lotValueInTarget = fx(lot.amount, lot.currency, currency);
      if (lotValueInTarget <= remaining + 0.005) {
        consumed.push({ type, amount: lot.amount, currency: lot.currency, date: lot.date, chain: lot.chain });
        remaining -= lotValueInTarget;
        queue.shift();
      } else {
        const fraction = remaining / lotValueInTarget;
        const partAmount = lot.amount * fraction;
        consumed.push({ type, amount: partAmount, currency: lot.currency, date: lot.date, chain: lot.chain });
        lot.amount -= partAmount;
        remaining = 0;
      }
    }
    if (remaining <= 0.005) break;
  }
  return { consumed, shortfall: Math.max(0, remaining) };
}

function reconstructCashLots(trades, fx) {
  const chrono = trades.slice().reverse();
  const accounts = {};
  const entryFunding = {}; // symbol -> [{shares, funding, account, currency}]  (FIFO comme les entries DCA)
  function acct(name) { const k = name || '—'; return accounts[k] || (accounts[k] = makeAccountState()); }

  chrono.forEach(t => {
    const account = t.accountType || t.account || '—';
    if (t.type === 'Dépôt') {
      const amt = (t.originalAmt != null && t.originalCurrency) ? t.originalAmt : t.size;
      const cur = t.originalCurrency || t.currency || 'CAD';
      addLot(acct(account), 'principal', amt, cur, t.date, []);
    } else if (t.type === 'Retrait') {
      const amt = (t.originalAmt != null && t.originalCurrency) ? t.originalAmt : t.size;
      const cur = t.originalCurrency || t.currency || 'CAD';
      consumeCash(acct(account), amt, cur, fx);
    } else if (t.type === 'Achat') {
      const amt = t.size, cur = t.currency || 'USD';
      const { consumed } = consumeCash(acct(account), amt, cur, fx);
      (entryFunding[t.symbol] = entryFunding[t.symbol] || []).push({ shares: t.shares, funding: consumed, account, currency: cur });
    } else if (t.type === 'Vente') {
      let sharesToClose = t.shares || 0;
      const list = entryFunding[t.symbol] || [];
      let returningFunding = [];
      while (sharesToClose > 0.000001 && list.length) {
        const e = list[0];
        if (e.shares <= sharesToClose + 0.000001) {
          returningFunding.push(...e.funding);
          sharesToClose -= e.shares;
          list.shift();
        } else {
          const frac = sharesToClose / e.shares;
          returningFunding.push(...scaleFunding(e.funding, frac));
          e.funding = scaleFunding(e.funding, (e.shares - sharesToClose) / e.shares);
          e.shares -= sharesToClose;
          sharesToClose = 0;
        }
      }
      const cur = t.currency || 'USD';
      const chainHop = { symbol: t.symbol, date: t.date };
      // Le capital qui revient (cost basis vendu) garde le type (principal/profit) de ce qui l'a
      // finance, mais sa chain s'allonge d'un cran : il a maintenant transite par ce symbole aussi.
      returningFunding.forEach(f => addLot(acct(account), f.type, f.amount, f.currency, t.date, [...f.chain, chainHop]));
      if (returningFunding.length === 0) {
        addLot(acct(account), 'principal', t.size, cur, t.date, []); // pas de funding retrace (donnee pre-migration)
      }
      const parentChains = uniqueChains(returningFunding);
      addLot(acct(account), 'profit', t.profit, cur, t.date, [...parentChains, chainHop]);
    }
  });
  return accounts;
}

function totalCAD(accounts, fx) {
  let total = 0;
  Object.values(accounts).forEach(state => {
    ['principal', 'profit'].forEach(type => {
      state[type].forEach(lot => { total += fx(lot.amount, lot.currency, 'CAD'); });
    });
  });
  return total;
}

// ── Tests ──
let pass = 0, fail = 0;
function ok(label, cond) { if (cond) { pass++; console.log('  OK   ' + label); } else { fail++; console.log('  FAIL ' + label); } }
function approx(a, b, eps = 0.01) { return Math.abs(a - b) < eps; }
// Les tests ecrivent leurs trades en ordre CHRONOLOGIQUE (plus lisible). Le vrai tableau trades[]
// de l'app est toujours stocke plus-recent-en-premier (unshift), et reconstructCashLots() fait
// .reverse() pour repasser en ordre chronologique -- donc on doit inverser nos tableaux de test
// AVANT de les passer, pour fidelement simuler le stockage reel.
function storageOrder(chronologicalTrades) { return chronologicalTrades.slice().reverse(); }

console.log('=== Test A : depot + achat + vente avec profit -- principal revient en principal, profit tague avec chain ===');
{
  const trades = [
    { date: '2026-01-01', type: 'Dépôt', account: 'CELI', accountType: 'CELI', size: 1000, currency: 'CAD', originalAmt: 1000, originalCurrency: 'CAD' },
    { date: '2026-01-05', type: 'Achat', symbol: 'AAA', account: 'CELI', shares: 100, size: 1000, currency: 'CAD' },
    { date: '2026-02-01', type: 'Vente', symbol: 'AAA', account: 'CELI', shares: 100, size: 1000, profit: 300, currency: 'CAD' },
  ];
  const accounts = reconstructCashLots(storageOrder(trades), fx);
  const celi = accounts['CELI'];
  ok('1 lot principal de 1000 (retour du capital)', celi.principal.length === 1 && approx(celi.principal[0].amount, 1000));
  ok('1 lot profit de 300', celi.profit.length === 1 && approx(celi.profit[0].amount, 300));
  ok('chain du profit = [{symbol:AAA}]', celi.profit[0].chain.length === 1 && celi.profit[0].chain[0].symbol === 'AAA');
  ok('total compte = 1300 (conservation)', approx(totalCAD(accounts, fx), 1300));
}

console.log('=== Test B : reinvestissement du profit -- achat suivant pige le profit en premier, chain multi-hop a la revente ===');
{
  const trades = [
    { date: '2026-01-01', type: 'Dépôt', accountType: 'CELI', size: 1000, currency: 'CAD', originalAmt: 1000, originalCurrency: 'CAD' },
    { date: '2026-01-05', type: 'Achat', symbol: 'AAA', account: 'CELI', shares: 100, size: 1000, currency: 'CAD' },
    { date: '2026-02-01', type: 'Vente', symbol: 'AAA', account: 'CELI', shares: 100, size: 1000, profit: 300, currency: 'CAD' },
    // Cash dispo CELI = 1000 principal + 300 profit. Achat de 300$ doit piger 100% dans le profit.
    { date: '2026-02-05', type: 'Achat', symbol: 'BBB', account: 'CELI', shares: 30, size: 300, currency: 'CAD' },
    { date: '2026-03-01', type: 'Vente', symbol: 'BBB', account: 'CELI', shares: 30, size: 300, profit: 150, currency: 'CAD' },
  ];
  const accounts = reconstructCashLots(storageOrder(trades), fx);
  const celi = accounts['CELI'];
  ok('principal intact a 1000 (jamais touche par achat BBB)', celi.principal.length === 1 && approx(celi.principal[0].amount, 1000));
  // Le retour de capital de BBB (300$) doit revenir comme PROFIT (car finance par du profit), chain = [AAA, BBB]
  const profitLots = celi.profit;
  const returned300 = profitLots.find(l => approx(l.amount, 300));
  ok('les 300$ de capital BBB reviennent tagues profit (finances par profit AAA)', !!returned300);
  ok('chain du retour BBB remonte a AAA puis BBB (2 hops)', returned300 && returned300.chain.length === 2 && returned300.chain[0].symbol === 'AAA' && returned300.chain[1].symbol === 'BBB');
  const newProfit150 = profitLots.find(l => approx(l.amount, 150));
  ok('nouveau profit de 150$ sur BBB, chain = AAA -> BBB', newProfit150 && newProfit150.chain.length === 2 && newProfit150.chain[1].symbol === 'BBB');
  ok('total compte = 1450 (1000 + 300 + 150, conservation)', approx(totalCAD(accounts, fx), 1450));
}

console.log('=== Test C : retrait consomme le profit avant le principal ===');
{
  const trades = [
    { date: '2026-01-01', type: 'Dépôt', accountType: 'REER', size: 5000, currency: 'CAD', originalAmt: 5000, originalCurrency: 'CAD' },
    { date: '2026-01-05', type: 'Achat', symbol: 'CCC', account: 'REER', shares: 100, size: 5000, currency: 'CAD' },
    { date: '2026-02-01', type: 'Vente', symbol: 'CCC', account: 'REER', shares: 100, size: 5000, profit: 1000, currency: 'CAD' },
    { date: '2026-02-10', type: 'Retrait', accountType: 'REER', size: 400, currency: 'CAD', originalAmt: 400, originalCurrency: 'CAD' },
  ];
  const accounts = reconstructCashLots(storageOrder(trades), fx);
  const reer = accounts['REER'];
  ok('principal toujours a 5000 apres le retrait (retrait < profit dispo)', approx(reer.principal[0].amount, 5000));
  ok('profit reduit a 600 (1000-400)', approx(reer.profit.reduce((s, l) => s + l.amount, 0), 600));
  ok('total compte = 5600 (6000 - 400 retrait, conservation)', approx(totalCAD(accounts, fx), 5600));
}

console.log('=== Test D : cash insuffisant -> shortfall detecte (pour futur blocage a l\'achat) ===');
{
  const state = makeAccountState();
  addLot(state, 'principal', 500, 'CAD', '2026-01-01', []);
  const { consumed, shortfall } = consumeCash(state, 2000, 'CAD', fx);
  ok('500 consomme, 1500 de manque detecte', approx(consumed.reduce((s, c) => s + c.amount, 0), 500) && approx(shortfall, 1500));
}

console.log('=== Test E : multi-devises (achat USD finance par cash CAD) ===');
{
  const trades = [
    { date: '2026-01-01', type: 'Dépôt', accountType: 'Comptant', size: 1350, currency: 'CAD', originalAmt: 1350, originalCurrency: 'CAD' },
    // Achat USD de 1000$ US = ~1350 CAD au taux 1.35 -> doit consommer tout le lot CAD
    { date: '2026-01-05', type: 'Achat', symbol: 'DDD', account: 'Comptant', shares: 50, size: 1000, currency: 'USD' },
  ];
  const accounts = reconstructCashLots(storageOrder(trades), fx);
  const comptant = accounts['Comptant'];
  ok('lot CAD consomme en totalite par achat USD equivalent', comptant.principal.length === 0);
}

console.log(`\n=== Resultat : ${pass} passes, ${fail} echoues ===`);
process.exit(fail > 0 ? 1 : 0);

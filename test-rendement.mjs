// Test harness pour getClosedAssetReturns() — copie exacte du code de index.html (commit e5a17dc)
// Objectif : vérifier qu'un DCA (plusieurs achats) suivi de ventes partielles produit un
// rendement pondéré proportionnel et juste, sans compounding artificiel.

let accountCurrency = 'USD', fxRate = 1;
const liveFxRates = {};
const FX_FALLBACK = { CAD: 1.35 };

function toUSD(amount, posCur) {
  const pc = posCur || 'USD';
  if (pc === 'USD') return amount;
  if (pc === accountCurrency && fxRate && fxRate !== 1) return amount / fxRate;
  if (liveFxRates[pc]) return amount * liveFxRates[pc];
  return amount / (FX_FALLBACK[pc] || 1);
}
function tickerCurrency(symbol) {
  return (symbol || '').toUpperCase().endsWith('.TO') ? 'CAD' : null;
}
function getTradeCurrency(t) { return tickerCurrency(t.symbol) || t.currency || 'USD'; }

function getClosedAssetReturns(positions, trades) {
  const openSymbols = new Set(positions.map(p => p.symbol));
  const bySymbol = {};
  trades.forEach(t => {
    if (t.type !== 'Achat' && t.type !== 'Vente') return;
    (bySymbol[t.symbol] = bySymbol[t.symbol] || []).push(t);
  });
  const rows = [];
  Object.keys(bySymbol).forEach(sym => {
    if (openSymbols.has(sym)) return;
    let sumProfitUSD = 0, sumSizeUSD = 0, sellCount = 0;
    bySymbol[sym].forEach(t => {
      if (t.type !== 'Vente') return;
      const cur = getTradeCurrency(t);
      sumProfitUSD += toUSD(t.profit || 0, cur);
      sumSizeUSD += toUSD(t.size || 0, cur);
      sellCount++;
    });
    if (sumSizeUSD <= 0) return;
    rows.push({
      symbol: sym,
      tradeCount: sellCount,
      capitalCAD: sumSizeUSD * fxRate,
      profitCAD: sumProfitUSD * fxRate,
      pct: (sumProfitUSD / sumSizeUSD) * 100,
    });
  });
  rows.sort((a, b) => b.profitCAD - a.profitCAD);
  return rows;
}

let pass = 0, fail = 0;
function approx(a, b, eps = 0.01) { return Math.abs(a - b) < eps; }
function assertEq(label, actual, expected, eps = 0.01) {
  if (approx(actual, expected, eps)) {
    pass++;
    console.log(`  OK   ${label} -> ${actual.toFixed(4)}`);
  } else {
    fail++;
    console.log(`  FAIL ${label} -> attendu ${expected.toFixed(4)}, obtenu ${actual.toFixed(4)}`);
  }
}
function achat(symbol, price, shares, size, date) {
  return { date, symbol, type: 'Achat', price, shares, size, currency: 'USD' };
}
function vente(symbol, price, shares, size, profit, date) {
  return { date, symbol, type: 'Vente', price, shares, size, profit, currency: 'USD' };
}

console.log('=== Test 1 : DCA (2 achats) + 1 seule vente complete ===');
{
  const trades = [
    achat('AAA', 10, 100, 1000, '2026-01-01'),
    achat('AAA', 20, 100, 2000, '2026-01-05'),
    vente('AAA', 18, 200, 3000, 600, '2026-02-01'),
  ];
  const rows = getClosedAssetReturns([], trades);
  assertEq('capital investi', rows[0].capitalCAD, 3000);
  assertEq('profit $', rows[0].profitCAD, 600);
  assertEq('rendement %', rows[0].pct, 20);
}

console.log('=== Test 2 : DCA (1 achat) + 6 ventes partielles le meme jour (cas SOXL reel) ===');
{
  const buy = achat('SOXL', 10, 600, 6000, '2026-01-01');
  const sells = [
    vente('SOXL', 15, 100, 1000, 500, '2026-03-01'),
    vente('SOXL', 18, 100, 1000, 800, '2026-03-01'),
    vente('SOXL', 22, 100, 1000, 1200, '2026-03-01'),
    vente('SOXL', 25, 100, 1000, 1500, '2026-03-02'),
    vente('SOXL', 20, 100, 1000, 1000, '2026-03-02'),
    vente('SOXL', 12, 100, 1000, 200, '2026-03-02'),
  ];
  const trades = [buy, ...sells];
  const rows = getClosedAssetReturns([], trades);
  const sumProfit = 500 + 800 + 1200 + 1500 + 1000 + 200;
  const sumSize = 6000;
  assertEq('capital investi', rows[0].capitalCAD, sumSize);
  assertEq('profit $', rows[0].profitCAD, sumProfit);
  assertEq('rendement % (moyenne ponderee attendue)', rows[0].pct, (sumProfit / sumSize) * 100);
  const wouldBeCompound = (1.5 * 1.8 * 2.2 * 2.5 * 2 * 1.2 - 1) * 100;
  console.log(`  (compounding aurait donne ${wouldBeCompound.toFixed(0)}% -- bien plus eleve, non utilise)`);
  if (rows[0].pct < wouldBeCompound) { pass++; console.log('  OK   rendement pondere << compounding'); }
  else { fail++; console.log('  FAIL rendement pondere devrait etre tres inferieur au compounding'); }
}

console.log('=== Test 3 : proportionnalite -- grosse tranche perdante + petite tranche gagnante ===');
{
  const trades = [
    achat('BBB', 10, 1000, 10000, '2026-01-01'),
    vente('BBB', 9, 900, 9000, -900, '2026-02-01'),
    vente('BBB', 30, 100, 1000, 2000, '2026-02-02'),
  ];
  const rows = getClosedAssetReturns([], trades);
  const sumProfit = -900 + 2000;
  const sumSize = 10000;
  assertEq('capital investi', rows[0].capitalCAD, sumSize);
  assertEq('profit $', rows[0].profitCAD, sumProfit);
  assertEq('rendement % pondere (11%, pas la moyenne simple -10%/+200%=95%)', rows[0].pct, 11);
}

console.log('=== Test 4 : 2 campagnes distinctes (sortie complete puis re-entree) -- pas de compounding entre elles ===');
{
  const trades = [
    achat('CCC', 10, 100, 1000, '2026-01-01'),
    vente('CCC', 15, 100, 1000, 500, '2026-01-10'),
    achat('CCC', 20, 200, 4000, '2026-02-01'),
    vente('CCC', 16, 200, 4000, -800, '2026-02-10'),
  ];
  const rows = getClosedAssetReturns([], trades);
  const sumProfit = 500 - 800;
  const sumSize = 1000 + 4000;
  assertEq('capital investi total (2 campagnes)', rows[0].capitalCAD, sumSize);
  assertEq('profit $ total', rows[0].profitCAD, sumProfit);
  assertEq('rendement % pondere (-6%, pas compounding=+20%)', rows[0].pct, -6);
}

console.log('=== Test 5 : position encore ouverte -> exclue du tableau ===');
{
  const trades = [
    achat('DDD', 10, 100, 1000, '2026-01-01'),
    vente('DDD', 15, 50, 500, 250, '2026-01-10'),
  ];
  const positions = [{ symbol: 'DDD', shares: 50 }];
  const rows = getClosedAssetReturns(positions, trades);
  if (rows.length === 0) { pass++; console.log('  OK   position ouverte exclue du tableau'); }
  else { fail++; console.log('  FAIL position ouverte ne devrait pas apparaitre, obtenu:', rows); }
}

console.log('=== Test 6 : plusieurs actifs, tries par profit $ decroissant ===');
{
  const trades = [
    achat('WIN', 10, 100, 1000, '2026-01-01'),
    vente('WIN', 20, 100, 1000, 1000, '2026-01-10'),
    achat('LOSE', 10, 100, 1000, '2026-01-01'),
    vente('LOSE', 5, 100, 1000, -500, '2026-01-10'),
  ];
  const rows = getClosedAssetReturns([], trades);
  if (rows[0].symbol === 'WIN' && rows[1].symbol === 'LOSE') { pass++; console.log('  OK   tri par profit $ decroissant (WIN avant LOSE)'); }
  else { fail++; console.log('  FAIL ordre incorrect:', rows.map(r => r.symbol)); }
}

console.log(`\n=== Resultat : ${pass} passes, ${fail} echoues ===`);
process.exit(fail > 0 ? 1 : 0);

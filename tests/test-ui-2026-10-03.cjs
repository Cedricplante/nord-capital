// Tests de la session 2026-10-03 : fusion des anciens noms de compte (bug retrait Comptant),
// positions groupées par classe, variation de période, % à 1 décimale, onglet Ledger.
const {load}=require('./harness.cjs');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
const near=(a,b,t=0.011)=>Math.abs(a-b)<=t;
// ---- 1. Vente taguée 'Comptant' (ancien nom) -> atterrit dans 'Comptant (CAD)'
{
  const w=load();const E=s=>w.eval(s);
  E(`trades=[
    {date:'2026-08-14',symbol:'ZMMK.TO',type:'Vente',shares:60,size:2994.39,profit:-1.52,currency:'CAD',accountType:'Comptant'},
    {date:'2026-08-03',symbol:'CASH',type:'Dépôt',size:105.88,originalAmt:105.88,originalCurrency:'CAD',accountType:'Comptant (CAD)',currency:'CAD'},
    {date:'2026-07-30',symbol:'ZMMK.TO',type:'Dividende',size:5.7,originalAmt:5.7,originalCurrency:'CAD',currency:'CAD',accountType:'Comptant'}
  ];positions=[];`);
  const accts=E('Object.keys(reconstructCashLots(true).accounts)');
  ok(!accts.includes('Comptant'),'plus de compte fantôme « Comptant » : '+accts.join(', '));
  const tot=E(`_clAccountTotalCAD(reconstructCashLots(true).accounts['Comptant (CAD)'])`);
  ok(near(tot,105.88+2994.39+5.7-1.52),'Comptant (CAD) = 3104.45 -> '+tot.toFixed(2));
  // Retrait de 2994 CAD maintenant accepté
  E(`document.getElementById('cash-input').value='2994';document.getElementById('cash-currency-input').value='CAD';document.getElementById('cash-date').value='2026-10-02';document.getElementById('cash-account-type').value='Comptant (CAD)';cashType='retrait';saveData=async()=>true;`);
  E('__r=updateCash()');
  ok(!w.__alerts.some(a=>/bloqué/.test(a)),'retrait 2994 CAD de Comptant (CAD) accepté (alerts: '+JSON.stringify(w.__alerts)+')');
  ok(E("trades[0].type")==='Retrait','retrait enregistré');
  // USD legacy -> (USD)
  E(`trades=[{date:'2026-09-01',symbol:'AAPL',type:'Vente',shares:1,size:100,profit:10,currency:'USD',accountType:'CELI'}];`);
  ok(E(`Object.keys(reconstructCashLots(true).accounts).includes('CELI (USD)')`),'vente USD taguée « CELI » -> CELI (USD)');
}
// ---- 2. Positions groupées par classe, tri croissant, sous-totaux
{
  const w=load();const E=s=>w.eval(s);
  E(`trades=[];positions=[
    {symbol:'TQQQ',dir:'Long',shares:10,avgEntry:50,current:60,currency:'USD',account:'CELIAPP (USD)',entries:[{date:'2026-09-01',price:50,shares:10,size:500}]},
    {symbol:'SOXL',dir:'Long',shares:100,avgEntry:20,current:25,currency:'USD',account:'CELIAPP (USD)',entries:[{date:'2026-09-01',price:20,shares:100,size:2000}]},
    {symbol:'NVDA',dir:'Long',shares:2,avgEntry:100,current:120,currency:'USD',account:'CELIAPP (USD)',entries:[{date:'2026-09-01',price:100,shares:2,size:200}]}
  ];sortColumn=null;renderPosTable();`);
  const heads=E(`[...document.querySelectorAll('#pos-body tr.pos-class-head')].map(r=>r.textContent)`);
  ok(heads.length>=2,'titres de section : '+heads.join(' | '));
  const subs=E(`document.querySelectorAll('#pos-body tr.pos-class-sub').length`);
  ok(subs===heads.length,'un sous-total par section');
  // ordre croissant dans ETF Levier : TQQQ (600) avant SOXL (2500)
  const syms=E(`[...document.querySelectorAll('#pos-body tr')].map(r=>r.querySelector('td.sym')?.textContent||r.className)`);
  const iT=syms.findIndex(s=>/^TQQQ/.test(s)),iS=syms.findIndex(s=>/^SOXL/.test(s));
  ok(iT>=0&&iS>iT,'tri croissant market value (TQQQ avant SOXL) : '+syms.join(','));
  ok(E(`document.querySelector('#pos-body').textContent.includes('Poids portefeuille')&&document.querySelector('#pos-body').textContent.includes('Poids dans la classe')`),'sous-total affiche poids portefeuille + poids dans la classe');
  ok(!E(`document.querySelector('thead').textContent.includes('ACB')`),'colonne ACB $CA retirée');
  const cols=E(`document.querySelector('#tab-positions thead tr').children.length`);
  const rowCols=E(`(()=>{const r=[...document.querySelectorAll('#pos-body tr')].find(r=>r.querySelector('td.sym')&&!r.className);let n=0;[...r.children].forEach(td=>n+=td.colSpan||1);return n;})()`);
  ok(cols===15&&rowCols===15,'15 colonnes en-tête = 15 colonnes ligne ('+cols+'/'+rowCols+')');
  const subCols=E(`(()=>{const r=document.querySelector('#pos-body tr.pos-class-sub');let n=0;[...r.children].forEach(td=>n+=td.colSpan||1);return n;})()`);
  ok(subCols===15,'sous-total = 15 colonnes ('+subCols+')');
  ok(!/\d,\d\d\s?%/.test(E(`document.querySelector('#pos-body').textContent`)),'aucun % à 2 décimales dans Positions');
}
// ---- 3. Variation de période
{
  const w=load();const E=s=>w.eval(s);
  E(`trades=[{date:'2026-09-15',symbol:'CASH',type:'Dépôt',size:1000,originalAmt:1000,originalCurrency:'CAD'}];activePeriod='1M';benchmarkMode='absolute';chartCurrency='CAD';`);
  E(`renderPerfVariation([{date:'2026-09-03',value:10000},{date:'2026-10-03',value:11500}],new Map(),10000,1)`);
  const t=E(`document.getElementById('perf-variation').textContent`);
  ok(/\+\s?500/.test(t.replace(/ | /g,' ')),'$ net des dépôts : 11500-10000-1000 = +500 -> '+t);
  E(`benchmarkMode='relative'`);
  E(`renderPerfVariation([{date:'2026-09-03',value:10000},{date:'2026-10-03',value:11000}],new Map([['2026-09-03',{f:1,base:10000}],['2026-10-03',{f:1,base:10000}]]),10000,1)`);
  ok(/\+10,0|\+10\.0/.test(E(`document.getElementById('perf-variation').textContent`)),'% : +10.0 % -> '+E(`document.getElementById('perf-variation').textContent`));
}
// ---- 4. Ledger
{
  const w=load();const E=s=>w.eval(s);
  ok(E(`!!document.querySelector('#tab-ledger #hist-body')`),'registre dans l’onglet Ledger');
  ok(E(`!document.querySelector('#tab-historique #hist-body')`),'registre retiré de Historique');
  ok(E(`!!document.querySelector('#tab-ledger #filter-month')`),'filtres mois/actif dans Ledger');
  ok(E(`fmtPct(12.345)`)==='+12.3%','fmtPct à 1 décimale');
}
console.log(fails?`\n${fails} ÉCHEC(S)`:'\nTOUT PASSE');process.exitCode=fails?1:0;

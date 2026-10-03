// Tests internes (2026-10-01) : financement multi-comptes, Tout le cash, poids, ventes au coût moyen, dates, annulation.
// Exécuter : npm i jsdom@24 (une fois, hors repo ou dans /tmp) puis NODE_PATH=<node_modules> node tests/test-transactions.cjs
const {load}=require('./harness.cjs');
const w=load();const E=s=>w.eval(s);
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
const near=(a,b,t=0.011)=>Math.abs(a-b)<=t;
const bal=(acct,cur)=>E(`(()=>{const st=reconstructCashLots(true).accounts[${JSON.stringify(acct)}];return st?[...st.principal,...st.profit].filter(l=>l.currency==='${cur}').reduce((s,l)=>s+l.amount,0):0})()`);
const setForm=(o)=>{for(const[k,v]of Object.entries(o))E(`document.getElementById('${k}').value=${JSON.stringify(String(v))}`);E('calcMontant()');};
const buy=(o,funding)=>{E('resetFundingState()');setForm({'f-date':'2026-09-29','f-dir':'Long',...o});
  if(funding){E(`fundingTouched=true;fundingOrder=${JSON.stringify(funding.order)};fundingManual=${JSON.stringify(funding.manual||{})}`);}
  const n0=E('trades.length');E('__p=addPosition()');return E('trades.length')>n0;};
E('var __p');
// ---- Baseline
ok(near(bal('CELIAPP (USD)','USD'),2516.18),'seed CELIAPP (USD) = 2516.18 USD');
ok(near(bal('CELIAPP (CAD)','CAD'),15415.43),'seed CELIAPP (CAD) = 15415.43 CAD');
// ---- B: défaut = compte de détention
ok(buy({'f-symbol':'TQQQ','f-entry':100,'f-shares':10,'f-current':100,'f-currency':'USD','f-account':'CELIAPP (USD)'}),'B achat TQQQ 1000 USD accepté');
ok(near(bal('CELIAPP (USD)','USD'),1516.18),'B CELIAPP (USD) débité de 1000 USD -> 1516.18');
ok(near(bal('CELIAPP (CAD)','CAD'),15415.43),'B CELIAPP (CAD) intact');
const t0=E('trades[0]');ok(t0.funding&&t0.funding.length===1&&t0.funding[0].account==='CELIAPP (USD)','B trade.funding enregistré');
// ---- C: financé par un autre compte (CAD -> achat USD), taux figé
ok(buy({'f-symbol':'SOXL','f-entry':20,'f-shares':100,'f-current':20,'f-currency':'USD','f-account':'CELIAPP (USD)'},{order:['CELIAPP (CAD)']}),'C achat SOXL 2000 USD financé par CELIAPP (CAD)');
ok(near(bal('CELIAPP (CAD)','CAD'),15415.43-2700),'C CELIAPP (CAD) débité de 2700 CAD (2000×1.35)');
ok(near(bal('CELIAPP (USD)','USD'),1516.18),'C CELIAPP (USD) intact');
E('fxRate=1.40');ok(near(bal('CELIAPP (CAD)','CAD'),15415.43-2700),'C débit CAD figé même si le FX bouge (1.40)');E('fxRate=1.35');
// ---- D: multi-comptes auto (ordre USD puis CAD)
ok(buy({'f-symbol':'NVDA','f-entry':150,'f-shares':20,'f-current':150,'f-currency':'USD','f-account':'CELIAPP (USD)'},{order:['CELIAPP (USD)','CELIAPP (CAD)']}),'D achat NVDA 3000 USD combinant USD + CAD');
ok(near(bal('CELIAPP (USD)','USD'),0),'D CELIAPP (USD) vidé');
ok(near(bal('CELIAPP (CAD)','CAD'),15415.43-2700-(3000-1516.18)*1.35,0.02),'D reste prélevé dans CELIAPP (CAD)');
const fD=E('trades[0].funding');ok(fD.length===2&&near(fD[0].amount,1516.18)&&near(fD[1].amount,1483.82),'D répartition #1 vidé puis #2 = '+JSON.stringify(fD.map(f=>f.amount)));
// ---- E: insuffisant -> bloqué
E('__alerts.length=0');
ok(!buy({'f-symbol':'AAPL','f-entry':100,'f-shares':100,'f-current':100,'f-currency':'USD','f-account':'CELI (USD)'}),'E achat 10000 USD dans CELI (USD) (22 USD dispo) bloqué');
ok(E('__alerts').some(a=>/insuffisant/.test(a)),'E message cash insuffisant affiché');
// ---- G: montants manuels incohérents -> bloqué ; cohérents -> OK
E('__alerts.length=0');
ok(!buy({'f-symbol':'VFV.TO','f-entry':100,'f-shares':10,'f-current':100,'f-account':'CELIAPP (CAD)'},{order:['CELIAPP (CAD)','CELI (CAD)'],manual:{'CELIAPP (CAD)':900,'CELI (CAD)':200}}),'G manuels 900+200 > 1000 bloqué');
ok(buy({'f-symbol':'VFV.TO','f-entry':100,'f-shares':10,'f-current':100,'f-account':'CELIAPP (CAD)'},{order:['CELIAPP (CAD)','CELI (CAD)'],manual:{'CELI (CAD)':40}}),'G manuel CELI (CAD)=40, reste auto 960 OK');
ok(near(bal('CELI (CAD)','CAD'),2),'G CELI (CAD) 42-40 = 2');
// ---- F: Tout le cash
E('resetFundingState()');setForm({'f-symbol':'XEQT.TO','f-entry':30,'f-shares':'','f-current':30,'f-account':'CELI (CAD)'});
E('useAllFundingCash()');ok(E("document.getElementById('f-shares').value")==='0'||E('__alerts').some(a=>/insuffisant pour 1/.test(a)),'F tout le cash: 2 CAD < 1 unité à 30 -> alerte');
E('__alerts.length=0;resetFundingState()');setForm({'f-symbol':'BTC/USD','f-entry':60000,'f-shares':'','f-current':60000,'f-currency':'USD','f-account':'CELIAPP (CAD)'});
E('useAllFundingCash()');const sh=parseFloat(E("document.getElementById('f-shares').value")),sz=parseFloat(E("document.getElementById('f-size').value"));
const availUSD=bal('CELIAPP (CAD)','CAD')/1.35;
ok(sh>0&&sz<=availUSD+0.001&&availUSD-sz<0.07,`F tout le cash crypto fractionnaire: ${sh} BTC = ${sz} USD (dispo ${availUSD.toFixed(2)})`);
ok(E('(__p=addPosition(),trades[0].symbol)')==='BTC/USD','F achat tout le cash accepté');
ok(bal('CELIAPP (CAD)','CAD')<0.1,'F CELIAPP (CAD) vidé ('+bal('CELIAPP (CAD)','CAD').toFixed(4)+')');
// ---- H: ventes -> cash rendu au compte de détention, en devise de la vente
E("closeTarget=positions.findIndex(p=>p.symbol==='NVDA');document.getElementById('modal-exit').value='165';document.getElementById('modal-shares').value='20';");
E('__p=confirmClose()');
ok(near(bal('CELIAPP (USD)','USD'),3300),'H vente NVDA 20@165 -> 3300 USD dans CELIAPP (USD) (coût 3000 + profit 300) = '+bal('CELIAPP (USD)','USD').toFixed(2));
// DCA à prix différents puis vente partielle
ok(buy({'f-symbol':'TQQQ','f-entry':120,'f-shares':10,'f-current':120,'f-currency':'USD','f-account':'CELIAPP (USD)'}),'H DCA TQQQ 10@120');
const before=bal('CELIAPP (USD)','USD');
E("closeTarget=positions.findIndex(p=>p.symbol==='TQQQ');document.getElementById('modal-exit').value='110';document.getElementById('modal-shares').value='10';");
E('__p=confirmClose()');
ok(near(bal('CELIAPP (USD)','USD')-before,1100),'H vente partielle DCA 10@110 (moy 110) rend exactement 1100 USD: +'+(bal('CELIAPP (USD)','USD')-before).toFixed(2));
// Vente perdante
const b2=bal('CELIAPP (USD)','USD');
E("closeTarget=positions.findIndex(p=>p.symbol==='TQQQ');document.getElementById('modal-exit').value='90';document.getElementById('modal-shares').value='10';");
E('__p=confirmClose()');
ok(near(bal('CELIAPP (USD)','USD')-b2,900),'H vente perdante 10@90 (moy 110) rend 900 USD: +'+(bal('CELIAPP (USD)','USD')-b2).toFixed(2));
// ---- I: trade legacy sans funding
E(`trades.unshift({date:'2026-09-30',symbol:'MSFT',dir:'Long',type:'Achat',price:100,shares:1,size:100,currency:'USD',account:'CELIAPP (USD)'})`);
ok(near(bal('CELIAPP (USD)','USD'),b2+900-100),'I achat legacy (sans funding) toujours débité du compte de détention');
E('trades.shift()');
// ---- J: chaque compte du formulaire
const accts=E(`[...document.querySelectorAll('#f-account option')].map(o=>o.value).filter(Boolean)`);
let jFail=[];
for(const a of accts){
  E(`trades.unshift({date:'2026-09-30',symbol:'CASH',dir:'—',type:'Dépôt',price:0,size:1000,profit:0,currency:'CAD',originalAmt:1000,originalCurrency:'CAD',accountType:${JSON.stringify(a)}})`);
  const tot=()=>E(`(()=>{const st=reconstructCashLots(true).accounts[${JSON.stringify(a)}];return st?_clAccountTotalCAD(st):0})()`);
  const b=tot();
  const accepted=buy({'f-symbol':'ZZZ.TO','f-entry':10,'f-shares':50,'f-current':10,'f-account':a});
  const after=tot();
  if(!accepted||!near(b-after,500))jFail.push(a+` (${b}->${after}, accepted=${accepted})`);
}
ok(jFail.length===0,`J ${accts.length} comptes: dépôt 1000 CAD puis achat 500 CAD débite bien chaque compte`+(jFail.length?' -> '+jFail.join('; '):''));
// ---- Cash global = somme des comptes
E('syncCashFromLots()');
const sum=E(`Object.values(reconstructCashLots(true).accounts).reduce((s,st)=>s+_clAccountTotalCAD(st),0)`);
ok(near(E('cash'),sum),'cash global = Σ comptes');
// ---- A: poids
E('positions.forEach(p=>p.current=p.avgEntry*1.07);renderPosTable()');
const wt=E('computeWeightTotals()');
const r2=v=>Math.round(v*100)/100;
ok(r2(wt.posWeight.reduce((a,b)=>a+b,0)+wt.cashWeight.reduce((a,b)=>a+b,0))===100,'A Σ Poids pos. (positions + lignes cash) = 100,00 %');
const kpiTotal=E('getTotalSizeUSD()*fxRate+cash');ok(near(wt.total,kpiTotal,0.02),`A dénominateur ${wt.total.toFixed(2)} = KPI valeur totale ${kpiTotal.toFixed(2)}`);
const per={};E('positions').forEach((p,i)=>{const c=E(`getWeightClass(${JSON.stringify(p.symbol)})`);per[c]=(per[c]||0)+wt.posClassWeight[i];});
wt.cashClassWeight.forEach(v=>per.Cash=(per.Cash||0)+v);
ok(Object.values(per).every(v=>r2(v)===100),'A chaque classe somme à 100,00 % : '+JSON.stringify(Object.fromEntries(Object.entries(per).map(([k,v])=>[k,r2(v)]))));
ok(r2(wt.classSummary.reduce((s,c)=>s+c.weight,0))===100,'A récap des classes = 100,00 %');
const foot=E("document.getElementById('pos-foot').textContent.replace(/\\s+/g,' ')");
ok(/100,0\s?%/.test(foot),'A pied de tableau affiche le total 100,0 % : '+foot.slice(0,160));
// CASH.TO dans classe Cash
E(`positions.push({symbol:'CASH.TO',dir:'Long',avgEntry:50,current:50,shares:10,totalSize:500,currency:'CAD',account:'CELIAPP (CAD)',entries:[]})`);
ok(E("getWeightClass('CASH.TO')")==='Cash','A CASH.TO classé Cash');
const wt2=E('computeWeightTotals()');ok(r2(wt2.posWeight.reduce((a,b)=>a+b,0)+wt2.cashWeight.reduce((a,b)=>a+b,0))===100,'A Σ=100 % avec CASH.TO');
// Rendering doesn't throw
try{E('renderAll()');ok(true,'renderAll() sans erreur');}catch(e){ok(false,'renderAll() erreur: '+e.message);}
const rows=E("document.querySelectorAll('#pos-body tr.pos-cash-row').length");ok(rows>0,'lignes CASH affichées: '+rows);
// Filtre compte
E("document.getElementById('pos-filter-account').value='CELIAPP (USD)';renderPosTable()");
ok(/TOTAL \(filtré\)/.test(E("document.getElementById('pos-foot').textContent")),'filtre -> TOTAL (filtré)');
// ---- K: date de vente + survente
E(`positions.push({symbol:'KTEST',dir:'Long',avgEntry:10,current:12,shares:5,totalSize:50,currency:'USD',account:'CELIAPP (USD)',entries:[{price:10,shares:5,size:50,date:'2026-09-28'}]})`);
E("closeTarget=positions.length-1;document.getElementById('modal-exit').value='12';document.getElementById('modal-shares').value='6';document.getElementById('modal-date').value='2026-09-29';__alerts.length=0;");
const nT=E('trades.length');E('__p=confirmClose()');ok(E('trades.length')===nT&&E('__alerts').some(a=>/ne détiens que/.test(a)),'K survente (6 > 5) bloquée');
E("closeTarget=positions.length-1;document.getElementById('modal-shares').value='5';document.getElementById('modal-date').value='2026-09-29';");
E('__p=confirmClose()');ok(E('trades[0].date')==='2026-09-29'&&E('trades[0].type')==='Vente','K vente datée du 2026-09-29 (champ date respecté)');
// Dépôt via le vrai modal
E("setCashType('depot');document.getElementById('cash-input').value='250';document.getElementById('cash-currency-input').value='USD';document.getElementById('cash-account-type').value='CELI (USD)';document.getElementById('cash-date').value='2026-09-28';");
const c0=bal('CELI (USD)','USD');E('__p=updateCash()');
ok(near(bal('CELI (USD)','USD')-c0,250)&&E('trades[0].date')==='2026-09-28','K dépôt 250 USD daté 2026-09-28 via modal');
console.log(fails?`\n${fails} ÉCHEC(S)`:'\nTOUT PASSE');
// ---- U: undo
(async()=>{
 const nT=E('trades.length'),nP=E('positions.length'),c=E('cash');
 buy({'f-symbol':'UNDO','f-entry':1,'f-shares':5,'f-current':1,'f-currency':'USD','f-account':'CELI (USD)'});
 ok(E('trades.length')===nT+1,'U achat ajouté');
 await E('undoLast()');
 ok(E('trades.length')===nT&&E('positions.length')===nP&&near(E('cash'),c),'U annuler restaure trades/positions/cash');
 console.log(fails?`\n${fails} ÉCHEC(S) (final)`:'\nTOUT PASSE (final)');
})();

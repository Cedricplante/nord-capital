// Tests refonte visuelle 2026-10-03 (soir) : Ledger par mois, filtre type, Positions
// (en-tête de classe vs sous-total), pie Cash vs Positions rouge/bleu, fiche du gestionnaire.
const {load}=require('./harness.cjs');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
// ---- 1. Ledger : sections mois + année, tri chronologique, filtre type
{
  const w=load();const E=s=>w.eval(s);
  E(`trades=[
    {date:'2026-08-03',symbol:'CASH',type:'Dépôt',size:2000,originalAmt:2000,originalCurrency:'CAD',accountType:'CELI (CAD)',currency:'CAD'},
    {date:'2026-10-01',symbol:'TSLA',type:'Achat',price:300,shares:1,size:300,currency:'USD'},
    {date:'2026-08-20',symbol:'SOXL',type:'Vente',price:30,avgEntry:20,shares:10,size:200,profit:100,currency:'USD'},
    {date:'2025-12-15',symbol:'NVDA',type:'Achat',price:100,shares:1,size:100,currency:'USD'}
  ];positions=[];renderHistory();`);
  const months=E(`[...document.querySelectorAll('#hist-body tr.ledger-month .ledger-month-name')].map(e=>e.textContent)`);
  ok(JSON.stringify(months)===JSON.stringify(['Octobre2026','Août2026','Décembre2025']),'sections mois+année dans l\'ordre : '+months.join(' | '));
  const rowsAfterAug=E(`(()=>{const r=[...document.querySelectorAll('#hist-body tr')];const i=r.findIndex(x=>x.textContent.includes('Août'));return r.slice(i+1,i+3).map(x=>x.children[0].textContent);})()`);
  ok(rowsAfterAug[0]==='2026-08-20'&&rowsAfterAug[1]==='2026-08-03','tri décroissant dans le mois : '+rowsAfterAug.join(','));
  ok(E(`document.querySelector('#hist-body tr.ledger-month').nextElementSibling.nextElementSibling.className`)==='ledger-month','1 transaction en octobre puis nouvelle section');
  ok(/P&L réalisé/.test(E(`[...document.querySelectorAll('#hist-body tr.ledger-month')][1].textContent`)),'résumé du mois avec P&L réalisé');
  E(`document.getElementById('filter-type').value='Vente';renderHistory();`);
  ok(E(`document.querySelectorAll('#hist-body tr:not(.ledger-month)').length`)===1,'filtre type = Vente -> 1 ligne');
  E(`resetFilters()`);
  ok(E(`document.getElementById('filter-type').value`)===''&&E(`document.querySelectorAll('#hist-body tr:not(.ledger-month)').length`)===4,'réinitialiser vide aussi le filtre type');
  ok(E(`[...document.getElementById('filter-month').options].map(o=>o.textContent).includes('Août 2026')`),'options du filtre mois en clair (Août 2026)');
}
// ---- 2. Positions : en-tête et sous-total distincts
{
  const w=load();const E=s=>w.eval(s);
  E(`trades=[];positions=[
    {symbol:'TQQQ',dir:'Long',shares:10,avgEntry:50,current:60,currency:'USD',account:'CELIAPP (USD)',entries:[{date:'2026-09-01',price:50,shares:10,size:500}]},
    {symbol:'NVDA',dir:'Long',shares:2,avgEntry:100,current:120,currency:'USD',account:'CELIAPP (USD)',entries:[{date:'2026-09-01',price:100,shares:2,size:200}]}
  ];sortColumn=null;renderPosTable();`);
  ok(E(`document.querySelector('#pos-body tr.pos-class-head .pos-class-dot')!==null`),'en-tête de classe avec pastille couleur');
  ok(E(`[...document.querySelectorAll('#pos-body tr.pos-class-sub')].every(r=>/^Total /.test(r.querySelector('.pos-sub-name').textContent))`),'sous-totaux libellés « Total <classe> »');
  ok(E(`document.querySelector('#pos-body tr.pos-class-head').getAttribute('style').includes('--cls')`),'couleur de classe passée en variable CSS');
  ok(E(`document.querySelectorAll('#pos-body .row-act').length`)===4,'actions Modifier/Fermer en boutons discrets');
}
// ---- 3. Rampe Optimus (rouge positions / bleu cash)
{
  const w=load();const E=s=>w.eval(s);
  const r=E(`optimusRamp('red',5)`),b=E(`optimusRamp('blue',4)`);
  ok(r.length===5&&new Set(r).size===5,'5 tons de rouge distincts');
  ok(r.every(c=>{const h=+c.match(/hsl\((\d+)/)[1];return h>=350||h<=15;}),'tons rouges dans la famille rouge : '+r.join(' '));
  ok(b.every(c=>{const h=+c.match(/hsl\((\d+)/)[1];return h>=195&&h<=225;}),'tons bleus dans la famille bleue : '+b.join(' '));
}
// ---- 4. Fiche du gestionnaire : TWR exclut les dépôts, notes bornées
{
  const w=load();const E=s=>w.eval(s);
  E(`positions=[];cash=12000;fxRate=1;
    portfolioHistory=[];for(let i=0;i<40;i++){const d=new Date('2026-07-01');d.setDate(d.getDate()+i);portfolioHistory.push({date:d.toISOString().slice(0,10),value:i<20?10000:12000});}
    trades=[{date:'2026-07-21',symbol:'CASH',type:'Dépôt',size:2000,originalAmt:2000,originalCurrency:'CAD',currency:'CAD'}];
    localToday=()=>'2026-08-09';`);
  const S=E(`computeManagerStats([])`);
  ok(Math.abs(S.twr)<1e-9,'dépôt de 2000 $ -> TWR = 0 (pas une performance) : '+S.twr);
  ok(S.mdd===0,'aucun drawdown');
  ok(S.attrs.length===6&&S.attrs.every(a=>a.score==null||(a.score>=1&&a.score<=99)),'6 attributs notés 1–99');
  E(`trades.push({date:'2026-07-10',symbol:'A',type:'Vente',size:100,profit:30,currency:'CAD'},{date:'2026-07-12',symbol:'B',type:'Vente',size:100,profit:20,currency:'CAD'},{date:'2026-07-15',symbol:'C',type:'Vente',size:100,profit:-10,currency:'CAD'})`);
  const T=E(`computeManagerStats([])`);
  ok(T.nTrades===3&&T.wins===2&&T.bestStreak===2&&T.streak===-1,'trades : 2V-1D, record 2, série actuelle 1 D');
  ok(Math.abs(T.pf-5)<1e-9,'profit factor 50/10 = 5');
  ok(T.winRateAdj>0.5&&T.winRateAdj<T.winRate,'win rate tiré vers 50 % avec petit échantillon');
  ok(T.ovr>=1&&T.ovr<=99&&typeof T.tier.name==='string','OVR '+T.ovr+' / rang '+T.tier.name);
  ok(T.achievements.find(a=>a.name==='Premier sang').ok&&!T.achievements.find(a=>a.name==='Vétéran').ok,'succès débloqués / verrouillés');
  ok(E(`document.getElementById('milestones-card')`)===null,'Objectifs financiers retiré');
  E(`renderManager()`);
  ok(E(`document.querySelectorAll('#mgr-attrs .mgr-attr').length`)===6,'6 attributs rendus');
  ok(E(`document.querySelectorAll('#mgr-achievements .mgr-ach').length`)===12,'12 succès rendus');
}
console.log(fails?`\n${fails} ÉCHEC(S)`:'\nTOUT PASSE');process.exit(fails?1:0);

// Tests de la couche institutionnelle (pro.js) : risque, XIRR/MWR, attribution, IPS, audit,
// intégrité, palette.
const {load}=require('./harness.cjs');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
const near=(a,b,t=1e-6)=>Math.abs(a-b)<=t;
const w=load();const E=s=>w.eval(s);
// ---- XIRR : 1000 -> 1100 en 365 jours = 10 %
ok(near(E(`proXirr([{date:'2025-01-01',amt:-1000},{date:'2026-01-01',amt:1100}])`),0.1,1e-6),'XIRR simple = 10 %');
// dépôt au milieu : -1000 (jan), -1000 (juil), +2200 (jan) -> TRI entre 6 et 14 %
const x=E(`proXirr([{date:'2025-01-01',amt:-1000},{date:'2025-07-02',amt:-1000},{date:'2026-01-01',amt:2200}])`);
ok(x>0.12&&x<0.14,'XIRR avec dépôt intermédiaire ≈ 13,3 % -> '+(x*100).toFixed(2));
// ---- Risque : série identique à l'indice -> bêta 1, TE 0, corrélation 1
E(`var _W={dates:[],idx:[1],rets:[]};var _b=[100];for(let i=0;i<60;i++){const r=Math.sin(i)*0.01;_W.rets.push(r);_W.idx.push(_W.idx[i]*(1+r));_b.push(_b[i]*(1+r));}
for(let i=0;i<61;i++){const d=new Date('2026-01-05');d.setDate(d.getDate()+i);_W.dates.push(d.toISOString().slice(0,10));}`);
const M=E(`computeRiskMetrics(_W,_b)`);
ok(near(M.beta,1,1e-9)&&near(M.te,0,1e-9)&&near(M.corr,1,1e-9),'portefeuille = indice -> bêta 1, TE 0, corr 1');
ok(M.mdd>0&&M.var95>0&&M.cvar95>=M.var95,'max drawdown, VaR et CVaR cohérents (CVaR ≥ VaR)');
ok(M.sortino!=null&&M.sharpe!=null,'Sharpe et Sortino calculés');
// ---- MWR sur une série : pas de flux -> MWR période = TWR
E(`fxRate=1;positions=[];cash=0;trades=[];portfolioHistory=[{date:'2026-01-01',value:1000},{date:'2026-07-01',value:1100}];localToday=()=>'2026-07-01';`);
const S=E(`buildTwrSeries()`);
const mw=E(`proMwr(buildTwrSeries(),0)`);
ok(near(mw.period,0.1,1e-6),'MWR = TWR sans flux (10 %) -> '+(mw.period*100).toFixed(3));
// ---- IPS : rattachement et statuts
E(`ipsConfig=JSON.parse(JSON.stringify(IPS_DEFAULT));fxRate=1;accountCurrency='USD';liveFxRates.CAD=1;trades=[];cash=0;portfolioHistory=[];
positions=[
 {symbol:'XQQ.TO',shares:10,current:22.5,avgEntry:20,currency:'CAD',account:'CELIAPP (CAD)',entries:[{price:20,shares:10,size:200}]},
 {symbol:'TQQQ',shares:10,current:40,avgEntry:30,currency:'USD',account:'CELIAPP (USD)',entries:[{price:30,shares:10,size:300,fxSnapshot:1}]},
 {symbol:'ETH/USD',shares:1,current:300,avgEntry:250,currency:'USD',account:'Kucoin',entries:[{price:250,shares:1,size:250,fxSnapshot:1}]},
 {symbol:'NVDA',shares:1,current:75,avgEntry:30,currency:'USD',account:'CELI (USD)',entries:[{price:30,shares:1,size:30,fxSnapshot:1}]}];
getCashByAccount=()=>[];`);
const R=E(`computeIps()`);
const by=Object.fromEntries(R.sleeves.map(s=>[s.id,s]));
ok(near(R.total,1000,1e-6),'total IPS = 1000');
ok(near(by.core.w,22.5,1e-9)&&by.core.status!=='out','XQQ 22,5 % -> dans la bande');
ok(near(by.tqqq.w,40,1e-9),'TQQQ 40 %');
ok(near(by.crypto.w,30,1e-9),'ETH (classe Crypto) rattaché à la poche crypto : 30 %');
ok(by._none&&near(by._none.w,7.5,1e-9)&&by._none.status==='unmapped','NVDA hors IPS (7,5 %) signalé à rattacher');
ok(by.fixed.status==='ok'&&near(by.fixed.toTarget,75,1e-6),'Revenu fixe à 0 % : conforme (min 0) mais 75 $ pour la cible');
E(`positions[1].current=60`); // TQQQ 600 / total 1200 = 50 % (borne max)
const R2=E(`computeIps()`);const t2=R2.sleeves.find(s=>s.id==='tqqq');
ok(near(t2.w,50,1e-9)&&t2.status==='near','TQQQ à 50 % = borne max -> près de la borne');
E(`positions[1].current=80`);
const R3=E(`computeIps()`);const t3=R3.sleeves.find(s=>s.id==='tqqq');
ok(t3.status==='out'&&t3.toTarget<0&&R3.outCount>=1,'TQQQ au-dessus de 50 % -> hors bande, alléger');
// ---- Attribution : effet prix + effet change = latent ; réalisé et dividendes
E(`positions=[{symbol:'TQQQ',shares:10,current:40,avgEntry:30,currency:'USD',account:'CELIAPP (USD)',entries:[{price:30,shares:10,size:300,fxSnapshot:1.30}]}];fxRate=1.40;accountCurrency='CAD';
trades=[{date:'2026-05-01',symbol:'SOXL',type:'Vente',size:100,profit:20,currency:'USD'},{date:'2026-05-02',symbol:'XQQ.TO',type:'Dividende',size:5,currency:'CAD'}];PRO.attrGroup='asset';`);
const A=E(`computeAttribution()`);const tq=A.list.find(r=>r.key==='TQQQ');
const latent=400*1.40-300*1.30;
ok(near(tq.price+tq.fx,latent,0.01),'prix + change = P&L latent exact ('+latent.toFixed(2)+')');
ok(near(tq.price,(400-300)*1.30,0.01)&&near(tq.fx,400*(1.40-1.30),0.01),'effet prix 130 $, effet change 40 $');
ok(near(A.list.find(r=>r.key==='SOXL').realized,28,0.01),'réalisé SOXL 20 USD -> 28 $ CA');
ok(near(A.list.find(r=>r.key==='XQQ.TO').div,5,0.01),'dividende 5 $ CA');
// ---- Audit : diff automatique
E(`auditLog=[];positions=[{symbol:'TQQQ',shares:10,avgEntry:30,current:40,account:'CELIAPP (USD)',dir:'Long'}];trades=[];cash=100;_auditBase=auditSnapshot();
positions[0].shares=20;positions.push({symbol:'NVDA',shares:1,avgEntry:100,current:100,account:'CELI (USD)',dir:'Long'});
trades.unshift({date:'2026-10-01',type:'Achat',symbol:'NVDA',shares:1,price:100,size:100,account:'CELI (USD)'});cash=0;auditOnSaved();`);
const L=E(`auditLog.map(e=>e.kind+':'+e.text)`);
ok(L.some(t=>/^ajout:Transaction ajoutée : Achat 1 NVDA/.test(t)),'audit : transaction ajoutée');
ok(L.some(t=>/^modif:Position modifiée : TQQQ.*parts 10 → 20/.test(t)),'audit : parts modifiées');
ok(L.some(t=>/^ajout:Position ouverte : NVDA/.test(t)),'audit : position ouverte');
ok(L.some(t=>/^cash:/.test(t)),'audit : variation de cash');
E(`auditLog=[];auditOnSaved();`);ok(E(`auditLog.length`)===0,'sauvegarde sans changement -> rien au journal');
// ---- Intégrité
E(`positions=[{symbol:'TQQQ',shares:10,avgEntry:30,current:40,account:'',entries:[{shares:5,price:30}]}];trades=[{date:'2099-01-01',type:'Achat',symbol:'X',shares:1,price:1,size:1,account:'A'},{date:'2099-01-01',type:'Achat',symbol:'X',shares:1,price:1,size:1,account:'A'}];portfolioHistory=[];`);
const Q=E(`computeIntegrity()`);const t=k=>Q.checks.find(c=>c.title.startsWith(k));
ok(t('Compte renseigné sur chaque position').sev==='warn','position sans compte détectée');
ok(t('Lots').sev==='err','lots ≠ parts détectés');
ok(t('Doublons').sev==='warn'&&t('Dates dans le futur').sev==='err','doublon + date future détectés');
ok(Q.score<100,'score dégradé : '+Q.score);
// ---- Palette
E(`positions=[{symbol:'TQQQ',shares:1,current:1,account:'CELI (USD)'}];watchlist=[];`);
ok(E(`cmdItems().some(i=>i.label==='TQQQ'&&i.group==='Positions')`)&&E(`cmdItems().some(i=>i.label==='Analyse')`),'palette : positions + onglets');
E(`openCmdK();document.getElementById('cmdk-q').value='analy';cmdRender();`);
ok(E(`_cmdList[0].label`)==='Analyse','recherche « analy » -> Analyse en premier');
console.log(fails?`\n${fails} ÉCHEC(S)`:'\nTOUT PASSE');process.exit(fails?1:0);

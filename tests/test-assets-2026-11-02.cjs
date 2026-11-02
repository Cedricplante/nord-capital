// Tests 2026-11-02 : montant investi manuel, transfert d'actif entre comptes, palette cash, tableau Positions.
// Exécuter : NODE_PATH=<node_modules> node tests/test-assets-2026-11-02.cjs
const {load}=require('./harness.cjs');
const w=load();const E=s=>w.eval(s);
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
const near=(a,b,t=0.011)=>Math.abs(a-b)<=t;
const set=(id,v)=>E(`document.getElementById('${id}').value=${JSON.stringify(String(v))}`);
const bal=(acct,cur)=>E(`(()=>{const st=reconstructCashLots(true).accounts[${JSON.stringify(acct)}];return st?[...st.principal,...st.profit].filter(l=>l.currency==='${cur}').reduce((s,l)=>s+l.amount,0):0})()`);
E('var __p;trades=[];positions=[];');

// ── 1. Montant investi manuel (formulaire d'ajout)
set('f-symbol','TQQQ');set('f-dir','Long');set('f-date','2026-10-05');set('f-entry',50);set('f-current',50);set('f-currency','USD');set('f-account','CELIAPP (USD)');
set('f-size',1000);E('onMontantInput()');
ok(near(parseFloat(E("document.getElementById('f-shares').value")),20,1e-6),'montant 1000 @ 50 -> 20 shares');
// prix vide + shares connues -> prix dérivé
set('f-entry','');set('f-shares',8);set('f-size',400);E('onMontantInput()');
ok(near(parseFloat(E("document.getElementById('f-entry').value")),50,1e-6),'montant 400 / 8 shares -> prix 50');
// retour au mode auto : changer le prix recalcule le montant
set('f-entry',50);set('f-shares',20);E('calcMontant()');
ok(near(parseFloat(E("document.getElementById('f-size').value")),1000),'prix × shares -> montant auto 1000');
// incohérence bloquée
set('f-size',1500);
const n0=E('trades.length');E('__p=addPosition()');
ok(E('trades.length')===n0&&w.__alerts.some(a=>/incohérent/i.test(a)),'montant incohérent avec shares × prix est refusé');
set('f-size',1000);E('__p=addPosition()');
ok(E('trades.length')===n0+1&&E('positions.length')===1,'achat avec montant saisi accepté');
const p0=E('positions[0]');ok(p0.shares===20&&near(p0.totalSize,1000)&&p0.account==='CELIAPP (USD)','position 20 sh, 1000 $, CELIAPP (USD)');

// ── 2. Modal Modifier : montant ↔ prix moyen
E('openEditModal(0)');
ok(near(parseFloat(E("document.getElementById('edit-size').value")),1000),'modal Modifier affiche le montant investi');
set('edit-size',1200);E("onEditAmtInput('size')");
ok(near(parseFloat(E("document.getElementById('edit-avgentry').value")),60,1e-6),'montant 1200 / 20 shares -> prix moyen 60');
E('confirmEdit()');
ok(near(E('positions[0].avgEntry'),60)&&near(E('positions[0].totalSize'),1200)&&near(E('positions[0].entries[0].size'),1200),'confirmEdit met à jour prix, montant et lot unique');
E('openEditModal(0)');set('edit-size',1000);E("onEditAmtInput('size')");E('confirmEdit()');
ok(near(E('positions[0].avgEntry'),50),'retour à 50');

// ── 3. Transfert d'actif : deux lots (DCA), transfert partiel puis total
E("positions[0].entries.push({price:60,shares:10,size:600,date:'2026-10-10',fxSnapshot:1.35});positions[0].shares=30;positions[0].avgEntry=(50*20+60*10)/30;positions[0].totalSize=positions[0].avgEntry*30;");
const cashBefore=E('syncCashFromLots()');
set('ta-shares','');
E('openTransferAssetModal(0)');
ok(!E("[...document.querySelectorAll('#ta-dest option')].some(o=>o.value==='CELIAPP (USD)')"),'la destination exclut le compte source');
set('ta-dest','Comptant (USD)');set('ta-shares',25);set('ta-date','2026-10-20');
E('updateTransferPreview()');
ok(/nouvelle position/.test(E("document.getElementById('ta-preview').textContent")),'aperçu : nouvelle position dans la destination');
E('__p=confirmTransferAsset()');
ok(E('positions.length')===2,'2 positions après transfert partiel');
const src=E("positions.find(p=>p.account==='CELIAPP (USD)')"),dst=E("positions.find(p=>p.account==='Comptant (USD)')");
ok(near(src.shares,5,1e-6)&&near(dst.shares,25,1e-6),'FIFO : 5 sh restent, 25 sh transférées');
ok(src.entries.length===1&&near(src.entries[0].price,60),'il reste 5 sh du lot à 60 (lots les plus anciens d\'abord)');
ok(dst.entries.length===2&&near(dst.entries[0].shares,20)&&near(dst.entries[1].shares,5)&&near(dst.avgEntry,(50*20+60*5)/25,1e-6),'destination : lots 20@50 + 5@60, prix moyen pondéré');
ok(near(dst.totalSize,dst.avgEntry*dst.shares)&&near(src.totalSize,src.avgEntry*src.shares),'invariant totalSize = avgEntry × shares');
const tr=E('trades[0]');
ok(tr.type==='TransfertActif'&&tr.fromAccount==='CELIAPP (USD)'&&tr.toAccount==='Comptant (USD)'&&near(tr.shares,25,1e-6),'trade TransfertActif enregistré');
ok(near(E('syncCashFromLots()'),cashBefore),'le cash total ne change pas');
ok(near(bal('CELIAPP (USD)','USD'),2516.18-1000,0.02),'cash du compte source inchangé par le transfert');
// fusion avec une position existante
set('ta-dest','');E('openTransferAssetModal(0)');
const iSrc=E("positions.findIndex(p=>p.account==='CELIAPP (USD)')");
E(`openTransferAssetModal(${iSrc})`);set('ta-dest','Comptant (USD)');set('ta-shares',5);E('updateTransferPreview()');
ok(/fusionné/.test(E("document.getElementById('ta-preview').textContent")),'aperçu : fusion avec la position existante');
E('__p=confirmTransferAsset()');
ok(E('positions.length')===1&&near(E('positions[0].shares'),30,1e-6)&&E('positions[0].account')==='Comptant (USD)','transfert total : source supprimée, destination = 30 sh');
ok(near(E('positions[0].entries.reduce((s,e)=>s+e.shares,0)'),30,1e-6)&&E('positions[0].entries.length')===3,'lots fusionnés cohérents (somme = parts, 3 lots)');
// garde-fous
E('openTransferAssetModal(0)');set('ta-dest','Comptant (USD)');
E('document.getElementById("ta-dest").innerHTML+="<option value=\'Comptant (USD)\'>x</option>"');set('ta-dest','Comptant (USD)');set('ta-shares',1);
const nt=E('trades.length');E('__p=confirmTransferAsset()');
ok(E('trades.length')===nt,'même compte refusé');
set('ta-dest','CELI (CAD)');set('ta-shares',99);E('__p=confirmTransferAsset()');
ok(E('trades.length')===nt,'plus de shares que détenues refusé');
E('cancelTransferAsset()');

// ── 4. Provenance suit les shares
E(`trades=[];positions=[];`);
E("trades.unshift({date:'2026-10-01',symbol:'XQQ',type:'Dividende',size:200,currency:'CAD',originalAmt:200,originalCurrency:'CAD',accountType:'CELIAPP (CAD)'});");
E("trades.unshift({date:'2026-10-02',symbol:'SOXL',dir:'Long',type:'Achat',price:10,shares:20,size:200,currency:'CAD',account:'CELIAPP (CAD)',funding:[{account:'CELIAPP (CAD)',amount:200,currency:'CAD'}]});");
E("trades.unshift({date:'2026-10-03',symbol:'SOXL',dir:'Long',type:'TransfertActif',price:10,shares:8,size:80,profit:0,currency:'CAD',account:'CELIAPP (CAD)',fromAccount:'CELIAPP (CAD)',toAccount:'Comptant (CAD)'});");
const ef=E("reconstructCashLots(true).entryFunding");
const fromS=(ef['SOXL|CELIAPP (CAD)']||[]).reduce((s,e)=>s+e.shares,0),toS=(ef['SOXL|Comptant (CAD)']||[]).reduce((s,e)=>s+e.shares,0);
ok(near(fromS,12,1e-6)&&near(toS,8,1e-6),'provenance : 12 sh restent chez la source, 8 sh suivent vers la destination');
ok((ef['SOXL|Comptant (CAD)']||[]).every(e=>(e.funding||[]).length>0),'provenance : le financement suit avec les shares');

// ── 5. Activité / export
E("renderHistory()");
const html=E("document.getElementById('hist-body').innerHTML");
ok(/Transfert d'actif/.test(html)&&!/badge-achat[^<]*>Achat<\/span><\/td><td>[^<]*<\/td><td>[^<]*<\/td><td[^>]*>—<\/td><td[^>]*>—<\/td><td[^>]*>—<\/td><td[^>]*>—<\/td><\/tr>\s*$/.test(''),'Activité : ligne « Transfert d\'actif »');
ok(E("[...document.querySelectorAll('#filter-type option')].some(o=>o.value==='TransfertActif')"),'filtre Activité : Transferts d\'actifs');

// ── 6. Palette cash : teintes bien séparées
const hue=h=>{const r=parseInt(h.slice(1,3),16)/255,g=parseInt(h.slice(3,5),16)/255,b=parseInt(h.slice(5,7),16)/255,mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn;if(!d)return 0;let H=mx===r?((g-b)/d)%6:mx===g?(b-r)/d+2:(r-g)/d+4;H*=60;return H<0?H+360:H;};
const dist=(a,b)=>{const d=Math.abs(hue(a)-hue(b));return Math.min(d,360-d);};
for(const theme of['dark','light']){
  E(`document.documentElement.setAttribute('data-theme','${theme}')`);
  const pal=E('cashRamp(6)');let minD=360;
  for(let i=1;i<pal.length;i++)minD=Math.min(minD,dist(pal[i-1],pal[i]));
  ok(pal.length===6&&new Set(pal).size===6&&minD>=75,`palette cash (${theme}) : 6 couleurs distinctes, écart de teinte voisin ≥ 75° (min ${minD.toFixed(0)}°)`);
  ok(E('cashRamp(14)').length===14&&new Set(E('cashRamp(14)')).size===14,`palette cash (${theme}) : 14 tranches toutes différentes`);
}

// ── 7. Tableau Positions allégé : rendu
E(`document.documentElement.setAttribute('data-theme','dark');trades=[];positions=[{symbol:'TQQQ',dir:'Long',avgEntry:50,current:60,totalSize:1000,shares:20,currency:'USD',account:'CELIAPP (USD)',entries:[{price:50,shares:20,size:1000,date:'2026-10-05',fxSnapshot:1.35}]}];renderPosTable();`);
const ph=E("document.getElementById('pos-body').innerHTML");
ok(/acct-txt/.test(ph)&&!/badge-dca acc-/.test(ph),'Positions : compte en texte simple (plus de pastille)');
ok(!/>#1</.test(ph),'Positions : plus de numérotation #');
ok(/Transférer/.test(ph)&&/Modifier/.test(ph)&&/Fermer/.test(ph),'Positions : actions Modifier / Transférer / Fermer');
const css=require('fs').readFileSync(__dirname+'/../styles.css','utf8');
ok(/\.pos-table \.row-acts-in \{ position: absolute/.test(css)&&/tr:hover \.row-acts-in/.test(css),'CSS : actions superposées, visibles au survol seulement');
ok(/col-dir/.test(E("document.querySelector('.pos-table colgroup').innerHTML"))&&E("document.querySelectorAll('.pos-table colgroup col').length")===15,'tableau Positions : colgroup 15 colonnes (Dir./Date masquables)');
ok(/dir-short/.test((E("positions[0].dir='Short';renderPosTable();document.getElementById('pos-body').innerHTML"))),'Short visible à côté du symbole');
console.log(fails?`\n${fails} ÉCHEC(S)`:'\nTOUT PASSE');process.exit(fails?1:0);

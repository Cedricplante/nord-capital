const {load}=require('./harness.cjs');
const w=load();
const r=w.eval(`(function(){
  const out={};
  trades=[];positions=[];
  const before=reconstructCashLots(true);
  const tot0=Object.values(before.accounts).reduce((s,x)=>s+_clAccountTotalCAD(x),0);
  // profit lot in CELIAPP (CAD) via a dividend, then transfer 1000 CAD to Comptant (CAD)
  trades.unshift({date:'2026-10-01',symbol:'XQQ',type:'Dividende',size:200,currency:'CAD',originalAmt:200,originalCurrency:'CAD',accountType:'CELIAPP (CAD)'});
  trades.unshift({date:'2026-10-20',symbol:'CASH',type:'Transfert',size:1000,currency:'CAD',originalAmt:1000,originalCurrency:'CAD',accountType:'CELIAPP (CAD)',fromAccount:'CELIAPP (CAD)',toAccount:'Comptant (CAD)'});
  const a=reconstructCashLots(true).accounts;
  out.src=_clAccountTotalCAD(a['CELIAPP (CAD)']);out.dst=_clAccountTotalCAD(a['Comptant (CAD)']);
  out.dstProfit=a['Comptant (CAD)'].profit.reduce((s,l)=>s+l.amount,0);
  out.totDelta=Object.values(a).reduce((s,x)=>s+_clAccountTotalCAD(x),0)-tot0;
  // cross-currency
  trades.unshift({date:'2026-10-21',symbol:'CASH',type:'Transfert',size:500,currency:'CAD',originalAmt:500,originalCurrency:'CAD',accountType:'CELIAPP (CAD)',fromAccount:'CELIAPP (CAD)',toAccount:'CELIAPP (USD)'});
  const b=reconstructCashLots(true).accounts;
  out.usdLots=b['CELIAPP (USD)'].principal.map(l=>l.currency+':'+l.amount.toFixed(2));
  out.tot2=Object.values(b).reduce((s,x)=>s+_clAccountTotalCAD(x),0)-tot0;
  // render
  renderHistory();
  out.row=document.getElementById('hist-body').innerHTML.includes('Transfert');
  out.pal=catPalette(14).length;
  return out;})()`);
console.log(JSON.stringify(r,null,1));console.log('alerts',w.__alerts);

const {load}=require('./harness.cjs');const w=load();const E=s=>w.eval(s);
let f=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)f++;};
E(`positions=[{symbol:'TQQQ',dir:'Long',avgEntry:100,current:100,shares:10,totalSize:1000,currency:'USD',account:'CELI (USD)',entries:[{price:100,shares:10,size:1000,date:'2026-09-01'}]},
{symbol:'TQQQ',dir:'Long',avgEntry:50,current:100,shares:4,totalSize:200,currency:'USD',account:'CELIAPP (USD)',entries:[{price:40,shares:2,size:80,date:'2026-09-01'},{price:60,shares:2,size:120,date:'2026-09-02'}]}];
csvParsedRows=[{date:'2026-09-29',symbol:'TQQQ',action:'SELL',qty:2,price:110,size:220,currency:'USD',account:'CELIAPP (USD)',_skip:false}];`);
E('window.__p=confirmImportCsv()');
setTimeout(()=>{
 const p=E('positions');
 ok(p[0].shares===10,'CSV vente ne touche pas la position CELI (USD)');
 ok(p[1].shares===2&&p[1].avgEntry===50,'CSV vente réduit CELIAPP (USD), prix moyen 50 conservé (coût moyen)');
 ok(Math.abs(p[1].entries.reduce((s,e)=>s+e.size,0)-100)<0.01,'CSV entries réduites au prorata (ACB 100)');
 ok(E('trades[0].profit')===120,'CSV profit = (110-50)×2 = 120');
 console.log(f?'ÉCHECS':'TOUT PASSE');
},500);

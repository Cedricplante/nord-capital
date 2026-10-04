// ═══════════════════════════════════════════════════════════════════════════════════════════
// pro.js — couche « institutionnelle » de Nord Capital (2026-10-03)
//
//   A. Outils communs (historique de prix, alignement, stats)
//   B. 01 Risque          — volatilité, Sharpe/Sortino/Calmar, bêta, TE/IR, VaR/CVaR, stress
//   C. 02 Attribution     — effet prix / effet de change / réalisé / dividendes, pont du P&L
//   D. 03 TWR vs MWR      — TWR chaîné vs TRI (XIRR) par période, effet de timing
//   E. IPS                — poches, bandes, conformité, rééquilibrage, garde-fous, éditeur
//   F. Données            — journal d'audit automatique, contrôles d'intégrité, rapprochement
//   G. UX                 — palette Ctrl+K, barre d'onglets mobile, navigation
//
// Chargé APRÈS app.js : utilise ses globales (positions, trades, cash, portfolioHistory, fxRate,
// toUSD, posValueAcct, getCashByAccount, buildTwrSeries…). app.js appelle les points d'entrée
// proRenderAll(), proOnRowLoaded(row), auditOnSaved() et proOnTab(name) s'ils existent.
// Aucune donnée n'est dupliquée : tout est recalculé à la volée depuis la source.
// ═══════════════════════════════════════════════════════════════════════════════════════════

// ─── A. OUTILS COMMUNS ─────────────────────────────────────────────────────────────────────
const PRO={period:'ALL',bench:'SPY',attrGroup:'asset',hist:{},histLoading:{},charts:{}};
const AN_RF=0.04; // taux sans risque annuel (cohérent avec la fiche du gestionnaire)

// Historique de clôtures via /api/history, mis en cache par symbole. Renvoie [] en cas d'échec.
function proHistory(sym,range){
  const key=sym+'|'+(range||'5y');
  if(PRO.hist[key])return Promise.resolve(PRO.hist[key]);
  if(PRO.histLoading[key])return PRO.histLoading[key];
  const p=fetch(`/api/history?symbol=${encodeURIComponent(sym)}&range=${range||'5y'}`)
    .then(r=>r.ok?r.json():[]).then(d=>{PRO.hist[key]=Array.isArray(d)?d:[];return PRO.hist[key];})
    .catch(()=>{PRO.hist[key]=[];return[];});
  PRO.histLoading[key]=p;return p;
}
// Prix au jour `date` ou au dernier jour de bourse précédent (jusqu'à 10 jours en arrière).
function proPriceAt(map,date){
  if(map.has(date))return map.get(date);
  const d=new Date(date+'T12:00:00');
  for(let i=1;i<=10;i++){d.setDate(d.getDate()-1);const k=d.toISOString().slice(0,10);if(map.has(k))return map.get(k);}
  return null;
}
// Série de l'indice exprimée en $ CA (indices US × USDCAD du jour) alignée sur des dates.
async function proBenchSeries(sym,dates){
  const isCad=/\.TO$/i.test(sym);
  const [px,fx]=await Promise.all([proHistory(sym,'5y'),isCad?Promise.resolve([]):proHistory('USDCAD=X','5y')]);
  if(!px.length)return null;
  const pm=new Map(px.map(p=>[p.date,p.close])),fm=new Map(fx.map(p=>[p.date,p.close]));
  const last=px[px.length-1].close,lastFx=fx.length?fx[fx.length-1].close:null;
  return dates.map((d,i)=>{
    let p=proPriceAt(pm,d);if(p==null&&i===dates.length-1)p=last;
    if(p==null)return null;
    if(isCad)return p;
    let f=fm.size?proPriceAt(fm,d):null;if(f==null)f=lastFx;
    return f?p*f:p;
  });
}
const proMean=a=>a.length?a.reduce((s,x)=>s+x,0)/a.length:0;
function proStd(a){if(a.length<2)return 0;const m=proMean(a);return Math.sqrt(a.reduce((s,x)=>s+(x-m)**2,0)/(a.length-1));}
function proQuantile(a,q){if(!a.length)return null;const s=[...a].sort((x,y)=>x-y);const pos=(s.length-1)*q,lo=Math.floor(pos),hi=Math.ceil(pos);return s[lo]+(s[hi]-s[lo])*(pos-lo);}
// Jours entre deux dates ISO, en UTC (insensible aux changements d'heure).
function proDayNum(d){const[y,m,dd]=String(d).slice(0,10).split('-').map(Number);return Date.UTC(y,m-1,dd)/86400000;}
function proDaysBetween(a,b){return Math.round(proDayNum(b)-proDayNum(a));}
function proPeriodStart(p){
  const t=new Date(localToday()+'T12:00:00');
  if(p==='1M')t.setMonth(t.getMonth()-1);else if(p==='3M')t.setMonth(t.getMonth()-3);
  else if(p==='6M')t.setMonth(t.getMonth()-6);else if(p==='1Y')t.setFullYear(t.getFullYear()-1);
  else if(p==='YTD')return t.getFullYear()+'-01-01';else return null;
  return t.toISOString().slice(0,10);
}
const PERIOD_LBL={'1M':'1 mois','3M':'3 mois','6M':'6 mois','YTD':'depuis le 1er janvier','1Y':'1 an','ALL':'depuis le début'};
function fmtP1(v,dec){if(v==null||!isFinite(v))return'—';return(v>=0?'+':'−')+Math.abs(v*100).toFixed(dec??1)+' %';}
function fmtU1(v,dec){if(v==null||!isFinite(v))return'—';return(v*100).toFixed(dec??1)+' %';}
function fmtR(v,dec){if(v==null||!isFinite(v))return'—';return(v<0?'−':'')+Math.abs(v).toFixed(dec??2);}
function proSignCls(v){return v==null||!isFinite(v)?'':v>=0?'pos':'neg';}
function proDestroy(k){try{PRO.charts[k]&&PRO.charts[k].destroy();}catch(e){}PRO.charts[k]=null;}
function proChartBase(){
  const tick={color:()=>themeHex('text3'),font:{size:10.5}};
  return{responsive:true,maintainAspectRatio:false,animation:{duration:450},interaction:{mode:'index',intersect:false},
    plugins:{legend:{display:false}},
    scales:{x:{ticks:{...tick,maxTicksLimit:7,maxRotation:0},grid:{display:false},border:{color:()=>themeRgba('text',0.08)}},
            y:{ticks:{...tick},grid:{color:()=>themeRgba('text',0.05)},border:{display:false}}}};
}

// ─── B. 01 RISQUE ──────────────────────────────────────────────────────────────────────────
// Sous-fenêtre de la série TWR pour la période choisie : on garde le point d'ancrage juste
// avant le début (sinon le 1er rendement de la période serait perdu).
function anWindow(S,period){
  const start=proPeriodStart(period);
  let i0=0;
  if(start){i0=S.hist.findIndex(h=>h.date>=start);if(i0<0)i0=S.hist.length-1;i0=Math.max(0,i0-1);}
  const hist=S.hist.slice(i0),idx=S.idx.slice(i0),rets=S.rets.slice(i0);
  return{hist,idx:idx.map(v=>v/idx[0]),rets,dates:hist.map(h=>h.date)};
}
function computeRiskMetrics(W,benchVals){
  const r=W.rets,n=r.length,out={n};
  if(n<5)return out;
  const days=proDaysBetween(W.dates[0],W.dates[W.dates.length-1]),years=Math.max(days,1)/365.25;
  out.days=days;out.years=years;
  const rf=AN_RF/252,m=proMean(r),sd=proStd(r);
  out.ret=W.idx[W.idx.length-1]-1;
  out.cagr=Math.pow(1+out.ret,1/years)-1;
  out.vol=sd*Math.sqrt(252);
  out.sharpe=sd>0?(m-rf)/sd*Math.sqrt(252):null;
  const down=r.map(x=>Math.min(0,x-rf));const dd=Math.sqrt(proMean(down.map(x=>x*x)));
  out.downVol=dd*Math.sqrt(252);
  out.sortino=dd>0?(m-rf)/dd*Math.sqrt(252):null;
  // Drawdowns
  let peak=W.idx[0],peakI=0,mdd=0,mddPeak=0,mddTrough=0,longest=0;const ddSeries=[];
  for(let i=0;i<W.idx.length;i++){
    const v=W.idx[i];if(v>=peak){peak=v;peakI=i;}
    const d=v/peak-1;ddSeries.push(d);
    if(d<mdd){mdd=d;mddPeak=peakI;mddTrough=i;}
    const dur=proDaysBetween(W.dates[peakI],W.dates[i]);if(d<0&&dur>longest)longest=dur;
  }
  out.mdd=-mdd;out.curDD=-ddSeries[ddSeries.length-1];out.ddSeries=ddSeries;out.longestDD=longest;
  out.mddFrom=W.dates[mddPeak];out.mddTo=W.dates[mddTrough];
  out.calmar=out.mdd>0.0001?out.cagr/out.mdd:null;
  // Distribution
  out.best=Math.max(...r);out.worst=Math.min(...r);out.posDays=r.filter(x=>x>0).length/n;
  const m3=proMean(r.map(x=>(x-m)**3)),m4=proMean(r.map(x=>(x-m)**4));
  out.skew=sd>0?m3/Math.pow(sd,3):null;out.kurt=sd>0?m4/Math.pow(sd,4)-3:null;
  const q5=proQuantile(r,0.05);
  out.var95=-q5;out.varParam=-(m-1.645*sd);
  const tail=r.filter(x=>x<=q5);out.cvar95=tail.length?-proMean(tail):null;
  // Relatif à l'indice
  if(benchVals&&benchVals.filter(v=>v!=null).length>5){
    const pr=[],br=[];
    for(let i=1;i<benchVals.length;i++){
      const a=benchVals[i-1],b=benchVals[i];
      if(a&&b){pr.push(r[i-1]);br.push(b/a-1);}
    }
    const bv=benchVals.filter(v=>v!=null);
    out.benchRet=bv[bv.length-1]/bv[0]-1;
    if(pr.length>5){
      const mb=proMean(br),mp=proMean(pr),sb=proStd(br);
      const cov=pr.reduce((s,x,i)=>s+(x-mp)*(br[i]-mb),0)/(pr.length-1);
      out.beta=sb>0?cov/(sb*sb):null;
      out.corr=sb>0&&proStd(pr)>0?cov/(sb*proStd(pr)):null;
      out.alpha=out.beta!=null?((mp-rf)-out.beta*(mb-rf))*252:null;
      const ex=pr.map((x,i)=>x-br[i]);
      out.te=proStd(ex)*Math.sqrt(252);
      out.ir=out.te>0?proMean(ex)*252/out.te:null;
      const up=pr.filter((x,i)=>br[i]>0),upb=br.filter(x=>x>0),dn=pr.filter((x,i)=>br[i]<0),dnb=br.filter(x=>x<0);
      out.upCap=upb.length&&proMean(upb)!==0?proMean(up)/proMean(upb):null;
      out.downCap=dnb.length&&proMean(dnb)!==0?proMean(dn)/proMean(dnb):null;
      out.benchVol=sb*Math.sqrt(252);
    }
  }
  return out;
}
// Effet de levier économique par symbole (ETF à levier quotidien). Défaut 2× pour un « ETF Levier »
// inconnu ; les inverses sont négatifs.
const LEVERAGE={TQQQ:3,UPRO:3,SPXL:3,SOXL:3,TNA:3,LABU:3,FAS:3,TECL:3,WEBL:3,SQQQ:-3,SPXU:-3,'TQQQ.TO':2};
function proLeverage(sym){if(LEVERAGE[sym]!=null)return LEVERAGE[sym];return getCat(sym)==='ETF Levier'?2:1;}
function computeExposure(){
  const rows=positions.map(p=>{const v=posValueAcct(p);const L=proLeverage(p.symbol);return{sym:p.symbol,v,L,eco:v*L,cls:getWeightClass(p.symbol),cur:getPosCurrency(p)};});
  const cashTot=getCashByAccount().reduce((s,r)=>s+r.value,0);
  const posTot=rows.reduce((s,x)=>s+x.v,0),total=posTot+cashTot;
  const gross=rows.reduce((s,x)=>s+Math.abs(x.eco),0),net=rows.reduce((s,x)=>s+x.eco,0);
  const sorted=[...rows].sort((a,b)=>b.v-a.v);
  const top5=sorted.slice(0,5).reduce((s,x)=>s+x.v,0);
  const nonCash=rows.filter(x=>x.cls!=='Cash');const ncTot=nonCash.reduce((s,x)=>s+x.v,0);
  const hhi=ncTot>0?nonCash.reduce((s,x)=>s+(x.v/ncTot)**2,0):null;
  const usd=rows.filter(x=>x.cur==='USD').reduce((s,x)=>s+x.v,0);
  const cashLike=cashTot+rows.filter(x=>x.cls==='Cash').reduce((s,x)=>s+x.v,0);
  return{total,gross,net,grossLev:total>0?gross/total:null,netLev:total>0?net/total:null,top5:total>0?top5/total:null,
    top1:sorted[0]?{sym:sorted[0].sym,w:sorted[0].v/total}:null,effN:hhi?1/hhi:null,usd:total>0?usd/total:null,cash:total>0?cashLike/total:null,
    levShare:total>0?rows.filter(x=>Math.abs(x.L)>1).reduce((s,x)=>s+x.v,0)/total:null};
}
// Chocs instantanés par « facteur ». Volontairement simples et transparents (pas un modèle) :
// chaque position reçoit le choc de sa classe × son levier, le cash ne bouge pas.
const STRESS=[
  {name:'Correction boursière −10 %',eq:-0.10,crypto:-0.20,fx:0},
  {name:'Krach Nasdaq −30 %',eq:-0.30,crypto:-0.45,fx:0.05},
  {name:'Hiver crypto −60 %',eq:-0.05,crypto:-0.60,fx:0},
  {name:'Hausse des taux +100 pb',eq:-0.08,crypto:-0.15,fx:0.02},
  {name:'Dollar US −10 % vs CAD',eq:0,crypto:0,fx:-0.10},
];
function computeStress(){
  const total=positions.reduce((s,p)=>s+posValueAcct(p),0)+getCashByAccount().reduce((s,r)=>s+r.value,0);
  return STRESS.map(sc=>{
    let pnl=0;
    positions.forEach(p=>{
      const v=posValueAcct(p),cls=getWeightClass(p.symbol);if(cls==='Cash')return;
      const base=(cls==='Crypto'||/^FBTC/.test(p.symbol))?sc.crypto:sc.eq;
      let shock=Math.max(-0.95,base*proLeverage(p.symbol));
      const fxs=getPosCurrency(p)==='USD'?sc.fx:0;
      pnl+=v*((1+shock)*(1+fxs)-1);
    });
    return{name:sc.name,pnl,pct:total>0?pnl/total:0};
  });
}
function anTile(label,val,sub,cls,tip){
  return`<div class="an-tile"${tip?` title="${escapeHtml(tip)}"`:''}><div class="an-tile-l">${label}</div><div class="an-tile-v ${cls||''}">${val}</div>${sub?`<div class="an-tile-s">${sub}</div>`:''}</div>`;
}
const BENCH_LBL={SPY:'S&P 500',QQQ:'Nasdaq-100','XIU.TO':'S&P/TSX 60'};
async function renderAnalyse(){
  const root=document.getElementById('tab-analyse');if(!root)return;
  const S=buildTwrSeries();
  const W=anWindow(S,PRO.period);
  const sub=document.getElementById('an-sub');
  if(W.rets.length<5){
    if(sub)sub.textContent='Il faut au moins une semaine de snapshots quotidiens pour calculer les mesures de risque.';
    document.getElementById('an-metrics').innerHTML='<div class="alloc-empty-state">Historique insuffisant.</div>';
  }
  const benchVals=W.rets.length>=5?await proBenchSeries(PRO.bench,W.dates):null;
  const M=computeRiskMetrics(W,benchVals);
  const bl=BENCH_LBL[PRO.bench]||PRO.bench;
  if(sub&&M.days!=null)sub.textContent=`${PERIOD_LBL[PRO.period]} · ${W.dates[0]} → ${W.dates[W.dates.length-1]} · ${M.n} rendements quotidiens · indice : ${bl} en $ CA · taux sans risque ${(AN_RF*100).toFixed(0)} %`;
  // Tuiles groupées
  const grp=(title,tiles)=>`<div class="an-group"><div class="an-group-t">${title}</div><div class="an-group-g">${tiles.join('')}</div></div>`;
  const shortH=M.days!=null&&M.days<365;
  if(M.days!=null){
    document.getElementById('an-metrics').innerHTML=[
      grp('Rendement & volatilité',[
        anTile('Rendement TWR',fmtP1(M.ret),PERIOD_LBL[PRO.period],proSignCls(M.ret)),
        anTile(shortH?'Annualisé (extrapolé)':'CAGR',fmtP1(M.cagr),shortH?'moins d’un an : indicatif':'rendement composé',proSignCls(M.cagr)),
        anTile('Volatilité',fmtU1(M.vol),'écart-type annualisé'),
        anTile('Volatilité baissière',fmtU1(M.downVol),'jours sous le taux sans risque'),
      ]),
      grp('Rendement ajusté au risque',[
        anTile('Sharpe',fmtR(M.sharpe),'excédent ÷ volatilité',M.sharpe>=1?'pos':M.sharpe<0?'neg':'','(rendement moyen − taux sans risque) ÷ écart-type, annualisé'),
        anTile('Sortino',fmtR(M.sortino),'excédent ÷ volatilité baissière',M.sortino>=1.5?'pos':M.sortino<0?'neg':''),
        anTile('Calmar',fmtR(M.calmar),'rendement annuel ÷ max drawdown',M.calmar>=1?'pos':''),
        anTile('Jours positifs',fmtU1(M.posDays,0),`meilleur ${fmtP1(M.best)} · pire ${fmtP1(M.worst)}`),
      ]),
      grp(`Relatif au ${bl}`,[
        anTile('Bêta',fmtR(M.beta),'sensibilité à l’indice',''),
        anTile('Alpha de Jensen',fmtP1(M.alpha),'annualisé, ajusté du bêta',proSignCls(M.alpha)),
        anTile('Tracking error',fmtU1(M.te),'écart-type de l’écart'),
        anTile('Ratio d’information',fmtR(M.ir),`corrélation ${fmtR(M.corr)}`,M.ir>=0.5?'pos':M.ir<0?'neg':''),
        anTile('Capture haussière',M.upCap!=null?fmtU1(M.upCap,0):'—','jours où l’indice monte'),
        anTile('Capture baissière',M.downCap!=null?fmtU1(M.downCap,0):'—','jours où l’indice baisse',M.downCap!=null&&M.downCap<1?'pos':M.downCap>1?'neg':''),
      ]),
      grp('Pertes extrêmes',[
        anTile('Max drawdown',M.mdd!=null?'−'+(M.mdd*100).toFixed(1)+' %':'—',M.mddFrom?`${M.mddFrom} → ${M.mddTo}`:'','neg'),
        anTile('Drawdown actuel',M.curDD>0.0005?'−'+(M.curDD*100).toFixed(1)+' %':'0.0 %',M.longestDD?`plus long : ${M.longestDD} j`:'',M.curDD>0.0005?'neg':''),
        anTile('VaR 95 % (1 jour)',M.var95!=null?'−'+(M.var95*100).toFixed(1)+' %':'—',M.var95!=null?`≈ ${fmtAmtRound(M.var95*(S.hist[S.hist.length-1]?.value||0))} historique`:'','neg','Perte journalière dépassée seulement 5 % des jours (historique)'),
        anTile('CVaR 95 %',M.cvar95!=null?'−'+(M.cvar95*100).toFixed(1)+' %':'—','perte moyenne au-delà de la VaR','neg'),
        anTile('Asymétrie',fmtR(M.skew),'skewness des rendements'),
        anTile('Kurtosis',fmtR(M.kurt),'excès (queues épaisses si > 0)'),
      ]),
    ].join('');
  }
  // Graphiques
  if(W.rets.length>=2&&typeof Chart!=='undefined'){
    const labels=W.dates.map(d=>d.slice(5));
    const bench0=benchVals?benchVals.find(v=>v!=null):null;
    const cumP=W.idx.map(v=>(v-1)*100),cumB=benchVals?benchVals.map(v=>v&&bench0?(v/bench0-1)*100:null):[];
    const cs=document.getElementById('an-cum-sub');if(cs)cs.innerHTML=`<span class="an-dot" style="background:var(--accent)"></span>Toi ${fmtP1(M.ret)} <span class="an-dot" style="background:var(--steel);margin-left:8px"></span>${bl} ${fmtP1(M.benchRet)}`;
    proDestroy('cum');
    PRO.charts.cum=new Chart(document.getElementById('anCumChart'),{type:'line',data:{labels,datasets:[
      {data:cumP,borderColor:themeHex('accent'),backgroundColor:accentAreaFill,fill:true,borderWidth:2,pointRadius:0,tension:0.3,ncGlow:true},
      {data:cumB,borderColor:themeHex('steel'),borderDash:[5,4],borderWidth:1.4,pointRadius:0,tension:0.3,spanGaps:true}]},
      options:{...proChartBase(),plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>' '+(c.datasetIndex?bl:'Portefeuille')+' : '+(c.raw>=0?'+':'')+(+c.raw).toFixed(1)+' %'}}},
        scales:{...proChartBase().scales,y:{...proChartBase().scales.y,ticks:{...proChartBase().scales.y.ticks,callback:v=>v+' %'}}}}});
    proDestroy('dd');
    const ddAll=[];let pk=W.idx[0];W.idx.forEach(v=>{if(v>pk)pk=v;ddAll.push((v/pk-1)*100);});
    PRO.charts.dd=new Chart(document.getElementById('anDdChart'),{type:'line',data:{labels,datasets:[
      {data:ddAll,borderColor:themeHex('neg'),backgroundColor:themeRgba('neg',0.18),fill:'origin',borderWidth:1.6,pointRadius:0,tension:0.25}]},
      options:{...proChartBase(),plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>' '+(+c.raw).toFixed(1)+' %'}}},
        scales:{...proChartBase().scales,y:{...proChartBase().scales.y,max:0,ticks:{...proChartBase().scales.y.ticks,callback:v=>v+' %'}}}}});
    proDestroy('vol');
    const win=21,rv=W.rets.map((_,i)=>i+1>=win?proStd(W.rets.slice(i+1-win,i+1))*Math.sqrt(252)*100:null);
    PRO.charts.vol=new Chart(document.getElementById('anVolChart'),{type:'line',data:{labels:labels.slice(1),datasets:[
      {data:rv,borderColor:themeHex('blue'),backgroundColor:themeRgba('blue',0.12),fill:true,borderWidth:1.8,pointRadius:0,tension:0.3,spanGaps:false}]},
      options:{...proChartBase(),plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>c.raw==null?'':' '+(+c.raw).toFixed(1)+' %'}}},
        scales:{...proChartBase().scales,y:{...proChartBase().scales.y,beginAtZero:true,ticks:{...proChartBase().scales.y.ticks,callback:v=>v+' %'}}}}});
  }
  // Exposition
  const E=computeExposure();
  const row=(l,v,s,cls)=>`<div class="an-kv"><span class="an-kv-l">${l}${s?`<small>${s}</small>`:''}</span><span class="an-kv-v ${cls||''}" data-sensitive>${v}</span></div>`;
  document.getElementById('an-exposure').innerHTML=
    row('Exposition économique brute',fmtAmtRound(E.gross),'valeur × levier des ETF')+
    row('Levier brut du portefeuille',E.grossLev!=null?E.grossLev.toFixed(2)+'×':'—','exposition ÷ valeur totale',E.grossLev>1.5?'neg':'')+
    row('Poids des ETF à levier',fmtU1(E.levShare),'TQQQ, SOXL, …')+
    row('Cash et quasi-cash',fmtU1(E.cash),'cash dispo + CASH.TO')+
    row('Exposition au dollar US',fmtU1(E.usd),'positions cotées en USD')+
    row('Plus grosse position',E.top1?`${escapeHtml(E.top1.sym)} · ${fmtU1(E.top1.w)}`:'—','')+
    row('Top 5 positions',fmtU1(E.top5),'du portefeuille total')+
    row('Positions effectives',E.effN?E.effN.toFixed(1):'—','1 ÷ Herfindahl, hors cash');
  const ST=computeStress();
  const mx=Math.max(...ST.map(x=>Math.abs(x.pct)),0.01);
  document.getElementById('an-stress').innerHTML=ST.map(x=>`<div class="an-stress-row"><span class="an-stress-n">${escapeHtml(x.name)}</span><div class="an-stress-bar"><div style="width:${Math.abs(x.pct)/mx*100}%;background:${x.pct<0?'var(--neg)':'var(--pos)'}"></div></div><span class="an-stress-v ${proSignCls(x.pnl)}" data-sensitive>${x.pnl>=0?'+':'−'}${fmtAmtRound(Math.abs(x.pnl))}</span><span class="an-stress-p ${proSignCls(x.pct)}">${fmtP1(x.pct)}</span></div>`).join('')+
    `<div class="an-foot">Choc de la classe × levier de l'ETF (plafonné à −95 %), cash inchangé. Indicatif seulement — pas un modèle de risque.</div>`;
  renderAttribution();
  renderTwrMwr(S);
}
function setAnPeriod(p){PRO.period=p;document.querySelectorAll('#an-period .period-btn').forEach(b=>b.classList.toggle('active',b.dataset.p===p));renderAnalyse();}
function setAnBench(b){PRO.bench=b;renderAnalyse();}

// ─── C. 02 ATTRIBUTION ─────────────────────────────────────────────────────────────────────
// Pour chaque ligne (position ouverte, vente fermée, dividende) en $ CA :
//   effet prix   = (valeur locale − coût local) × taux de change moyen à l'achat
//   effet change = valeur locale × (taux du jour − taux moyen à l'achat)
//   (prix + change = P&L latent exact en $ CA, avec le coût figé au taux de chaque achat)
//   réalisé      = profit des ventes, converti au taux du jour (le taux à la vente n'est pas stocké)
function computeAttribution(){
  const rows={};
  const sleeveOf=sym=>{try{return ipsSleeveOfSymbol(sym)?.name||'Hors IPS';}catch(e){return'—';}};
  const keyOf=(sym,acct)=>{
    const g=PRO.attrGroup;
    if(g==='class')return getWeightClass(sym);
    if(g==='account')return acct||'Non spécifié';
    if(g==='sleeve')return sleeveOf(sym);
    return sym;
  };
  const get=k=>rows[k]||(rows[k]={key:k,price:0,fx:0,realized:0,div:0,cost:0,value:0});
  positions.forEach(p=>{
    const cur=getPosCurrency(p),value=posValueAcct(p),cost=getPositionAcbCAD(p);
    const localVal=(p.shares||0)*(p.current||0);
    const localCost=(p.entries&&p.entries.length)?p.entries.reduce((s,e)=>s+(parseFloat(e.shares)||0)*(parseFloat(e.price)||0),0):(p.shares||0)*(p.avgEntry||0);
    const r=get(keyOf(p.symbol,p.account));
    r.value+=value;r.cost+=cost;
    if(cur===accountCurrency||localCost<=0){r.price+=value-cost;}
    else{
      const fxBuy=cost/localCost,fxNow=value/(localVal||1);
      const priceEff=(localVal-localCost)*fxBuy;
      r.price+=priceEff;r.fx+=(value-cost)-priceEff;
      void fxNow;
    }
  });
  trades.forEach(t=>{
    if(t.type==='Vente'){get(keyOf(t.symbol,t.account||t.accountType)).realized+=toUSD(t.profit||0,getTradeCurrency(t))*fxRate;}
    else if(t.type==='Dividende'){get(keyOf(t.symbol,t.accountType||t.account)).div+=fxConvert(t.size||0,getTradeCurrency(t),'CAD');}
  });
  const list=Object.values(rows).map(r=>({...r,total:r.price+r.fx+r.realized+r.div})).filter(r=>Math.abs(r.total)>0.005||r.value>0.005);
  const tot=list.reduce((s,r)=>s+r.total,0);
  const totVal=positions.reduce((s,p)=>s+posValueAcct(p),0)+getCashByAccount().reduce((s,r)=>s+r.value,0);
  list.forEach(r=>{r.share=Math.abs(tot)>0.005?r.total/Math.abs(tot):0;r.weight=totVal>0?r.value/totVal:0;r.roc=r.cost>0?(r.price+r.fx)/r.cost:null;});
  list.sort((a,b)=>b.total-a.total);
  return{list,tot,sum:{price:list.reduce((s,r)=>s+r.price,0),fx:list.reduce((s,r)=>s+r.fx,0),realized:list.reduce((s,r)=>s+r.realized,0),div:list.reduce((s,r)=>s+r.div,0)}};
}
function setAttrGroup(g){PRO.attrGroup=g;document.querySelectorAll('#an-attr-group button').forEach(b=>b.classList.toggle('active',b.dataset.g===g));renderAttribution();}
function renderAttribution(){
  const el=document.getElementById('an-attr-table');if(!el)return;
  const A=computeAttribution();
  const totEl=document.getElementById('an-attr-total');
  if(totEl)totEl.innerHTML=`P&L total <b class="${proSignCls(A.tot)}" data-sensitive>${A.tot>=0?'+':'−'}${fmtAmtRound(Math.abs(A.tot))}</b>`;
  const money=v=>Math.abs(v)<0.5?'<span class="muted">—</span>':`<span class="${proSignCls(v)}">${v>=0?'+':'−'}${fmtAmtRound(Math.abs(v))}</span>`;
  el.innerHTML=`<table class="nc-table an-table"><thead><tr><th>${{asset:'Actif',class:'Classe',sleeve:'Poche IPS',account:'Compte'}[PRO.attrGroup]}</th><th>Poids</th><th>Effet prix</th><th>Effet change</th><th>Réalisé</th><th>Dividendes</th><th>Total</th><th>Part du P&amp;L</th><th>Rdt / coût</th></tr></thead><tbody>${
    A.list.map(r=>`<tr><td class="sym">${escapeHtml(r.key)}</td><td class="w-cell">${r.weight>0?fmtU1(r.weight):'<span class="muted">fermé</span>'}</td><td data-sensitive>${money(r.price)}</td><td data-sensitive>${money(r.fx)}</td><td data-sensitive>${money(r.realized)}</td><td data-sensitive>${money(r.div)}</td><td data-sensitive><b>${money(r.total)}</b></td><td><div class="an-share"><div class="an-share-bar"><div style="width:${Math.min(100,Math.abs(r.share)*100)}%;background:${r.total>=0?'var(--pos)':'var(--neg)'}"></div></div><span>${fmtU1(r.share,0)}</span></div></td><td class="${proSignCls(r.roc)}">${r.roc!=null?fmtP1(r.roc):'—'}</td></tr>`).join('')
  }</tbody><tfoot><tr class="pos-total-row"><td class="sym">Total</td><td></td><td data-sensitive>${money(A.sum.price)}</td><td data-sensitive>${money(A.sum.fx)}</td><td data-sensitive>${money(A.sum.realized)}</td><td data-sensitive>${money(A.sum.div)}</td><td data-sensitive><b>${money(A.tot)}</b></td><td></td><td></td></tr></tfoot></table>`;
  // Pont (waterfall) : 0 → contributions (top 10 + autres) → total
  if(typeof Chart==='undefined')return;
  const items=[...A.list].sort((a,b)=>Math.abs(b.total)-Math.abs(a.total));
  const top=items.slice(0,10),rest=items.slice(10).reduce((s,r)=>s+r.total,0);
  if(Math.abs(rest)>0.5)top.push({key:'Autres',total:rest});
  top.sort((a,b)=>b.total-a.total);
  let run=0;const bars=top.map(r=>{const a=run;run+=r.total;return[a,run];});
  const labels=[...top.map(r=>r.key),'Total'];bars.push([0,run]);
  const colors=[...top.map(r=>r.total>=0?themeHex('pos'):themeHex('neg')),themeHex('accent')];
  proDestroy('attr');
  PRO.charts.attr=new Chart(document.getElementById('anAttrChart'),{type:'bar',data:{labels,datasets:[{data:bars,backgroundColor:colors,borderRadius:4,borderSkipped:false,maxBarThickness:42}]},
    options:{...proChartBase(),plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>{const v=c.raw[1]-c.raw[0];return' '+(c.label==='Total'?'Total':'Contribution')+' : '+(v>=0?'+':'−')+fmtAmtRound(Math.abs(v));}}}},
      scales:{x:{...proChartBase().scales.x,ticks:{...proChartBase().scales.x.ticks,maxTicksLimit:14,autoSkip:false,maxRotation:45,minRotation:0}},y:{...proChartBase().scales.y,ticks:{...proChartBase().scales.y.ticks,callback:v=>fmtAmtRound(v)}}}}});
}

// ─── D. 03 TWR vs MWR ──────────────────────────────────────────────────────────────────────
// XIRR : Σ cf_i / (1+r)^(t_i/365) = 0. Newton, repli bisection sur ]−99 %, +1000 %[.
function proXirr(cfs){
  if(cfs.length<2)return null;
  const t0=proDayNum(cfs[0].date);
  const ts=cfs.map(c=>(proDayNum(c.date)-t0)/365);
  const f=r=>cfs.reduce((s,c,i)=>s+c.amt/Math.pow(1+r,ts[i]),0);
  const df=r=>cfs.reduce((s,c,i)=>s-ts[i]*c.amt/Math.pow(1+r,ts[i]+1),0);
  let r=0.1;
  for(let k=0;k<60;k++){const v=f(r),d=df(r);if(!isFinite(v)||!isFinite(d)||d===0)break;const nr=r-v/d;if(!isFinite(nr)||nr<=-0.999)break;if(Math.abs(nr-r)<1e-9)return nr;r=nr;}
  let lo=-0.99,hi=10,flo=f(lo),fhi=f(hi);
  if(!isFinite(flo)||!isFinite(fhi)||flo*fhi>0)return null;
  for(let k=0;k<200;k++){const mid=(lo+hi)/2,fm=f(mid);if(Math.abs(fm)<1e-7)return mid;if(flo*fm<0){hi=mid;fhi=fm;}else{lo=mid;flo=fm;}}
  return(lo+hi)/2;
}
// MWR d'une fenêtre : investissement initial = valeur au début, + dépôts/retraits datés dans la
// fenêtre, − valeur finale. Renvoie {ann, period} (taux annuel et équivalent sur la période).
function proMwr(S,i0){
  const h=S.hist;if(h.length<2||i0>=h.length-1)return null;
  const start=h[i0],end=h[h.length-1];
  const cfs=[{date:start.date,amt:-start.value}];
  S.flows.filter(f=>f.date>start.date&&f.date<=end.date).forEach(f=>cfs.push({date:f.date,amt:-f.amt}));
  cfs.push({date:end.date,amt:end.value});
  const irr=proXirr(cfs);if(irr==null)return null;
  const days=proDaysBetween(start.date,end.date);
  return{ann:irr,period:Math.pow(1+irr,days/365)-1,days};
}
async function renderTwrMwr(S){
  const el=document.getElementById('an-ret-table');if(!el)return;
  if(S.hist.length<3){el.innerHTML='<div class="alloc-empty-state">Historique insuffisant.</div>';return;}
  const dates=S.hist.map(h=>h.date);
  const bench=await proBenchSeries(PRO.bench,dates);
  const bl=BENCH_LBL[PRO.bench]||PRO.bench;
  const rows=['1M','3M','6M','YTD','1Y','ALL'].map(p=>{
    const st=proPeriodStart(p);
    let i0=0;if(st){const k=S.hist.findIndex(h=>h.date>=st);if(k<0)return null;i0=Math.max(0,k-1);if(st<S.hist[0].date)return{p,na:true};}
    const twr=S.idx[S.idx.length-1]/S.idx[i0]-1;
    const mwr=proMwr(S,i0);
    let br=null;if(bench){const b0=bench.slice(i0).find(v=>v!=null),b1=bench[bench.length-1];if(b0&&b1)br=b1/b0-1;}
    const days=proDaysBetween(S.hist[i0].date,S.hist[S.hist.length-1].date);
    const net=S.flows.filter(f=>f.date>S.hist[i0].date).reduce((s,f)=>s+f.amt,0);
    return{p,twr,mwr,br,days,net,twrAnn:days>=365?Math.pow(1+twr,365/days)-1:null};
  }).filter(Boolean);
  el.innerHTML=`<table class="nc-table an-table"><thead><tr><th>Période</th><th>TWR</th><th>MWR (TRI)</th><th>Effet de timing</th><th>${escapeHtml(bl)}</th><th>TWR − indice</th><th>Dépôts nets</th></tr></thead><tbody>${
    rows.map(r=>r.na?`<tr><td class="sym">${PERIOD_LBL[r.p]}</td><td colspan="6" class="muted">Historique plus court que la période</td></tr>`:
      `<tr><td class="sym">${PERIOD_LBL[r.p].replace(/^./,c=>c.toUpperCase())}<small class="an-days">${r.days} j</small></td>
        <td class="${proSignCls(r.twr)}"><b>${fmtP1(r.twr)}</b>${r.twrAnn!=null?`<small class="an-days">${fmtP1(r.twrAnn)}/an</small>`:''}</td>
        <td class="${proSignCls(r.mwr?.period)}">${r.mwr?fmtP1(r.mwr.period):'—'}${r.mwr&&r.days>=365?`<small class="an-days">${fmtP1(r.mwr.ann)}/an</small>`:''}</td>
        <td class="${proSignCls(r.mwr?r.mwr.period-r.twr:null)}">${r.mwr?fmtP1(r.mwr.period-r.twr):'—'}</td>
        <td class="${proSignCls(r.br)}">${fmtP1(r.br)}</td>
        <td class="${proSignCls(r.br!=null?r.twr-r.br:null)}"><b>${r.br!=null?fmtP1(r.twr-r.br):'—'}</b></td>
        <td data-sensitive>${Math.abs(r.net)>0.5?(r.net>=0?'+':'−')+fmtAmtRound(Math.abs(r.net)):'<span class="muted">—</span>'}</td></tr>`).join('')
  }</tbody></table><div class="an-foot">Rendements sur la période (non annualisés), annualisés sous la valeur quand la période dépasse un an. Indice en $ CA, dividendes non inclus.</div>`;
}

// Écriture d'une colonne annexe de user_data (ips, audit_log) SÉRIALISÉE avec saveData() :
// saveData() attend proPendingWrite avant de lire lastKnownUpdatedAt, et on attend qu'aucune
// sauvegarde principale ne soit en cours — sinon le verrou optimiste verrait un faux conflit.
var proPendingWrite=null;
async function proWriteColumns(body){
  if(!currentUser||!accessToken)return null;
  while(typeof _savePending!=='undefined'&&_savePending)await new Promise(r=>setTimeout(r,150));
  if(proPendingWrite)await proPendingWrite;
  const run=(async()=>{
    try{
      const nowIso=new Date().toISOString();
      const res=await fetch(`${SB_URL}/rest/v1/user_data?user_id=eq.${currentUser.id}`,{method:'PATCH',headers:{...sbHeaders(),'Prefer':'return=representation'},body:JSON.stringify({...body,updated_at:nowIso})});
      if(res.ok){const rows=await res.json().catch(()=>[]);if(rows.length)lastKnownUpdatedAt=nowIso;return true;}
      return false; // 400 = colonne absente (migration SQL pas encore faite)
    }catch(e){return null;}
  })();
  proPendingWrite=run;
  const r=await run;if(proPendingWrite===run)proPendingWrite=null;
  return r;
}

// ─── E. POLITIQUE DE PLACEMENT (IPS) ───────────────────────────────────────────────────────
// Valeurs par défaut = « Game plan — Portefeuille personnel », état au 30 sept. 2026 (section 1
// Allocation cible, section 2 poche crypto, section 3 réserve/marge, section 5 règles).
// Poids calculés sur la valeur TOTALE (positions + cash). Rattachement d'un élément à une poche :
// 1) symbole listé explicitement, 2) classe d'actif listée, 3) pour le cash : compte listé.
// Ce qui ne tombe dans aucune poche est montré « Hors IPS ».
const DISNAT_ACCOUNTS=['CELI (CAD)','CELI (USD)','CELIAPP (CAD)','CELIAPP (USD)','Comptant (CAD)','Comptant (USD)','Marge','REER','REEE','CELI','CELIAPP','Comptant'];
const CRYPTO_ACCOUNTS=['Coinbase','Binance','Kraken','Bitget','OKX','Bybit','Kucoin','Ledger Nano S','Ledger Nano X','Ledger Stax','Tangem','Trezor Model One','Trezor Model T','MetaMask','Autre wallet'];
const IPS_DEFAULT={
  version:1,source:'Game plan — 30 sept. 2026',rebalance:'trimestriel',
  sleeves:[
    {id:'core',name:'Core — XQQ',min:20,target:22.5,max:25,horizon:'10 ans',symbols:['XQQ.TO'],classes:[],cashAccounts:[]},
    {id:'tqqq',name:'Stratégie TQQQ',min:30,target:40,max:50,horizon:'10 ans',symbols:['TQQQ','TQQQ.TO','CASH.TO'],classes:[],cashAccounts:DISNAT_ACCOUNTS.slice()},
    {id:'crypto',name:'Crypto',min:25,target:30,max:35,horizon:'10 ans',symbols:['FBTC.TO'],classes:['Crypto'],cashAccounts:CRYPTO_ACCOUNTS.slice()},
    {id:'fixed',name:'Revenu fixe',min:0,target:7.5,max:10,horizon:'Temporaire',symbols:['HMAX.TO'],classes:[],cashAccounts:[],note:'Placeholder MSCI World ou HMAX — bande à confirmer'},
  ],
  crypto:{targets:[{label:'BTC (FBTC)',symbols:['FBTC.TO','BTC/USD'],t:30},{label:'ETH',symbols:['ETH/USD'],t:20},{label:'SOL',symbols:['SOL/USD'],t:15},{label:'TAO',symbols:['TAO/USD'],t:15},{label:'ONDO',symbols:['ONDO/USD'],t:15},{label:'Flexible',symbols:[],t:5,flex:true}],
          legacy:['AKASH/USD','FET/USD','RENDER/USD','RSR/USD','PYTH/USD','INJ/USD']},
  tqqqFloor:18765,marginAvailable:20000,
  rules:['Indépendance : chaque stratégie travaille seule ; ses profits ne financent pas une autre stratégie.','Rééquilibrage trimestriel.','Ordre limite placé seulement si le cash est déjà dans le compte ; en baisse rapide, prioriser les T2.','Marge réservée exclusivement au dernier palier TQQQ et à 5 120 $ de l’avant-dernier.'],
};
let ipsConfig=null,ipsCloud=null; // ipsCloud : true = colonne Supabase dispo, false = stockage local
function ipsLoadLocal(){try{const s=localStorage.getItem('nc_ips');return s?JSON.parse(s):null;}catch(e){return null;}}
function getIps(){if(!ipsConfig)ipsConfig=ipsLoadLocal()||JSON.parse(JSON.stringify(IPS_DEFAULT));return ipsConfig;}
function ipsSleeveOfSymbol(sym){
  const I=getIps();const S=(sym||'').toUpperCase();
  return I.sleeves.find(s=>(s.symbols||[]).some(x=>x.toUpperCase()===S))||I.sleeves.find(s=>(s.classes||[]).includes(getWeightClass(sym)))||null;
}
function ipsSleeveOfCash(acct){const I=getIps();return I.sleeves.find(s=>(s.cashAccounts||[]).includes(acct))||null;}
function computeIps(){
  const I=getIps();
  const sl=I.sleeves.map(s=>({...s,value:0,items:[]}));const other={id:'_none',name:'Hors IPS',min:0,target:0,max:0,value:0,items:[]};
  const find=id=>sl.find(x=>x.id===id)||other;
  positions.forEach(p=>{const v=posValueAcct(p);const s=ipsSleeveOfSymbol(p.symbol);const t=s?find(s.id):other;t.value+=v;t.items.push({label:p.symbol+(p.account?' · '+p.account:''),sym:p.symbol,v,kind:'pos'});});
  getCashByAccount().forEach(c=>{const s=ipsSleeveOfCash(c.account);const t=s?find(s.id):other;t.value+=c.value;t.items.push({label:'Cash · '+c.account,v:c.value,kind:'cash',account:c.account});});
  const total=sl.reduce((s,x)=>s+x.value,0)+other.value;
  const all=[...sl,...(other.value>0.5?[other]:[])];
  all.forEach(s=>{
    s.w=total>0?s.value/total*100:0;
    const band=Math.max(0.5,(s.max-s.min));
    s.status=s.id==='_none'?(s.w>0.05?'unmapped':'ok'):(s.w<s.min-1e-9||s.w>s.max+1e-9)?'out':((s.min>0&&s.w-s.min<band*0.15)||s.max-s.w<band*0.15)?'near':'ok';
    s.toTarget=(s.target/100)*total-s.value;
    s.toBand=s.w<s.min?(s.min/100)*total-s.value:s.w>s.max?(s.max/100)*total-s.value:0;
  });
  // Réserve TQQQ = CASH.TO + cash des comptes de la poche TQQQ
  const tq=sl.find(s=>s.id==='tqqq');
  const reserve=tq?tq.items.filter(it=>it.kind==='cash'||/^CASH\.TO$/i.test(it.sym||'')).reduce((s,it)=>s+it.v,0):0;
  // Poche crypto : cibles internes
  const cr=sl.find(s=>s.id==='crypto');let crypto=null;
  if(cr&&I.crypto){
    const legacySet=new Set((I.crypto.legacy||[]).map(x=>x.toUpperCase()));
    const tgt=I.crypto.targets.map(t=>({...t,value:0}));
    const flex=tgt.find(t=>t.flex);let legacy=0,dry=0;
    cr.items.forEach(it=>{
      if(it.kind==='cash'){dry+=it.v;return;}
      const S=(it.sym||'').toUpperCase();
      if(legacySet.has(S)){legacy+=it.v;return;}
      const t=tgt.find(x=>!x.flex&&(x.symbols||[]).some(y=>y.toUpperCase()===S));
      if(t)t.value+=it.v;else if(flex)flex.value+=it.v;
    });
    const inTarget=tgt.reduce((s,t)=>s+t.value,0)+dry;
    tgt.forEach(t=>{t.w=inTarget>0?t.value/inTarget*100:0;t.gap=(t.t/100)*inTarget-t.value;});
    crypto={tgt,legacy,dry,inTarget,total:cr.value};
  }
  const outCount=all.filter(s=>s.status==='out').length;
  return{I,sleeves:all,total,reserve,crypto,outCount,nearCount:all.filter(s=>s.status==='near').length};
}
function ipsNextRebalance(){
  const d=new Date(localToday()+'T12:00:00');const q=Math.floor(d.getMonth()/3);
  const end=new Date(d.getFullYear(),q*3+3,0,12);
  return{date:end.toISOString().slice(0,10),days:Math.round((end-d)/86400000)};
}
const IPS_STATUS={ok:['Conforme','var(--pos)'],near:['Près de la borne','var(--amber)'],out:['Hors bande','var(--neg)'],unmapped:['À rattacher à une poche','var(--amber)']};
function renderIps(){
  const box=document.getElementById('ips-sleeves');if(!box)return;
  const R=computeIps(),I=R.I;
  const src=document.getElementById('ips-source');if(src)src.textContent=(I.source?I.source+' · ':'')+(ipsCloud===false?'enregistré sur cet appareil':ipsCloud?'synchronisé':'');
  const lbl=document.getElementById('ips-status-lbl');
  if(lbl)lbl.innerHTML=R.outCount?`<b style="color:var(--neg)">${R.outCount} poche${R.outCount>1?'s':''} hors bande</b>`:R.nearCount?`<b style="color:var(--amber)">${R.nearCount} près d'une borne</b>`:'<b style="color:var(--pos)">Toutes les poches dans leur bande</b>';
  const nr=ipsNextRebalance();const nx=document.getElementById('ips-next');if(nx)nx.textContent=`Prochain rééquilibrage (${I.rebalance||'trimestriel'}) : ${nr.date} · dans ${nr.days} j`;
  const scaleMax=Math.max(60,...R.sleeves.map(s=>Math.max(s.max,s.w)+5));
  const pct=v=>(Math.min(scaleMax,Math.max(0,v))/scaleMax*100).toFixed(2)+'%';
  box.innerHTML=R.sleeves.map(s=>{
    const st=IPS_STATUS[s.status];
    return`<div class="ips-row ips-${s.status}">
      <div class="ips-row-head"><span class="ips-name">${escapeHtml(s.name)}</span>${s.horizon?`<span class="ips-hz">${escapeHtml(s.horizon)}</span>`:''}<span class="ips-st" style="color:${st[1]}">${st[0]}</span>
        <span class="ips-w" data-sensitive>${s.w.toFixed(1)} %</span><span class="ips-band">${s.id==='_none'?'cible 0 %':`${s.min} / ${s.target} / ${s.max} %`}</span></div>
      <div class="ips-track">${s.id==='_none'?'':`<div class="ips-bandfill" style="left:${pct(s.min)};width:calc(${pct(s.max)} - ${pct(s.min)})"></div><div class="ips-target" style="left:${pct(s.target)}"></div>`}
        <div class="ips-fill" style="width:${pct(s.w)}"></div><div class="ips-marker" style="left:${pct(s.w)}"></div></div>
      <div class="ips-row-foot"><span data-sensitive>${fmtAmtRound(s.value)}</span><span class="muted">${s.items.length} élément${s.items.length>1?'s':''}${s.note?' · '+escapeHtml(s.note):''}</span></div>
    </div>`;}).join('');
  // Ordres
  const ord=document.getElementById('ips-orders');
  if(ord){
    const lines=R.sleeves.filter(s=>s.id!=='_none'&&Math.abs(s.toTarget)>=Math.max(25,R.total*0.002)).sort((a,b)=>a.toTarget-b.toTarget);
    ord.innerHTML=(lines.length?lines.map(s=>`<div class="ips-order"><span class="ips-order-act ${s.toTarget<0?'sell':'buy'}">${s.toTarget<0?'Alléger':'Renforcer'}</span><span class="ips-order-name">${escapeHtml(s.name)}</span><span class="ips-order-amt" data-sensitive>${fmtAmtRound(Math.abs(s.toTarget))}</span>${s.toBand?`<span class="ips-order-band">min. ${fmtAmtRound(Math.abs(s.toBand))} pour rentrer dans la bande</span>`:''}</div>`).join(''):'<div class="alloc-empty-state">Portefeuille aligné sur les cibles.</div>')+
      `<div class="an-foot">Montants pour ramener chaque poche à sa cible. Règle d'indépendance : un rééquilibrage passe par les nouvelles entrées ou une décision trimestrielle, pas par les profits d'une autre stratégie.</div>`;
  }
  // Garde-fous
  const g=document.getElementById('ips-guards');
  if(g){
    const okR=R.reserve>=I.tqqqFloor-0.5;
    g.innerHTML=`<div class="ips-guard ${okR?'ok':'bad'}"><div class="ips-guard-t">Réserve TQQQ vs plancher</div><div class="ips-guard-v" data-sensitive>${fmtAmtRound(R.reserve)} <small>/ plancher ${fmtAmtRound(I.tqqqFloor)}</small></div><div class="ips-guard-bar"><div style="width:${Math.min(100,I.tqqqFloor>0?R.reserve/I.tqqqFloor*100:100)}%"></div></div><div class="ips-guard-s">${okR?'Au-dessus du plancher':'Sous le plancher : ne pas puiser dans la réserve'} · CASH.TO + cash Disnat</div></div>
      <div class="ips-guard"><div class="ips-guard-t">Marge disponible</div><div class="ips-guard-v" data-sensitive>${fmtAmtRound(I.marginAvailable)}</div><div class="ips-guard-s">Réservée au dernier palier TQQQ — limite de risque de l'IPS</div></div>
      <details class="ips-rules"><summary>Règles de l'IPS (${(I.rules||[]).length})</summary>${(I.rules||[]).map(r=>`<div>${escapeHtml(r)}</div>`).join('')}</details>`;
  }
  // Crypto
  const cbox=document.getElementById('ips-crypto');
  if(cbox){
    const C=R.crypto;
    if(!C||C.total<0.5){cbox.innerHTML='<div class="alloc-empty-state">Aucune position crypto.</div>';}
    else cbox.innerHTML=`<table class="nc-table an-table"><thead><tr><th>Actif</th><th>Cible</th><th>Actuel</th><th>Écart</th><th>Montant</th><th>Pour atteindre la cible</th></tr></thead><tbody>${
      C.tgt.map(t=>{const d=t.w-t.t;return`<tr><td class="sym">${escapeHtml(t.label)}</td><td>${t.t} %</td><td><div class="an-share"><div class="an-share-bar"><div style="width:${Math.min(100,t.w/Math.max(t.t,1)*50)}%;background:${Math.abs(d)<=2?'var(--pos)':d>0?'var(--amber)':'var(--blue)'}"></div></div><span>${t.w.toFixed(1)} %</span></div></td><td class="${Math.abs(d)<=2?'':d>0?'neg':'pos'}">${(d>=0?'+':'−')+Math.abs(d).toFixed(1)} pts</td><td data-sensitive>${fmtAmtRound(t.value)}</td><td data-sensitive>${Math.abs(t.gap)<5?'<span class="muted">—</span>':(t.gap>0?'Acheter ':'Alléger ')+fmtAmtRound(Math.abs(t.gap))}</td></tr>`;}).join('')
    }</tbody></table><div class="an-foot">Base = poche crypto hors legacy (${fmtAmtRound(C.inTarget)}, dont poudre sèche ${fmtAmtRound(C.dry)}). Legacy hors cible : ${fmtAmtRound(C.legacy)} — on n'y touche pas, vente au BE ou au sommet du cycle.</div>`;
  }
  updateNavPills(R);
}
function goToIps(){goToTab('allocation');setTimeout(()=>document.getElementById('ips-anchor')?.scrollIntoView({behavior:'smooth',block:'start'}),120);}
// Sauvegarde : colonne `ips` de user_data si elle existe, sinon localStorage (voir SQL fourni).
async function saveIps(cfg){
  ipsConfig=cfg;try{localStorage.setItem('nc_ips',JSON.stringify(cfg));}catch(e){}
  if(ipsCloud!==false){const ok=await proWriteColumns({ips:JSON.stringify(cfg)});if(ok===true)ipsCloud=true;else if(ok===false)ipsCloud=false;}
  auditPush('ips','IPS modifié : '+cfg.sleeves.map(s=>`${s.name} ${s.min}/${s.target}/${s.max} %`).join(' · '));
  renderIps();
}
function openIpsEditor(){
  const I=JSON.parse(JSON.stringify(getIps()));
  let ov=document.getElementById('ips-modal-overlay');
  if(!ov){ov=document.createElement('div');ov.id='ips-modal-overlay';ov.className='modal-overlay';ov.addEventListener('click',e=>{if(e.target===ov)ov.classList.remove('open');});document.body.appendChild(ov);}
  const sumT=()=>I.sleeves.reduce((s,x)=>s+(+x.target||0),0);
  const draw=()=>{
    ov.innerHTML=`<div class="modal ips-modal"><div class="modal-title">Politique de placement <span>(IPS)</span></div>
      <div class="ips-ed-note">Bandes en % de la valeur totale (positions + cash). Symboles séparés par des virgules (ex. <code>TQQQ, CASH.TO</code>). Classes possibles : ETF Levier, ETF, Action, Crypto, Forex, Commodité.</div>
      <table class="nc-table ips-ed"><thead><tr><th>Poche</th><th>Min</th><th>Cible</th><th>Max</th><th>Symboles</th><th>Classes</th><th>Cash des comptes</th><th></th></tr></thead><tbody>${
        I.sleeves.map((s,i)=>`<tr><td><input data-i="${i}" data-k="name" value="${escapeHtml(s.name)}"></td><td><input data-i="${i}" data-k="min" type="number" step="0.5" value="${s.min}"></td><td><input data-i="${i}" data-k="target" type="number" step="0.5" value="${s.target}"></td><td><input data-i="${i}" data-k="max" type="number" step="0.5" value="${s.max}"></td><td><input data-i="${i}" data-k="symbols" value="${escapeHtml((s.symbols||[]).join(', '))}"></td><td><input data-i="${i}" data-k="classes" value="${escapeHtml((s.classes||[]).join(', '))}"></td><td><input data-i="${i}" data-k="cashAccounts" value="${escapeHtml((s.cashAccounts||[]).join(', '))}"></td><td><button class="row-act row-act-danger" data-del="${i}">Retirer</button></td></tr>`).join('')
      }</tbody></table>
      <div class="ips-ed-row"><button class="btn-ghost" id="ips-add">+ Ajouter une poche</button><span id="ips-sum" class="${Math.abs(sumT()-100)<0.01?'pos':'neg'}">Somme des cibles : ${sumT().toFixed(1)} %</span></div>
      <div class="ips-ed-grid">
        <label>Plancher de la réserve TQQQ ($)<input id="ips-floor" type="number" value="${I.tqqqFloor||0}"></label>
        <label>Marge disponible ($)<input id="ips-margin" type="number" value="${I.marginAvailable||0}"></label>
        <label>Rééquilibrage<select id="ips-reb"><option ${I.rebalance==='trimestriel'?'selected':''}>trimestriel</option><option ${I.rebalance==='semestriel'?'selected':''}>semestriel</option><option ${I.rebalance==='annuel'?'selected':''}>annuel</option></select></label>
      </div>
      <div class="ips-ed-sub">Poche crypto — cibles internes (%)</div>
      <div class="ips-ed-crypto">${(I.crypto?.targets||[]).map((t,j)=>`<label>${escapeHtml(t.label)}<input data-ct="${j}" type="number" step="1" value="${t.t}"></label>`).join('')}</div>
      <div class="ips-ed-row" style="margin-top:18px;"><button class="btn-ghost" id="ips-reset">Revenir au Game plan</button><span style="flex:1"></span><button class="btn-ghost" id="ips-cancel">Annuler</button><button class="btn" id="ips-save">Enregistrer</button></div>
    </div>`;
    ov.querySelectorAll('input[data-i]').forEach(inp=>inp.addEventListener('input',()=>{const s=I.sleeves[+inp.dataset.i],k=inp.dataset.k;
      if(['min','target','max'].includes(k))s[k]=parseFloat(inp.value)||0;else if(k==='name')s.name=inp.value;else s[k]=inp.value.split(',').map(x=>x.trim()).filter(Boolean);
      const el=ov.querySelector('#ips-sum');if(el){el.textContent=`Somme des cibles : ${sumT().toFixed(1)} %`;el.className=Math.abs(sumT()-100)<0.01?'pos':'neg';}}));
    ov.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{I.sleeves.splice(+b.dataset.del,1);draw();});
    ov.querySelectorAll('[data-ct]').forEach(inp=>inp.addEventListener('input',()=>{I.crypto.targets[+inp.dataset.ct].t=parseFloat(inp.value)||0;}));
    ov.querySelector('#ips-add').onclick=()=>{I.sleeves.push({id:'s'+Date.now(),name:'Nouvelle poche',min:0,target:0,max:10,symbols:[],classes:[],cashAccounts:[]});draw();};
    ov.querySelector('#ips-reset').onclick=()=>{Object.assign(I,JSON.parse(JSON.stringify(IPS_DEFAULT)));draw();};
    ov.querySelector('#ips-cancel').onclick=()=>ov.classList.remove('open');
    ov.querySelector('#ips-save').onclick=()=>{
      const bad=I.sleeves.find(s=>!(s.min<=s.target&&s.target<=s.max));
      if(bad){alert(`« ${bad.name} » : il faut min ≤ cible ≤ max.`);return;}
      if(Math.abs(sumT()-100)>0.01&&!confirm(`La somme des cibles fait ${sumT().toFixed(1)} % (pas 100 %). Enregistrer quand même ?`))return;
      I.tqqqFloor=parseFloat(ov.querySelector('#ips-floor').value)||0;I.marginAvailable=parseFloat(ov.querySelector('#ips-margin').value)||0;I.rebalance=ov.querySelector('#ips-reb').value;
      I.source='Modifié le '+localToday();
      ov.classList.remove('open');saveIps(I);
    };
  };
  draw();ov.classList.add('open');
}

// ─── F. FIABILITÉ DES DONNÉES ──────────────────────────────────────────────────────────────
// F1. Journal d'audit automatique : à chaque sauvegarde réussie, on compare l'état sauvegardé
// au précédent (positions, transactions, cash) et on journalise les différences. Couvre TOUS les
// chemins de modification (formulaires, import CSV, annulation…) sans toucher à chacun.
let auditLog=[],_auditBase=null,_auditCloud=null,_auditSaveTimer=null;
function auditDevice(){const u=navigator.userAgent||'';return/iPhone|Android|Mobile/i.test(u)?'mobile':/Mac/i.test(u)?'Mac':/Windows/i.test(u)?'PC':'web';}
function auditTradeSig(t){return JSON.stringify([t.date,t.type,t.symbol,+(+t.shares||0).toFixed(6),+(+t.price||0).toFixed(6),+(+t.size||0).toFixed(2),t.account||t.accountType||'']);}
function auditTradeTxt(t){
  const acct=t.account||t.accountType;const a=acct?` (${acct})`:'';
  if(t.type==='Achat'||t.type==='Vente')return`${t.type} ${t.shares??''} ${t.symbol} @ ${fmtPrice(t.price)}${a}`;
  return`${t.type} ${fmtAmt(t.size||0)}${t.symbol&&t.symbol!=='CASH'?' '+t.symbol:''}${a}`;
}
function auditSnapshot(){
  const pos={};positions.forEach(p=>{pos[(p.symbol||'')+'|'+(p.account||'')]={shares:+(p.shares||0),avg:+(p.avgEntry||0),dir:p.dir};});
  const tr={};trades.forEach(t=>{const k=auditTradeSig(t);tr[k]=(tr[k]||0)+1;});
  return{pos,tr,trObj:Object.fromEntries(trades.map(t=>[auditTradeSig(t),t])),cash:+(cash||0)};
}
function auditPush(kind,text){
  auditLog.unshift({ts:new Date().toISOString(),dev:auditDevice(),kind,text});
  if(auditLog.length>1000)auditLog.length=1000;
  auditPersist();
}
function auditOnSaved(){
  const cur=auditSnapshot();
  if(!_auditBase){_auditBase=cur;return;}
  const B=_auditBase,out=[];
  Object.keys(cur.tr).forEach(k=>{const d=cur.tr[k]-(B.tr[k]||0);for(let i=0;i<d;i++)out.push(['ajout','Transaction ajoutée : '+auditTradeTxt(cur.trObj[k])]);});
  Object.keys(B.tr).forEach(k=>{const d=B.tr[k]-(cur.tr[k]||0);for(let i=0;i<d;i++)out.push(['suppr','Transaction supprimée : '+auditTradeTxt(B.trObj[k])]);});
  Object.keys(cur.pos).forEach(k=>{const a=B.pos[k],b=cur.pos[k],[sym,acct]=k.split('|');const lbl=sym+(acct?' ('+acct+')':'');
    if(!a)out.push(['ajout',`Position ouverte : ${lbl} · ${b.shares} @ ${fmtPrice(b.avg)}`]);
    else{const ch=[];if(Math.abs(a.shares-b.shares)>1e-9)ch.push(`parts ${a.shares} → ${b.shares}`);if(Math.abs(a.avg-b.avg)>1e-6)ch.push(`prix moyen ${fmtPrice(a.avg)} → ${fmtPrice(b.avg)}`);if(a.dir!==b.dir)ch.push(`direction ${a.dir} → ${b.dir}`);if(ch.length)out.push(['modif',`Position modifiée : ${lbl} · ${ch.join(', ')}`]);}});
  Object.keys(B.pos).forEach(k=>{if(!cur.pos[k]){const[sym,acct]=k.split('|');out.push(['suppr',`Position fermée / retirée : ${sym}${acct?' ('+acct+')':''}`]);}});
  if(Math.abs(cur.cash-B.cash)>0.005)out.push(['cash',`Cash disponible : ${fmtAmt(B.cash)} → ${fmtAmt(cur.cash)}`]);
  _auditBase=cur;
  if(!out.length)return;
  const ts=new Date().toISOString(),dev=auditDevice();
  out.reverse().forEach(([kind,text])=>auditLog.unshift({ts,dev,kind,text}));
  if(auditLog.length>1000)auditLog.length=1000;
  auditPersist();
  if(document.getElementById('tab-controle')?.classList.contains('active'))renderControle();
}
function auditPersist(){
  try{localStorage.setItem('nc_audit_log',JSON.stringify(auditLog.slice(0,300)));}catch(e){}
  clearTimeout(_auditSaveTimer);
  _auditSaveTimer=setTimeout(async()=>{
    if(_auditCloud===false)return;
    const ok=await proWriteColumns({audit_log:JSON.stringify(auditLog)});
    if(ok===true)_auditCloud=true;else if(ok===false)_auditCloud=false;
  },1500);
}
// F2. Contrôles d'intégrité. Chaque contrôle : {sev:'err'|'warn'|'ok', title, detail}.
function businessDaysBetween(a,b){let n=0;const d=new Date(a+'T12:00:00'),e=new Date(b+'T12:00:00');d.setDate(d.getDate()+1);while(d<e){const w=d.getDay();if(w&&w<6)n++;d.setDate(d.getDate()+1);}return n;}
function computeIntegrity(){
  const C=[];const add=(sev,title,detail,items)=>C.push({sev,title,detail,items:items||[]});
  const today=localToday();
  const noAcct=positions.filter(p=>!p.account);
  add(noAcct.length?'warn':'ok','Compte renseigné sur chaque position',noAcct.length?`${noAcct.length} position(s) sans compte`:'Toutes les positions ont un compte',noAcct.map(p=>p.symbol));
  const zero=positions.filter(p=>!(p.shares>0)||!(p.current>0));
  add(zero.length?'err':'ok','Parts et prix valides',zero.length?`${zero.length} position(s) à 0 part ou sans prix`:'Aucune position vide ou sans prix',zero.map(p=>p.symbol));
  const mism=positions.filter(p=>p.entries&&p.entries.length&&Math.abs(p.entries.reduce((s,e)=>s+(+e.shares||0),0)-(p.shares||0))>1e-6);
  add(mism.length?'err':'ok','Lots d’achat = parts détenues',mism.length?`${mism.length} position(s) dont la somme des lots ne correspond pas aux parts`:'Somme des lots cohérente partout',mism.map(p=>p.symbol));
  const avgBad=positions.filter(p=>{if(!p.entries||!p.entries.length)return false;const sh=p.entries.reduce((s,e)=>s+(+e.shares||0),0),c=p.entries.reduce((s,e)=>s+(+e.shares||0)*(+e.price||0),0);return sh>0&&p.avgEntry>0&&Math.abs(c/sh/p.avgEntry-1)>0.005;});
  add(avgBad.length?'warn':'ok','Prix moyen = moyenne pondérée des lots',avgBad.length?`${avgBad.length} écart(s) de plus de 0,5 %`:'Prix moyens cohérents',avgBad.map(p=>p.symbol));
  let negCash=[];try{const acc=reconstructCashLots(true).accounts;negCash=Object.entries(acc).filter(([,st])=>_clAccountTotalCAD(st)<-0.01).map(([a])=>a);}catch(e){}
  add(negCash.length?'err':'ok','Aucun cash négatif',negCash.length?`Cash négatif dans : ${negCash.join(', ')}`:'Tous les comptes ≥ 0',negCash);
  const miss=trades.filter(t=>t.type!=='Cotisation'&&((t.type==='Achat'||t.type==='Vente')&&!(t.account||t.accountType)||(t.type==='Dépôt'||t.type==='Retrait')&&!t.accountType));
  add(miss.length?'warn':'ok','Compte renseigné sur chaque transaction',miss.length?`${miss.length} transaction(s) sans compte`:'Toutes les transactions ont un compte',miss.slice(0,8).map(t=>t.date+' '+t.type+' '+(t.symbol||'')));
  const seen={},dups=[];trades.forEach(t=>{if(t.type==='Cotisation')return;const k=auditTradeSig(t);if(seen[k])dups.push(t);seen[k]=1;});
  add(dups.length?'warn':'ok','Doublons',dups.length?`${dups.length} transaction(s) identique(s) en double (à vérifier)`:'Aucun doublon détecté',dups.slice(0,8).map(auditTradeTxt));
  const fut=trades.filter(t=>t.date>today);
  add(fut.length?'err':'ok','Dates dans le futur',fut.length?`${fut.length} transaction(s) datée(s) après aujourd'hui`:'Aucune',fut.map(auditTradeTxt));
  const H=[...portfolioHistory].sort((a,b)=>a.date.localeCompare(b.date));
  if(H.length){
    const last=H[H.length-1].date,late=businessDaysBetween(last,today)+(new Date().getHours()>=23&&new Date().getDay()%6?1:0);
    add(late>1?'err':late===1?'warn':'ok','Snapshot quotidien (cron 22 h)',late>0?`Dernier snapshot le ${last} — ${late} jour(s) ouvrable(s) manquant(s)`:`À jour (dernier : ${last})`);
    let gaps=0,worst=0;for(let i=1;i<H.length;i++){const g=businessDaysBetween(H[i-1].date,H[i].date);if(g>2){gaps++;worst=Math.max(worst,g);}}
    add(gaps?'warn':'ok','Continuité de l’historique',gaps?`${gaps} trou(s) de plus de 2 jours ouvrables (max ${worst} j)`:'Aucun trou significatif');
    // Saut de valeur sans flux : variation quotidienne > 25 % (souvent un dépôt non saisi ou un bug FX)
    const S=buildTwrSeries();const jumps=S.rets.map((r,i)=>({r,d:S.hist[i+1].date})).filter(x=>Math.abs(x.r)>0.25);
    add(jumps.length?'warn':'ok','Sauts de valeur inexpliqués',jumps.length?`${jumps.length} variation(s) quotidienne(s) > 25 % sans dépôt correspondant`:'Aucun',jumps.map(j=>j.d+' : '+fmtP1(j.r)));
  }else add('warn','Historique quotidien','Aucun snapshot enregistré');
  const lastRecon=reconLast();
  const age=lastRecon?proDaysBetween(lastRecon.date,today):null;
  add(age==null?'warn':age>35?'warn':'ok','Rapprochement avec le courtier',age==null?'Jamais fait — compare tes soldes avec ton relevé ci-dessous':`Dernier : ${lastRecon.date} (${age} j) · ${lastRecon.diffs} écart(s)`);
  const pen={err:12,warn:4,ok:0};const score=Math.max(0,100-C.reduce((s,c)=>s+pen[c.sev],0));
  return{checks:C,score,err:C.filter(c=>c.sev==='err').length,warn:C.filter(c=>c.sev==='warn').length};
}
// F3. Rapprochement : l'utilisateur saisit les soldes du relevé ; écarts calculés en direct.
function reconLast(){try{return JSON.parse(localStorage.getItem('nc_recon_last')||'null');}catch(e){return null;}}
function reconRows(){
  const rows=[];
  // Cash comparé dans la devise du compte (un relevé Disnat « (USD) » affiche des USD).
  getCashByAccount().forEach(c=>{const usd=/\(USD\)/.test(c.account);rows.push({k:'cash|'+c.account,label:'Cash',acct:c.account,tracker:usd?c.value/(fxRate||1):c.value,unit:'$',cur:usd?'USD':'CAD'});});
  positions.forEach(p=>rows.push({k:'pos|'+p.symbol+'|'+(p.account||''),label:p.symbol,acct:p.account||'—',tracker:+(p.shares||0),unit:'parts'}));
  return rows.sort((a,b)=>a.acct.localeCompare(b.acct)||a.label.localeCompare(b.label));
}
let _reconInput={};
function reconUpdate(){
  let diffs=0,filled=0;
  reconRows().forEach(r=>{
    const v=_reconInput[r.k];const cell=document.getElementById('rc-d-'+btoa(unescape(encodeURIComponent(r.k))).replace(/=/g,''));
    if(!cell)return;
    if(v===''||v==null||isNaN(+v)){cell.innerHTML='<span class="muted">—</span>';return;}
    filled++;const d=+v-r.tracker;const tol=r.unit==='$'?0.5:1e-6;
    if(Math.abs(d)>tol){diffs++;cell.innerHTML=`<span class="neg">${d>0?'+':'−'}${r.unit==='$'?fmtAmt(Math.abs(d)):Math.abs(d).toLocaleString('fr-FR',{maximumFractionDigits:6})}</span>`;}
    else cell.innerHTML='<span class="pos">OK</span>';
  });
  const s=document.getElementById('rc-summary');if(s)s.innerHTML=filled?`${filled} ligne(s) saisie(s) · <b class="${diffs?'neg':'pos'}">${diffs} écart(s)</b>`:'Saisis au moins une ligne';
  return{diffs,filled};
}
function reconSave(){
  const{diffs,filled}=reconUpdate();if(!filled){alert('Saisis au moins un solde du relevé.');return;}
  const rec={date:localToday(),diffs,filled};try{localStorage.setItem('nc_recon_last',JSON.stringify(rec));}catch(e){}
  const lines=reconRows().filter(r=>_reconInput[r.k]!==''&&_reconInput[r.k]!=null&&Math.abs(+_reconInput[r.k]-r.tracker)>(r.unit==='$'?0.5:1e-6)).map(r=>`${r.label} ${r.acct} : app ${r.unit==='$'?fmtAmt(r.tracker):r.tracker} vs relevé ${r.unit==='$'?fmtAmt(+_reconInput[r.k]):_reconInput[r.k]}`);
  auditPush('recon',`Rapprochement courtier : ${filled} ligne(s) vérifiée(s), ${diffs} écart(s)${lines.length?' — '+lines.join(' ; '):''}`);
  renderControle();
}
function renderControle(){
  const root=document.getElementById('tab-controle');if(!root)return;
  const Q=computeIntegrity();
  const sc=document.getElementById('ctl-score');
  if(sc)sc.innerHTML=`<div class="ctl-ring" style="--p:${Q.score};--c:${Q.err?'var(--neg)':Q.warn?'var(--amber)':'var(--pos)'}"><span>${Q.score}</span></div><div><div class="ctl-score-l">Score d'intégrité</div><div class="ctl-score-s">${Q.err} erreur(s) · ${Q.warn} avertissement(s)</div></div>`;
  const sub=document.getElementById('ctl-sub');if(sub)sub.textContent=`${positions.length} positions · ${trades.filter(t=>t.type!=='Cotisation').length} transactions · ${portfolioHistory.length} snapshots · journal ${_auditCloud?'synchronisé':_auditCloud===false?'local (migration SQL requise)':'local'}`;
  const ic={err:'✕',warn:'!',ok:'✓'};
  document.getElementById('ctl-checks').innerHTML=Q.checks.map(c=>`<div class="ctl-check ${c.sev}"><span class="ctl-ic">${ic[c.sev]}</span><div class="ctl-check-txt"><div class="ctl-check-t">${escapeHtml(c.title)}</div><div class="ctl-check-d">${escapeHtml(c.detail)}</div>${c.items.length&&c.sev!=='ok'?`<div class="ctl-items">${c.items.slice(0,8).map(x=>`<span>${escapeHtml(x)}</span>`).join('')}</div>`:''}</div></div>`).join('');
  const as=document.getElementById('ctl-audit-sub');if(as)as.textContent=`${auditLog.length} événement(s)`;
  const KIND={ajout:'Ajout',suppr:'Suppression',modif:'Modification',cash:'Cash',ips:'IPS',recon:'Rapprochement',session:'Session'};
  document.getElementById('ctl-audit').innerHTML=auditLog.length?auditLog.slice(0,150).map(e=>{const d=new Date(e.ts);return`<div class="ctl-ev ctl-ev-${e.kind}"><span class="ctl-ev-k">${KIND[e.kind]||e.kind}</span><div class="ctl-ev-txt" data-sensitive>${escapeHtml(e.text)}</div><span class="ctl-ev-ts">${d.toLocaleDateString('fr-CA')} ${d.toLocaleTimeString('fr-CA',{hour:'2-digit',minute:'2-digit'})} · ${escapeHtml(e.dev||'')}</span></div>`;}).join(''):'<div class="alloc-empty-state">Le journal se remplit automatiquement à chaque modification enregistrée à partir de maintenant.</div>';
  const rows=reconRows();const id=k=>btoa(unescape(encodeURIComponent(k))).replace(/=/g,'');
  document.getElementById('ctl-recon').innerHTML=`<table class="nc-table an-table rc-table"><thead><tr><th>Compte</th><th>Élément</th><th>Dans l'app</th><th>Relevé courtier</th><th>Écart</th></tr></thead><tbody>${
    rows.map(r=>`<tr><td><span class="badge-dca ${getAcctClass(r.acct)}">${escapeHtml(r.acct)}</span></td><td class="sym">${escapeHtml(r.label)}</td><td data-sensitive>${r.unit==='$'?fmtAmt(r.tracker)+' '+r.cur:r.tracker.toLocaleString('fr-FR',{maximumFractionDigits:6})+' parts'}</td><td><input class="rc-in" type="number" step="any" data-k="${escapeHtml(r.k)}" placeholder="${r.unit==='$'?'solde '+r.cur:'parts'}" value="${_reconInput[r.k]??''}"></td><td id="rc-d-${id(r.k)}"><span class="muted">—</span></td></tr>`).join('')
  }</tbody></table><div class="ips-ed-row" style="margin-top:12px;"><span id="rc-summary" class="muted"></span><span style="flex:1"></span><button class="btn-ghost" onclick="_reconInput={};renderControle()">Effacer</button><button class="btn" onclick="reconSave()">Enregistrer le rapprochement</button></div>
  <div class="an-foot">Cash comparé dans la devise du compte (comptes « (USD) » en dollars US, au taux du jour pour les comptes mixtes). Disnat n'offre pas d'API publique : pour un import automatique, envoie un export CSV de ton relevé et on branchera un lecteur dédié.</div>`;
  document.querySelectorAll('#ctl-recon .rc-in').forEach(inp=>inp.addEventListener('input',()=>{_reconInput[inp.dataset.k]=inp.value;reconUpdate();}));
  reconUpdate();
  updateNavPills(null,Q);
}

// ─── G. UX : NAVIGATION, PALETTE Ctrl+K, MOBILE ────────────────────────────────────────────
function goToTab(name){
  const btn=document.querySelector(`.nav-tab[onclick*="'${name}'"]`)||document.querySelector(`.nc-bnav button[data-t="${name}"]`)||document.createElement('button');
  switchTab(name,btn);
  document.querySelectorAll('.nc-bnav button').forEach(b=>b.classList.toggle('active',b.dataset.t===name));
  if(name==='controle')document.querySelectorAll('.nav-tab').forEach(t=>t.classList.remove('active'));
  window.scrollTo({top:0});
}
let _pillState={ips:null,data:null};
function updateNavPills(R,Q){
  if(R)_pillState.ips=R;if(Q)_pillState.data=Q;
  const pi=document.getElementById('pill-ips'),pd=document.getElementById('pill-data');
  if(pi&&_pillState.ips){const r=_pillState.ips;pi.dataset.s=r.outCount?'bad':r.nearCount?'warn':'ok';pi.querySelector('.nav-pill-txt').textContent=r.outCount?`IPS · ${r.outCount} hors bande`:'IPS';pi.title=r.outCount?`${r.outCount} poche(s) hors de leur bande`:'Toutes les poches dans leur bande';}
  if(pd&&_pillState.data){const q=_pillState.data;pd.dataset.s=q.err?'bad':q.warn>2?'warn':'ok';pd.querySelector('.nav-pill-txt').textContent=q.err?`Données · ${q.err}`:'Données';pd.title=`Intégrité ${q.score}/100 — ${q.err} erreur(s), ${q.warn} avertissement(s)`;}
}
// Palette de commandes
function cmdNorm(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');}
function cmdItems(){
  const T=(name,label,hint,kbd)=>({group:'Aller à',label,hint,kbd,run:()=>goToTab(name)});
  const items=[
    T('dashboard','Dashboard','Vue d’ensemble','D'),T('positions','Positions','Positions ouvertes','P'),T('strategie','Stratégie','Plans de trading','S'),
    T('historique','Historique','Rendement par actif, dividendes','H'),T('ledger','Ledger','Registre des transactions','L'),T('allocation','Allocation','Fiche gestionnaire, IPS','A'),
    T('analyse','Analyse','Risque, attribution, TWR vs MWR','R'),T('watchlist','Watchlist','Tickers suivis','W'),T('controle','Contrôle des données','Intégrité, audit, rapprochement',''),
    {group:'Actions',label:'Nouvelle position / DCA',hint:'Ouvre le formulaire d’achat',kbd:'N',run:()=>{goToTab('positions');setTimeout(()=>{const f=document.getElementById('pos-form-body');if(f&&f.classList.contains('collapsed'))togglePosForm();document.getElementById('f-symbol')?.focus();},120);}},
    {group:'Actions',label:'Dépôt ou retrait de cash',run:()=>{goToTab('dashboard');toggleCashPopup({stopPropagation(){}});}},
    {group:'Actions',label:'Ajouter un dividende',run:()=>{goToTab('historique');typeof openDividendModal==='function'&&openDividendModal();}},
    {group:'Actions',label:'Importer un CSV',run:()=>{typeof openImportModal==='function'&&openImportModal();}},
    {group:'Actions',label:'Exporter le registre en CSV',run:()=>{typeof exportCSV==='function'&&exportCSV();}},
    {group:'Actions',label:'Rafraîchir les prix',run:()=>{typeof fetchLivePrices==='function'&&fetchLivePrices();}},
    {group:'Actions',label:'Modifier l’IPS',hint:'Cibles, bandes, plancher de réserve',run:()=>{goToIps();setTimeout(openIpsEditor,250);}},
    {group:'Actions',label:'Rapprochement avec le courtier',run:()=>{goToTab('controle');setTimeout(()=>document.getElementById('ctl-recon')?.scrollIntoView({behavior:'smooth'}),150);}},
    {group:'Actions',label:'Basculer clair / sombre',kbd:'T',run:()=>{const c=document.documentElement.getAttribute('data-theme')||'dark';setTheme(c==='dark'?'light':'dark');}},
    {group:'Actions',label:'Cacher / afficher les montants',run:()=>toggleHideAmounts()},
    {group:'Actions',label:'Raccourcis clavier',kbd:'?',run:()=>{typeof showShortcutsHelp==='function'&&showShortcutsHelp();}},
  ];
  positions.forEach((p,i)=>items.push({group:'Positions',label:p.symbol,hint:(p.account||'')+' · '+fmtAmtRound(posValueAcct(p)),run:()=>{goToTab('positions');if(typeof selectedPosIdx!=='undefined'&&selectedPosIdx!==i)selectPosRow(i);setTimeout(()=>document.querySelector('#pos-body tr.row-selected')?.scrollIntoView({block:'center',behavior:'smooth'}),80);}}));
  (typeof watchlist!=='undefined'?watchlist:[]).forEach(w=>items.push({group:'Watchlist',label:w.symbol,hint:w.note||'',run:()=>goToTab('watchlist')}));
  return items;
}
let _cmdSel=0,_cmdList=[];
function openCmdK(){
  let ov=document.getElementById('cmdk');
  if(!ov){
    ov=document.createElement('div');ov.id='cmdk';ov.innerHTML=`<div class="cmdk-box" role="dialog" aria-label="Palette de commandes"><div class="cmdk-in"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input id="cmdk-q" placeholder="Aller à, action, position…" autocomplete="off" spellcheck="false"><kbd>Échap</kbd></div><div class="cmdk-list" id="cmdk-list"></div><div class="cmdk-foot"><span><kbd>↑</kbd><kbd>↓</kbd> naviguer</span><span><kbd>Entrée</kbd> ouvrir</span><span><kbd>Ctrl</kbd><kbd>K</kbd> fermer</span></div></div>`;
    document.body.appendChild(ov);
    ov.addEventListener('mousedown',e=>{if(e.target===ov)closeCmdK();});
    const q=ov.querySelector('#cmdk-q');
    q.addEventListener('input',()=>{_cmdSel=0;cmdRender();});
    q.addEventListener('keydown',e=>{
      if(e.key==='ArrowDown'){e.preventDefault();_cmdSel=Math.min(_cmdList.length-1,_cmdSel+1);cmdRender(true);}
      else if(e.key==='ArrowUp'){e.preventDefault();_cmdSel=Math.max(0,_cmdSel-1);cmdRender(true);}
      else if(e.key==='Enter'){e.preventDefault();cmdRun(_cmdSel);}
      else if(e.key==='Escape'){e.preventDefault();closeCmdK();}
    });
  }
  ov.classList.add('open');const q=ov.querySelector('#cmdk-q');q.value='';_cmdSel=0;cmdRender();setTimeout(()=>q.focus(),10);
}
function closeCmdK(){document.getElementById('cmdk')?.classList.remove('open');}
function cmdRender(keepScroll){
  const q=cmdNorm(document.getElementById('cmdk-q')?.value||'').trim();
  const all=cmdItems();
  _cmdList=!q?all.filter(x=>x.group!=='Positions'&&x.group!=='Watchlist').concat(all.filter(x=>x.group==='Positions').slice(0,6)):
    all.map(x=>{const l=cmdNorm(x.label),h=cmdNorm(x.hint);let s=l.startsWith(q)?3:l.includes(q)?2:h.includes(q)?1:0;
      if(!s){let j=0;for(const ch of l){if(ch===q[j])j++;if(j===q.length)break;}if(j===q.length)s=0.5;}return{...x,s};}).filter(x=>x.s>0).sort((a,b)=>b.s-a.s);
  const list=document.getElementById('cmdk-list');let html='',g='';
  _cmdList.forEach((x,i)=>{if(x.group!==g){g=x.group;html+=`<div class="cmdk-g">${g}</div>`;}html+=`<div class="cmdk-it${i===_cmdSel?' sel':''}" data-i="${i}"><span class="cmdk-l">${escapeHtml(x.label)}</span>${x.hint?`<span class="cmdk-h" data-sensitive>${escapeHtml(x.hint)}</span>`:''}${x.kbd?`<kbd>${x.kbd}</kbd>`:''}</div>`;});
  list.innerHTML=html||'<div class="cmdk-empty">Aucun résultat</div>';
  list.querySelectorAll('.cmdk-it').forEach(el=>{el.onmousemove=()=>{if(_cmdSel!==+el.dataset.i){_cmdSel=+el.dataset.i;list.querySelectorAll('.cmdk-it').forEach(e=>e.classList.toggle('sel',+e.dataset.i===_cmdSel));}};el.onclick=()=>cmdRun(+el.dataset.i);});
  if(keepScroll)list.querySelector('.cmdk-it.sel')?.scrollIntoView({block:'nearest'});
}
function cmdRun(i){const x=_cmdList[i];if(!x)return;closeCmdK();setTimeout(()=>x.run(),10);}
document.addEventListener('keydown',e=>{
  if((e.ctrlKey||e.metaKey)&&!e.shiftKey&&!e.altKey&&e.key.toLowerCase()==='k'){e.preventDefault();const o=document.getElementById('cmdk');if(o&&o.classList.contains('open'))closeCmdK();else if(document.getElementById('main-app')?.style.display!=='none')openCmdK();}
},true);
// Barre d'onglets mobile (affichée < 768 px par CSS)
function proInitChrome(){
  if(document.querySelector('.nc-bnav'))return;
  const ic={dashboard:'<path d="M4 13h6V4H4zM14 20h6v-9h-6zM14 4v4h6V4zM4 20h6v-4H4z"/>',positions:'<path d="M4 6h16M4 12h16M4 18h10"/>',analyse:'<path d="M4 19V5M4 19h16M8 15l3-4 3 2 5-6"/>',allocation:'<path d="M12 3v9l7 4"/><circle cx="12" cy="12" r="9"/>',more:'<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>'};
  const b=(t,l)=>`<button data-t="${t}" onclick="${t==='more'?'openCmdK()':`goToTab('${t}')`}"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ic[t]}</svg><span>${l}</span></button>`;
  const nav=document.createElement('nav');nav.className='nc-bnav';nav.innerHTML=b('dashboard','Accueil')+b('positions','Positions')+b('analyse','Analyse')+b('allocation','Allocation')+b('more','Plus');
  document.getElementById('main-app')?.appendChild(nav);
  nav.querySelector('[data-t="dashboard"]').classList.add('active');
  // Lien « Contrôle des données » dans le menu
  const menu=document.getElementById('hamburger-menu');
  if(menu&&!document.getElementById('menu-controle')){
    const d=document.createElement('div');d.style.cssText='margin-bottom:12px;display:flex;flex-direction:column;gap:6px;';
    d.innerHTML=`<button id="menu-controle" class="btn-ghost" style="width:100%;text-align:left;" onclick="goToTab('controle');document.getElementById('hamburger-menu').style.display='none'">Contrôle des données</button><button class="btn-ghost" style="width:100%;text-align:left;" onclick="openCmdK();document.getElementById('hamburger-menu').style.display='none'">Palette de commandes · Ctrl K</button>`;
    menu.insertBefore(d,menu.lastElementChild);
  }
}

// ─── POINTS D'ENTRÉE APPELÉS PAR app.js ────────────────────────────────────────────────────
function proOnRowLoaded(row){
  if(row&&'ips' in row){ipsCloud=true;if(row.ips){try{ipsConfig=JSON.parse(row.ips);}catch(e){}}else{const loc=ipsLoadLocal();if(loc){ipsConfig=loc;}}}
  else{ipsCloud=false;}
  if(row&&'audit_log' in row){_auditCloud=true;try{const cloud=JSON.parse(row.audit_log||'[]');if(Array.isArray(cloud))auditLog=cloud;}catch(e){}}
  else{_auditCloud=false;try{auditLog=JSON.parse(localStorage.getItem('nc_audit_log')||'[]');}catch(e){auditLog=[];}}
  // Base du diff = état tel que chargé depuis le serveur.
  setTimeout(()=>{_auditBase=auditSnapshot();},0);
}
function proRenderAll(){
  proInitChrome();
  renderIps();
  try{updateNavPills(null,computeIntegrity());}catch(e){}
  const act=document.querySelector('.section.active')?.id;
  if(act==='tab-analyse')renderAnalyse();
  if(act==='tab-controle')renderControle();
}
function proOnTab(name){
  if(name==='analyse')renderAnalyse();
  if(name==='controle')renderControle();
  if(name==='allocation')renderIps();
  document.querySelectorAll('.nc-bnav button').forEach(b=>b.classList.toggle('active',b.dataset.t===name));
}

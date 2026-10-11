// Refonte noir et blanc + navigation latérale (2026-10-11)
const {load}=require('./harness.cjs');let fails=0;
const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
const w=load();const E=s=>w.eval(s);const d=w.document;
// Structure
ok(!d.getElementById('nc-splash'),'séquence de lancement retirée');
ok(!d.getElementById('tab-historique'),'onglet Historique fusionné');
['dashboard','positions','ledger','strategie','allocation','analyse','controle','watchlist'].forEach(t=>{
  const el=d.querySelectorAll('#tab-'+t);ok(el.length===1&&el[0].parentElement.classList.contains('body'),'section '+t+' unique, enfant direct de .body');});
ok(d.querySelectorAll('.side .nav-tab').length===7,'7 entrées dans la barre latérale');
ok(d.querySelector('#tab-analyse #asset-returns-card')&&d.querySelector('#tab-analyse #annual-pnl-card'),'Réalisé (rendement par actif, P&L annuel) dans Performance');
ok(d.querySelector('#tab-ledger #dividends-card')&&d.querySelector('#tab-ledger #hist-body'),'Dividendes + registre dans Activité');
ok(['kpi-total','kpi-invested','kpi-pnl-open','kpi-pnl-real','kpi-cash','kpi-cash-pct','kpi-cash-currency-split','kpi-nb-positions','kpi-winrate','perfChart','cashAllocChart','cashLotsChart','pill-ips','pill-data','hamburger-menu','currency-select','btn-dark','btn-light','live-dot','btn-eye','strat-badge'].every(id=>d.getElementById(id)),'tous les identifiants utilisés par app.js existent');
// Navigation
E(`switchTab('historique')`);
ok(d.getElementById('tab-analyse').classList.contains('active'),'switchTab(historique) -> Performance');
ok(d.querySelector('.nav-tab.active')?.dataset.tab==='analyse','entrée Performance active');
ok(d.getElementById('page-title').textContent==='Performance','titre de page mis à jour');
E(`goToTab('ledger')`);
ok(d.getElementById('tab-ledger').classList.contains('active')&&d.getElementById('page-title').textContent==='Activité','goToTab(ledger) -> Activité');
E(`goToTab('controle')`);
ok(d.getElementById('tab-controle').classList.contains('active')&&!d.querySelector('.nav-tab.active'),'Contrôle : aucune entrée de nav active');
// Couleurs
const g=E(`monoRamp(6)`);ok(g.length===6&&g.every(c=>/^hsl\(0 0% \d+%\)$/.test(c)),'monoRamp = gris : '+g.join(' '));
ok(E(`ACCT_COLORS.every(c=>!/accent|blue|amber|red|purple|steel/.test(c.bar+c.text))`),'couleurs de compte neutres');
E(`setTheme('light')`);
ok(d.getElementById('btn-light').classList.contains('active')&&!d.getElementById('btn-dark').classList.contains('active'),'sélecteur de thème en classes (plus de bleu en ligne)');
ok(!/[0-9]/.test(d.getElementById('btn-light').getAttribute('style')||''),'aucun style couleur en ligne sur le bouton de thème');
console.log(fails?`\n${fails} ÉCHEC(S)`:'\nTOUT PASSE');process.exit(fails?1:0);

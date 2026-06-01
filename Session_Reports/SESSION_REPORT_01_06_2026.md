# Rapport de session — 01/06/2026 — Nord Capital : Audit, Refactor, Features, Benchmark

---

## 1. Contexte du projet

Nord Capital est un portfolio tracker web pour Cédric Plante (trader, Lausanne).
App SPA en HTML/JS pur, hébergée sur Vercel, données dans Supabase.
Objectif : outil de gestion de portfolio personnel "niveau supérieur" — tracking, analyse, benchmark.

**Stack :** HTML/JS vanilla, Chart.js 4.4.1, Supabase (auth + postgres), Vercel (hosting + cron)
**Fichiers clés :** `index.html` (~2500 lignes), `api/prices.js`, `api/snapshot.js`, `api/history.js` (NEW)
**Repo :** https://github.com/Cedricplante/nord-capital — branche main, tout pushé ✅
**URL live :** https://nord-capital-cedricplantes-projects.vercel.app
**Dernier commit :** `f93829c`

---

## 2. Ce qui a été fait dans cette session

### Audit complet
- Identifié 4 bugs (P1-P4) et 3 vérifications (V1-V3)
- Fichier index.html avait une **troncature** depuis un ancien commit — corrigé en reconstruisant depuis `e4ebfbf` + tail manquant

### Refactor majeur — Cash en devise native (CAD)
- **Problème :** `cash` était stocké en USD → valeur fluctuait avec le taux USD/CAD
- **Fix :** Cash stocké directement en CAD dans Supabase
- Migration automatique one-time (`nc_cash_migrated_v2` en localStorage) au premier login
- `totalCAD = totalSizeUSD * fxRate + cash` partout dans le code
- `snapshot.js` cron : `cashCAD = cash` directement (plus de `* usdcad`)

### Bugs corrigés

| Bug | Fix |
|-----|-----|
| **V3** — saveSnapshot écrasait le cron 22h | `ignore-duplicates` : 1 seul appel Supabase, ne jamais écraser |
| **V1** — variation "aujourd'hui" stale | `dayDiff = totalCAD_live - portfolioHistory[yesterday]` |
| **P2** — SELECT + PATCH = 2 appels Supabase | Upsert `ignore-duplicates` = 1 appel |
| **P3** — `fmtC`/`fmtCpnl` utilisaient FX_FALLBACK statiques | Utilisent maintenant `toUSD()` avec taux live |
| **P4** — `alert()` placeholder dans `openStratDetails` | Ouvre le vrai modal stratégie |
| **P1** — `cleanInterpolatedSnapshots` trop agressive | Désactivée (supprimait de vrais snapshots en tendance linéaire) |
| **dayDiff × fxRate** — double conversion sur la variation | Supprimé — `portfolioHistory` déjà en CAD |

### Features implémentées

**F1 — Bouton œil (cacher les montants)**
- Bouton 👁 dans la nav, toggle `body.hide-amounts`
- CSS blur sur tous les montants sensibles (`data-sensitive`, `.kpi-val`, `td.pos/neg`)
- Persiste via localStorage

**F2 — Option 1S sur le chart**
- Nouveau bouton "1S" (1 semaine) dans les period buttons
- Cutoff : `now - 7 jours`

**F3 — Type de compte lors dépôt**
- Dropdown dans le modal cash : CELI, CELIAPP, REER, Comptant, Marge, Coinbase, Binance, Kraken, Bitget, Autre
- Stocké dans l'objet trade JSON (`accountType`)
- Affiché comme badge dans le registre des transactions

**F4 — Justificatif lors retrait**
- Champ texte libre "Raison du retrait" (affiché uniquement en mode Retrait)
- Stocké dans l'objet trade JSON (`note`)
- Affiché avec icône 📝 dans le registre

**F5 — Variation relative par secteur**
- Panel dans l'onglet Allocation (côte à côte avec P&L par classe)
- Bar chart horizontal trié par performance décroissante
- `pct = pnl / coût_moyen * 100` par secteur (Crypto, Action, ETF, etc.)
- Vert positif, rouge négatif

**+100 tickers (80 → 180)**
- Actions US : JPM, V, MA, CRWD, NET, DDOG, ARM, SMCI, MARA, SHOP, BABA, NIO, GME, RIVN, SOFI...
- Actions CA : RY.TO, TD.TO, SHOP.TO, ENB.TO, CNR.TO, BCE.TO, BNS.TO, BMO.TO, SU.TO, ABX.TO...
- Crypto : TRX, HBAR, TON, NEAR, PEPE, WIF, BONK, JUP, ENA, TIA, SEI, PENDLE, ALGO, VET, XLM...
- ETF US : IBIT, FBTC, GBTC, SOXX, SMH, SCHD, VGT, TLT, MAGS, XLE, XLF, XLV...
- ETF CA : XEQT.TO, VEQT.TO, BTCQ.TO, ETHQ.TO, BTCC.TO, ZEB.TO, XIC.TO, VGRO.TO...
- ETF Levier : NVDL, TSLL, BITX, FNGU, QLD, SSO, CONL, HQU.TO, HXU.TO
- `COINGECKO_MAP` enrichi dans prices.js (AERO, PENDLE, JUP, ENA, TIA, STX, POL...)

**Benchmark S&P500**
- Nouvel endpoint `/api/history.js` : prix historiques Yahoo Finance, cache Vercel 1h
- Mode `$ Valeur` : portfolio + courbe SPY simulée calée sur la même valeur de départ
- Mode `% Variation` : les deux courbes normalisées à 0% au début de la période
- Fonctionne avec toutes les périodes : 1S / 1M / 3M / YTD / ALL
- Cache client-side par range (évite les re-fetch en changeant de mode)
- Courbe SPY en cyan pointillé, légende Portfolio / S&P 500

---

## 3. Décisions importantes prises

| Décision | Raison | Alternative rejetée |
|----------|--------|---------------------|
| Travailler dans `/tmp/nc-push`, jamais éditer le mount directement | Python via mount Windows peut tronquer les fichiers (encoding issues) | Édition directe C:\nord-capital |
| Cash en CAD natif au lieu de USD converti | Cash ne doit pas fluctuer avec le FX — principe fondamental | Garder USD interne |
| `ignore-duplicates` plutôt que SELECT+PATCH | 1 appel au lieu de 2, et préserve le cron 22h automatiquement | Vérification préalable |
| Simulation SPY basée sur valeur de départ de la période | Simple, lisible, standard dans l'industrie | Pondérer les dépôts (trop complexe) |
| CoinGecko pour les cryptos moins bien supportées par Yahoo | Prix plus fiables sur certains tokens obscurs | Yahoo uniquement |

---

## 4. État actuel

### ✅ Fonctionne
- Auth Supabase + persistance multi-device
- Positions (Long/Short, DCA, multi-devises, multi-comptes)
- Cash en CAD natif, dépôts/retraits avec type de compte et justificatif
- Snapshot quotidien cron 22h (weekdays) — ne s'écrase plus
- Chart de performance avec benchmark S&P500 ($ et %)
- Allocation par symbole, catégorie, compte (CELI, REER, etc.)
- Variation relative par secteur
- 180 tickers dans l'autocomplete
- Bouton œil, période 1S, thème sombre/clair

### ⚠️ Partiellement fonctionnel
- **Benchmark weekend/jours fériés** : si aucun snapshot portfolio le vendredi soir, le point "hier" peut être décalé
- **Crypto exotiques** : certains nouveaux tickers (MEW, NOT...) pourraient ne pas être sur Yahoo — silencieusement ignorés, sans message d'erreur UX
- **Snapshot le weekend** : le cron ne tourne que lun-ven (`1-5`). Le client écrit un snapshot le samedi/dimanche si l'app est ouverte.

### ❌ Pas encore fait
- Target price + Stop loss par position
- Milestones financiers (50k, 100k, 250k...)
- Watchlist (tickers sans position ouverte)
- Import CSV (Questrade, Coinbase, Binance)
- Rapport hebdomadaire email (Resend)
- Analytics avancés (Sharpe, max drawdown, volatilité)

---

## 5. Prochaines étapes — Roadmap

### 🥇 Priorité 1 — Target price + Stop loss par position
- Ajouter 2 champs optionnels dans le form d'ajout de position
- Dans le tableau : distance en % au target / stop + barre visuelle
- Couleur selon proximité (vert si loin du stop, rouge si proche)
- **Complexité :** Faible — champs dans le JSON position, calcul visuel

### 🥈 Priorité 2 — Milestones financiers
- Définir des objectifs CAD (50k, 100k, 250k, 1M)
- Barre de progression + ETA calculée depuis le CAGR actuel
- Lié aux milestones 100k de Jarvis
- **Complexité :** Faible — données déjà disponibles

### 🥉 Priorité 3 — Watchlist
- Tab légère : tickers sans position, prix live, variation 24h, notes
- Stocké dans Supabase (nouvelle table ou colonne JSON dans user_data)
- **Complexité :** Faible à moyenne

### Priorité 4 — Import CSV
- Parser les exports Questrade (.csv), Coinbase, Binance
- UI drag & drop ou file input
- **Complexité :** Moyenne — formats très différents par broker

### Priorité 5 — Rapport hebdomadaire email
- Cron Vercel lundi 8h → email via Resend (gratuit 3k/mois)
- Contenu : variation semaine, top/flop positions, cashflow
- **Complexité :** Moyenne — nouvel endpoint + compte Resend

### Priorité 6 — Analytics avancés
- Max drawdown depuis ATH (calculé depuis `portfolio_history`)
- Sharpe ratio (rendement / écart-type des rendements journaliers)
- Volatilité annualisée
- **Complexité :** Faible — données déjà en base

---

## 6. Contexte technique essentiel

- **Toujours travailler dans `/tmp/nc-push`** — cloner depuis GitHub, modifier, push, puis `cp` vers le mount
- **Ne jamais modifier `index.html` via Python directement sur le mount Windows** — risque de troncature (encodage)
- **Vérifier que le fichier se termine par `</html>`** avant tout push : `tail -1 index.html`
- **`totalCAD = totalSizeUSD * fxRate + cash`** — pattern à respecter partout
- **`cash` est en CAD** dans Supabase depuis la migration `nc_cash_migrated_v2`
- **`portfolio_history.value`** est en `accountCurrency` (CAD pour Cédric), jamais en USD
- **`saveSnapshot`** utilise `ignore-duplicates` → ne jamais écraser une entrée existante
- **`fmtC()` et `fmtCpnl()`** utilisent `toUSD()` avec `liveFxRates` — ne pas revenir à `FX_FALLBACK`
- **`initCharts()`** est défini en bas du fichier — les charts sont créés une seule fois via `chartsInitialized`

---

## 7. Commandes utiles

```bash
# Démarrer une session dev
PAT=$(cat /chemin/vers/.cowork-config.env | grep GITHUB_PAT | cut -d= -f2)
git clone "https://Cedricplante:${PAT}@github.com/Cedricplante/nord-capital.git" /tmp/nc-push

# Vérifier que le fichier est complet
tail -3 /tmp/nc-push/index.html  # doit finir par </html>

# Push après modifications
cd /tmp/nc-push
git add . && git commit -m "..." && git push origin main

# Sync vers le dossier local
cp /tmp/nc-push/index.html /sessions/.../mnt/nord-capital/index.html

# Tester l'endpoint history (benchmark)
curl "https://nord-capital-cedricplantes-projects.vercel.app/api/history?symbol=SPY&range=1mo" | head -c 200

# Voir les derniers déploiements Vercel
# https://vercel.com/cedricplantes-projects/nord-capital/deployments
```

---

## 8. État des fichiers modifiés cette session

| Fichier | Changement |
|---------|------------|
| `index.html` | Cash CAD, V1/V3 fix, F1-F5, +100 tickers, benchmark SPY, bugs P1-P4 |
| `api/prices.js` | COINGECKO_MAP enrichi (+10 tokens) |
| `api/snapshot.js` | `cashCAD = cash` (plus de `* usdcad`) |
| `api/history.js` | **NOUVEAU** — prix historiques Yahoo Finance pour benchmark |

**Dernier commit :** `f93829c feat: benchmark S&P500 sur le chart de performance`
**PAT GitHub :** expire 2026-08-03 — renouveler sur https://github.com/settings/tokens

---

*Rapport généré le 01/06/2026 — Session "Nord Capital : Audit + Refactor + Features + Benchmark"*

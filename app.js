const SB_URL='https://spgcwvmehcixchtsfuaf.supabase.co';
// SCHEMA user_data requis: user_id, positions (text), trades (text), cash (numeric), currency (text, default 'USD'), updated_at (timestamptz)
// SCHEMA portfolio_history requis: user_id, date (date, PK avec user_id), value (numeric en USD), updated_at (timestamptz)
const SB_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwZ2N3dm1laGNpeGNodHNmdWFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMTUxODcsImV4cCI6MjA4OTU5MTE4N30.-lK4uPIrL0-fxVoLZtqzqjat2mznKrqp0CglSseb2Gs';

const SYMBOLS=[
  {s:'AAVE/USD',n:'Aave',inst:'Crypto',cat:'Crypto',cur:'USD'},{s:'ATOM/USD',n:'Cosmos (ATOM)',inst:'Crypto',cat:'Crypto',cur:'USD'},
  {s:'TQQQ',n:'ProShares UltraPro QQQ',inst:'ProShares',cat:'ETF Levier',cur:'USD'},{s:'UPRO',n:'ProShares UltraPro S&P 500',inst:'ProShares',cat:'ETF Levier',cur:'USD'},
  {s:'SPXL',n:'Direxion S&P 500 Bull 3x',inst:'Direxion',cat:'ETF Levier',cur:'USD'},{s:'SOXL',n:'Direxion Semiconductors Bull 3x',inst:'Direxion',cat:'ETF Levier',cur:'USD'},
  {s:'TNA',n:'Direxion Small Cap Bull 3x',inst:'Direxion',cat:'ETF Levier',cur:'USD'},{s:'SQQQ',n:'ProShares UltraPro Short QQQ',inst:'ProShares',cat:'ETF Levier',cur:'USD'},
  {s:'SPXU',n:'ProShares UltraPro Short S&P 500',inst:'ProShares',cat:'ETF Levier',cur:'USD'},{s:'LABU',n:'Direxion Biotech Bull 3x',inst:'Direxion',cat:'ETF Levier',cur:'USD'},
  {s:'FAS',n:'Direxion Financial Bull 3x',inst:'Direxion',cat:'ETF Levier',cur:'USD'},{s:'TECL',n:'Direxion Technology Bull 3x',inst:'Direxion',cat:'ETF Levier',cur:'USD'},
  {s:'WEBL',n:'Direxion Internet Bull 3x',inst:'Direxion',cat:'ETF Levier',cur:'USD'},
  {s:'TQQQ.TO',n:'BMO Ultra NASDAQ ETF (CAD)',inst:'BMO',cat:'ETF Levier',cur:'CAD'},{s:'HMAX.TO',n:'Hamilton Canadian Financials Yield Maximizer',inst:'Hamilton',cat:'ETF',cur:'CAD'},
  {s:'ZMMK.TO',n:'BMO Money Market ETF',inst:'BMO',cat:'ETF',cur:'CAD'},{s:'VFV.TO',n:'Vanguard S&P 500 Index ETF (CAD)',inst:'Vanguard',cat:'ETF',cur:'CAD'},
  {s:'XQQ.TO',n:'iShares NASDAQ 100 Index ETF (CAD)',inst:'iShares',cat:'ETF',cur:'CAD'},{s:'ZSP.TO',n:'BMO S&P 500 Index ETF (CAD)',inst:'BMO',cat:'ETF',cur:'CAD'},
  {s:'QQQ',n:'Invesco QQQ Trust',inst:'Invesco',cat:'ETF',cur:'USD'},{s:'SPY',n:'SPDR S&P 500 ETF Trust',inst:'State Street',cat:'ETF',cur:'USD'},
  {s:'VOO',n:'Vanguard S&P 500 ETF',inst:'Vanguard',cat:'ETF',cur:'USD'},{s:'VTI',n:'Vanguard Total Stock Market ETF',inst:'Vanguard',cat:'ETF',cur:'USD'},
  {s:'IWM',n:'iShares Russell 2000 ETF',inst:'iShares',cat:'ETF',cur:'USD'},{s:'GLD',n:'SPDR Gold Shares',inst:'State Street',cat:'ETF',cur:'USD'},
  {s:'SLV',n:'iShares Silver Trust',inst:'iShares',cat:'ETF',cur:'USD'},{s:'XLK',n:'Technology Select Sector SPDR',inst:'State Street',cat:'ETF',cur:'USD'},
  {s:'ARKK',n:'ARK Innovation ETF',inst:'ARK Invest',cat:'ETF',cur:'USD'},
  {s:'AAPL',n:'Apple Inc.',inst:'NASDAQ',cat:'Action',cur:'USD'},{s:'MSFT',n:'Microsoft Corporation',inst:'NASDAQ',cat:'Action',cur:'USD'},
  {s:'NVDA',n:'NVIDIA Corporation',inst:'NASDAQ',cat:'Action',cur:'USD'},{s:'GOOGL',n:'Alphabet Inc.',inst:'NASDAQ',cat:'Action',cur:'USD'},
  {s:'AMZN',n:'Amazon.com Inc.',inst:'NASDAQ',cat:'Action',cur:'USD'},{s:'META',n:'Meta Platforms Inc.',inst:'NASDAQ',cat:'Action',cur:'USD'},
  {s:'TSLA',n:'Tesla Inc.',inst:'NASDAQ',cat:'Action',cur:'USD'},{s:'AMD',n:'Advanced Micro Devices Inc.',inst:'NASDAQ',cat:'Action',cur:'USD'},
  {s:'INTC',n:'Intel Corporation',inst:'NASDAQ',cat:'Action',cur:'USD'},{s:'NFLX',n:'Netflix Inc.',inst:'NASDAQ',cat:'Action',cur:'USD'},
  {s:'COIN',n:'Coinbase Global Inc.',inst:'NASDAQ',cat:'Action',cur:'USD'},{s:'MSTR',n:'MicroStrategy Inc.',inst:'NASDAQ',cat:'Action',cur:'USD'},
  {s:'PLTR',n:'Palantir Technologies Inc.',inst:'NYSE',cat:'Action',cur:'USD'},{s:'RIOT',n:'Riot Platforms Inc.',inst:'NASDAQ',cat:'Action',cur:'USD'},
  {s:'BTC/USD',n:'Bitcoin',inst:'Crypto',cat:'Crypto',cur:'USD'},{s:'ETH/USD',n:'Ethereum',inst:'Crypto',cat:'Crypto',cur:'USD'},
  {s:'SOL/USD',n:'Solana',inst:'Crypto',cat:'Crypto',cur:'USD'},{s:'BNB/USD',n:'BNB',inst:'Crypto',cat:'Crypto',cur:'USD'},
  {s:'XRP/USD',n:'XRP (Ripple)',inst:'Crypto',cat:'Crypto',cur:'USD'},{s:'ADA/USD',n:'Cardano',inst:'Crypto',cat:'Crypto',cur:'USD'},
  {s:'AVAX/USD',n:'Avalanche',inst:'Crypto',cat:'Crypto',cur:'USD'},{s:'DOGE/USD',n:'Dogecoin',inst:'Crypto',cat:'Crypto',cur:'USD'},
  {s:'DOT/USD',n:'Polkadot',inst:'Crypto',cat:'Crypto',cur:'USD'},{s:'MATIC/USD',n:'Polygon (MATIC)',inst:'Crypto',cat:'Crypto',cur:'USD'},
  {s:'TAO/USD',n:'Bittensor (TAO)',inst:'Crypto',cat:'Crypto',cur:'USD'},{s:'RENDER/USD',n:'Render Network',inst:'Crypto',cat:'Crypto',cur:'USD'},
  {s:'AKASH/USD',n:'Akash Network (AKT)',inst:'Crypto',cat:'Crypto',cur:'USD'},{s:'ONDO/USD',n:'Ondo Finance',inst:'Crypto',cat:'Crypto',cur:'USD'},
  {s:'FET/USD',n:'Fetch.ai (ASI)',inst:'Crypto',cat:'Crypto',cur:'USD'},{s:'RSR/USD',n:'Reserve Rights (RSR)',inst:'Crypto',cat:'Crypto',cur:'USD'},
  {s:'PYTH/USD',n:'Pyth Network',inst:'Crypto',cat:'Crypto',cur:'USD'},{s:'INJ/USD',n:'Injective Protocol',inst:'Crypto',cat:'Crypto',cur:'USD'},
  {s:'SUI/USD',n:'Sui',inst:'Crypto',cat:'Crypto',cur:'USD'},{s:'APT/USD',n:'Aptos',inst:'Crypto',cat:'Crypto',cur:'USD'},
  {s:'ARB/USD',n:'Arbitrum',inst:'Crypto',cat:'Crypto',cur:'USD'},{s:'OP/USD',n:'Optimism',inst:'Crypto',cat:'Crypto',cur:'USD'},
  {s:'LINK/USD',n:'Chainlink',inst:'Crypto',cat:'Crypto',cur:'USD'},{s:'LTC/USD',n:'Litecoin',inst:'Crypto',cat:'Crypto',cur:'USD'},

  // Actions US — Tech & Growth
  {s:'JPM',n:'JPMorgan Chase & Co.',inst:'NYSE',cat:'Action',cur:'USD'},
  {s:'V',n:'Visa Inc.',inst:'NYSE',cat:'Action',cur:'USD'},
  {s:'MA',n:'Mastercard Inc.',inst:'NYSE',cat:'Action',cur:'USD'},
  {s:'WMT',n:'Walmart Inc.',inst:'NYSE',cat:'Action',cur:'USD'},
  {s:'BAC',n:'Bank of America Corp.',inst:'NYSE',cat:'Action',cur:'USD'},
  {s:'GS',n:'Goldman Sachs Group',inst:'NYSE',cat:'Action',cur:'USD'},
  {s:'UBER',n:'Uber Technologies Inc.',inst:'NYSE',cat:'Action',cur:'USD'},
  {s:'CRM',n:'Salesforce Inc.',inst:'NYSE',cat:'Action',cur:'USD'},
  {s:'NOW',n:'ServiceNow Inc.',inst:'NYSE',cat:'Action',cur:'USD'},
  {s:'SNOW',n:'Snowflake Inc.',inst:'NYSE',cat:'Action',cur:'USD'},
  {s:'CRWD',n:'CrowdStrike Holdings',inst:'NASDAQ',cat:'Action',cur:'USD'},
  {s:'PANW',n:'Palo Alto Networks',inst:'NASDAQ',cat:'Action',cur:'USD'},
  {s:'NET',n:'Cloudflare Inc.',inst:'NYSE',cat:'Action',cur:'USD'},
  {s:'DDOG',n:'Datadog Inc.',inst:'NASDAQ',cat:'Action',cur:'USD'},
  {s:'MDB',n:'MongoDB Inc.',inst:'NASDAQ',cat:'Action',cur:'USD'},
  {s:'ARM',n:'Arm Holdings plc',inst:'NASDAQ',cat:'Action',cur:'USD'},
  {s:'TSM',n:'Taiwan Semiconductor (ADR)',inst:'NYSE',cat:'Action',cur:'USD'},
  {s:'ASML',n:'ASML Holding NV',inst:'NASDAQ',cat:'Action',cur:'USD'},
  {s:'SMCI',n:'Super Micro Computer',inst:'NASDAQ',cat:'Action',cur:'USD'},
  {s:'HOOD',n:'Robinhood Markets',inst:'NASDAQ',cat:'Action',cur:'USD'},
  {s:'SOFI',n:'SoFi Technologies',inst:'NASDAQ',cat:'Action',cur:'USD'},
  {s:'MARA',n:'MARA Holdings (Bitcoin Mining)',inst:'NASDAQ',cat:'Action',cur:'USD'},
  {s:'CLSK',n:'CleanSpark Inc.',inst:'NASDAQ',cat:'Action',cur:'USD'},
  {s:'SHOP',n:'Shopify Inc.',inst:'NYSE',cat:'Action',cur:'USD'},
  {s:'U',n:'Unity Software Inc.',inst:'NYSE',cat:'Action',cur:'USD'},
  {s:'RBLX',n:'Roblox Corporation',inst:'NYSE',cat:'Action',cur:'USD'},
  {s:'NIO',n:'NIO Inc. (ADR)',inst:'NYSE',cat:'Action',cur:'USD'},
  {s:'BABA',n:'Alibaba Group (ADR)',inst:'NYSE',cat:'Action',cur:'USD'},
  {s:'RIVN',n:'Rivian Automotive',inst:'NASDAQ',cat:'Action',cur:'USD'},
  {s:'GME',n:'GameStop Corp.',inst:'NYSE',cat:'Action',cur:'USD'},

  // Actions canadiennes
  {s:'SHOP.TO',n:'Shopify Inc. (CAD)',inst:'TSX',cat:'Action',cur:'CAD'},
  {s:'RY.TO',n:'Banque Royale du Canada',inst:'TSX',cat:'Action',cur:'CAD'},
  {s:'TD.TO',n:'Banque Toronto-Dominion',inst:'TSX',cat:'Action',cur:'CAD'},
  {s:'ENB.TO',n:'Enbridge Inc.',inst:'TSX',cat:'Action',cur:'CAD'},
  {s:'CNR.TO',n:'Canadien National Railway',inst:'TSX',cat:'Action',cur:'CAD'},
  {s:'CP.TO',n:'CPKC Railway',inst:'TSX',cat:'Action',cur:'CAD'},
  {s:'BCE.TO',n:'BCE Inc.',inst:'TSX',cat:'Action',cur:'CAD'},
  {s:'BNS.TO',n:'Banque Scotia',inst:'TSX',cat:'Action',cur:'CAD'},
  {s:'BMO.TO',n:'Banque de Montréal',inst:'TSX',cat:'Action',cur:'CAD'},
  {s:'CM.TO',n:'Banque CIBC',inst:'TSX',cat:'Action',cur:'CAD'},
  {s:'SU.TO',n:'Suncor Energy',inst:'TSX',cat:'Action',cur:'CAD'},
  {s:'ABX.TO',n:'Barrick Gold Corp.',inst:'TSX',cat:'Action',cur:'CAD'},
  {s:'WCN.TO',n:'Waste Connections',inst:'TSX',cat:'Action',cur:'CAD'},

  // Crypto — supplémentaires
  {s:'TRX/USD',n:'TRON',inst:'Crypto',cat:'Crypto',cur:'USD'},
  {s:'HBAR/USD',n:'Hedera Hashgraph',inst:'Crypto',cat:'Crypto',cur:'USD'},
  {s:'TON/USD',n:'Toncoin',inst:'Crypto',cat:'Crypto',cur:'USD'},
  {s:'NEAR/USD',n:'NEAR Protocol',inst:'Crypto',cat:'Crypto',cur:'USD'},
  {s:'ICP/USD',n:'Internet Computer',inst:'Crypto',cat:'Crypto',cur:'USD'},
  {s:'STX/USD',n:'Stacks',inst:'Crypto',cat:'Crypto',cur:'USD'},
  {s:'PEPE/USD',n:'Pepe',inst:'Crypto',cat:'Crypto',cur:'USD'},
  {s:'WIF/USD',n:'dogwifhat (WIF)',inst:'Crypto',cat:'Crypto',cur:'USD'},
  {s:'BONK/USD',n:'Bonk',inst:'Crypto',cat:'Crypto',cur:'USD'},
  {s:'JUP/USD',n:'Jupiter (JUP)',inst:'Crypto',cat:'Crypto',cur:'USD'},
  {s:'ENA/USD',n:'Ethena (ENA)',inst:'Crypto',cat:'Crypto',cur:'USD'},
  {s:'TIA/USD',n:'Celestia (TIA)',inst:'Crypto',cat:'Crypto',cur:'USD'},
  {s:'SEI/USD',n:'Sei Network',inst:'Crypto',cat:'Crypto',cur:'USD'},
  {s:'PENDLE/USD',n:'Pendle Finance',inst:'Crypto',cat:'Crypto',cur:'USD'},
  {s:'ALGO/USD',n:'Algorand',inst:'Crypto',cat:'Crypto',cur:'USD'},
  {s:'VET/USD',n:'VeChain',inst:'Crypto',cat:'Crypto',cur:'USD'},
  {s:'XLM/USD',n:'Stellar Lumens',inst:'Crypto',cat:'Crypto',cur:'USD'},
  {s:'FIL/USD',n:'Filecoin',inst:'Crypto',cat:'Crypto',cur:'USD'},
  {s:'GRT/USD',n:'The Graph',inst:'Crypto',cat:'Crypto',cur:'USD'},
  {s:'AERO/USD',n:'Aerodrome Finance',inst:'Crypto',cat:'Crypto',cur:'USD'},
  {s:'POL/USD',n:'Polygon (POL)',inst:'Crypto',cat:'Crypto',cur:'USD'},
  {s:'NOT/USD',n:'Notcoin',inst:'Crypto',cat:'Crypto',cur:'USD'},
  {s:'MEW/USD',n:'cat in a dogs world (MEW)',inst:'Crypto',cat:'Crypto',cur:'USD'},

  // ETF US — Bitcoin spot & sectoriels
  {s:'IBIT',n:'iShares Bitcoin Trust (BlackRock)',inst:'NASDAQ',cat:'ETF',cur:'USD'},
  {s:'FBTC',n:'Fidelity Wise Origin Bitcoin Fund',inst:'CBOE',cat:'ETF',cur:'USD'},
  {s:'GBTC',n:'Grayscale Bitcoin Trust',inst:'OTCMKTS',cat:'ETF',cur:'USD'},
  {s:'BITO',n:'ProShares Bitcoin Strategy ETF',inst:'NYSE',cat:'ETF',cur:'USD'},
  {s:'SOXX',n:'iShares Semiconductor ETF',inst:'NASDAQ',cat:'ETF',cur:'USD'},
  {s:'SMH',n:'VanEck Semiconductor ETF',inst:'NASDAQ',cat:'ETF',cur:'USD'},
  {s:'XLE',n:'Energy Select Sector SPDR',inst:'NYSE',cat:'ETF',cur:'USD'},
  {s:'XLF',n:'Financial Select Sector SPDR',inst:'NYSE',cat:'ETF',cur:'USD'},
  {s:'XLV',n:'Health Care Select Sector SPDR',inst:'NYSE',cat:'ETF',cur:'USD'},
  {s:'XBI',n:'SPDR S&P Biotech ETF',inst:'NYSE',cat:'ETF',cur:'USD'},
  {s:'SCHD',n:'Schwab US Dividend Equity ETF',inst:'NYSE',cat:'ETF',cur:'USD'},
  {s:'VGT',n:'Vanguard Information Technology ETF',inst:'NYSE',cat:'ETF',cur:'USD'},
  {s:'TLT',n:'iShares 20+ Year Treasury Bond ETF',inst:'NASDAQ',cat:'ETF',cur:'USD'},
  {s:'MAGS',n:'Roundhill Magnificent Seven ETF',inst:'NASDAQ',cat:'ETF',cur:'USD'},

  // ETF canadiens
  {s:'XEQT.TO',n:'iShares Core Equity ETF Portfolio',inst:'TSX',cat:'ETF',cur:'CAD'},
  {s:'VEQT.TO',n:'Vanguard All-Equity ETF Portfolio',inst:'TSX',cat:'ETF',cur:'CAD'},
  {s:'VGRO.TO',n:'Vanguard Growth ETF Portfolio',inst:'TSX',cat:'ETF',cur:'CAD'},
  {s:'XGRO.TO',n:'iShares Core Growth ETF Portfolio',inst:'TSX',cat:'ETF',cur:'CAD'},
  {s:'XIC.TO',n:'iShares Core S&P/TSX Capped Composite',inst:'TSX',cat:'ETF',cur:'CAD'},
  {s:'HXT.TO',n:'Horizons S&P/TSX 60 Index ETF',inst:'TSX',cat:'ETF',cur:'CAD'},
  {s:'BTCQ.TO',n:'CI Galaxy Bitcoin ETF (CAD)',inst:'TSX',cat:'ETF',cur:'CAD'},
  {s:'ETHQ.TO',n:'CI Galaxy Ethereum ETF (CAD)',inst:'TSX',cat:'ETF',cur:'CAD'},
  {s:'BTCC.TO',n:'Purpose Bitcoin ETF (CAD)',inst:'TSX',cat:'ETF',cur:'CAD'},
  {s:'ZEB.TO',n:'BMO Equal Weight Banks ETF',inst:'TSX',cat:'ETF',cur:'CAD'},
  {s:'ZAG.TO',n:'BMO Aggregate Bond Index ETF',inst:'TSX',cat:'ETF',cur:'CAD'},

  // ETF Levier — supplémentaires
  {s:'NVDL',n:'GraniteShares 2x Long NVDA',inst:'NASDAQ',cat:'ETF Levier',cur:'USD'},
  {s:'TSLL',n:'Direxion Daily TSLA Bull 2x',inst:'NASDAQ',cat:'ETF Levier',cur:'USD'},
  {s:'BITX',n:'2x Bitcoin Strategy ETF',inst:'CBOE',cat:'ETF Levier',cur:'USD'},
  {s:'FNGU',n:'MicroSectors FANG+ 3x Leveraged',inst:'NYSE',cat:'ETF Levier',cur:'USD'},
  {s:'QLD',n:'ProShares Ultra QQQ (2x)',inst:'NASDAQ',cat:'ETF Levier',cur:'USD'},
  {s:'SSO',n:'ProShares Ultra S&P500 (2x)',inst:'NYSE',cat:'ETF Levier',cur:'USD'},
  {s:'CONL',n:'GraniteShares 2x Long COIN',inst:'NASDAQ',cat:'ETF Levier',cur:'USD'},
  {s:'HQU.TO',n:'Horizons BetaPro NASDAQ-100 2x Bull',inst:'TSX',cat:'ETF Levier',cur:'CAD'},
  {s:'HXU.TO',n:'Horizons BetaPro S&P/TSX 60 2x Bull',inst:'TSX',cat:'ETF Levier',cur:'CAD'},
  // Actions US — supplémentaires
  {s:'ORCL',n:'Oracle Corporation',inst:'NYSE',cat:'Action',cur:'USD'},{s:'ADBE',n:'Adobe Inc.',inst:'NASDAQ',cat:'Action',cur:'USD'},
  {s:'QCOM',n:'Qualcomm Inc.',inst:'NASDAQ',cat:'Action',cur:'USD'},{s:'TXN',n:'Texas Instruments',inst:'NASDAQ',cat:'Action',cur:'USD'},
  {s:'AVGO',n:'Broadcom Inc.',inst:'NASDAQ',cat:'Action',cur:'USD'},{s:'MU',n:'Micron Technology',inst:'NASDAQ',cat:'Action',cur:'USD'},
  {s:'LRCX',n:'Lam Research Corp.',inst:'NASDAQ',cat:'Action',cur:'USD'},{s:'KLAC',n:'KLA Corporation',inst:'NASDAQ',cat:'Action',cur:'USD'},
  {s:'AMAT',n:'Applied Materials',inst:'NASDAQ',cat:'Action',cur:'USD'},{s:'ANET',n:'Arista Networks',inst:'NYSE',cat:'Action',cur:'USD'},
  {s:'ZS',n:'Zscaler Inc.',inst:'NASDAQ',cat:'Action',cur:'USD'},{s:'OKTA',n:'Okta Inc.',inst:'NASDAQ',cat:'Action',cur:'USD'},
  {s:'HUBS',n:'HubSpot Inc.',inst:'NYSE',cat:'Action',cur:'USD'},{s:'TEAM',n:'Atlassian Corporation',inst:'NASDAQ',cat:'Action',cur:'USD'},
  {s:'WDAY',n:'Workday Inc.',inst:'NASDAQ',cat:'Action',cur:'USD'},{s:'APP',n:'Applovin Corporation',inst:'NASDAQ',cat:'Action',cur:'USD'},
  {s:'CELH',n:'Celsius Holdings',inst:'NASDAQ',cat:'Action',cur:'USD'},{s:'DUOL',n:'Duolingo Inc.',inst:'NASDAQ',cat:'Action',cur:'USD'},
  {s:'AXON',n:'Axon Enterprise',inst:'NASDAQ',cat:'Action',cur:'USD'},{s:'FTNT',n:'Fortinet Inc.',inst:'NASDAQ',cat:'Action',cur:'USD'},
  {s:'TTD',n:'The Trade Desk',inst:'NASDAQ',cat:'Action',cur:'USD'},{s:'ROKU',n:'Roku Inc.',inst:'NASDAQ',cat:'Action',cur:'USD'},
  {s:'PYPL',n:'PayPal Holdings',inst:'NASDAQ',cat:'Action',cur:'USD'},{s:'SQ',n:'Block Inc.',inst:'NYSE',cat:'Action',cur:'USD'},
  {s:'ABNB',n:'Airbnb Inc.',inst:'NASDAQ',cat:'Action',cur:'USD'},{s:'LYFT',n:'Lyft Inc.',inst:'NASDAQ',cat:'Action',cur:'USD'},
  {s:'SNAP',n:'Snap Inc.',inst:'NYSE',cat:'Action',cur:'USD'},{s:'PINS',n:'Pinterest Inc.',inst:'NYSE',cat:'Action',cur:'USD'},
  {s:'SPOT',n:'Spotify Technology',inst:'NYSE',cat:'Action',cur:'USD'},{s:'DASH',n:'DoorDash Inc.',inst:'NASDAQ',cat:'Action',cur:'USD'},
  {s:'IONQ',n:'IonQ Inc.',inst:'NYSE',cat:'Action',cur:'USD'},{s:'QUBT',n:'Quantum Computing Inc.',inst:'NASDAQ',cat:'Action',cur:'USD'},
  {s:'RGTI',n:'Rigetti Computing',inst:'NASDAQ',cat:'Action',cur:'USD'},{s:'AI',n:'C3.ai Inc.',inst:'NYSE',cat:'Action',cur:'USD'},
  {s:'BBAI',n:'BigBear.ai Holdings',inst:'NYSE',cat:'Action',cur:'USD'},{s:'SOUN',n:'SoundHound AI',inst:'NASDAQ',cat:'Action',cur:'USD'},
  {s:'ACHR',n:'Archer Aviation',inst:'NYSE',cat:'Action',cur:'USD'},{s:'JOBY',n:'Joby Aviation',inst:'NYSE',cat:'Action',cur:'USD'},
  {s:'LUNR',n:'Intuitive Machines',inst:'NASDAQ',cat:'Action',cur:'USD'},{s:'RDW',n:'Redwire Corporation',inst:'NYSE',cat:'Action',cur:'USD'},
  {s:'LMT',n:'Lockheed Martin',inst:'NYSE',cat:'Action',cur:'USD'},{s:'RTX',n:'RTX Corporation',inst:'NYSE',cat:'Action',cur:'USD'},
  {s:'BA',n:'Boeing Company',inst:'NYSE',cat:'Action',cur:'USD'},{s:'GE',n:'GE Aerospace',inst:'NYSE',cat:'Action',cur:'USD'},
  {s:'DIS',n:'Walt Disney Company',inst:'NYSE',cat:'Action',cur:'USD'},{s:'CMCSA',n:'Comcast Corporation',inst:'NASDAQ',cat:'Action',cur:'USD'},
  {s:'T',n:'AT&T Inc.',inst:'NYSE',cat:'Action',cur:'USD'},{s:'VZ',n:'Verizon Communications',inst:'NYSE',cat:'Action',cur:'USD'},
  {s:'PFE',n:'Pfizer Inc.',inst:'NYSE',cat:'Action',cur:'USD'},{s:'JNJ',n:'Johnson & Johnson',inst:'NYSE',cat:'Action',cur:'USD'},
  {s:'MRK',n:'Merck & Co.',inst:'NYSE',cat:'Action',cur:'USD'},{s:'LLY',n:'Eli Lilly and Company',inst:'NYSE',cat:'Action',cur:'USD'},
  {s:'NVO',n:'Novo Nordisk A/S (ADR)',inst:'NYSE',cat:'Action',cur:'USD'},{s:'ABBV',n:'AbbVie Inc.',inst:'NYSE',cat:'Action',cur:'USD'},
  {s:'XOM',n:'Exxon Mobil Corporation',inst:'NYSE',cat:'Action',cur:'USD'},{s:'CVX',n:'Chevron Corporation',inst:'NYSE',cat:'Action',cur:'USD'},
  {s:'BRK-B',n:'Berkshire Hathaway B',inst:'NYSE',cat:'Action',cur:'USD'},{s:'KO',n:'Coca-Cola Company',inst:'NYSE',cat:'Action',cur:'USD'},
  {s:'PEP',n:'PepsiCo Inc.',inst:'NASDAQ',cat:'Action',cur:'USD'},{s:'MCD',n:"McDonald's Corporation",inst:'NYSE',cat:'Action',cur:'USD'},
  {s:'SBUX',n:'Starbucks Corporation',inst:'NASDAQ',cat:'Action',cur:'USD'},{s:'NKE',n:'Nike Inc.',inst:'NYSE',cat:'Action',cur:'USD'},
  // Actions canadiennes — supplémentaires
  {s:'CNQ.TO',n:'Canadian Natural Resources',inst:'TSX',cat:'Action',cur:'CAD'},{s:'TRP.TO',n:'TC Energy Corp.',inst:'TSX',cat:'Action',cur:'CAD'},
  {s:'MFC.TO',n:'Manulife Financial',inst:'TSX',cat:'Action',cur:'CAD'},{s:'SLF.TO',n:'Sun Life Financial',inst:'TSX',cat:'Action',cur:'CAD'},
  {s:'POW.TO',n:'Power Corporation',inst:'TSX',cat:'Action',cur:'CAD'},{s:'IGM.TO',n:'IGM Financial',inst:'TSX',cat:'Action',cur:'CAD'},
  {s:'ATD.TO',n:'Alimentation Couche-Tard',inst:'TSX',cat:'Action',cur:'CAD'},{s:'L.TO',n:'Loblaw Companies',inst:'TSX',cat:'Action',cur:'CAD'},
  {s:'MRU.TO',n:'Metro Inc.',inst:'TSX',cat:'Action',cur:'CAD'},{s:'EMP-A.TO',n:'Empire Company',inst:'TSX',cat:'Action',cur:'CAD'},
  {s:'TFII.TO',n:'TFI International',inst:'TSX',cat:'Action',cur:'CAD'},{s:'WSP.TO',n:'WSP Global',inst:'TSX',cat:'Action',cur:'CAD'},
  {s:'CAE.TO',n:'CAE Inc.',inst:'TSX',cat:'Action',cur:'CAD'},{s:'TIXT.TO',n:'TELUS International',inst:'TSX',cat:'Action',cur:'CAD'},
  {s:'OVV.TO',n:'Ovintiv Inc.',inst:'TSX',cat:'Action',cur:'CAD'},{s:'IMO.TO',n:'Imperial Oil',inst:'TSX',cat:'Action',cur:'CAD'},
  // Crypto — supplémentaires
  {s:'LDO/USD',n:'Lido DAO',inst:'Crypto',cat:'Crypto',cur:'USD'},{s:'RUNE/USD',n:'THORChain',inst:'Crypto',cat:'Crypto',cur:'USD'},
  {s:'FTM/USD',n:'Fantom (FTM)',inst:'Crypto',cat:'Crypto',cur:'USD'},{s:'KAVA/USD',n:'Kava',inst:'Crypto',cat:'Crypto',cur:'USD'},
  {s:'ONE/USD',n:'Harmony (ONE)',inst:'Crypto',cat:'Crypto',cur:'USD'},{s:'ROSE/USD',n:'Oasis Network',inst:'Crypto',cat:'Crypto',cur:'USD'},
  {s:'SAND/USD',n:'The Sandbox',inst:'Crypto',cat:'Crypto',cur:'USD'},{s:'MANA/USD',n:'Decentraland',inst:'Crypto',cat:'Crypto',cur:'USD'},
  {s:'AXS/USD',n:'Axie Infinity',inst:'Crypto',cat:'Crypto',cur:'USD'},{s:'CHZ/USD',n:'Chiliz',inst:'Crypto',cat:'Crypto',cur:'USD'},
  {s:'FLUX/USD',n:'Flux',inst:'Crypto',cat:'Crypto',cur:'USD'},{s:'JASMY/USD',n:'JasmyCoin',inst:'Crypto',cat:'Crypto',cur:'USD'},
  {s:'WLD/USD',n:'Worldcoin',inst:'Crypto',cat:'Crypto',cur:'USD'},{s:'STRK/USD',n:'Starknet',inst:'Crypto',cat:'Crypto',cur:'USD'},
  {s:'ZRO/USD',n:'LayerZero',inst:'Crypto',cat:'Crypto',cur:'USD'},{s:'W/USD',n:'Wormhole',inst:'Crypto',cat:'Crypto',cur:'USD'},
  {s:'BRETT/USD',n:'Brett (Base)',inst:'Crypto',cat:'Crypto',cur:'USD'},{s:'POPCAT/USD',n:'Popcat',inst:'Crypto',cat:'Crypto',cur:'USD'},
  {s:'MOG/USD',n:'Mog Coin',inst:'Crypto',cat:'Crypto',cur:'USD'},{s:'TURBO/USD',n:'Turbo',inst:'Crypto',cat:'Crypto',cur:'USD'},
  // ETF US — supplémentaires
  {s:'IAU',n:'iShares Gold Trust',inst:'CBOE',cat:'ETF',cur:'USD'},{s:'GDX',n:'VanEck Gold Miners ETF',inst:'NYSE',cat:'ETF',cur:'USD'},
  {s:'GDXJ',n:'VanEck Junior Gold Miners ETF',inst:'NYSE',cat:'ETF',cur:'USD'},{s:'PPLT',n:'Aberdeen Platinum ETF',inst:'NYSE',cat:'ETF',cur:'USD'},
  {s:'DIA',n:'SPDR Dow Jones Industrial ETF',inst:'NYSE',cat:'ETF',cur:'USD'},{s:'MDY',n:'SPDR S&P MidCap 400 ETF',inst:'NYSE',cat:'ETF',cur:'USD'},
  {s:'VIG',n:'Vanguard Dividend Appreciation ETF',inst:'NYSE',cat:'ETF',cur:'USD'},{s:'JEPI',n:'JPMorgan Equity Premium Income ETF',inst:'NYSE',cat:'ETF',cur:'USD'},
  {s:'JEPQ',n:'JPMorgan Nasdaq Equity Premium ETF',inst:'NASDAQ',cat:'ETF',cur:'USD'},{s:'XYLD',n:'Global X S&P 500 Covered Call ETF',inst:'NYSE',cat:'ETF',cur:'USD'},
  {s:'QYLD',n:'Global X NASDAQ 100 Covered Call ETF',inst:'NASDAQ',cat:'ETF',cur:'USD'},{s:'NUSI',n:'Nationwide Nasdaq-100 Risk-Managed ETF',inst:'NASDAQ',cat:'ETF',cur:'USD'},
  {s:'HYG',n:'iShares iBoxx High Yield Corp Bond ETF',inst:'NYSE',cat:'ETF',cur:'USD'},{s:'LQD',n:'iShares iBoxx Investment Grade ETF',inst:'NYSE',cat:'ETF',cur:'USD'},
  {s:'EMB',n:'iShares JP Morgan USD Emerging Markets Bond',inst:'NASDAQ',cat:'ETF',cur:'USD'},
  // ETF Levier — supplémentaires
  {s:'MSTU',n:'T-Rex 2x Long MSTR',inst:'NASDAQ',cat:'ETF Levier',cur:'USD'},{s:'MSTZ',n:'T-Rex 2x Inverse MSTR',inst:'NASDAQ',cat:'ETF Levier',cur:'USD'},
  {s:'NVDU',n:'T-Rex 2x Long NVDA',inst:'NASDAQ',cat:'ETF Levier',cur:'USD'},{s:'TSLT',n:'T-Rex 2x Long TSLA',inst:'NASDAQ',cat:'ETF Levier',cur:'USD'},
  {s:'AAPU',n:'Leverage Shares 2x Apple ETP',inst:'NASDAQ',cat:'ETF Levier',cur:'USD'},{s:'MSFU',n:'Leverage Shares 2x Microsoft ETP',inst:'NASDAQ',cat:'ETF Levier',cur:'USD'},
  {s:'USD',n:'USD / Dollar américain',inst:'Devise',cat:'Forex',cur:'USD'},{s:'EUR/USD',n:'Euro / Dollar US',inst:'Forex',cat:'Forex',cur:'USD'},{s:'GBP/USD',n:'Livre Sterling / Dollar',inst:'Forex',cat:'Forex',cur:'USD'},
  {s:'USD/JPY',n:'Dollar / Yen japonais',inst:'Forex',cat:'Forex',cur:'JPY'},{s:'USD/CAD',n:'Dollar / Dollar canadien',inst:'Forex',cat:'Forex',cur:'CAD'},
  {s:'AUD/USD',n:'Dollar australien / Dollar',inst:'Forex',cat:'Forex',cur:'USD'},{s:'USD/CHF',n:'Dollar / Franc suisse',inst:'Forex',cat:'Forex',cur:'CHF'},
  {s:'EUR/GBP',n:'Euro / Livre Sterling',inst:'Forex',cat:'Forex',cur:'GBP'},{s:'EUR/JPY',n:'Euro / Yen japonais',inst:'Forex',cat:'Forex',cur:'JPY'},
  {s:'GBP/JPY',n:'Livre Sterling / Yen',inst:'Forex',cat:'Forex',cur:'JPY'},{s:'NZD/USD',n:'Dollar néo-zélandais / Dollar',inst:'Forex',cat:'Forex',cur:'USD'},
  {s:'XAU/USD',n:'Or (Gold)',inst:'Spot',cat:'Commodité',cur:'USD'},{s:'XAG/USD',n:'Argent (Silver)',inst:'Spot',cat:'Commodité',cur:'USD'},
  {s:'WTI/USD',n:'Pétrole WTI',inst:'Futures',cat:'Commodité',cur:'USD'},{s:'BRENT/USD',n:'Pétrole Brent',inst:'Futures',cat:'Commodité',cur:'USD'},
];
const TICKER_MAP={'AAVE/USD':'AAVE-USD','ATOM/USD':'ATOM-USD','BTC/USD':'BTC-USD','ETH/USD':'ETH-USD','SOL/USD':'SOL-USD','BNB/USD':'BNB-USD','XRP/USD':'XRP-USD','ADA/USD':'ADA-USD','AVAX/USD':'AVAX-USD','DOGE/USD':'DOGE-USD','DOT/USD':'DOT-USD','MATIC/USD':'MATIC-USD','TAO/USD':'TAO-USD','RENDER/USD':'RNDR-USD','RNDR/USD':'RNDR-USD','AKASH/USD':'AKT-USD','AKT/USD':'AKT-USD','ONDO/USD':'ONDO-USD','FET/USD':'FET-USD','RSR/USD':'RSR-USD','PYTH/USD':'PYTH-USD','INJ/USD':'INJ-USD','SUI/USD':'SUI-USD','APT/USD':'APT-USD','ARB/USD':'ARB-USD','OP/USD':'OP-USD','LINK/USD':'LINK-USD','LTC/USD':'LTC-USD','HMAX':'HMAX.TO','HMAX.TO':'HMAX.TO','ZMMK':'ZMMK.TO','ZMMK.TO':'ZMMK.TO','TQQQ.TO':'TQQQ.TO','VFV':'VFV.TO','VFV.TO':'VFV.TO','XQQ':'XQQ.TO','XQQ.TO':'XQQ.TO','ZSP':'ZSP.TO','ZSP.TO':'ZSP.TO','EUR/USD':'EURUSD=X','GBP/USD':'GBPUSD=X','USD/JPY':'USDJPY=X','USD/CAD':'USDCAD=X','AUD/USD':'AUDUSD=X','USD/CHF':'USDCHF=X','EUR/GBP':'EURGBP=X','EUR/JPY':'EURJPY=X','GBP/JPY':'GBPJPY=X','NZD/USD':'NZDUSD=X','XAU/USD':'GC=F','XAG/USD':'SI=F','WTI/USD':'CL=F','BRENT/USD':'BZ=F','TRX/USD':'TRX-USD','HBAR/USD':'HBAR-USD','TON/USD':'TON11419-USD','NEAR/USD':'NEAR-USD','ICP/USD':'ICP1-USD','STX/USD':'STX-USD','PEPE/USD':'PEPE24478-USD','WIF/USD':'WIF-USD','BONK/USD':'BONK-USD','JUP/USD':'JUP-USD','ENA/USD':'ENA-USD','TIA/USD':'TIA-USD','SEI/USD':'SEI-USD','PENDLE/USD':'PENDLE-USD','ALGO/USD':'ALGO-USD','VET/USD':'VET-USD','XLM/USD':'XLM-USD','FIL/USD':'FIL-USD','GRT/USD':'GRT-USD','AERO/USD':'AERO-USD','POL/USD':'POL-USD','NOT/USD':'NOT-USD','MEW/USD':'MEW-USD','SHOP.TO':'SHOP.TO','RY.TO':'RY.TO','TD.TO':'TD.TO','ENB.TO':'ENB.TO','CNR.TO':'CNR.TO','CP.TO':'CP.TO','BCE.TO':'BCE.TO','BNS.TO':'BNS.TO','BMO.TO':'BMO.TO','CM.TO':'CM.TO','SU.TO':'SU.TO','ABX.TO':'ABX.TO','WCN.TO':'WCN.TO','XEQT.TO':'XEQT.TO','VEQT.TO':'VEQT.TO','VGRO.TO':'VGRO.TO','XGRO.TO':'XGRO.TO','XIC.TO':'XIC.TO','HXT.TO':'HXT.TO','BTCQ.TO':'BTCQ.TO','ETHQ.TO':'ETHQ.TO','BTCC.TO':'BTCC.TO','ZEB.TO':'ZEB.TO','ZAG.TO':'ZAG.TO','HQU.TO':'HQU.TO','HXU.TO':'HXU.TO',};
function getTicker(s){if(TICKER_MAP[s])return TICKER_MAP[s];if(s.endsWith('/USD'))return s.replace('/USD','-USD');return s;}

// ─── STATE ───────────────────────────────────────────────────────
let currentUser=null,accessToken=null;
let cash=0,closeTarget=null,positions=[],trades=[],strategies=[];
let lastKnownUpdatedAt=null; // updated_at connu de user_data — contrôle de concurrence optimiste dans saveData()
// REER/CELI : synchronisés via Supabase (user_data.reer_limit / celi_join_year),
// plus en localStorage — sinon reset silencieux à chaque nouvel appareil (même
// bug de fond que l'ancienne migration cash USD→CAD).
let reerLimit=0,celiJoinYear=2009;
let perfChart,allocChart,allocSymChart,allocCatChart,allocCatDashChart,assetPerfChart,assetPerfDashChart,pnlBarChart,cashAllocChart,celiChart,celiappChart,cryptoAllocChart,sectorVarChart,cashLotsChart;
let chartsInitialized=false;
let accountCurrency='USD',fxRate=1;
let activePeriod='ALL'; // défaut ALL demandé par Cédric (2026-07-28) — chaque connexion doit repartir sur ALL/$/CAD
let benchmarkMode='absolute';
let chartCurrency='CAD'; // 'absolute' | 'relative'
const spyCache={}; // {range: [{date,close}]}
let portfolioHistory=[];

// ─── FORMAT ──────────────────────────────────────────────────────
// Espaces comme séparateurs de milliers (1 234,56 $)
function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
// Fix audit 2026-08-03 : w.symbol (watchlist) venait d'un <input> utilisateur et était
// interpolé BRUT (pas escapeHtml, contrairement à w.note) dans du HTML texte, un attribut id,
// et plusieurs onclick/onchange inline. Une apostrophe ou un guillemet dans le champ cassait
// le rendu ou l'attribut JS inline -- self-XSS potentiel, mais surtout un bug de robustesse
// concret. escapeJsAttr() échappe pour un littéral JS entre quotes simples PUIS pour
// l'attribut HTML qui le contient (ordre important : le navigateur HTML-décode l'attribut
// avant de l'exécuter comme JS). wlDomId() sanitize pour un usage sûr en id/CSS.
function escapeJsAttr(v){
  const jsEscaped=String(v??'').replace(/\\/g,'\\\\').replace(/'/g,"\\'");
  return escapeHtml(jsEscaped);
}
function wlDomId(symbol){return String(symbol??'').replace(/[^A-Za-z0-9_-]/g,'_');}
function fmtAmt(n){if(!isFinite(n)||isNaN(n))return '—';return n.toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2})+' $';}
function fmtAmtRound(n){if(!isFinite(n)||isNaN(n))return '—';return Math.round(n).toLocaleString('fr-FR')+' $';}
function fmt$(n){return fmtAmt(Math.abs(n)*fxRate);}
function fmtPnl$(n){return(n>=0?'+':'-')+fmtAmt(Math.abs(n*fxRate));}
function fmtPct(n){return(n>=0?'+':'')+n.toFixed(2)+'%';}
function fmtPrice(p){if(p===null||p===undefined||isNaN(p))return '—';return p>100?p.toFixed(2):p.toFixed(4);}
function fmtC(n,posCur){return fmtAmt(toUSD(n,posCur||'USD')*fxRate);}
function fmtCpnl(n,posCur){const v=toUSD(n,posCur||'USD')*fxRate;return(v>=0?'+':'-')+fmtAmt(Math.abs(v));}

// ─── AUTH ────────────────────────────────────────────────────────
function switchAuthTab(tab,el){document.querySelectorAll('.auth-tab').forEach(t=>t.classList.remove('active'));el.classList.add('active');document.getElementById('auth-login').style.display=tab==='login'?'block':'none';document.getElementById('auth-signup').style.display=tab==='signup'?'block':'none';}
async function authFetch(endpoint,body){const res=await fetch(`${SB_URL}/auth/v1/${endpoint}`,{method:'POST',headers:{'Content-Type':'application/json','apikey':SB_KEY},body:JSON.stringify(body)});return res.json();}
async function handleLogin(){
  const email=document.getElementById('login-email').value.trim(),password=document.getElementById('login-password').value;
  const errEl=document.getElementById('login-error');
  errEl.textContent='';
  if(!email||!password){errEl.textContent='Remplis tous les champs.';return;}
  const btn=document.querySelector('#auth-login .auth-btn');btn.disabled=true;btn.textContent='Connexion...';
  try{
    const data=await authFetch('token?grant_type=password',{email,password});
    if(!data.access_token){
      const msg=data.error_description||data.msg||'Email ou mot de passe incorrect.';
      errEl.textContent=msg;
      btn.disabled=false;btn.textContent='Se connecter';
      return;
    }
    accessToken=data.access_token;currentUser=data.user;
    localStorage.setItem('nc_token',accessToken);localStorage.setItem('nc_user',JSON.stringify(currentUser));
    await startApp();
  }catch(e){
    errEl.textContent='Erreur réseau. Vérifie ta connexion.';
    btn.disabled=false;btn.textContent='Se connecter';
  }
}
function showForgot(){
  ['auth-login','auth-signup','auth-reset'].forEach(id=>{const el=document.getElementById(id);if(el)el.style.display='none';});
  document.getElementById('auth-forgot').style.display='block';
  document.querySelector('.auth-tabs').style.display='none';
}
function showLogin(){
  ['auth-forgot','auth-signup','auth-reset'].forEach(id=>{const el=document.getElementById(id);if(el)el.style.display='none';});
  document.getElementById('auth-login').style.display='block';
  document.querySelector('.auth-tabs').style.display='flex';
  document.querySelectorAll('.auth-tab').forEach((t,i)=>{t.classList.toggle('active',i===0);});
}
async function handleForgotPassword(){
  const email=document.getElementById('forgot-email').value.trim();
  const errEl=document.getElementById('forgot-error');
  errEl.style.color='var(--red)';errEl.textContent='';
  if(!email){errEl.textContent='Entre ton adresse email.';return;}
  const btn=document.querySelector('#auth-forgot .auth-btn');btn.disabled=true;btn.textContent='Envoi...';
  try{
    await fetch(`${SB_URL}/auth/v1/recover`,{method:'POST',headers:{'Content-Type':'application/json','apikey':SB_KEY},body:JSON.stringify({email})});
    errEl.style.color='var(--green)';errEl.textContent='Email envoyé ! Vérifie ta boîte de réception.';
    btn.disabled=false;btn.textContent='Renvoyer';
  }catch(e){
    errEl.textContent='Erreur réseau. Réessaie.';
    btn.disabled=false;btn.textContent='Envoyer le lien';
  }
}
async function handleResetPassword(){
  const pw=document.getElementById('reset-password').value;
  const pw2=document.getElementById('reset-password-confirm').value;
  const errEl=document.getElementById('reset-error');
  errEl.style.color='var(--red)';errEl.textContent='';
  if(pw.length<6){errEl.textContent='Min. 6 caractères.';return;}
  if(pw!==pw2){errEl.textContent='Les mots de passe ne correspondent pas.';return;}
  const btn=document.querySelector('#auth-reset .auth-btn');btn.disabled=true;btn.textContent='Enregistrement...';
  try{
    const token=window._resetToken;
    const res=await fetch(`${SB_URL}/auth/v1/user`,{method:'PUT',headers:{'Content-Type':'application/json','apikey':SB_KEY,'Authorization':`Bearer ${token}`},body:JSON.stringify({password:pw})});
    const data=await res.json();
    if(data.error){errEl.textContent=data.error.message||'Erreur.';btn.disabled=false;btn.textContent='Enregistrer le mot de passe';return;}
    errEl.style.color='var(--green)';errEl.textContent='Mot de passe mis à jour ! Connecte-toi.';
    setTimeout(()=>{window.location.hash='';showLogin();},2000);
  }catch(e){
    errEl.textContent='Erreur réseau. Réessaie.';
    btn.disabled=false;btn.textContent='Enregistrer le mot de passe';
  }
}
let signupThemeChoice='dark';
function setSignupTheme(theme){
  signupThemeChoice=theme;
  const dark=document.getElementById('signup-theme-dark'),light=document.getElementById('signup-theme-light');
  if(dark&&light){dark.style.background=theme==='dark'?'var(--blue)':'var(--bg3)';dark.style.color=theme==='dark'?'#fff':'var(--text2)';dark.style.borderColor=theme==='dark'?'var(--blue)':'var(--border2)';light.style.background=theme==='light'?'var(--blue)':'var(--bg3)';light.style.color=theme==='light'?'#fff':'var(--text2)';light.style.borderColor=theme==='light'?'var(--blue)':'var(--border2)';}
  setTheme(theme);
}
async function handleSignup(){
  const email=document.getElementById('signup-email').value.trim(),password=document.getElementById('signup-password').value;
  document.getElementById('signup-error').textContent='';
  if(password.length<6){document.getElementById('signup-error').textContent='Min. 6 caractères.';return;}
  const chosenCurrency=document.getElementById('signup-currency')?.value||'CAD';
  const data=await authFetch('signup',{email,password,data:{preferred_currency:chosenCurrency,preferred_theme:signupThemeChoice}});
  if(data.error){document.getElementById('signup-error').textContent=data.error.message;return;}
  localStorage.setItem('nc_theme',signupThemeChoice);
  localStorage.setItem('nc_currency',chosenCurrency);
  // Si Supabase retourne directement le token (auto-confirm), initialiser les données
  if(data.access_token){
    try{
      await fetch(`${SB_URL}/rest/v1/user_data`,{method:'POST',headers:{...{'Content-Type':'application/json','apikey':SB_KEY,'Authorization':`Bearer ${data.access_token}`},'Prefer':'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({user_id:data.user.id,currency:chosenCurrency,positions:'[]',trades:'[]',cash:0,updated_at:new Date().toISOString()})});
    }catch(e){}
  }
  const el=document.getElementById('signup-error');el.style.color='var(--green)';el.textContent='Compte créé ! Tu peux te connecter.';
}
function setTheme(theme){
  document.documentElement.setAttribute('data-theme',theme);localStorage.setItem('nc_theme',theme);
  const btnDark=document.getElementById('btn-dark'),btnLight=document.getElementById('btn-light');
  if(btnDark&&btnLight){btnDark.style.background=theme==='dark'?'var(--blue)':'var(--bg4)';btnDark.style.color=theme==='dark'?'#fff':'var(--text2)';btnDark.style.borderColor=theme==='dark'?'var(--blue)':'var(--border2)';btnLight.style.background=theme==='light'?'var(--blue)':'var(--bg3)';btnLight.style.color=theme==='light'?'#fff':'var(--text2)';btnLight.style.borderColor=theme==='light'?'var(--blue)':'var(--border2)';}
}
let hideAmounts=localStorage.getItem('nc_hide_amounts')==='1';
function toggleHideAmounts(){
  hideAmounts=!hideAmounts;
  document.body.classList.toggle('hide-amounts',hideAmounts);
  const btn=document.getElementById('btn-eye');
  if(btn)btn.classList.toggle('active',hideAmounts);
  localStorage.setItem('nc_hide_amounts',hideAmounts?'1':'0');
}
// Restaurer l'état au chargement
document.addEventListener('DOMContentLoaded',()=>{
  initPosFormState();
  initCotisHistoryState();
  if(localStorage.getItem('nc_hide_amounts')==='1'){
    document.body.classList.add('hide-amounts');
    const btn=document.getElementById('btn-eye');if(btn)btn.classList.add('active');
  }
});
function toggleHamburger(e){e.stopPropagation();const m=document.getElementById('hamburger-menu');m.style.display=m.style.display==='block'?'none':'block';}
document.addEventListener('click',e=>{if(!e.target.closest('#hamburger-btn')&&!e.target.closest('#hamburger-menu')){const m=document.getElementById('hamburger-menu');if(m)m.style.display='none';}});
async function handleLogout(){
  localStorage.removeItem('nc_token');localStorage.removeItem('nc_user');
  accessToken=null;currentUser=null;positions=[];trades=[];cash=0;portfolioHistory=[];strategies=[];lastKnownUpdatedAt=null;
  // Détruire toutes les instances Chart.js pour éviter les conflits à la reconnexion
  [perfChart,allocChart,allocSymChart,allocCatChart,allocCatDashChart,assetPerfChart,assetPerfDashChart,pnlBarChart,cashAllocChart,celiChart,celiappChart,cryptoAllocChart,sectorVarChart,cashLotsChart].forEach(c=>{try{if(c)c.destroy();}catch(e){}});
  perfChart=allocChart=allocSymChart=allocCatChart=allocCatDashChart=assetPerfChart=assetPerfDashChart=pnlBarChart=cashAllocChart=celiChart=celiappChart=cryptoAllocChart=sectorVarChart=cashLotsChart=null;
  chartsInitialized=false;
  // Reset devise
  accountCurrency='USD';fxRate=1;Object.keys(liveFxRates).forEach(k=>delete liveFxRates[k]);
  document.getElementById('main-app').style.display='none';document.getElementById('auth-screen').style.display='flex';
}

// ─── DATA ────────────────────────────────────────────────────────
function sbHeaders(){return{'Content-Type':'application/json','apikey':SB_KEY,'Authorization':`Bearer ${accessToken}`};}
function showSaving(){const el=document.getElementById('saving-indicator');el.classList.add('visible');setTimeout(()=>el.classList.remove('visible'),2000);}
let _savePending=false;
// Contrôle de concurrence optimiste : on ne PATCH la ligne user_data que si son updated_at
// correspond encore à celui qu'on a chargé/écrit en dernier. Si une autre session (autre
// appareil, ou modification directe Supabase) a changé la donnée entre-temps, le PATCH filtré
// ne matche 0 ligne — on détecte ça et on recharge au lieu d'écraser silencieusement.
// (cf. rapport de session 2026-07-23 : une session périmée a ré-écrasé un nettoyage de données)
// Retourne true si la sauvegarde a été confirmée par le serveur, false sinon
// (échec réseau, conflit résolu par rechargement, création échouée). Les appelants
// critiques (ex: saveCotisation) doivent vérifier ce retour et annuler leur
// changement local en mémoire si false, sinon l'UI affiche une donnée qui n'a
// jamais été persistée et qui disparaît silencieusement au prochain rechargement.
async function saveData(){
  if(!currentUser||!accessToken)return false;
  if(_savePending){
    // Au lieu d'un fire-and-forget (perdait le résultat réel de la tentative retardée),
    // on attend et on relaie le vrai résultat à l'appelant.
    await new Promise(r=>setTimeout(r,300));
    return saveData();
  }
  _savePending=true;
  const nowIso=new Date().toISOString();
  const payload={user_id:currentUser.id,positions:JSON.stringify(positions),trades:JSON.stringify(trades),cash,currency:accountCurrency,watchlist:JSON.stringify(watchlist),reer_limit:reerLimit,celi_join_year:celiJoinYear,updated_at:nowIso};
  try{
    const guard=lastKnownUpdatedAt?`&updated_at=eq.${encodeURIComponent(lastKnownUpdatedAt)}`:'';
    let res;
    try{
      res=await fetch(`${SB_URL}/rest/v1/user_data?user_id=eq.${currentUser.id}${guard}`,{method:'PATCH',headers:{...sbHeaders(),'Prefer':'return=representation'},body:JSON.stringify(payload)});
    }catch(networkErr){
      // Avant ce fix : une exception fetch ici remontait non-catchée hors de saveData(),
      // empêchant le code appelant (ex: fermeture de modal) de s'exécuter, SANS AUCUN
      // signal visible pour l'utilisateur — cause probable de cotisations 'perdues'.
      console.error('[saveData] Échec réseau:',networkErr);
      showSaveError();
      return false;
    }
    const rows=res.ok?await res.json().catch(()=>[]):[];
    if(res.ok&&rows.length>0){
      lastKnownUpdatedAt=nowIso;showSaving();
      return true;
    }else if(lastKnownUpdatedAt){
      // Conflit détecté : quelqu'un d'autre a modifié la ligne depuis notre dernier chargement.
      // Notre payload n'a PAS été écrit — l'état local va être remplacé par celui du serveur.
      await handleSaveConflict();
      return false;
    }else{
      // Aucune ligne existante (nouvel utilisateur) : la créer.
      try{
        const createRes=await fetch(`${SB_URL}/rest/v1/user_data`,{method:'POST',headers:{...sbHeaders(),'Prefer':'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(payload)});
        if(!createRes.ok){console.error('[saveData] Création user_data échouée:',createRes.status);showSaveError();return false;}
      }catch(networkErr){
        console.error('[saveData] Échec réseau (création):',networkErr);
        showSaveError();
        return false;
      }
      lastKnownUpdatedAt=nowIso;showSaving();
      return true;
    }
  }finally{_savePending=false;}
}
async function handleSaveConflict(){
  console.warn('[saveData] Conflit détecté (données modifiées ailleurs depuis le dernier chargement) — rechargement au lieu d\'écraser.');
  showConflict();
  await loadData();
  renderAll();
}
function showConflict(){
  const el=document.getElementById('saving-indicator');
  if(!el)return;
  el.textContent='⚠ Modifié ailleurs — rechargé';
  el.style.color='#ffb020';
  el.classList.add('visible');
  setTimeout(()=>{el.classList.remove('visible');el.textContent='Sauvegardé';el.style.color='';},4000);
}
function showSaveError(){
  const el=document.getElementById('saving-indicator');
  if(!el)return;
  el.textContent='✕ Échec de sauvegarde';
  el.style.color='var(--red)';
  el.classList.add('visible');
  setTimeout(()=>{el.classList.remove('visible');el.textContent='Sauvegardé';el.style.color='';},6000);
}
async function loadData(){
  if(!currentUser||!accessToken)return;
  const res=await fetch(`${SB_URL}/rest/v1/user_data?user_id=eq.${currentUser.id}&select=*`,{headers:sbHeaders()});
  if(!res.ok)return;
  const data=await res.json();
  if(data&&data.length>0){
    const row=data[0];
    lastKnownUpdatedAt=row.updated_at||null;
    try{positions=JSON.parse(row.positions)||[];}catch(e){positions=[];}
    try{trades=JSON.parse(row.trades)||[];}catch(e){trades=[];}
    cash=row.cash!==null?parseFloat(row.cash):0;
    // Watchlist: charger depuis Supabase, sinon migrer depuis localStorage
    if(row.watchlist){
      try{
        const sbWl=JSON.parse(row.watchlist)||[];
        if(sbWl.length>0){
          watchlist=sbWl;
          localStorage.removeItem('nc_watchlist'); // migration done
        } else {
          // Supabase vide: migrer depuis localStorage si données existent
          loadWatchlist();
          if(watchlist.length>0)saveWatchlistToSupabase();
        }
      }catch(e){loadWatchlist();}
    } else {
      // Colonne pas encore existante ou null: migrer depuis localStorage
      loadWatchlist();
      if(watchlist.length>0)saveWatchlistToSupabase();
    }
    // Charger la devise primaire depuis Supabase (priorité sur localStorage)
    if(row.currency){accountCurrency=row.currency;localStorage.setItem('nc_currency',row.currency);const sel=document.getElementById('currency-select');if(sel)sel.value=row.currency;}
    // REER/CELI : charger depuis Supabase, sinon migrer depuis localStorage (une fois)
    let reerCeliNeedsSave=false;
    if(row.reer_limit!==null&&row.reer_limit!==undefined){
      reerLimit=parseFloat(row.reer_limit)||0;
    } else {
      const lsLimit=localStorage.getItem('nc_reer_limit');
      if(lsLimit){reerLimit=parseFloat(lsLimit)||0;reerCeliNeedsSave=true;}
    }
    if(row.celi_join_year!==null&&row.celi_join_year!==undefined){
      celiJoinYear=parseInt(row.celi_join_year)||2009;
    } else {
      const lsYear=localStorage.getItem('nc_celi_join_year');
      if(lsYear){celiJoinYear=parseInt(lsYear)||2009;reerCeliNeedsSave=true;}
    }
    if(reerCeliNeedsSave){
      localStorage.removeItem('nc_reer_limit');localStorage.removeItem('nc_celi_join_year');
      saveData();
    }
  }
}

// Sauvegarde watchlist seule (sans recharger tout saveData)
async function saveWatchlistToSupabase(){
  if(!currentUser||!accessToken)return;
  try{
    const nowIso=new Date().toISOString();
    const res=await fetch(`${SB_URL}/rest/v1/user_data?user_id=eq.${currentUser.id}`,{
      method:'PATCH',headers:{...sbHeaders(),'Prefer':'return=representation'},
      body:JSON.stringify({watchlist:JSON.stringify(watchlist),updated_at:nowIso})
    });
    const rows=res.ok?await res.json().catch(()=>[]):[];
    if(res.ok&&rows.length>0){
      lastKnownUpdatedAt=nowIso; // garder le verrou optimiste de saveData() synchronisé
      return;
    }
    // Bug corrigé 2026-08-03 : si la ligne user_data n'existe pas encore (ex. premier geste
    // de l'utilisateur après connexion est d'ajouter un ticker à la watchlist, avant tout
    // saveData()), le PATCH ci-dessus ne matche 0 ligne et échoue silencieusement — la
    // watchlist n'est alors jamais persistée côté serveur (perdue au prochain device/session).
    // Fallback : créer la ligne complète comme le fait saveData(), avec l'état en mémoire.
    await saveData();
  }catch(e){console.warn('[watchlist] Supabase save failed, keeping in localStorage',e);}
}

// ─── PORTFOLIO HISTORY ────────────────────────────────────────────

// ─── STRATÉGIES ─────────────────────────────────────────────────
async function loadStrategies(){
  if(!currentUser||!accessToken)return;
  try{
    const res=await fetch(`${SB_URL}/rest/v1/strategies?user_id=eq.${currentUser.id}&order=created_at.desc&select=*`,{headers:sbHeaders()});
    if(!res.ok){strategies=[];return;}
    strategies=await res.json()||[];
  }catch(e){strategies=[];}
}

async function saveStrategy(strat){
  if(!currentUser||!accessToken)return null;
  const now=new Date().toISOString();
  const payload={...strat,user_id:currentUser.id,updated_at:now};
  if(!strat.id)payload.created_at=now; // pour l'ORDER BY created_at
  try{
    let res;
    if(strat.id){
      res=await fetch(`${SB_URL}/rest/v1/strategies?id=eq.${strat.id}`,{method:'PATCH',headers:{...sbHeaders(),'Prefer':'return=representation'},body:JSON.stringify(payload)});
    }else{
      res=await fetch(`${SB_URL}/rest/v1/strategies`,{method:'POST',headers:{...sbHeaders(),'Prefer':'return=representation'},body:JSON.stringify(payload)});
    }
    if(!res.ok){
      const errText=await res.text();
      console.error('[strategy] Supabase error',res.status,errText);
      return null;
    }
    const data=await res.json();return data&&data[0]?data[0]:null;
  }catch(e){console.error('[strategy] save error:',e);return null;}
}

async function deleteStrategy(id){
  if(!currentUser||!accessToken)return false;
  try{
    await fetch(`${SB_URL}/rest/v1/strategies?id=eq.${id}`,{method:'DELETE',headers:sbHeaders()});
    strategies=strategies.filter(s=>s.id!==id);
    return true;
  }catch(e){return false;}
}

function renderStratPerf(){
  const body=document.getElementById('strat-perf-body');
  if(!body)return;

  const activeStrats=strategies.filter(s=>s.status==='Active'||s.status==='Brouillon');
  let totalAlloc=0,totalOpenPnl=0,totalRealPnl=0,totalPaliers=0,donePaliers=0;
  const typeData={DCA:{open:0,real:0,pos:0},Swing:{open:0,real:0,pos:0},Libre:{open:0,real:0,pos:0}};

  positions.forEach(p=>{
    const ls=strategies.find(s=>s.symbol===p.symbol&&(s.status==='Active'||s.status==='Brouillon'));
    const type=ls?.type||null;
    const pnlCAD=(toUSD((p.shares||0)*p.current,getPosCurrency(p))-toUSD(p.totalSize||0,getPosCurrency(p)))*fxRate;
    totalOpenPnl+=pnlCAD;
    if(type&&typeData[type]){typeData[type].open+=pnlCAD;typeData[type].pos++;}
  });
  trades.filter(t=>t.type==='Vente').forEach(t=>{
    const ls=strategies.find(s=>s.symbol===t.symbol);
    const type=ls?.type||null;
    const realCAD=(t.profitUSD||0)*fxRate;
    totalRealPnl+=realCAD;
    if(type&&typeData[type])typeData[type].real+=realCAD;
  });
  strategies.forEach(s=>{
    const ep=s.entries_plan||[],xp=s.exits_plan||[];
    totalPaliers+=ep.length+xp.length;
    donePaliers+=ep.filter(e=>e.executed).length+xp.filter(e=>e.executed).length;
    const amtCurS=s.amount_currency||getStratCurrency(s);totalAlloc+=ep.filter(e=>!e.executed).reduce((sum,e)=>sum+toUSD(parseFloat(e.amount)||0,amtCurS)*fxRate,0);
  });

  const pct=totalPaliers>0?Math.round(donePaliers/totalPaliers*100):0;
  const clr=v=>v>=0?'var(--green)':'var(--red)';
  const fmt=v=>(v>=0?'+':'')+fmtAmtRound(v);

  const typeChips=Object.entries(typeData).filter(([k,v])=>v.pos>0||v.real!==0).map(([k,v])=>{
    const total=v.open+v.real;
    return`<span style="display:inline-flex;align-items:center;gap:6px;padding:4px 10px;background:var(--bg3);border-radius:20px;font-size:10px;">
      <span style="font-weight:600;color:var(--text2);">${k}</span>
      ${v.pos>0?`<span style="color:var(--text3);">${v.pos} pos</span>`:''}
      <span style="font-family:var(--mono);color:${clr(total)};">${fmt(total)}</span>
    </span>`;
  }).join('');

  if(!activeStrats.length&&!totalPaliers){body.innerHTML='';return;}

  body.innerHTML=`<div style="padding:2px 0 16px;">
    <div style="display:flex;align-items:center;gap:28px;flex-wrap:wrap;margin-bottom:${typeChips||totalPaliers?'12px':'0'};">
      <span style="font-size:11px;color:var(--text3);">${activeStrats.length} stratégie${activeStrats.length!==1?'s':''} active${activeStrats.length!==1?'s':''}</span>
      <span style="display:flex;flex-direction:column;gap:2px;"><span style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.5px;">Non déployé</span><span style="font-family:var(--mono);font-weight:700;font-size:17px;letter-spacing:-0.3px;">${fmtAmtRound(totalAlloc)}</span></span>
      <span style="display:flex;flex-direction:column;gap:2px;"><span style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.5px;">P&L ouvert</span><span style="font-family:var(--mono);font-weight:700;font-size:17px;letter-spacing:-0.3px;color:${clr(totalOpenPnl)};">${fmt(totalOpenPnl)}</span></span>
      <span style="display:flex;flex-direction:column;gap:2px;"><span style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.5px;">Réalisé</span><span style="font-family:var(--mono);font-weight:700;font-size:17px;letter-spacing:-0.3px;color:${clr(totalRealPnl)};">${fmt(totalRealPnl)}</span></span>
    </div>
    ${typeChips?`<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;">${typeChips}</div>`:''}
    ${totalPaliers>0?`<div style="display:flex;align-items:center;gap:10px;">
      <span style="font-size:10px;color:var(--text3);white-space:nowrap;">${donePaliers}/${totalPaliers} paliers exécutés</span>
      <div style="flex:1;height:4px;background:var(--bg3);border-radius:4px;overflow:hidden;">
        <div style="width:${Math.max(2,pct)}%;height:100%;background:var(--green);border-radius:4px;transition:width 0.3s;"></div>
      </div>
      <span style="font-size:10px;color:var(--text3);font-family:var(--mono);">${pct}%</span>
    </div>`:''}
  </div>`;
}

function renderStrategies(){
  const body=document.getElementById('strat-body');if(!body)return;
  const empty=document.getElementById('strat-empty');
  const wrap=document.getElementById('strat-table-wrap');
  const lbl=document.getElementById('strat-count-label');
  const fStatus=document.getElementById('strat-filter-status').value;
  const fType=document.getElementById('strat-filter-type').value;
  let list=strategies.slice();
  if(fStatus)list=list.filter(s=>s.status===fStatus);
  if(fType)list=list.filter(s=>s.type===fType);
  if(lbl)lbl.textContent=`${list.length} ${list.length===1?'stratégie':'stratégies'}`;
  if(!list.length){empty.style.display='block';wrap.style.display='none';body.innerHTML='';updateStratBadge();return;}
  empty.style.display='none';wrap.style.display='block';
  body.innerHTML=list.map(s=>stratRow(s)).join('');
  updateStratBadge();
}

function stratRow(s){
  const ep=s.entries_plan||[],xp=s.exits_plan||[];
  const epDone=ep.filter(e=>e.executed).length,xpDone=xp.filter(e=>e.executed).length;
  const amtCur=s.amount_currency||getStratCurrency(s);
  const cashAlloc=ep.filter(e=>!e.executed).reduce((sum,e)=>sum+(parseFloat(e.amount)||0),0);
  // Profit potentiel : N/A si sorties partielles ou aucune sortie
  const totalEntryShares=ep.reduce((sum,e)=>sum+(parseFloat(e.shares)||0),0);
  const totalExitShares=xp.reduce((sum,e)=>sum+(parseFloat(e.shares)||0),0);
  const totalEntryInPrice=ep.reduce((sum,e)=>sum+((parseFloat(e.shares)||0)*(parseFloat(e.price)||0)),0);
  const totalExitInPrice=xp.reduce((sum,e)=>sum+((parseFloat(e.shares)||0)*(parseFloat(e.price)||0)),0);
  const isPartialExit=!xp.length||totalExitShares<totalEntryShares*0.99;
  const profitPot=isPartialExit?null:(totalExitInPrice-totalEntryInPrice);
  const profitCls=profitPot===null?'':(profitPot>=0?'pos':'neg');
  const statusColors={'Brouillon':'var(--text3)','Active':'var(--green)','Complétée':'var(--blue)','Archivée':'var(--text3)'};
  // Détecter paliers atteints non confirmés
  const pos=positions.find(p=>p.symbol===s.symbol);
  const cur=pos?pos.current:null;
  let triggers=0;
  if(cur){
    ep.forEach(e=>{if(!e.executed&&parseFloat(e.price)>=cur)triggers++;});
    xp.forEach(e=>{if(!e.executed&&parseFloat(e.price)<=cur)triggers++;});
  }
  const triggerBadge=triggers>0?`<span style="display:inline-block;background:var(--red);color:#fff;font-size:9px;font-weight:700;padding:2px 6px;border-radius:10px;margin-left:6px;">${triggers} alertes</span>`:'';
  return `<tr onclick="openStratDetails('${s.id}')" style="cursor:pointer;">
    <td><strong>${s.symbol}</strong>${triggerBadge}</td>
    <td><span style="font-size:10px;background:var(--bg3);padding:2px 8px;border-radius:10px;">${s.type||'—'}</span></td>
    <td><span style="font-size:10px;color:${statusColors[s.status]||'var(--text3)'};font-weight:600;">${s.status}</span></td>
    <td style="color:var(--text3);">${s.account||'—'}</td>
    <td style="color:var(--text3);">${epDone}/${ep.length}</td>
    <td style="color:var(--text3);">${xpDone}/${xp.length}</td>
    <td>${fmtC(cashAlloc,amtCur)}</td>
    <td class="${profitCls}" style="${profitPot===null?'color:var(--text3);font-size:11px;':''}">${profitPot===null?'N/A':((profitPot>=0?'+':'')+fmtC(profitPot,getStratCurrency(s)))}</td>
    <td onclick="event.stopPropagation();">
      <button onclick="openStratDetails('${s.id}')" title="Détails" style="background:transparent;border:0.5px solid var(--border2);color:var(--text2);padding:5px 9px;border-radius:5px;cursor:pointer;font-size:12px;margin-right:4px;">&#9679;</button>
      <button onclick="editStrategy('${s.id}')" title="Modifier" style="background:transparent;border:0.5px solid var(--border2);color:var(--text2);padding:5px 9px;border-radius:5px;cursor:pointer;font-size:12px;margin-right:4px;">Modifier</button>
      <button onclick="confirmDeleteStrategy('${s.id}')" title="Supprimer" style="background:transparent;border:0.5px solid var(--border2);color:var(--text2);padding:5px 9px;border-radius:5px;cursor:pointer;font-size:12px;">Suppr.</button>
    </td>
  </tr>`;
}

function updateStratBadge(){
  const badge=document.getElementById('strat-badge');if(!badge)return;
  let totalTriggers=0;
  strategies.forEach(s=>{
    if(s.status!=='Active')return;
    const pos=positions.find(p=>p.symbol===s.symbol);
    if(!pos||!pos.current)return;
    (s.entries_plan||[]).forEach(e=>{if(!e.executed&&parseFloat(e.price)>=pos.current)totalTriggers++;});
    (s.exits_plan||[]).forEach(e=>{if(!e.executed&&parseFloat(e.price)<=pos.current)totalTriggers++;});
  });
  badge.style.display=totalTriggers>0?'block':'none';
}

async function confirmDeleteStrategy(id){
  if(!confirm('Supprimer cette stratégie ? Les positions liées ne seront pas affectées.'))return;
  await deleteStrategy(id);
  renderStrategies();
}

// ─── MODAL CRÉATION STRATÉGIE ──────────────────────────────────
let stratDraft={id:null,type:null,symbol:'',currency:'USD',amount_currency:'USD',account:'',ath:null,ath_source:'auto',entries_plan:[],exits_plan:[],status:'Active',notes:''};
let stratCurrentStep=1;

function openStratModal(existing){
  // Reset draft
  stratDraft={id:null,type:null,symbol:'',currency:'USD',amount_currency:accountCurrency||'USD',account:'',ath:null,ath_source:'auto',entries_plan:[],exits_plan:[],status:'Active',notes:''};
  if(existing){
    stratDraft={...existing,entries_plan:JSON.parse(JSON.stringify(existing.entries_plan||[])),exits_plan:JSON.parse(JSON.stringify(existing.exits_plan||[]))};
  }
  stratCurrentStep=1;
  document.getElementById('strat-modal-title').textContent=existing?'Modifier la stratégie':'Nouvelle stratégie';
  // Pré-remplir si édition
  document.getElementById('strat-symbol').value=stratDraft.symbol||'';
  document.getElementById('strat-currency').value=stratDraft.currency||'USD';
  document.getElementById('strat-account').value=stratDraft.account||'';
  document.getElementById('strat-ath').value=stratDraft.ath||'';
  document.getElementById('strat-ath-source').value=stratDraft.ath_source||'auto';
  document.getElementById('strat-notes').value=stratDraft.notes||'';
  document.getElementById('strat-status').value=stratDraft.status||'Active';
  // Pré-remplir la devise du montant (par défaut = devise du compte de l'app)
  const amtSel=document.getElementById('strat-amount-currency');
  if(amtSel)amtSel.value=stratDraft.amount_currency||accountCurrency||'USD';
  // Pré-cacher les taux de change
  const cursToCache=[stratDraft.currency,stratDraft.amount_currency].filter(c=>c&&c!=='USD');
  if(cursToCache.length)fetchAndCacheFxRates(cursToCache).then(()=>updateFxHint());
  // Sélectionner le type si édition
  document.querySelectorAll('.strat-type-card').forEach(c=>c.classList.remove('selected'));
  if(stratDraft.type){const card=document.querySelector(`.strat-type-card[data-type="${stratDraft.type}"]`);if(card)card.classList.add('selected');}
  renderEntryLevels();renderExitLevels();
  showStratStep(1);
  document.getElementById('strat-modal-overlay').classList.add('open');
}

function closeStratModal(){
  document.getElementById('strat-modal-overlay').classList.remove('open');
}

function selectStratType(type){
  stratDraft.type=type;
  document.querySelectorAll('.strat-type-card').forEach(c=>c.classList.remove('selected'));
  document.querySelector(`.strat-type-card[data-type="${type}"]`).classList.add('selected');
}

function showStratStep(n){
  stratCurrentStep=n;
  for(let i=1;i<=5;i++){
    document.getElementById(`strat-pane-${i}`).style.display=(i===n)?'block':'none';
    const stepEl=document.querySelector(`.strat-step[data-step="${i}"]`);
    if(stepEl){
      stepEl.classList.remove('active','done');
      if(i===n)stepEl.classList.add('active');
      else if(i<n)stepEl.classList.add('done');
    }
  }
  document.getElementById('strat-prev-btn').style.display=(n>1)?'inline-block':'none';
  document.getElementById('strat-next-btn').style.display=(n<5)?'inline-block':'none';
  document.getElementById('strat-save-btn').style.display=(n===5)?'inline-block':'none';
  if(n===5)renderStratSummary();
}

function stratStep(delta){
  // Validation par étape
  if(delta>0){
    if(stratCurrentStep===1&&!stratDraft.type){alert('Choisis un type de stratégie');return;}
    if(stratCurrentStep===2){
      const sym=document.getElementById('strat-symbol').value.trim();
      if(!sym){alert('Entre un symbole');return;}
      stratDraft.symbol=sym.toUpperCase();
      stratDraft.currency=document.getElementById('strat-currency').value;
      stratDraft.account=document.getElementById('strat-account').value;
      const athVal=parseFloat(document.getElementById('strat-ath').value);
      stratDraft.ath=isNaN(athVal)?null:athVal;
      stratDraft.ath_source=document.getElementById('strat-ath-source').value;
      // Auto-fetch ATH si vide et source=auto
      if(!stratDraft.ath&&stratDraft.ath_source==='auto')fetchATHForStrat();
    }
    if(stratCurrentStep===3){
      collectEntryLevels();
      if(!stratDraft.entries_plan.length){alert('Ajoute au moins un palier d\'entrée');return;}
    }
    if(stratCurrentStep===4){
      collectExitLevels();
    }
  }
  if(stratCurrentStep===2&&delta<0)collectEntryLevels();
  if(stratCurrentStep===3)collectEntryLevels();
  if(stratCurrentStep===4)collectExitLevels();
  showStratStep(stratCurrentStep+delta);
}

// Auto-complete pour le symbole (réutilise SYMBOLS)
function onStratSymbolInput(val){
  const dropdown=document.getElementById('strat-symbol-dropdown');
  if(!val||val.length<1){dropdown.style.display='none';return;}
  const v=val.toUpperCase();
  const matches=SYMBOLS.filter(s=>s.s.includes(v)||s.n.toUpperCase().includes(v)).slice(0,8);
  if(!matches.length){dropdown.style.display='none';return;}
  dropdown.innerHTML=matches.map(m=>`<div class="autocomplete-item" onclick="pickStratSymbol('${m.s}','${m.cur}')"><strong>${m.s}</strong> <span style="color:var(--text3);font-size:10px;">${m.n}</span></div>`).join('');
  dropdown.style.display='block';
}

function pickStratSymbol(sym,cur){
  document.getElementById('strat-symbol').value=sym;
  document.getElementById('strat-currency').value=cur||'USD';
  document.getElementById('strat-symbol-dropdown').style.display='none';
}

async function fetchATHForStrat(){
  const sym=document.getElementById('strat-symbol').value.trim().toUpperCase();
  if(!sym)return;
  const ticker=getTicker(sym);
  const hintEl=document.getElementById('strat-ath-hint');
  hintEl.textContent='Récupération de l\'ATH…';
  try{
    const res=await fetch(`/api/ath?symbol=${encodeURIComponent(ticker)}`);
    if(!res.ok)throw new Error(`HTTP ${res.status}`);
    const data=await res.json();
    if(data.ath&&data.ath>0){
      document.getElementById('strat-ath').value=data.ath.toFixed(2);
      stratDraft.ath=data.ath;
      hintEl.textContent=`OK ATH récupéré : ${data.ath.toFixed(2)}${data.ath_date?' ('+data.ath_date+')':''}`;
    }else{
      hintEl.textContent='ATH introuvable, entre-le manuellement';
    }
  }catch(e){
    console.error('[ath] fetch error:',e);
    hintEl.textContent='Erreur lors du fetch, entre-le manuellement';
  }
}

// ─── PALIERS D'ENTRÉE ──────────────────────────────────────────
function addEntryLevel(){
  stratDraft.entries_plan=stratDraft.entries_plan||[];
  stratDraft.entries_plan.push({price:'',amount:'',shares:'',retracement_pct:'',executed:false});
  renderEntryLevels();
}

function removeEntryLevel(i){
  stratDraft.entries_plan.splice(i,1);
  renderEntryLevels();
}

function renderEntryLevels(){
  const list=document.getElementById('strat-entries-list');
  if(!list)return;
  if(!stratDraft.entries_plan.length){
    list.innerHTML='<div style="text-align:center;padding:20px;color:var(--text3);font-size:11px;">Aucun palier. Ajoute-en un ci-dessus.</div>';
    updateEntriesTotal();return;
  }
  list.innerHTML=stratDraft.entries_plan.map((e,i)=>{
    const exDot=e.executed?'<span style="color:var(--green);font-size:10px;">OK Exécuté</span>':'';
    return `<div class="strat-level-row">
      <div class="strat-level-num">${i+1}</div>
      <div class="field"><label>Prix cible</label><input type="number" step="any" value="${e.price||''}" oninput="updateEntryLevel(${i},'price',this.value)" placeholder="0.00" /></div>
      <div class="field"><label>Retrac. %</label><input type="number" step="any" value="${e.retracement_pct||''}" oninput="updateEntryLevel(${i},'retracement_pct',this.value)" placeholder="-25" /></div>
      <div class="field"><label>Montant</label><input type="number" step="any" value="${e.amount||''}" oninput="updateEntryLevel(${i},'amount',this.value)" placeholder="500" /></div>
      <div class="field"><label>Shares</label><input type="number" step="any" value="${e.shares||''}" oninput="updateEntryLevel(${i},'shares',this.value)" placeholder="auto" /></div>
      <button class="strat-level-del" onclick="removeEntryLevel(${i})">×</button>
    </div>${exDot?`<div style="margin-bottom:8px;padding-left:48px;">${exDot}</div>`:''}`;
  }).join('');
  updateEntriesTotal();
}

// Retourne le taux pour convertir 1 unité de la devise du montant vers la devise du prix
// Ex: amountCur=CAD, priceCur=USD → renvoie le facteur (CAD * facteur = USD)
function getAmountToPriceRate(){
  const amtCur=stratDraft.amount_currency||getStratCurrency(stratDraft);
  const priceCur=getStratCurrency(stratDraft);
  if(amtCur===priceCur)return 1;
  // Convertir via USD : amtCur → USD → priceCur
  const amtToUSD=amtCur==='USD'?1:(liveFxRates[amtCur]||(1/(FX_FALLBACK[amtCur]||1)));
  const usdToPrice=priceCur==='USD'?1:(FX_FALLBACK[priceCur]||1)/(liveFxRates[priceCur]?1/liveFxRates[priceCur]:1);
  // Plus simple : amount(amtCur) * amtToUSD = USD ; USD * (rate priceCur per USD) = priceCur
  const usdPerPrice=priceCur==='USD'?1:(liveFxRates[priceCur]?(1/liveFxRates[priceCur]):(FX_FALLBACK[priceCur]||1));
  return amtToUSD*usdPerPrice;
}

function updateEntryLevel(i,field,val){
  const e=stratDraft.entries_plan[i];if(!e)return;
  e[field]=val;
  // Auto-calcul retracement_pct → price (prix toujours en devise du sous-jacent)
  if(field==='retracement_pct'&&stratDraft.ath){
    const pct=parseFloat(val);
    if(!isNaN(pct)){
      const newPrice=stratDraft.ath*(1+pct/100);
      e.price=newPrice.toFixed(4);
      const row=document.querySelectorAll('#strat-entries-list .strat-level-row')[i];
      if(row){const inp=row.querySelectorAll('input')[0];if(inp)inp.value=e.price;}
    }
  }
  if(field==='price'&&stratDraft.ath){
    const pr=parseFloat(val);
    if(!isNaN(pr)&&pr>0){
      const pct=((pr-stratDraft.ath)/stratDraft.ath*100).toFixed(2);
      e.retracement_pct=pct;
      const row=document.querySelectorAll('#strat-entries-list .strat-level-row')[i];
      if(row){const inp=row.querySelectorAll('input')[1];if(inp)inp.value=pct;}
    }
  }
  // Auto-calcul amount ↔ shares (avec conversion de devise)
  // amount est dans amount_currency, price est dans currency
  // shares = amount_in_priceCurrency / price = (amount * fx) / price
  const fx=getAmountToPriceRate();
  if(field==='amount'){
    const am=parseFloat(val),pr=parseFloat(e.price);
    if(!isNaN(am)&&!isNaN(pr)&&pr>0){
      e.shares=((am*fx)/pr).toFixed(6);
      const row=document.querySelectorAll('#strat-entries-list .strat-level-row')[i];
      if(row){const inp=row.querySelectorAll('input')[3];if(inp)inp.value=e.shares;}
    }
  }
  if(field==='shares'){
    const sh=parseFloat(val),pr=parseFloat(e.price);
    if(!isNaN(sh)&&!isNaN(pr)&&pr>0&&fx>0){
      e.amount=((sh*pr)/fx).toFixed(2);
      const row=document.querySelectorAll('#strat-entries-list .strat-level-row')[i];
      if(row){const inp=row.querySelectorAll('input')[2];if(inp)inp.value=e.amount;}
    }
  }
  updateEntriesTotal();
}

async function onAmountCurrencyChange(){
  const sel=document.getElementById('strat-amount-currency');
  if(!sel)return;
  stratDraft.amount_currency=sel.value;
  // S'assurer que le taux est en cache
  if(sel.value!=='USD'&&!liveFxRates[sel.value])await fetchAndCacheFxRates([sel.value]);
  if(stratDraft.currency&&stratDraft.currency!=='USD'&&!liveFxRates[stratDraft.currency])await fetchAndCacheFxRates([stratDraft.currency]);
  updateFxHint();
  // Recalculer toutes les lignes (re-render pour réafficher avec nouvelle devise)
  renderEntryLevels();
  renderExitLevels();
}

function updateFxHint(){
  const el=document.getElementById('strat-fx-hint');if(!el)return;
  const amtCur=stratDraft.amount_currency||getStratCurrency(stratDraft);
  const priceCur=getStratCurrency(stratDraft);
  if(amtCur===priceCur){el.textContent='';return;}
  const fx=getAmountToPriceRate();
  el.textContent=`Conversion live : 1 ${amtCur} = ${fx.toFixed(4)} ${priceCur} · les montants sont saisis en ${amtCur} et convertis automatiquement.`;
}

function collectEntryLevels(){
  // Pas besoin — déjà mis à jour à chaque oninput
}

function updateEntriesTotal(){
  const total=stratDraft.entries_plan.reduce((s,e)=>s+(parseFloat(e.amount)||0),0);
  const el=document.getElementById('strat-entries-total');
  if(el)el.textContent=fmtC(total,getStratCurrency(stratDraft));
}

// ─── PALIERS DE SORTIE ─────────────────────────────────────────
function addExitLevel(){
  stratDraft.exits_plan=stratDraft.exits_plan||[];
  stratDraft.exits_plan.push({price:'',amount:'',shares:'',profit_pct:'',executed:false});
  renderExitLevels();
}

function removeExitLevel(i){
  stratDraft.exits_plan.splice(i,1);
  renderExitLevels();
}

function renderExitLevels(){
  const list=document.getElementById('strat-exits-list');
  if(!list)return;
  if(!stratDraft.exits_plan.length){
    list.innerHTML='<div style="text-align:center;padding:20px;color:var(--text3);font-size:11px;">Aucun palier de sortie. Ajoute-en un ci-dessus.</div>';
    updateExitsTotal();return;
  }
  list.innerHTML=stratDraft.exits_plan.map((e,i)=>{
    const exDot=e.executed?'<span style="color:var(--green);font-size:10px;">OK Exécuté</span>':'';
    return `<div class="strat-level-row">
      <div class="strat-level-num">${i+1}</div>
      <div class="field"><label>Prix sortie</label><input type="number" step="any" value="${e.price||''}" oninput="updateExitLevel(${i},'price',this.value)" placeholder="0.00" /></div>
      <div class="field"><label>Profit %</label><input type="number" step="any" value="${e.profit_pct||''}" oninput="updateExitLevel(${i},'profit_pct',this.value)" placeholder="50" /></div>
      <div class="field"><label>Montant</label><input type="number" step="any" value="${e.amount||''}" oninput="updateExitLevel(${i},'amount',this.value)" placeholder="auto" /></div>
      <div class="field"><label>Shares</label><input type="number" step="any" value="${e.shares||''}" oninput="updateExitLevel(${i},'shares',this.value)" placeholder="auto" /></div>
      <button class="strat-level-del" onclick="removeExitLevel(${i})">×</button>
    </div>${exDot?`<div style="margin-bottom:8px;padding-left:48px;">${exDot}</div>`:''}`;
  }).join('');
  updateExitsTotal();
}

// Retourne le prix moyen de référence pour calculer le profit % d'une sortie.
// Priorité : (1) prix moyen live de la position existante, (2) prix moyen théorique des paliers DCA prévus
function getReferenceEntryPrice(){
  const pos=positions.find(p=>p.symbol===stratDraft.symbol);
  if(pos&&pos.avgEntry&&pos.shares>0)return pos.avgEntry;
  // Fallback : moyenne pondérée des paliers DCA prévus (en devise du prix)
  const totalShares=stratDraft.entries_plan.reduce((s,en)=>s+(parseFloat(en.shares)||0),0);
  const totalCostInPriceCur=stratDraft.entries_plan.reduce((s,en)=>s+((parseFloat(en.shares)||0)*(parseFloat(en.price)||0)),0);
  return totalShares>0?totalCostInPriceCur/totalShares:0;
}

function updateExitLevel(i,field,val){
  const e=stratDraft.exits_plan[i];if(!e)return;
  e[field]=val;
  const refPrice=getReferenceEntryPrice();
  if(field==='profit_pct'&&refPrice>0){
    const pct=parseFloat(val);
    if(!isNaN(pct)){
      e.price=(refPrice*(1+pct/100)).toFixed(4);
      const row=document.querySelectorAll('#strat-exits-list .strat-level-row')[i];
      if(row){const inp=row.querySelectorAll('input')[0];if(inp)inp.value=e.price;}
    }
  }
  if(field==='price'&&refPrice>0){
    const pr=parseFloat(val);
    if(!isNaN(pr)&&pr>0){
      e.profit_pct=((pr-refPrice)/refPrice*100).toFixed(2);
      const row=document.querySelectorAll('#strat-exits-list .strat-level-row')[i];
      if(row){const inp=row.querySelectorAll('input')[1];if(inp)inp.value=e.profit_pct;}
    }
  }
  // amount ↔ shares avec conversion de devise (montants en amount_currency, prix en currency)
  const fx=getAmountToPriceRate();
  if(field==='amount'){
    const am=parseFloat(val),pr=parseFloat(e.price);
    if(!isNaN(am)&&!isNaN(pr)&&pr>0){
      e.shares=((am*fx)/pr).toFixed(6);
      const row=document.querySelectorAll('#strat-exits-list .strat-level-row')[i];
      if(row){const inp=row.querySelectorAll('input')[3];if(inp)inp.value=e.shares;}
    }
  }
  if(field==='shares'){
    const sh=parseFloat(val),pr=parseFloat(e.price);
    if(!isNaN(sh)&&!isNaN(pr)&&pr>0&&fx>0){
      e.amount=((sh*pr)/fx).toFixed(2);
      const row=document.querySelectorAll('#strat-exits-list .strat-level-row')[i];
      if(row){const inp=row.querySelectorAll('input')[2];if(inp)inp.value=e.amount;}
    }
  }
  updateExitsTotal();
}

function collectExitLevels(){
  // déjà mis à jour à chaque oninput
}

function updateExitsTotal(){
  const totalEntryShares=stratDraft.entries_plan.reduce((s,e)=>s+(parseFloat(e.shares)||0),0);
  const totalExitShares=stratDraft.exits_plan.reduce((s,e)=>s+(parseFloat(e.shares)||0),0);
  const el=document.getElementById('strat-profit-total');
  if(!el)return;
  // Si pas de sorties OU si les sorties ne couvrent pas l'entièreté des entrées → N/A (prise de profit partielle)
  if(!stratDraft.exits_plan.length||totalExitShares<totalEntryShares*0.99){
    el.textContent='N/A — prise de profit partielle';
    el.style.color='var(--text3)';
    return;
  }
  // Sinon : profit en devise du prix (currency)
  const totalEntryInPrice=stratDraft.entries_plan.reduce((s,e)=>s+((parseFloat(e.shares)||0)*(parseFloat(e.price)||0)),0);
  const totalExitInPrice=stratDraft.exits_plan.reduce((s,e)=>s+((parseFloat(e.shares)||0)*(parseFloat(e.price)||0)),0);
  const profit=totalExitInPrice-totalEntryInPrice;
  const profitPct=totalEntryInPrice>0?((profit/totalEntryInPrice)*100):0;
  const cur=getStratCurrency(stratDraft);
  el.textContent=`${profit>=0?'+':''}${fmtC(profit,cur)} (${profit>=0?'+':''}${profitPct.toFixed(1)}%)`;
  el.style.color=profit>=0?'var(--green)':'var(--red)';
}

function renderStratSummary(){
  stratDraft.notes=document.getElementById('strat-notes').value;
  stratDraft.status=document.getElementById('strat-status').value;
  const cur=getStratCurrency(stratDraft);
  const amtCur=stratDraft.amount_currency||cur;
  const totalEntryAmt=stratDraft.entries_plan.reduce((s,e)=>s+(parseFloat(e.amount)||0),0);
  const totalEntryShares=stratDraft.entries_plan.reduce((s,e)=>s+(parseFloat(e.shares)||0),0);
  const totalExitShares=stratDraft.exits_plan.reduce((s,e)=>s+(parseFloat(e.shares)||0),0);
  const totalEntryInPrice=stratDraft.entries_plan.reduce((s,e)=>s+((parseFloat(e.shares)||0)*(parseFloat(e.price)||0)),0);
  const totalExitInPrice=stratDraft.exits_plan.reduce((s,e)=>s+((parseFloat(e.shares)||0)*(parseFloat(e.price)||0)),0);
  // Profit potentiel : N/A si sorties partielles
  let profitHtml;
  if(!stratDraft.exits_plan.length||totalExitShares<totalEntryShares*0.99){
    profitHtml=`<strong style="color:var(--text3);">N/A — prise de profit partielle</strong>`;
  }else{
    const profit=totalExitInPrice-totalEntryInPrice;
    const profitPct=totalEntryInPrice>0?(profit/totalEntryInPrice)*100:0;
    profitHtml=`<strong style="color:${profit>=0?'var(--green)':'var(--red)'};">${profit>=0?'+':''}${fmtC(profit,cur)} (${profit>=0?'+':''}${profitPct.toFixed(1)}%)</strong>`;
  }
  document.getElementById('strat-summary').innerHTML=`
    <div><span style="color:var(--text3);">Type :</span> <strong>${stratDraft.type}</strong></div>
    <div><span style="color:var(--text3);">Symbole :</span> <strong>${stratDraft.symbol}</strong> ${stratDraft.account?`<span style="color:var(--text3);">/ ${stratDraft.account}</span>`:''}</div>
    <div><span style="color:var(--text3);">ATH :</span> ${stratDraft.ath?fmtC(stratDraft.ath,cur):'—'} <span style="color:var(--text3);">(${stratDraft.ath_source})</span></div>
    <div><span style="color:var(--text3);">Paliers entrée :</span> ${stratDraft.entries_plan.length} → <strong>${fmtC(totalEntryAmt,amtCur)}</strong> ${amtCur!==cur?`<span style="color:var(--text3);">(≈ ${fmtC(totalEntryInPrice,cur)})</span>`:''}</div>
    <div><span style="color:var(--text3);">Paliers sortie :</span> ${stratDraft.exits_plan.length} ${stratDraft.exits_plan.length?`→ <strong>${fmtC(totalExitInPrice,cur)}</strong>`:''}</div>
    <div><span style="color:var(--text3);">Profit potentiel :</span> ${profitHtml}</div>
  `;
}

async function saveStratFromModal(){
  stratDraft.notes=document.getElementById('strat-notes').value;
  stratDraft.status=document.getElementById('strat-status').value;
  // Nettoyer les valeurs
  stratDraft.entries_plan=stratDraft.entries_plan.filter(e=>parseFloat(e.price)>0).map(e=>({
    price:parseFloat(e.price)||0,
    amount:parseFloat(e.amount)||0,
    shares:parseFloat(e.shares)||0,
    retracement_pct:parseFloat(e.retracement_pct)||0,
    executed:!!e.executed,
    executed_at:e.executed_at||null
  }));
  stratDraft.exits_plan=stratDraft.exits_plan.filter(e=>parseFloat(e.price)>0).map(e=>({
    price:parseFloat(e.price)||0,
    amount:parseFloat(e.amount)||0,
    shares:parseFloat(e.shares)||0,
    profit_pct:parseFloat(e.profit_pct)||0,
    executed:!!e.executed,
    executed_at:e.executed_at||null
  }));
  // Préparer payload pour Supabase
  const payload={
    name:`${stratDraft.type} ${stratDraft.symbol}`,
    type:stratDraft.type,
    symbol:stratDraft.symbol,
    currency:stratDraft.currency,
    amount_currency:stratDraft.amount_currency||stratDraft.currency,
    account:stratDraft.account||null,
    status:stratDraft.status,
    ath:stratDraft.ath,
    ath_source:stratDraft.ath_source,
    entries_plan:stratDraft.entries_plan,
    exits_plan:stratDraft.exits_plan,
    notes:stratDraft.notes||null
  };
  if(stratDraft.id)payload.id=stratDraft.id;
  const saved=await saveStrategy(payload);
  if(saved){
    if(stratDraft.id){
      const idx=strategies.findIndex(s=>s.id===stratDraft.id);
      if(idx>=0)strategies[idx]=saved;
    }else{
      strategies.unshift(saved);
    }
    closeStratModal();
    renderStrategies();
  }else{
    alert('Erreur lors de la sauvegarde. Vérifie la console.');
  }
}

function editStrategy(id){
  const s=strategies.find(st=>st.id===id);
  if(!s){alert('Stratégie introuvable');return;}
  openStratModal(s);
}

let currentStratDetailsId=null;

function openStratDetails(id){
  currentStratDetailsId=id;
  renderStratDetails(id);
  document.getElementById('strat-details-overlay').classList.add('open');
}

function closeStratDetails(){
  document.getElementById('strat-details-overlay').classList.remove('open');
  currentStratDetailsId=null;
}

function renderStratDetails(id){
  const s=strategies.find(s=>s.id===id);
  if(!s)return;
  const el=document.getElementById('strat-details-content');
  if(!el)return;
  const ep=s.entries_plan||[],xp=s.exits_plan||[];
  const amtCur=s.amount_currency||getStratCurrency(s);
  const priceCur=getStratCurrency(s);
  const pos=positions.find(p=>p.symbol===s.symbol);
  const livePrice=pos?pos.current:null;
  const statusColors={'Brouillon':'var(--text3)','Active':'var(--green)','Complétée':'var(--blue)','Archivée':'var(--text3)'};

  // Stats calculées depuis les paliers exécutés
  const execEntries=ep.filter(e=>e.executed);
  const totalShares=execEntries.reduce((s,e)=>s+(parseFloat(e.shares)||0),0);
  const totalCost=execEntries.reduce((s,e)=>s+(parseFloat(e.shares)||0)*(parseFloat(e.price)||0),0);
  const avgEntry=totalShares>0?totalCost/totalShares:null;
  const totalDeployedAmt=execEntries.reduce((s,e)=>s+(parseFloat(e.amount)||0),0);
  const livePnlPrice=(livePrice&&avgEntry)?(livePrice-avgEntry)*totalShares:null;
  const livePnlPct=(avgEntry&&livePnlPrice!==null&&totalCost>0)?(livePnlPrice/totalCost*100):null;

  const epDone=ep.filter(e=>e.executed).length,xpDone=xp.filter(e=>e.executed).length;
  const totalP=ep.length+xp.length,doneP=epDone+xpDone;

  const palierRow=(e,i,planType)=>{
    const price=parseFloat(e.price)||0,shares=parseFloat(e.shares)||0,amount=parseFloat(e.amount)||0;
    let badge='';
    if(livePrice&&price>0){
      const reached=planType==='entry'?livePrice<=price:livePrice>=price;
      if(reached&&!e.executed)badge=`<span style="background:rgba(255,183,52,0.15);color:#ffb547;font-size:9px;padding:1px 5px;border-radius:3px;margin-left:5px;">Atteint</span>`;
    }
    const chkClr=e.executed?'var(--green)':'var(--border2)';
    const rowBg=e.executed?'rgba(0,255,136,0.04)':'var(--bg3)';
    const rowBord=e.executed?'rgba(0,255,136,0.2)':'var(--border)';
    return`<div style="display:flex;align-items:center;gap:10px;padding:9px 12px;background:${rowBg};border:0.5px solid ${rowBord};border-radius:8px;margin-bottom:6px;cursor:pointer;transition:background 0.15s,border-color 0.15s;" onclick="togglePalierExecuted('${s.id}','${planType}',${i})">
      <div style="width:18px;height:18px;border-radius:4px;border:1.5px solid ${chkClr};background:${e.executed?'var(--green)':'transparent'};display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all 0.15s;">
        ${e.executed?'<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><polyline points="1.5,5.5 4,8 8.5,2" stroke="#000" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>':''}
      </div>
      <div style="flex:1;min-width:0;">
        <div style="display:flex;align-items:baseline;gap:4px;flex-wrap:wrap;">
          <span style="font-family:var(--mono);font-size:12px;font-weight:600;">${price>0?fmtPrice(price)+' '+priceCur:'—'}</span>${badge}
        </div>
        <div style="font-size:10px;color:var(--text3);margin-top:2px;">
          ${shares>0?shares.toLocaleString('fr-FR',{maximumFractionDigits:4})+' act.':''}${shares>0&&amount>0?' · ':''}${amount>0?fmtC(amount,amtCur):''}
        </div>
      </div>
      <span style="font-size:9px;color:${e.executed?'var(--green)':'var(--text3)'};white-space:nowrap;">${e.executed?'Exécuté':'En attente'}</span>
    </div>`;
  };

  const stats=[];
  if(avgEntry!==null)stats.push({label:'Prix moy. entrée',val:fmtPrice(avgEntry)+' '+priceCur,color:''});
  if(totalDeployedAmt>0)stats.push({label:'Capital déployé',val:fmtC(totalDeployedAmt,amtCur),color:''});
  if(livePnlPrice!==null){
    const pnlStr=(livePnlPrice>=0?'+':'')+fmtC(livePnlPrice,priceCur);
    const pctStr=livePnlPct!==null?` (${livePnlPct>=0?'+':''}${livePnlPct.toFixed(2)}%)`:'';
    stats.push({label:'P&L live',val:pnlStr+pctStr,color:livePnlPrice>=0?'var(--green)':'var(--red)'});
  }

  el.innerHTML=`
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:18px;">
      <div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:5px;flex-wrap:wrap;">
          <span style="font-size:20px;font-weight:700;">${s.symbol}</span>
          <span style="font-size:10px;background:var(--bg3);padding:3px 9px;border-radius:12px;color:var(--text2);">${s.type||'—'}</span>
          <span style="font-size:10px;font-weight:600;color:${statusColors[s.status]||'var(--text3)'};">${s.status}</span>
        </div>
        <div style="display:flex;align-items:center;gap:12px;font-size:11px;color:var(--text3);flex-wrap:wrap;">
          ${s.account?`<span>${s.account}</span>`:''}
          ${livePrice?`<span>Prix live : <span style="font-family:var(--mono);color:var(--text);">${fmtPrice(livePrice)} ${priceCur}</span></span>`:''}
          ${totalP>0?`<span>${doneP}/${totalP} paliers</span>`:''}
        </div>
      </div>
      <button onclick="closeStratDetails()" style="background:transparent;border:none;color:var(--text3);font-size:22px;cursor:pointer;padding:0;line-height:1;flex-shrink:0;">×</button>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">
      <div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <span style="font-size:11px;font-weight:600;">Paliers d'entrée</span>
          <span style="font-size:10px;color:var(--text3);">${epDone}/${ep.length}</span>
        </div>
        ${ep.length?ep.map((e,i)=>palierRow(e,i,'entry')).join(''):'<div style="font-size:10px;color:var(--text3);padding:8px 0;">Aucun palier défini</div>'}
      </div>
      <div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <span style="font-size:11px;font-weight:600;">Paliers de sortie</span>
          <span style="font-size:10px;color:var(--text3);">${xpDone}/${xp.length}</span>
        </div>
        ${xp.length?xp.map((e,i)=>palierRow(e,i,'exit')).join(''):'<div style="font-size:10px;color:var(--text3);padding:8px 0;">Aucun palier défini</div>'}
      </div>
    </div>

    ${stats.length?`<div style="border-top:0.5px solid var(--border);padding-top:14px;margin-bottom:16px;">
      <div style="font-size:9px;text-transform:uppercase;letter-spacing:0.8px;color:var(--text3);margin-bottom:10px;">Performance calculée</div>
      <div style="display:flex;flex-wrap:wrap;gap:20px;">
        ${stats.map(st=>`<div>
          <div style="font-size:9px;color:var(--text3);margin-bottom:3px;">${st.label}</div>
          <div style="font-size:14px;font-weight:700;font-family:var(--mono);color:${st.color||'var(--text)'};">${st.val}</div>
        </div>`).join('')}
      </div>
    </div>`:''}

    ${s.notes?`<div style="background:var(--bg3);border-radius:8px;padding:10px 12px;font-size:11px;color:var(--text2);margin-bottom:16px;line-height:1.6;">${s.notes}</div>`:''}

    <div style="display:flex;justify-content:flex-end;gap:8px;border-top:0.5px solid var(--border);padding-top:14px;">
      <button class="btn-ghost" onclick="closeStratDetails();setTimeout(()=>editStrategy('${s.id}'),80)" style="padding:8px 16px;">Modifier</button>
      <button class="btn-ghost" onclick="closeStratDetails()" style="padding:8px 16px;">Fermer</button>
    </div>`;
}

async function togglePalierExecuted(stratId,planType,idx){
  const s=strategies.find(s=>s.id===stratId);
  if(!s)return;
  const plan=planType==='entry'?s.entries_plan:s.exits_plan;
  if(!plan||!plan[idx])return;
  plan[idx].executed=!plan[idx].executed;
  const saved=await saveStrategy(s);
  if(!saved){plan[idx].executed=!plan[idx].executed;}// revert si échec
  renderStratDetails(stratId);
  renderStrategies();
  renderStratPerf();
}


async function loadPortfolioHistory(){
  if(!currentUser||!accessToken)return;
  try{
    const res=await fetch(`${SB_URL}/rest/v1/portfolio_history?user_id=eq.${currentUser.id}&order=date.asc&select=date,value,currency`,{headers:sbHeaders()});
    if(!res.ok)return;
    const data=await res.json();
    portfolioHistory=(data||[]).map(r=>{
      let val=parseFloat(r.value);
      // Migration : anciennes entrées sans currency sont en USD
      // On les convertit dans la devise du compte pour homogénéité
      const entryCur=r.currency||'USD';
      if(entryCur==='USD'&&accountCurrency!=='USD'&&fxRate&&fxRate!==1){
        val=parseFloat((val*fxRate).toFixed(2));
      }
      return{date:r.date,value:val,currency:entryCur};
    });
  }catch(e){portfolioHistory=[];}
}
async function saveSnapshot(valueCAD){
  if(!currentUser||!accessToken)return;
  const valueInCurrency=parseFloat(valueCAD.toFixed(2)); // déjà en devise du compte
  const today=new Date().toISOString().split('T')[0];
  try{
    // INSERT uniquement si pas de ligne existante (ignore-duplicates préserve le cron 22h)
    // → 1 seul appel Supabase au lieu de SELECT+PATCH
    const r=await fetch(`${SB_URL}/rest/v1/portfolio_history`,{method:'POST',headers:{...sbHeaders(),'Prefer':'resolution=ignore-duplicates,return=minimal'},body:JSON.stringify({user_id:currentUser.id,date:today,value:valueInCurrency,currency:accountCurrency,updated_at:new Date().toISOString()})});
    if(r.status===201){
      // Mettre à jour le cache local
      const idxLocal=portfolioHistory.findIndex(h=>h.date===today);
      if(idxLocal<0){portfolioHistory.push({date:today,value:valueInCurrency,currency:accountCurrency});portfolioHistory.sort((a,b)=>a.date.localeCompare(b.date));}
      console.log(`[snapshot] Nouveau snapshot: ${valueInCurrency} ${accountCurrency} pour ${today}`);
    }else{console.log(`[snapshot] Snapshot ${today} déjà présent, ignoré.`);}
  }catch(e){console.error('[snapshot] Erreur:',e);}
}
// Ne plus écrire l'interpolation dans Supabase — ça écrasait les vraies valeurs.
// Les jours manquants sont comblés côté client uniquement pour l'affichage du chart.
function getDisplayHistory(){
  // Anciennement : comblait les jours manquants entre deux vrais snapshots par une
  // interpolation linéaire (points "fictifs"). Ça masquait les vraies variations
  // du portfolio par une fausse ligne droite entre deux jours de connexion.
  // Le cron /api/snapshot tourne tous les jours ouvrables sans besoin de login —
  // on affiche donc uniquement les vrais snapshots, sans données inventées.
  if(!portfolioHistory.length)return[];
  return portfolioHistory.map(h=>({...h}));
}


// ─── CURRENCY ────────────────────────────────────────────────────
const FX_FALLBACK={'CAD':1.3700,'EUR':0.9200,'CHF':0.8900,'GBP':0.7900,'JPY':149.50,'AUD':1.5300,'NZD':1.6400,'HKD':7.8200,'SGD':1.3400,'SEK':10.40,'NOK':10.55,'DKK':6.8800,'MXN':17.10,'BRL':4.9500};
async function fetchFxRate(cur){if(cur==='USD')return 1;try{const res=await fetch(`/api/prices?symbols=USD${cur}=X`);const data=await res.json();const rate=data[`USD${cur}=X`];if(rate&&rate>0&&rate<100000)return rate;}catch(e){}return FX_FALLBACK[cur]||1;}
async function setCurrency(cur){
  accountCurrency=cur;
  // Sauvegarder dans Supabase user_data si connecté
  if(currentUser&&accessToken){try{const nowIso=new Date().toISOString();await fetch(`${SB_URL}/rest/v1/user_data?user_id=eq.${currentUser.id}`,{method:'PATCH',headers:sbHeaders(),body:JSON.stringify({currency:cur,updated_at:nowIso})});lastKnownUpdatedAt=nowIso;}catch(e){}}
  localStorage.setItem('nc_currency',cur);
  fxRate=await fetchFxRate(cur);
  // Mettre à jour le cache live pour toutes les devises de positions
  const posCurrencies=[...new Set(positions.map(p=>getPosCurrency(p)).filter(c=>c!=='USD'&&c!==cur))];
  await fetchAndCacheFxRates(posCurrencies);
  updateFxDisplay();renderAll();
}
function updateFxDisplay(){const el=document.getElementById('fx-rate-display');if(!el)return;if(accountCurrency==='USD'){el.textContent='';return;}el.textContent=`1 USD = ${fxRate.toFixed(fxRate>100?2:4)} ${accountCurrency}`;}

// Cache des taux live pour conversion inter-devises (valeur = nb USD pour 1 unité de la devise)
const liveFxRates={};
async function fetchAndCacheFxRates(currencies){
  const needed=currencies.filter(c=>c&&c!=='USD'&&!liveFxRates[c]);
  if(!needed.length)return;
  try{
    const symbols=needed.map(c=>`USD${c}=X`).join(',');
    const res=await fetch(`/api/prices?symbols=${encodeURIComponent(symbols)}`);
    const data=await res.json();
    needed.forEach(c=>{const rate=data[`USD${c}=X`];if(rate&&rate>0)liveFxRates[c]=1/rate;});
  }catch(e){}
}
// Convertit un montant d'une devise vers USD en utilisant les taux live quand disponibles
function toUSD(amount,posCur){
  const pc=posCur||'USD';
  if(pc==='USD')return amount;
  // Devise du compte : on inverse fxRate (1 USD = fxRate accountCurrency)
  if(pc===accountCurrency&&fxRate&&fxRate!==1)return amount/fxRate;
  // Taux live en cache (1 pc = X USD)
  if(liveFxRates[pc])return amount*liveFxRates[pc];
  // Fallback statique (1 USD = FX_FALLBACK[pc] → 1 pc = 1/FX_FALLBACK[pc] USD)
  return amount/(FX_FALLBACK[pc]||1);
}
// accountCurrency par unité de `cur`, calculé avec les taux actuellement en cache.
// Figé sur chaque entrée d'achat au moment de la transaction (voir addPosition/import CSV)
// pour que le coût de base (ACB $CA) ne dérive plus au fil des sessions avec le taux du
// jour — un montant déjà dépensé dans le passé ne doit pas 'fluctuer' avec le FX d'aujourd'hui.
function fxSnapshotFor(cur){
  return toUSD(1,cur)*(fxRate||1);
}
// ACB stable en devise du compte : somme par entrée d'achat en utilisant le taux figé au
// moment de CHAQUE transaction plutôt que le taux live d'aujourd'hui appliqué à l'agrégat.
function getPositionAcbCAD(p){
  const posCur=getPosCurrency(p);
  if(!p.entries||!p.entries.length){
    return parseFloat((toUSD((p.shares||0)*(p.avgEntry||0),posCur)*fxRate).toFixed(2));
  }
  const total=p.entries.reduce((sum,e)=>{
    const rate=(e.fxSnapshot!=null&&e.fxSnapshot>0)?e.fxSnapshot:fxSnapshotFor(posCur);
    return sum+(parseFloat(e.shares)||0)*(parseFloat(e.price)||0)*rate;
  },0);
  return parseFloat(total.toFixed(2));
}
// Backfill unique : les entrées créées avant ce fix (2026-07-28) n'ont pas de fxSnapshot.
// On leur en fige un au premier chargement post-fix (taux du jour = nouvelle base stable
// à partir de maintenant), puis on sauvegarde pour ne plus jamais avoir à recalculer.
function backfillEntryFxSnapshots(){
  let changed=false;
  positions.forEach(p=>{
    const posCur=getPosCurrency(p);
    (p.entries||[]).forEach(e=>{
      if(e.fxSnapshot==null||!(e.fxSnapshot>0)){
        e.fxSnapshot=fxSnapshotFor(posCur);
        changed=true;
      }
    });
  });
  return changed;
}

// Devise réelle d'un ticker .TO : toujours coté en CAD sur Yahoo, peu importe
// le champ .currency stocké (qui peut être mal renseigné si le titre a été
// ajouté manuellement hors de la liste de suggestions curée — cf. audit 2026-07-23).
// Même logique que api/_lib/valuation.js:positionValueCAD côté serveur.
function tickerCurrency(symbol){
  return (symbol||'').toUpperCase().endsWith('.TO') ? 'CAD' : null;
}
function getPosCurrency(p){ return tickerCurrency(p.symbol) || p.currency || 'USD'; }
// Valeur totale des positions en USD — source unique (fix audit 2026-07-29 : cette formule
// était copiée-collée identique dans 5 fonctions, risque de drift si elle change un jour.
function getTotalSizeUSD(posArr){ return (posArr||positions).reduce((s,p)=>s+toUSD((p.shares||0)*p.current,getPosCurrency(p)),0); }
function getTradeCurrency(t){ return tickerCurrency(t.symbol) || t.currency || 'USD'; }

// ── Rendement par actif (actifs entièrement fermés) — demandé par Cédric 2026-07-29 ──
// Rendement = Σ profit $ / Σ capital investi sur TOUS les trades de vente fermés de l'actif
//             (moyenne pondérée par la taille de chaque vente). PAS de compounding entre
//             "campagnes" (cycle achat → position à plat) : le compounding suppose que le
//             capital sorti d'un cycle est réinvesti dans le suivant, ce qui n'est pas le cas
//             ici — Cédric confirme (2026-07-30) que les rachats SOXL ont été financés par un
//             mélange de profits ET de cash dormant, pas une réinjection propre et traçable du
//             capital précédent. Le compounding par campagne (fix du 2026-07-29, commit f98c8ac)
//             avait fait passer SOXL de 5289% à 756,54%, mais restait injustifié pour la même
//             raison. La moyenne pondérée globale est le seul chiffre défendable sans traçabilité
//             explicite du réinvestissement.
function getClosedAssetReturns(){
  const openSymbols=new Set(positions.map(p=>p.symbol));
  const bySymbol={};
  trades.forEach(t=>{
    if(t.type!=='Achat'&&t.type!=='Vente')return;
    (bySymbol[t.symbol]=bySymbol[t.symbol]||[]).push(t);
  });
  const rows=[];
  Object.keys(bySymbol).forEach(sym=>{
    if(openSymbols.has(sym))return; // encore une position ouverte → pas "entièrement fermé"
    let sumProfitUSD=0,sumSizeUSD=0,sellCount=0;
    bySymbol[sym].forEach(t=>{
      if(t.type!=='Vente')return;
      const cur=getTradeCurrency(t);
      sumProfitUSD+=toUSD(t.profit||0,cur);
      sumSizeUSD+=toUSD(t.size||0,cur);
      sellCount++;
    });
    if(sumSizeUSD<=0)return;
    rows.push({
      symbol:sym,
      tradeCount:sellCount,
      capitalCAD:sumSizeUSD*fxRate,
      profitCAD:sumProfitUSD*fxRate,
      pct:(sumProfitUSD/sumSizeUSD)*100,
    });
  });
  rows.sort((a,b)=>b.profitCAD-a.profitCAD);
  return rows;
}

function renderAssetReturns(){
  const el=document.getElementById('asset-returns-body');if(!el)return;
  const rows=getClosedAssetReturns();
  if(!rows.length){el.innerHTML='<p style="padding:14px;color:var(--text3);font-size:12px;">Aucun actif entièrement fermé pour l\'instant — le rendement par actif appara\u00eet ici une fois qu\'une position est vendue à 100%.</p>';return;}
  el.innerHTML=`<table style="min-width:600px;"><thead><tr>
    <th>Actif</th><th>Trades fermés</th><th>Capital investi</th><th>Profit $</th><th>Rendement</th>
  </tr></thead><tbody>${rows.map(r=>{
    const cls=r.profitCAD>=0?'pos':'neg';
    return`<tr>
      <td class="sym">${escapeHtml(r.symbol)}</td>
      <td style="color:var(--text2);">${r.tradeCount}</td>
      <td style="color:var(--text2);" data-sensitive>${fmtAmtRound(r.capitalCAD)}</td>
      <td class="${cls}" data-sensitive>${fmtCpnl(r.profitCAD,'CAD')}</td>
      <td class="${cls}">${fmtPct(r.pct)}</td>
    </tr>`;}).join('')}</tbody></table>`;
}
function getStratCurrency(s){ return tickerCurrency(s.symbol) || s.currency || 'USD'; }

// ── Dividendes (demandé par Cédric 2026-08-03) ──────────────────────────────────────────
// Trade type 'Dividende' : traité comme un dépôt de "profit" (pas "principal") dans
// reconstructCashLots() -- un dividende est un revenu de placement, pas une cotisation, donc
// il ne doit jamais compter dans les droits REER/CELI (ces droits ne suivent que le type
// 'Cotisation', jamais 'Dividende'). Consommé en premier au même titre qu'un profit de vente
// (cohérent avec la règle FIFO profit-d'abord déjà en place pour les achats/retraits).
function getDividendCurrency(t){ return tickerCurrency(t.symbol) || t.currency || 'USD'; }
function renderDividends(){
  const el=document.getElementById('dividends-body');if(!el)return;
  const divs=trades.filter(t=>t.type==='Dividende');
  const totalEl=document.getElementById('dividends-total-inline');
  if(!divs.length){
    el.innerHTML='<p style="padding:14px;color:var(--text3);font-size:12px;">Aucun dividende enregistré — utilise le bouton "+ Dividende" ci-dessous.</p>';
    if(totalEl)totalEl.textContent='';
    return;
  }
  const bySymbol={};
  let totalCAD=0;
  divs.forEach(t=>{
    const cad=toUSD(t.size||0,getDividendCurrency(t))*fxRate;
    totalCAD+=cad;
    (bySymbol[t.symbol]=bySymbol[t.symbol]||{count:0,cad:0}).count++;
    bySymbol[t.symbol].cad+=cad;
  });
  if(totalEl)totalEl.textContent=`${fmtAmtRound(totalCAD)} au total, ${divs.length} versement${divs.length!==1?'s':''}`;
  const rows=Object.entries(bySymbol).sort((a,b)=>b[1].cad-a[1].cad);
  el.innerHTML=`<table style="min-width:500px;"><thead><tr>
    <th>Actif</th><th>Versements</th><th>Total reçu (CAD)</th>
  </tr></thead><tbody>${rows.map(([sym,d])=>`<tr>
      <td class="sym">${escapeHtml(sym)}</td>
      <td style="color:var(--text2);">${d.count}</td>
      <td class="pos" data-sensitive>${fmtAmtRound(d.cad)}</td>
    </tr>`).join('')}</tbody></table>`;
}
function openDividendModal(){
  const dateEl=document.getElementById('div-date');if(dateEl)dateEl.value=new Date().toISOString().split('T')[0];
  const symEl=document.getElementById('div-symbol');if(symEl)symEl.value='';
  const amtEl=document.getElementById('div-amount');if(amtEl)amtEl.value='';
  const noteEl=document.getElementById('div-note');if(noteEl)noteEl.value='';
  document.getElementById('dividend-modal-overlay').style.display='flex';
}
function closeDividendModal(){
  document.getElementById('dividend-modal-overlay').style.display='none';
}
async function saveDividend(){
  const symbol=(document.getElementById('div-symbol')?.value||'').trim().toUpperCase();
  const account=document.getElementById('div-account')?.value||'CELI';
  const amount=parseFloat(document.getElementById('div-amount')?.value||'0');
  const currency=document.getElementById('div-currency')?.value||'USD';
  const date=document.getElementById('div-date')?.value||new Date().toISOString().split('T')[0];
  const note=document.getElementById('div-note')?.value||'';
  if(!symbol){alert('Entre un symbole.');return;}
  if(isNaN(amount)||amount<=0){alert('Montant invalide.');return;}
  const entry={type:'Dividende',date,symbol,accountType:account,originalAmt:parseFloat(amount.toFixed(2)),originalCurrency:currency,currency,size:parseFloat(amount.toFixed(2)),note};
  trades.unshift(entry);
  const ok=await saveData();
  if(!ok){
    // Même pattern de rollback que saveCotisation() (fix 2026-07-28) : ne pas garder en
    // mémoire une entrée que le serveur n'a jamais reçue, sinon elle semble enregistrée dans
    // l'UI puis disparaît silencieusement au prochain rechargement.
    const idx=trades.indexOf(entry);
    if(idx!==-1)trades.splice(idx,1);
    alert('Échec de la sauvegarde (connexion ?). Le dividende n\'a PAS été enregistré — réessaie.');
    return;
  }
  closeDividendModal();
  renderAll();
}
document.addEventListener('click',function(e){if(e.target===document.getElementById('dividend-modal-overlay'))closeDividendModal();});


// ── Reconstruction du cash en lots profit/principal, par compte (debug, 2026-07-30) ──
// Lecture seule : ne modifie ni cash, ni trades, ni positions. Rejoue tout l'historique
// (Dépôts/Retraits/Achats/Ventes) en ordre chronologique pour reconstituer, par compte, quelle
// part du cash est du capital déposé ("principal") vs du profit réalisé et pas encore retiré
// ("profit"). FIFO profit-d'abord pour les achats ET les retraits (demandé par Cédric). Chaque
// lot garde une chaîne de provenance complète : si un profit de SOXL finance un achat de TSLA
// qui génère lui-même un profit, la chaîne s'allonge (SOXL → TSLA → ...). Sert uniquement à
// valider la logique avant de la rendre active (achats bloqués si cash insuffisant, etc.) —
// voir demande de Cédric du 2026-07-30. Résultat affiché via le pie chart « Cash disponible » (Dashboard).
function fxConvert(amount, fromCur, toCur){
  if(!amount)return 0;
  if(fromCur===toCur)return amount;
  const usd=toUSD(amount, fromCur);
  if(toCur==='USD')return usd;
  if(toCur===accountCurrency&&fxRate&&fxRate!==1)return usd*fxRate;
  if(liveFxRates[toCur])return usd/liveFxRates[toCur];
  return usd*(FX_FALLBACK[toCur]||1);
}
function _clMakeAccount(){return{principal:[],profit:[]};}
function _clAddLot(state,type,amount,currency,date,chain){
  if(!(amount>0.0001))return;
  state[type].push({amount,currency,date,chain:chain||[]});
}
function _clScaleFunding(funding,frac){return funding.map(f=>({...f,amount:f.amount*frac}));}
function _clUniqueChains(funding){
  const seen=new Set(),out=[];
  funding.forEach(f=>(f.chain||[]).forEach(hop=>{
    const k=hop.symbol+'|'+hop.date;
    if(!seen.has(k)){seen.add(k);out.push(hop);}
  }));
  return out;
}
// Consomme amountNeeded (en `currency`) dans un compte : profit d'abord, plus ancien d'abord dans chaque type.
function _clConsume(state,amountNeeded,currency){
  let remaining=amountNeeded;
  const consumed=[];
  for(const type of['profit','principal']){
    const queue=state[type];
    while(remaining>0.005&&queue.length){
      const lot=queue[0];
      const lotValueInTarget=fxConvert(lot.amount,lot.currency,currency);
      if(lotValueInTarget<=remaining+0.005){
        consumed.push({type,amount:lot.amount,currency:lot.currency,date:lot.date,chain:lot.chain});
        remaining-=lotValueInTarget;
        queue.shift();
      }else{
        const fraction=remaining/lotValueInTarget;
        const partAmount=lot.amount*fraction;
        consumed.push({type,amount:partAmount,currency:lot.currency,date:lot.date,chain:lot.chain});
        lot.amount-=partAmount;
        remaining=0;
      }
    }
    if(remaining<=0.005)break;
  }
  return{consumed,shortfall:Math.max(0,remaining)};
}
// deductOnBuy=false (Modèle A) reproduit le comportement ACTUEL de l'app : addPosition() ne
// déduit jamais le cash, donc le cash disponible n'a jamais tenu compte de l'argent englouti
// dans des positions ouvertes. C'est CE modèle qu'il faut comparer au cash réel/actuel (~19116$
// selon le calcul manuel de Cédric du 2026-07-30, qui corrige aussi le fait que le `cash` stocké
// convertit chaque dépôt USD→CAD une seule fois au taux du jour du dépôt et ne revalorise jamais
// — d'où l'écart avec un calcul qui utilise le taux live). deductOnBuy=true (Modèle B) est le
// système PROSPECTIF demandé pour la Phase 2 : les achats déduisent vraiment le cash, donc le
// total redescend du montant englouti dans les positions encore ouvertes (normal, à ne comparer
// à rien d'existant tant que ce n'est pas activé pour de vrai).
// Ligne de départ du 2026-07-30 : avant cette date, le cash de l'app contenait des faux
// dépôts/retraits de test et au moins un ajustement manuel pour "atterrir" sur le bon chiffre
// (confirmé par Cédric) -- l'historique n'est pas fiable pour retracer profit vs principal.
// On repart d'une base propre, 100% "principal" faute de pouvoir distinguer le profit déjà
// accumulé avant cette date. Vérifié contre le solde réel (Disnat + exchanges) le 2026-07-30 :
// 19116$ CAD (CELI 42$ CAD + 22,05$ USD ; CELIAPP 15415,43$ CAD [dont 15300$ CASH-C] + 2516,18$ USD).
const CASH_LOTS_BASELINE_DATE='2026-07-30';
const CASH_LOTS_SEED=[
  {account:'CELI',currency:'CAD',amount:42},
  {account:'CELI',currency:'USD',amount:22.05},
  {account:'CELIAPP',currency:'CAD',amount:15415.43},
  {account:'CELIAPP',currency:'USD',amount:2516.18},
];
function reconstructCashLots(deductOnBuy){
  const accounts={};
  const entryFunding={};
  function acct(name){const k=name||'Non spécifié';return accounts[k]||(accounts[k]=_clMakeAccount());}
  CASH_LOTS_SEED.forEach(s=>_clAddLot(acct(s.account),'principal',s.amount,s.currency,CASH_LOTS_BASELINE_DATE,[]));
  const chrono=trades.slice().reverse().filter(t=>t.date>=CASH_LOTS_BASELINE_DATE);
  chrono.forEach(t=>{
    const account=t.accountType||t.account||'Non spécifié';
    if(t.type==='Dépôt'){
      // t.size est TOUJOURS en CAD (amtCAD dans updateCash()) -- t.currency est la devise
      // d'AFFICHAGE préférée au moment du dépôt (accountCurrency), pas la devise réelle du
      // montant. Sans originalAmt/originalCurrency (dépôts créés avant ce champ), le seul
      // fallback fiable est donc CAD, jamais t.currency (bug corrigé le 2026-07-30).
      const hasOriginal=t.originalAmt!=null&&t.originalCurrency;
      const amt=hasOriginal?t.originalAmt:t.size;
      const cur=hasOriginal?t.originalCurrency:'CAD';
      _clAddLot(acct(account),'principal',amt,cur,t.date,[]);
    }else if(t.type==='Retrait'){
      const hasOriginal=t.originalAmt!=null&&t.originalCurrency;
      const amt=hasOriginal?t.originalAmt:t.size;
      const cur=hasOriginal?t.originalCurrency:'CAD';
      _clConsume(acct(account),amt,cur);
    }else if(t.type==='Dividende'){
      // Revenu de placement, pas une cotisation -- tracké comme "profit" (consommé en
      // premier, comme un gain de vente), jamais comme "principal". Ne touche jamais aux
      // droits REER/CELI (ces droits ne suivent que le type 'Cotisation').
      const hasOriginal=t.originalAmt!=null&&t.originalCurrency;
      const amt=hasOriginal?t.originalAmt:t.size;
      const cur=hasOriginal?t.originalCurrency:'USD';
      _clAddLot(acct(account),'profit',amt,cur,t.date,[]);
    }else if(t.type==='Achat'){
      const amt=t.size,cur=t.currency||'USD';
      const consumed=deductOnBuy?_clConsume(acct(account),amt,cur).consumed:[];
      // BUG CRITIQUE corrigé (audit 2026-07-30) : clé uniquement par symbole permettait à une
      // vente d'un compte X de piger dans du funding tracké pour un achat du compte Y (même
      // symbole, comptes différents) -- fuite de cash entre comptes. Clé maintenant par
      // symbole+compte, cloisonnement strict.
      const fundingKey=t.symbol+'|'+account;
      (entryFunding[fundingKey]=entryFunding[fundingKey]||[]).push({shares:t.shares,funding:consumed,account,currency:cur});
    }else if(t.type==='Vente'){
      let sharesToClose=t.shares||0;
      const fundingKey=t.symbol+'|'+account;
      const list=entryFunding[fundingKey]||[];
      let returningFunding=[];
      while(sharesToClose>0.000001&&list.length){
        const e=list[0];
        if(e.shares<=sharesToClose+0.000001){
          returningFunding.push(...e.funding);
          sharesToClose-=e.shares;
          list.shift();
        }else{
          const frac=sharesToClose/e.shares;
          returningFunding.push(..._clScaleFunding(e.funding,frac));
          e.funding=_clScaleFunding(e.funding,(e.shares-sharesToClose)/e.shares);
          e.shares-=sharesToClose;
          sharesToClose=0;
        }
      }
      const cur=t.currency||'USD';
      const chainHop={symbol:t.symbol,date:t.date};
      returningFunding.forEach(f=>_clAddLot(acct(account),f.type,f.amount,f.currency,t.date,[...f.chain,chainHop]));
      if(returningFunding.length===0){
        _clAddLot(acct(account),'principal',t.size,cur,t.date,[]);
      }
      const parentChains=_clUniqueChains(returningFunding);
      // BUG CRITIQUE corrigé (audit 2026-07-30) : _clAddLot ignore silencieusement les montants
      // <=0, donc une vente PERDANTE (t.profit négatif) ne débitait jamais le cash -- le coût de
      // base complet revenait quand même via returningFunding, créant du cash fantôme égal à la
      // perte, à chaque trade perdant. Une perte doit CONSOMMER le pool (profit d'abord), pas
      // juste sauter l'ajout.
      if(t.profit>0.0001){
        _clAddLot(acct(account),'profit',t.profit,cur,t.date,[...parentChains,chainHop]);
      }else if(t.profit<-0.0001){
        _clConsume(acct(account),-t.profit,cur);
      }
    }
  });
  return{accounts,entryFunding};
}
function _clAccountTotalCAD(state){
  const sumType=type=>state[type].reduce((s,l)=>s+fxConvert(l.amount,l.currency,'CAD'),0);
  return sumType('principal')+sumType('profit');
}
// Recalcule le `cash` global legacy (utilisé par les KPI existants) depuis les lots reconstruits.
// Source unique de vérité = trades + CASH_LOTS_SEED, jamais une valeur qui dérive toute seule.
function syncCashFromLots(){
  const{accounts}=reconstructCashLots(true);
  let total=0;
  Object.values(accounts).forEach(state=>{total+=_clAccountTotalCAD(state);});
  cash=parseFloat(total.toFixed(2));
  return cash;
}

// ─── LIVE PRICES ─────────────────────────────────────────────────
function setLiveStatus(status){
  const dot=document.getElementById('live-dot'),label=document.getElementById('live-label');if(!dot||!label)return;
  if(status==='live'){dot.style.background='#00ff88';label.style.color='#00ff88';const now=new Date();label.textContent='Live · '+now.getHours().toString().padStart(2,'0')+':'+now.getMinutes().toString().padStart(2,'0');}
  else if(status==='error'){dot.style.background='#ff4d6d';label.style.color='#ff4d6d';label.textContent='Hors ligne';}
  else{dot.style.background='#606075';label.style.color='#606075';label.textContent='Chargement...';}
}
async function fetchLivePrices(){
  if(!positions.length){setLiveStatus('error');return;}
  setLiveStatus('loading');
  const tickers=[...new Set(positions.map(p=>getTicker(p.symbol)))];
  try{
    const res=await fetch(`/api/prices?symbols=${encodeURIComponent(tickers.join(','))}`);
    if(!res.ok)throw new Error(`HTTP ${res.status}`);
    const data=await res.json();
    let updated=0,failed=[];
    positions.forEach(p=>{
      const t=getTicker(p.symbol);
      if(data[t]&&data[t]>0){p.current=data[t];updated++;}
      else failed.push(p.symbol);
    });
    console.log(`[prices] ${updated}/${positions.length} mis à jour.${failed.length?' Manquants: '+failed.join(','):''}`);
    if(updated>0){
      // Rafraîchir les taux live pour toutes les devises de positions avant calcul
      const posCurrencies=[...new Set(positions.map(p=>getPosCurrency(p)).filter(c=>c!=='USD'&&c!==accountCurrency))];
      await fetchAndCacheFxRates(posCurrencies);
      // S'assurer que fxRate est bien chargé avant le snapshot
      if(!fxRate||fxRate===0)fxRate=await fetchFxRate(accountCurrency);
      await saveData();
      // Snapshot en USD, converti dans la devise du compte par saveSnapshot()
      const totalValueCAD=positions.reduce((s,p)=>s+toUSD((p.shares||0)*p.current,getPosCurrency(p)),0)*fxRate+cash;
      console.log(`[snapshot] Valeur ${accountCurrency}: ${totalValueCAD.toFixed(2)}`);
      await saveSnapshot(totalValueCAD);
      renderAll();setLiveStatus('live');
    }else{
      console.warn('[prices] Aucun prix reçu — snapshot non sauvegardé');
      setLiveStatus('error');
    }
  }catch(e){
    console.error('[prices] Erreur fetch:',e.message);
    setLiveStatus('error');
  }
}

// ─── AUTOCOMPLETE ─────────────────────────────────────────────────
let acIndex=-1;
function calcMontant(){const e=parseFloat(document.getElementById('f-entry').value),s=parseFloat(document.getElementById('f-shares').value);if(!isNaN(e)&&!isNaN(s)&&e>0&&s>0)document.getElementById('f-size').value=(e*s).toFixed(2);else document.getElementById('f-size').value='';}
function onSymbolInput(val, inputId='f-symbol', dropdownId='symbol-dropdown'){
  const list=document.getElementById(dropdownId);if(!val||val.length<1){list.classList.remove('open');return;}
  const q=val.toUpperCase();
  const matches=SYMBOLS.filter(s=>s.s.toUpperCase().includes(q)||s.n.toUpperCase().includes(q)||(s.inst&&s.inst.toUpperCase().includes(q))).slice(0,12);
  if(!matches.length){list.classList.remove('open');return;}acIndex=-1;
  const isWl=dropdownId==='wl-dropdown';
  list.innerHTML=matches.map(s=>{
    const secondLine=s.cat==='ETF'||s.cat==='ETF Levier'?`${s.inst} · ${s.n}`:s.n;
    const tickerHL=s.s.toUpperCase().includes(q)?s.s.replace(new RegExp(q,'i'),m=>`<span style="color:var(--blue);font-weight:700;">${m}</span>`):s.s;
    const onclick=isWl?`pickWlSymbol('${s.s}')`:`selectSymbol('${s.s}','${s.cur}')`;
    return`<div class="autocomplete-item" data-symbol="${s.s}" data-cur="${s.cur}" onclick="${onclick}"><div style="display:flex;flex-direction:column;gap:2px;min-width:0;"><div style="display:flex;align-items:center;gap:8px;"><span class="sym-label">${tickerHL}</span><span style="font-size:9px;padding:1px 5px;background:var(--bg4);border:1px solid var(--border);border-radius:3px;color:var(--text3);white-space:nowrap;">${s.cat}</span><span style="font-size:9px;color:var(--amber);">${s.cur}</span></div><div style="font-size:10px;color:var(--text3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${secondLine}</div></div></div>`;
  }).join('');
  list.classList.add('open');
}
function onSymbolKey(e){
  const list=document.getElementById('symbol-dropdown'),items=list.querySelectorAll('.autocomplete-item');
  if(e.key==='ArrowDown'){acIndex=Math.min(acIndex+1,items.length-1);items.forEach((el,i)=>el.classList.toggle('selected',i===acIndex));e.preventDefault();}
  else if(e.key==='ArrowUp'){acIndex=Math.max(acIndex-1,0);items.forEach((el,i)=>el.classList.toggle('selected',i===acIndex));e.preventDefault();}
  else if(e.key==='Enter'&&acIndex>=0){const sel=items[acIndex];if(sel)selectSymbol(sel.dataset.symbol,sel.dataset.cur);}
  else if(e.key==='Escape')list.classList.remove('open');
}
function selectSymbol(sym,cur){
  document.getElementById('f-symbol').value=sym;
  const ce=document.getElementById('f-currency');if(ce&&cur)ce.value=cur;
  document.getElementById('symbol-dropdown').classList.remove('open');acIndex=-1;
  const ticker=getTicker(sym);
  fetch(`/api/prices?symbols=${encodeURIComponent(ticker)}`).then(r=>r.json()).then(data=>{const p=data[ticker];if(p&&p>0)document.getElementById('f-current').value=p;}).catch(()=>{});
}
document.addEventListener('click',e=>{
  if(!e.target.closest('.autocomplete-wrap')){
    document.getElementById('symbol-dropdown').classList.remove('open');
    const wld=document.getElementById('wl-dropdown');if(wld)wld.classList.remove('open');
  }
});

// ─── IMPORT CSV ──────────────────────────────────────────────────
let csvParsedRows = [];
let csvDetectedFormat = '';

function openImportModal(){
  csvParsedRows=[];csvDetectedFormat='';
  document.getElementById('csv-step-upload').style.display='block';
  document.getElementById('csv-step-preview').style.display='none';
  document.getElementById('csv-error').textContent='';
  document.getElementById('csv-file-input').value='';
  document.getElementById('csv-modal-overlay').classList.add('open');
}
function closeImportModal(){ document.getElementById('csv-modal-overlay').classList.remove('open'); }

// Drag & drop
document.addEventListener('DOMContentLoaded',()=>{
  const zone=document.getElementById('csv-drop-zone');
  if(!zone)return;
  zone.addEventListener('dragover',e=>{e.preventDefault();zone.classList.add('dragover');});
  zone.addEventListener('dragleave',()=>zone.classList.remove('dragover'));
  zone.addEventListener('drop',e=>{e.preventDefault();zone.classList.remove('dragover');const f=e.dataTransfer.files[0];if(f)onCsvFile(f);});
});

function onCsvFile(file){
  if(!file||!file.name.endsWith('.csv')){document.getElementById('csv-error').textContent='Fichier invalide. Utilise un .csv.';return;}
  const reader=new FileReader();
  reader.onload=e=>{
    try{
      const rows=parseCsv(e.target.result);
      if(!rows.length){document.getElementById('csv-error').textContent='Fichier vide ou non reconnu.';return;}
      csvParsedRows=rows;
      showCsvPreview(rows);
    }catch(err){
      document.getElementById('csv-error').textContent='Erreur de lecture : '+err.message;
    }
  };
  reader.readAsText(file,'UTF-8');
}

function parseCsv(text){
  const lines=text.replace(/\r/g,'').split('\n').filter(l=>l.trim());
  if(lines.length<2)return[];
  const headers=lines[0].split(',').map(h=>h.trim().replace(/^"|"$/g,''));

  // Détection du format
  if(headers.some(h=>h==='Transaction Date')&&headers.some(h=>h==='Action')){
    csvDetectedFormat='Questrade';
    return parseQuestrade(headers,lines.slice(1));
  }
  if(headers.some(h=>h==='Timestamp')&&headers.some(h=>h==='Transaction Type')&&headers.some(h=>h==='Asset')){
    csvDetectedFormat='Coinbase';
    return parseCoinbase(headers,lines.slice(1));
  }
  if(headers.some(h=>h.includes('Pair')||h.includes('pair'))&&headers.some(h=>h==='Side'||h==='side')){
    csvDetectedFormat='Binance';
    return parseBinance(headers,lines.slice(1));
  }
  // Essai générique
  csvDetectedFormat='Générique';
  return parseGeneric(headers,lines.slice(1));
}

function splitCsvLine(line){
  const result=[];let cur='',inQ=false;
  for(let i=0;i<line.length;i++){
    if(line[i]==='"'){inQ=!inQ;}
    else if(line[i]===','&&!inQ){result.push(cur.trim());cur='';}
    else cur+=line[i];
  }
  result.push(cur.trim());
  return result;
}

function parseQuestrade(headers,lines){
  const rows=[];
  for(const line of lines){
    const cols=splitCsvLine(line);
    const row=Object.fromEntries(headers.map((h,i)=>[h,cols[i]||'']));
    const action=(row['Action']||'').toUpperCase();
    if(!['BUY','SELL'].includes(action))continue;
    const sym=(row['Symbol']||'').toUpperCase().replace('.TO','.TO');
    const qty=parseFloat(row['Quantity']);
    const price=parseFloat(row['Price']);
    const date=(row['Transaction Date']||'').split(' ')[0];
    const cur=(row['Currency']||'USD').toUpperCase();
    const size=Math.abs(qty*price);
    if(!sym||isNaN(qty)||isNaN(price))continue;
    rows.push({date,symbol:sym,action,qty:Math.abs(qty),price,size:parseFloat(size.toFixed(2)),currency:cur,account:row['Account Type']||'',_skip:false});
  }
  return rows;
}

function parseCoinbase(headers,lines){
  const rows=[];
  for(const line of lines){
    const cols=splitCsvLine(line);
    const row=Object.fromEntries(headers.map((h,i)=>[h,cols[i]||'']));
    const type=(row['Transaction Type']||'').toLowerCase();
    if(!['buy','sell','advanced trade buy','advanced trade sell'].includes(type))continue;
    const action=type.includes('buy')?'BUY':'SELL';
    const sym=((row['Asset']||'')+'USD').replace('USDUSD','USD').toUpperCase();
    // Coinbase: Asset = "BTC" → "BTC-USD"
    const symFinal=(row['Asset']||'').toUpperCase()+'-USD';
    const qty=parseFloat(row['Quantity Transacted']);
    const price=parseFloat(row['Price at Transaction']||row['Spot Price at Transaction']||0);
    const date=(row['Timestamp']||'').split('T')[0];
    const total=parseFloat(row['Total (inclusive of fees and/or spread)']||row['Subtotal']||0);
    if(!symFinal||isNaN(qty)||isNaN(price))continue;
    rows.push({date,symbol:symFinal,action,qty:Math.abs(qty),price,size:parseFloat(Math.abs(total||qty*price).toFixed(2)),currency:'USD',account:'Coinbase',_skip:false});
  }
  return rows;
}

function parseBinance(headers,lines){
  const rows=[];
  for(const line of lines){
    const cols=splitCsvLine(line);
    const row=Object.fromEntries(headers.map((h,i)=>[h,cols[i]||'']));
    const side=((row['Side']||row['side']||'')).toUpperCase();
    if(!['BUY','SELL'].includes(side))continue;
    const pair=(row['Pair']||row['pair']||'').toUpperCase();
    // BTC/USDT → BTC-USD approximation
    const sym=pair.replace('/USDT','-USD').replace('USDT','USD').replace('/BTC','-BTC');
    const qty=parseFloat(row['Executed']||row['Filled']||0);
    const price=parseFloat(row['Price']||0);
    const date=(row['Date(UTC)']||row['Date']||'').split(' ')[0];
    const size=parseFloat(row['Amount']||row['Total']||qty*price);
    if(!sym||isNaN(qty)||isNaN(price))continue;
    rows.push({date,symbol:sym,action:side,qty:Math.abs(qty),price,size:parseFloat(Math.abs(size).toFixed(2)),currency:'USD',account:'Binance',_skip:false});
  }
  return rows;
}

function parseGeneric(headers,lines){
  // Tentative avec des headers communs
  const rows=[];
  const hUpper=headers.map(h=>h.toUpperCase());
  const iDate=hUpper.findIndex(h=>h.includes('DATE'));
  const iSym=hUpper.findIndex(h=>h.includes('SYMBOL')||h.includes('TICKER')||h.includes('ASSET'));
  const iQty=hUpper.findIndex(h=>h.includes('QTY')||h.includes('QUANTITY')||h.includes('SHARES'));
  const iPrice=hUpper.findIndex(h=>h.includes('PRICE'));
  const iSide=hUpper.findIndex(h=>h.includes('SIDE')||h.includes('ACTION')||h.includes('TYPE'));
  if(iSym<0||iQty<0||iPrice<0)return[];
  for(const line of lines){
    const cols=splitCsvLine(line);
    const sym=(cols[iSym]||'').toUpperCase();
    const qty=parseFloat(cols[iQty]);
    const price=parseFloat(cols[iPrice]);
    const date=iDate>=0?cols[iDate].split(' ')[0]:new Date().toISOString().split('T')[0];
    const side=iSide>=0?cols[iSide].toUpperCase():'BUY';
    const action=side.includes('BUY')||side.includes('ACHAT')?'BUY':'SELL';
    if(!sym||isNaN(qty)||isNaN(price))continue;
    rows.push({date,symbol:sym,action,qty:Math.abs(qty),price,size:parseFloat((qty*price).toFixed(2)),currency:'USD',account:'',_skip:false});
  }
  return rows;
}

function showCsvPreview(rows){
  document.getElementById('csv-step-upload').style.display='none';
  document.getElementById('csv-step-preview').style.display='block';
  document.getElementById('csv-format-badge').textContent='Format : '+csvDetectedFormat;
  const buys=rows.filter(r=>r.action==='BUY').length;
  const sells=rows.filter(r=>r.action==='SELL').length;
  document.getElementById('csv-summary-text').textContent=`${rows.length} transactions trouvées · ${buys} achats · ${sells} ventes`;

  const alreadyExists=rows.filter(r=>{
    const exists=positions.find(p=>p.symbol===r.symbol&&p.dir==='Long');
    return r.action==='BUY'&&exists;
  });
  if(alreadyExists.length){
    document.getElementById('csv-import-warn').textContent=`[ ! ] ${alreadyExists.length} symbole(s) déjà en portfolio — seront DCA'd (prix moyen recalculé).`;
  } else {
    document.getElementById('csv-import-warn').textContent='';
  }

  const head=document.getElementById('csv-preview-head');
  head.innerHTML='<th>Date</th><th>Symbole</th><th>Action</th><th>Quantité</th><th>Prix</th><th>Total</th><th>Devise</th><th>Compte</th>';
  const body=document.getElementById('csv-preview-body');
  body.innerHTML=rows.slice(0,50).map(r=>`
    <tr class="${r._skip?'csv-row-skip':''}">
      <td>${r.date}</td>
      <td style="font-weight:700;color:var(--text);">${r.symbol}</td>
      <td><span style="color:${r.action==='BUY'?'var(--green)':'var(--red)'};">${r.action==='BUY'?'Achat':'Vente'}</span></td>
      <td>${r.qty.toLocaleString('fr-FR',{maximumFractionDigits:8})}</td>
      <td>$${r.price.toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:6})}</td>
      <td>$${r.size.toFixed(2)}</td>
      <td>${r.currency}</td>
      <td style="color:var(--text3);">${r.account||'—'}</td>
    </tr>`).join('');
  if(rows.length>50){
    const extra=document.createElement('tr');
    extra.innerHTML=`<td colspan="8" style="text-align:center;color:var(--text3);font-size:10px;">… et ${rows.length-50} autres transactions</td>`;
    body.appendChild(extra);
  }
}

async function confirmImportCsv(){
  const btn=document.getElementById('csv-confirm-btn');
  btn.disabled=true;btn.textContent='Import en cours…';
  const toImport=csvParsedRows.filter(r=>!r._skip);
  let newPos=0,dcaPos=0;

  for(const r of toImport){
    const tradeEntry={date:r.date,symbol:r.symbol,dir:'Long',type:r.action==='BUY'?'Achat':'Vente',price:r.price,shares:r.qty,size:r.size,currency:r.currency,account:r.account};
    trades.unshift(tradeEntry);

    if(r.action==='BUY'){
      const existing=positions.find(p=>p.symbol===r.symbol&&(p.dir==='Long'||!p.dir));
      if(existing){
        const prevShares=existing.shares||0;
        existing.avgEntry=prevShares>0?(existing.avgEntry*prevShares+r.price*r.qty)/(prevShares+r.qty):r.price;
        existing.shares=(prevShares+r.qty);
        existing.totalSize=(existing.totalSize||0)+r.size;
        existing.entries=existing.entries||[];
        existing.entries.push({price:r.price,shares:r.qty,size:r.size,date:r.date,fxSnapshot:fxSnapshotFor(r.currency)});
        dcaPos++;
      } else {
        positions.push({symbol:r.symbol,dir:'Long',avgEntry:r.price,current:r.price,totalSize:r.size,shares:r.qty,currency:r.currency,account:r.account,entries:[{price:r.price,shares:r.qty,size:r.size,date:r.date,fxSnapshot:fxSnapshotFor(r.currency)}]});
        newPos++;
      }
    } else if(r.action==='SELL'){
      // Réduire (ou fermer) la position correspondante
      const posIdx=positions.findIndex(p=>p.symbol===r.symbol&&(p.dir==='Long'||!p.dir));
      if(posIdx>-1){
        const p=positions[posIdx];
        const profit=(r.price-p.avgEntry)*r.qty;
        tradeEntry.profit=parseFloat(profit.toFixed(2));
        tradeEntry.avgEntry=p.avgEntry;
        tradeEntry.montantFinal=parseFloat((p.avgEntry*r.qty+profit).toFixed(2));
        tradeEntry.dcaCount=p.entries?p.entries.length:1;
        // tradeEntry.size (initialisé à r.size = proceeds de vente) redéfini ici au coût
        // d'acquisition de la portion vendue (avgEntry×qty) — cohérent avec confirmClose()
        // où size=sizeToClose (coût, pas produit). Sans ça, la colonne ROI% de l'historique
        // et le rendement par actif étaient faux pour toute vente importée par CSV.
        tradeEntry.size=parseFloat((p.avgEntry*r.qty).toFixed(2));
        // totalSize réduit au prorata du COÛT D'ACQUISITION (avgEntry×qty), pas du produit de
        // vente (r.size) — sinon ça casse l'invariant totalSize=avgEntry×shares (même logique
        // que confirmClose() pour une vente manuelle ; fix audit 2026-07-29).
        p.totalSize=Math.max(0,parseFloat(((p.totalSize||0)-p.avgEntry*r.qty).toFixed(2)));
        p.shares=parseFloat(((p.shares||0)-r.qty).toFixed(6));
        if(p.entries&&p.entries.length>0){
          // Retirer des entries les plus anciennes (FIFO)
          let toRemove=r.qty;
          while(toRemove>0&&p.entries.length>0){
            const e=p.entries[0];
            if(e.shares<=toRemove){toRemove-=e.shares;p.entries.shift();}
            else{e.shares-=toRemove;e.size=e.shares*e.price;toRemove=0;}
          }
          // Recalculer avgEntry à partir des entries restantes (cohérent avec confirmClose())
          if(p.entries.length>0){
            const totalShR=p.entries.reduce((s,e)=>s+(e.shares||0),0);
            p.avgEntry=totalShR>0?p.entries.reduce((s,e)=>s+(e.price*(e.shares||0)),0)/totalShR:p.avgEntry;
          }
        }
        if(p.shares<=0.000001)positions.splice(posIdx,1);
      }
    }
  }

  // Fix audit 2026-07-30 : l'import CSV ne resynchronisait jamais `cash` -- resté périmé
  // (KPI, pie charts) jusqu'au prochain achat/vente/dépôt/retrait manuel. Pas de blocage ici
  // (import en lot de données historiques, différent d'un achat live) mais on resynchronise.
  syncCashFromLots();
  await saveData();
  renderAll();
  closeImportModal();
  alert(`Import terminé !\n${newPos} nouvelle(s) position(s) créée(s)\n${dcaPos} position(s) mise(s) à jour (DCA)\n${toImport.filter(r=>r.action==='SELL').length} vente(s) ajoutée(s) à l'historique`);
  btn.disabled=false;btn.textContent='Importer';
}

// ─── WATCHLIST ───────────────────────────────────────────────────
let watchlist = [];
function loadWatchlist(){ try{ watchlist=JSON.parse(localStorage.getItem('nc_watchlist')||'[]'); }catch(e){ watchlist=[]; } }
function saveWatchlist(){
  localStorage.setItem('nc_watchlist', JSON.stringify(watchlist)); // fallback local
  saveWatchlistToSupabase(); // sync vers Supabase
}

function pickWlSymbol(sym){
  document.getElementById('wl-symbol').value=sym;
  const d=document.getElementById('wl-dropdown');if(d)d.classList.remove('open');
}
function onWlKey(e){
  const list=document.getElementById('wl-dropdown'),items=list?list.querySelectorAll('.autocomplete-item'):[];
  if(e.key==='ArrowDown'){acIndex=Math.min(acIndex+1,items.length-1);items.forEach((el,i)=>el.classList.toggle('selected',i===acIndex));e.preventDefault();}
  else if(e.key==='ArrowUp'){acIndex=Math.max(acIndex-1,0);items.forEach((el,i)=>el.classList.toggle('selected',i===acIndex));e.preventDefault();}
  else if(e.key==='Enter'){if(acIndex>=0){const sel=items[acIndex];if(sel)pickWlSymbol(sel.dataset.symbol);}else addToWatchlist();}
  else if(e.key==='Escape'&&list)list.classList.remove('open');
}
function addToWatchlist(){
  const sym=document.getElementById('wl-symbol').value.trim().toUpperCase();
  const note=document.getElementById('wl-note').value.trim();
  if(!sym){ alert('Entre un symbole.'); return; }
  if(watchlist.find(w=>w.symbol===sym)){ alert(sym+' est déjà dans ta watchlist.'); return; }
  watchlist.push({symbol:sym, note, addedAt:new Date().toISOString()});
  saveWatchlist();
  document.getElementById('wl-symbol').value='';
  document.getElementById('wl-note').value='';
  renderWatchlist();
  refreshWatchlist();
}
function removeFromWatchlist(sym){
  watchlist=watchlist.filter(w=>w.symbol!==sym);
  saveWatchlist();
  renderWatchlist();
}
function updateWlNote(sym, note){
  const w=watchlist.find(w=>w.symbol===sym);
  if(w){ w.note=note; saveWatchlist(); }
}
const wlSparklineCharts={};
function renderWatchlist(){
  const body=document.getElementById('wl-body');
  if(!body)return;
  console.log('[watchlist] renderWatchlist called, items:', watchlist.length);
  if(!watchlist.length){
    body.innerHTML='<div style="color:var(--text3);font-size:13px;text-align:center;padding:3rem;"><div style="font-weight:600;color:var(--text2);margin-bottom:8px;">Aucun ticker suivi</div><div style="font-size:11px;">Utilise le champ ci-dessus pour ajouter NVDA, BTC-USD, QQQ…</div></div>';
    return;
  }
  // Destroy existing sparkline charts
  Object.values(wlSparklineCharts).forEach(c=>{try{c.destroy();}catch(e){}});
  for(const k in wlSparklineCharts)delete wlSparklineCharts[k];

  const cards=watchlist.map(w=>{
    const pd=w._price;
    const price=pd?.price;
    const chg=pd?.changePct;
    const name=pd?.name||'';
    const hi52=pd?.high52;const lo52=pd?.low52;
    const volume=pd?.volume;
    const priceStr=price!=null?price.toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:4})+' $':'—';
    const chgStr=chg!=null?`<span style="color:${chg>=0?'var(--green)':'var(--red)'};">${chg>=0?'+':''}${chg.toFixed(2)}%</span>`:'<span style="color:var(--text3);">—</span>';
    const alsoPort=positions.find(p=>p.symbol===w.symbol);
    const portBadge=alsoPort?'<span style="font-size:9px;background:rgba(96,165,250,0.15);color:var(--blue);padding:1px 5px;border-radius:3px;margin-left:4px;">portfolio</span>':'';
    const target=w.alertTarget||'';const stop=w.alertStop||'';
    // Alert indicator
    let alertDot='';
    if(price!=null){
      if(target&&price>=parseFloat(target))alertDot='<span style="font-family:var(--mono);font-size:9px;font-weight:700;color:var(--green);background:rgba(0,255,136,0.1);border:0.5px solid rgba(0,255,136,0.3);padding:1px 5px;border-radius:3px;margin-left:4px;">TGT</span>';
      else if(stop&&price<=parseFloat(stop))alertDot='<span style="font-family:var(--mono);font-size:9px;font-weight:700;color:var(--red);background:rgba(255,77,109,0.1);border:0.5px solid rgba(255,77,109,0.3);padding:1px 5px;border-radius:3px;margin-left:4px;">STP</span>';
    }
    const vol52Range=hi52&&lo52?`<div style="margin-top:6px;"><div style="font-size:9px;color:var(--text3);margin-bottom:2px;">52W : ${lo52.toLocaleString('fr-FR',{maximumFractionDigits:2})} – ${hi52.toLocaleString('fr-FR',{maximumFractionDigits:2})}</div>${price!=null&&hi52&&lo52?`<div style="height:3px;background:var(--bg4);border-radius:2px;overflow:hidden;"><div style="height:100%;width:${Math.max(0,Math.min(100,((price-lo52)/(hi52-lo52))*100)).toFixed(1)}%;background:${chg>=0?'var(--green)':'var(--red)'};border-radius:2px;"></div></div>`:''}
</div>`:'';
    const volStr=volume?`<div style="font-size:9px;color:var(--text3);margin-top:4px;">Vol: ${volume>1e9?(volume/1e9).toFixed(2)+'B':volume>1e6?(volume/1e6).toFixed(1)+'M':volume.toLocaleString()}</div>`:'';
    return`<div class="wl-card">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <div>
          <div style="display:flex;align-items:center;gap:4px;">
            <span class="wl-sym-big">${escapeHtml(w.symbol)}</span>${portBadge}${alertDot}
          </div>
          <div class="wl-name">${escapeHtml(name)}</div>
        </div>
        <div style="text-align:right;">
          <div style="font-family:var(--mono);font-size:15px;font-weight:700;">${priceStr}</div>
          <div style="font-size:12px;margin-top:1px;">${chgStr}</div>
        </div>
      </div>
      <div class="wl-sparkline"><canvas id="sparkline-${wlDomId(w.symbol)}"></canvas></div>
      ${vol52Range}${volStr}
      <div class="wl-alert-row">
        <div style="flex:1;">
          <div class="wl-alert-label" style="color:var(--green);"> Target</div>
          <input class="wl-alert-input" type="number" step="any" placeholder="Prix cible" value="${target}" onchange="updateWlAlert('${escapeJsAttr(w.symbol)}','target',this.value)" />
        </div>
        <div style="flex:1;">
          <div class="wl-alert-label" style="color:var(--red);">Stop</div>
          <input class="wl-alert-input" type="number" step="any" placeholder="Stop loss" value="${stop}" onchange="updateWlAlert('${escapeJsAttr(w.symbol)}','stop',this.value)" />
        </div>
      </div>
      <div style="margin-top:8px;">
        <input type="text" class="wl-alert-input" style="width:100%;" value="${escapeHtml(w.note||'')}" placeholder="Note (raison, thesis, attente…)" onchange="updateWlNote('${escapeJsAttr(w.symbol)}',this.value)" />
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;">
        <span style="font-size:9px;color:var(--text3);">Ajouté ${w.addedAt?new Date(w.addedAt).toLocaleDateString('fr-CA',{month:'short',day:'numeric'}):'—'}</span>
        <button class="btn-danger" onclick="removeFromWatchlist('${escapeJsAttr(w.symbol)}')" style="padding:3px 8px;font-size:10px;">Retirer</button>
      </div>
    </div>`;
  }).join('');
  try {
    body.innerHTML=`<div class="wl-cards-grid">${cards}</div>`;
  } catch(e) {
    console.error('[watchlist] render error:', e);
    body.innerHTML='<div style="color:var(--red);padding:1rem;font-size:12px;">Erreur de rendu watchlist — voir console.</div>';
    return;
  }

  // Render sparklines after DOM update
  requestAnimationFrame(()=>{
    watchlist.forEach(w=>{
      const canvasId='sparkline-'+wlDomId(w.symbol);
      const canvas=document.getElementById(canvasId);
      if(!canvas)return;
      const sparkData=w._spark||[];
      if(sparkData.length<2){canvas.style.opacity='0.3';return;}
      const isUp=sparkData[sparkData.length-1]>=sparkData[0];
      const color=isUp?'#00ff88':'#ff4d6d';
      const ctx=canvas.getContext('2d');
      const grad=ctx.createLinearGradient(0,0,0,40);
      grad.addColorStop(0,isUp?'rgba(0,255,136,0.3)':'rgba(255,77,109,0.3)');
      grad.addColorStop(1,'rgba(0,0,0,0)');
      const ch=new Chart(canvas,{type:'line',data:{labels:sparkData.map((_,i)=>i),datasets:[{data:sparkData,borderColor:color,borderWidth:1.5,fill:true,backgroundColor:grad,tension:0.3,pointRadius:0}]},options:{animation:false,responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{enabled:false}},scales:{x:{display:false},y:{display:false}}}});
      wlSparklineCharts[w.symbol]=ch;
    });
  });
}
function updateWlAlert(sym,type,val){
  const w=watchlist.find(w=>w.symbol===sym);
  if(!w)return;
  if(type==='target')w.alertTarget=val;
  else w.alertStop=val;
  saveWatchlist();
}
async function refreshWatchlist(){
  if(!watchlist.length)return;
  const btn=document.getElementById('wl-refresh-btn');
  const upd=document.getElementById('wl-last-update');
  if(btn){btn.textContent='Chargement…';btn.disabled=true;}
  const symbols=watchlist.map(w=>getTicker(w.symbol)).join(',');
  try{
    // Fetch prix + detail
    const res=await fetch(`/api/prices?symbols=${encodeURIComponent(symbols)}&detail=1`);
    const data=await res.json();
    watchlist.forEach(w=>{
      const t=getTicker(w.symbol);
      const d=data[t];
      if(d&&typeof d==='object'){w._price={price:d.price,changePct:d.changePct,name:d.name,high52:d.high52||null,low52:d.low52||null,volume:d.volume||null};}
      else if(d&&typeof d==='number'){w._price={price:d,changePct:null};}
    });
    // Fetch sparklines (5d history) pour chaque ticker en parallèle
    await Promise.allSettled(watchlist.map(async w=>{
      try{
        const res2=await fetch(`/api/history?symbol=${encodeURIComponent(getTicker(w.symbol))}&range=5d`);
        const hist=await res2.json();
        if(Array.isArray(hist)&&hist.length>1)w._spark=hist.map(h=>h.close);
        else w._spark=[];
      }catch(e){w._spark=[];}
    }));
    renderWatchlist();
    if(upd)upd.textContent='Mis à jour '+new Date().toLocaleTimeString('fr-CA',{hour:'2-digit',minute:'2-digit'});
    // Vérifier alertes prix
    await checkPriceAlerts();
  }catch(e){console.error('[watchlist] fetch error',e);}
  if(btn){btn.textContent='Actualiser';btn.disabled=false;}
}

async function checkPriceAlerts(){
  // Construire liste des alertes déclenchées
  const triggered=[];
  const today=new Date().toISOString().slice(0,10);

  watchlist.forEach(w=>{
    if(!w._price?.price)return;
    const price=w._price.price;
    if(w.alertTarget&&parseFloat(w.alertTarget)>0&&price>=parseFloat(w.alertTarget)){
      triggered.push({symbol:w.symbol,type:'target',price:price.toFixed(2),alertTarget:w.alertTarget});
    }
    if(w.alertStop&&parseFloat(w.alertStop)>0&&price<=parseFloat(w.alertStop)){
      triggered.push({symbol:w.symbol,type:'stop',price:price.toFixed(2),alertStop:w.alertStop});
    }
  });

  if(!triggered.length)return;

  console.log('[alerts] Alertes déclenchées:', triggered.map(a=>a.symbol+' '+a.type).join(', '));

  // Dédup "1 email/jour" gérée côté serveur (user_data.last_alert_date) — fiable
  // même en changeant d'appareil (portable ↔ PC), contrairement à l'ancien localStorage.
  if(!accessToken){console.warn('[alerts] Pas de session active, envoi annulé');return;}
  try{
    const r=await fetch('/api/check-alerts',{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':`Bearer ${accessToken}`},
      body:JSON.stringify({alerts:triggered})
    });
    const data=await r.json();
    if(data.sent>0){
      console.log('[alerts] Email envoyé pour',data.sent,'alerte(s)');
      // Notification visuelle
      const notif=document.createElement('div');
      notif.style.cssText='position:fixed;bottom:24px;right:24px;background:var(--bg2);border:0.5px solid var(--amber);border-radius:10px;padding:12px 18px;font-size:12px;font-weight:600;color:var(--amber);z-index:9999;box-shadow:0 8px 24px rgba(0,0,0,0.4);';
      notif.textContent=`${data.sent} alerte(s) prix envoyée(s) par email`;
      document.body.appendChild(notif);
      setTimeout(()=>notif.remove(),5000);
    }else if(data.reason){
      console.log('[alerts]',data.reason);
    }
  }catch(e){console.warn('[alerts] Envoi email échoué:',e);}
}

// ─── INIT ─────────────────────────────────────────────────────────
async function startApp(){
  document.getElementById('nav-email').textContent=currentUser.email;
  const username=currentUser.user_metadata?.username||currentUser.email.split('@')[0];
  const unEl=document.getElementById('nav-username');if(unEl)unEl.textContent=username.charAt(0).toUpperCase()+username.slice(1);
  document.getElementById('auth-screen').style.display='none';document.getElementById('main-app').style.display='flex';
  document.getElementById('f-date').value=new Date().toISOString().split('T')[0];
  initCharts();
  await loadData();
  await loadStrategies();
  // Bug corrigé 2026-08-03 : cet appel écrasait systématiquement la watchlist déjà chargée
  // depuis Supabase par loadData() (qui gère elle-même le fallback localStorage/migration si
  // besoin) avec le contenu de localStorage['nc_watchlist'] -- vidé par loadData() après
  // migration, donc quasi toujours '[]' au démarrage suivant. C'était la cause principale de
  // "la watchlist ne se sauvegarde pas" (elle se sauvegardait très bien, elle était juste
  // effacée en mémoire 2 lignes plus loin à chaque refresh). loadData() est déjà la seule
  // source de vérité pour watchlist ; ne plus la ré-écraser ici.
  renderWatchlist();
  // Résoudre la devise AVANT de charger l'historique (pour la migration USD→devise)
  const effectiveCur=accountCurrency!=='USD'?accountCurrency:(localStorage.getItem('nc_currency')||'USD');
  accountCurrency=effectiveCur;
  const sel=document.getElementById('currency-select');if(sel)sel.value=accountCurrency;
  // Chart de valeur du portefeuille : toujours repartir sur ALL / $ Valeur / devise du compte
  // à CHAQUE connexion (demandé par Cédric 2026-07-28) — pas de mémoire du dernier choix de session.
  activePeriod='ALL';
  benchmarkMode='absolute';
  chartCurrency=accountCurrency==='USD'?'USD':'CAD';
  document.querySelectorAll('.period-btn').forEach(b=>b.classList.remove('active'));
  document.querySelector('.period-btn[onclick*="\'ALL\'"]')?.classList.add('active');
  document.getElementById('mode-btn-abs')?.classList.add('active');
  document.getElementById('mode-btn-rel')?.classList.remove('active');
  document.getElementById('chart-cur-cad')?.classList.toggle('active',chartCurrency==='CAD');
  document.getElementById('chart-cur-usd')?.classList.toggle('active',chartCurrency==='USD');
  // Charger fxRate en premier — critique pour la migration des snapshots USD
  fxRate=await fetchFxRate(accountCurrency);
  updateFxDisplay();
  // Ancienne migration one-time (cash USD → devise du compte) retirée le 2026-07-22 :
  // le flag était stocké en localStorage (par navigateur/appareil), pas en Supabase.
  // Sur un nouvel appareil (ex: nouveau PC), le flag est absent alors que le cash
  // en base est DÉJÀ dans la devise du compte → le code le reconvertissait une
  // 2e fois (cash × fxRate) et écrivait la valeur gonflée dans Supabase.
  // La migration a fait son travail une fois il y a longtemps ; ce code n'est
  // plus qu'un risque de corruption silencieuse, donc supprimé.
  // Maintenant charger l'historique
  await loadPortfolioHistory();
  // Pré-cacher les taux des devises de positions non-USD et non-accountCurrency
  const posCurrencies=[...new Set(positions.map(p=>getPosCurrency(p)).filter(c=>c!=='USD'&&c!==accountCurrency))];
  await fetchAndCacheFxRates(posCurrencies);
  // Figer le taux FX des entrées existantes qui n'en ont pas encore (voir fxSnapshotFor) —
  // rend l'ACB $CA stable dans le temps au lieu de dériver avec le taux du jour à chaque login.
  if(backfillEntryFxSnapshots())await saveData();
  renderAll();
  if(portfolioHistory.length===0&&positions.length>0){
    const firstTradeDate=trades.length>0?[...trades].sort((a,b)=>a.date.localeCompare(b.date))[0].date:new Date().toISOString().split('T')[0];
    const today=new Date().toISOString().split('T')[0];
    const initialValueCAD=positions.reduce((s,p)=>s+toUSD((p.shares||0)*p.current,getPosCurrency(p)),0)*fxRate+cash;
    await saveSnapshot(initialValueCAD);
    if(firstTradeDate<today){
      await fetch(`${SB_URL}/rest/v1/portfolio_history`,{method:'POST',headers:{...sbHeaders(),'Prefer':'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({user_id:currentUser.id,date:firstTradeDate,value:parseFloat(initialValueCAD.toFixed(2)),currency:accountCurrency,updated_at:new Date().toISOString()})});
      await loadPortfolioHistory();
    }
  }
  fetchLivePrices();
  setInterval(fetchLivePrices,900000);
  showOnboardingIfNeeded();
  checkNewDividends();
}
// ─── DIVIDENDES AUTO-IMPORTÉS : popup au login (demandé par Cédric 2026-08-03) ─────────
// Le cron api/dividends-sync.js ajoute les dividendes détectés avec seen:false. Au login,
// on liste tout ce qui est encore non-vu et on le marque vu après affichage (pas au chargement
// silencieux -- seulement une fois que Cédric a effectivement vu le popup, pour ne rien
// perdre si le navigateur se ferme avant qu'il clique "Compris").
function checkNewDividends(){
  const unseen=trades.filter(t=>t.type==='Dividende'&&t.autoImported&&t.seen===false);
  if(!unseen.length)return;
  const listEl=document.getElementById('new-dividends-list');
  if(listEl){
    const bySymbol={};
    unseen.forEach(t=>{
      const cad=toUSD(t.size||0,getDividendCurrency(t))*fxRate;
      (bySymbol[t.symbol]=bySymbol[t.symbol]||[]).push({date:t.date,account:t.accountType||'—',cad});
    });
    listEl.innerHTML=Object.entries(bySymbol).map(([sym,rows])=>{
      const total=rows.reduce((s,r)=>s+r.cad,0);
      const detail=rows.map(r=>`<div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text3);padding:2px 0;"><span>${r.date} · ${escapeHtml(r.account)}</span><span>${fmtAmtRound(r.cad)}</span></div>`).join('');
      return`<div style="padding:10px 12px;background:var(--bg3);border-radius:8px;margin-bottom:8px;">
        <div style="display:flex;justify-content:space-between;align-items:center;font-family:var(--mono);font-size:13px;font-weight:700;color:var(--text1);"><span>${escapeHtml(sym)}</span><span class="pos">${fmtAmtRound(total)}</span></div>
        <div style="margin-top:4px;">${detail}</div>
      </div>`;
    }).join('');
  }
  const overlay=document.getElementById('new-dividends-modal-overlay');
  if(overlay)overlay.style.display='flex';
}
async function dismissNewDividends(){
  trades.forEach(t=>{if(t.type==='Dividende'&&t.autoImported&&t.seen===false)t.seen=true;});
  const overlay=document.getElementById('new-dividends-modal-overlay');
  if(overlay)overlay.style.display='none';
  await saveData();
}
// ─── ONBOARDING (popup "comment ça marche" à la 1re connexion) ────
function showOnboardingIfNeeded(){
  if(localStorage.getItem('nc_onboarding_seen'))return;
  const el=document.getElementById('onboarding-modal-overlay');
  if(el)el.style.display='flex';
}
function closeOnboarding(){
  const chk=document.getElementById('onboarding-dont-show');
  if(chk&&chk.checked)localStorage.setItem('nc_onboarding_seen','1');
  const el=document.getElementById('onboarding-modal-overlay');
  if(el)el.style.display='none';
}
window.addEventListener('DOMContentLoaded',async()=>{
  const savedTheme=localStorage.getItem('nc_theme')||'dark';setTheme(savedTheme);
  // Détection lien de reset mot de passe (#access_token=xxx&type=recovery)
  const hash=window.location.hash.substring(1);
  if(hash){
    const params=Object.fromEntries(hash.split('&').map(p=>p.split('=')));
    if(params.type==='recovery'&&params.access_token){
      window._resetToken=params.access_token;
      document.getElementById('auth-screen').style.display='flex';
      ['auth-login','auth-signup','auth-forgot'].forEach(id=>{const el=document.getElementById(id);if(el)el.style.display='none';});
      document.getElementById('auth-reset').style.display='block';
      document.querySelector('.auth-tabs').style.display='none';
      return;
    }
  }
  const token=localStorage.getItem('nc_token'),user=localStorage.getItem('nc_user');
  if(token&&user){try{const res=await fetch(`${SB_URL}/auth/v1/user`,{headers:{'apikey':SB_KEY,'Authorization':`Bearer ${token}`}});if(res.ok){accessToken=token;currentUser=JSON.parse(user);await startApp();return;}}catch(e){}}
  localStorage.removeItem('nc_token');localStorage.removeItem('nc_user');document.getElementById('auth-screen').style.display='flex';
});

// ─── LOGIQUE ──────────────────────────────────────────────────────
function calcPnl(p){
  const shares=p.shares||0;
  if(shares>0){
    // avgEntry et current sont dans la même devise (devise de la position)
    const cout=shares*p.avgEntry,val=shares*p.current;
    return p.dir==='Long'?val-cout:cout-val;
  }
  const pct=p.dir==='Long'?(p.current-p.avgEntry)/p.avgEntry:(p.avgEntry-p.current)/p.avgEntry;
  return p.totalSize*pct;
}
function calcPnlUSD(p){return toUSD(calcPnl(p),getPosCurrency(p));}
function getCat(symbol){const found=SYMBOLS.find(s=>s.s===symbol);if(found)return found.cat;if(symbol.includes('/'))return symbol.includes('USD')&&!symbol.includes('EUR')&&!symbol.includes('GBP')?'Crypto':'Forex';return'Action';}
function getAcctClass(acct){if(!acct)return'acc-default';if(acct==='CELI')return'acc-celi';if(acct==='CELIAPP')return'acc-celiapp';if(acct==='REER'||acct==='REEE')return'acc-reer';if(acct==='Marge')return'acc-marge';if(['Coinbase','Binance','Kraken','Bitget','OKX','Bybit','Kucoin','Ledger Nano S','Ledger Nano X','Ledger Stax','Tangem','Trezor Model One','Trezor Model T','MetaMask','Autre wallet'].includes(acct))return'acc-crypto';return'acc-default';}

function updateKPIs(){
  const totalPnlOpenUSD=positions.reduce((s,p)=>s+calcPnlUSD(p),0);
  const totalSizeUSD=getTotalSizeUSD();
  const totalInvestedUSD=positions.reduce((s,p)=>s+toUSD((p.shares||0)*p.avgEntry,getPosCurrency(p)),0);
  const closedTrades=trades.filter(t=>t.type==='Vente');
  const totalPnlRealUSD=closedTrades.reduce((s,t)=>s+toUSD(t.profit||0,getTradeCurrency(t)),0);
  const wins=closedTrades.filter(t=>(t.profit||0)>0).length,losses=closedTrades.filter(t=>(t.profit||0)<=0).length;
  const winRate=closedTrades.length>0?Math.round(wins/closedTrades.length*100):0;
  const pnlPct=totalInvestedUSD>0?(totalPnlOpenUSD/totalInvestedUSD)*100:0;
  // Cash en devise native (CAD) + positions converties → total en CAD
  const totalCAD=totalSizeUSD*fxRate+cash;
  const cashPct=totalCAD>0?(cash/totalCAD*100):0;

  {const _e=document.getElementById('kpi-total');if(_e)_e.textContent=fmtAmtRound(totalCAD);}
  const todayStr=new Date().toISOString().split('T')[0];
  // V1: utiliser totalCAD live comme valeur du jour (pas le snapshot stale)
  const yesterdayPt=portfolioHistory.filter(h=>h.date<todayStr);
  const dayEl=document.getElementById('kpi-day-change');
  if(yesterdayPt.length){
    const yesterdayVal=yesterdayPt[yesterdayPt.length-1].value;
    const dayDiff=totalCAD-yesterdayVal,dayPct=yesterdayVal>0?(dayDiff/yesterdayVal)*100:0;
    const sign=dayDiff>=0?'+':'-';
    if(dayEl){dayEl.textContent=sign+fmtAmt(Math.abs(dayDiff))+' ('+fmtPct(dayPct)+') auj.';dayEl.className='kpi-sub '+(dayDiff>=0?'pos':'neg');}
  }else{if(dayEl){dayEl.textContent='— aujourd\'hui';dayEl.className='kpi-sub neu';}}

  {const _e=document.getElementById('kpi-invested');if(_e)_e.textContent=fmtAmtRound(totalInvestedUSD*fxRate);}
  const oe=document.getElementById('kpi-pnl-open');oe.textContent=fmtPnl$(totalPnlOpenUSD);oe.className='kpi-val '+(totalPnlOpenUSD>=0?'pos':'neg');
  const op=document.getElementById('kpi-pnl-open-pct');op.textContent=fmtPct(pnlPct);op.className='kpi-sub '+(totalPnlOpenUSD>=0?'pos':'neg');
  const re=document.getElementById('kpi-pnl-real');re.textContent=fmtPnl$(totalPnlRealUSD);re.className='kpi-val '+(totalPnlRealUSD>=0?'pos':'neg');
  {const _e=document.getElementById('kpi-trades-count');if(_e)_e.textContent=closedTrades.length+' trades fermés';}
  {const _e=document.getElementById('kpi-cash');if(_e)_e.textContent=fmtAmtRound(cash);} // cash déjà en CAD
  {const _e=document.getElementById('kpi-cash-pct');if(_e)_e.textContent=cashPct.toFixed(1)+'% du portefeuille';}
  const we=document.getElementById('kpi-winrate');we.textContent=winRate+'%';we.className='kpi-val '+(winRate>=50?'pos':'neg');
  {const _e=document.getElementById('kpi-winrate-sub');if(_e)_e.textContent=wins+'W · '+losses+'L';}
  {const _e=document.getElementById('kpi-nb-positions');if(_e)_e.textContent=positions.length;}
}

function renderDashPos(){}

let selectedPosIdx=null;
let expandedDcaIdx=new Set();
let editTarget=null;

function renderTargetStop(p){
  const cur=p.current,target=p.target,stop=p.stop;
  if(!target&&!stop)return'<span style="color:var(--text3);font-size:10px;">—</span>';
  let html='<div style="font-size:10px;line-height:1.6;">';
  if(target){
    const distT=((target-cur)/cur*100);
    const clsT=distT>=0?'var(--green)':'var(--red)';
    const arrow=distT>=0?'↑':'↓';
    html+=`<div style="color:${clsT};">T: ${fmtPrice(target)} <span style="opacity:0.8;">${distT>=0?'+':''}${distT.toFixed(1)}% ${arrow}</span></div>`;
  }
  if(stop){
    const distS=((stop-cur)/cur*100);
    // Stop rouge si proche (< 5% de distance), amber si modéré
    const danger=Math.abs(distS)<5;
    const clsS=danger?'var(--red)':'var(--amber)';
    html+=`<div style="color:${clsS};">S: ${fmtPrice(stop)} <span style="opacity:0.8;">${distS>=0?'+':''}${distS.toFixed(1)}%</span></div>`;
  }
  // Mini barre si les deux sont définis
  if(target&&stop&&cur){
    const lo=Math.min(stop,target),hi=Math.max(stop,target),range=hi-lo;
    if(range>0){
      const pct=Math.max(0,Math.min(100,((cur-lo)/range)*100));
      const isLongSetup=target>stop;
      html+=`<div style="margin-top:3px;height:4px;background:var(--bg3);border-radius:2px;position:relative;">
        <div style="position:absolute;left:0;width:${isLongSetup?pct:100-pct}%;height:100%;background:${pct>50?'var(--green)':'var(--red)'};border-radius:2px;transition:width 0.3s;"></div>
        <div style="position:absolute;left:calc(${pct}% - 2px);top:-1px;width:4px;height:6px;background:var(--text);border-radius:1px;"></div>
      </div>`;
    }
  }
  html+='</div>';
  return html;
}
// Note de provenance (demandée par Cédric, 2026-07-30) : indique si les shares encore ouvertes
// d'une position ont été (en partie) financées par du profit réinvesti, et d'où ce profit vient.
function getProvenanceBadge(p){
  // Clé alignée sur reconstructCashLots() (symbole+compte, fix audit 2026-07-30).
  const list=_cashEntryFunding[p.symbol+'|'+(p.account||'Non spécifié')];
  if(!list||!list.length)return '';
  let profitShares=0,totalShares=0;const chains=new Set();
  list.forEach(e=>{
    totalShares+=e.shares||0;
    const profitFunding=(e.funding||[]).filter(f=>f.type==='profit');
    if(profitFunding.length){
      const profitAmt=profitFunding.reduce((s,f)=>s+f.amount,0);
      const totalAmt=(e.funding||[]).reduce((s,f)=>s+f.amount,0);
      const frac=totalAmt>0?profitAmt/totalAmt:0;
      profitShares+=(e.shares||0)*frac;
      profitFunding.forEach(f=>(f.chain||[]).forEach(hop=>chains.add(hop.symbol)));
    }
  });
  if(profitShares<0.0001)return '';
  const pct=totalShares>0?Math.round(profitShares/totalShares*100):0;
  const chainStr=[...chains].join(' → ')||'inconnue';
  return `<span style="display:inline-block;width:5px;height:5px;background:var(--amber);border-radius:50%;margin-left:5px;vertical-align:middle;" title="Financé à ${pct}% par du profit réinvesti (origine : ${escapeHtml(chainStr)})"></span>`;
}
function posRow(p,idx,displayIdx){
  const shares=p.shares||0,valeurMarche=shares*p.current;
  // P&L calculé en devise de la position (prix courant × shares vs avgEntry × shares)
  // avgEntry et current sont tous les deux dans la devise de la position → cohérent
  const coutPnl=shares*p.avgEntry;
  const pnl=p.dir==='Long'?valeurMarche-coutPnl:coutPnl-valeurMarche;
  const pct=coutPnl>0?(pnl/coutPnl)*100:0,cls=pnl>=0?'pos':'neg';
  // Coût total affiché = somme réelle des achats (peut être en devise différente si DCA mixte)
  const coutTotal=p.entries&&p.entries.length?p.entries.reduce((s,e)=>s+(e.size||0),0):coutPnl;
  const acbCAD=getPositionAcbCAD(p);
  const isDca=p.entries&&p.entries.length>1,firstDate=p.entries&&p.entries[0]?p.entries[0].date:'—';
  // Le badge DCA×N se met à jour automatiquement via entries.length après FIFO
  const sharesStr=shares?shares.toLocaleString('fr-FR',{maximumFractionDigits:6}):'—';
  const curBadge=p.currency&&p.currency!=='USD'?`<span style="font-size:9px;color:var(--amber);margin-left:4px;">${p.currency}</span>`:'';
  const acctBadge=p.account?`<span class="badge-dca ${getAcctClass(p.account)}">${p.account}</span>`:'<span style="color:var(--text3);font-size:10px;">—</span>';
  const isExpanded=expandedDcaIdx.has(idx);
  const isSelected=selectedPosIdx===idx;
  const rowClass=isSelected?'row-selected':'';
  const dcaToggle=isDca?`<span onclick="toggleDcaExpand(${idx},event)" style="cursor:pointer;color:var(--purple);font-size:10px;margin-left:4px;user-select:none;">${isExpanded?'▲':'▼'}</span>`:'';
  let html=`<tr class="${rowClass}" onclick="selectPosRow(${idx})" style="cursor:pointer;">
    <td style="color:var(--text3);font-size:10px;">#${displayIdx+1}</td>
    <td class="sym">${p.symbol}${isDca?`<span class="badge-dca">DCA×${p.entries.length}</span>`:''}${dcaToggle}${curBadge}${p.note?'<span style="display:inline-block;width:5px;height:5px;background:var(--cyan);border-radius:50%;margin-left:5px;vertical-align:middle;" title="'+escapeHtml(p.note)+'"></span>':''}${getProvenanceBadge(p)}</td>
    <td>${acctBadge}</td>
    <td><span class="badge ${p.dir==='Long'?'badge-long':'badge-short'}">${p.dir}</span></td>
    <td style="color:var(--text3);">${firstDate}</td>
    <td style="color:var(--text2);">${sharesStr}</td>
    <td>${fmtPrice(p.avgEntry)}</td>
    <td style="color:var(--text3);">${fmtC(coutTotal,getPosCurrency(p))}</td>
    <td data-sensitive style="color:var(--text3);">${fmtAmtRound(acbCAD)}</td>
    <td>${fmtPrice(p.current)}</td>
    <td>${fmtC(valeurMarche,getPosCurrency(p))}</td>
    <td class="${cls}">${fmtCpnl(pnl,getPosCurrency(p))}</td>
    <td class="${cls}">${fmtPct(pct)}</td>
    <td style="min-width:110px;">${renderTargetStop(p)}</td>
    <td style="display:flex;gap:4px;white-space:nowrap;">
      <button class="btn" onclick="openEditModal(${idx});event.stopPropagation();" style="padding:3px 8px;font-size:9px;">Modifier</button>
      <button class="btn-danger" onclick="openCloseModal(${idx});event.stopPropagation();">Fermer</button>
    </td>
  </tr>`;
  // Note row — appears when row is selected
  if(isSelected){
    const noteVal=escapeHtml(p.note||'');
    html+=`<tr class="pos-note-row">
      <td colspan="15" style="padding:6px 12px 10px 12px;background:rgba(0,255,136,0.04);border-top:none;">
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="font-size:10px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:0.8px;white-space:nowrap;">Note</span>
          <input type="text"
            value="${noteVal}"
            placeholder="Thesis, catalyst, plan de sortie…"
            onchange="updatePosNote(${idx},this.value)"
            onclick="event.stopPropagation()"
            style="flex:1;background:transparent;border:none;border-bottom:0.5px solid var(--border2);color:var(--text2);font-size:12px;font-family:var(--sans);padding:3px 0;outline:none;min-width:0;"
          />
          ${p.note?`<span style="font-size:9px;color:var(--green);">Sauvegardé</span>`:''}
        </div>
      </td>
    </tr>`;
  }
  if(isDca&&isExpanded){
    html+=p.entries.map((e,ei)=>{
      const entryPnlPct=p.current>0?((p.current-e.price)/e.price*100):0;
      const entryPnlCls=entryPnlPct>=0?'pos':'neg';
      return`<tr class="dca-detail-row">
        <td></td><td colspan="2" style="padding-left:20px;color:var(--purple);">└ Achat ${ei+1}</td>
        <td style="color:var(--text3);">${e.date||'—'}</td><td></td>
        <td style="color:var(--text3);">${e.shares?e.shares.toLocaleString('fr-FR',{maximumFractionDigits:6}):'—'}</td>
        <td>${fmtPrice(e.price)}</td>
        <td style="color:var(--text3);">${fmtC(e.size,getPosCurrency(p))}</td>
        <td></td><td></td>
        <td class="${entryPnlCls}">${entryPnlPct>=0?'+':''}${entryPnlPct.toFixed(2)}%</td>
        <td></td><td></td>
      </tr>`;
    }).join('');
  }
  return html;
}

function selectPosRow(idx){selectedPosIdx=selectedPosIdx===idx?null:idx;renderPosTable();}
async function updatePosNote(idx,val){
  if(!positions[idx])return;
  positions[idx].note=val.trim();
  await saveData();
  renderPosTable(); // re-render to show "Sauvegardé"
}

function resetPosFilters(){
  const ids=['pos-filter-cat','pos-filter-account','pos-filter-period'];
  ids.forEach(id=>{const e=document.getElementById(id);if(e)e.value='';});
  sortColumn=null;sortDir='asc';
  selectedPosIdx=null;
  expandedDcaIdx.clear();
  renderPosTable();
}
function toggleDcaExpand(idx,e){e.stopPropagation();if(expandedDcaIdx.has(idx))expandedDcaIdx.delete(idx);else expandedDcaIdx.add(idx);renderPosTable();}

let sortColumn=null,sortDir='asc';
function sortBy(col){
  if(sortColumn===col)sortDir=sortDir==='asc'?'desc':'asc';
  else{sortColumn=col;sortDir='asc';}
  renderPosTable();
}

function getFilteredSortedPositions(){
  const catFilter=document.getElementById('pos-filter-cat')?.value||'';
  const accountFilter=document.getElementById('pos-filter-account')?.value||'';
  const periodFilter=document.getElementById('pos-filter-period')?.value||'';
  let filtered=positions.map((p,i)=>({...p,_origIdx:i}));
  if(catFilter)filtered=filtered.filter(p=>getCat(p.symbol)===catFilter);
  if(accountFilter)filtered=filtered.filter(p=>(p.account||'')===accountFilter);
  if(periodFilter){
    const now=new Date();
    const cutoff=periodFilter==='1m'?new Date(now.getFullYear(),now.getMonth()-1,now.getDate()):periodFilter==='3m'?new Date(now.getFullYear(),now.getMonth()-3,now.getDate()):new Date(now.getFullYear()-1,now.getMonth(),now.getDate());
    filtered=filtered.filter(p=>{const d=p.entries?.[0]?new Date(p.entries[0].date):null;return d&&d>=cutoff;});
  }
  if(sortColumn){
    const dir=sortDir==='asc'?1:-1;
    const getVal=(p)=>{
      switch(sortColumn){
        case'symbol':return p.symbol||'';
        case'account':return p.account||'';
        case'date':return p.entries?.[0]?.date||'';
        case'shares':return p.shares||0;
        case'avgEntry':return p.avgEntry||0;
        case'cost':return toUSD((p.shares||0)*p.avgEntry,getPosCurrency(p));
        case'current':return p.current||0;
        case'value':return toUSD((p.shares||0)*p.current,getPosCurrency(p));
        case'pnl':return calcPnlUSD(p);
        case'pnlPct':{const c=(p.shares||0)*p.avgEntry;return c>0?(calcPnl(p)/c)*100:0;}
        case'acb':return getPositionAcbCAD(p);
        default:return 0;
      }
    };
    filtered.sort((a,b)=>{const va=getVal(a),vb=getVal(b);if(typeof va==='string')return va.localeCompare(vb)*dir;return(va-vb)*dir;});
  }
  return filtered;
}

function updateSortArrows(){
  document.querySelectorAll('th.sortable').forEach(th=>th.classList.remove('active'));
  document.querySelectorAll('.sort-arrow').forEach(s=>s.textContent='⇅');
  if(sortColumn){
    const arrow=document.getElementById('sort-'+sortColumn);
    if(arrow){arrow.textContent=sortDir==='asc'?'↑':'↓';arrow.parentElement.classList.add('active');}
  }
}

let _cashEntryFunding={};
function renderPosTable(){
  const t=document.getElementById('pos-body');if(!t)return;
  // Provenance (profit réinvesti) -- calculée une fois par rendu, pas par ligne.
  try{_cashEntryFunding=reconstructCashLots(true).entryFunding;}catch(e){_cashEntryFunding={};}
  updateSortArrows();
  const filtered=getFilteredSortedPositions();
  const countEl=document.getElementById('pos-count-label');
  if(countEl)countEl.textContent=`${filtered.length} / ${positions.length} positions`;
  t.innerHTML=filtered.length?filtered.map((p,displayIdx)=>posRow(p,p._origIdx,displayIdx)).join(''):`<tr><td colspan="15" class="empty">Aucune position${positions.length?' (filtrée)':' ouverte'}</td></tr>`;
}

function openEditModal(idx){
  editTarget=idx;const p=positions[idx];
  document.getElementById('edit-modal-symbol').textContent=p.symbol;
  document.getElementById('edit-dir').value=p.dir||'Long';
  document.getElementById('edit-date').value=p.entries?.[0]?.date||new Date().toISOString().split('T')[0];
  document.getElementById('edit-avgentry').value=p.avgEntry||'';
  document.getElementById('edit-shares').value=p.shares||'';
  document.getElementById('edit-current').value=p.current||'';
  document.getElementById('edit-currency').value=p.currency||'USD';
  document.getElementById('edit-account').value=p.account||'';
  document.getElementById('edit-target').value=p.target||'';
  document.getElementById('edit-stop').value=p.stop||'';
  document.getElementById('edit-modal-overlay').classList.add('open');
}
function cancelEdit(){editTarget=null;document.getElementById('edit-modal-overlay').classList.remove('open');}
async function confirmEdit(){
  if(editTarget===null)return;
  const p=positions[editTarget];
  p.dir=document.getElementById('edit-dir').value;
  p.avgEntry=parseFloat(document.getElementById('edit-avgentry').value)||p.avgEntry;
  p.shares=parseFloat(document.getElementById('edit-shares').value)||p.shares;
  p.totalSize=p.avgEntry*p.shares;
  p.current=parseFloat(document.getElementById('edit-current').value)||p.current;
  p.currency=tickerCurrency(p.symbol)||document.getElementById('edit-currency').value||p.currency;
  p.account=document.getElementById('edit-account').value;
  const tVal=parseFloat(document.getElementById('edit-target').value);
  const sVal=parseFloat(document.getElementById('edit-stop').value);
  p.target=isNaN(tVal)?null:tVal;
  p.stop=isNaN(sVal)?null:sVal;
  const newDate=document.getElementById('edit-date').value;
  if(p.entries&&p.entries[0]&&newDate)p.entries[0].date=newDate;
  cancelEdit();await saveData();renderAll();
}

function openCloseModal(i){
  closeTarget=i;const p=positions[i];
  document.getElementById('modal-symbol').textContent=p.symbol;
  const isDca=p.entries&&p.entries.length>1,totalShares=p.shares||0;
  document.getElementById('modal-info').textContent='Prix moy. entrée : '+fmtPrice(p.avgEntry)+'  |  Shares : '+(totalShares||'—')+'  |  Valeur : '+fmtC((p.shares||0)*p.current,getPosCurrency(p))+(isDca?'\n'+p.entries.length+' achats DCA':'');
  document.getElementById('modal-exit').value=p.current||'';document.getElementById('modal-shares').value=totalShares||'';
  document.getElementById('modal-shares-hint').textContent=totalShares?'Max : '+totalShares+' shares':'';
  updatePartialSize();document.getElementById('modal-overlay').classList.add('open');setTimeout(()=>document.getElementById('modal-shares').focus(),100);
}
function setPartial(pct){const p=positions[closeTarget];if(!p)return;document.getElementById('modal-shares').value=parseFloat(((p.shares||0)*pct).toFixed(6));updatePartialSize();}
function updatePartialSize(){
  if(closeTarget===null)return;const p=positions[closeTarget];
  const shares=parseFloat(document.getElementById('modal-shares').value),exitPrice=parseFloat(document.getElementById('modal-exit').value),totalShares=p.shares||0;
  if(!isNaN(shares)&&!isNaN(exitPrice)&&totalShares>0){const pct=shares/totalShares,sizeToClose=(p.shares||0)*p.avgEntry*pct;const profit=p.dir==='Long'?(exitPrice-p.avgEntry)/p.avgEntry*sizeToClose:(p.avgEntry-exitPrice)/p.avgEntry*sizeToClose;document.getElementById('modal-preview').textContent='Vendre '+shares+' / '+totalShares+' shares ('+Math.round(pct*100)+'%) · P&L estimé : '+fmtCpnl(profit,getPosCurrency(p))+'  ·  Cash récupéré : '+fmtAmtRound(parseFloat((toUSD(sizeToClose+profit,getPosCurrency(p))*fxRate).toFixed(0)))+' CAD';}
  else document.getElementById('modal-preview').textContent='—';
}
function cancelClose(){closeTarget=null;document.getElementById('modal-overlay').classList.remove('open');}
async function confirmClose(){
  if(closeTarget===null)return;
  const exitPrice=parseFloat(document.getElementById('modal-exit').value),sharesToSell=parseFloat(document.getElementById('modal-shares').value);
  if(isNaN(exitPrice)||isNaN(sharesToSell)||sharesToSell<=0){alert('Entre un prix de sortie et le nombre de shares à vendre.');return;}
  const p=positions[closeTarget],date=new Date().toISOString().split('T')[0];
  const totalShares=p.shares||sharesToSell,pctToSell=sharesToSell/totalShares,sizeToClose=p.totalSize*pctToSell;
  const pnlPct=p.dir==='Long'?(exitPrice-p.avgEntry)/p.avgEntry:(p.avgEntry-exitPrice)/p.avgEntry;
  const profit=parseFloat((sizeToClose*pnlPct).toFixed(2)),montantFinal=parseFloat((sizeToClose+profit).toFixed(2));
  // Libérer cash en devise du compte (CAD)
  const profitUSD=toUSD(profit,getPosCurrency(p)),montantUSD=toUSD(montantFinal,getPosCurrency(p));
  const montantCAD=parseFloat((montantUSD*fxRate).toFixed(2));
  trades.unshift({date,symbol:p.symbol,dir:p.dir,type:'Vente',price:exitPrice,avgEntry:p.avgEntry,size:sizeToClose,profit,profitUSD,montantFinal,montantUSD,shares:sharesToSell,dcaCount:p.entries?p.entries.length:1,currency:getPosCurrency(p),account:p.account||''});
  // Cash resynchronisé depuis les lots (trades + CASH_LOTS_SEED) plutôt qu'un incrément manuel --
  // reflète correctement le split principal/profit et la chaîne de provenance côté compte vendeur.
  syncCashFromLots();
  if(pctToSell>=0.9999){
    positions.splice(closeTarget,1);
  }else{
    p.totalSize-=sizeToClose;
    p.shares-=sharesToSell;
    if(p.shares<0)p.shares=0;
    // FIFO : supprimer les achats les plus anciens jusqu'à couvrir sharesToSell
    if(p.entries&&p.entries.length>0){
      let remaining=sharesToSell;
      while(remaining>0&&p.entries.length>0){
        const oldest=p.entries[0];
        const oldestShares=oldest.shares||0;
        if(oldestShares<=remaining){
          // Cet achat est entièrement consommé → retirer
          remaining-=oldestShares;
          p.entries.shift();
        }else{
          // Achat partiellement consommé → réduire proportionnellement
          const ratio=(oldestShares-remaining)/oldestShares;
          oldest.shares=parseFloat((oldestShares-remaining).toFixed(6));
          oldest.size=parseFloat((oldest.size*ratio).toFixed(2));
          remaining=0;
        }
      }
      // Recalculer avgEntry à partir des entries restantes
      if(p.entries.length>0){
        const totalShR=p.entries.reduce((s,e)=>s+(e.shares||0),0);
        p.avgEntry=totalShR>0?p.entries.reduce((s,e)=>s+(e.price*(e.shares||0)),0)/totalShR:p.avgEntry;
      }
    }
  }
  closeTarget=null;document.getElementById('modal-overlay').classList.remove('open');
  await saveData();renderAll();
}

function populateHistFilters(){
  const histTrades=trades.filter(t=>t.type!=="Cotisation");
  const months=[...new Set(histTrades.map(t=>t.date.slice(0,7)))].sort().reverse();
  const assets=[...new Set(histTrades.map(t=>t.symbol))].sort();
  const mSel=document.getElementById('filter-month'),aSel=document.getElementById('filter-asset');if(!mSel||!aSel)return;
  const curMonth=mSel.value,curAsset=aSel.value;
  mSel.innerHTML='<option value="">Tous les mois</option>'+months.map(m=>`<option value="${m}">${m}</option>`).join('');
  aSel.innerHTML='<option value="">Tous les actifs</option>'+assets.map(a=>`<option value="${a}">${a}</option>`).join('');
  if(curMonth)mSel.value=curMonth;if(curAsset)aSel.value=curAsset;
}
function resetFilters(){const mSel=document.getElementById('filter-month'),aSel=document.getElementById('filter-asset');if(mSel)mSel.value='';if(aSel)aSel.value='';renderHistory();}
function renderHistory(){
  populateHistFilters();
  const filterMonth=document.getElementById('filter-month')?.value||'',filterAsset=document.getElementById('filter-asset')?.value||'';
  const tbody=document.getElementById('hist-body');let wins=0,losses=0,totalPnl=0;
  const filtered=trades.filter(t=>{if(t.type==='Cotisation')return false;if(filterMonth&&!t.date.startsWith(filterMonth))return false;if(filterAsset&&t.symbol!==filterAsset)return false;return true;});
  tbody.innerHTML=filtered.map(t=>{
    if(t.type==='Dépôt'||t.type==='Retrait'){
      const isDeposit=t.type==='Dépôt',color=isDeposit?'var(--green)':'var(--amber)';
      const bs=isDeposit?'background:rgba(45,212,160,0.1);color:var(--green);border:0.5px solid rgba(45,212,160,0.25);':'background:rgba(246,200,67,0.1);color:var(--amber);border:0.5px solid rgba(246,200,67,0.25);';
      const acctBadge=t.accountType?`<span class="badge-compte" style="margin-left:4px;">${t.accountType}</span>`:'';
      const noteTip=t.note?`<span style="font-size:10px;color:var(--text3);margin-left:4px;" title="${escapeHtml(t.note)}">note</span>`:'';
      // cash déjà en CAD depuis migration v2
      return`<tr style="opacity:0.85;"><td>${t.date}</td><td class="sym" style="color:var(--text3);">—</td><td><span class="badge" style="${bs}">${t.type}</span>${acctBadge}${noteTip}</td><td style="color:var(--text3);">—</td><td style="color:${color};">${isDeposit?'+':'-'}${fmtAmt(t.size)}</td><td style="color:var(--text2);">${fmtAmtRound(t.montantFinal)} cash</td><td style="color:var(--text3);">—</td><td style="color:var(--text3);">—</td></tr>`;
    }else if(t.type==='Vente'){
      const profit=t.profit||0;const profitDisp=toUSD(profit,getTradeCurrency(t));totalPnl+=profitDisp;profitDisp>0?wins++:losses++;
      const cls=profitDisp>=0?'pos':'neg',roi=t.size>0?(profit/t.size)*100:0,isDca=t.dcaCount&&t.dcaCount>1;
      return`<tr><td>${t.date}</td><td class="sym">${t.symbol}${isDca?'<span class="badge-dca">DCA×'+t.dcaCount+'</span>':''}</td><td><span class="badge badge-vente">Vente</span></td><td style="color:var(--text3);">${fmtPrice(t.avgEntry||t.price)} → ${fmtPrice(t.price)}</td><td>${fmtC(t.size,t.currency)}</td><td class="${cls}">${fmtC(t.montantFinal||t.size+profit,t.currency)}</td><td class="${cls}">${fmtCpnl(profit,t.currency)}</td><td class="${cls}">${fmtPct(roi)}</td></tr>`;
    }else if(t.type==='Dividende'){
      const acctBadge=t.accountType?`<span class="badge-compte" style="margin-left:4px;">${escapeHtml(t.accountType)}</span>`:'';
      const noteTip=t.note?`<span style="font-size:10px;color:var(--text3);margin-left:4px;" title="${escapeHtml(t.note)}">note</span>`:'';
      return`<tr style="opacity:0.85;"><td>${t.date}</td><td class="sym">${escapeHtml(t.symbol||'—')}</td><td><span class="badge" style="background:rgba(96,165,250,0.1);color:var(--blue);border:0.5px solid rgba(96,165,250,0.25);">Dividende</span>${acctBadge}${noteTip}</td><td style="color:var(--text3);">—</td><td style="color:var(--text2);">${fmtC(t.size,t.currency)}</td><td style="color:var(--text3);">—</td><td style="color:var(--text3);">—</td><td style="color:var(--text3);">—</td></tr>`;
    }else{return`<tr><td>${t.date}</td><td class="sym">${t.symbol}</td><td><span class="badge badge-achat">Achat</span></td><td>${fmtPrice(t.price)}</td><td>${fmtC(t.size,t.currency)}</td><td style="color:var(--text3);">—</td><td style="color:var(--text3);">—</td><td style="color:var(--text3);">—</td></tr>`;}
  }).join('')||'<tr><td colspan="8" class="empty">Aucune transaction</td></tr>';
  const cls=totalPnl>=0?'pos':'neg';
  const sumEl=document.getElementById('hist-summary-inline');
  if(sumEl)sumEl.innerHTML=`<span class="${cls}">${wins+losses} trades filtrés</span>`;

  const countLbl=document.getElementById('hist-count-label');
  if(countLbl)countLbl.textContent=`${filtered.length} transaction${filtered.length!==1?'s':''}`;
  renderAnnualPnl();
  renderAssetReturns();
  renderDividends();
}

function renderAnnualPnl(){
  const el=document.getElementById('annual-pnl-body');if(!el)return;
  const ventes=trades.filter(t=>t.type==='Vente');
  if(!ventes.length){el.innerHTML='<p style="padding:14px;color:var(--text3);font-size:12px;">Aucune vente enregistrée.</p>';return;}
  const byYear={};
  ventes.forEach(t=>{
    const yr=(t.date||'').slice(0,4)||'?';
    if(!byYear[yr])byYear[yr]={count:0,pnlCAD:0,wins:0,best:-Infinity,bestSymbol:'—'};
    const pCAD=toUSD(t.profit||0,getTradeCurrency(t))*fxRate;
    byYear[yr].count++;byYear[yr].pnlCAD+=pCAD;
    if(pCAD>0)byYear[yr].wins++;
    if(pCAD>byYear[yr].best){byYear[yr].best=pCAD;byYear[yr].bestSymbol=t.symbol||'—';}
  });
  const years=Object.keys(byYear).sort((a,b)=>b-a);
  el.innerHTML=`<table style="min-width:550px;"><thead><tr>
    <th>Année</th><th>Trades</th><th>P&L réalisé (CAD)</th><th>Win rate</th><th>Meilleur trade</th>
  </tr></thead><tbody>${years.map(yr=>{
    const d=byYear[yr],cls=d.pnlCAD>=0?'pos':'neg',wr=d.count>0?Math.round(d.wins/d.count*100):0;
    return`<tr>
      <td style="font-weight:600;color:var(--text1);">${yr}</td>
      <td style="color:var(--text2);">${d.count}</td>
      <td class="${cls}" data-sensitive>${fmtCpnl(d.pnlCAD,'CAD')}</td>
      <td style="color:${wr>=50?'var(--green)':'var(--amber)'};">${wr}%</td>
      <td style="color:var(--text2);" data-sensitive>${d.bestSymbol} (${d.best>0?'+':''}${fmtAmtRound(d.best)})</td>
    </tr>`;}).join('')}</tbody></table>`;
}

function updatePnlBar(){
  if(!pnlBarChart)return;
  // Condensé par actif (somme des P&L de tous les trades de vente du symbole) plutôt qu'une
  // barre par trade individuel -- axe des x illisible avec les tickers répétés (demandé par
  // Cédric 2026-08-03). Trié par magnitude absolue décroissante pour mettre les gros
  // contributeurs (positifs et négatifs) en premier.
  const ventes=trades.filter(t=>t.type==='Vente');
  const bySymbol={};
  ventes.forEach(t=>{
    const usd=toUSD(t.profit||0,getTradeCurrency(t))*fxRate;
    bySymbol[t.symbol]=(bySymbol[t.symbol]||0)+usd;
  });
  const rows=Object.entries(bySymbol).sort((a,b)=>Math.abs(b[1])-Math.abs(a[1]));
  pnlBarChart.data.labels=rows.map(r=>r[0]);
  const data=rows.map(r=>parseFloat(r[1].toFixed(2)));
  pnlBarChart.data.datasets[0].data=data;pnlBarChart.data.datasets[0].backgroundColor=data.map(v=>v>=0?'#00ff88':'#ff4d6d');pnlBarChart.update();
}

async function addPosition(){
  const s=document.getElementById('f-symbol').value.trim().toUpperCase(),d=document.getElementById('f-dir').value;
  const dateVal=document.getElementById('f-date').value||new Date().toISOString().split('T')[0];
  const e=parseFloat(document.getElementById('f-entry').value),shares=parseFloat(document.getElementById('f-shares').value);
  const posCurrency=tickerCurrency(s)||document.getElementById('f-currency').value||'USD',cur=parseFloat(document.getElementById('f-current').value),sz=parseFloat(document.getElementById('f-size').value);
  // BUG CRITIQUE corrigé (audit 2026-08-04, signalé par Cédric après un achat TQQQ réel mal
  // attribué) : la version précédente cherchait une position existante par symbole+dir SEUL,
  // en ignorant le compte -- à la fois pour hériter du compte quand le champ est vide, ET pour
  // choisir dans quelle position fusionner ce nouvel achat. Si le même symbole existe dans
  // PLUSIEURS comptes (ex: TQQQ détenu à la fois en CELIAPP et en Comptant), le code piochait
  // silencieusement le premier trouvé -- un achat visant "Comptant" pouvait finir débité du
  // mauvais compte ET fusionné dans la position d'un AUTRE compte, gonflant sa valeur et
  // laissant le compte visé intact. On ne devine plus jamais entre plusieurs comptes candidats :
  // hérite seulement s'il n'existe qu'UN SEUL compte déjà porteur de ce symbole+dir, sinon la
  // sélection explicite est requise (bloqué plus bas si le compte reste vide).
  const matchingPositions=positions.filter(p=>p.symbol===s&&p.dir===d);
  const distinctAccounts=[...new Set(matchingPositions.map(p=>p.account||''))].filter(Boolean);
  const account=document.getElementById('f-account').value||(distinctAccounts.length===1?distinctAccounts[0]:'')||'';
  const targetVal=parseFloat(document.getElementById('f-target').value)||null;
  const stopVal=parseFloat(document.getElementById('f-stop').value)||null;
  if(!s||isNaN(e)||isNaN(shares)||isNaN(cur)||isNaN(sz)){alert('Remplis tous les champs (symbole, prix, shares, prix actuel).');return;}
  // Compte réel requis (durci le 2026-07-30, sur demande de Cédric) -- plus de "Non spécifié"
  // silencieux : sans compte, impossible de savoir dans quel cash piger, donc on bloque.
  if(!account){alert('Sélectionne un compte pour cet achat — requis pour vérifier le cash disponible (plus de "Non spécifié" automatique).');return;}
  // Blocage si cash insuffisant dans le compte visé (demandé par Cédric, 2026-07-30).
  // reconstructCashLots() est toujours recalculé à la volée depuis trades + CASH_LOTS_SEED,
  // jamais une valeur stockée qui pourrait dériver de la réalité.
  {
    const acctKey=account;
    const{accounts}=reconstructCashLots(true);
    const state=accounts[acctKey]||_clMakeAccount();
    const clone={principal:state.principal.map(l=>({...l})),profit:state.profit.map(l=>({...l}))};
    const{shortfall}=_clConsume(clone,sz,posCurrency);
    if(shortfall>0.01){
      const availCAD=_clAccountTotalCAD(state);
      alert(`Achat bloqué : cash insuffisant dans "${acctKey}".\nDisponible : ${fmtAmtRound(availCAD)} CAD\nBesoin pour cet achat : ${fmtAmtRound(fxConvert(sz,posCurrency,'CAD'))} CAD (manque ${fmtAmtRound(fxConvert(shortfall,posCurrency,'CAD'))} CAD)`);
      return;
    }
  }
  trades.unshift({date:dateVal,symbol:s,dir:d,type:'Achat',price:e,shares,size:sz,currency:posCurrency,account});
  // Fusion UNIQUEMENT dans une position du MÊME compte (jamais par symbole+dir seul, cf.
  // fix ci-dessus) -- si le symbole existe déjà mais dans un autre compte, on crée une
  // nouvelle position distincte pour ce compte, comme prévu par la fonctionnalité "par compte".
  const existing=positions.find(p=>p.symbol===s&&p.dir===d&&(p.account||'')===account);
  if(existing){
    const newTotal=existing.totalSize+sz;
    const existingShares=existing.shares||0;
    existing.avgEntry=(existingShares>0&&shares>0)?(existing.avgEntry*existingShares+e*shares)/(existingShares+shares):e;
    existing.totalSize=newTotal;
    existing.current=cur;
    existing.shares=existingShares+shares;
    existing.currency=posCurrency;
    if(account)existing.account=account;
    if(targetVal)existing.target=targetVal;
    if(stopVal)existing.stop=stopVal;
    existing.entries=existing.entries||[];
    existing.entries.push({price:e,shares,size:sz,date:dateVal,fxSnapshot:fxSnapshotFor(posCurrency)});
  }
  else positions.push({symbol:s,dir:d,avgEntry:e,current:cur,totalSize:sz,shares,currency:posCurrency,account,target:targetVal,stop:stopVal,entries:[{price:e,shares,size:sz,date:dateVal,fxSnapshot:fxSnapshotFor(posCurrency)}]});
  ['f-symbol','f-entry','f-shares','f-current','f-size','f-target','f-stop'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('f-currency').value='USD';document.getElementById('f-account').value='';document.getElementById('f-date').value=new Date().toISOString().split('T')[0];
  document.getElementById('symbol-dropdown').classList.remove('open');
  syncCashFromLots();
  await saveData();renderAll();
}

let cashType='depot';
function setCashType(type){
  cashType=type;
  const d=document.getElementById('cash-type-depot'),r=document.getElementById('cash-type-retrait');
  if(type==='depot'){d.style.cssText='flex:1;padding:10px;background:rgba(45,212,160,0.15);border:1px solid rgba(45,212,160,0.4);color:var(--green);border-radius:8px;cursor:pointer;font-size:12px;font-weight:600;';r.style.cssText='flex:1;padding:10px;background:var(--bg3);border:1px solid var(--border2);color:var(--text2);border-radius:8px;cursor:pointer;font-size:12px;';}
  else{d.style.cssText='flex:1;padding:10px;background:var(--bg3);border:1px solid var(--border2);color:var(--text2);border-radius:8px;cursor:pointer;font-size:12px;';r.style.cssText='flex:1;padding:10px;background:rgba(246,200,67,0.12);border:1px solid rgba(246,200,67,0.35);color:var(--amber);border-radius:8px;cursor:pointer;font-size:12px;font-weight:600;';}
  // Compte visible pour Dépôt ET Retrait depuis le 2026-07-30 (Phase 2 -- requis pour savoir
  // dans quel compte ajouter/retirer le lot de cash). Justificatif toujours retrait seulement.
  const acctWrap=document.getElementById('cash-account-wrap');
  const noteWrap=document.getElementById('cash-note-wrap');
  if(acctWrap)acctWrap.style.display='block';
  if(noteWrap)noteWrap.style.display=type==='retrait'?'block':'none';
  updateCashPreview();
}
async function updateCashPreview(){
  const amt=parseFloat(document.getElementById('cash-input')?.value),inputCur=document.getElementById('cash-currency-input')?.value||'USD';
  const hint=document.getElementById('cash-convert-hint'),preview=document.getElementById('cash-preview-current');
  if(preview)preview.textContent=fmtAmtRound(cash); // cash déjà en CAD
  if(!isNaN(amt)&&amt>0&&hint){
    const amtInCAD=toUSD(amt,inputCur)*fxRate;
    if(inputCur!==accountCurrency)hint.textContent=`${amt} ${inputCur} → ${fmtAmt(amtInCAD)}`;
    else hint.textContent='';
  }else if(hint)hint.textContent='';
}
function toggleCashPopup(e){e.stopPropagation();document.getElementById('cash-modal-overlay').classList.add('open');const p=document.getElementById('cash-preview-current');if(p)p.textContent=fmtAmtRound(cash);setTimeout(()=>document.getElementById('cash-input').focus(),100);}
function closeCashPopup(){
  document.getElementById('cash-modal-overlay').classList.remove('open');
  document.getElementById('cash-input').value='';
  const noteEl=document.getElementById('cash-note');if(noteEl)noteEl.value='';
  const acctEl=document.getElementById('cash-account-type');if(acctEl)acctEl.value='';
}
async function updateCash(){
  const inputAmt=parseFloat(document.getElementById('cash-input').value);if(isNaN(inputAmt)||inputAmt<=0){alert('Entre un montant valide.');return;}
  const inputCur=document.getElementById('cash-currency-input')?.value||'USD',date=new Date().toISOString().split('T')[0],type=cashType==='depot'?'Dépôt':'Retrait';
  // Compte requis pour les deux types depuis le 2026-07-30 (Phase 2) -- nécessaire pour savoir
  // dans quel compte ajouter/retirer le lot de cash.
  const accountType=document.getElementById('cash-account-type')?.value||'';
  const note=document.getElementById('cash-note')?.value.trim()||'';
  // Compte réel requis (durci le 2026-07-30, sur demande de Cédric) -- plus de "Non spécifié"
  // silencieux, pour Dépôt ET Retrait.
  if(!accountType){alert('Sélectionne un compte — requis pour le suivi du cash par compte (plus de "Non spécifié" automatique).');return;}
  // Blocage si retrait insuffisant dans le compte visé (durci le 2026-07-30, sur demande de
  // Cédric -- même règle que pour un achat). reconstructCashLots() recalculé à la volée.
  if(type==='Retrait'){
    const{accounts}=reconstructCashLots(true);
    const state=accounts[accountType]||_clMakeAccount();
    const clone={principal:state.principal.map(l=>({...l})),profit:state.profit.map(l=>({...l}))};
    const{shortfall}=_clConsume(clone,inputAmt,inputCur);
    if(shortfall>0.01){
      const availCAD=_clAccountTotalCAD(state);
      alert(`Retrait bloqué : cash insuffisant dans "${accountType}".\nDisponible : ${fmtAmtRound(availCAD)} CAD\nMontant demandé : ${fmtAmtRound(fxConvert(inputAmt,inputCur,'CAD'))} CAD (manque ${fmtAmtRound(fxConvert(shortfall,inputCur,'CAD'))} CAD)`);
      return;
    }
  }
  // Convertir le montant en devise du compte (CAD) -- gardé pour affichage/rétrocompat, mais
  // originalAmt/originalCurrency (natif) sont la source de vérité pour reconstructCashLots().
  const amtCAD=parseFloat((toUSD(inputAmt,inputCur)*fxRate).toFixed(2));
  const tradeEntry={date,symbol:'CASH',dir:'—',type,price:0,size:amtCAD,profit:0,currency:accountCurrency,originalAmt:inputAmt,originalCurrency:inputCur,accountType};
  if(note)tradeEntry.note=note;
  trades.unshift(tradeEntry);
  // Cash resynchronisé depuis les lots (trades + CASH_LOTS_SEED), jamais une valeur qui dérive.
  const newCash=syncCashFromLots();
  tradeEntry.montantFinal=newCash;tradeEntry.cashBalance=newCash;
  closeCashPopup();await saveData();renderAll();updatePerfChart();
}

function switchTab(name,el){
  document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));document.querySelectorAll('.nav-tab').forEach(t=>t.classList.remove('active'));
  document.getElementById('tab-'+name).classList.add('active');el.classList.add('active');
  if(name==='watchlist'){renderWatchlist();refreshWatchlist();}
  if(name==='strategie'){renderStratPerf();}
  if(name==='allocation'){renderAnalytics();}
  if(name==='allocation')renderAllocCharts();
}
function togglePosForm(){
  const body=document.getElementById('pos-form-body');
  const btn=document.getElementById('pos-form-toggle');
  if(!body)return;
  const collapsed=body.classList.toggle('collapsed');
  btn.classList.toggle('collapsed',collapsed);
  localStorage.setItem('nc_pos_form_collapsed',collapsed?'1':'0');
}
function toggleCotisHistory(){
  const body=document.getElementById('contributions-history-body');
  const btn=document.getElementById('cotis-hist-toggle');
  if(!body)return;
  const collapsed=body.classList.toggle('collapsed');
  btn?.classList.toggle('collapsed',collapsed);
  localStorage.setItem('nc_cotis_hist_collapsed',collapsed?'1':'0');
}
function initCotisHistoryState(){
  if(localStorage.getItem('nc_cotis_hist_collapsed')==='1'){
    document.getElementById('contributions-history-body')?.classList.add('collapsed');
    document.getElementById('cotis-hist-toggle')?.classList.add('collapsed');
  }
}
function initPosFormState(){
  if(localStorage.getItem('nc_pos_form_collapsed')==='1'){
    const body=document.getElementById('pos-form-body');
    const btn=document.getElementById('pos-form-toggle');
    if(body){body.style.transition='none';body.classList.add('collapsed');requestAnimationFrame(()=>{body.style.transition='';});}
    if(btn)btn.classList.add('collapsed');
  }
}
function setPeriod(p,el){document.querySelectorAll('.period-btn').forEach(b=>b.classList.remove('active'));el.classList.add('active');activePeriod=p;updatePerfChart();}
function getFilteredHistory(){
  const display=getDisplayHistory();
  if(!display.length)return[];
  const now=new Date();let cutoff;
  if(activePeriod==='1W')cutoff=new Date(now.getFullYear(),now.getMonth(),now.getDate()-7);
  else if(activePeriod==='1M')cutoff=new Date(now.getFullYear(),now.getMonth()-1,now.getDate());
  else if(activePeriod==='3M')cutoff=new Date(now.getFullYear(),now.getMonth()-3,now.getDate());
  else if(activePeriod==='YTD')cutoff=new Date(now.getFullYear(),0,1);
  else cutoff=new Date('2000-01-01');
  return display.filter(h=>new Date(h.date)>=cutoff);
}
// ─── BENCHMARK ────────────────────────────────────────────────────

async function fetchSpyHistory(range){
  if(spyCache[range])return spyCache[range];
  try{
    const res=await fetch(`/api/history?symbol=SPY&range=${range}`);
    const data=await res.json();
    if(Array.isArray(data)&&data.length>0){spyCache[range]=data;return data;}
  }catch(e){console.warn('[benchmark] SPY fetch failed:',e.message);}
  return[];
}
function findSpyPrice(spyMap,date){
  // Prix exact ou dernier jour de trading précédent
  if(spyMap.has(date))return spyMap.get(date);
  // Chercher le dernier jour précédent (max 7 jours)
  const d=new Date(date);
  for(let i=1;i<=7;i++){d.setDate(d.getDate()-1);const ds=d.toISOString().split('T')[0];if(spyMap.has(ds))return spyMap.get(ds);}
  return null;
}
function setBenchmarkMode(mode,el){
  benchmarkMode=mode;
  document.getElementById('mode-btn-abs')?.classList.remove('active');
  document.getElementById('mode-btn-rel')?.classList.remove('active');
  if(el)el.classList.add('active');
  updatePerfChart();
}
function setChartCurrency(cur,el){
  chartCurrency=cur;
  document.getElementById('chart-cur-cad')?.classList.remove('active');
  document.getElementById('chart-cur-usd')?.classList.remove('active');
  if(el)el.classList.add('active');
  updatePerfChart();
}
function updatePerfChart(){
  if(!perfChart)return;
  const filtered=getFilteredHistory();
  const existingMsg=document.getElementById('perf-chart-empty');if(existingMsg)existingMsg.remove();
  if(filtered.length<2){
    perfChart.data.labels=[];
    perfChart.data.datasets[0].data=[];
    if(perfChart.data.datasets[1])perfChart.data.datasets[1].data=[];
    perfChart.update();
    const chartWrap=document.querySelector('#tab-dashboard .chart-wrap');
    if(chartWrap&&!document.getElementById('perf-chart-empty')){
      const msg=document.createElement('div');msg.id='perf-chart-empty';
      msg.style.cssText='position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:var(--mono);font-size:11px;color:var(--text3);pointer-events:none;text-align:center;padding:0 1rem;';
      msg.textContent='En attente de données historiques — reviens demain pour voir ta courbe.';
      chartWrap.appendChild(msg);
    }
    return;
  }
  const step=Math.max(1,Math.floor(filtered.length/60));
  const sampled=filtered.filter((_,i)=>i%step===0||i===filtered.length-1);

  // Fetch SPY en parallèle
  // Toujours fetch 5y SPY pour l'alignement depuis le début du portfolio
  fetchSpyHistory('5y').then(spyRaw=>{
    const spyMap=new Map(spyRaw.map(p=>[p.date,p.close]));
    // Aligner SPY sur le premier snapshot du portfolio (ALL-TIME)
    // → peu importe la période sélectionnée, la courbe SPY est toujours calibrée depuis le début
    let spyPriceStart=null;
    let portStart=null;
    const allHistory=portfolioHistory.length>0?portfolioHistory:sampled;
    for(let i=0;i<allHistory.length;i++){
      const sp=findSpyPrice(spyMap,allHistory[i].date);
      if(sp){spyPriceStart=sp;portStart=allHistory[i].value;break;}
    }
    // Inject live value as last point so chart matches KPI (must be before portStart fallback)
    const totalSizeUSD=getTotalSizeUSD();
    const liveVal=parseFloat((totalSizeUSD*fxRate+cash).toFixed(2));
    const todayStr2=new Date().toISOString().slice(0,10);
    const sampledWithLive=sampled.map((h,i)=>i===sampled.length-1?{...h,value:liveVal,date:todayStr2}:h);

    if(!spyPriceStart){portStart=sampledWithLive[0].value;}
    const alignIdx=0; // toujours depuis le début pour le display

    perfChart.data.labels=sampledWithLive.map(h=>h.date.slice(5));

    const curDiv=chartCurrency==='USD'?(fxRate||1):1;
    const portStartDisp=portStart/curDiv;
    // ═══════════════════════════════════════════════════════════════════
    // MODE ABSOLU ($)
    // ─ Portfolio  : valeur totale réelle
    // ─ Benchmark  : cash-flow adjusted — le SPY "reçoit" chaque dépôt/retrait
    //                au même prix que le jour où tu l'as fait
    //   benchValue(t) = Σ cf.amount × (spyNow / spyAtCf)  pour cf.date ≤ t
    //   Seuls les dépôts APRÈS l'inception sont ajoutés (l'inception = portStart)
    // ═══════════════════════════════════════════════════════════════════
    const cfWithSpy=[];
    if(spyPriceStart&&allHistory.length>0){
      const inceptionSpy=findSpyPrice(spyMap,allHistory[0].date)||spyPriceStart;
      cfWithSpy.push({date:allHistory[0].date,amount:allHistory[0].value,spyAtCf:inceptionSpy});
      trades.filter(t=>t.type==='Dépôt'||t.type==='Retrait').forEach(t=>{
        if(t.date>allHistory[0].date){
          const sp=findSpyPrice(spyMap,t.date);
          if(sp)cfWithSpy.push({date:t.date,amount:t.type==='Dépôt'?t.size:-t.size,spyAtCf:sp});
        }
      });
      cfWithSpy.sort((a,b)=>a.date.localeCompare(b.date));
    }
    const calcBench=(pointDate,spyNow)=>{
      const active=cfWithSpy.filter(cf=>cf.date<=pointDate);
      if(!active.length)return null;
      return active.reduce((sum,cf)=>sum+cf.amount*(spyNow/cf.spyAtCf),0);
    };

    // ═══════════════════════════════════════════════════════════════════
    // MODE % (RELATIF) — Time-Weighted Return (TWR)
    // ─ Portfolio  : TWR — exclut l'effet des dépôts/retraits du rendement
    //                Un dépôt = capital, pas une performance
    //   Algo : à chaque dépôt, on capture le rendement de la sous-période
    //          (valeur avant dépôt / valeur au dernier checkpoint),
    //          puis on reset le checkpoint à la valeur post-dépôt.
    //   Sans dépôt → identique à (value/portStart - 1), rétrocompatible.
    // ─ Benchmark  : rendement pur du SPY depuis l'inception
    //                (spyNow / spyInception - 1) — pas affecté par les dépôts
    // ═══════════════════════════════════════════════════════════════════
    const depositsForTWR=trades
      .filter(t=>(t.type==='Dépôt'||t.type==='Retrait')&&t.date>allHistory[0].date)
      .map(t=>({date:t.date,amount:t.type==='Dépôt'?t.size:-t.size}));
    const sortedHistTWR=[...allHistory].sort((a,b)=>a.date.localeCompare(b.date));
    let twrFactor=1.0,twrBase=sortedHistTWR[0]?.value||portStart;
    const twrMap=new Map();
    for(let i=0;i<sortedHistTWR.length;i++){
      const {date,value}=sortedHistTWR[i];
      const prevDate=i>0?sortedHistTWR[i-1].date:null;
      // Somme des dépôts/retraits entre le snapshot précédent (excl.) et celui-ci (incl.)
      const periodDep=depositsForTWR
        .filter(d=>(!prevDate||d.date>prevDate)&&d.date<=date)
        .reduce((s,d)=>s+d.amount,0);
      if(periodDep!==0&&twrBase>0){
        // Valeur AVANT le dépôt = snapshot actuel - dépôt de la période
        const valBefore=value-periodDep;
        twrFactor*=Math.max(0.001,valBefore)/twrBase;
        twrBase=value; // nouveau point de référence post-dépôt
      }
      twrMap.set(date,{f:twrFactor,base:twrBase});
    }
    // Point live (aujourd'hui) : utilise le dernier état TWR connu
    const lastTwrEntry=twrMap.get(sortedHistTWR[sortedHistTWR.length-1]?.date);
    if(lastTwrEntry)twrMap.set(todayStr2,lastTwrEntry);

    if(benchmarkMode==='absolute'){
      perfChart.data.datasets[0].data=sampledWithLive.map(h=>parseFloat((h.value/curDiv).toFixed(2)));
      perfChart.data.datasets[1].data=cfWithSpy.length?sampledWithLive.map((h,i)=>{
        if(i<alignIdx)return null;
        const sp=findSpyPrice(spyMap,h.date);
        if(!sp)return null;
        const bv=calcBench(h.date,sp);
        return bv!==null?parseFloat((bv/curDiv).toFixed(2)):null;
      }):[];
      perfChart.options.scales.y.ticks.callback=v=>chartCurrency==='USD'?Math.round(v).toLocaleString('fr-FR')+' US$':fmtAmtRound(v);
    }else{
      // Portfolio : TWR (rendement pur, dépôts exclus)
      perfChart.data.datasets[0].data=sampledWithLive.map(h=>{
        const e=twrMap.get(h.date);
        if(!e)return parseFloat(((h.value/portStart-1)*100).toFixed(2)); // fallback
        return parseFloat(((e.f*(h.value/e.base)-1)*100).toFixed(2));
      });
      // Benchmark : rendement SPY depuis l'inception (comparable au TWR)
      perfChart.data.datasets[1].data=spyPriceStart?sampledWithLive.map((h,i)=>{
        if(i<alignIdx)return null;
        const sp=findSpyPrice(spyMap,h.date);
        return sp?parseFloat(((sp/spyPriceStart-1)*100).toFixed(2)):null;
      }):[];
      perfChart.options.scales.y.ticks.callback=v=>v.toFixed(1)+'%';
    }
    perfChart.update();
  }).catch(e=>console.warn("[chart] updatePerfChart error:",e));
}

// ─── ALLOCATION ───────────────────────────────────────────────────
const COLORS=['#00ff88','#00d9ff','#ffb547','#ff4d6d','#a78bfa','#fb923c','#4ade80','#e879f9','#f43f5e','#6ee7b7','#fcd34d','#94a3b8'];
// Tooltip externe en HTML pour les petits donuts (ex. cashLotsChart 90x90px) — demandé par
// Cédric 2026-08-03 : le tooltip natif de Chart.js est dessiné DANS le canvas, donc
// physiquement coupé quand le canvas est petit ou logé dans une carte overflow:hidden.
// Un div HTML positionné en fixed, ajouté à <body>, n'est jamais borné par un parent.
let _donutTooltipEl=null;
function getDonutTooltipEl(){
  if(_donutTooltipEl)return _donutTooltipEl;
  const el=document.createElement('div');
  el.id='donut-ext-tooltip';
  el.style.cssText='position:fixed;pointer-events:none;z-index:9999;background:var(--bg2);border:0.5px solid var(--border2);border-radius:8px;padding:8px 12px;font-size:11px;font-family:var(--sans);color:var(--text2);box-shadow:0 8px 24px rgba(0,0,0,0.4);opacity:0;transition:opacity 0.1s;white-space:nowrap;line-height:1.6;';
  document.body.appendChild(el);
  _donutTooltipEl=el;
  return el;
}
function externalDonutTooltip(context){
  const{chart,tooltip}=context;
  const el=getDonutTooltipEl();
  if(tooltip.opacity===0){el.style.opacity=0;return;}
  if(tooltip.body){
    const lines=tooltip.body.map(b=>b.lines).flat();
    el.innerHTML=lines.map(l=>`<div>${l.replace(/</g,'&lt;')}</div>`).join('');
  }
  const rect=chart.canvas.getBoundingClientRect();
  el.style.opacity=1;
  // Clampé pour rester dans le viewport (évite de se faire couper près des bords d'écran).
  const tw=el.offsetWidth,th=el.offsetHeight;
  let left=rect.left+tooltip.caretX;
  let top=rect.top+tooltip.caretY-th-10;
  left=Math.max(8,Math.min(left,window.innerWidth-tw-8));
  if(top<8)top=rect.top+tooltip.caretY+10; // pas assez de place au-dessus → afficher en dessous
  el.style.left=left+'px';
  el.style.top=top+'px';
  el.style.transform='none';
}
function mkDonut(id,labels,data,colors){
  const el=document.getElementById(id);if(!el)return null;
  return new Chart(el,{type:'doughnut',data:{labels,datasets:[{data,backgroundColor:colors,borderWidth:0,hoverOffset:6}]},options:{responsive:true,maintainAspectRatio:false,cutout:'68%',plugins:{legend:{display:false},tooltip:{enabled:false,external:externalDonutTooltip,callbacks:{label:ctx=>' '+ctx.label+': '+ctx.parsed.toFixed(1)+'%'}}}}});
}
function mkDonutData(items,totalUSD){
  const labels=items.map(i=>i.label);
  const values=items.map(i=>totalUSD>0?parseFloat((toUSD(i.val,i.cur||'USD')/totalUSD*100).toFixed(1)):0);
  return{labels,values};
}
function buildLegend(containerId,labels,values,colors){
  const el=document.getElementById(containerId);if(!el)return;
  el.innerHTML=labels.map((l,i)=>`<div class="donut-leg-row"><span class="donut-dot" style="background:${colors[i]||'#fff'};"></span>${l}<span class="donut-pct">${values[i]}%</span></div>`).join('');
}
function updateDonut(chart,labels,values,colors){
  if(!chart)return;chart.data.labels=labels;chart.data.datasets[0].data=values;chart.data.datasets[0].backgroundColor=colors;chart.update();
}

// Pie chart 2 niveaux (compte + type) demandé par Cédric le 2026-07-30 : chaque compte a 2
// tranches (Principal / Profit réinvesti), même couleur de base mais teinte différente pour
// les regrouper visuellement dans la légende.
function renderCashLotsChart(){
  if(!cashLotsChart)return;
  const{accounts}=reconstructCashLots(true);
  const acctNames=Object.keys(accounts).filter(name=>_clAccountTotalCAD(accounts[name])>0.01).sort((a,b)=>_clAccountTotalCAD(accounts[b])-_clAccountTotalCAD(accounts[a]));
  const total=acctNames.reduce((s,name)=>s+_clAccountTotalCAD(accounts[name]),0);
  const labels=[],values=[],colors=[];
  acctNames.forEach((name,i)=>{
    const state=accounts[name];
    const principalCAD=state.principal.reduce((s,l)=>s+fxConvert(l.amount,l.currency,'CAD'),0);
    const profitCAD=state.profit.reduce((s,l)=>s+fxConvert(l.amount,l.currency,'CAD'),0);
    const baseColor=COLORS[i%COLORS.length];
    if(principalCAD>0.01){labels.push(`${name} — Principal`);values.push(total>0?parseFloat((principalCAD/total*100).toFixed(1)):0);colors.push(baseColor);}
    if(profitCAD>0.01){labels.push(`${name} — Profit`);values.push(total>0?parseFloat((profitCAD/total*100).toFixed(1)):0);colors.push(baseColor+'70');}
  });
  updateDonut(cashLotsChart,labels,values,colors);
  buildLegend('cash-lots-chart-legend',labels,values,colors);
  // Ventilation par devise native (pas convertie) — demandé par Cédric 2026-08-03.
  const splitEl=document.getElementById('kpi-cash-currency-split');
  if(splitEl){
    let cad=0,usd=0,other=0;
    acctNames.forEach(name=>{
      const state=accounts[name];
      ['principal','profit'].forEach(type=>{
        state[type].forEach(l=>{
          if(l.currency==='CAD')cad+=l.amount;
          else if(l.currency==='USD')usd+=l.amount;
          else other+=fxConvert(l.amount,l.currency,'CAD');
        });
      });
    });
    const fmt=n=>n.toLocaleString('fr-CA',{minimumFractionDigits:0,maximumFractionDigits:0});
    splitEl.textContent=`${fmt(cad)} $ CAD · ${fmt(usd)} $ USD`+(other>0.5?` · ${fmt(other)} $ autre`:'');
  }
}
function renderAllocDashboard(){
  if(!cashAllocChart)return;
  renderCashLotsChart();
  const totalSizeUSD=getTotalSizeUSD();

  // Par symbole
  if(totalSizeUSD>0){
    const syms=positions.map(p=>({label:p.symbol,val:(p.shares||0)*p.current,cur:getPosCurrency(p)}));
    const{labels,values}=mkDonutData(syms,totalSizeUSD);
    updateDonut(allocChart,labels,values,COLORS.slice(0,labels.length));
    buildLegend('alloc-legend',labels,values,COLORS.slice(0,labels.length));
  }

  // Par catégorie
  if(totalSizeUSD>0){
    const cats={};positions.forEach(p=>{const c=getCat(p.symbol);cats[c]=(cats[c]||0)+toUSD((p.shares||0)*p.current,getPosCurrency(p));});
    const labels=Object.keys(cats),values=labels.map(c=>parseFloat((cats[c]/totalSizeUSD*100).toFixed(1)));
    updateDonut(allocCatDashChart,labels,values,COLORS.slice(0,labels.length));
    buildLegend('alloc-cat-dash-legend',labels,values,COLORS.slice(0,labels.length));
  }

  // Cash vs Positions
  const totalCADDash=totalSizeUSD*fxRate+cash;
  if(totalCADDash>0){
    const labels=['Positions','Cash'];
    const values=[parseFloat((totalSizeUSD*fxRate/totalCADDash*100).toFixed(1)),parseFloat((cash/totalCADDash*100).toFixed(1))];
    updateDonut(cashAllocChart,labels,values,['#00ff88','#00d9ff']);
    buildLegend('cash-alloc-legend',labels,values,['#00ff88','#00d9ff']);
  }

  // P&L par classe (dashboard)
  if(assetPerfDashChart){
    const catPnl={};positions.forEach(p=>{const c=getCat(p.symbol);catPnl[c]=(catPnl[c]||0)+calcPnlUSD(p)*fxRate;});
    assetPerfDashChart.data.labels=Object.keys(catPnl);
    const vals=Object.values(catPnl).map(v=>parseFloat(v.toFixed(2)));
    assetPerfDashChart.data.datasets[0].data=vals;
    assetPerfDashChart.data.datasets[0].backgroundColor=vals.map(v=>v>=0?'#00ff88':'#ff4d6d');
    assetPerfDashChart.update();
  }
}

const ACCT_COLORS=[
  {bg:'rgba(0,255,136,0.12)',text:'var(--green)',bar:'#00ff88'},
  {bg:'rgba(0,217,255,0.12)',text:'var(--cyan)',bar:'#00d9ff'},
  {bg:'rgba(255,181,71,0.12)',text:'var(--amber)',bar:'#ffb547'},
  {bg:'rgba(167,139,250,0.12)',text:'var(--purple)',bar:'#a78bfa'},
  {bg:'rgba(255,77,109,0.12)',text:'var(--red)',bar:'#ff4d6d'},
  {bg:'rgba(96,165,250,0.12)',text:'var(--blue)',bar:'#60a5fa'},
];

// Destroy per-account sparkline charts between renders
const acctCharts={};

function renderAccountsPanels(totalSizeUSD){
  const grid=document.getElementById('accounts-grid');
  const propBar=document.getElementById('accounts-proportion-bar');
  const barLabel=document.getElementById('accounts-total-bar-label');
  if(!grid)return;

  // Group positions by account
  const acctMap=new Map();
  positions.forEach(p=>{
    const acct=p.account||'Sans compte';
    if(!acctMap.has(acct))acctMap.set(acct,{positions:[],totalUSD:0,pnlUSD:0});
    const g=acctMap.get(acct);
    const valUSD=toUSD((p.shares||0)*p.current,getPosCurrency(p));
    const costUSD=toUSD((p.shares||0)*p.avgEntry,getPosCurrency(p));
    g.positions.push(p);
    g.totalUSD+=valUSD;
    g.pnlUSD+=(valUSD-costUSD);
  });

  if(!acctMap.size){
    grid.innerHTML='<div style="color:var(--text3);font-size:12px;padding:1rem;">Aucune position avec compte assigné.</div>';
    if(propBar)propBar.innerHTML='';
    return;
  }

  // Sort by total desc
  const sorted=[...acctMap.entries()].sort((a,b)=>b[1].totalUSD-a[1].totalUSD);
  const grandTotalUSD=sorted.reduce((s,[,g])=>s+g.totalUSD,0);

  // Proportion bar
  if(propBar){
    propBar.innerHTML=sorted.map(([name,g],i)=>{
      const pct=(g.totalUSD/grandTotalUSD*100).toFixed(1);
      const col=ACCT_COLORS[i%ACCT_COLORS.length];
      return`<div style="flex:${pct};background:${col.bar};min-width:2px;" title="${name}: ${pct}%"></div>`;
    }).join('');
  }
  if(barLabel)barLabel.textContent=sorted.length+' compte'+(sorted.length>1?'s':'');

  // Destroy old charts
  Object.values(acctCharts).forEach(c=>{try{c.destroy();}catch(e){}});
  for(const k in acctCharts)delete acctCharts[k];

  // Build cards
  grid.innerHTML=sorted.map(([name,g],i)=>{
    const col=ACCT_COLORS[i%ACCT_COLORS.length];
    const totalCAD=(g.totalUSD*fxRate);
    const pnlCAD=(g.pnlUSD*fxRate);
    const pnlCls=pnlCAD>=0?'pos':'neg';
    const pct=grandTotalUSD>0?(g.totalUSD/grandTotalUSD*100).toFixed(1):0;
    const initial=name.slice(0,2).toUpperCase();
    const topPositions=g.positions.slice().sort((a,b)=>toUSD((b.shares||0)*b.current,getPosCurrency(b))-toUSD((a.shares||0)*a.current,getPosCurrency(a))).slice(0,3);

    return`<div class="alloc-panel alloc-account-panel" style="position:relative;overflow:hidden;">
      <div style="position:absolute;top:0;left:0;right:0;height:2px;background:${col.bar};opacity:0.6;"></div>
      <div class="alloc-account-header">
        <div class="alloc-account-icon" style="background:${col.bg};color:${col.text};">${initial}</div>
        <div style="flex:1;">
          <div class="alloc-account-name">${name}</div>
          <div class="alloc-account-val" style="color:${col.text};">${fmtAmtRound(totalCAD)}</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:11px;font-family:var(--mono);color:${col.text};font-weight:600;">${pct}%</div>
          <div style="font-size:10px;color:var(--text3);">${g.positions.length} pos.</div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px;">
        <div style="background:var(--bg3);border-radius:6px;padding:6px 10px;">
          <div style="font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:0.8px;">P&L ouvert</div>
          <div style="font-family:var(--mono);font-size:13px;font-weight:700;" class="${pnlCls}">${pnlCAD>=0?'+':''}${fmtAmtRound(pnlCAD)}</div>
        </div>
        <div style="background:var(--bg3);border-radius:6px;padding:6px 10px;">
          <div style="font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:0.8px;">% du portfolio</div>
          <div style="font-family:var(--mono);font-size:13px;font-weight:700;color:${col.text};">${pct}%</div>
        </div>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:4px;">
        ${topPositions.map(p=>{
          const pnlP=toUSD((p.shares||0)*p.current,getPosCurrency(p))-toUSD((p.shares||0)*p.avgEntry,getPosCurrency(p));
          return`<span style="font-size:10px;font-family:var(--mono);background:var(--bg3);border:0.5px solid var(--border);border-radius:4px;padding:2px 7px;">${p.symbol} <span style="color:${pnlP>=0?'var(--green)':'var(--red)'};">${pnlP>=0?'+':''}${(pnlP/Math.max(0.01,toUSD((p.shares||0)*p.avgEntry,getPosCurrency(p)))*100).toFixed(1)}%</span></span>`;
        }).join('')}
        ${g.positions.length>3?`<span style="font-size:10px;color:var(--text3);padding:2px 4px;">+${g.positions.length-3} autres</span>`:''}
      </div>
    </div>`;
  }).join('');
}

// ── Concentration & risque (demandé par Cédric 2026-08-03) ─────────────────────────────
// Signale une position trop lourde, soit sur le portefeuille total soit sur un compte en
// particulier. Volontairement simple (2 seuils, pas de score composite) -- l'objectif est un
// rappel visuel, pas un système de scoring qui prétendrait savoir mieux que Cédric quoi faire.
const CONCENTRATION_THRESHOLDS={warning:20,danger:40};
function computeConcentrationRisk(){
  const rows=[];
  if(!positions.length)return rows;
  const totalSizeUSD=getTotalSizeUSD();
  const totalCAD=totalSizeUSD*fxRate+cash;
  if(!(totalCAD>0))return rows;

  // 1) Concentration par symbole, % du portefeuille total (positions + cash)
  const bySymbol={};
  positions.forEach(p=>{
    const valCAD=toUSD((p.shares||0)*p.current,getPosCurrency(p))*fxRate;
    bySymbol[p.symbol]=(bySymbol[p.symbol]||0)+valCAD;
  });
  Object.entries(bySymbol).forEach(([sym,valCAD])=>{
    const pct=valCAD/totalCAD*100;
    if(pct>=CONCENTRATION_THRESHOLDS.warning){
      rows.push({level:pct>=CONCENTRATION_THRESHOLDS.danger?'danger':'warning',pct,text:`${sym} — ${pct.toFixed(0)}% du portefeuille total`});
    }
  });

  // 2) Concentration par compte : position dominante d'un compte, % de CE compte (pas du
  //    portefeuille global) -- ex. SOXL peut être 8% du portefeuille total mais 40% du CELI.
  const byAccount=new Map();
  positions.forEach(p=>{
    const acct=p.account||'Sans compte';
    if(!byAccount.has(acct))byAccount.set(acct,{total:0,bySym:{}});
    const g=byAccount.get(acct);
    const valCAD=toUSD((p.shares||0)*p.current,getPosCurrency(p))*fxRate;
    g.total+=valCAD;
    g.bySym[p.symbol]=(g.bySym[p.symbol]||0)+valCAD;
  });
  byAccount.forEach((g,acct)=>{
    if(!(g.total>0))return;
    Object.entries(g.bySym).forEach(([sym,valCAD])=>{
      const pct=valCAD/g.total*100;
      if(pct>=CONCENTRATION_THRESHOLDS.warning){
        rows.push({level:pct>=CONCENTRATION_THRESHOLDS.danger?'danger':'warning',pct,text:`${sym} — ${pct.toFixed(0)}% du compte ${acct}`});
      }
    });
  });

  rows.sort((a,b)=>(b.level==='danger')-(a.level==='danger')||b.pct-a.pct);
  return rows;
}
function renderConcentrationRisk(){
  const el=document.getElementById('concentration-body');
  if(!el)return;
  const rows=computeConcentrationRisk();
  if(!rows.length){
    el.innerHTML=`<div style="color:var(--text3);font-size:12px;padding:4px 2px;">Aucune concentration excessive détectée (seuil ${CONCENTRATION_THRESHOLDS.warning}%+).</div>`;
    return;
  }
  el.innerHTML=rows.map(r=>{
    const color=r.level==='danger'?'var(--red)':'var(--amber)';
    const bg=r.level==='danger'?'rgba(255,77,109,0.08)':'rgba(255,181,71,0.08)';
    const badge=r.level==='danger'?'RISQUE ÉLEVÉ':'À SURVEILLER';
    return`<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 10px;background:${bg};border:0.5px solid ${color};border-radius:6px;margin-bottom:6px;font-size:11px;">
      <span style="color:var(--text2);">${escapeHtml(r.text)}</span>
      <span style="color:${color};font-weight:700;font-size:9px;letter-spacing:0.5px;">${badge}</span>
    </div>`;
  }).join('');
}
function renderAllocCharts(){
  const totalSizeUSD=getTotalSizeUSD();
  const totalCAD=totalSizeUSD*fxRate+cash; // cash déjà en CAD

  // Hero header
  const heroTotal=document.getElementById('alloc-hero-total');
  if(heroTotal)heroTotal.textContent=fmtAmtRound(totalCAD);
  const heroPos=document.getElementById('alloc-hero-pos');
  if(heroPos)heroPos.textContent=fmtAmtRound(totalSizeUSD*fxRate);
  const heroCash=document.getElementById('alloc-hero-cash');
  if(heroCash)heroCash.textContent=fmtAmtRound(cash); // cash déjà en CAD
  const heroNb=document.getElementById('alloc-hero-nbpos');
  if(heroNb)heroNb.textContent=positions.length+' positions actives';

  // Mini stats
  const closedTrades=trades.filter(t=>t.type==='Vente');
  const wins=closedTrades.filter(t=>(t.profit||0)>0).length;
  const winRate=closedTrades.length>0?Math.round(wins/closedTrades.length*100):0;
  const totalPnlRealUSD=closedTrades.reduce((s,t)=>s+toUSD(t.profit||0,getTradeCurrency(t)),0);
  const wr=document.getElementById('alloc-mini-winrate');
  if(wr){wr.textContent=winRate+'%';wr.className='alloc-mini-val '+(winRate>=50?'pos':winRate>0?'neg':'');}
  const pr=document.getElementById('alloc-mini-pnlreal');
  if(pr){pr.textContent=(totalPnlRealUSD>=0?'+':'-')+fmtAmt(Math.abs(totalPnlRealUSD*fxRate));pr.className='alloc-mini-val '+(totalPnlRealUSD>=0?'pos':'neg');}

  if(!totalSizeUSD){
    // Empty states
    ['alloc-sym-legend','alloc-cat-legend','celi-legend','celiapp-legend','crypto-legend'].forEach(id=>{const el=document.getElementById(id);if(el)el.innerHTML='<div class="alloc-empty-state">Aucune position</div>';});
    ['alloc-sym-count','alloc-cat-count'].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent='—';});
    const acctGrid=document.getElementById('accounts-grid');if(acctGrid)acctGrid.innerHTML='<div style="color:var(--text3);font-size:12px;padding:1rem;">Aucune position avec compte assigné.</div>';
    const concEl=document.getElementById('concentration-body');if(concEl)concEl.innerHTML='<div style="color:var(--text3);font-size:12px;padding:4px 2px;">Aucune position.</div>';
    return;
  }

  // Par symbole
  const syms=positions.map(p=>({label:p.symbol,val:(p.shares||0)*p.current,cur:getPosCurrency(p)}));
  const{labels:sLabels,values:sValues}=mkDonutData(syms,totalSizeUSD);
  updateDonut(allocSymChart,sLabels,sValues,COLORS.slice(0,sLabels.length));
  buildLegend('alloc-sym-legend',sLabels,sValues,COLORS.slice(0,sLabels.length));
  const symCount=document.getElementById('alloc-sym-count');
  if(symCount)symCount.textContent=sLabels.length+' actifs';

  // Par catégorie
  const cats={};positions.forEach(p=>{const c=getCat(p.symbol);cats[c]=(cats[c]||0)+toUSD((p.shares||0)*p.current,getPosCurrency(p));});
  const cLabels=Object.keys(cats),cValues=cLabels.map(c=>parseFloat((cats[c]/totalSizeUSD*100).toFixed(1)));
  updateDonut(allocCatChart,cLabels,cValues,COLORS.slice(0,cLabels.length));
  buildLegend('alloc-cat-legend',cLabels,cValues,COLORS.slice(0,cLabels.length));
  const catCount=document.getElementById('alloc-cat-count');
  if(catCount)catCount.textContent=cLabels.length+' classes';

  // Comptes dynamiques
  renderAccountsPanels(totalSizeUSD);

  // Concentration & risque
  renderConcentrationRisk();

  // P&L par classe
  const catPnl={};positions.forEach(p=>{const c=getCat(p.symbol);catPnl[c]=(catPnl[c]||0)+calcPnlUSD(p)*fxRate;});
  if(assetPerfChart){assetPerfChart.data.labels=Object.keys(catPnl);const pnlVals=Object.values(catPnl).map(v=>parseFloat(v.toFixed(2)));assetPerfChart.data.datasets[0].data=pnlVals;assetPerfChart.data.datasets[0].backgroundColor=pnlVals.map(v=>v>=0?'#00ff88':'#ff4d6d');assetPerfChart.update();}

  // F5: Variation relative par secteur (PnL% depuis coût moyen)
  if(sectorVarChart){
    const sectorPnl={},sectorCost={};
    positions.forEach(p=>{
      const c=getCat(p.symbol);
      sectorPnl[c]=(sectorPnl[c]||0)+calcPnlUSD(p);
      sectorCost[c]=(sectorCost[c]||0)+toUSD((p.shares||0)*p.avgEntry,getPosCurrency(p));
    });
    const sectorEntries=Object.entries(sectorPnl)
      .filter(([c])=>sectorCost[c]>0)
      .map(([c,pnl])=>({cat:c,pct:parseFloat((pnl/sectorCost[c]*100).toFixed(2))}))
      .sort((a,b)=>b.pct-a.pct);
    sectorVarChart.data.labels=sectorEntries.map(s=>s.cat);
    const pcts=sectorEntries.map(s=>s.pct);
    sectorVarChart.data.datasets[0].data=pcts;
    sectorVarChart.data.datasets[0].backgroundColor=pcts.map(v=>v>=0?'rgba(0,255,136,0.75)':'rgba(255,77,109,0.75)');
    sectorVarChart.update();
  }
}

function exportPdf(){window.print();}

function showShortcutsHelp(){
  const el=document.getElementById('shortcuts-modal-overlay');
  if(el)el.style.display='flex';
}
function closeShortcutsModal(){
  const el=document.getElementById('shortcuts-modal-overlay');
  if(el)el.style.display='none';
}

function exportCSV(){
  const rows=[['Date','Symbole','Direction','Type','Compte','Prix','Prix moy. entrée','Montant initial','Montant final','Profit','ROI (%)']];
  trades.forEach(t=>{
    if(t.type==='Vente'){const roi=t.size>0?((t.profit||0)/t.size*100).toFixed(2):'0';rows.push([t.date,t.symbol,t.dir,'Vente',t.account||'',t.price,t.avgEntry||'',t.size,(t.montantFinal||(t.size+(t.profit||0))).toFixed(2),(t.profit||0).toFixed(2),roi]);}
    else if(t.type==='Dividende'){rows.push([t.date,t.symbol||'',t.dir||'',t.type,t.accountType||t.account||'','','',t.size,'','','']);}
    else if(t.type==='Achat'){rows.push([t.date,t.symbol,t.dir,'Achat',t.account||'',t.price,'',t.size,'','','']);}
    // Autres types (Dépôt, Retrait, Cotisation) -- déjà non gérés avant ce changement,
    // hors scope de cet ajout (limitation préexistante de exportCSV, à corriger séparément).
  });
  const blob=new Blob([rows.map(r=>r.join(',')).join('\n')],{type:'text/csv;charset=utf-8;'});
  const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='nord_capital_transactions.csv';document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);
}
async function clearHistory(){if(!confirm('Effacer tout l\'historique ? Irréversible.'))return;trades=[];await saveData();renderAll();}
function renderMilestones(){
  const body=document.getElementById('milestones-body');
  if(!body)return;
  const MILESTONES=[10000,25000,50000,75000,100000,150000,250000,500000,1000000];
  const totalSizeUSD=getTotalSizeUSD();
  const totalCAD=totalSizeUSD*fxRate+cash;

  // Calcul CAGR depuis le premier snapshot
  let cagrPct=null,cagrLabel='';
  if(portfolioHistory.length>=2){
    const first=portfolioHistory[0],last=portfolioHistory[portfolioHistory.length-1];
    const v0=first.value,v1=last.value||totalCAD;
    const d0=new Date(first.date),d1=new Date();
    const years=(d1-d0)/(1000*60*60*24*365.25);
    if(years>=0.05&&v0>0&&v1>0){
      cagrPct=Math.pow(v1/v0,1/years)-1;
      cagrLabel=`CAGR ${(cagrPct*100).toFixed(1)}%/an`;
    }
  }
  const badge=document.getElementById('milestone-cagr-badge');
  if(badge)badge.textContent=cagrLabel;

  const fmtM=v=>v>=1000000?`${(v/1000000).toFixed(v%1000000===0?0:1)}M CAD`:`${(v/1000).toFixed(0)}k CAD`;
  // Trouver le prochain milestone non-atteint
  const nextTarget=MILESTONES.find(t=>totalCAD<t);
  const rows=MILESTONES.map(target=>{
    const pct=totalCAD>=target?100:Math.max(0,(totalCAD/target)*100);
    const done=totalCAD>=target;
    const isNext=target===nextTarget;
    const remaining=Math.max(0,target-totalCAD);
    let etaStr='';
    if(!done&&cagrPct&&cagrPct>0){
      const yearsLeft=Math.log(target/totalCAD)/Math.log(1+cagrPct);
      if(yearsLeft<100){const months=Math.round(yearsLeft*12);etaStr=months<24?`~${months} mois`:`~${(yearsLeft).toFixed(1)} ans`;}
    }
    const barColor=done?'var(--green)':isNext?'var(--cyan)':pct>50?'var(--blue)':'rgba(255,255,255,0.15)';
    const glowStyle=isNext?'box-shadow:0 0 0 1px rgba(0,212,255,0.3);border-color:rgba(0,212,255,0.3);':'';
    return `<div style="background:var(--bg3);border:0.5px solid ${done?'rgba(0,255,136,0.25)':isNext?'rgba(0,212,255,0.25)':'var(--border)'};border-radius:10px;padding:12px 16px;${done?'opacity:0.6;':''}${glowStyle}">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="font-size:14px;">${done?'':isNext?'':''}</span>
          <span style="font-family:var(--mono);font-weight:700;font-size:13px;color:${done?'var(--green)':isNext?'var(--cyan)':'var(--text)'};">${fmtM(target)}</span>
          ${isNext?'<span style="font-size:9px;font-weight:700;background:rgba(0,212,255,0.15);color:var(--cyan);padding:1px 6px;border-radius:3px;letter-spacing:1px;">PROCHAIN</span>':''}
        </div>
        <div style="text-align:right;">
          <span style="font-family:var(--mono);font-size:13px;font-weight:600;color:${done?'var(--green)':'var(--text2)'};">${pct<100?pct.toFixed(1)+'%':'OK Atteint'}</span>
          ${!done&&etaStr?`<div style="font-size:10px;color:var(--text3);margin-top:1px;">${etaStr}</div>`:''}
        </div>
      </div>
      <div style="height:6px;background:var(--bg4);border-radius:3px;overflow:hidden;">
        <div style="height:100%;width:${pct.toFixed(1)}%;background:${barColor};border-radius:3px;transition:width 0.6s ease;${isNext?'box-shadow:0 0 8px rgba(0,212,255,0.5);':''}"></div>
      </div>
      ${!done&&remaining>0?`<div style="font-size:10px;color:var(--text3);margin-top:6px;">Reste ${Math.round(remaining).toLocaleString('fr-FR')} $ CAD</div>`:''}
    </div>`;
  }).join('');
  body.innerHTML=rows;
}
function computeAnalytics(history){
  // Besoin d'au moins 30 points
  if(!history||history.length<10)return null;
  const vals=history.map(h=>h.value).filter(v=>v>0);
  if(vals.length<10)return null;

  // Rendements journaliers
  const returns=[];
  for(let i=1;i<vals.length;i++){
    if(vals[i-1]>0)returns.push((vals[i]-vals[i-1])/vals[i-1]);
  }
  if(!returns.length)return null;

  // Volatilité annualisée (std dev journalière × √252)
  const mean=returns.reduce((s,r)=>s+r,0)/returns.length;
  const variance=returns.reduce((s,r)=>s+Math.pow(r-mean,2),0)/(returns.length-1);
  const stdDaily=Math.sqrt(variance);
  const volAnnual=stdDaily*Math.sqrt(252)*100; // %

  // CAGR
  const first=vals[0],last=vals[vals.length-1];
  const d0=new Date(history[0].date),d1=new Date(history[history.length-1].date);
  const years=(d1-d0)/(1000*60*60*24*365.25);
  const cagr=years>=0.1?( Math.pow(last/first,1/years)-1)*100:null;

  // Sharpe (taux sans risque 4%/an → journalier)
  const rfDaily=0.04/252;
  const excessMean=mean-rfDaily;
  const sharpe=stdDaily>0?(excessMean/stdDaily)*Math.sqrt(252):null;

  // Max Drawdown
  let peak=vals[0],maxDD=0,peakDate=history[0].date,troughDate=history[0].date,ddPeakDate=history[0].date;
  for(let i=1;i<vals.length;i++){
    if(vals[i]>peak){peak=vals[i];ddPeakDate=history[i].date;}
    const dd=(peak-vals[i])/peak*100;
    if(dd>maxDD){maxDD=dd;peakDate=ddPeakDate;troughDate=history[i].date;}
  }

  // ATH actuel vs valeur courante
  const ath=Math.max(...vals);
  const athDrawdown=last<ath?(ath-last)/ath*100:0;

  const nbDays=Math.round((d1-d0)/(1000*60*60*24));
  return{volAnnual,cagr,sharpe,maxDD,peakDate,troughDate,athDrawdown,ath,nbDays,nbPoints:vals.length};
}

function renderAnalytics(){
  const analytics=computeAnalytics(portfolioHistory);
  const cagrEl=document.getElementById('analytics-cagr');
  const volEl=document.getElementById('analytics-vol');
  const sharpeEl=document.getElementById('analytics-sharpe');
  const mddEl=document.getElementById('analytics-mdd');
  const mddSub=document.getElementById('analytics-mdd-sub');
  const periodLabel=document.getElementById('analytics-period-label');
  const noteEl=document.getElementById('analytics-note');

  if(!analytics){
    [cagrEl,volEl,sharpeEl,mddEl].forEach(el=>{if(el)el.textContent='—';});
    if(noteEl)noteEl.textContent="Pas assez de données (min. 10 snapshots). L'historique se construit automatiquement chaque soir.";
    return;
  }

  const{volAnnual,cagr,sharpe,maxDD,peakDate,troughDate,athDrawdown,nbDays,nbPoints}=analytics;

  if(periodLabel)periodLabel.textContent=`${nbPoints} snapshots · ${nbDays} jours d'historique`;
  if(noteEl)noteEl.textContent=`Calculé sur ${nbPoints} snapshots quotidiens (${nbDays} jours). Sharpe avec taux sans risque 4%/an.`;

  // CAGR
  if(cagrEl&&cagr!==null){
    cagrEl.textContent=(cagr>=0?'+':'')+cagr.toFixed(1)+'%';
    cagrEl.style.color=cagr>=0?'var(--green)':'var(--red)';
  }
  // Volatilité
  if(volEl){
    volEl.textContent=volAnnual.toFixed(1)+'%';
    volEl.style.color=volAnnual<20?'var(--green)':volAnnual<40?'var(--amber)':'var(--red)';
  }
  // Sharpe
  if(sharpeEl&&sharpe!==null){
    sharpeEl.textContent=sharpe.toFixed(2);
    sharpeEl.style.color=sharpe>=1?'var(--green)':sharpe>=0?'var(--amber)':'var(--red)';
  }
  // Max Drawdown
  if(mddEl){
    mddEl.textContent='-'+maxDD.toFixed(1)+'%';
    mddEl.style.color=maxDD<10?'var(--green)':maxDD<25?'var(--amber)':'var(--red)';
  }
  if(mddSub&&peakDate&&troughDate){
    mddSub.textContent=`pic ${peakDate} → creux ${troughDate}`;
  }
}

// ─── COTISATIONS & DROITS ─────────────────────────────────────────────────
const CELI_LIMITS={2009:5000,2010:5000,2011:5000,2012:5000,2013:5500,2014:5500,2015:10000,2016:5500,2017:5500,2018:5500,2019:6000,2020:6000,2021:6000,2022:6000,2023:6500,2024:7000,2025:7000,2026:7000};
const CELIAPP_MAX_ANNUAL=8000,CELIAPP_LIFETIME=40000;

function getCotisations(){return trades.filter(t=>t.type==='Cotisation');}
function getCotisationsByAcct(acct){return getCotisations().filter(t=>t.account===acct);}
// kind absent (anciennes entrées) = dépôt, pour rétrocompatibilité
function getDepositsByAcct(acct){return getCotisationsByAcct(acct).filter(t=>t.kind!=='retrait');}
function getWithdrawalsByAcct(acct){return getCotisationsByAcct(acct).filter(t=>t.kind==='retrait');}

function getCeliDroits(joinYear){
  const curYear=new Date().getFullYear();
  let total=0;
  for(let y=Math.max(joinYear,2009);y<=curYear;y++){total+=CELI_LIMITS[y]||7000;}
  const cotise=getDepositsByAcct('CELI').reduce((s,t)=>s+(t.amount||0),0);
  // Règle ARC : un retrait CELI ne redonne des droits qu'à partir du 1er janvier de l'année SUIVANTE.
  const retraits=getWithdrawalsByAcct('CELI').reduce((s,t)=>s+(t.amount||0),0);
  const retraitsAnneesPassees=getWithdrawalsByAcct('CELI').filter(t=>(t.year||curYear)<curYear).reduce((s,t)=>s+(t.amount||0),0);
  return{total,cotise,retraits,restant:Math.max(0,total-cotise+retraitsAnneesPassees)};
}

function getCeliappDroits(){
  // CELIAPP : un retrait ne redonne PAS de droits (contrairement au CELI) — sauf retrait admissible
  // pour achat de 1re propriété, cas particulier non géré ici.
  const cotise=getDepositsByAcct('CELIAPP').reduce((s,t)=>s+(t.amount||0),0);
  const retraits=getWithdrawalsByAcct('CELIAPP').reduce((s,t)=>s+(t.amount||0),0);
  const annee=new Date().getFullYear();
  const cotisAnnee=getDepositsByAcct('CELIAPP').filter(t=>t.year===annee).reduce((s,t)=>s+(t.amount||0),0);
  return{total:CELIAPP_LIFETIME,cotise,retraits,restant:Math.max(0,CELIAPP_LIFETIME-cotise),anneeMax:CELIAPP_MAX_ANNUAL,anneeCotise:cotisAnnee,anneeRestant:Math.max(0,CELIAPP_MAX_ANNUAL-cotisAnnee)};
}

function getReerDroits(){
  // REER : un retrait ne redonne pas de droits (sauf RAP/REEP, non géré ici) — juste informatif.
  const limit=reerLimit;
  const cotise=getDepositsByAcct('REER').reduce((s,t)=>s+(t.amount||0),0);
  const retraits=getWithdrawalsByAcct('REER').reduce((s,t)=>s+(t.amount||0),0);
  return{limit,cotise,retraits,restant:Math.max(0,limit-cotise)};
}

function fmtCAD(n){return new Intl.NumberFormat('fr-CA',{style:'currency',currency:'CAD',maximumFractionDigits:0}).format(n);}

function renderContributions(){
  const trackersEl=document.getElementById('contributions-trackers');
  const histEl=document.getElementById('contributions-history');
  const histTableEl=document.getElementById('contributions-history-table');
  const reerWrap=document.getElementById('contributions-reer-limit-wrap');
  if(!trackersEl)return;

  const celi=getCeliDroits(celiJoinYear);
  const celiapp=getCeliappDroits();
  const reer=getReerDroits();

  function pct(used,total){return total>0?Math.min(100,used/total*100):0;}
  function bar(used,total,color){
    const p=pct(used,total);
    return`<div style="width:100%;height:6px;background:var(--bg4);border-radius:3px;margin-top:8px;overflow:hidden;"><div style="width:${p.toFixed(1)}%;height:100%;background:${color};border-radius:3px;transition:width 0.4s;"></div></div>`;
  }

  trackersEl.innerHTML=`
    <div style="background:var(--bg3);border:0.5px solid var(--border);border-radius:10px;padding:14px 16px;position:relative;">
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px;">
        <span style="font-size:10px;font-weight:700;color:var(--green);text-transform:uppercase;letter-spacing:1px;">CELI</span>
        <span style="font-size:9px;color:var(--text3);cursor:pointer;" onclick="promptCeliJoinYear()">Depuis ${celiJoinYear}</span>
      </div>
      <div style="font-family:var(--mono);font-size:18px;font-weight:700;color:var(--text);">${fmtCAD(celi.restant)}</div>
      <div style="font-size:10px;color:var(--text3);margin-top:2px;">restant / ${fmtCAD(celi.total)} total</div>
      ${bar(celi.cotise,celi.total,'var(--green)')}
      <div style="font-size:9px;color:var(--text3);margin-top:4px;">Cotisé : ${fmtCAD(celi.cotise)}${celi.retraits>0?` · Retiré : ${fmtCAD(celi.retraits)}`:''}</div>
    </div>
    <div style="background:var(--bg3);border:0.5px solid var(--border);border-radius:10px;padding:14px 16px;">
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px;">
        <span style="font-size:10px;font-weight:700;color:var(--cyan);text-transform:uppercase;letter-spacing:1px;">CELIAPP</span>
        <span style="font-size:9px;color:var(--text3);">Max ${fmtCAD(CELIAPP_LIFETIME)}</span>
      </div>
      <div style="font-family:var(--mono);font-size:18px;font-weight:700;color:var(--text);">${fmtCAD(celiapp.restant)}</div>
      <div style="font-size:10px;color:var(--text3);margin-top:2px;">restant à vie · ${fmtCAD(celiapp.anneeRestant)} cette année</div>
      ${bar(celiapp.cotise,CELIAPP_LIFETIME,'var(--cyan)')}
      <div style="font-size:9px;color:var(--text3);margin-top:4px;">Cotisé : ${fmtCAD(celiapp.cotise)}${celiapp.retraits>0?` · Retiré : ${fmtCAD(celiapp.retraits)} (aucun droit redonné)`:''}</div>
    </div>
    <div style="background:var(--bg3);border:0.5px solid var(--border);border-radius:10px;padding:14px 16px;">
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px;">
        <span style="font-size:10px;font-weight:700;color:var(--amber);text-transform:uppercase;letter-spacing:1px;">REER</span>
        <span style="font-size:9px;color:var(--text3);cursor:pointer;text-decoration:underline dotted;" onclick="promptReerLimit()">Modifier plafond</span>
      </div>
      <div style="font-family:var(--mono);font-size:18px;font-weight:700;color:var(--text);">${reer.limit>0?fmtCAD(reer.restant):'—'}</div>
      <div style="font-size:10px;color:var(--text3);margin-top:2px;">${reer.limit>0?'restant / '+fmtCAD(reer.limit)+' plafond':'Plafond non configuré'}</div>
      ${reer.limit>0?bar(reer.cotise,reer.limit,'var(--amber)'):''}
      <div style="font-size:9px;color:var(--text3);margin-top:4px;">${reer.limit>0?'Cotisé : '+fmtCAD(reer.cotise):''}${reer.retraits>0?` · Retiré : ${fmtCAD(reer.retraits)} (aucun droit redonné)`:''}</div>
    </div>`;

  const histFilterAcct=document.getElementById('cotis-hist-filter-acct')?.value||'';
  const allCotis=getCotisations().filter(t=>!histFilterAcct||t.account===histFilterAcct).sort((a,b)=>b.date.localeCompare(a.date));
  if(allCotis.length){
    histEl.style.display='block';
    const ACCT_COLOR={'CELI':'var(--green)','CELIAPP':'var(--cyan)','REER':'var(--amber)','REEE':'var(--amber)'};
    histTableEl.innerHTML=`<table style="width:100%;border-collapse:collapse;font-size:11px;font-family:var(--mono);">
      <thead><tr style="border-bottom:0.5px solid var(--border);">
        <th style="text-align:left;padding:6px 8px;font-size:9px;color:var(--text3);font-weight:600;text-transform:uppercase;">Date</th>
        <th style="text-align:left;padding:6px 8px;font-size:9px;color:var(--text3);font-weight:600;text-transform:uppercase;">Compte</th>
        <th style="text-align:left;padding:6px 8px;font-size:9px;color:var(--text3);font-weight:600;text-transform:uppercase;">Année</th>
        <th style="text-align:right;padding:6px 8px;font-size:9px;color:var(--text3);font-weight:600;text-transform:uppercase;">Montant</th>
        <th style="text-align:left;padding:6px 8px;font-size:9px;color:var(--text3);font-weight:600;text-transform:uppercase;">Note</th>
        <th style="padding:4px;"></th>
      </tr></thead>
      <tbody>${allCotis.map((t,i)=>{
        const col=ACCT_COLOR[t.account]||'var(--text2)';
        const isRetrait=t.kind==='retrait';
        const globalIdx=trades.findIndex(tr=>tr===t);
        return`<tr style="border-bottom:0.5px solid var(--border);opacity:0.92;">
          <td style="padding:7px 8px;color:var(--text2);">${t.date||'—'}</td>
          <td style="padding:7px 8px;"><span style="color:${col};font-weight:700;">${t.account||'—'}</span>${isRetrait?'<span class="badge-compte" style="margin-left:4px;background:rgba(246,200,67,0.12);color:var(--amber);border-color:rgba(246,200,67,0.3);">Retrait</span>':''}</td>
          <td style="padding:7px 8px;color:var(--text2);">${t.year||'—'}</td>
          <td style="padding:7px 8px;text-align:right;color:${isRetrait?'var(--amber)':'var(--green)'};font-weight:600;">${isRetrait?'-':'+'}${fmtCAD(t.amount||0)}</td>
          <td style="padding:7px 8px;color:var(--text3);">${escapeHtml(t.note||'')}</td>
          <td style="padding:4px;"><button onclick="deleteCotisation(${globalIdx})" style="background:none;border:none;color:var(--text3);cursor:pointer;font-size:13px;" title="Supprimer">×</button></td>
        </tr>`;
      }).join('')}</tbody>
    </table>`;
  } else {
    histEl.style.display='none';
  }
}

function promptCeliJoinYear(){
  const cur=String(celiJoinYear);
  const y=prompt('Année où vous avez ouvert votre premier CELI (entre 2009 et '+new Date().getFullYear()+') :',cur);
  const yi=parseInt(y);
  if(y&&!isNaN(yi)&&yi>=2009&&yi<=new Date().getFullYear()){
    celiJoinYear=yi;
    saveData();
    renderContributions();
  }
}

function promptReerLimit(){
  const cur=reerLimit?reerLimit.toFixed(2):'';
  const v=prompt('Entrez votre plafond REER disponible (en CAD) :\n(Trouvable sur votre avis de cotisation ARC)',cur);
  const vn=parseFloat(v);
  if(v!==null&&!isNaN(vn)&&vn>=0){
    reerLimit=vn;
    saveData();
    renderContributions();
  }
}

function saveReerLimit(){
  const input=document.getElementById('contributions-reer-limit-input');
  if(!input)return;
  const v=parseFloat(input.value);
  if(!isNaN(v)&&v>=0){reerLimit=v;saveData();renderContributions();}
}

let cotisType='depot';
function setCotisType(type){
  cotisType=type;
  const d=document.getElementById('cotis-type-depot'),r=document.getElementById('cotis-type-retrait');
  if(type==='depot'){d.style.cssText='flex:1;padding:10px;background:rgba(45,212,160,0.15);border:1px solid rgba(45,212,160,0.4);color:var(--green);border-radius:8px;cursor:pointer;font-size:12px;font-weight:600;';r.style.cssText='flex:1;padding:10px;background:var(--bg3);border:1px solid var(--border2);color:var(--text2);border-radius:8px;cursor:pointer;font-size:12px;';}
  else{d.style.cssText='flex:1;padding:10px;background:var(--bg3);border:1px solid var(--border2);color:var(--text2);border-radius:8px;cursor:pointer;font-size:12px;';r.style.cssText='flex:1;padding:10px;background:rgba(246,200,67,0.12);border:1px solid rgba(246,200,67,0.35);color:var(--amber);border-radius:8px;cursor:pointer;font-size:12px;font-weight:600;';}
  const titleEl=document.getElementById('cotis-modal-title');
  if(titleEl)titleEl.textContent=type==='depot'?'Enregistrer une cotisation':'Enregistrer un retrait';
  updateCotisPreview();
}

function openCotisationModal(){
  // Peupler les années
  const yearSel=document.getElementById('cotis-year');
  if(yearSel&&!yearSel.options.length){
    const cur=new Date().getFullYear();
    for(let y=cur;y>=2009;y--){const o=document.createElement('option');o.value=y;o.textContent=y;yearSel.appendChild(o);}
  }
  const dateEl=document.getElementById('cotis-date');
  if(dateEl)dateEl.value=new Date().toISOString().split('T')[0];
  const amtEl=document.getElementById('cotis-amount');
  if(amtEl)amtEl.value='';
  const noteEl=document.getElementById('cotis-note');
  if(noteEl)noteEl.value='';
  setCotisType('depot');
  document.getElementById('cotisation-modal-overlay').style.display='flex';
}

function closeCotisationModal(){
  document.getElementById('cotisation-modal-overlay').style.display='none';
}

function updateCotisModal(){updateCotisPreview();}

function updateCotisPreview(){
  const acct=document.getElementById('cotis-account')?.value||'CELI';
  const amount=parseFloat(document.getElementById('cotis-amount')?.value||'0')||0;
  const year=parseInt(document.getElementById('cotis-year')?.value||new Date().getFullYear());
  const isRetrait=cotisType==='retrait';
  const signedAmount=isRetrait?-amount:amount;
  const el=document.getElementById('cotis-preview');
  if(!el)return;
  let info='';
  if(acct==='CELI'){
    const joinYear=celiJoinYear;
    const celi=getCeliDroits(joinYear);
    const limitThisYear=CELI_LIMITS[year]||7000;
    const cotisThisYear=getDepositsByAcct('CELI').filter(t=>t.year===year).reduce((s,t)=>s+(t.amount||0),0);
    if(isRetrait){
      info=`Droits restants actuels : ${fmtCAD(celi.restant)}<br>Ce retrait ne change pas tes droits immédiatement — il redonnera ${fmtCAD(amount)} d'espace de cotisation CELI à partir du <strong>1er janvier ${year+1}</strong> (règle ARC).`;
    } else {
      const afterCotis=celi.restant-amount;
      info=`Plafond ${year} : ${fmtCAD(limitThisYear)}<br>Déjà cotisé ${year} : ${fmtCAD(cotisThisYear)}<br>Droits restants actuels : ${fmtCAD(celi.restant)}<br>Droits restants après : <strong style="color:${afterCotis>=0?'var(--green)':'var(--red)'}">${fmtCAD(afterCotis)}</strong>${afterCotis<0?'  <span style="color:var(--red);">Surcontribution!</span>':''}`;
    }
  } else if(acct==='CELIAPP'){
    const celiapp=getCeliappDroits();
    if(isRetrait){
      info=`Restant à vie : ${fmtCAD(celiapp.restant)}<br>Un retrait CELIAPP ne redonne <strong>pas</strong> de droits de cotisation (sauf retrait admissible pour achat de 1re propriété) — enregistré pour historique seulement.`;
    } else {
      const afterLife=celiapp.restant-amount;
      const afterYear=celiapp.anneeRestant-amount;
      info=`Plafond vie : ${fmtCAD(CELIAPP_LIFETIME)} · Restant : ${fmtCAD(celiapp.restant)}<br>Plafond annuel : ${fmtCAD(CELIAPP_MAX_ANNUAL)} · Restant cette année : ${fmtCAD(celiapp.anneeRestant)}<br>Après cotisation : vie <strong style="color:${afterLife>=0?'var(--green)':'var(--red)'}">${fmtCAD(afterLife)}</strong> · année <strong style="color:${afterYear>=0?'var(--green)':'var(--red)'}">${fmtCAD(afterYear)}</strong>`;
    }
  } else if(acct==='REER'){
    const reer=getReerDroits();
    if(isRetrait){
      info=reer.limit>0?`Restant actuel : ${fmtCAD(reer.restant)}<br>Un retrait REER ne redonne <strong>pas</strong> de droits de cotisation (sauf RAP/REEP) — enregistré pour historique seulement.`:'Plafond REER non configuré — retrait enregistré pour historique seulement.';
    } else if(reer.limit>0){
      const after=reer.restant-amount;
      info=`Plafond configuré : ${fmtCAD(reer.limit)}<br>Déjà cotisé : ${fmtCAD(reer.cotise)}<br>Restant après : <strong style="color:${after>=0?'var(--green)':'var(--red)'}">${fmtCAD(after)}</strong>`;
    } else {
      info='Plafond REER non configuré — cliquez "Modifier plafond" dans la card Cotisations.';
    }
  } else {
    info=`${isRetrait?'Retrait':'Cotisation'} ${acct} de ${fmtCAD(amount)} enregistré${isRetrait?'':'e'}.`;
  }
  el.innerHTML=info||'—';
}

async function saveCotisation(){
  const acct=document.getElementById('cotis-account')?.value;
  const amount=parseFloat(document.getElementById('cotis-amount')?.value||'0');
  const year=parseInt(document.getElementById('cotis-year')?.value||new Date().getFullYear());
  const date=document.getElementById('cotis-date')?.value||new Date().toISOString().split('T')[0];
  const note=document.getElementById('cotis-note')?.value||'';
  if(!acct||isNaN(amount)||amount<=0){alert('Montant invalide.');return;}
  const kind=cotisType==='retrait'?'retrait':'depot';
  const entry={type:'Cotisation',kind,date,year,account:acct,amount:parseFloat(amount.toFixed(2)),note,symbol:'COTISATION',dir:'—',price:0,size:amount,profit:0};
  trades.push(entry);
  const ok=await saveData();
  if(!ok){
    // Rollback : ne pas garder en mémoire une entrée que le serveur n'a jamais reçue —
    // elle aurait semblé enregistrée dans l'UI puis disparu silencieusement au prochain
    // rechargement (cause probable des cotisations CELI manquantes signalées le 2026-07-28).
    const idx=trades.indexOf(entry);
    if(idx!==-1)trades.splice(idx,1);
    alert(`Échec de la sauvegarde (connexion ?). ${kind==='retrait'?'Le retrait n\'a':'La cotisation n\'a'} PAS été enregistré${kind==='retrait'?'':'e'} — réessaie.`);
    renderContributions();
    return;
  }
  closeCotisationModal();
  renderContributions();
}

async function deleteCotisation(idx){
  if(!confirm('Supprimer cette cotisation ?'))return;
  const removed=trades.splice(idx,1);
  const ok=await saveData();
  if(!ok){
    // Rollback : réinsérer l'entrée si la suppression n'a pas pu être confirmée par le serveur.
    if(removed.length)trades.splice(idx,0,removed[0]);
    alert('Échec de la suppression (connexion ?). Réessaie.');
  }
  renderContributions();
}

document.addEventListener('click',function(e){if(e.target===document.getElementById('cotisation-modal-overlay'))closeCotisationModal();});
// ─── FIN COTISATIONS ──────────────────────────────────────────────────────

function renderAll(){updateKPIs();renderDashPos();renderPosTable();renderHistory();updatePnlBar();renderAllocDashboard();renderAllocCharts();updatePerfChart();renderStrategies();renderStratPerf();renderMilestones();renderAnalytics();renderContributions();}

function initCharts(){
  if(chartsInitialized)return;chartsInitialized=true;
  const cd={color:'#606075',font:{size:10,family:'DM Mono'}},gc='rgba(255,255,255,0.03)',bc='rgba(255,255,255,0.04)';
  const chartDefaults={responsive:true,maintainAspectRatio:false,animation:{duration:400},plugins:{legend:{display:false}}};

  const safeNew=(id,cfg)=>{const el=document.getElementById(id);return el?new Chart(el,cfg):null;};
  perfChart=safeNew('perfChart',{type:'line',data:{labels:[],datasets:[
    {label:'Portfolio',data:[],borderColor:'#00ff88',backgroundColor:'rgba(0,255,136,0.08)',borderWidth:2,pointRadius:2,pointHoverRadius:5,pointBackgroundColor:'#00ff88',fill:true,tension:0.4,spanGaps:true},
    {label:'S&P 500',data:[],borderColor:'#00d9ff',backgroundColor:'transparent',borderWidth:1.5,pointRadius:0,pointHoverRadius:3,fill:false,tension:0.4,borderDash:[5,3],spanGaps:true}
  ]},options:{...chartDefaults,interaction:{mode:'index',intersect:false},scales:{x:{ticks:{...cd},grid:{color:gc},border:{color:bc}},y:{ticks:{...cd,callback:v=>fmtAmtRound(v)},grid:{color:gc},border:{color:bc}}}}});

  pnlBarChart=safeNew('pnlBarChart',{type:'bar',data:{labels:[],datasets:[{data:[],backgroundColor:[],borderRadius:4,borderWidth:0}]},options:{...chartDefaults,scales:{x:{ticks:{...cd},grid:{display:false},border:{color:bc}},y:{ticks:{...cd,callback:v=>fmtAmtRound(v)},grid:{color:gc},border:{color:bc}}}}});

  assetPerfDashChart=safeNew('assetPerfDashChart',{type:'bar',data:{labels:[],datasets:[{data:[],backgroundColor:[],borderRadius:4,borderWidth:0}]},options:{...chartDefaults,scales:{x:{ticks:{...cd},grid:{display:false},border:{color:bc}},y:{ticks:{...cd,callback:v=>fmtAmtRound(v)},grid:{color:gc},border:{color:bc}}}}});

  assetPerfChart=safeNew('assetPerfChart',{type:'bar',data:{labels:[],datasets:[{data:[],backgroundColor:[],borderRadius:4,borderWidth:0}]},options:{...chartDefaults,scales:{x:{ticks:{...cd},grid:{display:false},border:{color:bc}},y:{ticks:{...cd,callback:v=>fmtAmtRound(v)},grid:{color:gc},border:{color:bc}}}}});

  sectorVarChart=safeNew('sectorVarChart',{type:'bar',data:{labels:[],datasets:[{data:[],backgroundColor:[],borderRadius:4,borderWidth:0}]},options:{...chartDefaults,indexAxis:'y',scales:{x:{ticks:{...cd,callback:v=>v.toFixed(1)+'%'},grid:{color:gc},border:{color:bc}},y:{ticks:{...cd},grid:{display:false},border:{color:bc}}}}});

  allocChart=mkDonut('allocChart',[],[],[]);
  allocCatDashChart=mkDonut('allocCatDashChart',[],[],[]);
  cashAllocChart=mkDonut('cashAllocChart',[],[],[]);
  allocSymChart=mkDonut('allocSymChart',[],[],[]);
  allocCatChart=mkDonut('allocCatChart',[],[],[]);
  celiChart=mkDonut('celiChart',[],[],[]);
  celiappChart=mkDonut('celiappChart',[],[],[]);
  cryptoAllocChart=mkDonut('cryptoAllocChart',[],[],[]);
  cashLotsChart=mkDonut('cashLotsChart',[],[],[]);
}

document.getElementById('modal-overlay').addEventListener('click',function(e){if(e.target===this)cancelClose();});
document.getElementById('cash-modal-overlay').addEventListener('click',function(e){if(e.target===this)closeCashPopup();});
document.getElementById('edit-modal-overlay').addEventListener('click',function(e){if(e.target===this)cancelEdit();});
document.addEventListener('keydown',e=>{
  const tag=(e.target?.tagName||'').toLowerCase();
  const inInput=tag==='input'||tag==='textarea'||e.target?.isContentEditable;
  if(e.key==='Escape'){cancelClose();cancelEdit();closeShortcutsModal();return;}
  if(inInput)return;
  const key=e.key.toLowerCase();
  if(key==='d'){switchTab('dashboard',document.querySelector('[onclick*="dashboard"]'));}
  else if(key==='p'){switchTab('positions',document.querySelector('[onclick*="positions"]'));}
  else if(key==='h'){switchTab('historique',document.querySelector('[onclick*="historique"]'));}
  else if(key==='a'){switchTab('allocation',document.querySelector('[onclick*="allocation"]'));}
  else if(key==='s'){switchTab('strategie',document.querySelector('[onclick*="strategie"]'));}
  else if(key==='w'){switchTab('watchlist',document.querySelector('[onclick*="watchlist"]'));}
  else if(key==='n'){switchTab('positions',document.querySelector('[onclick*="positions"]'));setTimeout(()=>{const sym=document.getElementById('f-symbol');if(sym){sym.focus();sym.select();}},100);}
  else if(key==='t'){const cur=document.documentElement.getAttribute('data-theme')||'dark';setTheme(cur==='dark'?'light':'dark');}
  else if(e.key==='?'){showShortcutsHelp();}
});

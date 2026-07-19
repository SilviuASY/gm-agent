// src/wagmi.ts
import { http } from 'wagmi'
import { getDefaultConfig } from '@rainbow-me/rainbowkit'

// Chain-uri custom cu iconițe
export const soneiumChain = {
  id: 1868,
  name: 'Soneium',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://soneium-mainnet.rpc.sentio.xyz'] },
    public: { http: ['https://soneium-mainnet.rpc.sentio.xyz'] },
  },
  iconUrl: '/soneium.png',
} as const

export const inkChain = {
  id: 57073,
  name: 'Ink',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc-qnd.inkonchain.com'] },
    public: { http: ['https://rpc-qnd.inkonchain.com'] },
  },
  iconUrl: '/ink.png',
} as const

export const optimismChain = {
  id: 10,
  name: 'Optimism',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://mainnet.optimism.io'] },
    public: { http: ['https://mainnet.optimism.io'] },
  },
  iconUrl: '/optimism.png',
} as const

export const baseChain = {
  id: 8453,
  name: 'Base',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://base.lava.build'] },
    public: { http: ['https://base-rpc.publicnode.com'] },
  },
  iconUrl: '/base.png',
} as const

export const unichainChain = {
  id: 130,
  name: 'Unichain',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://unichain-rpc.publicnode.com'] },
    public: { http: ['https://unichain-rpc.publicnode.com'] },
  },
  iconUrl: '/unichain.png',
} as const

// ============= Chain-uri suplimentare pentru bridge =============
export const ethereumChain = {
  id: 1,
  name: 'Ethereum',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://ethereum-public.nodies.app'] },
    public: { http: ['https://ethereum-public.nodies.app'] },
  },
} as const

export const flareChain = {
  id: 14,
  name: 'Flare',
  nativeCurrency: { name: 'Flare', symbol: 'FLR', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.ankr.com/flare'] },
    public: { http: ['https://rpc.ankr.com/flare'] },
  },
} as const

export const cronosChain = {
  id: 25,
  name: 'Cronos',
  nativeCurrency: { name: 'Cronos', symbol: 'CRO', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://evm.cronos.org'] },
    public: { http: ['https://evm.cronos.org'] },
  },
} as const

export const rootstockChain = {
  id: 30,
  name: 'Rootstock',
  nativeCurrency: { name: 'Rootstock', symbol: 'RBTC', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://public-node.rsk.co'] },
    public: { http: ['https://public-node.rsk.co'] },
  },
} as const

export const telosChain = {
  id: 40,
  name: 'Telos',
  nativeCurrency: { name: 'Telos', symbol: 'TLOS', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.telos.net'] },
    public: { http: ['https://rpc.telos.net'] },
  },
} as const

export const xdcChain = {
  id: 50,
  name: 'XDC',
  nativeCurrency: { name: 'XDC', symbol: 'XDC', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.xdc.network'] },
    public: { http: ['https://rpc.xdc.network'] },
  },
} as const

export const bscChain = {
  id: 56,
  name: 'BNB Chain',
  nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://binance-smart-chain-public.nodies.app'] },
    public: { http: ['https://binance-smart-chain-public.nodies.app'] },
  },
  iconUrl: '/bnb.png',
} as const

export const victionChain = {
  id: 88,
  name: 'Viction',
  nativeCurrency: { name: 'Viction', symbol: 'VIC', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.viction.xyz'] },
    public: { http: ['https://rpc.viction.xyz'] },
  },
} as const

export const gnosisChain = {
  id: 100,
  name: 'Gnosis',
  nativeCurrency: { name: 'xDAI', symbol: 'XDAI', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://gnosis-rpc.publicnode.com'] },
    public: { http: ['https://gnosis-rpc.publicnode.com'] },
  },
} as const

export const fuseChain = {
  id: 122,
  name: 'FUSE',
  nativeCurrency: { name: 'Fuse', symbol: 'FUSE', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.fuse.io'] },
    public: { http: ['https://rpc.fuse.io'] },
  },
} as const

export const polygonChain = {
  id: 137,
  name: 'Polygon',
  nativeCurrency: { name: 'Polygon', symbol: 'POL', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://polygon-public.nodies.app'] },
    public: { http: ['https://polygon-public.nodies.app'] },
  },
} as const

export const monadChain = {
  id: 143,
  name: 'Monad',
  nativeCurrency: { name: 'Monad', symbol: 'MON', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.monad.xyz'] },
    public: { http: ['https://monad-mainnet.api.onfinality.io/public'] },
  },
  iconUrl: '/monad.png',
} as const

export const sonicChain = {
  id: 146,
  name: 'Sonic',
  nativeCurrency: { name: 'Sonic', symbol: 'SON', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.sonic.xyz'] },
    public: { http: ['https://rpc.sonic.xyz'] },
  },
} as const

export const xlayerChain = {
  id: 196,
  name: 'XLayer',
  nativeCurrency: { name: 'XLayer', symbol: 'XLAYER', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.xlayer.xyz'] },
    public: { http: ['https://rpc.xlayer.xyz'] },
  },
} as const

export const opbnbChain = {
  id: 204,
  name: 'opBNB',
  nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://opbnb-rpc.publicnode.com'] },
    public: { http: ['https://opbnb-rpc.publicnode.com'] },
  },
} as const

export const lensChain = {
  id: 232,
  name: 'Lens',
  nativeCurrency: { name: 'Lens', symbol: 'LENS', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.lens.xyz'] },
    public: { http: ['https://rpc.lens.xyz'] },
  },
} as const

export const fraxtalChain = {
  id: 252,
  name: 'Fraxtal',
  nativeCurrency: { name: 'Fraxtal', symbol: 'FRAX', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.fraxtal.xyz'] },
    public: { http: ['https://rpc.fraxtal.xyz'] },
  },
} as const

export const bobaChain = {
  id: 288,
  name: 'Boba',
  nativeCurrency: { name: 'Boba', symbol: 'BOBA', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://mainnet.boba.network'] },
    public: { http: ['https://mainnet.boba.network'] },
  },
} as const

export const zksyncChain = {
  id: 324,
  name: 'zkSync',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://mainnet.era.zksync.io'] },
    public: { http: ['https://mainnet.era.zksync.io'] },
  },
} as const

export const worldChain = {
  id: 480,
  name: 'World Chain',
  nativeCurrency: { name: 'World Chain', symbol: 'WC', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.worldchain.xyz'] },
    public: { http: ['https://rpc.worldchain.xyz'] },
  },
} as const

export const flowChain = {
  id: 747,
  name: 'Flow',
  nativeCurrency: { name: 'Flow', symbol: 'FLOW', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://mainnet.evm.nodes.onflow.org'] },
    public: { http: ['https://mainnet.evm.nodes.onflow.org'] },
  },
} as const

export const stableChain = {
  id: 988,
  name: 'Stable',
  nativeCurrency: { name: 'Stable', symbol: 'STABLE', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.stable.xyz'] },
    public: { http: ['https://rpc.stable.xyz'] },
  },
} as const

export const hyperevmChain = {
  id: 999,
  name: 'HyperEVM',
  nativeCurrency: { name: 'HyperEVM', symbol: 'HYPE', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.hyperevm.xyz'] },
    public: { http: ['https://rpc.hyperevm.xyz'] },
  },
} as const

export const metisChain = {
  id: 1088,
  name: 'Metis',
  nativeCurrency: { name: 'Metis', symbol: 'METIS', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://andromeda.metis.io'] },
    public: { http: ['https://andromeda.metis.io'] },
  },
} as const

export const liskChain = {
  id: 1135,
  name: 'Lisk',
  nativeCurrency: { name: 'Lisk', symbol: 'LSK', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.lisk.com'] },
    public: { http: ['https://rpc.lisk.com'] },
  },
} as const

export const moonbeamChain = {
  id: 1284,
  name: 'Moonbeam',
  nativeCurrency: { name: 'Moonbeam', symbol: 'GLMR', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.api.moonbeam.network'] },
    public: { http: ['https://rpc.api.moonbeam.network'] },
  },
} as const

export const seiChain = {
  id: 1329,
  name: 'Sei',
  nativeCurrency: { name: 'Sei', symbol: 'SEI', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://evm-rpc.sei-apis.com'] },
    public: { http: ['https://evm-rpc.sei-apis.com'] },
  },
} as const

export const hyperliquidChain = {
  id: 1337,
  name: 'Hyperliquid',
  nativeCurrency: { name: 'Hyperliquid', symbol: 'HPL', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.hyperliquid.xyz'] },
    public: { http: ['https://rpc.hyperliquid.xyz'] },
  },
} as const

export const vanaChain = {
  id: 1480,
  name: 'Vana',
  nativeCurrency: { name: 'Vana', symbol: 'VAN', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.vana.xyz'] },
    public: { http: ['https://rpc.vana.xyz'] },
  },
} as const

export const gravityChain = {
  id: 1625,
  name: 'Gravity',
  nativeCurrency: { name: 'Gravity', symbol: 'GRAV', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.gravity.xyz'] },
    public: { http: ['https://rpc.gravity.xyz'] },
  },
} as const

export const pharosChain = {
  id: 1672,
  name: 'Pharos Mainnet',
  nativeCurrency: { name: 'Pharos', symbol: 'PHR', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.pharos.xyz'] },
    public: { http: ['https://rpc.pharos.xyz'] },
  },
} as const

export const swellchainChain = {
  id: 1923,
  name: 'Swellchain',
  nativeCurrency: { name: 'Swell', symbol: 'SWELL', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.swellchain.xyz'] },
    public: { http: ['https://rpc.swellchain.xyz'] },
  },
} as const

export const roninChain = {
  id: 2020,
  name: 'Ronin',
  nativeCurrency: { name: 'Ronin', symbol: 'RON', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://api.roninchain.com/rpc'] },
    public: { http: ['https://api.roninchain.com/rpc'] },
  },
} as const

export const abstractChain = {
  id: 2741,
  name: 'Abstract',
  nativeCurrency: { name: 'Abstract', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://api.mainnet.abs.xyz'] },
    public: { http: ['https://api.mainnet.abs.xyz'] },
  },
  iconUrl: '/abstract.png',
} as const

export const morphChain = {
  id: 2818,
  name: 'Morph',
  nativeCurrency: { name: 'Morph', symbol: 'MOP', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.morph.xyz'] },
    public: { http: ['https://rpc.morph.xyz'] },
  },
} as const

export const botanixChain = {
  id: 3637,
  name: 'Botanix',
  nativeCurrency: { name: 'Botanix', symbol: 'BOT', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.botanix.xyz'] },
    public: { http: ['https://rpc.botanix.xyz'] },
  },
} as const

export const tempoChain = {
  id: 4217,
  name: 'Tempo',
  nativeCurrency: { name: 'Tempo', symbol: 'TEM', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.tempo.xyz'] },
    public: { http: ['https://rpc.tempo.xyz'] },
  },
} as const

export const megaethChain = {
  id: 4326,
  name: 'MegaETH',
  nativeCurrency: { name: 'MegaETH', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://mainnet.megaeth.com/rpc'] },
    public: { http: ['https://mainnet.megaeth.com/rpc'] },
  },
  iconUrl: '/megaeth.png',
} as const

export const robinhoodChain = {
  id: 4663,
  name: 'Robinhood',
  nativeCurrency: { name: 'Robinhood', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.mainnet.chain.robinhood.com'] },
    public: { http: ['https://rpc.mainnet.chain.robinhood.com'] },
  },
    iconUrl: '/robinhood.png',
} as const

export const mantleChain = {
  id: 5000,
  name: 'Mantle',
  nativeCurrency: { name: 'Mantle', symbol: 'MNT', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.mantle.xyz'] },
    public: { http: ['https://rpc.mantle.xyz'] },
  },
} as const

export const somniaChain = {
  id: 5031,
  name: 'Somnia',
  nativeCurrency: { name: 'Somnia', symbol: 'SOMI', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.ankr.com/somnia_mainnet'] },
    public: { http: ['https://rpc.ankr.com/somnia_mainnet'] },
  },
  iconUrl: '/somnia.png',
} as const

export const arcChain = {
  id: 5042,
  name: 'Arc',
  nativeCurrency: { name: 'Arc', symbol: 'ARC', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.arc.xyz'] },
    public: { http: ['https://rpc.arc.xyz'] },
  },
} as const

export const kaiaChain = {
  id: 8217,
  name: 'Kaia',
  nativeCurrency: { name: 'Kaia', symbol: 'KAI', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.kaia.xyz'] },
    public: { http: ['https://rpc.kaia.xyz'] },
  },
} as const

export const plasmaChain = {
  id: 9745,
  name: 'Plasma',
  nativeCurrency: { name: 'Plasma', symbol: 'PLA', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.plasma.xyz'] },
    public: { http: ['https://rpc.plasma.xyz'] },
  },
} as const

export const immutableChain = {
  id: 13371,
  name: 'Immutable zkEVM',
  nativeCurrency: { name: 'Immutable', symbol: 'IMX', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.immutable.com'] },
    public: { http: ['https://rpc.immutable.com'] },
  },
} as const

export const zerogChain = {
  id: 16661,
  name: '0G Mainnet',
  nativeCurrency: { name: '0G', symbol: 'ZEROG', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.0g.xyz'] },
    public: { http: ['https://rpc.0g.xyz'] },
  },
} as const

export const apechainChain = {
  id: 33139,
  name: 'Apechain',
  nativeCurrency: { name: 'Apechain', symbol: 'APE', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.apechain.xyz'] },
    public: { http: ['https://rpc.apechain.xyz'] },
  },
} as const

export const modeChain = {
  id: 34443,
  name: 'Mode',
  nativeCurrency: { name: 'Mode', symbol: 'MOD', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.mode.xyz'] },
    public: { http: ['https://rpc.mode.xyz'] },
  },
} as const

export const arbitrumChain = {
  id: 42161,
  name: 'Arbitrum',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://arbitrum-one-public.nodies.app'] },
    public: { http: ['https://arb1.arbitrum.io/rpc'] },
  },
  iconUrl: '/arbitrum.png',
} as const

export const arbitrumNovaChain = {
  id: 42170,
  name: 'Arbitrum Nova',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://nova.arbitrum.io/rpc'] },
    public: { http: ['https://nova.arbitrum.io/rpc'] },
  },
} as const

export const celoChain = {
  id: 42220,
  name: 'Celo',
  nativeCurrency: { name: 'Celo', symbol: 'CEL', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.ankr.com/celo'] },
    public: { http: ['https://rpc.ankr.com/celo'] },
  },
} as const

export const etherlinkChain = {
  id: 42793,
  name: 'Etherlink',
  nativeCurrency: { name: 'Etherlink', symbol: 'ETL', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.etherlink.xyz'] },
    public: { http: ['https://rpc.etherlink.xyz'] },
  },
} as const

export const hemiChain = {
  id: 43111,
  name: 'Hemi',
  nativeCurrency: { name: 'Hemi', symbol: 'HMI', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.hemi.xyz'] },
    public: { http: ['https://rpc.hemi.xyz'] },
  },
} as const

export const avalancheChain = {
  id: 43114,
  name: 'Avalanche',
  nativeCurrency: { name: 'Avalanche', symbol: 'AVAX', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://api.avax.network/ext/bc/C/rpc'] },
    public: { http: ['https://api.avax.network/ext/bc/C/rpc'] },
  },
} as const

export const sophonChain = {
  id: 50104,
  name: 'Sophon',
  nativeCurrency: { name: 'Sophon', symbol: 'SOP', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.sophon.xyz'] },
    public: { http: ['https://rpc.sophon.xyz'] },
  },
} as const

export const superpositionChain = {
  id: 55244,
  name: 'Superposition',
  nativeCurrency: { name: 'Superposition', symbol: 'SUP', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.superposition.xyz'] },
    public: { http: ['https://rpc.superposition.xyz'] },
  },
} as const

export const lineaChain = {
  id: 59144,
  name: 'Linea',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.linea.build'] },
    public: { http: ['https://rpc.linea.build'] },
  },
  iconUrl: '/linea.png',
} as const

export const bobChain = {
  id: 60808,
  name: 'BOB',
  nativeCurrency: { name: 'BOB', symbol: 'BOC', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.bob.xyz'] },
    public: { http: ['https://rpc.bob.xyz'] },
  },
} as const

export const berachainChain = {
  id: 80094,
  name: 'Berachain',
  nativeCurrency: { name: 'Berachain', symbol: 'BER', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.berachain.xyz'] },
    public: { http: ['https://rpc.berachain.xyz'] },
  },
} as const

export const blastChain = {
  id: 81457,
  name: 'Blast',
  nativeCurrency: { name: 'Blast', symbol: 'BLS', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.blast.xyz'] },
    public: { http: ['https://rpc.blast.xyz'] },
  },
} as const

export const baseSepoliaChain = {
  id: 84532,
  name: 'Base Sepolia Testnet',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://sepolia.base.org'] },
    public: { http: ['https://sepolia.base.org'] },
  },
} as const

export const plumeChain = {
  id: 98866,
  name: 'Plume',
  nativeCurrency: { name: 'Plume', symbol: 'PLUME', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.plume.org'] },
    public: { http: ['https://rpc.plume.org'] },
  },
  iconUrl: '/plume.png',
} as const

export const taikoChain = {
  id: 167000,
  name: 'Taiko',
  nativeCurrency: { name: 'Taiko', symbol: 'TAI', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.taiko.xyz'] },
    public: { http: ['https://rpc.taiko.xyz'] },
  },
} as const

export const arbitrumSepoliaChain = {
  id: 421614,
  name: 'Arbitrum Sepolia Testnet',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://sepolia-rollup.arbitrum.io/rpc'] },
    public: { http: ['https://sepolia-rollup.arbitrum.io/rpc'] },
  },
} as const

export const scrollChain = {
  id: 534352,
  name: 'Scroll',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.scroll.io'] },
    public: { http: ['https://rpc.scroll.io'] },
  },
} as const

export const katanaChain = {
  id: 747474,
  name: 'Katana',
  nativeCurrency: { name: 'Katana', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.katanarpc.com'] },
    public: { http: ['https://rpc.katanarpc.com'] },
  },
  iconUrl: '/katana.png',
} as const

export const lighterChain = {
  id: 3586256,
  name: 'Lighter',
  nativeCurrency: { name: 'Lighter', symbol: 'LTR', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.lighter.xyz'] },
    public: { http: ['https://rpc.lighter.xyz'] },
  },
} as const

export const arcTestnetChain = {
  id: 5042002,
  name: 'Arc',
  nativeCurrency: { name: 'Arc', symbol: 'USDC', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.testnet.arc.network'] },
    public: { http: ['https://rpc.testnet.arc.network'] },
  },
  iconUrl: '/arc.png',
} as const

export const opSepoliaChain = {
  id: 11155420,
  name: 'OP Sepolia Testnet',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://sepolia.optimism.io'] },
    public: { http: ['https://sepolia.optimism.io'] },
  },
} as const

export const tronChain = {
  id: 728126428,
  name: 'Tron',
  nativeCurrency: { name: 'Tron', symbol: 'TRX', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://api.trongrid.io'] },
    public: { http: ['https://api.trongrid.io'] },
  },
} as const

export const liteforgeChain = {
  id: 4441,
  name: 'LitVM Liteforge',
  nativeCurrency: { name: 'LitVM Liteforge', symbol: 'zkLTC', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://liteforge.rpc.caldera.xyz/http'] },
    public: { http: ['https://liteforge.rpc.caldera.xyz/http'] },
  },
  iconUrl: '/litvm.png',
} as const

export const ecochainChain = {
  id: 10778,
  name: 'X1 EcoChain',
  nativeCurrency: { name: 'X1 EcoChain', symbol: 'X1T', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://maculatus-rpc.x1eco.com'] },
    public: { http: ['https://maculatus-rpc.x1eco.com'] },
  },
  iconUrl: '/ecochain.png',
} as const

export const giwaChain = {
  id: 91342,
  name: 'Giwa',
  nativeCurrency: { name: 'Giwa', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://sepolia-rpc.giwa.io'] },
    public: { http: ['https://sepolia-rpc.giwa.io'] },
  },
  iconUrl: '/giwa.png',
} as const
// ============= Configurația principală =============
export const config = getDefaultConfig({
  appName: 'Agent GM Protocol',
  projectId: 'f46144873867897ce8bde287cdf40e46',
  chains: [
    soneiumChain,
    inkChain,
    optimismChain,
    baseChain,
    unichainChain,
    ethereumChain,
    flareChain,
    cronosChain,
    rootstockChain,
    telosChain,
    xdcChain,
    bscChain,
    victionChain,
    gnosisChain,
    fuseChain,
    polygonChain,
    monadChain,
    sonicChain,
    xlayerChain,
    opbnbChain,
    lensChain,
    fraxtalChain,
    bobaChain,
    zksyncChain,
    worldChain,
    flowChain,
    stableChain,
    hyperevmChain,
    metisChain,
    liskChain,
    moonbeamChain,
    seiChain,
    hyperliquidChain,
    vanaChain,
    gravityChain,
    pharosChain,
    swellchainChain,
    roninChain,
    abstractChain,
    morphChain,
    botanixChain,
    tempoChain,
    megaethChain,
    robinhoodChain,
    mantleChain,
    somniaChain,
    arcChain,
    kaiaChain,
    plasmaChain,
    immutableChain,
    zerogChain,
    apechainChain,
    modeChain,
    arbitrumChain,
    arbitrumNovaChain,
    celoChain,
    etherlinkChain,
    hemiChain,
    avalancheChain,
    sophonChain,
    superpositionChain,
    lineaChain,
    bobChain,
    berachainChain,
    blastChain,
    baseSepoliaChain,
    plumeChain,
    taikoChain,
    arbitrumSepoliaChain,
    scrollChain,
    katanaChain,
    lighterChain,
    arcTestnetChain,
    opSepoliaChain,
    tronChain,
    liteforgeChain,
    ecochainChain,
    giwaChain
  ],
  transports: {
    [soneiumChain.id]: http(),
    [inkChain.id]: http(),
    [optimismChain.id]: http(),
    [baseChain.id]: http(),
    [unichainChain.id]: http(),
    [ethereumChain.id]: http(),
    [flareChain.id]: http(),
    [cronosChain.id]: http(),
    [rootstockChain.id]: http(),
    [telosChain.id]: http(),
    [xdcChain.id]: http(),
    [bscChain.id]: http(),
    [victionChain.id]: http(),
    [gnosisChain.id]: http(),
    [fuseChain.id]: http(),
    [polygonChain.id]: http(),
    [monadChain.id]: http(),
    [sonicChain.id]: http(),
    [xlayerChain.id]: http(),
    [opbnbChain.id]: http(),
    [lensChain.id]: http(),
    [fraxtalChain.id]: http(),
    [bobaChain.id]: http(),
    [zksyncChain.id]: http(),
    [worldChain.id]: http(),
    [flowChain.id]: http(),
    [stableChain.id]: http(),
    [hyperevmChain.id]: http(),
    [metisChain.id]: http(),
    [liskChain.id]: http(),
    [moonbeamChain.id]: http(),
    [seiChain.id]: http(),
    [hyperliquidChain.id]: http(),
    [vanaChain.id]: http(),
    [gravityChain.id]: http(),
    [pharosChain.id]: http(),
    [swellchainChain.id]: http(),
    [roninChain.id]: http(),
    [abstractChain.id]: http(),
    [morphChain.id]: http(),
    [botanixChain.id]: http(),
    [tempoChain.id]: http(),
    [megaethChain.id]: http(),
    [robinhoodChain.id]: http(),
    [mantleChain.id]: http(),
    [somniaChain.id]: http(),
    [arcChain.id]: http(),
    [kaiaChain.id]: http(),
    [plasmaChain.id]: http(),
    [immutableChain.id]: http(),
    [zerogChain.id]: http(),
    [apechainChain.id]: http(),
    [modeChain.id]: http(),
    [arbitrumChain.id]: http(),
    [arbitrumNovaChain.id]: http(),
    [celoChain.id]: http(),
    [etherlinkChain.id]: http(),
    [hemiChain.id]: http(),
    [avalancheChain.id]: http(),
    [sophonChain.id]: http(),
    [superpositionChain.id]: http(),
    [lineaChain.id]: http(),
    [bobChain.id]: http(),
    [berachainChain.id]: http(),
    [blastChain.id]: http(),
    [baseSepoliaChain.id]: http(),
    [plumeChain.id]: http(),
    [taikoChain.id]: http(),
    [arbitrumSepoliaChain.id]: http(),
    [scrollChain.id]: http(),
    [katanaChain.id]: http(),
    [lighterChain.id]: http(),
    [arcTestnetChain.id]: http(),
    [opSepoliaChain.id]: http(),
    [tronChain.id]: http(),
    [liteforgeChain.id]: http(),
    [ecochainChain.id]: http(),
    [giwaChain.id]: http(),
  },
})

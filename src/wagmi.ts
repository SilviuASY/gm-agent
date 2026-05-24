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
    default: { http: ['https://optimism-public.nodies.app'] },
    public: { http: ['https://optimism-public.nodies.app'] },
  },
  iconUrl: '/optimism.png',
} as const

export const baseChain = {
  id: 8453,
  name: 'Base',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://base-public.nodies.app'] },
    public: { http: ['https://base-public.nodies.app'] },
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

// Configurația principală pentru RainbowKit și Wagmi
export const config = getDefaultConfig({
  appName: 'Agent GM Protocol',
  projectId: '6aa7072f821f3b0218542737006796a7',
  chains: [soneiumChain, inkChain, optimismChain, baseChain, unichainChain],
  transports: {
    [soneiumChain.id]: http(),
    [inkChain.id]: http(),
    [optimismChain.id]: http(),
    [baseChain.id]: http(),
    [unichainChain.id]: http(),
  },
})
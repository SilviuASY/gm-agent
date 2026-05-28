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



// Configurația principală pentru RainbowKit și Wagmi
export const config = getDefaultConfig({
  appName: 'Agent GM Protocol',
  projectId: 'f46144873867897ce8bde287cdf40e46',
  chains: [soneiumChain],
  transports: {
    [soneiumChain.id]: http(),
  },
})

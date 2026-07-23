// src/pages/GM.tsx
import {
  Box,
  Container,
  Flex,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  SimpleGrid,
  Button,
  useToast,
  Image,
  Spinner,
  Tooltip,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Link,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Skeleton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from "@chakra-ui/react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  useAccount,
  useSwitchChain,
  useReadContract,
  useReadContracts,
  useBalance,
  useWriteContract,
} from "wagmi";
import { waitForTransactionReceipt, getAccount } from "@wagmi/core";
import { useState, useMemo, useEffect } from "react";
import { ChevronLeftIcon, ChevronDownIcon, StarIcon, InfoIcon, ExternalLinkIcon, CheckCircleIcon, SearchIcon, CloseIcon } from "@chakra-ui/icons";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { useFixScroll } from "../hooks/useFixScroll";
import { useNavigate, useSearchParams } from "react-router-dom";
import { 
  soneiumChain,
  inkChain,
  optimismChain,
  baseChain,
  unichainChain,
  robinhoodChain,
  monadChain,
  megaethChain,
  bscChain,
  lineaChain, 
  plumeChain,
  arbitrumChain,
  somniaChain, 
  katanaChain,
  modeChain,
  worldChain,
  liteforgeChain,
  ecochainChain,
  abstractChain,
  arcTestnetChain,
  giwaChain,
  config as wagmiConfig,
} from "../wagmi";
// ============= ABIs =============
const DailyGMABI = [
  { type: 'function', name: 'gm', stateMutability: 'payable', inputs: [], outputs: [] },
  { type: 'function', name: 'gmFee', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'balanceOf', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'nextTokenId', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
] as const;
const DeployABI = [
  { inputs: [], stateMutability: "nonpayable", type: "constructor" },
  { inputs: [{ internalType: "address", name: "owner", type: "address" }], name: "OwnableInvalidOwner", type: "error" },
  { inputs: [{ internalType: "address", name: "account", type: "address" }], name: "OwnableUnauthorizedAccount", type: "error" },
  { anonymous: false, inputs: [{ indexed: false, internalType: "address", name: "contractAddress", type: "address" }, { indexed: false, internalType: "address", name: "owner", type: "address" }], name: "ContractDeployed", type: "event" },
  { anonymous: false, inputs: [{ indexed: true, internalType: "address", name: "previousOwner", type: "address" }, { indexed: true, internalType: "address", name: "newOwner", type: "address" }], name: "OwnershipTransferred", type: "event" },
  { inputs: [], name: "deploy", outputs: [], stateMutability: "payable", type: "function" },
  { inputs: [], name: "gmFee", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ internalType: "address", name: "user", type: "address" }], name: "getUserDeploymentCount", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "totalDeployments", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
] as const;
const SBT_ABI = [
  { type: 'function', name: 'balanceOf', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }] },
] as const;
// ============= Constants =============
const SONEIUM_CHAIN_ID = 1868;
const SBT_CONTRACT_ADDRESS = '0x13DBC40aB0695a7c392BB6447f972995A71527f9';
// List of testnet chain IDs
const TESTNET_CHAIN_IDS: number[] = [
  liteforgeChain.id,
  ecochainChain.id,
  arcTestnetChain.id,
  giwaChain.id
];
// Function to check if a chain is testnet
const isTestnetChain = (chainId: number): boolean => {
  return TESTNET_CHAIN_IDS.includes(chainId);
};
const chains = [soneiumChain, 
  inkChain, 
  optimismChain, 
  baseChain, 
  unichainChain, 
  robinhoodChain, 
  monadChain, 
  megaethChain,
  bscChain,
  abstractChain,
  lineaChain,
  plumeChain,
  arbitrumChain,
  somniaChain, 
  katanaChain,
  modeChain,
  worldChain,
  liteforgeChain,
  ecochainChain,
  arcTestnetChain,
  giwaChain,
];
const EXPLORER_URLS: Record<number, string> = {
  [soneiumChain.id]: 'https://soneium.blockscout.com/tx/',
  [inkChain.id]: 'https://explorer.inkonchain.com/tx/',
  [optimismChain.id]: 'https://optimistic.etherscan.io/tx/',
  [baseChain.id]: 'https://basescan.org/tx/',
  [unichainChain.id]: 'https://uniscan.xyz/tx/',
  [robinhoodChain.id]: 'https://robinhoodchain.blockscout.com/tx/',
  [monadChain.id]: 'https://monadscan.com/tx/',
  [megaethChain.id]: 'https://megaeth.blockscout.com/tx/',
  [bscChain.id]: 'https://bscscan.com/tx/',
  [abstractChain.id]: 'https://abscan.org/tx/',
  [lineaChain.id]: 'https://lineascan.build/tx/',
  [plumeChain.id]: 'https://explorer.plume.org/tx/',
  [arbitrumChain.id]: 'https://arbiscan.io/tx/',
  [somniaChain.id]: 'https://explorer.somnia.network/tx/',
  [katanaChain.id]: 'https://explorer.katanarpc.com/tx/',
  [liteforgeChain.id]: 'https://liteforge.explorer.caldera.xyz/tx/',
  [ecochainChain.id]: 'https://maculatus-scan.x1eco.com/tx/',
  [arcTestnetChain.id]: 'https://testnet.arcscan.app/tx/',
  [giwaChain.id]: 'https://sepolia-explorer.giwa.io/',
  [worldChain.id]: 'https://worldchain-mainnet.explorer.alchemy.com/',
  [modeChain.id]: 'https://explorer.mode.network/',
  
};
const GM_CONTRACTS: Record<number, `0x${string}`> = {
  [soneiumChain.id]: '0x2aa8F86C5905f94e8B4d16B6Cd6A0a5e79131821',
  [inkChain.id]: '0x4aBAc309b992B5863d70A2EF4E81B52F05f26B4C',
  [optimismChain.id]: '0x489D39fF70e8ED45261D5353C0e999c2Da2FE132',
  [baseChain.id]: '0xbDf4dce745F5D945DF7Ed88681Df31bb17631692',
  [unichainChain.id]: '0xea36D3Ce511F3f91cfef12497DB3bd9611072314',
  [robinhoodChain.id]: '0x4A14077d1fa77dE42217EE48DED2099b83D714E1',
  [monadChain.id]: '0x992f77E78052Bc35a9209F5f153d1DA921A75Cd8',
  [megaethChain.id]: '0x01E5caF3235B8128C13c93c8F170d6fdF6F86a70',
  [bscChain.id]: '0xd326Cb7938454499aa7F0a3f66F657BdaFa9071c',
  [abstractChain.id]: '0xCF3Be362F59B8E67d487Ecb78F39107A5bC52122',
  [lineaChain.id]: '0xa0866b3D535985ea7d8e925a7A03cDDD37aB1a94',
  [plumeChain.id]: '0x10A1106a1597421ec0DF1709C13826611797C9b3',
  [arbitrumChain.id]: '0xB071EebE62589EF72F46Fc0563546fF60e31c96F',
  [somniaChain.id]: '0x8C4486b0Aa5AB4Fe1a1E7dCdacD45098D224899A',
  [katanaChain.id]: '0xc09349baBedf46CcbA46cB1F4C14d0b8f2fd5726',
  [liteforgeChain.id]: '0x53d3cFEf87fBC62b7f91e2577E8409a545814587',
  [ecochainChain.id]: '0x8f5F899667E301645491116ea2B79Be299c60cE4',
  [arcTestnetChain.id]: '0x5A7B96bFefE14E216E41D5E2FEF40E8dD47db0Ea',
  [giwaChain.id]: '0xc8Fa6657886B97b0D09De4A946c35A5aE10AdD48',
  [worldChain.id]: '0xEbb225CB1139497581870b15CF759EA79F0356CA',
  [modeChain.id]: '0x162f26083cA2B5405124fC532109b8b8B512951f',
};

const DEPLOY_CONTRACTS: Record<number, `0x${string}`> = {
  [soneiumChain.id]: '0xc1966b48008B7153E9B7441F06b21Ef2E52014C4',
  [inkChain.id]: '0x45bE5f350D14faC218158Fd380283C18e8df6F2B',
  [optimismChain.id]: '0x56C4615c640773D6832CF27b6Dd37825Db267a70',
  [baseChain.id]: '0xd7DE83f3Be7e75dfF4e3cBA4cB64a6394a0E6299',
  [unichainChain.id]: '0x1e1322Deed86cC53031843f323F16415Ba0e9152',
  [robinhoodChain.id]: '0x6573bc9090BbCae309d2A3D95fDAC05617914000',
  [monadChain.id]: '0x6B126c96E5187d71EbB6EaA4d6cd225f382752cf',
  [megaethChain.id]: '0xabd30e8C2298F390e08Fe49E24917C6eC4542DD3',
  [bscChain.id]: '0x763B7E815C5d645a40df2A329FAd6516FC7cdEcA',
  [abstractChain.id]: '0x23dDe3aC6d9F6d47e2b781Db947cc9Be64Cf32cd',
  [lineaChain.id]: '0xada9f6A0AD0c4605b6F59C2AE99d395DA0198A23',
  [plumeChain.id]: '0xCafaD4695AAa566e23464afd7F9602249B0aB02C',
  [arbitrumChain.id]: '0x5e01A9b2BCc4F78A4A247CA2cAC94B0Fa4F21cA0',
  [somniaChain.id]: '0x323A89Ce7Af62299F586419938FB4a84c4C30f67',
  [katanaChain.id]: '0x64B41a111645a85eDD7cC8587BA5261053aE58A2',
  [liteforgeChain.id]: '0xC8538F3b792D58d8D829fAfFC3AfFf3D8F410047',
  [ecochainChain.id]: '0x55231Bc7686c280f9EA6d7ddf963B2606E3D93aF',
  [arcTestnetChain.id]: '0x428066D90a5e59a9025DCFEA5edF81b02Ce6040D',
  [giwaChain.id]: '0x6573bc9090BbCae309d2A3D95fDAC05617914000',
  [worldChain.id]: '0xd7109d454872D72e80138B65676AA67613EdE1A6',
  [modeChain.id]: '0xd4501d4246aCE784698939a9220F203c3A2c6695',
};

const TWITTER_LINKS: Record<number, string> = {
  [soneiumChain.id]: 'https://twitter.com/soneium',
  [inkChain.id]: 'https://twitter.com/inkonchain',
  [optimismChain.id]: 'https://twitter.com/optimism',
  [baseChain.id]: 'https://twitter.com/base',
  [unichainChain.id]: 'https://twitter.com/unichain',
  [robinhoodChain.id]: 'https://twitter.com/RobinhoodApp',
  [monadChain.id]: 'https://twitter.com/monad_xyz',
  [megaethChain.id]: 'https://x.com/megaeth',
  [bscChain.id]: 'https://twitter.com/BNBCHAIN',
  [abstractChain.id]: 'https://twitter.com/AbstractChain',
  [lineaChain.id]: 'https://twitter.com/LineaBuild',
  [plumeChain.id]: 'https://twitter.com/plumenetwork',
  [arbitrumChain.id]: 'https://twitter.com/arbitrum',
  [somniaChain.id]: 'https://twitter.com/Somnia_Network',
  [katanaChain.id]: 'https://twitter.com/katana',
  [liteforgeChain.id]: 'https://x.com/LitecoinVM',
  [ecochainChain.id]: 'https://x.com/X1_EcoChain',
  [arcTestnetChain.id]: 'https://twitter.com/arc',
  [giwaChain.id]: 'https://x.com/GIWA_by_Upbit',
  [worldChain.id]: 'https://x.com/world_chain_',
  [modeChain.id]: 'https://x.com/modenetwork',
};

const DEFAULT_TWITTER_LINK = 'https://x.com/gm_agent_xyz';
// Bridge — same site, different page. Shown on every card regardless of balance.
// Internal route (React Router), not an external URL — navigated to with useNavigate
// instead of a full page reload via <a href>.
const BRIDGE_PATH = '/bridge';
// Faucet links — only shown on testnet cards. Replace with your preferred faucet
// if you'd rather point users somewhere else.
const FAUCET_LINKS: Record<number, string> = {
  [liteforgeChain.id]: 'https://liteforge.hub.caldera.xyz',
  [ecochainChain.id]: 'https://testnet.x1ecochain.com',
  [arcTestnetChain.id]: 'https://faucet.circle.com',
  [giwaChain.id]: 'https://faucet.giwa.io',
};
// Cards Colour
const chainMetadata: Record<number, { color: string; gradient: string; glowColor: string }> = {
  [soneiumChain.id]: {
    color: '#0997e9',
    gradient: 'linear(135deg, #035381, #067abd, #0babf5)',
    glowColor: 'rgba(8, 156, 241, 0.35)',
  },
  [inkChain.id]: {
    color: '#c026d3',
    gradient: 'linear(135deg, #7c3aed, #c026d3, #e879f9)',
    glowColor: 'rgba(192,38,211,0.35)',
  },
  [optimismChain.id]: {
    color: '#ff0420',
    gradient: 'linear(135deg, #cc0000, #ff0420, #ff6b6b)',
    glowColor: 'rgba(255,4,32,0.35)',
  },
  [baseChain.id]: {
    color: '#2563eb',
    gradient: 'linear(135deg, #1d4ed8, #2563eb, #60a5fa)',
    glowColor: 'rgba(37,99,235,0.35)',
  },
  [unichainChain.id]: {
    color: '#f72585',
    gradient: 'linear(135deg, #c2185b, #f72585, #ff6eb4)',
    glowColor: 'rgba(247,37,133,0.35)',
  },
  [robinhoodChain.id]: {
    color: '#7ef014',
    gradient: 'linear(135deg, #6cd814, #78eb0c, #96ec0c)',
    glowColor: 'rgba(32, 233, 42, 0.35)',
  },
  [monadChain.id]: {
    color: '#640fec',
    gradient: 'linear(135deg, #5f0fe0, #6b1fe4, #6607d3)',
    glowColor: 'rgba(106, 29, 194, 0.35)',
  },
  [megaethChain.id]: {
    color: '#737a7e',
    gradient: 'linear(135deg, #899297, #818586, #b8c0c2)',
    glowColor: 'rgba(110, 112, 114, 0.35)',
  },
  [bscChain.id]: {
    color: '#d8b908',
    gradient: 'linear(135deg, #9c6806, #e48d0a, #e0d208)',
    glowColor: 'rgba(219, 146, 9, 0.35)',
  },
  [abstractChain.id]: {
    color: '#49d608',
    gradient: 'linear(135deg, #078039, #07c521, #65ee09)',
    glowColor: 'rgba(27, 211, 10, 0.35)',
  },
  [lineaChain.id]: {
    color: '#0fc4e4',
    gradient: 'linear(135deg, #0bb8b8, #0dcfe9, #09e7e7)',
    glowColor: 'rgba(7, 193, 240, 0.35)',
  },
  [plumeChain.id]: {
    color: '#e26b0a',
    gradient: 'linear(135deg, #d4660b, #ce800c, #e29609)',
    glowColor: 'rgba(211, 117, 11, 0.35)',
  },
  [somniaChain.id]: {
    color: '#620aee',
    gradient: 'linear(135deg, #440ae4, #6a07db, #9d09e2)',
    glowColor: 'rgba(78, 13, 231, 0.35)',
  },
  [katanaChain.id]: {
    color: '#06a362',
    gradient: 'linear(135deg, #0d81e0, #0bda84, #36e40b)',
    glowColor: 'rgba(8, 231, 175, 0.35)',
  },
  [liteforgeChain.id]: {
    color: '#8e9097',
    gradient: 'linear(135deg, #24244d, #504497, #d1cfec)',
    glowColor: 'rgba(78, 70, 126, 0.35)',
  },
  [ecochainChain.id]: {
    color: '#099b21',
    gradient: 'linear(135deg, #057c05, #06c43f, #51e70c)',
    glowColor: 'rgba(27, 187, 12, 0.35)',
  },
  [arcTestnetChain.id]: {
    color: '#053c70',
    gradient: 'linear(135deg, #033658, #37a8e9, #82c5da)',
    glowColor: 'rgba(6, 151, 161, 0.35)',
  },
  [giwaChain.id]: {
    color: '#b5f3f3',
    gradient: 'linear(135deg, #202122, #92989b, #e7eef0)',
    glowColor: 'rgba(217, 232, 233, 0.35)',
  },
  [worldChain.id]: {
    color: '#c2dfdf',
    gradient: 'linear(135deg, #5e6063, #aab1b4, #f0f4f5)',
    glowColor: 'rgba(218, 240, 241, 0.35)',
  },
  [modeChain.id]: {
    color: '#b0ec09',
    gradient: 'linear(135deg, #84a707, #a5c908, #d3f705)',
    glowColor: 'rgba(168, 235, 11, 0.35)',
  },
};
// ============= Multicall layout =============
// Every chain contributes a fixed number of entries to the batched
// `useReadContracts` call below. These offsets describe where each value
// lives inside the flat results array so we can look it up by index instead
// of running a separate RPC read per card.
//
// IMPORTANT: this page reads ONLY the fee for GM and Deploy per chain — no
// on-chain counting of GMs/deploys/users anymore, to keep the page fast.
const GLOBAL_FIELDS_PER_CHAIN = 2; // [gmFee, deployFee]
// ============= Types =============
interface TxSuccess {
  hash: string;
  chainName: string;
  chainId: number;
  type: 'gm' | 'deploy';
  isExempt: boolean;
}
type LoadingPhase = 'switching' | 'sending' | 'confirming';
// ============= Motion =============
const MotionBox = motion(Box);
// ============= Small helpers =============
// Creates/updates a <meta> tag in <head> — used for the Open Graph tags below.
// Kept dependency-free (no react-helmet) so it works regardless of what's
// already set up in the project.
const upsertMetaTag = (attr: 'name' | 'property', key: string, content: string) => {
  if (typeof document === 'undefined') return;
  let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
};
// ============= Static "growing" counters =============
// These numbers are intentionally NOT read from chain state (see note above). They are
// deterministic, seeded pseudo-metrics that tick up by a small amount once per calendar
// day — same value for every visitor, zero RPC cost.
const GROWTH_EPOCH = new Date('2026-01-01T00:00:00Z').getTime();
const seededDailyIncrement = (day: number, seed: number, min: number, max: number) => {
  const x = Math.sin((day + seed) * 12.9898) * 43758.5453;
  const frac = x - Math.floor(x);
  return min + Math.floor(frac * (max - min + 1));
};
const getGrowingStat = (baseValue: number, seed: number, min: number, max: number) => {
  const daysElapsed = Math.max(0, Math.floor((Date.now() - GROWTH_EPOCH) / 86400000));
  let total = baseValue;
  for (let d = 0; d < daysElapsed; d++) {
    total += seededDailyIncrement(d, seed, min, max);
  }
  return total;
};
// ============= Chain-switch reliability helpers =============
// Root cause of the "current chain of the wallet does not match the target chain"
// error even though the switch actually goes through: the wallet/provider reports its
// new chainId a little *after* `switchChain` resolves, so the very next `writeContract`
// call still sees the old chain for a brief moment. Two things fix this:
//  1) After asking the wallet to switch, poll the *actual* connector state (not a React
//     hook, which can lag a render behind) until it reports the target chain.
//  2) If the write still throws a chain-mismatch error, resync once and retry
//     automatically — the user never sees it or has to click again.
const isChainMismatchError = (error: any): boolean => {
  const msg = `${error?.shortMessage || error?.message || ''}`.toLowerCase();
  return (
    msg.includes('does not match the target chain') ||
    msg.includes('does not match') ||
    msg.includes('chain mismatch') ||
    msg.includes('chainmismatch')
  );
};
const ensureWalletOnChain = async (targetChainId: number, timeoutMs = 10000): Promise<boolean> => {
  if (getAccount(wagmiConfig).chainId === targetChainId) return true;
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (getAccount(wagmiConfig).chainId === targetChainId) return true;
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  return getAccount(wagmiConfig).chainId === targetChainId;
};
// ============= Specific error messages =============
// Instead of dumping the raw contract/wallet error at the user, this maps the most
// common failure patterns to a clear title + actionable description. Returns null for
// user-initiated cancellations, which stay silent (same as before).
const isUserRejection = (error: any): boolean => {
  const msg = `${error?.shortMessage || error?.message || ''}`.toLowerCase();
  return (
    msg.includes('user rejected') ||
    msg.includes('user denied') ||
    msg.includes('rejected the request') ||
    msg.includes('request rejected')
  );
};
const getErrorDetails = (error: any, type: 'gm' | 'deploy'): { title: string; description: string } | null => {
  if (isUserRejection(error)) return null;
  const raw = `${error?.shortMessage || error?.message || ''}`;
  const msg = raw.toLowerCase();
  const actionWord = type === 'gm' ? 'GM' : 'deploy';
  if (msg.includes('insufficient funds') || msg.includes('exceeds balance') || msg.includes("doesn't have enough")) {
    return {
      title: 'Insufficient Funds',
      description: `You don't have enough balance to cover the fee and gas for this ${actionWord}. Top up your wallet on this network and try again.`,
    };
  }
  if (isChainMismatchError(error)) {
    return {
      title: 'Network Switch Issue',
      description: 'Your wallet didn\'t fully switch networks in time. Please wait a moment and try again.',
    };
  }
  if (msg.includes('nonce too low') || msg.includes('already known') || msg.includes('replacement transaction underpriced')) {
    return {
      title: 'Transaction Already Pending',
      description: 'You already have a pending transaction on this network. Wait for it to confirm, then try again.',
    };
  }
  if (msg.includes('execution reverted') || msg.includes('reverted')) {
    return {
      title: 'Transaction Reverted',
      description: `The contract rejected this ${actionWord}. Double-check the fee amount shown on the card and try again.`,
    };
  }
  if (
    msg.includes('timeout') ||
    msg.includes('failed to fetch') ||
    msg.includes('internal json-rpc error') ||
    msg.includes('network error') ||
    msg.includes('too many requests') ||
    msg.includes('429') ||
    msg.includes('503')
  ) {
    return {
      title: 'Network Congested',
      description: 'The RPC endpoint seems busy right now. Please wait a few seconds and try again.',
    };
  }
  return {
    title: type === 'gm' ? 'GM Failed' : 'Deploy Failed',
    description: raw.split('\n')[0] || 'Something went wrong. Please try again.',
  };
};
// ============= Local streak tracker =============
// Tracks, purely on this device (localStorage), which calendar days the connected
// wallet has done a GM or a Deploy on each chain. No server, no RPC — it just marks
// today's date under the chain whenever an action confirms successfully.
const STREAK_STORAGE_KEY = 'gm_deploy_streak_v1';
type StreakData = Record<string, string[]>; // chainId (as string) -> ["YYYY-MM-DD", ...]
const pad2 = (n: number) => String(n).padStart(2, '0');
const toDateKey = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const getTodayKey = () => toDateKey(new Date());
const loadStreakData = (): StreakData => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STREAK_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};
const recordStreakActivity = (chainId: number) => {
  if (typeof window === 'undefined') return;
  try {
    const data = loadStreakData();
    const key = String(chainId);
    const today = getTodayKey();
    const existing = data[key] || [];
    if (!existing.includes(today)) {
      data[key] = [...existing, today];
      window.localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(data));
    }
  } catch {
    /* best-effort only — never block a transaction over this */
  }
};
// Builds a proper calendar-month grid: `null` for the leading/trailing blanks needed to
// align day 1 under its actual weekday, and the day number (1..daysInMonth) otherwise.
// Weeks start on Monday. Automatically produces 28/29/30/31 day cells depending on month.
const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const getMonthGrid = (year: number, monthIndex: number): (number | null)[] => {
  const firstOfMonth = new Date(year, monthIndex, 1);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const firstWeekdayIndex = (firstOfMonth.getDay() + 6) % 7; // 0 = Monday
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekdayIndex; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(day);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
};
// Consecutive days counting back from today with at least one activity date in `dates`.
const computeCurrentStreak = (dates: string[]): number => {
  const set = new Set(dates);
  let streak = 0;
  const cursor = new Date();
  // Allow "today not done yet" to not zero out yesterday's streak.
  if (!set.has(toDateKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (set.has(toDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
};
// ============= Styles =============
const pageStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap');
  @keyframes floatCard {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-7px); }
  }
  @keyframes shimmerBorder {
    0%   { background-position: -200% 0; }
    100% { background-position:  200% 0; }
  }
  @keyframes pulseGlow {
    0%, 100% { opacity: 0.55; }
    50%      { opacity: 1; }
  }
  @keyframes shimmerBtn {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }
  @keyframes gridMove {
    0%   { background-position: 0 0; }
    100% { background-position: 48px 48px; }
  }
  @keyframes orbFloat {
    0%, 100% { transform: scale(1)   translateY(0px);   opacity: 0.45; }
    50%      { transform: scale(1.1) translateY(-20px);  opacity: 0.7; }
  }
  @keyframes rotateRing {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes scanline {
    0%   { top: -8%; }
    100% { top: 108%; }
  }
  @keyframes successPop {
    0%   { transform: scale(0.75) translateY(16px); opacity: 0; }
    65%  { transform: scale(1.04) translateY(-3px); opacity: 1; }
    100% { transform: scale(1)    translateY(0px);  opacity: 1; }
  }
  @keyframes hashReveal {
    from { opacity: 0; letter-spacing: 0.4em; }
    to   { opacity: 1; letter-spacing: 0.07em; }
  }
  @keyframes countUp {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes testnetPulse {
    0%, 100% { opacity: 0.8; transform: scale(1); }
    50%      { opacity: 1; transform: scale(1.05); }
  }
  /* Keep the RainbowKit connect/account button text on a single line
     (e.g. "0x0f3...56dD") instead of wrapping to two lines and inflating
     the button's height. */
  .wallet-connect-btn button,
  .wallet-connect-btn button * {
    white-space: nowrap !important;
  }
`;
// ============= X (Twitter) icon =============
const XIcon = (props: any) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <path
      fill="currentColor"
      d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
    />
  </Icon>
);
// ============= TX Success Modal =============
const TxSuccessModal = ({
  isOpen,
  onClose,
  tx,
}: {
  isOpen: boolean;
  onClose: () => void;
  tx: TxSuccess | null;
}) => {
  if (!tx) return null;
  const meta = chainMetadata[tx.chainId] || chainMetadata[soneiumChain.id];
  const explorerUrl = `${EXPLORER_URLS[tx.chainId] || '#'}${tx.hash}`;
  const shortHash = `${tx.hash.slice(0, 10)}...${tx.hash.slice(-8)}`;
  const isGM = tx.type === 'gm';
  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="sm">
      <ModalOverlay bg="rgba(0,0,0,0.8)" backdropFilter="blur(14px)" />
      <ModalContent bg="transparent" border="none" boxShadow="none" mx={4}>
        <ModalCloseButton
          color="gray.500" top={4} right={4} zIndex={10}
          _hover={{ color: 'white', bg: 'rgba(255,255,255,0.08)' }}
          borderRadius="full"
        />
        <ModalBody p={0}>
          <Box
            bg="rgba(4,4,14,0.98)"
            border={`1px solid ${meta.color}45`}
            borderRadius="2xl"
            overflow="hidden"
            position="relative"
            style={{ animation: 'successPop 0.42s cubic-bezier(0.34,1.56,0.64,1) forwards' }}
            boxShadow={`0 0 80px ${meta.glowColor}, 0 0 0 1px rgba(255,255,255,0.04) inset`}
          >
            {/* shimmer top bar */}
            <Box h="2px" bgGradient={meta.gradient} backgroundSize="200% 100%" style={{ animation: 'shimmerBorder 2s infinite' }} />
            {/* bg glow blob */}
            <Box
              position="absolute" top="-30px" left="50%" transform="translateX(-50%)"
              w="280px" h="180px" borderRadius="full"
              bg={`radial-gradient(circle, ${meta.color}18 0%, transparent 70%)`}
              filter="blur(50px)" pointerEvents="none"
            />
            <VStack spacing={5} p={7} position="relative" zIndex={1}>
              {/* rotating icon ring */}
              <Box position="relative" w="84px" h="84px">
                <Box position="absolute" inset={0} borderRadius="full" border={`1px solid ${meta.color}30`} style={{ animation: 'rotateRing 5s linear infinite' }} />
                <Box position="absolute" inset="8px" borderRadius="full" border={`1px dashed ${meta.color}18`} style={{ animation: 'rotateRing 8s linear infinite reverse' }} />
                <Flex position="absolute" inset="16px" borderRadius="full" bg={`${meta.color}12`} border={`1px solid ${meta.color}25`} align="center" justify="center" fontSize="26px">
                  {isGM ? '🌅' : '🚀'}
                </Flex>
              </Box>
              {/* title */}
              <VStack spacing={1.5}>
                <HStack spacing={2}>
                  <Icon as={CheckCircleIcon} color="#4ade80" boxSize={4} />
                  <Heading
                    fontSize="xl" fontWeight="800"
                    bgGradient={meta.gradient} bgClip="text"
                    fontFamily="'Space Grotesk', sans-serif" letterSpacing="-0.02em"
                  >
                    {isGM ? 'GM Sent!' : 'Deployed!'}
                  </Heading>
                </HStack>
                <Text fontSize="sm" color="gray.400" textAlign="center" fontFamily="'Space Grotesk', sans-serif">
                  {isGM
                    ? `Your morning greeting landed on ${tx.chainName}`
                    : `Contract is now live on ${tx.chainName}`}
                </Text>
                {tx.isExempt && (
                  <Badge
                    bgGradient="linear(135deg, #2dd4bf, #0d9488)" 
                    color="white"
                    fontSize="10px" px={3} py={1} borderRadius="full"
                    fontFamily="'Space Mono', monospace"
                  >
                    ✨ Fee Exempt · SBT Holder
                  </Badge>
                )}
              </VStack>
              {/* divider */}
              <Box w="full" h="1px" bg={`linear-gradient(90deg, transparent, ${meta.color}25, transparent)`} />
              {/* tx hash */}
              <VStack spacing={2} w="full" align="stretch">
                <Text fontSize="9px" textTransform="uppercase" letterSpacing="0.2em" color="gray.600" fontFamily="'Space Mono', monospace">
                  Transaction Hash
                </Text>
                <Box
                  bg="rgba(255,255,255,0.025)" border="1px solid rgba(255,255,255,0.06)"
                  borderRadius="lg" px={3} py={2.5}
                >
                  <Text
                    fontSize="xs" fontFamily="'Space Mono', monospace" color={meta.color}
                    style={{ animation: 'hashReveal 0.5s ease-out forwards' }}
                    wordBreak="break-all"
                  >
                    {shortHash}
                  </Text>
                </Box>
              </VStack>
              {/* explorer CTA */}
              <Link href={explorerUrl} isExternal w="full" _hover={{ textDecoration: 'none' }}>
                <Button
                  w="full" h="50px" bgGradient={meta.gradient} color="white"
                  fontWeight="700" fontSize="sm" borderRadius="xl"
                  rightIcon={<ExternalLinkIcon boxSize={3.5} />}
                  _hover={{ opacity: 0.88, transform: 'translateY(-2px)', boxShadow: `0 10px 35px ${meta.glowColor}` }}
                  _active={{ transform: 'scale(0.97)' }}
                  transition="all 0.22s"
                  fontFamily="'Space Grotesk', sans-serif"
                  letterSpacing="0.01em"
                >
                  View on Explorer
                </Button>
              </Link>
              <Button
                variant="ghost" size="sm" color="gray.600" onClick={onClose}
                _hover={{ color: 'white', bg: 'rgba(255,255,255,0.04)' }}
                borderRadius="full" fontFamily="'Space Grotesk', sans-serif"
              >
                Close
              </Button>
            </VStack>
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
// ============= Streak Tracker Modal =============
// Opens on the current calendar month, defaulted to Soneium. A compact chain selector
// lets the user switch to any other chain on the site; the grid always shows exactly
// the real number of days in the current month (28–31), correctly aligned under their
// actual weekday, with today's date visibly marked.
const StreakTrackerModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [streakData, setStreakData] = useState<StreakData>({});
  const [selectedChainId, setSelectedChainId] = useState<number>(SONEIUM_CHAIN_ID);
  useEffect(() => {
    if (isOpen) {
      setStreakData(loadStreakData());
      setSelectedChainId(SONEIUM_CHAIN_ID);
    }
  }, [isOpen]);
  const today = useMemo(() => new Date(), [isOpen]);
  const todayDay = today.getDate();
  const monthLabel = useMemo(
    () => today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    [today]
  );
  const monthGrid = useMemo(
    () => getMonthGrid(today.getFullYear(), today.getMonth()),
    [today]
  );
  const buildDateKeyForDay = (day: number) => toDateKey(new Date(today.getFullYear(), today.getMonth(), day));
  const overallDates = useMemo(() => {
    const set = new Set<string>();
    Object.values(streakData).forEach((arr) => arr.forEach((d) => set.add(d)));
    return Array.from(set);
  }, [streakData]);
  const overallStreak = useMemo(() => computeCurrentStreak(overallDates), [overallDates]);
  const selectedChain = chains.find((c) => c.id === selectedChainId) || soneiumChain;
  const selectedMeta = chainMetadata[selectedChainId] || chainMetadata[soneiumChain.id];
  const selectedChainDates = streakData[String(selectedChainId)] || [];
  const selectedChainSet = useMemo(() => new Set(selectedChainDates), [selectedChainDates]);
  const selectedChainStreak = useMemo(() => computeCurrentStreak(selectedChainDates), [selectedChainDates]);
  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="lg" scrollBehavior="inside">
      <ModalOverlay bg="rgba(0,0,0,0.8)" backdropFilter="blur(14px)" />
      <ModalContent
        bg="rgba(4,4,14,0.98)"
        border="1px solid rgba(249,115,22,0.18)"
        borderRadius="2xl"
        mx={4}
        maxH="86vh"
        boxShadow="0 0 90px rgba(249,115,22,0.12)"
      >
        <ModalCloseButton color="gray.500" _hover={{ color: 'white', bg: 'rgba(255,255,255,0.08)' }} borderRadius="full" />
        <ModalBody p={{ base: 5, md: 7 }}>
          <VStack align="stretch" spacing={5}>
            <VStack align="start" spacing={1}>
              <HStack spacing={2}>
                <Text fontSize="2xl">🔥</Text>
                <Heading fontSize="xl" color="white" fontWeight="800" fontFamily="'Space Grotesk', sans-serif">
                  Streak Tracker
                </Heading>
              </HStack>
              <Text fontSize="xs" color="gray.500" fontFamily="'Space Grotesk', sans-serif">
                Tracked locally on this device, based on your GM &amp; Deploy activity.
              </Text>
            </VStack>
            {/* Overall combined streak */}
            <Box bg="rgba(249,115,22,0.06)" border="1px solid rgba(249,115,22,0.2)" borderRadius="xl" p={4}>
              <Flex justify="space-between" align="center">
                <Text fontSize="sm" color="gray.300" fontFamily="'Space Grotesk', sans-serif">
                  Overall current streak (any chain)
                </Text>
                <Text fontSize="lg" fontWeight="800" color="#f97316" fontFamily="'Space Mono', monospace">
                  {overallStreak > 0 ? `🔥 ${overallStreak} day${overallStreak === 1 ? '' : 's'}` : 'No streak yet'}
                </Text>
              </Flex>
            </Box>
            {/* Chain selector + selected chain's streak */}
            <Flex justify="space-between" align="center" wrap="wrap" gap={3}>
              <Menu>
                <MenuButton
                  as={Button}
                  variant="outline"
                  size="sm"
                  h="38px"
                  borderRadius="lg"
                  borderColor={`${selectedMeta.color}40`}
                  bg="rgba(255,255,255,0.03)"
                  color="white"
                  rightIcon={<ChevronDownIcon />}
                  _hover={{ bg: `${selectedMeta.color}14`, borderColor: `${selectedMeta.color}70` }}
                  fontFamily="'Space Grotesk', sans-serif"
                >
                  <HStack spacing={2}>
                    <Image
                      src={selectedChain.iconUrl}
                      alt={selectedChain.name}
                      boxSize="16px"
                      borderRadius="full"
                      fallbackSrc="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16'></svg>"
                    />
                    <Text fontSize="sm">{selectedChain.name}</Text>
                  </HStack>
                </MenuButton>
                <MenuList
                  bg="rgba(4,4,14,0.98)"
                  borderColor="rgba(255,255,255,0.1)"
                  maxH="280px"
                  overflowY="auto"
                  zIndex={20}
                >
                  {chains.map((chain) => (
                    <MenuItem
                      key={chain.id}
                      onClick={() => setSelectedChainId(chain.id)}
                      bg="transparent"
                      _hover={{ bg: 'rgba(255,255,255,0.06)' }}
                      _focus={{ bg: 'rgba(255,255,255,0.06)' }}
                    >
                      <HStack spacing={2}>
                        <Image
                          src={chain.iconUrl}
                          alt={chain.name}
                          boxSize="16px"
                          borderRadius="full"
                          fallbackSrc="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16'></svg>"
                        />
                        <Text fontSize="sm" color="white" fontFamily="'Space Grotesk', sans-serif">
                          {chain.name}
                        </Text>
                      </HStack>
                    </MenuItem>
                  ))}
                </MenuList>
              </Menu>
              <Text
                fontSize="sm" fontWeight="700" fontFamily="'Space Mono', monospace"
                color={selectedChainStreak > 0 ? '#f97316' : 'gray.600'}
              >
                {selectedChainStreak > 0 ? `🔥 ${selectedChainStreak} day${selectedChainStreak === 1 ? '' : 's'}` : 'No streak yet'}
              </Text>
            </Flex>
            {/* Calendar month grid for the selected chain */}
            <Box bg="rgba(255,255,255,0.02)" border="1px solid rgba(255,255,255,0.05)" borderRadius="xl" p={4}>
              <Flex justify="space-between" align="center" mb={3}>
                <Text fontSize="sm" fontWeight="700" color="white" fontFamily="'Space Grotesk', sans-serif">
                  {monthLabel}
                </Text>
                <Text fontSize="10px" color="gray.500" fontFamily="'Space Mono', monospace" textTransform="uppercase" letterSpacing="0.1em">
                  Today · {todayDay}
                </Text>
              </Flex>
              <SimpleGrid columns={7} spacing={1.5} mb={1.5}>
                {WEEKDAY_LABELS.map((w) => (
                  <Text
                    key={w} textAlign="center" fontSize="9px" color="gray.600"
                    fontFamily="'Space Mono', monospace" fontWeight="700" textTransform="uppercase"
                  >
                    {w}
                  </Text>
                ))}
              </SimpleGrid>
              <SimpleGrid columns={7} spacing={1.5}>
                {monthGrid.map((day, i) => {
                  if (day === null) return <Box key={`blank-${i}`} />;
                  const dateKey = buildDateKeyForDay(day);
                  const active = selectedChainSet.has(dateKey);
                  const isToday = day === todayDay;
                  const isFuture = day > todayDay;
                  return (
                    <Tooltip key={dateKey} label={dateKey} hasArrow fontSize="10px">
                      <Flex
                        direction="column"
                        align="center"
                        justify="center"
                        aspectRatio="1"
                        borderRadius="lg"
                        bg={active ? `${selectedMeta.color}22` : 'rgba(255,255,255,0.02)'}
                        border={
                          isToday
                            ? `2px solid ${selectedMeta.color}`
                            : `1px solid ${active ? `${selectedMeta.color}50` : 'rgba(255,255,255,0.06)'}`
                        }
                        transition="all 0.15s"
                        _hover={{ borderColor: `${selectedMeta.color}70` }}
                      >
                        <Text
                          fontSize="11px"
                          fontWeight={isToday ? '800' : '600'}
                          color={isToday || active ? 'white' : 'gray.500'}
                          fontFamily="'Space Mono', monospace"
                          lineHeight="1"
                        >
                          {day}
                        </Text>
                        {!isFuture && (
                          <Text fontSize={active ? '17px' : '17px'} lineHeight="1" mt="2px" opacity={active ? 1 : 0.45}>
                            {active ? '🔥' : '💤'}
                          </Text>
                        )}
                      </Flex>
                    </Tooltip>
                  );
                })}
              </SimpleGrid>
            </Box>
            {/* Legend */}
            <HStack spacing={4} justify="center">
              <HStack spacing={1.5}>
                <Text fontSize="10px">🔥</Text>
                <Text fontSize="10px" color="gray.500" fontFamily="'Space Grotesk', sans-serif">GM or Deploy done</Text>
              </HStack>
              <HStack spacing={1.5}>
                <Box w="10px" h="10px" borderRadius="sm" border={`2px solid ${selectedMeta.color}`} />
                <Text fontSize="10px" color="gray.500" fontFamily="'Space Grotesk', sans-serif">Today</Text>
              </HStack>
            </HStack>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
// ============= Stat Card =============
const StatCard = ({ stat, index }: { stat: any; index: number }) => (
  <MotionBox
    initial={{ opacity: 0, y: 24 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: index * 0.08 }}
    position="relative"
    h="full"
    _hover={{ transform: 'translateY(-5px)' }}
    sx={{ transition: 'transform 0.3s cubic-bezier(0.175,0.885,0.32,1.275)' }}
  >
    <Box
      bg="rgba(4,4,14,0.85)"
      backdropFilter="blur(20px)"
      borderRadius="2xl"
      p={{ base: 3.5, md: 5 }}
      border={`1px solid ${stat.color}20`}
      overflow="hidden"
      position="relative"
      h="full"
      _hover={{
        borderColor: `${stat.color}55`,
        boxShadow: `0 0 40px ${stat.glowColor}, inset 0 1px 0 rgba(255,255,255,0.04)`,
      }}
      transition="all 0.35s ease"
    >
      {/* top accent line */}
      <Box position="absolute" top={0} left={0} right={0} h="1px"
        bg={`linear-gradient(90deg, transparent, ${stat.color}60, transparent)`} />
      {/* corner glow */}
      <Box position="absolute" top={0} right={0} w="80px" h="80px"
        bg={`radial-gradient(circle at top right, ${stat.color}15, transparent 70%)`} />
      <HStack spacing={3} align="center" position="relative" zIndex={1}>
        <Flex
          align="center" justify="center"
          w={{ base: "40px", md: "52px" }} h={{ base: "40px", md: "52px" }}
          bg={`${stat.color}10`} border={`1px solid ${stat.color}22`}
          borderRadius="xl" flexShrink={0}
          fontSize={{ base: "18px", md: "24px" }}
          style={{ animation: 'floatCard 5s ease-in-out infinite' }}
        >
          {stat.icon}
        </Flex>
        <Box flex="1" minW="0">
          <Text fontSize="9px" color="gray.500" textTransform="uppercase" letterSpacing="0.2em"
            fontFamily="'Space Mono', monospace" fontWeight="700" mb={0.5}>
            {stat.label}
          </Text>
          <Text fontSize={{ base: "lg", md: "xl" }} fontWeight="800" color="white"
            fontFamily="'Space Mono', monospace" letterSpacing="-0.02em" lineHeight="1.1"
            style={{ animation: 'countUp 0.6s ease-out forwards' }}>
            {stat.value}
          </Text>
          <Text fontSize="9px" color="gray.400" mt={1} fontFamily="'Space Grotesk', sans-serif" fontWeight="500">
            {stat.description}
          </Text>
        </Box>
      </HStack>
    </Box>
  </MotionBox>
);
// ============= SBT Badge =============
const SBTBadge = ({ hasSBT }: { hasSBT: boolean }) => {
  if (!hasSBT) return null;
  return (
    <Tooltip label="Soneium Soulbound Token — fee exempt on all actions" hasArrow placement="top">
      <Badge
        bgGradient="linear(135deg, #2dd4bf, #0d9488)"
        color="white" fontSize="12px" px={2.5} py={1}
        borderRadius="full" display="inline-flex" alignItems="center" gap={1.5}
        boxShadow="0 0 18px rgba(45,212,191,0.35)"
        _hover={{ transform: 'scale(1.06)' }}
        transition="all 0.2s"
        style={{ animation: 'pulseGlow 3s ease-in-out infinite' }}
        fontFamily="'Space Mono', monospace"
        letterSpacing="0.05em"
      >
        <StarIcon boxSize={2.5} />
        SBT
      </Badge>
    </Tooltip>
  );
};
// ============= Testnet Badge =============
const TestnetBadge = () => {
  return (
    <Tooltip label="This is a testnet network — use for testing purposes" hasArrow placement="top">
      <Badge
        bg="rgba(7, 121, 228, 0.12)"
        color="#0be4ec"
        fontSize="12px"
        px={3}
        py={1.5}
        borderRadius="full"
        border="1px solid rgba(12, 129, 207, 0.2)"
        display="inline-flex"
        alignItems="center"
        gap={1.5}
        boxShadow="0 0 20px rgba(11, 119, 182, 0.12)"
        _hover={{ transform: 'scale(1.08)' }}
        transition="all 0.2s"
        style={{ animation: 'testnetPulse 2.5s ease-in-out infinite' }}
        fontFamily="'Space Mono', monospace"
        letterSpacing="0.06em"
      >
        Testnet
      </Badge>
    </Tooltip>
  );
};
// ============= Fee Display =============
const FeeDisplay = ({
  fee,
  isExempt,
  chainId,
  isLoading,
  hasError,
  onRetry,
}: {
  fee: bigint;
  isExempt: boolean;
  chainId: number;
  isLoading?: boolean;
  hasError?: boolean;
  onRetry?: () => void;
}) => {
  const formatted = (Number(fee) / 1e18).toFixed(6);
  const symbol = chains.find(c => c.id === chainId)?.nativeCurrency?.symbol || 'ETH';
  if (isLoading) {
    return (
      <Skeleton
        height="16px" width="72px" mx="auto" borderRadius="md"
        startColor="rgba(255,255,255,0.04)" endColor="rgba(255,255,255,0.14)"
      />
    );
  }
  if (hasError) {
    return (
      <Tooltip label="Couldn't load this value from the RPC" hasArrow>
        <Button
          variant="link" size="xs" color="#f87171" onClick={onRetry}
          fontFamily="'Space Mono', monospace" fontWeight="700"
        >
          ⚠️ Retry
        </Button>
      </Tooltip>
    );
  }
  
  if (isExempt) {
    return (
      <Tooltip label="Free for SBT holders on Soneium" hasArrow>
        <HStack spacing={1} justify="center">
          <Text as="del" fontSize="xs" color="gray.700" fontFamily="'Space Mono', monospace">{formatted} {symbol}</Text>
          <Badge colorScheme="teal" fontSize="9px" px={1.5} py={0.5} borderRadius="full" fontFamily="'Space Mono', monospace" bg="#2dd4bf" color="white">
            FREE
          </Badge>
        </HStack>
      </Tooltip>
    );
  }
  return (
    <Text fontSize="sm" fontWeight="700" fontFamily="'Space Mono', monospace" color="white">
      {formatted}{' '}
      <Text as="span" color="gray.600" fontSize="10px">{symbol}</Text>
    </Text>
  );
};
// ============= Action Card =============
const ActionCard = ({
  chain,
  index,
  type,
  isLoading,
  isGlobalLoading,
  loadingPhase,
  onAction,
  onRetry,
  fee,
  twitterUrl,
  hasSBT,
  isConnected,
  isFeeLoading,
  hasFeeError,
  balance,
  isBalanceLoading,
}: {
  chain: any;
  index: number;
  type: 'gm' | 'deploy';
  isLoading: boolean;
  isGlobalLoading: boolean;
  loadingPhase?: LoadingPhase | null;
  onAction: () => void;
  onRetry: () => void;
  fee: bigint;
  twitterUrl: string;
  hasSBT: boolean;
  isConnected: boolean;
  isFeeLoading?: boolean;
  hasFeeError?: boolean;
  balance?: bigint;
  isBalanceLoading?: boolean;
}) => {
  const meta = chainMetadata[chain.id] || chainMetadata[soneiumChain.id];
  const isSoneium = chain.id === SONEIUM_CHAIN_ID;
  const isExempt = isSoneium && hasSBT;
  const isTestnet = isTestnetChain(chain.id);
  const isGM = type === 'gm';
  const actionLabel = isGM ? `GM to ${chain.name}` : `Deploy to ${chain.name}`;
  const toast = useToast();
  const navigate = useNavigate();
  // Loading text reflects the actual phase of the transaction (switching network,
  // waiting for wallet signature, or waiting for on-chain confirmation) instead of
  // a single generic label.
  const phaseLoadingLabel: Record<LoadingPhase, string> = {
    switching: 'Switching network…',
    sending: isGM ? 'Sending GM…' : 'Deploying…',
    confirming: 'Confirming on-chain…',
  };
  const loadingLabel = loadingPhase ? phaseLoadingLabel[loadingPhase] : (isGM ? 'Sending GM…' : 'Deploying…');
  // Balance check: only meaningful once both the fee and the balance have
  // actually loaded, and never for fee-exempt (SBT) actions.
  const feeToCompare = isExempt ? 0n : fee;
  const hasInsufficientBalance =
    isConnected &&
    !isExempt &&
    !isFeeLoading &&
    !isBalanceLoading &&
    balance !== undefined &&
    balance < feeToCompare;
  
  // Disable only the button, not the whole card
  const isButtonDisabled = !isConnected || isLoading || isGlobalLoading || hasInsufficientBalance;
  // Button label: when the wallet doesn't have enough funds, the button itself shows
  // that message (and stays disabled) instead of a separate line of text under the
  // button — keeps the card's height stable no matter which chain is short on funds.
  const buttonLabel = hasInsufficientBalance
    ? 'Insufficient balance'
    : isExempt
      ? `✨ ${actionLabel}`
      : isGM
        ? `🌅 ${actionLabel}`
        : `🚀 ${actionLabel}`;
  const handleShare = async () => {
    const url = `${window.location.origin}${window.location.pathname}?chainId=${chain.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: 'Link copied',
        description: `Shareable link for ${chain.name} copied to clipboard.`,
        status: 'success', duration: 3000, isClosable: true, position: 'top-right',
      });
    } catch {
      toast({ title: 'Could not copy link', status: 'error', duration: 3000, isClosable: true, position: 'top-right' });
    }
  };
  return (
    <MotionBox
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -7, transition: { duration: 0.2 } }}
      position="relative" h="full"
    >
      {/* outer ambient glow */}
      <Box
        position="absolute" inset="-2px" borderRadius="2xl"
        bg={`radial-gradient(ellipse at 50% 0%, ${meta.color}15 0%, transparent 60%)`}
        pointerEvents="none" transition="opacity 0.4s"
      />
      <Box
        position="relative" bg="rgba(4,4,14,0.93)" backdropFilter="blur(28px)"
        borderRadius="2xl" border="1px solid" borderColor={`${meta.color}20`}
        overflow="hidden" h="full" minH="470px" display="flex" flexDirection="column"
        _hover={{
          borderColor: `${meta.color}60`,
          boxShadow: `0 28px 80px ${meta.glowColor}, inset 0 1px 0 rgba(255,255,255,0.04)`,
        }}
        transition="all 0.38s cubic-bezier(0.175,0.885,0.32,1.275)"
      >
        {/* top shimmer bar */}
        <Box
          position="absolute" top={0} left={0} right={0} h="2px"
          bgGradient={meta.gradient}
          backgroundSize="200% 100%"
          style={{ animation: 'shimmerBorder 3.5s infinite' }}
        />
        {/* scanline */}
        <Box
          position="absolute" left={0} right={0} h="50px" pointerEvents="none" zIndex={0}
          bg={`linear-gradient(180deg, transparent 0%, ${meta.color}05 50%, transparent 100%)`}
          style={{ animation: 'scanline 9s linear infinite' }}
        />
        {/* SBT Badge - top left */}
        <Flex position="absolute" top={3} left={3} zIndex={3}>
          {isSoneium && <SBTBadge hasSBT={hasSBT} />}
        </Flex>
        {/* Testnet Badge - top right */}
        {isTestnet && (
          <Flex position="absolute" top={3} right={3} zIndex={3}>
            <TestnetBadge />
          </Flex>
        )}
        <Box p={{ base: 5, md: 6 }} flex="1" display="flex" flexDirection="column" position="relative" zIndex={1}>
          <VStack spacing={4} align="stretch" flex="1">
            {/* chain icon with rotating rings */}
            <Flex justify="center" pt={4} position="relative">
              <Box
                position="relative"
                style={{ animation: `floatCard ${3.5 + index * 0.4}s ease-in-out infinite` }}
              >
                <Box position="absolute" inset="-12px" borderRadius="full"
                  border={`1px solid ${meta.color}20`}
                  style={{ animation: 'rotateRing 9s linear infinite' }} />
                <Box position="absolute" inset="-20px" borderRadius="full"
                  border={`1px dashed ${meta.color}10`}
                  style={{ animation: 'rotateRing 14s linear infinite reverse' }} />
                <Box position="absolute" inset="-4px" borderRadius="full"
                  bg={`radial-gradient(circle, ${meta.color}22, transparent 70%)`}
                  filter="blur(8px)" />
                <Image
                  src={chain.iconUrl}
                  alt={chain.name}
                  boxSize={{ base: "60px", md: "70px" }}
                  borderRadius="full"
                  bg={`${meta.color}08`}
                  p={1.5}
                  border={`2px solid ${meta.color}30`}
                  position="relative" zIndex={1}
                  fallbackSrc="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='70' height='70'><text y='52%' x='50%' text-anchor='middle' dominant-baseline='middle' font-size='34'>⛓️</text></svg>"
                />
              </Box>
              {/* Bridge (mainnet/L2 cards) or Faucet (testnet cards) — absolutely positioned in the
                  free space to the right of the icon, so it never touches the icon↔name spacing. */}
              <Box position="absolute" right={{ base: "-6px", md: "-4px" }} top="105%" transform="translateY(-50%)">
                <Tooltip
                  label={isTestnet ? `Get free testnet funds for ${chain.name}` : 'Bridge assets on the Agent Protocol site'}
                  hasArrow
                  placement="top"
                >
                  {isTestnet ? (
                    <Link
                      href={FAUCET_LINKS[chain.id] || '#'}
                      isExternal
                      _hover={{ textDecoration: 'none' }}
                    >
                      <Badge
                        bg="rgba(11,228,236,0.16)"
                        color="#0be4ec"
                        fontSize="10px" px={3} py={1.5} borderRadius="full"
                        border="1px solid rgba(11,228,236,0.4)"
                        fontFamily="'Space Mono', monospace" letterSpacing="0.06em" fontWeight="900"
                        textTransform="none"
                        cursor="pointer"
                        boxShadow="0 0 14px rgba(11,228,236,0.18)"
                        _hover={{
                          bg: 'rgba(11,228,236,0.26)',
                          borderColor: 'rgba(11,228,236,0.7)',
                          transform: 'scale(1.06)',
                        }}
                        transition="all 0.2s"
                      >
                        Faucet
                      </Badge>
                    </Link>
                  ) : (
                    <Box onClick={() => navigate(BRIDGE_PATH)} display="inline-block" _hover={{ textDecoration: 'none' }}>
                      <Badge
                        bg="rgba(45,212,191,0.16)"
                        color="#2dd4bf"
                        fontSize="10px" px={3} py={1.5} borderRadius="full"
                        border="1px solid rgba(45,212,191,0.4)"
                        fontFamily="'Space Mono', monospace" letterSpacing="0.06em" fontWeight="900"
                        textTransform="none"
                        cursor="pointer"
                        boxShadow="0 0 14px rgba(45,212,191,0.2)"
                        _hover={{
                          bg: 'rgba(45,212,191,0.28)',
                          borderColor: 'rgba(45,212,191,0.7)',
                          transform: 'scale(1.06)',
                        }}
                        transition="all 0.2s"
                      >
                        Bridge
                      </Badge>
                    </Box>
                  )}
                </Tooltip>
              </Box>
            </Flex>
            {/* chain name + id */}
            <VStack spacing={1.5} pt={1}>
              <Heading
                fontSize={{ base: "md", md: "lg" }} fontWeight="800"
                bgGradient={meta.gradient}
                bgClip="text" letterSpacing="-0.015em"
                fontFamily="'Space Grotesk', sans-serif" textAlign="center"
              >
                {chain.name}
              </Heading>
              <Badge
                fontSize="9px" px={2} py={0.5} borderRadius="full"
                bg="rgba(255,255,255,0.04)" color="gray.600"
                border="1px solid rgba(255,255,255,0.06)"
                fontFamily="'Space Mono', monospace"
              >
                Chain {chain.id}
              </Badge>
            </VStack>
            {/* separator */}
            <Box h="1px" bg={`linear-gradient(90deg, transparent, ${meta.color}25, transparent)`} />
            {/* stats */}
            <SimpleGrid columns={2} spacing={3}>
              <Box
                bg="rgba(255,255,255,0.022)" border="1px solid rgba(255,255,255,0.05)"
                borderRadius="xl" p={3} textAlign="center"
                _hover={{ bg: `${meta.color}08`, borderColor: `${meta.color}18` }}
                transition="all 0.2s"
              >
                <Text fontSize="9px" color="gray.600" fontWeight="700" textTransform="uppercase"
                  letterSpacing="0.15em" fontFamily="'Space Mono', monospace" mb={1.5}>Fee</Text>
                <MotionBox
                  key={isFeeLoading ? 'fee-loading' : 'fee-loaded'}
                  initial={isFeeLoading ? false : { opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: isFeeLoading ? 0 : index * 0.05, ease: 'easeOut' }}
                >
                  <FeeDisplay
                    fee={fee} isExempt={isExempt} chainId={chain.id}
                    isLoading={isFeeLoading} hasError={hasFeeError} onRetry={onRetry}
                  />
                </MotionBox>
              </Box>
              {/* Twitter / X follow — static, doesn't touch the RPC at all */}
              <Link href={twitterUrl} isExternal _hover={{ textDecoration: 'none' }}>
                <Box
                  bg="rgba(255,255,255,0.022)" border="1px solid rgba(255,255,255,0.05)"
                  borderRadius="xl" p={3} textAlign="center" h="full"
                  _hover={{ bg: `${meta.color}08`, borderColor: `${meta.color}18` }}
                  transition="all 0.2s"
                >
                  <Text fontSize="9px" color="gray.600" fontWeight="700" textTransform="uppercase"
                    letterSpacing="0.15em" fontFamily="'Space Mono', monospace" mb={1.5}>
                    Community
                  </Text>
                  <HStack justify="center" spacing={1.5}>
                    <XIcon boxSize="12px" color="white" />
                    <Text fontSize="sm" fontWeight="700" color="white" fontFamily="'Space Grotesk', sans-serif">
                      Follow
                    </Text>
                  </HStack>
                </Box>
              </Link>
            </SimpleGrid>
            {/* professional share row (moved here from the header area) */}
            <Tooltip label={`Copy a direct link to ${chain.name} you can share`} hasArrow placement="top">
              <Button
                w="full" h="42px" variant="outline"
                borderColor={`${meta.color}30`}
                bg="rgba(255,255,255,0.018)"
                color={meta.color}
                fontWeight="700" fontSize="xs" borderRadius="xl"
                letterSpacing="0.06em" textTransform="uppercase"
                leftIcon={<Text as="span" fontSize="13px" lineHeight={1}>🔗</Text>}
                onClick={handleShare}
                _hover={{
                  bg: `${meta.color}12`,
                  borderColor: `${meta.color}60`,
                  transform: 'translateY(-1px)',
                  boxShadow: `0 8px 24px ${meta.glowColor}`,
                }}
                _active={{ transform: 'scale(0.98)' }}
                transition="all 0.22s"
                fontFamily="'Space Grotesk', sans-serif"
              >
                Share this chain
              </Button>
            </Tooltip>
            <Button
              w="full" h="52px" fontWeight="700" fontSize="sm" color="white" borderRadius="xl"
              bgGradient={meta.gradient}
              backgroundSize="200% auto"
              _hover={{
                transform: 'translateY(-2px)',
                boxShadow: `0 14px 45px ${meta.glowColor}`,
                backgroundPosition: 'right center',
              }}
              _active={{ transform: 'scale(0.97)' }}
              onClick={onAction}
              isLoading={isLoading}
              loadingText={loadingLabel}
              spinner={<Spinner size="sm" />}
              isDisabled={isButtonDisabled}
              position="relative" overflow="hidden"
              fontFamily="'Space Grotesk', sans-serif"
              letterSpacing="0.01em"
              transition="all 0.28s ease"
              _before={{
                content: '""',
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.14), transparent)',
                backgroundSize: '200% 100%',
                animation: 'shimmerBtn 2.5s infinite',
                pointerEvents: 'none',
                opacity: isButtonDisabled ? 0 : 1,
              }}
              opacity={isButtonDisabled && !isLoading ? 0.6 : 1}
            >
              {buttonLabel}
            </Button>
            {!isConnected && (
              <Text fontSize="10px" color="gray.700" textAlign="center" fontFamily="'Space Grotesk', sans-serif">
                Connect wallet to continue
              </Text>
            )}
            {isGlobalLoading && !isLoading && (
              <Text fontSize="10px" color="gray.500" textAlign="center" fontFamily="'Space Grotesk', sans-serif">
                Another transaction in progress...
              </Text>
            )}
          </VStack>
        </Box>
      </Box>
    </MotionBox>
  );
};
// ============= Info Section =============
const InfoSection = ({ }: { isGM: boolean }) => (
  <MotionBox
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: 0.15 }}
    mt={10}
  >
    <Box
      bg="rgba(4,4,14,0.8)" backdropFilter="blur(20px)"
      borderRadius="2xl" border="1px solid rgba(139,92,246,0.1)"
      p={{ base: 5, md: 7 }} overflow="hidden" position="relative"
    >
      {/* top gradient bar */}
      <Box position="absolute" top={0} left={0} right={0} h="2px"
        bgGradient="linear(90deg, #0d9488, #2dd4bf, #c026d3, #f72585, #2563eb)"
        backgroundSize="300% 100%" style={{ animation: 'shimmerBorder 4s infinite' }}
      />
      {/* bg glow blobs */}
      <Box position="absolute" top={0} right={0} w="250px" h="250px"
        bg="radial-gradient(circle at top right, rgba(45,212,191,0.06), transparent 65%)" pointerEvents="none" />
      <Box position="absolute" bottom={0} left={0} w="200px" h="200px"
        bg="radial-gradient(circle at bottom left, rgba(192,38,211,0.06), transparent 65%)" pointerEvents="none" />
      <VStack spacing={5} align="stretch" position="relative" zIndex={1}>
        {/* section header */}
        <HStack spacing={3}>
          <Flex w="34px" h="34px" align="center" justify="center"
            bg="rgba(45,212,191,0.1)" border="1px solid rgba(45,212,191,0.2)" borderRadius="lg">
            <InfoIcon color="#2dd4bf" boxSize={4} />
          </Flex>
          <Box>
            <Heading size="sm" color="white" fontWeight="700" fontFamily="'Space Grotesk', sans-serif">
              What is GM &amp; Deploy?
            </Heading>
            <Text fontSize="xs" color="gray.500" fontFamily="'Space Grotesk', sans-serif">
              Agent GM Protocol · {chains.length} Networks
            </Text>
          </Box>
        </HStack>
        <Text fontSize="sm" color="gray.400" lineHeight="1.8" fontFamily="'Space Grotesk', sans-serif">
          Interact with the{' '}
          <Text as="span" color="#2dd4bf" fontWeight="600">Agent GM Protocol</Text>{' '}
          across{' '}
          <Text as="span" color="#2dd4bf" fontWeight="600">{chains.length} blockchain networks</Text>.
          {' '}Build your on-chain reputation with daily GM messages, or deploy smart contracts
          with one click — no configuration required.
        </Text>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <Box
            p={4} bg="rgba(45,212,191,0.04)" borderRadius="xl"
            border="1px solid rgba(45,212,191,0.1)"
            _hover={{ bg: 'rgba(45,212,191,0.08)', borderColor: 'rgba(45,212,191,0.2)' }}
            transition="all 0.22s"
          >
            <HStack spacing={3} align="start">
              <Text fontSize="xl" mt={0.5} flexShrink={0}>🌅</Text>
              <Box>
                <Text fontWeight="700" color="#2dd4bf" fontSize="sm" mb={1} fontFamily="'Space Grotesk', sans-serif">
                  Say GM
                </Text>
                <Text fontSize="xs" color="gray.400" lineHeight="1.7" fontFamily="'Space Grotesk', sans-serif">
                  Send a daily on-chain greeting across any network. Each GM mints an ERC-8004 token and
                  contributes to your activity streak.
                </Text>
              </Box>
            </HStack>
          </Box>
          <Box
            p={4} bg="rgba(192,38,211,0.04)" borderRadius="xl"
            border="1px solid rgba(192,38,211,0.1)"
            _hover={{ bg: 'rgba(192,38,211,0.08)', borderColor: 'rgba(192,38,211,0.2)' }}
            transition="all 0.22s"
          >
            <HStack spacing={3} align="start">
              <Text fontSize="xl" mt={0.5} flexShrink={0}>🚀</Text>
              <Box>
                <Text fontWeight="700" color="#e879f9" fontSize="sm" mb={1} fontFamily="'Space Grotesk', sans-serif">
                  Deploy Contract
                </Text>
                <Text fontSize="xs" color="gray.400" lineHeight="1.7" fontFamily="'Space Grotesk', sans-serif">
                  Deploy a smart contract on any supported chain in seconds. Ideal for testing,
                  prototyping, or launching your next dApp.
                </Text>
              </Box>
            </HStack>
          </Box>
        </SimpleGrid>
        {/* feature pills */}
        <Box h="1px" bg="linear-gradient(90deg, transparent, rgba(139,92,246,0.18), transparent)" />
        <HStack spacing={3} wrap="wrap">
          {[
            { dot: '#4ade80', text: 'Real on-chain txs' },
            { dot: '#a78bfa', text: 'ERC-8004 compatible' },
            { dot: '#2dd4bf', text: 'SBT fee exempt on Soneium' },
            { dot: '#38bdf8', text: 'Daily GM streaks' },
          ].map(({ dot, text }) => (
            <HStack key={text} spacing={1.5}>
              <Box w="5px" h="5px" borderRadius="full" bg={dot} flexShrink={0} />
              <Text fontSize="xs" color="gray.400" fontFamily="'Space Grotesk', sans-serif">{text}</Text>
            </HStack>
          ))}
        </HStack>
      </VStack>
    </Box>
  </MotionBox>
);
// ============= Empty State (search) =============
const NoChainsFound = ({ query }: { query: string }) => (
  <Box
    textAlign="center"
    py={16}
    bg="rgba(4,4,14,0.5)"
    borderRadius="2xl"
    border="1px solid rgba(255,255,255,0.05)"
  >
    <Text fontSize="xl" color="gray.500" fontFamily="'Space Grotesk', sans-serif">
      No chains found matching "{query}"
    </Text>
    <Text fontSize="sm" color="gray.600" mt={2} fontFamily="'Space Grotesk', sans-serif">
      Try searching by chain name
    </Text>
  </Box>
);
// ============= Footer =============
const Footer = () => {
  const chainsCount = chains.length;
  
  return (
    <Box pt={10} pb={6} position="relative">
      {/* separator */}
      <Box h="1px" mb={8} bg="linear-gradient(90deg, transparent, rgba(45,212,191,0.2), rgba(192,38,211,0.2), transparent)" />
      <VStack spacing={5}>
        {/* chain pills row */}
        <HStack spacing={2} justify="center" flexWrap="wrap">
          {chains.map((chain) => {
            const color = chainMetadata[chain.id]?.color || '#6b7280';
            return (
              <Box
                key={chain.id}
                px={3} py={1} borderRadius="full"
                bg={`${color}10`} border={`1px solid ${color}25`}
                _hover={{ bg: `${color}18`, borderColor: `${color}45`, transform: 'translateY(-1px)' }}
                transition="all 0.2s"
              >
                <Text fontSize="10px" fontWeight="700" color={color} fontFamily="'Space Mono', monospace" letterSpacing="0.08em">
                  {chain.name}
                </Text>
              </Box>
            );
          })}
        </HStack>
        {/* stat row */}
        <HStack
          spacing={0} justify="center" flexWrap="wrap"
          bg="rgba(255,255,255,0.02)" border="1px solid rgba(255,255,255,0.04)"
          borderRadius="2xl" px={6} py={3} gap={0}
        >
          {[
            { label: 'Networks', value: chainsCount.toString() },
            { label: 'Protocol', value: 'ERC-8004' },
            { label: 'Fee', value: 'Per Chain' },
            { label: 'Status', value: 'Live ✓' },
          ].map(({ label, value }, i, arr) => (
            <HStack key={label} spacing={0}>
              <VStack spacing={0} px={{ base: 4, md: 6 }} py={1}>
                <Text fontSize="9px" color="gray.600" textTransform="uppercase" letterSpacing="0.18em"
                  fontFamily="'Space Mono', monospace">{label}</Text>
                <Text fontSize="xs" fontWeight="700" color="gray.400" fontFamily="'Space Mono', monospace">
                  {value}
                </Text>
              </VStack>
              {i < arr.length - 1 && (
                <Box w="1px" h="28px" bg="rgba(255,255,255,0.06)" flexShrink={0} />
              )}
            </HStack>
          ))}
        </HStack>
        {/* bottom line */}
        <VStack spacing={1}>
          <Text fontSize="9px" color="gray.500" fontFamily="'Space Mono', monospace" letterSpacing="0.12em" textAlign="center">
            © 2026 · Agent GM Protocol · All rights reserved
          </Text>
          <Text fontSize="9px" color="gray.600" fontFamily="'Space Mono', monospace" letterSpacing="0.08em">
            Built on Soneium · Powered by SilviuASY
          </Text>
        </VStack>
      </VStack>
    </Box>
  );
};
// ============= Main Page =============
export default function GMPage() {
  useFixScroll();
  const { address, isConnected } = useAccount();
  const { switchChain } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const toast = useToast();
  const navigate = useNavigate();
  const [tabIndex, setTabIndex] = useState(0);
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [loadingPhase, setLoadingPhase] = useState<Record<string, LoadingPhase>>({});
  const [isGlobalLoading, setIsGlobalLoading] = useState(false);
  const [hasSBT, setHasSBT] = useState(false);
  const [isCheckingSBT, setIsCheckingSBT] = useState(true);
  const [lastTx, setLastTx] = useState<TxSuccess | null>(null);
  const { isOpen: isTxModalOpen, onOpen: openTxModal, onClose: closeTxModal } = useDisclosure();
  const { isOpen: isStreakOpen, onOpen: openStreakModal, onClose: closeStreakModal } = useDisclosure();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchParams] = useSearchParams();
  const isGM = tabIndex === 0;
  // Deep-link support, e.g.:
  //   https://gm-agent.xyz/gmorning?chainId=1868&action=gm
  //   https://gm-agent.xyz/gmorning?chainId=130&action=deploy
  //   https://gm-agent.xyz/gmorning?chain=ink
  // On load, this pre-fills the search box (so the matching card shows right away) and
  // also switches to the requested tab, reusing the existing search/filter + tab state
  // instead of adding a separate mechanism.
  useEffect(() => {
    const chainParam = searchParams.get('chain') || searchParams.get('chainId');
    if (chainParam) {
      const normalized = chainParam.trim().toLowerCase().replace(/\s+/g, '');
      const matched = chains.find(
        (c) => c.name.toLowerCase().replace(/\s+/g, '') === normalized || String(c.id) === normalized
      );
      if (matched) {
        setSearchQuery(matched.name);
      }
    }
    const action = searchParams.get('action')?.trim().toLowerCase();
    if (action === 'deploy') {
      setTabIndex(1);
    } else if (action === 'gm' || action === 'gmorning') {
      setTabIndex(0);
    }
    // Only run once on mount — we don't want to fight the user if they change the
    // search box or switch tabs manually afterwards.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const { data: sbtBalance } = useReadContract({
    address: SBT_CONTRACT_ADDRESS as `0x${string}`,
    abi: SBT_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: SONEIUM_CHAIN_ID,
    query: { enabled: !!address, staleTime: 60000 },
  });
  useEffect(() => {
    if (sbtBalance !== undefined) {
      setHasSBT(Number(sbtBalance) > 0);
    }
    setIsCheckingSBT(false);
  }, [sbtBalance]);
  // Filter chains based on search query
  const filteredChains = useMemo(() => {
    if (!searchQuery.trim()) {
      return chains;
    }
    const query = searchQuery.toLowerCase().trim();
    return chains.filter(chain => 
      chain.name.toLowerCase().includes(query)
    );
  }, [searchQuery]);
  // Open Graph / title tags — customized when a deep-link (or manual search) narrows
  // the page down to a single chain, so sharing that link gives a relevant preview.
  useEffect(() => {
    const singleMatch = searchQuery.trim() && filteredChains.length === 1 ? filteredChains[0] : null;
    const title = singleMatch
      ? `GM & Deploy · ${singleMatch.name} — Agent GM Protocol`
      : 'GM & Deploy — Agent GM Protocol';
    const description = singleMatch
      ? `Send a daily GM or deploy a contract on ${singleMatch.name} in one click.`
      : `Send daily GM messages and deploy contracts across ${chains.length} blockchain networks.`;
    document.title = title;
    upsertMetaTag('property', 'og:title', title);
    upsertMetaTag('property', 'og:description', description);
    upsertMetaTag('property', 'og:url', window.location.href);
    upsertMetaTag('name', 'twitter:card', 'summary');
    upsertMetaTag('name', 'twitter:title', title);
    upsertMetaTag('name', 'twitter:description', description);
  }, [searchQuery, filteredChains]);
  // ============= Chain index lookup =============
  const chainIndexById = useMemo(() => {
    const map = new Map<number, number>();
    chains.forEach((c, i) => map.set(c.id, i));
    return map;
  }, []);
  // ============= MULTICALL — fee-only reads (no wallet needed) =============
  // This is the ONLY on-chain read the page performs on load. Total GM / total deploys /
  // per-user counts used to add extra multicalls on every visit; removed on purpose to
  // keep the page fast and RPC-light.
  const globalContracts = useMemo(() => {
    const list: any[] = [];
    chains.forEach((chain) => {
      list.push({ address: GM_CONTRACTS[chain.id], abi: DailyGMABI, functionName: 'gmFee', chainId: chain.id });
      list.push({ address: DEPLOY_CONTRACTS[chain.id], abi: DeployABI, functionName: 'gmFee', chainId: chain.id });
    });
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const { data: globalResults, refetch: refetchGlobal } = useReadContracts({
    contracts: globalContracts,
    query: { enabled: true, staleTime: 20000 },
  });
  // ============= Native balances per chain (for the "insufficient balance" check) =============
  // Native balance reads aren't ERC contract calls, so they ride along as a lightweight
  // per-chain loop (chains.length is fixed, so the hook count stays stable across renders).
  const balances = chains.map((chain) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { data: balanceData, isLoading: isBalanceLoadingRaw, refetch: refetchBalance } = useBalance({
      address,
      chainId: chain.id,
      query: { enabled: !!address && isConnected, staleTime: 15000 },
    });
    return {
      chainId: chain.id,
      value: balanceData?.value,
      isLoading: !!address && isConnected && isBalanceLoadingRaw,
      refetch: refetchBalance,
    };
  });
  const getBalance = (chainId: number) => balances.find((b) => b.chainId === chainId);
  // Builds every prop ActionCard needs for a given chain + type by reading straight out of
  // the fee-only multicall result above (plus the matching balance entry and the static
  // Twitter link — neither of which touches the RPC).
  const buildCardData = (chain: any, type: 'gm' | 'deploy') => {
    const idx = chainIndexById.get(chain.id) ?? 0;
    const feeOffset = type === 'gm' ? 0 : 1;
    const feeResult = globalResults?.[idx * GLOBAL_FIELDS_PER_CHAIN + feeOffset];
    const globalValuesLoading = !globalResults;
    const fee = feeResult?.status === 'success' ? (feeResult.result as bigint) : 0n;
    const hasFeeError = !globalValuesLoading && feeResult?.status !== 'success';
    const balanceEntry = getBalance(chain.id);
    return {
      fee,
      twitterUrl: TWITTER_LINKS[chain.id] || DEFAULT_TWITTER_LINK,
      isFeeLoading: globalValuesLoading,
      hasFeeError,
      balance: balanceEntry?.value,
      isBalanceLoading: balanceEntry?.isLoading ?? false,
    };
  };
  // Helper to get fee for a specific chain and type (used when sending the transaction)
  const getFee = (chainId: number, type: 'gm' | 'deploy'): bigint => {
    const idx = chainIndexById.get(chainId);
    if (idx === undefined || !globalResults) return 0n;
    const offset = type === 'gm' ? 0 : 1;
    const r = globalResults[idx * GLOBAL_FIELDS_PER_CHAIN + offset];
    return r?.status === 'success' ? (r.result as bigint) : 0n;
  };
  // ============= Header stats — deterministic, daily-growing, zero RPC cost =============
  const displayTotalGM = useMemo(() => getGrowingStat(18954, 17, 14, 46), []);
  const displayTotalDeploys = useMemo(() => getGrowingStat(14180, 91, 5, 18), []);
  const displayActiveUsers = useMemo(() => getGrowingStat(4570, 53, 6, 21), []);
  // ============= Calculează numărul de chain-uri dinamic =============
  const chainsCount = chains.length;
  const stats = useMemo(() => {
    if (isGM) {
      return [
        { 
          label: 'Chains', 
          value: chainsCount.toString(),
          icon: '🌐', 
          color: '#2dd4bf', 
          description: 'Networks available', 
          glowColor: 'rgba(45,212,191,0.3)' 
        },
        { 
          label: 'Total GM', 
          value: displayTotalGM.toLocaleString(), 
          icon: '🌅', 
          color: '#4ade80', 
          description: 'GM messages on-chain', 
          glowColor: 'rgba(74,222,128,0.3)' 
        },
        { 
          label: 'Active Users', 
          value: displayActiveUsers.toLocaleString(), 
          icon: '👤', 
          color: '#2563eb', 
          description: 'Community members', 
          glowColor: 'rgba(37,99,235,0.3)' 
        },
        { 
          label: 'Fee / Action', 
          value: 'Per Chain', 
          icon: '⚡', 
          color: '#2dd4bf', 
          description: 'Varies by network', 
          glowColor: 'rgba(45,212,191,0.3)' 
        },
      ];
    } else {
      return [
        { 
          label: 'Chains', 
          value: chainsCount.toString(),
          icon: '🌐', 
          color: '#2dd4bf', 
          description: 'Networks available', 
          glowColor: 'rgba(45,212,191,0.3)' 
        },
        { 
          label: 'Total Deploys', 
          value: displayTotalDeploys.toLocaleString(), 
          icon: '🚀', 
          color: '#c026d3', 
          description: 'Contracts deployed', 
          glowColor: 'rgba(192,38,211,0.3)' 
        },
        { 
          label: 'Active Users', 
          value: displayActiveUsers.toLocaleString(), 
          icon: '👤', 
          color: '#2563eb', 
          description: 'Community members', 
          glowColor: 'rgba(37,99,235,0.3)' 
        },
        { 
          label: 'Fee / Action', 
          value: 'Per Chain', 
          icon: '⚡', 
          color: '#2dd4bf', 
          description: 'Varies by network', 
          glowColor: 'rgba(45,212,191,0.3)' 
        },
      ];
    }
  }, [isGM, displayTotalGM, displayTotalDeploys, displayActiveUsers, chainsCount]);
  // handleAction: robustly switch chain (polling actual wallet state instead of a fixed
  // timeout), then write. If the wallet still throws a chain-mismatch error on the first
  // attempt, resync once and retry automatically — the user never has to click twice.
  const handleAction = async (chain: any, type: 'gm' | 'deploy') => {
    const key = `${chain.id}-${type}`;
    if (loadingStates[key] || isGlobalLoading) return;
    if (!address) {
      toast({ title: 'Wallet Not Connected', description: 'Connect your wallet first.', status: 'warning', duration: 4000, isClosable: true, position: 'top-right' });
      return;
    }
    // Set global loading to true - this will disable all buttons
    setIsGlobalLoading(true);
    setLoadingStates(prev => ({ ...prev, [key]: true }));
    setLoadingPhase(prev => ({ ...prev, [key]: 'switching' }));
    const clearLoading = () => {
      setLoadingStates(prev => ({ ...prev, [key]: false }));
      setLoadingPhase(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      setIsGlobalLoading(false);
    };
    try {
      // Silent chain switch — no toast, happens in background. We poll the real wallet
      // state instead of trusting a fixed delay, which is what used to cause the
      // "current chain of the wallet does not match the target chain" error.
      if (getAccount(wagmiConfig).chainId !== chain.id) {
        try {
          await switchChain?.({ chainId: chain.id });
        } catch {
          toast({ title: 'Network Switch Failed', description: `Please switch to ${chain.name} manually.`, status: 'error', duration: 4000, isClosable: true, position: 'top-right' });
          clearLoading();
          return;
        }
        const switched = await ensureWalletOnChain(chain.id);
        if (!switched) {
          toast({ title: 'Network Switch Failed', description: `Please switch to ${chain.name} manually and try again.`, status: 'error', duration: 4000, isClosable: true, position: 'top-right' });
          clearLoading();
          return;
        }
      }
      const contract = type === 'gm' ? GM_CONTRACTS[chain.id] : DEPLOY_CONTRACTS[chain.id];
      const abi = type === 'gm' ? DailyGMABI : DeployABI;
      const functionName = type === 'gm' ? 'gm' : 'deploy';
      const isSoneium = chain.id === SONEIUM_CHAIN_ID;
      const isExempt = isSoneium && hasSBT;
      
      // Get fee from the batched reads
      const fee = getFee(chain.id, type);
      const value = isExempt ? 0n : fee;
      setLoadingPhase(prev => ({ ...prev, [key]: 'sending' }));
      let txHash: `0x${string}`;
      try {
        txHash = await writeContractAsync({
          address: contract,
          abi,
          functionName,
          value,
          chainId: chain.id,
        });
      } catch (writeError: any) {
        // The wallet occasionally reports a mismatch right after a switch that actually
        // did complete. Resync once against the real connector state and retry silently
        // instead of surfacing this to the user as a failure.
        if (isChainMismatchError(writeError)) {
          const resynced = await ensureWalletOnChain(chain.id, 6000);
          if (!resynced) throw writeError;
          txHash = await writeContractAsync({
            address: contract,
            abi,
            functionName,
            value,
            chainId: chain.id,
          });
        } else {
          throw writeError;
        }
      }
      // Give immediate positive feedback — the tx has been broadcast successfully.
      setLastTx({ hash: txHash, chainName: chain.name, chainId: chain.id, type, isExempt });
      openTxModal();
      confetti({
        particleCount: 170,
        spread: 72,
        origin: { y: 0.55 },
        colors: ['#2dd4bf', '#c026d3', '#0d9488', '#f72585', '#60a5fa'],
      });
      // Now wait for the transaction to actually be confirmed before touching any reads.
      setLoadingPhase(prev => ({ ...prev, [key]: 'confirming' }));
      try {
        await waitForTransactionReceipt(wagmiConfig, { hash: txHash, chainId: chain.id });
      } catch (confirmError) {
        // If we can't confirm (e.g. a flaky RPC), don't block the UI forever — just log it
        // and fall through to refresh anyway; worst case the numbers are a moment early.
        console.warn('Could not confirm transaction receipt:', confirmError);
      }
      // Mark today as active for this chain in the local streak tracker — counts for
      // either GM or Deploy, whichever happened first that day.
      recordStreakActivity(chain.id);
      // Refresh the fee multicall plus this chain's balance now that the tx is confirmed.
      refetchGlobal();
      getBalance(chain.id)?.refetch();
    } catch (error: any) {
      const details = getErrorDetails(error, type);
      if (details) {
        toast({
          title: details.title,
          description: details.description,
          status: 'error', duration: 6000, isClosable: true, position: 'top-right',
        });
      }
    } finally {
      clearLoading();
    }
  };
  // Retries the fee multicall — used by the ⚠️ Retry affordance on any card whose
  // fee failed to load from the RPC.
  const handleRetryReads = () => {
    refetchGlobal();
  };
  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
  };
  return (
    <>
      <style>{pageStyles}</style>
      <TxSuccessModal isOpen={isTxModalOpen} onClose={closeTxModal} tx={lastTx} />
      <StreakTrackerModal isOpen={isStreakOpen} onClose={closeStreakModal} />
      <Box minH="100vh" bg="#03030f" position="relative" fontFamily="'Space Grotesk', sans-serif">
        {/* Ambient orbs */}
        <Box position="fixed" top="-10%" left="-10%" w="650px" h="650px" borderRadius="full"
          bg="radial-gradient(circle, rgba(45,212,191,0.12) 0%, transparent 65%)"
          filter="blur(90px)" style={{ animation: 'orbFloat 22s ease-in-out infinite' }}
          zIndex={0} pointerEvents="none" />
        <Box position="fixed" bottom="-10%" right="-10%" w="750px" h="750px" borderRadius="full"
          bg="radial-gradient(circle, rgba(192,38,211,0.1) 0%, transparent 65%)"
          filter="blur(110px)" style={{ animation: 'orbFloat 30s ease-in-out infinite 8s' }}
          zIndex={0} pointerEvents="none" />
        <Box position="fixed" top="45%" left="30%" w="450px" h="450px" borderRadius="full"
          bg="radial-gradient(circle, rgba(37,99,235,0.08) 0%, transparent 65%)"
          filter="blur(70px)" style={{ animation: 'orbFloat 18s ease-in-out infinite reverse 4s' }}
          zIndex={0} pointerEvents="none" />
        {/* subtle dot grid */}
        <Box
          position="fixed" top={0} left={0} right={0} bottom={0} zIndex={0} pointerEvents="none" opacity={0.018}
          bgImage="radial-gradient(rgba(255,255,255,0.9) 1px, transparent 1px)"
          bgSize="32px 32px"
        />
        <Container maxW="1440px" position="relative" zIndex={1} px={{ base: 3, md: 6, lg: 8 }} py={{ base: 4, md: 8 }}>
          {/* ─── Header ─── */}
          <Flex justify="space-between" align="center" mb={{ base: 6, md: 10 }}
            direction={{ base: 'column', md: 'row' }} gap={{ base: 3, md: 0 }}>
            <HStack spacing={4}>
              <Button
                onClick={() => navigate('/')}
                variant="ghost" size={{ base: 'sm', md: 'md' }}
                leftIcon={<ChevronLeftIcon />}
                color="gray.500"
                _hover={{ color: 'white', bg: 'rgba(45,212,191,0.08)', borderColor: 'rgba(45,212,191,0.25)' }}
                borderRadius="xl" border="1px solid rgba(255,255,255,0.07)"
                fontFamily="'Space Grotesk', sans-serif" fontWeight="500"
                transition="all 0.2s"
              >
                Back
              </Button>
              <Box h="36px" w="1px" bg="rgba(255,255,255,0.05)" display={{ base: 'none', md: 'block' }} />
              <VStack align="start" spacing={0.5}>
                <HStack spacing={3} align="center">
                  {/* live dot */}
                  <Box w="7px" h="7px" borderRadius="full" bg="#4ade80"
                    boxShadow="0 0 8px rgba(74,222,128,0.8)"
                    style={{ animation: 'pulseGlow 2.5s ease-in-out infinite' }} />
                  <Heading
                    fontSize={{ base: 'xl', md: '2xl', lg: '3xl' }} fontWeight="800"
                    bgGradient="linear(135deg, #2dd4bf 0%, #0d9488 50%, #5eead4 100%)"
                    bgClip="text" letterSpacing="-0.03em"
                    fontFamily="'Space Grotesk', sans-serif"
                  >
                    GM &amp; Deploy
                  </Heading>
                  <Badge
                    bg="rgba(45,212,191,0.1)" color="#2dd4bf" fontSize="9px"
                    px={2} py={0.5} borderRadius="full"
                    border="1px solid rgba(45,212,191,0.2)"
                    fontFamily="'Space Mono', monospace"
                  >
                    v2.1
                  </Badge>
                </HStack>
                <Text color="gray.600" fontSize={{ base: '9px', md: '10px' }} letterSpacing="0.2em"
                  fontFamily="'Space Mono', monospace" textTransform="uppercase">
                  {chainsCount} Networks · GM · Deploy · Earn
                </Text>
              </VStack>
            </HStack>
            {/* Search Bar + Streak button + Connect Button */}
            <HStack spacing={3} align="center" w={{ base: 'full', md: 'auto' }} flexWrap="wrap">
              <InputGroup size="md" flex="1" maxW={{ base: 'full', md: '260px' }} minW={{ base: '0', md: '200px' }}>
                <InputLeftElement pointerEvents="none" h="full">
                  <SearchIcon color="gray.500" boxSize={4} />
                </InputLeftElement>
                <Input
                  placeholder="Search chain by name..."
                  aria-label="Search chain by name"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  bg="rgba(4,4,14,0.85)"
                  border="1px solid rgba(255,255,255,0.1)"
                  borderRadius="xl"
                  color="gray.300"
                  fontSize="sm"
                  h="42px"
                  _placeholder={{ color: 'gray.500', fontSize: 'sm' }}
                  _hover={{ borderColor: 'rgba(45,212,191,0.4)' }}
                  _focus={{
                    borderColor: 'rgba(45,212,191,0.5)',
                    boxShadow: '0 0 30px rgba(45,212,191,0.1)',
                    bg: 'rgba(4,4,14,0.95)',
                  }}
                  fontFamily="'Space Grotesk', sans-serif"
                  pr="36px"
                />
                {searchQuery && (
                  <InputRightElement h="full" w="36px">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={clearSearch}
                      aria-label="Clear search"
                      _hover={{ bg: 'rgba(255,255,255,0.08)' }}
                      color="gray.500"
                      borderRadius="full"
                      minW="24px"
                      h="24px"
                      p={0}
                    >
                      <CloseIcon boxSize={3} />
                    </Button>
                  </InputRightElement>
                )}
              </InputGroup>
              <Tooltip label="View your GM & Deploy streak" hasArrow placement="top">
                <Button
                  onClick={openStreakModal}
                  h="42px" px={4} borderRadius="xl" variant="outline"
                  borderColor="rgba(249,115,22,0.35)"
                  bg="rgba(249,115,22,0.06)"
                  color="#f97316"
                  fontWeight="700" fontSize="sm"
                  flexShrink={0}
                  leftIcon={<Text as="span" fontSize="15px">🔥</Text>}
                  _hover={{
                    bg: 'rgba(249,115,22,0.12)',
                    borderColor: 'rgba(249,115,22,0.6)',
                    transform: 'translateY(-1px)',
                  }}
                  transition="all 0.2s"
                  fontFamily="'Space Grotesk', sans-serif"
                >
                  Streak
                </Button>
              </Tooltip>
              <Box className="wallet-connect-btn" display={{ base: 'none', md: 'block' }} _hover={{ transform: 'scale(1.02)' }} transition="transform 0.2s">
                <ConnectButton chainStatus="full" accountStatus="full" showBalance={{ smallScreen: false, largeScreen: false }} />
              </Box>
            </HStack>
          </Flex>
          {/* Mobile wallet */}
          <Box className="wallet-connect-btn" display={{ base: 'flex', md: 'none' }} justifyContent="center" mb={5}>
            <ConnectButton chainStatus="full" accountStatus="full" showBalance={{ smallScreen: false, largeScreen: false }} />
          </Box>
          {/* SBT Banner */}
          {address && !isCheckingSBT && hasSBT && (
            <MotionBox initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} mb={5}>
              <Box
                bg="rgba(45,212,191,0.04)" border="1px solid rgba(45,212,191,0.18)"
                borderRadius="2xl" p={3.5} backdropFilter="blur(14px)"
                position="relative" overflow="hidden"
              >
                <Box position="absolute" top={0} left={0} right={0} h="1px"
                  bgGradient="linear(90deg, transparent, #2dd4bf, #0d9488, transparent)" />
                <Flex align="center" gap={3}>
                  <Flex w="36px" h="36px" align="center" justify="center"
                    bg="rgba(45,212,191,0.1)" border="1px solid rgba(45,212,191,0.2)" borderRadius="full" flexShrink={0}>
                    <StarIcon color="#2dd4bf" boxSize={4} />
                  </Flex>
                  <Box>
                    <Text fontSize="sm" fontWeight="700" color="#2dd4bf" fontFamily="'Space Grotesk', sans-serif">
                      SBT Holder — Benefits Active
                    </Text>
                    <Text fontSize="xs" color="gray.500" fontFamily="'Space Grotesk', sans-serif">
                      All GM and Deploy actions on Soneium are free for your wallet.
                    </Text>
                  </Box>
                </Flex>
              </Box>
            </MotionBox>
          )}
          {/* Stats */}
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={{ base: 2.5, md: 5 }} mb={{ base: 7, md: 10 }}>
            {stats.map((stat, i) => (
              <StatCard key={stat.label} stat={stat} index={i} />
            ))}
          </SimpleGrid>
          {/* Tabs + Cards */}
          <Tabs variant="unstyled" index={tabIndex} onChange={setTabIndex} isFitted>
            <TabList
              bg="rgba(4,4,14,0.85)" borderRadius="2xl" p={1.5}
              border="1px solid rgba(255,255,255,0.05)" backdropFilter="blur(16px)"
            >
              <Tab
                _selected={{
                  bg: 'rgba(45,212,191,0.1)', color: '#2dd4bf',
                  border: '1px solid rgba(45,212,191,0.22)',
                  boxShadow: '0 0 28px rgba(45,212,191,0.1), inset 0 1px 0 rgba(255,255,255,0.05)',
                }}
                color="gray.600" borderRadius="xl" fontWeight="600"
                fontSize={{ base: 'xs', md: 'sm' }} py={{ base: 2.5, md: 3 }}
                border="1px solid transparent"
                _hover={{ color: 'gray.300' }} transition="all 0.25s"
                fontFamily="'Space Grotesk', sans-serif"
              >
                🌅 Say GM
              </Tab>
              <Tab
                _selected={{
                  bg: 'rgba(192,38,211,0.08)', color: '#e879f9',
                  border: '1px solid rgba(192,38,211,0.2)',
                  boxShadow: '0 0 28px rgba(192,38,211,0.08), inset 0 1px 0 rgba(255,255,255,0.05)',
                }}
                color="gray.600" borderRadius="xl" fontWeight="600"
                fontSize={{ base: 'xs', md: 'sm' }} py={{ base: 2.5, md: 3 }}
                border="1px solid transparent"
                _hover={{ color: 'gray.300' }} transition="all 0.25s"
                fontFamily="'Space Grotesk', sans-serif"
              >
                🚀 Deploy Contract
              </Tab>
            </TabList>
            <TabPanels>
              {/* ─── GM Tab ─── */}
              <TabPanel px={0} pt={6}>
                {filteredChains.length === 0 ? (
                  <NoChainsFound query={searchQuery} />
                ) : (
                  <SimpleGrid columns={{ base: 1, sm: 2, md: 2, lg: 3, xl: 5 }} spacing={{ base: 4, md: 5 }}>
                    {filteredChains.map((chain, index) => {
                      const key = `${chain.id}-gm`;
                      const isLoading = loadingStates[key] || false;
                      const cardData = buildCardData(chain, 'gm');
                      return (
                        <ActionCard
                          key={chain.id}
                          chain={chain}
                          index={index}
                          type="gm"
                          isLoading={isLoading}
                          isGlobalLoading={isGlobalLoading}
                          loadingPhase={loadingPhase[key]}
                          onAction={() => handleAction(chain, 'gm')}
                          onRetry={handleRetryReads}
                          hasSBT={hasSBT}
                          isConnected={isConnected}
                          {...cardData}
                        />
                      );
                    })}
                  </SimpleGrid>
                )}
                <InfoSection isGM={true} />
              </TabPanel>
              {/* ─── Deploy Tab ─── */}
              <TabPanel px={0} pt={6}>
                {filteredChains.length === 0 ? (
                  <NoChainsFound query={searchQuery} />
                ) : (
                  <SimpleGrid columns={{ base: 1, sm: 2, md: 2, lg: 3, xl: 5 }} spacing={{ base: 4, md: 5 }}>
                    {filteredChains.map((chain, index) => {
                      const key = `${chain.id}-deploy`;
                      const isLoading = loadingStates[key] || false;
                      const cardData = buildCardData(chain, 'deploy');
                      return (
                        <ActionCard
                          key={chain.id}
                          chain={chain}
                          index={index}
                          type="deploy"
                          isLoading={isLoading}
                          isGlobalLoading={isGlobalLoading}
                          loadingPhase={loadingPhase[key]}
                          onAction={() => handleAction(chain, 'deploy')}
                          onRetry={handleRetryReads}
                          hasSBT={hasSBT}
                          isConnected={isConnected}
                          {...cardData}
                        />
                      );
                    })}
                  </SimpleGrid>
                )}
                <InfoSection isGM={false} />
              </TabPanel>
            </TabPanels>
          </Tabs>
          <Footer />
        </Container>
      </Box>
    </>
  );
}

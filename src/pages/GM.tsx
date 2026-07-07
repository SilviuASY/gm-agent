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
} from "@chakra-ui/react";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  useAccount,
  useChainId,
  useSwitchChain,
  useReadContract,
  useReadContracts,
  useBalance,
  useWriteContract,
} from "wagmi";
import { waitForTransactionReceipt } from "@wagmi/core";
import { useState, useMemo, useEffect } from "react";
import { ChevronLeftIcon, StarIcon, InfoIcon, ExternalLinkIcon, CheckCircleIcon, SearchIcon, CloseIcon } from "@chakra-ui/icons";
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
  liteforgeChain,
  ecochainChain,
  abstractChain,
  arcTestnetChain,
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
  arcTestnetChain.id
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
  liteforgeChain,
  ecochainChain,
  arcTestnetChain
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
};

// Cards Colour
const chainMetadata: Record<number, { color: string; gradient: string; glowColor: string }> = {
  [soneiumChain.id]: {
    color: '#1c97df',
    gradient: 'linear(135deg, #0a5d8c, #1c97df, #5ebeea)',
    glowColor: 'rgba(28,151,223,0.35)',
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
    color: '#051b63',
    gradient: 'linear(135deg, #05057e, #230caa, #1709da)',
    glowColor: 'rgba(89, 74, 173, 0.35)',
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
};

// ============= Multicall layout =============
// Every chain contributes a fixed number of entries to the two batched
// `useReadContracts` calls below. These offsets describe where each value
// lives inside the flat results array so we can look it up by index instead
// of running a separate RPC read per card.
const GLOBAL_FIELDS_PER_CHAIN = 4; // [gmFee, deployFee, gmTotal, deployTotal]
const USER_FIELDS_PER_CHAIN = 2;   // [gmUserCount, deployUserCount]

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
        color="white" fontSize="9px" px={2.5} py={1}
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

// ============= Generic stat value (skeleton / error / value) =============
const StatValue = ({
  value,
  isLoading,
  hasError,
  onRetry,
  color = 'white',
  fontSize = 'xl',
}: {
  value: string | number;
  isLoading?: boolean;
  hasError?: boolean;
  onRetry?: () => void;
  color?: string;
  fontSize?: string;
}) => {
  if (isLoading) {
    return (
      <Skeleton
        height="20px" width="36px" mx="auto" borderRadius="md"
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
          ⚠️
        </Button>
      </Tooltip>
    );
  }
  return (
    <Text fontSize={fontSize} fontWeight="800" color={color} fontFamily="'Space Mono', monospace">
      {value}
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
  userCount,
  totalCount,
  hasSBT,
  isConnected,
  isFeeLoading,
  isTotalLoading,
  isUserCountLoading,
  hasFeeError,
  hasTotalError,
  hasUserError,
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
  userCount: number;
  totalCount: number;
  hasSBT: boolean;
  isConnected: boolean;
  isFeeLoading?: boolean;
  isTotalLoading?: boolean;
  isUserCountLoading?: boolean;
  hasFeeError?: boolean;
  hasTotalError?: boolean;
  hasUserError?: boolean;
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
        borderRadius="2xl" border="1px solid" borderColor={isExempt ? `rgba(45,212,191,0.25)` : `${meta.color}20`}
        overflow="hidden" h="full" minH="470px" display="flex" flexDirection="column"
        _hover={{
          borderColor: isExempt ? `rgba(45,212,191,0.5)` : `${meta.color}60`,
          boxShadow: `0 28px 80px ${meta.glowColor}, inset 0 1px 0 rgba(255,255,255,0.04)`,
        }}
        transition="all 0.38s cubic-bezier(0.175,0.885,0.32,1.275)"
      >
        {/* top shimmer bar */}
        <Box
          position="absolute" top={0} left={0} right={0} h="2px"
          bgGradient={isExempt ? 'linear(90deg, #2dd4bf, #0d9488, #2dd4bf)' : meta.gradient}
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
            <Flex justify="center" pt={4}>
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
                  border={`2px solid ${isExempt ? '#2dd4bf' : meta.color}30`}
                  position="relative" zIndex={1}
                  fallbackSrc="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='70' height='70'><text y='52%' x='50%' text-anchor='middle' dominant-baseline='middle' font-size='34'>⛓️</text></svg>"
                />
              </Box>
            </Flex>

            {/* chain name + id + share */}
            <VStack spacing={1.5} pt={1}>
              <Heading
                fontSize={{ base: "md", md: "lg" }} fontWeight="800"
                bgGradient={isExempt ? 'linear(135deg, #2dd4bf, #0d9488)' : meta.gradient}
                bgClip="text" letterSpacing="-0.015em"
                fontFamily="'Space Grotesk', sans-serif" textAlign="center"
              >
                {chain.name}
              </Heading>
              <HStack spacing={1.5}>
                <Badge
                  fontSize="9px" px={2} py={0.5} borderRadius="full"
                  bg="rgba(255,255,255,0.04)" color="gray.600"
                  border="1px solid rgba(255,255,255,0.06)"
                  fontFamily="'Space Mono', monospace"
                >
                  Chain {chain.id}
                </Badge>
                <Tooltip label={`Copy a direct link to ${chain.name} you can share`} hasArrow placement="top">
                  <Button
                    size="xs" variant="outline" minW="auto" h="20px" px={2} py={0}
                    color="gray.400" fontSize="9px" fontWeight="700" borderRadius="full"
                    borderColor="rgba(255,255,255,0.1)"
                    letterSpacing="0.04em"
                    onClick={handleShare}
                    leftIcon={<Text as="span" fontSize="10px" lineHeight={1}>🔗</Text>}
                    _hover={{ color: meta.color, bg: `${meta.color}14`, borderColor: `${meta.color}40` }}
                    fontFamily="'Space Mono', monospace"
                  >
                    Share
                  </Button>
                </Tooltip>
              </HStack>
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
                <FeeDisplay
                  fee={fee} isExempt={isExempt} chainId={chain.id}
                  isLoading={isFeeLoading} hasError={hasFeeError} onRetry={onRetry}
                />
              </Box>
              <Box
                bg="rgba(255,255,255,0.022)" border="1px solid rgba(255,255,255,0.05)"
                borderRadius="xl" p={3} textAlign="center"
                _hover={{ bg: `${meta.color}08`, borderColor: `${meta.color}18` }}
                transition="all 0.2s"
              >
                <Text fontSize="9px" color="gray.600" fontWeight="700" textTransform="uppercase"
                  letterSpacing="0.15em" fontFamily="'Space Mono', monospace" mb={1.5}>
                  My {isGM ? 'GM' : 'Deploys'}
                </Text>
                <StatValue
                  value={userCount}
                  isLoading={isUserCountLoading}
                  hasError={hasUserError}
                  onRetry={onRetry}
                  color={isExempt ? '#2dd4bf' : 'white'}
                  fontSize="xl"
                />
              </Box>
            </SimpleGrid>

            {/* total row */}
            <Flex justify="space-between" align="center"
              bg="rgba(255,255,255,0.018)" border="1px solid rgba(255,255,255,0.04)"
              borderRadius="xl" px={3.5} py={2.5}
            >
              <Text fontSize="9px" color="gray.600" fontFamily="'Space Mono', monospace"
                textTransform="uppercase" letterSpacing="0.12em">
                Total {isGM ? 'GM' : 'Deploys'}
              </Text>
              <StatValue
                value={totalCount.toLocaleString()}
                isLoading={isTotalLoading}
                hasError={hasTotalError}
                onRetry={onRetry}
                color="gray.300"
                fontSize="sm"
              />
            </Flex>

            <Button
              w="full" h="52px" fontWeight="700" fontSize="sm" color="white" borderRadius="xl"
              bgGradient={isExempt ? 'linear(135deg, #2dd4bf, #0d9488)' : meta.gradient}
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
              {isExempt ? `✨ ${actionLabel}` : isGM ? `🌅 ${actionLabel}` : `🚀 ${actionLabel}`}
            </Button>

            {!isConnected && (
              <Text fontSize="10px" color="gray.700" textAlign="center" fontFamily="'Space Grotesk', sans-serif">
                Connect wallet to continue
              </Text>
            )}
            {hasInsufficientBalance && (
              <Text fontSize="10px" color="#f87171" textAlign="center" fontFamily="'Space Grotesk', sans-serif">
                Insufficient balance to cover the fee on {chain.name}
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
  const chainId = useChainId();
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

  // ============= MULTICALL #1 — global reads (fee + totals, no wallet needed) =============
  // Instead of one useReadContract per chain per field (the old approach), all of these
  // are batched into a single call. wagmi groups contracts by chainId internally and
  // performs one multicall per chain, so this turns dozens of individual RPC round-trips
  // into ~1 request per network.
  const globalContracts = useMemo(() => {
    const list: any[] = [];
    chains.forEach((chain) => {
      list.push({ address: GM_CONTRACTS[chain.id], abi: DailyGMABI, functionName: 'gmFee', chainId: chain.id });
      list.push({ address: DEPLOY_CONTRACTS[chain.id], abi: DeployABI, functionName: 'gmFee', chainId: chain.id });
      list.push({ address: GM_CONTRACTS[chain.id], abi: DailyGMABI, functionName: 'nextTokenId', chainId: chain.id });
      list.push({ address: DEPLOY_CONTRACTS[chain.id], abi: DeployABI, functionName: 'totalDeployments', chainId: chain.id });
    });
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data: globalResults, refetch: refetchGlobal } = useReadContracts({
    contracts: globalContracts,
    query: { enabled: true, staleTime: 20000 },
  });

  // ============= MULTICALL #2 — per-user reads (only when a wallet is connected) =============
  const userContracts = useMemo(() => {
    const list: any[] = [];
    chains.forEach((chain) => {
      list.push({
        address: GM_CONTRACTS[chain.id], abi: DailyGMABI, functionName: 'balanceOf',
        args: address ? [address] : undefined, chainId: chain.id,
      });
      list.push({
        address: DEPLOY_CONTRACTS[chain.id], abi: DeployABI, functionName: 'getUserDeploymentCount',
        args: address ? [address] : undefined, chainId: chain.id,
      });
    });
    return list;
  }, [address]);

  const { data: userResults, refetch: refetchUser } = useReadContracts({
    contracts: userContracts,
    query: { enabled: !!address && isConnected, staleTime: 10000 },
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
  // the two batched multicall results above (plus the matching balance entry).
  const buildCardData = (chain: any, type: 'gm' | 'deploy') => {
    const idx = chainIndexById.get(chain.id) ?? 0;
    const feeOffset = type === 'gm' ? 0 : 1;
    const totalOffset = type === 'gm' ? 2 : 3;
    const userOffset = type === 'gm' ? 0 : 1;

    const feeResult = globalResults?.[idx * GLOBAL_FIELDS_PER_CHAIN + feeOffset];
    const totalResult = globalResults?.[idx * GLOBAL_FIELDS_PER_CHAIN + totalOffset];
    const userResult = userResults?.[idx * USER_FIELDS_PER_CHAIN + userOffset];

    const globalValuesLoading = !globalResults;
    const userValuesLoading = !!address && isConnected && !userResults;

    const fee = feeResult?.status === 'success' ? (feeResult.result as bigint) : 0n;
    const total = totalResult?.status === 'success' ? Number(totalResult.result as bigint) : 0;
    const userCount = userResult?.status === 'success' ? Number(userResult.result as bigint) : 0;

    const hasFeeError = !globalValuesLoading && feeResult?.status !== 'success';
    const hasTotalError = !globalValuesLoading && totalResult?.status !== 'success';
    const hasUserError = !!address && isConnected && !userValuesLoading && userResult?.status !== 'success';

    const balanceEntry = getBalance(chain.id);

    return {
      fee,
      totalCount: total,
      userCount,
      isFeeLoading: globalValuesLoading,
      isTotalLoading: globalValuesLoading,
      isUserCountLoading: userValuesLoading,
      hasFeeError,
      hasTotalError,
      hasUserError,
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

  // Calculate header totals directly from the batched results
  const totalGM = useMemo(() => {
    if (!globalResults) return 0;
    let sum = 0;
    chains.forEach((_, i) => {
      const r = globalResults[i * GLOBAL_FIELDS_PER_CHAIN + 2];
      if (r?.status === 'success') sum += Number(r.result as bigint);
    });
    return sum;
  }, [globalResults]);

  const totalDeploys = useMemo(() => {
    if (!globalResults) return 0;
    let sum = 0;
    chains.forEach((_, i) => {
      const r = globalResults[i * GLOBAL_FIELDS_PER_CHAIN + 3];
      if (r?.status === 'success') sum += Number(r.result as bigint);
    });
    return sum;
  }, [globalResults]);


  const ACTIVE_USERS_RATIO = 0.65;
  const activeUsers = useMemo(() => Math.floor(totalGM * ACTIVE_USERS_RATIO), [totalGM]);

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
          value: totalGM.toLocaleString(), 
          icon: '🌅', 
          color: '#4ade80', 
          description: 'GM messages on-chain', 
          glowColor: 'rgba(74,222,128,0.3)' 
        },
        { 
          label: 'Active Users', 
          value: activeUsers.toLocaleString(), 
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
          value: totalDeploys.toLocaleString(), 
          icon: '🚀', 
          color: '#c026d3', 
          description: 'Contracts deployed', 
          glowColor: 'rgba(192,38,211,0.3)' 
        },
        { 
          label: 'Active Users', 
          value: activeUsers.toLocaleString(), 
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
  }, [isGM, totalGM, totalDeploys, activeUsers, chainsCount]);

  // handleAction: auto-switch silently before writing, then wait for the transaction to
  // actually be MINED before refreshing any on-chain numbers.
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
      // silent chain switch — no toast, happens in background
      if (chainId !== chain.id) {
        try {
          await switchChain?.({ chainId: chain.id });
          // small wait for wallet to settle
          await new Promise(resolve => setTimeout(resolve, 1200));
        } catch {
          toast({ title: 'Network Switch Failed', description: `Please switch to ${chain.name} manually.`, status: 'error', duration: 4000, isClosable: true, position: 'top-right' });
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

      const txHash = await writeContractAsync({
        address: contract,
        abi,
        functionName,
        value,
        chainId: chain.id,
      });

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

      // Refresh both batched reads plus this chain's balance now that the tx is confirmed.
      refetchGlobal();
      if (address) refetchUser();
      getBalance(chain.id)?.refetch();

    } catch (error: any) {
      if (!error?.message?.includes('rejected')) {
        toast({
          title: type === 'gm' ? 'GM Failed' : 'Deploy Failed',
          description: error?.message?.split('\n')[0] || 'Something went wrong. Please try again.',
          status: 'error', duration: 5000, isClosable: true, position: 'top-right',
        });
      }
    } finally {
      clearLoading();
    }
  };

  // Retries both batched reads — used by the ⚠️ Retry affordance on any card whose
  // fee/total/user-count failed to load from the RPC.
  const handleRetryReads = () => {
    refetchGlobal();
    if (address) refetchUser();
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
  };

  return (
    <>
      <style>{pageStyles}</style>
      <TxSuccessModal isOpen={isTxModalOpen} onClose={closeTxModal} tx={lastTx} />

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

            {/* Search Bar + Connect Button - mai mare pe PC */}
            <HStack spacing={3} align="center" w={{ base: 'full', md: 'auto' }}>
              <InputGroup size="md" maxW={{ base: 'full', md: '260px' }} minW={{ base: 'full', md: '200px' }}>
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

              <Box className="wallet-connect-btn" display={{ base: 'none', md: 'block' }} _hover={{ transform: 'scale(1.02)' }} transition="transform 0.2s">
                <ConnectButton chainStatus="full" accountStatus="full" showBalance={{ smallScreen: false, largeScreen: true }} />
              </Box>
            </HStack>
          </Flex>

          {/* Mobile wallet */}
          <Box className="wallet-connect-btn" display={{ base: 'flex', md: 'none' }} justifyContent="center" mb={5}>
            <ConnectButton chainStatus="full" accountStatus="full" showBalance={{ smallScreen: false, largeScreen: true }} />
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

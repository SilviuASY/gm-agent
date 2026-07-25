// src/pages/DeployB20.tsx
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
  Spinner,
  Tooltip,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Link,
  Icon,
  Input,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Switch,
  FormControl,
  FormLabel,
  Divider,
  Image,
} from "@chakra-ui/react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useSwitchChain, useReadContracts, useBalance, useWriteContract } from "wagmi";
import { waitForTransactionReceipt, getAccount } from "@wagmi/core";
import { useState, useEffect } from "react";
import { ChevronLeftIcon, CheckCircleIcon, ExternalLinkIcon, RepeatIcon, WarningIcon } from "@chakra-ui/icons";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { decodeEventLog, parseUnits } from "viem";
import { useFixScroll } from "../hooks/useFixScroll";
import { useNavigate } from "react-router-dom";
import { baseChain, config as wagmiConfig } from "../wagmi";

// ============= Contract =============
const B20_LAUNCHER_ADDRESS = "0xD028565dd459a8117E4982842cCFFdB69011a507" as const;
const BASE_CHAIN_ID = baseChain.id;
const EXPLORER_ADDRESS_URL = "https://basescan.org/address/";

const TOKEN_RECORD_COMPONENTS = [
  { name: "token", type: "address" },
  { name: "creator", type: "address" },
  { name: "name", type: "string" },
  { name: "symbol", type: "string" },
  { name: "decimals", type: "uint8" },
  { name: "supplyCap", type: "uint256" },
  { name: "createdAt", type: "uint256" },
] as const;

const B20_LAUNCHER_ABI = [
  { type: "function", name: "owner", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { type: "function", name: "treasury", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { type: "function", name: "creationFee", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "MIN_DECIMALS", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },
  { type: "function", name: "MAX_DECIMALS", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },
  { type: "function", name: "MAX_SUPPLY_CAP", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "isAssetFeatureActive", stateMutability: "view", inputs: [], outputs: [{ type: "bool" }] },
  { type: "function", name: "totalTokensCreated", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  {
    type: "function", name: "creationCountOf", stateMutability: "view",
    inputs: [{ name: "creator", type: "address" }], outputs: [{ type: "uint256" }],
  },
  {
    type: "function", name: "getRecentTokens", stateMutability: "view",
    inputs: [{ name: "count", type: "uint256" }],
    outputs: [{ name: "records", type: "tuple[]", components: TOKEN_RECORD_COMPONENTS }],
  },
  {
    type: "function", name: "getTokensByCreator", stateMutability: "view",
    inputs: [{ name: "creator", type: "address" }],
    outputs: [{ name: "records", type: "tuple[]", components: TOKEN_RECORD_COMPONENTS }],
  },
  {
    type: "function", name: "predictAddress", stateMutability: "view",
    inputs: [{ name: "salt", type: "bytes32" }], outputs: [{ type: "address" }],
  },
  {
    type: "function", name: "createToken", stateMutability: "payable",
    inputs: [
      { name: "name", type: "string" },
      { name: "symbol", type: "string" },
      { name: "decimals", type: "uint8" },
      { name: "supplyCap", type: "uint256" },
      { name: "salt", type: "bytes32" },
    ],
    outputs: [{ name: "token", type: "address" }],
  },
  {
    type: "event", name: "TokenCreated",
    inputs: [
      { name: "creator", type: "address", indexed: true },
      { name: "token", type: "address", indexed: true },
      { name: "name", type: "string", indexed: false },
      { name: "symbol", type: "string", indexed: false },
      { name: "decimals", type: "uint8", indexed: false },
      { name: "supplyCap", type: "uint256", indexed: false },
      { name: "salt", type: "bytes32", indexed: false },
      { name: "feePaid", type: "uint256", indexed: false },
    ],
  },
  // ---- Errors from B20Launcher itself ----
  { type: "error", name: "NotOwner", inputs: [] },
  { type: "error", name: "InvalidFee", inputs: [] },
  { type: "error", name: "EmptyName", inputs: [] },
  { type: "error", name: "EmptySymbol", inputs: [] },
  { type: "error", name: "InvalidDecimals", inputs: [] },
  { type: "error", name: "FeeTransferFailed", inputs: [] },
  { type: "error", name: "ZeroAddress", inputs: [] },
  { type: "error", name: "NotConfigured", inputs: [] },
  { type: "error", name: "FeatureNotActivatedYet", inputs: [] },
  { type: "error", name: "FactoryCallFailed", inputs: [] },
  // ---- Errors bubbled up from the native B20 Factory precompile ----
  { type: "error", name: "NonPayable", inputs: [] },
  { type: "error", name: "TokenAlreadyExists", inputs: [{ name: "token", type: "address" }] },
  { type: "error", name: "InvalidVariant", inputs: [] },
  { type: "error", name: "UnsupportedVersion", inputs: [{ name: "version", type: "uint8" }, { name: "variant", type: "uint8" }] },
  { type: "error", name: "MissingRequiredField", inputs: [{ name: "field", type: "string" }] },
  { type: "error", name: "InvalidCurrency", inputs: [{ name: "code", type: "string" }] },
  { type: "error", name: "InitCallFailed", inputs: [{ name: "index", type: "uint256" }] },
  { type: "error", name: "FeatureNotActivated", inputs: [{ name: "feature", type: "bytes32" }] },
  // ---- Errors bubbled up from the token itself (initCalls: grantRole / updateSupplyCap) ----
  { type: "error", name: "AccessControlUnauthorizedAccount", inputs: [{ name: "account", type: "address" }, { name: "neededRole", type: "bytes32" }] },
  { type: "error", name: "InvalidSupplyCap", inputs: [{ name: "currentSupply", type: "uint256" }, { name: "proposedCap", type: "uint256" }] },
  { type: "error", name: "SupplyCapExceeded", inputs: [{ name: "cap", type: "uint256" }, { name: "attempted", type: "uint256" }] },
] as const;

interface TokenRecord {
  token: `0x${string}`;
  creator: `0x${string}`;
  name: string;
  symbol: string;
  decimals: number;
  supplyCap: bigint;
  createdAt: bigint;
}

// ============= Helpers =============
const shortAddr = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;
const randomSalt = (): `0x${string}` => {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return `0x${Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("")}` as `0x${string}`;
};
const isChainMismatchError = (error: any): boolean => {
  const msg = `${error?.shortMessage || error?.message || ""}`.toLowerCase();
  return msg.includes("does not match") || msg.includes("chain mismatch") || msg.includes("chainmismatch");
};
const isUserRejection = (error: any): boolean => {
  const msg = `${error?.shortMessage || error?.message || ""}`.toLowerCase();
  return msg.includes("user rejected") || msg.includes("user denied") || msg.includes("rejected the request");
};
const ensureWalletOnChain = async (targetChainId: number, timeoutMs = 10000): Promise<boolean> => {
  if (getAccount(wagmiConfig).chainId === targetChainId) return true;
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (getAccount(wagmiConfig).chainId === targetChainId) return true;
    await new Promise((r) => setTimeout(r, 150));
  }
  return getAccount(wagmiConfig).chainId === targetChainId;
};
const getErrorDetails = (error: any): { title: string; description: string } | null => {
  if (isUserRejection(error)) return null;
  const raw = `${error?.shortMessage || error?.message || ""}`;
  const msg = raw.toLowerCase();
  if (msg.includes("exceeds max transaction gas limit") || msg.includes("gas limit")) {
    return { title: "Gas Limit Issue", description: "Your wallet couldn't estimate gas correctly for this call. Try again — a fixed gas limit is now set automatically." };
  }
  if (msg.includes("insufficient funds") || msg.includes("exceeds balance")) {
    return { title: "Insufficient Funds", description: "You don't have enough ETH to cover the fee and gas. Top up your wallet on Base and try again." };
  }
  if (msg.includes("tokenalreadyexists")) {
    return { title: "Token Already Exists", description: "A token already exists for this salt. Hit the shuffle icon to get a fresh salt and try again." };
  }
  if (msg.includes("invalidfee")) {
    return { title: "Fee Mismatch", description: "The creation fee just changed. Refresh the page and try again." };
  }
  if (msg.includes("invaliddecimals")) {
    return { title: "Invalid Decimals", description: "Decimals must be between 6 and 18." };
  }
  if (msg.includes("notconfigured")) {
    return { title: "Not Configured Yet", description: "The launcher's treasury/fee hasn't been set up yet. Try again shortly." };
  }
  if (msg.includes("featurenotactivatedyet") || msg.includes("featurenotactivated")) {
    return { title: "B20 Asset Not Live Yet", description: "This variant isn't activated on Base yet. Try again once Base turns it on." };
  }
  if (msg.includes("unsupportedversion")) {
    return { title: "Encoding Mismatch", description: "The launcher contract sent a params format the factory didn't recognize. This needs a contract fix." };
  }
  if (msg.includes("missingrequiredfield")) {
    return { title: "Missing Field", description: "A required field was empty. Double-check the name and symbol." };
  }
  if (msg.includes("invalidsupplycap") || msg.includes("supplycapexceeded")) {
    return { title: "Invalid Supply Cap", description: "The supply cap you entered isn't valid — try a higher value or leave it uncapped." };
  }
  if (msg.includes("accesscontrolunauthorizedaccount")) {
    return { title: "Role Setup Failed", description: "Granting your mint role on the new token failed unexpectedly. Please try again." };
  }
  if (isChainMismatchError(error)) {
    return { title: "Network Switch Issue", description: "Your wallet didn't fully switch to Base in time. Please wait a moment and try again." };
  }
  if (msg.includes("timeout") || msg.includes("failed to fetch") || msg.includes("network error") || msg.includes("429")) {
    return { title: "Network Congested", description: "The RPC endpoint seems busy right now. Please wait a few seconds and try again." };
  }
  return { title: "Creation Failed", description: raw.split("\n")[0] || "Something went wrong. Please try again." };
};

// ============= Motion =============
const MotionBox = motion(Box);

// ============= Design system =============
// A deliberately different accent story from the rest of the site (which is teal-led):
// this page's whole job is to make launching a token feel like an event worth having —
// molten gold (the "mint"), ember pink (ignition/energy), ultraviolet (the tech/chain
// layer underneath). Same dark base + type family as the rest of the site for
// continuity; the color story is the one bold choice reserved for this page.
const GOLD = "#f5a623";
const PINK = "#ff5d8f";
const VIOLET = "#8b5cf6";
const MINT = "#34d399";
const LAUNCH_GRADIENT = "linear(135deg, #f5a623 0%, #ff5d8f 55%, #8b5cf6 100%)";
const LAUNCH_GLOW = "rgba(245,166,35,0.35)";

// ============= Styles =============
const pageStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700;800&family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap');
  @keyframes floatCard { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-7px); } }
  @keyframes shimmerBorder { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
  @keyframes pulseGlow { 0%, 100% { opacity: 0.55; } 50% { opacity: 1; } }
  @keyframes shimmerBtn { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
  @keyframes orbFloat { 0%, 100% { transform: scale(1) translateY(0px); opacity: 0.5; } 50% { transform: scale(1.12) translateY(-20px); opacity: 0.8; } }
  @keyframes rotateRing { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  @keyframes successPop { 0% { transform: scale(0.75) translateY(16px); opacity: 0; } 65% { transform: scale(1.04) translateY(-3px); opacity: 1; } 100% { transform: scale(1) translateY(0px); opacity: 1; } }
  @keyframes hashReveal { from { opacity: 0; letter-spacing: 0.4em; } to { opacity: 1; letter-spacing: 0.07em; } }
  @keyframes ignitionPulse { 0%, 100% { box-shadow: 0 0 40px rgba(245,166,35,0.35), 0 0 0px rgba(255,93,143,0); } 50% { box-shadow: 0 0 65px rgba(245,166,35,0.55), 0 0 30px rgba(255,93,143,0.35); } }
  .wallet-connect-btn button, .wallet-connect-btn button * { white-space: nowrap !important; }
`;

// ============= Stat Card =============
const StatCard = ({ label, value, icon, iconSrc, description, index, color }: { label: string; value: string; icon?: string; iconSrc?: string; description: string; index: number; color: string }) => (
  <MotionBox
    initial={{ opacity: 0, y: 24 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: index * 0.08 }}
    h="full"
  >
    <Box
      bg="rgba(8,6,16,0.85)" backdropFilter="blur(20px)" borderRadius="2xl"
      p={{ base: 3.5, md: 5 }} border={`1px solid ${color}30`} h="full" position="relative" overflow="hidden"
      _hover={{ borderColor: `${color}70`, boxShadow: `0 0 44px ${color}40`, transform: "translateY(-3px)" }}
      transition="all 0.3s ease"
    >
      <Box position="absolute" top={0} left={0} right={0} h="2px" bg={`linear-gradient(90deg, transparent, ${color}, transparent)`} />
      <Box position="absolute" top="-10px" right="-10px" w="90px" h="90px" borderRadius="full" bg={`radial-gradient(circle, ${color}30, transparent 70%)`} />
      <HStack spacing={3} align="center" position="relative">
        <Flex align="center" justify="center" w={{ base: "42px", md: "54px" }} h={{ base: "42px", md: "54px" }}
          bg={`${color}18`} border={`1px solid ${color}45`} borderRadius="xl" flexShrink={0}
          fontSize={{ base: "20px", md: "26px" }} style={{ animation: "floatCard 5s ease-in-out infinite" }}>
          {iconSrc ? <Image src={iconSrc} alt="" boxSize={{ base: "22px", md: "28px" }} objectFit="contain" /> : icon}
        </Flex>
        <Box flex="1" minW="0">
          <Text fontSize="9px" color="gray.500" textTransform="uppercase" letterSpacing="0.2em" fontFamily="'Space Mono', monospace" fontWeight="700" mb={0.5}>
            {label}
          </Text>
          <Text fontSize={{ base: "lg", md: "xl" }} fontWeight="800" color={color} fontFamily="'Space Mono', monospace" letterSpacing="-0.02em" lineHeight="1.1">
            {value}
          </Text>
          <Text fontSize="9px" color="gray.400" mt={1} fontFamily="'Space Grotesk', sans-serif" fontWeight="500">
            {description}
          </Text>
        </Box>
      </HStack>
    </Box>
  </MotionBox>
);

// ============= Success Modal =============
const TokenCreatedModal = ({
  isOpen, onClose, tokenAddress, name, symbol,
}: { isOpen: boolean; onClose: () => void; tokenAddress: string | null; name: string; symbol: string }) => {
  if (!tokenAddress) return null;
  const explorerUrl = `${EXPLORER_ADDRESS_URL}${tokenAddress}`;
  const toast = useToast();
  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(tokenAddress);
      toast({ title: "Address copied", status: "success", duration: 2500, isClosable: true, position: "top-right" });
    } catch {
      toast({ title: "Could not copy", status: "error", duration: 2500, isClosable: true, position: "top-right" });
    }
  };
  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="sm">
      <ModalOverlay bg="rgba(0,0,0,0.82)" backdropFilter="blur(14px)" />
      <ModalContent bg="transparent" border="none" boxShadow="none" mx={4}>
        <ModalCloseButton color="gray.500" top={4} right={4} zIndex={10} _hover={{ color: "white", bg: "rgba(255,255,255,0.08)" }} borderRadius="full" />
        <ModalBody p={0}>
          <Box
            bg="rgba(10,6,16,0.98)" border={`1px solid ${GOLD}55`} borderRadius="2xl" overflow="hidden" position="relative"
            style={{ animation: "successPop 0.42s cubic-bezier(0.34,1.56,0.64,1) forwards" }}
            boxShadow={`0 0 90px ${LAUNCH_GLOW}, 0 0 0 1px rgba(255,255,255,0.04) inset`}
          >
            <Box h="3px" bgGradient={LAUNCH_GRADIENT} backgroundSize="200% 100%" style={{ animation: "shimmerBorder 2s infinite" }} />
            <VStack spacing={5} p={7}>
              <Box position="relative" w="88px" h="88px">
                <Box position="absolute" inset={0} borderRadius="full" border={`1px solid ${GOLD}45`} style={{ animation: "rotateRing 5s linear infinite" }} />
                <Box position="absolute" inset="8px" borderRadius="full" border={`1px dashed ${PINK}30`} style={{ animation: "rotateRing 8s linear infinite reverse" }} />
                <Flex position="absolute" inset="14px" borderRadius="full" bgGradient={LAUNCH_GRADIENT} align="center" justify="center" fontSize="30px" boxShadow={`0 0 30px ${LAUNCH_GLOW}`}>
                  🚀
                </Flex>
              </Box>
              <VStack spacing={1.5}>
                <HStack spacing={2}>
                  <Icon as={CheckCircleIcon} color={MINT} boxSize={4} />
                  <Heading fontSize="xl" fontWeight="800" bgGradient={LAUNCH_GRADIENT} bgClip="text" fontFamily="'Space Grotesk', sans-serif" letterSpacing="-0.02em">
                    Token Launched!
                  </Heading>
                </HStack>
                <Text fontSize="sm" color="gray.400" textAlign="center" fontFamily="'Space Grotesk', sans-serif">
                  {name} ({symbol}) is live on Base as a native B20 token
                </Text>
              </VStack>
              <Box w="full" h="1px" bg={`linear-gradient(90deg, transparent, ${GOLD}40, transparent)`} />
              <VStack spacing={2} w="full" align="stretch">
                <Text fontSize="9px" textTransform="uppercase" letterSpacing="0.2em" color="gray.600" fontFamily="'Space Mono', monospace">
                  Token Address
                </Text>
                <Box bg="rgba(255,255,255,0.03)" border={`1px solid ${GOLD}25`} borderRadius="lg" px={3} py={2.5} cursor="pointer" onClick={copyAddress}>
                  <Text fontSize="xs" fontFamily="'Space Mono', monospace" color={GOLD} style={{ animation: "hashReveal 0.5s ease-out forwards" }} wordBreak="break-all">
                    {tokenAddress}
                  </Text>
                </Box>
              </VStack>
              <Link href={explorerUrl} isExternal w="full" _hover={{ textDecoration: "none" }}>
                <Button w="full" h="50px" bgGradient={LAUNCH_GRADIENT} color="white" fontWeight="800" fontSize="sm" borderRadius="xl"
                  rightIcon={<ExternalLinkIcon boxSize={3.5} />}
                  _hover={{ opacity: 0.9, transform: "translateY(-2px)", boxShadow: `0 12px 40px ${LAUNCH_GLOW}` }}
                  _active={{ transform: "scale(0.97)" }} transition="all 0.22s" fontFamily="'Space Grotesk', sans-serif">
                  View on Basescan
                </Button>
              </Link>
              <Button variant="ghost" size="sm" color="gray.600" onClick={onClose} _hover={{ color: "white", bg: "rgba(255,255,255,0.04)" }} borderRadius="full" fontFamily="'Space Grotesk', sans-serif">
                Close
              </Button>
            </VStack>
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

// ============= Recent Token Row =============
const RECENT_ROW_COLORS = [GOLD, PINK, VIOLET, MINT];
const RecentTokenRow = ({ record, index }: { record: TokenRecord; index: number }) => {
  const date = new Date(Number(record.createdAt) * 1000);
  const dateLabel = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const color = RECENT_ROW_COLORS[index % RECENT_ROW_COLORS.length];
  return (
    <Link href={`${EXPLORER_ADDRESS_URL}${record.token}`} isExternal _hover={{ textDecoration: "none" }}>
      <Flex
        justify="space-between" align="center" px={4} py={3} borderRadius="lg"
        bg="rgba(255,255,255,0.02)" border="1px solid rgba(255,255,255,0.06)"
        _hover={{ bg: `${color}0f`, borderColor: `${color}45` }} transition="all 0.2s"
      >
        <HStack spacing={3} minW="0">
          <Flex w="34px" h="34px" borderRadius="lg" bg={`${color}18`} border={`1px solid ${color}40`} align="center" justify="center" flexShrink={0} fontSize="14px">
            🪙
          </Flex>
          <Box minW="0">
            <Text fontSize="sm" fontWeight="700" color="white" fontFamily="'Space Grotesk', sans-serif" noOfLines={1}>
              {record.name} <Text as="span" color="gray.500" fontWeight="500">({record.symbol})</Text>
            </Text>
            <Text fontSize="10px" color="gray.500" fontFamily="'Space Mono', monospace">
              {shortAddr(record.token)} · by {shortAddr(record.creator)}
            </Text>
          </Box>
        </HStack>
        <Text fontSize="10px" color={color} fontFamily="'Space Mono', monospace" flexShrink={0} ml={2} fontWeight="700">
          {dateLabel}
        </Text>
      </Flex>
    </Link>
  );
};

// ============= Info Section =============
const InfoSection = () => (
  <MotionBox initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }} mt={10}>
    <Box bg="rgba(8,6,16,0.8)" backdropFilter="blur(20px)" borderRadius="2xl" border={`1px solid ${GOLD}20`} p={{ base: 5, md: 7 }} position="relative" overflow="hidden">
      <Box position="absolute" top={0} left={0} right={0} h="2px" bgGradient={LAUNCH_GRADIENT} backgroundSize="300% 100%" style={{ animation: "shimmerBorder 4s infinite" }} />
      <VStack spacing={5} align="stretch">
        <Box>
          <Heading size="sm" color="white" fontWeight="700" fontFamily="'Space Grotesk', sans-serif">
            What can you do here?
          </Heading>
          <Text fontSize="xs" color="gray.500" fontFamily="'Space Grotesk', sans-serif" mt={1}>
            B20 Launcher · Native Base Token Standard
          </Text>
        </Box>
        <Text fontSize="sm" color="gray.400" lineHeight="1.8" fontFamily="'Space Grotesk', sans-serif">
          <Text as="span" color={GOLD} fontWeight="700">B20</Text> is Base's native, protocol-level token standard — an ERC-20 superset
          that runs as a chain precompile instead of a deployed contract, so it's cheaper and safer by default.
          This page charges a small fixed fee and does the whole setup for you in one transaction.
        </Text>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          {[
            { icon: "🪙", color: GOLD, title: "Launch your own token", text: "Pick a name, symbol and decimals (6–18) and get a fully native B20 Asset token, live on Base in one transaction." },
            { icon: "🔑", color: VIOLET, title: "You keep control", text: "You're set as admin and minter on your token — mint, pause, grant roles or update its supply cap whenever you want." },
            { icon: "📈", color: PINK, title: "Optional supply cap", text: "Cap the max supply at creation, or leave it uncapped and mint freely up to the protocol's own hard ceiling." },
            { icon: "🔍", color: MINT, title: "Track every launch", text: "Every token created through this page is logged on-chain — see totals, your own history, and the most recent launches below." },
          ].map((item) => (
            <Box key={item.title} p={4} bg={`${item.color}0d`} borderRadius="xl" border={`1px solid ${item.color}30`} _hover={{ bg: `${item.color}18`, borderColor: `${item.color}55` }} transition="all 0.22s">
              <HStack spacing={3} align="start">
                <Text fontSize="xl" mt={0.5} flexShrink={0}>{item.icon}</Text>
                <Box>
                  <Text fontWeight="700" color={item.color} fontSize="sm" mb={1} fontFamily="'Space Grotesk', sans-serif">{item.title}</Text>
                  <Text fontSize="xs" color="gray.400" lineHeight="1.7" fontFamily="'Space Grotesk', sans-serif">{item.text}</Text>
                </Box>
              </HStack>
            </Box>
          ))}
        </SimpleGrid>
        <Box h="1px" bg={`linear-gradient(90deg, transparent, ${GOLD}30, transparent)`} />
        <HStack spacing={3} wrap="wrap">
          {[
            { dot: MINT, text: "Native precompile, not a deployed contract" },
            { dot: GOLD, text: "Full ERC-20 compatibility" },
            { dot: VIOLET, text: "Fixed one-time creation fee" },
            { dot: PINK, text: "You hold admin + mint role" },
          ].map(({ dot, text }) => (
            <HStack key={text} spacing={1.5}>
              <Box w="6px" h="6px" borderRadius="full" bg={dot} flexShrink={0} boxShadow={`0 0 8px ${dot}`} />
              <Text fontSize="xs" color="gray.400" fontFamily="'Space Grotesk', sans-serif">{text}</Text>
            </HStack>
          ))}
        </HStack>
      </VStack>
    </Box>
  </MotionBox>
);

// ============= Footer =============
const Footer = () => (
  <Box pt={10} pb={6} position="relative">
    <Box h="1px" mb={8} bg={`linear-gradient(90deg, transparent, ${GOLD}30, ${VIOLET}30, transparent)`} />
    <VStack spacing={5}>
      <HStack
        spacing={0} justify="center" flexWrap="wrap"
        bg="rgba(255,255,255,0.02)" border="1px solid rgba(255,255,255,0.05)" borderRadius="2xl" px={6} py={3} gap={0}
      >
        {[
          { label: "Network", value: "Base" },
          { label: "Standard", value: "B20 (native)" },
          { label: "Fee", value: "Fixed, one-time" },
          { label: "Status", value: "Live ✓" },
        ].map(({ label, value }, i, arr) => (
          <HStack key={label} spacing={0}>
            <VStack spacing={0} px={{ base: 4, md: 6 }} py={1}>
              <Text fontSize="9px" color="gray.600" textTransform="uppercase" letterSpacing="0.18em" fontFamily="'Space Mono', monospace">{label}</Text>
              <Text fontSize="xs" fontWeight="700" color="gray.400" fontFamily="'Space Mono', monospace">{value}</Text>
            </VStack>
            {i < arr.length - 1 && <Box w="1px" h="28px" bg="rgba(255,255,255,0.06)" flexShrink={0} />}
          </HStack>
        ))}
      </HStack>
      <VStack spacing={1}>
        <Text fontSize="11px" color="gray.400" fontFamily="'Space Mono', monospace" letterSpacing="0.12em" textAlign="center">
          © 2026 · Agent Protocol · All rights reserved
        </Text>
        <Text fontSize="11px" color="gray.400" fontFamily="'Space Mono', monospace" letterSpacing="0.08em">
          Built on Base · Powered by SilviuASY
        </Text>
      </VStack>
    </VStack>
  </Box>
);

// ============= Main Page =============
export default function DeployB20Page() {
  useFixScroll();
  const { address, isConnected, chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const toast = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [decimals, setDecimals] = useState(18);
  const [uncapped, setUncapped] = useState(true);
  const [supplyInput, setSupplyInput] = useState("1000000000");
  const [salt, setSalt] = useState<`0x${string}`>(randomSalt());
  const [isCreating, setIsCreating] = useState(false);
  const [createdToken, setCreatedToken] = useState<string | null>(null);

  const { isOpen: isSuccessOpen, onOpen: openSuccess, onClose: closeSuccess } = useDisclosure();

  const isOnBase = chainId === BASE_CHAIN_ID;
  const [switchAttempted, setSwitchAttempted] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  // Prompt a network switch automatically, once, the moment we see the wallet is
  // connected but not on Base. If the user dismisses it, the banner below still
  // offers a manual "Switch to Base" button.
  useEffect(() => {
    if (isConnected && !isOnBase && !switchAttempted) {
      setSwitchAttempted(true);
      switchChain?.({ chainId: BASE_CHAIN_ID });
    }
    if (isOnBase) setSwitchAttempted(false);
  }, [isConnected, isOnBase, switchAttempted, switchChain]);

  const handleSwitchToBase = async () => {
    setIsSwitching(true);
    try {
      await switchChain?.({ chainId: BASE_CHAIN_ID });
    } catch {
      toast({ title: "Network Switch Failed", description: "Please switch to Base manually from your wallet.", status: "error", duration: 4000, isClosable: true, position: "top-right" });
    } finally {
      setIsSwitching(false);
    }
  };

  const { data: contractReads, refetch: refetchContractReads } = useReadContracts({
    contracts: [
      { address: B20_LAUNCHER_ADDRESS, abi: B20_LAUNCHER_ABI, functionName: "creationFee" },
      { address: B20_LAUNCHER_ADDRESS, abi: B20_LAUNCHER_ABI, functionName: "totalTokensCreated" },
      { address: B20_LAUNCHER_ADDRESS, abi: B20_LAUNCHER_ABI, functionName: "getRecentTokens", args: [8n] },
      { address: B20_LAUNCHER_ADDRESS, abi: B20_LAUNCHER_ABI, functionName: "isAssetFeatureActive" },
      {
        address: B20_LAUNCHER_ADDRESS, abi: B20_LAUNCHER_ABI, functionName: "creationCountOf",
        args: address ? [address] : undefined,
      },
    ],
    query: { enabled: true, staleTime: 20000 },
  });

  const creationFee = contractReads?.[0]?.status === "success" ? (contractReads[0].result as bigint) : undefined;
  const totalCreated = contractReads?.[1]?.status === "success" ? (contractReads[1].result as bigint) : undefined;
  const recentTokens = contractReads?.[2]?.status === "success" ? (contractReads[2].result as unknown as TokenRecord[]) : [];
  const isFeatureActive = contractReads?.[3]?.status === "success" ? (contractReads[3].result as boolean) : undefined;
  const yourCount = contractReads?.[4]?.status === "success" ? (contractReads[4].result as bigint) : undefined;

  const { data: nativeBalance, refetch: refetchBalance } = useBalance({
    address,
    chainId: BASE_CHAIN_ID,
    query: { enabled: !!address && isConnected, staleTime: 15000 },
  });

  const feeLoading = !contractReads;
  const hasInsufficientBalance =
    isConnected && !feeLoading && creationFee !== undefined && nativeBalance !== undefined && nativeBalance.value < creationFee;

  const isFormValid = name.trim().length > 0 && symbol.trim().length > 0 && decimals >= 6 && decimals <= 18 && (uncapped || Number(supplyInput) > 0);

  const feeFormatted = creationFee !== undefined ? (Number(creationFee) / 1e18).toFixed(6) : "...";

  const handleCreate = async () => {
    if (!address) {
      toast({ title: "Wallet Not Connected", description: "Connect your wallet first.", status: "warning", duration: 4000, isClosable: true, position: "top-right" });
      return;
    }
    if (!isFormValid || creationFee === undefined) return;

    setIsCreating(true);
    try {
      if (getAccount(wagmiConfig).chainId !== BASE_CHAIN_ID) {
        try {
          await switchChain?.({ chainId: BASE_CHAIN_ID });
        } catch {
          toast({ title: "Network Switch Failed", description: "Please switch to Base manually.", status: "error", duration: 4000, isClosable: true, position: "top-right" });
          setIsCreating(false);
          return;
        }
        const switched = await ensureWalletOnChain(BASE_CHAIN_ID);
        if (!switched) {
          toast({ title: "Network Switch Failed", description: "Please switch to Base manually and try again.", status: "error", duration: 4000, isClosable: true, position: "top-right" });
          setIsCreating(false);
          return;
        }
      }

      const rawSupplyCap = uncapped ? 0n : parseUnits(supplyInput || "0", decimals);

      // Wallets can't reliably estimate gas for a call that touches the B20 precompile
      // (their simulators don't model Base's native precompiles), so they either warn
      // "likely to fail" on a perfectly valid tx, or fall back to a bogus gas estimate
      // that exceeds Base's per-tx gas cap. Setting a fixed, generous manual limit
      // sidesteps both problems.
      const MANUAL_GAS_LIMIT = 1_500_000n;

      let txHash: `0x${string}`;
      try {
        txHash = await writeContractAsync({
          address: B20_LAUNCHER_ADDRESS,
          abi: B20_LAUNCHER_ABI,
          functionName: "createToken",
          args: [name.trim(), symbol.trim(), decimals, rawSupplyCap, salt],
          value: creationFee,
          chainId: BASE_CHAIN_ID,
          gas: MANUAL_GAS_LIMIT,
        });
      } catch (writeError: any) {
        if (isChainMismatchError(writeError)) {
          const resynced = await ensureWalletOnChain(BASE_CHAIN_ID, 6000);
          if (!resynced) throw writeError;
          txHash = await writeContractAsync({
            address: B20_LAUNCHER_ADDRESS,
            abi: B20_LAUNCHER_ABI,
            functionName: "createToken",
            args: [name.trim(), symbol.trim(), decimals, rawSupplyCap, salt],
            value: creationFee,
            chainId: BASE_CHAIN_ID,
            gas: MANUAL_GAS_LIMIT,
          });
        } else {
          throw writeError;
        }
      }

      const receipt = await waitForTransactionReceipt(wagmiConfig, { hash: txHash, chainId: BASE_CHAIN_ID });

      let newToken: string | null = null;
      for (const log of receipt.logs) {
        if (log.address.toLowerCase() !== B20_LAUNCHER_ADDRESS.toLowerCase()) continue;
        try {
          const decoded = decodeEventLog({ abi: B20_LAUNCHER_ABI, data: log.data, topics: log.topics });
          if (decoded.eventName === "TokenCreated") {
            newToken = (decoded.args as any).token as string;
            break;
          }
        } catch {
          /* not our event, skip */
        }
      }

      if (newToken) {
        setCreatedToken(newToken);
        openSuccess();
        confetti({ particleCount: 190, spread: 75, origin: { y: 0.55 }, colors: [GOLD, PINK, VIOLET, MINT] });
      } else {
        toast({ title: "Token Created", description: "Check the recent tokens list below for the new address.", status: "success", duration: 6000, isClosable: true, position: "top-right" });
      }

      // Refresh salt after successful deployment to avoid "TokenAlreadyExists" error
      setSalt(randomSalt());
      refetchContractReads();
      refetchBalance();
    } catch (error: any) {
      const details = getErrorDetails(error);
      if (details) {
        toast({ title: details.title, description: details.description, status: "error", duration: 6000, isClosable: true, position: "top-right" });
      }
    } finally {
      setIsCreating(false);
    }
  };

  const buttonLabel = isFeatureActive === false ? "Not live on Base yet" : hasInsufficientBalance ? "Insufficient balance" : "Launch B20 Token 🚀";

  return (
    <>
      <style>{pageStyles}</style>
      <TokenCreatedModal isOpen={isSuccessOpen} onClose={closeSuccess} tokenAddress={createdToken} name={name} symbol={symbol} />
      <Box minH="100vh" bg="#050308" position="relative" fontFamily="'Space Grotesk', sans-serif">
        <Box position="fixed" top="-12%" left="-10%" w="700px" h="700px" borderRadius="full"
          bg={`radial-gradient(circle, ${GOLD}22 0%, transparent 65%)`} filter="blur(95px)"
          style={{ animation: "orbFloat 20s ease-in-out infinite" }} zIndex={0} pointerEvents="none" />
        <Box position="fixed" bottom="-12%" right="-10%" w="780px" h="780px" borderRadius="full"
          bg={`radial-gradient(circle, ${VIOLET}22 0%, transparent 65%)`} filter="blur(115px)"
          style={{ animation: "orbFloat 26s ease-in-out infinite 6s" }} zIndex={0} pointerEvents="none" />
        <Box position="fixed" top="35%" left="55%" w="500px" h="500px" borderRadius="full"
          bg={`radial-gradient(circle, ${PINK}18 0%, transparent 65%)`} filter="blur(90px)"
          style={{ animation: "orbFloat 17s ease-in-out infinite reverse 3s" }} zIndex={0} pointerEvents="none" />

        <Container maxW="1200px" position="relative" zIndex={1} px={{ base: 3, md: 6, lg: 8 }} py={{ base: 4, md: 8 }}>
          {/* Header */}
          <Flex justify="space-between" align="center" mb={{ base: 6, md: 8 }} direction={{ base: "column", md: "row" }} gap={{ base: 3, md: 0 }}>
            <HStack spacing={4}>
              <Button onClick={() => navigate("/")} variant="ghost" size={{ base: "sm", md: "md" }} leftIcon={<ChevronLeftIcon />}
                color="gray.500" _hover={{ color: "white", bg: `${GOLD}14`, borderColor: `${GOLD}35` }}
                borderRadius="xl" border="1px solid rgba(255,255,255,0.07)" fontFamily="'Space Grotesk', sans-serif" fontWeight="500" transition="all 0.2s">
                Back
              </Button>
              <Box h="36px" w="1px" bg="rgba(255,255,255,0.05)" display={{ base: "none", md: "block" }} />
              <VStack align="start" spacing={0.5}>
                <HStack spacing={3} align="center">
                  <Box w="7px" h="7px" borderRadius="full" bg={MINT} boxShadow={`0 0 8px ${MINT}`} style={{ animation: "pulseGlow 2.5s ease-in-out infinite" }} />
                  <Heading fontSize={{ base: "xl", md: "2xl", lg: "3xl" }} fontWeight="800" bgGradient={LAUNCH_GRADIENT} bgClip="text" letterSpacing="-0.03em" fontFamily="'Space Grotesk', sans-serif">
                    Deploy B20
                  </Heading>
                  <Badge bg={`${GOLD}18`} color={GOLD} fontSize="9px" px={2} py={0.5} borderRadius="full" border={`1px solid ${GOLD}40`} fontFamily="'Space Mono', monospace">
                    Base
                  </Badge>
                </HStack>
                <Text color="gray.400" fontSize={{ base: "10px", md: "11px" }} letterSpacing="0.2em" fontFamily="'Space Mono', monospace" textTransform="uppercase">
                  Native Token Standard · Fully Configured On-Chain
                </Text>
              </VStack>
            </HStack>
            <Box className="wallet-connect-btn" _hover={{ transform: "scale(1.02)" }} transition="transform 0.2s">
              <ConnectButton chainStatus="full" accountStatus="full" showBalance={{ smallScreen: false, largeScreen: false }} />
            </Box>
          </Flex>

          {/* Hero proof strip — the page's thesis: scale + speed, before anything else */}
          <MotionBox initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }} mb={{ base: 6, md: 8 }}>
            <Box
              position="relative" overflow="hidden" borderRadius="2xl" p={{ base: 5, md: 7 }}
              border={`1px solid ${GOLD}30`}
              bg="rgba(10,7,18,0.9)"
            >
              <Box position="absolute" inset={0} bgGradient={`linear(120deg, ${GOLD}14, ${PINK}0d, ${VIOLET}14)`} />
              <Box position="absolute" top={0} left={0} right={0} h="2px" bgGradient={LAUNCH_GRADIENT} backgroundSize="300% 100%" style={{ animation: "shimmerBorder 5s infinite" }} />
              <Flex position="relative" direction={{ base: "column", md: "row" }} align={{ base: "flex-start", md: "center" }} justify="space-between" gap={4}>
                <HStack spacing={4} align="center">
                  <Flex w={{ base: "48px", md: "60px" }} h={{ base: "48px", md: "60px" }} borderRadius="2xl" bgGradient={LAUNCH_GRADIENT}
                    align="center" justify="center" fontSize={{ base: "22px", md: "28px" }} flexShrink={0} p={2}
                    boxShadow={`0 0 30px ${LAUNCH_GLOW}`} style={{ animation: "ignitionPulse 3.5s ease-in-out infinite" }}>
                    <Image src="/base.png" alt="Base" boxSize={{ base: "28px", md: "36px" }} objectFit="contain" />
                  </Flex>
                  <Box>
                    <Text fontSize={{ base: "10px", md: "11px" }} color="gray.400" textTransform="uppercase" letterSpacing="0.2em" fontFamily="'Space Mono', monospace" fontWeight="700" mb={1}>
                      Live on Base
                    </Text>
                    <HStack align="baseline" spacing={2} flexWrap="wrap">
                      <Text fontSize={{ base: "2xl", md: "4xl" }} fontWeight="800" bgGradient={LAUNCH_GRADIENT} bgClip="text" fontFamily="'Space Grotesk', sans-serif" letterSpacing="-0.02em">
                        {totalCreated !== undefined ? totalCreated.toString() : "···"}
                      </Text>
                      <Text fontSize={{ base: "sm", md: "md" }} color="gray.300" fontFamily="'Space Grotesk', sans-serif" fontWeight="600">
                        B20 Token-Standard launched, one transaction each
                      </Text>
                    </HStack>
                  </Box>
                </HStack>
                <VStack align={{ base: "start", md: "end" }} spacing={0.5}>
                  <Text fontSize="10px" color="gray.500" textTransform="uppercase" letterSpacing="0.15em" fontFamily="'Space Mono', monospace">
                    Your cost to launch
                  </Text>
                  <Text fontSize={{ base: "lg", md: "xl" }} fontWeight="800" color={GOLD} fontFamily="'Space Mono', monospace">
                    {feeLoading ? "···" : `${feeFormatted} ETH`}
                  </Text>
                </VStack>
              </Flex>
            </Box>
          </MotionBox>

          {isFeatureActive === false && (
            <MotionBox initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} mb={5}>
              <Box bg="rgba(248,113,113,0.08)" border="1px solid rgba(248,113,113,0.3)" borderRadius="xl" p={3.5}>
                <HStack spacing={2}>
                  <Icon as={WarningIcon} color="#f87171" boxSize={4} />
                  <Text fontSize="sm" color="#f87171" fontFamily="'Space Grotesk', sans-serif">
                    B20 Asset tokens aren't activated on Base yet — creation is disabled until Base turns this on.
                  </Text>
                </HStack>
              </Box>
            </MotionBox>
          )}

          {!isOnBase && isConnected && (
            <MotionBox initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} mb={5}>
              <Flex
                justify="space-between" align="center" wrap="wrap" gap={3}
                bg="rgba(249,115,22,0.08)" border="1px solid rgba(249,115,22,0.3)" borderRadius="xl" p={3.5}
              >
                <HStack spacing={2}>
                  <Icon as={WarningIcon} color="#f97316" boxSize={4} />
                  <Text fontSize="sm" color="#f97316" fontFamily="'Space Grotesk', sans-serif">
                    Wrong network — B20 tokens only exist on Base.
                  </Text>
                </HStack>
                <Button
                  onClick={handleSwitchToBase} isLoading={isSwitching} loadingText="Switching…" size="sm"
                  bg="rgba(249,115,22,0.18)" color="#f97316" border="1px solid rgba(249,115,22,0.45)" borderRadius="lg"
                  fontWeight="700" fontFamily="'Space Grotesk', sans-serif"
                  _hover={{ bg: "rgba(249,115,22,0.28)" }}
                >
                  Switch to Base
                </Button>
              </Flex>
            </MotionBox>
          )}

          {/* Stats */}
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={{ base: 2.5, md: 5 }} mb={{ base: 7, md: 10 }}>
            <StatCard index={0} icon="🪙" label="Tokens Launched" value={totalCreated !== undefined ? totalCreated.toString() : "..."} description="Total on this launcher" color={GOLD} />
            <StatCard index={1} icon="👤" label="Your Tokens" value={yourCount !== undefined ? yourCount.toString() : isConnected ? "..." : "0"} description="Created by you" color={VIOLET} />
            <StatCard index={2} icon="⚡" label="Creation Fee" value={feeLoading ? "..." : `${feeFormatted}`} description="ETH per token" color={PINK} />
            <StatCard index={3} iconSrc="/base.png" label="Network" value="Base" description="Native B20 precompile" color={MINT} />
          </SimpleGrid>

          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={{ base: 5, md: 6 }} alignItems="start">
            {/* Create form */}
            <Box
              bg="rgba(10,7,18,0.93)" backdropFilter="blur(28px)" borderRadius="2xl" border="1px solid" borderColor={`${GOLD}30`}
              overflow="hidden" position="relative"
            >
              <Box position="absolute" top={0} left={0} right={0} h="2px" bgGradient={LAUNCH_GRADIENT} backgroundSize="200% 100%" style={{ animation: "shimmerBorder 3.5s infinite" }} />
              <Box p={{ base: 5, md: 6 }}>
                <VStack spacing={4} align="stretch">
                  <HStack justify="space-between" align="center">
                    <Heading fontSize="lg" fontWeight="800" color="white" fontFamily="'Space Grotesk', sans-serif">
                      Create your token
                    </Heading>
                    <Badge bg={`${PINK}18`} color={PINK} fontSize="9px" px={2.5} py={1} borderRadius="full" border={`1px solid ${PINK}35`} fontFamily="'Space Mono', monospace">
                      ~2 SEC
                    </Badge>
                  </HStack>

                  <FormControl>
                    <FormLabel fontSize="xs" color="gray.400" fontFamily="'Space Grotesk', sans-serif" fontWeight="600">Name</FormLabel>
                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="B20 Token" maxLength={64}
                      bg="rgba(255,255,255,0.03)" border="1px solid rgba(255,255,255,0.1)" borderRadius="lg" color="white"
                      _placeholder={{ color: "gray.600" }} _hover={{ borderColor: `${GOLD}50` }}
                      _focus={{ borderColor: GOLD, boxShadow: `0 0 20px ${GOLD}25` }}
                      fontFamily="'Space Grotesk', sans-serif" />
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="xs" color="gray.400" fontFamily="'Space Grotesk', sans-serif" fontWeight="600">Symbol</FormLabel>
                    <Input value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} placeholder="B20" maxLength={11}
                      bg="rgba(255,255,255,0.03)" border="1px solid rgba(255,255,255,0.1)" borderRadius="lg" color="white"
                      _placeholder={{ color: "gray.600" }} _hover={{ borderColor: `${PINK}50` }}
                      _focus={{ borderColor: PINK, boxShadow: `0 0 20px ${PINK}25` }}
                      fontFamily="'Space Mono', monospace" letterSpacing="0.05em" />
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="xs" color="gray.400" fontFamily="'Space Grotesk', sans-serif" fontWeight="600">Decimals (6–18)</FormLabel>
                    <NumberInput value={decimals} onChange={(_, n) => setDecimals(Number.isNaN(n) ? 18 : n)} min={6} max={18} clampValueOnBlur>
                      <NumberInputField bg="rgba(255,255,255,0.03)" border="1px solid rgba(255,255,255,0.1)" borderRadius="lg" color="white"
                        _hover={{ borderColor: `${VIOLET}50` }} _focus={{ borderColor: VIOLET }} fontFamily="'Space Mono', monospace" />
                      <NumberInputStepper>
                        <NumberIncrementStepper borderColor="rgba(255,255,255,0.1)" color="gray.400" />
                        <NumberDecrementStepper borderColor="rgba(255,255,255,0.1)" color="gray.400" />
                      </NumberInputStepper>
                    </NumberInput>
                  </FormControl>

                  <FormControl display="flex" alignItems="center" justifyContent="space-between">
                    <FormLabel fontSize="xs" color="gray.400" fontFamily="'Space Grotesk', sans-serif" fontWeight="600" mb={0}>
                      Uncapped supply
                    </FormLabel>
                    <Switch isChecked={uncapped} onChange={(e) => setUncapped(e.target.checked)} colorScheme="orange" />
                  </FormControl>

                  {!uncapped && (
                    <FormControl>
                      <FormLabel fontSize="xs" color="gray.400" fontFamily="'Space Grotesk', sans-serif" fontWeight="600">Max supply (whole tokens)</FormLabel>
                      <Input value={supplyInput} onChange={(e) => setSupplyInput(e.target.value.replace(/[^0-9.]/g, ""))} placeholder="1000000000"
                        bg="rgba(255,255,255,0.03)" border="1px solid rgba(255,255,255,0.1)" borderRadius="lg" color="white"
                        _placeholder={{ color: "gray.600" }} _hover={{ borderColor: `${GOLD}50` }}
                        _focus={{ borderColor: GOLD }} fontFamily="'Space Mono', monospace" />
                    </FormControl>
                  )}

                  <FormControl>
                    <FormLabel fontSize="xs" color="gray.400" fontFamily="'Space Grotesk', sans-serif" fontWeight="600">Salt</FormLabel>
                    <HStack spacing={2}>
                      <Box flex="1" bg="rgba(255,255,255,0.03)" border="1px solid rgba(255,255,255,0.1)" borderRadius="lg" px={3} py={2} overflow="hidden">
                        <Text fontSize="10px" color="gray.500" fontFamily="'Space Mono', monospace" noOfLines={1}>{salt}</Text>
                      </Box>
                      <Tooltip label="Get a new random salt" hasArrow>
                        <Button onClick={() => setSalt(randomSalt())} variant="outline" borderColor="rgba(255,255,255,0.12)" color="gray.400"
                          _hover={{ bg: `${VIOLET}14`, borderColor: `${VIOLET}50`, color: VIOLET }} borderRadius="lg">
                          <RepeatIcon boxSize={4} />
                        </Button>
                      </Tooltip>
                    </HStack>
                  </FormControl>

                  <Divider borderColor="rgba(255,255,255,0.08)" />

                  <Flex justify="space-between" align="center">
                    <Text fontSize="xs" color="gray.500" fontFamily="'Space Grotesk', sans-serif">Creation fee</Text>
                    <Text fontSize="sm" fontWeight="700" color={GOLD} fontFamily="'Space Mono', monospace">
                      {feeLoading ? "..." : `${feeFormatted} ETH`}
                    </Text>
                  </Flex>

                  <Button
                    w="full" h="56px" fontWeight="800" fontSize="sm" color="white" borderRadius="xl"
                    bgGradient={LAUNCH_GRADIENT} backgroundSize="200% auto"
                    _hover={{ transform: "translateY(-2px)", boxShadow: `0 16px 50px ${LAUNCH_GLOW}`, backgroundPosition: "right center" }}
                    _active={{ transform: "scale(0.97)" }}
                    onClick={handleCreate}
                    isLoading={isCreating}
                    loadingText="Launching…"
                    spinner={<Spinner size="sm" />}
                    isDisabled={!isConnected || !isFormValid || isCreating || hasInsufficientBalance || feeLoading || isFeatureActive === false}
                    fontFamily="'Space Grotesk', sans-serif"
                    letterSpacing="0.01em"
                    transition="all 0.28s ease"
                    boxShadow={`0 0 40px ${LAUNCH_GLOW}`}
                    style={!isCreating ? { animation: "ignitionPulse 3.5s ease-in-out infinite" } : undefined}
                  >
                    {buttonLabel}
                  </Button>
                  {!isConnected && (
                    <Text fontSize="10px" color="gray.700" textAlign="center" fontFamily="'Space Grotesk', sans-serif">
                      Connect your wallet to continue
                    </Text>
                  )}
                </VStack>
              </Box>
            </Box>

            {/* Recent tokens */}
            <Box
              bg="rgba(10,7,18,0.93)" backdropFilter="blur(28px)" borderRadius="2xl" border="1px solid" borderColor={`${VIOLET}30`}
              overflow="hidden" position="relative"
            >
              <Box position="absolute" top={0} left={0} right={0} h="2px" bgGradient={LAUNCH_GRADIENT} backgroundSize="200% 100%" style={{ animation: "shimmerBorder 3.5s infinite" }} />
              <Box p={{ base: 5, md: 6 }}>
                <HStack justify="space-between" mb={4}>
                  <Heading fontSize="lg" fontWeight="800" color="white" fontFamily="'Space Grotesk', sans-serif">
                    Recently launched
                  </Heading>
                  <Box w="7px" h="7px" borderRadius="full" bg={MINT} boxShadow={`0 0 8px ${MINT}`} style={{ animation: "pulseGlow 2s ease-in-out infinite" }} />
                </HStack>
                {recentTokens.length === 0 ? (
                  <Text fontSize="sm" color="gray.600" fontFamily="'Space Grotesk', sans-serif" textAlign="center" py={10}>
                    No tokens created yet — be the first.
                  </Text>
                ) : (
                  <VStack spacing={2.5} align="stretch">
                    {recentTokens.map((record, i) => (
                      <RecentTokenRow key={`${record.token}-${record.createdAt.toString()}`} record={record} index={i} />
                    ))}
                  </VStack>
                )}
              </Box>
            </Box>
          </SimpleGrid>

          <InfoSection />
          <Footer />
        </Container>
      </Box>
    </>
  );
}

// src/App.tsx
import {
  Box,
  Button,
  Center,
  Container,
  Flex,
  Grid,
  GridItem,
  Heading,
  HStack,
  Text,
  VStack,
  Badge,
  SimpleGrid,
  Tooltip,
  Skeleton,
  Progress,
  Image,
  Alert,
  AlertIcon,
  AlertDescription,
} from "@chakra-ui/react";

import { keyframes } from "@emotion/react";
import { ConnectButton } from "@rainbow-me/rainbowkit";

import {
  useAccount,
  useChainId,
  useSwitchChain,
  useReadContract,
  useWriteContract,
  usePublicClient,
} from "wagmi";

import { useEffect, useState, useMemo, useRef } from "react";
import confetti from "canvas-confetti";
import { useNavigate } from "react-router-dom";
import { ChevronDownIcon } from "@chakra-ui/icons";

import {
  soneiumChain as soneium,
  inkChain as ink,
  optimismChain as optimism,
  baseChain as base,
  unichainChain as unichain,
} from "./wagmi";

import TransactionModal from "./components/TransactionModal";
import { IdentityRegistryABI } from "./abi/IdentityRegistryABI";
import { DailyAgentABI } from "./abi/DailyAgentABI";

// ================= SUPPORTED CHAINS =================
const SUPPORTED_CHAIN_IDS = [1868, 57073, 10, 8453, 130];
const DEFAULT_SWITCH_CHAIN = 1868; // Soneium

// ================= CONTRACT ADDRESSES =================
const CONTRACTS = {
  soneium: {
    identityRegistry: "0x29c4632A1710BC58cE8D9d46Ec227fc569f58bF1" as const,
    dailyGM: "0xb19922c27C86cc08dc4f0f3Cb4e76c30494c22dc" as const,
    chainId: 1868,
  },
  ink: {
    identityRegistry: "0xd7a368Fd63207A4519BF6636fd6b1246A63C1eF3" as const,
    dailyGM: "0x581091931CBB739A337F9419C393619A47A1278E" as const,
    chainId: 57073,
  },
  optimism: {
    identityRegistry: "0xbff60bfbb9c327619e1d955ae2f9c31bc719db8b" as const,
    dailyGM: "0x4AB2db4852D4E56Ea721a40136ED6F9aEc3ae404" as const,
    chainId: 10,
  },
  base: {
    identityRegistry: "0x7a5e06310e9f77d4f302b858a88906f74c22bf78" as const,
    dailyGM: "0x7e359a9eC6782d68bBc8DefA5aDB5E92e32f5fCd" as const,
    chainId: 8453,
  },
  unichain: {
    identityRegistry: "0x81729754038058742b8fcc5792e6bd8612b504c1" as const,
    dailyGM: "0xD3cf595cC6bd79Ca6a0183Bef555c27065f573A5" as const,
    chainId: 130,
  },
} as const;

const FIXED_AGENT_URI = "ipfs://bafkreihkka666l6f7xreletjrvbn3fb3dvlvn3ifbmzj2wlnyhfpnqnobm";
const COOLDOWN_SECONDS = 86400;

// ================= ANIMATIONS =================
const pulseGlow = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.4); opacity: 0.8; }
  50% { box-shadow: 0 0 0 20px rgba(139, 92, 246, 0); opacity: 1; }
  100% { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0); opacity: 0.8; }
`;

const pulseGreen = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.5); }
  70% { box-shadow: 0 0 0 16px rgba(74, 222, 128, 0); }
  100% { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0); }
`;

const pulseGold = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.4); }
  70% { box-shadow: 0 0 0 16px rgba(251, 191, 36, 0); }
  100% { box-shadow: 0 0 0 0 rgba(251, 191, 36, 0); }
`;

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const glowPulse = keyframes`
  0% { filter: brightness(1); }
  50% { filter: brightness(1.15); }
  100% { filter: brightness(1); }
`;

const slideUp = keyframes`
  from { opacity: 0; transform: translateY(24px); }
  to { opacity: 1; transform: translateY(0); }
`;

const slideInLeft = keyframes`
  from { opacity: 0; transform: translateX(-24px); }
  to { opacity: 1; transform: translateX(0); }
`;

const slideInRight = keyframes`
  from { opacity: 0; transform: translateX(24px); }
  to { opacity: 1; transform: translateX(0); }
`;

const rotateBorder = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const breathe = keyframes`
  0%, 100% { transform: scale(1); opacity: 0.6; }
  50% { transform: scale(1.04); opacity: 0.9; }
`;

// ===== ACTIVITY REPUTATION POINTER ANIMATIONS =====
const pointerBounce = keyframes`
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-12px) scale(1.05); }
`;


const floatUp = keyframes`
  0%, 100% { transform: translateY(0); opacity: 0.9; }
  50% { transform: translateY(-6px); opacity: 1; }
`;

const shimmerText = keyframes`
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
`;

// Resolve a chain key from a numeric chain id
const getChainKeyFromId = (chainId: number): keyof typeof CONTRACTS | null => {
  for (const [key, config] of Object.entries(CONTRACTS)) {
    if (config.chainId === chainId) {
      return key as keyof typeof CONTRACTS;
    }
  }
  return null;
};

// Resolve the Wagmi chain config object from a numeric chain id
const getChainConfigFromId = (chainId: number) => {
  switch (chainId) {
    case 1868: return soneium;
    case 57073: return ink;
    case 10: return optimism;
    case 8453: return base;
    case 130: return unichain;
    default: return soneium;
  }
};

const getUrlParam = (param: string): string | null => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
};

// Remove the chainId query param without triggering a page reload
const cleanUrl = () => {
  const url = new URL(window.location.href);
  url.searchParams.delete('chainId');
  window.history.replaceState({}, '', url.toString());
};

// Chain-specific accent colors
const getChainAccent = (chainKey: keyof typeof CONTRACTS) => {
  switch (chainKey) {
    case "soneium": 
      return { 
        primary: "#06b6d4", 
        secondary: "#0891b2", 
        gradient: "linear(90deg, #06b6d4, #3b82f6, #8b5cf6, #06b6d4)" 
      };
    case "ink": 
      return { 
        primary: "#8b5cf6", 
        secondary: "#ec4899", 
        gradient: "linear(90deg, #8b5cf6, #ec4899, #a855f7, #8b5cf6)" 
      };
    case "optimism": 
      return { 
        primary: "#ff0420", 
        secondary: "#cc031a", 
        gradient: "linear(90deg, #ff0420, #8b5cf6, #3b82f6, #ff0420)" 
      };
    case "base": 
      return { 
        primary: "#0052ff", 
        secondary: "#0040cc", 
        gradient: "linear(90deg, #0052ff, #8b5cf6, #ec4899, #0052ff)" 
      };
    case "unichain": 
      return { 
        primary: "#ff007a", 
        secondary: "#cc0062", 
        gradient: "linear(90deg, #ff007a, #8b5cf6, #3b82f6, #ff007a)" 
      };
    default: 
      return { 
        primary: "#8b5cf6", 
        secondary: "#7c3aed", 
        gradient: "linear(90deg, #8b5cf6, #ec4899, #3b82f6, #8b5cf6)" 
      };
  }
};

// ================= CHECK IF CHAIN IS SUPPORTED =================
const isChainSupported = (chainId: number): boolean => {
  return SUPPORTED_CHAIN_IDS.includes(chainId);
};

export default function App() {
  const { address, isConnected, status: accountStatus } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: switching } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const navigate = useNavigate();

  // Tools Dropdown
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const toolsRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolsRef.current && !toolsRef.current.contains(event.target as Node)) {
        setIsToolsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Track whether the initial chain requested via URL has been applied
  const hasAppliedInitialChain = useRef(false);
  const hasCleanedUrl = useRef(false);
  const isSwitchingRef = useRef(false);

  // Currently selected chain (mirrors the connected wallet's network)
  const [selectedChainKey, setSelectedChainKey] = useState<keyof typeof CONTRACTS>("soneium");

  // Chain id requested via the ?chainId= URL parameter, if any
  const requestedChainIdRef = useRef<number | null>(null);

  // INITIAL LOAD: read the requested chain id from the URL
  useEffect(() => {
    if (hasAppliedInitialChain.current) return;

    const urlChainIdParam = getUrlParam("chainId");

    if (urlChainIdParam) {
      const parsedChainId = parseInt(urlChainIdParam, 10);
      if (!isNaN(parsedChainId)) {
        const chainKey = getChainKeyFromId(parsedChainId);
        if (chainKey && CONTRACTS[chainKey]) {
          requestedChainIdRef.current = parsedChainId;
          setSelectedChainKey(chainKey);
          hasAppliedInitialChain.current = true;
        }
      }
    }
  }, []);

  // Switch the wallet's network once it's ready, if a chain was requested via URL
  useEffect(() => {
    if (!requestedChainIdRef.current || isSwitchingRef.current) return;

    const requestedChainId = requestedChainIdRef.current;

    if (isConnected && accountStatus === "connected" && chainId !== requestedChainId) {
      isSwitchingRef.current = true;
      const targetChain = getChainConfigFromId(requestedChainId);
      switchChain?.({ chainId: targetChain.id }, {
        onSuccess: () => {
          isSwitchingRef.current = false;
        },
        onError: () => {
          isSwitchingRef.current = false;
        }
      });
    }
  }, [isConnected, accountStatus, chainId, switchChain]);

  // Clean the URL once the requested chain switch has settled (or wasn't needed)
  useEffect(() => {
    if (hasCleanedUrl.current) return;

    if (!requestedChainIdRef.current) {
      hasCleanedUrl.current = true;
      return;
    }

    const requestedChainId = requestedChainIdRef.current;

    if (!isConnected) {
      const timer = setTimeout(() => {
        if (!hasCleanedUrl.current) {
          hasCleanedUrl.current = true;
          cleanUrl();
          requestedChainIdRef.current = null;
        }
      }, 500);
      return () => clearTimeout(timer);
    }

    if (chainId === requestedChainId) {
      if (!hasCleanedUrl.current) {
        hasCleanedUrl.current = true;
        cleanUrl();
        requestedChainIdRef.current = null;
      }
    } else if (!isSwitchingRef.current && chainId !== requestedChainId) {
      const timer = setTimeout(() => {
        if (!hasCleanedUrl.current) {
          hasCleanedUrl.current = true;
          cleanUrl();
          requestedChainIdRef.current = null;
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [chainId, isConnected, accountStatus]);

  // Keep selectedChainKey in sync whenever the wallet's active chain changes
  useEffect(() => {
    if (chainId) {
      const currentChain = getChainKeyFromId(chainId);
      if (currentChain && currentChain !== selectedChainKey) {
        setSelectedChainKey(currentChain);
      }
    }
  }, [chainId]);

  useEffect(() => {
    if (!hasAppliedInitialChain.current) return;

    if (chainId) {
      const currentChain = getChainKeyFromId(chainId);
      if (currentChain && currentChain !== selectedChainKey) {
        setSelectedChainKey(currentChain);
      }
    }
  }, [chainId, selectedChainKey]);

  // === Target chain ===
  const targetChain = useMemo(() => {
    switch (selectedChainKey) {
      case "ink": return ink;
      case "optimism": return optimism;
      case "base": return base;
      case "unichain": return unichain;
      default: return soneium;
    }
  }, [selectedChainKey]);

  const targetChainId = targetChain.id;
  const currentChainName = targetChain.name || "Soneium";
  const chainAccent = getChainAccent(selectedChainKey);

  const isCorrectChain = chainId === targetChainId;
  const isSupportedChain = isChainSupported(chainId);

  // Check if connected but on unsupported chain
  const isUnsupportedChain = isConnected && !isSupportedChain && chainId !== undefined;

  const { identityRegistry: currentIdentityRegistry, dailyGM: currentDailyGM } = CONTRACTS[selectedChainKey];

  const safeAddress = address ?? undefined;
  const enabled = !!safeAddress && isConnected && isCorrectChain;

  const [isTxPending, setIsTxPending] = useState(false);
  const [hoverEffect, setHoverEffect] = useState<string | null>(null);

  // ================= READ CONTRACTS =================
  const { data: isRegistered = false, refetch: refetchRegistered, isLoading: loadingRegistered } = useReadContract({
    address: currentIdentityRegistry,
    abi: IdentityRegistryABI,
    functionName: "isAgent",
    args: safeAddress ? [safeAddress] : undefined,
    query: { enabled },
  });

  const { data: agentId = 0n, refetch: refetchAgentId } = useReadContract({
    address: currentIdentityRegistry,
    abi: IdentityRegistryABI,
    functionName: "getAgentId",
    args: safeAddress ? [safeAddress] : undefined,
    query: { enabled },
  });

  const { data: lastGMTime = 0n, refetch: refetchLastGM } = useReadContract({
    address: currentDailyGM,
    abi: DailyAgentABI,
    functionName: "lastGM",
    args: safeAddress ? [safeAddress] : undefined,
    query: { enabled: enabled && isRegistered },
  });

  const { data: totalAgents = 0n, refetch: refetchTotalAgents } = useReadContract({
    address: currentIdentityRegistry,
    abi: IdentityRegistryABI,
    functionName: "totalSupply",
    query: { enabled: isCorrectChain },
  });

  const { data: totalGM = 0n, refetch: refetchTotalGM } = useReadContract({
    address: currentDailyGM,
    abi: DailyAgentABI,
    functionName: "totalGM",
    query: { enabled: isCorrectChain },
  });

  const { data: userStreak = 0n, refetch: refetchUserStreak } = useReadContract({
    address: currentDailyGM,
    abi: DailyAgentABI,
    functionName: "totalUserGM",
    args: safeAddress ? [safeAddress] : undefined,
    query: { enabled: enabled && isRegistered },
  });

  const { data: registerConfig } = useReadContract({
    address: currentIdentityRegistry,
    abi: IdentityRegistryABI,
    functionName: "getConfig",
    query: { enabled: isCorrectChain },
  });

  const registrationFee = registerConfig ? (registerConfig as [bigint, `0x${string}`])[0] : 0n;

  const { data: gmFeeAmount = 0n } = useReadContract({
    address: currentDailyGM,
    abi: DailyAgentABI,
    functionName: "gmFee",
    query: { enabled: isCorrectChain && isRegistered },
  });

  // ================= COUNTDOWN TIMER =================
  const [timeLeft, setTimeLeft] = useState("–");
  const [cooldownReady, setCooldownReady] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);

  useEffect(() => {
    if (!enabled || !isRegistered) {
      setTimeLeft("–");
      setCooldownReady(false);
      setProgressPercent(0);
      return;
    }

    const updateTimer = () => {
      const now = Math.floor(Date.now() / 1000);
      const lastGM = Number(lastGMTime);
      const diff = lastGM + COOLDOWN_SECONDS - now;

      const elapsed = now - lastGM;
      const progress = Math.min(100, Math.max(0, (elapsed / COOLDOWN_SECONDS) * 100));
      setProgressPercent(progress);

      if (diff <= 0) {
        setCooldownReady(true);
        setTimeLeft("Ready!");
      } else {
        setCooldownReady(false);
        const h = Math.floor(diff / 3600);
        const m = Math.floor((diff % 3600) / 60);
        const s = diff % 60;

        if (h > 0) {
          setTimeLeft(`${h}h ${m}m ${s}s`);
        } else if (m > 0) {
          setTimeLeft(`${m}m ${s}s`);
        } else {
          setTimeLeft(`${s}s`);
        }
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [lastGMTime, enabled, isRegistered]);

  const canSendGM = isRegistered && cooldownReady;

  // ================= TRANSACTIONS =================
  const [txOpen, setTxOpen] = useState(false);
  const [txStatus, setTxStatus] = useState<"idle" | "wallet" | "pending" | "success" | "rejected" | "failed">("idle");
  const [txTitle, setTxTitle] = useState("");
  const [txDesc, setTxDesc] = useState("");

  const handleAction = async (type: "register" | "gm") => {
    if (isTxPending) return;

    setIsTxPending(true);
    setTxOpen(true);
    setTxStatus("wallet");
    setTxTitle(type === "register" ? "Confirm registration" : "Confirm GM");
    setTxDesc(type === "register" ? `Registering as an ERC-8004 Agent on ${currentChainName}…` : `Sending today's GM on ${currentChainName}…`);

    try {
      let hash: `0x${string}`;

      if (type === "register") {
        hash = await writeContractAsync({
          address: currentIdentityRegistry,
          abi: IdentityRegistryABI,
          functionName: "register",
          args: [FIXED_AGENT_URI],
          value: registrationFee > 0 ? registrationFee : undefined,
        });
      } else {
        hash = await writeContractAsync({
          address: currentDailyGM,
          abi: DailyAgentABI,
          functionName: "gm",
          value: gmFeeAmount > 0 ? gmFeeAmount : undefined,
        });
      }

      setTxStatus("pending");
      setTxTitle("Transaction sent");
      setTxDesc("Waiting for on-chain confirmation…");

      const receipt = await publicClient!.waitForTransactionReceipt({ hash });

      if (receipt.status === "success") {
        setTxStatus("success");
        setTxTitle(type === "register" ? "Registration complete" : "GM sent");
        setTxDesc(type === "register" ? "You're now a registered ERC-8004 Agent." : "Your daily on-chain activity has been recorded.");

        // Chain-specific confetti colors
        const colors = selectedChainKey === "soneium"
          ? ['#06b6d4', '#3b82f6', '#8b5cf6', '#22c55e']
          : selectedChainKey === "ink"
          ? ['#8b5cf6', '#ec4899', '#a855f7', '#22c55e']
          : ['#8b5cf6', '#ec4899', '#3b82f6', '#22c55e'];

        confetti({
          particleCount: type === "register" ? 300 : 180,
          spread: 100,
          origin: { y: 0.6 },
          startVelocity: 25,
          colors,
        });

        await Promise.all([
          refetchRegistered(),
          refetchAgentId(),
          refetchLastGM(),
          refetchUserStreak(),
          refetchTotalAgents(),
          refetchTotalGM(),
        ]);
      } else {
        throw new Error("Transaction reverted on chain");
      }
    } catch (err: any) {
      console.error("Transaction error:", err);
      const rejected = err?.message?.includes("rejected") ||
                      err?.shortMessage?.includes("rejected") ||
                      err?.code === 4001;

      if (rejected) {
        setTxStatus("rejected");
        setTxTitle("Transaction cancelled");
        setTxDesc("You cancelled the transaction in your wallet.");
      } else {
        setTxStatus("failed");
        setTxTitle("Transaction failed");
        setTxDesc(err?.message || "Something went wrong. Please try again.");
      }
    } finally {
      setIsTxPending(false);
    }
  };

  // ================= PRIMARY BUTTON STATE =================
  let mainButtonLabel = "Connect wallet";
  let mainActionType: "register" | "gm" | null = null;
  let isMainDisabled = true;
  let buttonGradient = "linear(135deg, #8b5cf6, #ec4899)";

  if (isConnected) {
    if (isUnsupportedChain) {
      mainButtonLabel = "Switch to Soneium";
      isMainDisabled = false;
      buttonGradient = "linear(135deg, #06b6d4, #3b82f6)";
    } else if (!isCorrectChain) {
      mainButtonLabel = `Switch to ${currentChainName}`;
      isMainDisabled = false;
      buttonGradient = "linear(135deg, #3b82f6, #8b5cf6)";
    } else if (!isRegistered) {
      mainButtonLabel = "Register as Agent";
      mainActionType = "register";
      isMainDisabled = false;
      buttonGradient = `linear(135deg, ${chainAccent.primary}, ${chainAccent.secondary})`;
    } else if (canSendGM) {
      mainButtonLabel = "Send GM";
      mainActionType = "gm";
      isMainDisabled = false;
      buttonGradient = "linear(135deg, #22c55e, #16a34a)";
    } else {
      mainButtonLabel = "Cooldown active";
      isMainDisabled = true;
      buttonGradient = "linear(135deg, #475569, #334155)";
    }
  }

  // ===== State for Activity Reputation pointer visibility =====
  const [showActivityPointer, setShowActivityPointer] = useState(true);

  // Hide the pointer after 25 seconds or on click
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowActivityPointer(false);
    }, 25000);

    const handleClick = () => {
      setShowActivityPointer(false);
    };

    document.addEventListener('click', handleClick);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleClick);
    };
  }, []);

  // ===== Switch to Soneium =====
  const handleSwitchToSoneium = () => {
    switchChain?.({ chainId: DEFAULT_SWITCH_CHAIN });
  };

  return (
    <Box
      minH="100vh"
      position="relative"
      bg="#080812"
      overflowX="hidden"
    >
      {/* Ambient texture — grid instead of floating orbs */}
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        opacity={0.04}
        pointerEvents="none"
        zIndex={0}
        bgImage="url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MCIgaGVpZ2h0PSI4MCI+PHBhdGggZD0iTTQwIDQwIG0tMjUgMCBhIDI1IDI1IDAgMSAwIDUwIDAgYSAyNSAyNSAwIDEgMC01MCAwIiBzdHJva2U9IiM4YjVjZjYiIGZpbGw9Im5vbmUiIG9wYWNpdHk9IjAuMTUiLz48L3N2Zz4=')"
        bgRepeat="repeat"
      />

      {/* Subtle gradient wash — one source, not multiple floating orbs */}
      <Box
        position="fixed"
        top="-20%"
        right="-10%"
        w="800px"
        h="800px"
        borderRadius="full"
        bg={`radial-gradient(circle, ${chainAccent.primary}15 0%, transparent 70%)`}
        filter="blur(120px)"
        zIndex={0}
        pointerEvents="none"
        transition="all 1s ease"
      />

      <Container maxW="1400px" position="relative" zIndex={1} px={{ base: 4, md: 6, lg: 8 }} py={{ base: 5, md: 8 }}>
        {/* HEADER */}
        <Flex justify="space-between" align="center" mb={{ base: 8, md: 12 }} direction={{ base: "column", md: "row" }} gap={{ base: 5, md: 0 }}>
          <VStack align={{ base: "center", md: "start" }} spacing={2} animation={`${slideInLeft} 0.6s ease-out`}>
            <HStack spacing={3}>
              <Box
                w="10px"
                h="10px"
                borderRadius="full"
                bg={chainAccent.primary}
                animation={`${pulseGlow} 2s ease-in-out infinite`}
              />
              <Heading
                fontSize={{ base: "2xl", md: "3xl", lg: "4xl" }}
                fontWeight="800"
                bgGradient={`linear(135deg, ${chainAccent.primary} 0%, #ec4899 40%, #3b82f6 100%)`}
                bgClip="text"
                letterSpacing="tight"
                _hover={{ filter: "brightness(1.1)" }}
                transition="filter 0.3s"
              >
                Agent GM Protocol
              </Heading>
            </HStack>
            <HStack spacing={2} pl={{ base: 0, md: "37px" }}>
              <Box as="span" fontSize="10px" color={chainAccent.primary}>●</Box>
              <Text color="gray.400" fontSize="sm" letterSpacing="wide" fontFamily="mono">
                ERC-8004 · {currentChainName}
              </Text>
              <Box
                w="4px"
                h="4px"
                borderRadius="full"
                bg="#22c55e"
                display="inline-block"
                animation={`${pulseGreen} 2s ease-in-out infinite`}
                mx={1}
              />
              <Text color="gray.500" fontSize="xs" fontFamily="mono">
                Live
              </Text>
            </HStack>
          </VStack>

          {/* Desktop: actions aligned right */}
          <HStack
            spacing={4}
            display={{ base: "none", md: "flex" }}
            animation={`${slideInRight} 0.6s ease-out`}
            position="relative"
            alignItems="center"
          >
            {/* TOOLS DROPDOWN - Desktop */}
            <Box ref={toolsRef} position="relative">
              <Button
                onClick={() => setIsToolsOpen(!isToolsOpen)}
                bg="white"
                color="gray.800"
                size="sm"
                borderRadius="full"
                px={4}
                py={1.5}
                h="40px"
                fontWeight="700"
                letterSpacing="0.01em"
                fontSize="sm"
                border="1px solid rgba(0,0,0,0.08)"
                boxShadow="0 2px 8px rgba(0,0,0,0.06)"
                _hover={{
                  bg: "gray.50",
                  transform: "translateY(-2px) scale(1.02)",
                  boxShadow: "0 8px 25px rgba(0,0,0,0.12)",
                  borderColor: "rgba(59,130,246,0.3)",
                }}
                _active={{
                  transform: "translateY(0px) scale(0.98)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                }}
                transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                rightIcon={
                  <ChevronDownIcon
                    boxSize={4}
                    transition="transform 0.3s"
                    transform={isToolsOpen ? "rotate(180deg)" : "rotate(0deg)"}
                  />
                }
              >
                <Text as="span" mr={1}>🛠️</Text>
                Tools
              </Button>

              {/* Dropdown Menu - Desktop */}
              {isToolsOpen && (
                <Box
                  position="absolute"
                  top="calc(100% + 8px)"
                  right="-50px"
                  bg="white"
                  borderRadius="2xl"
                  boxShadow="0 20px 60px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)"
                  minW="220px"
                  overflow="hidden"
                  zIndex={100}
                >
                  <VStack spacing={0} align="stretch">
                    <Button
                      onClick={() => {
                        navigate("/agent-reputation");
                        setIsToolsOpen(false);
                      }}
                      variant="ghost"
                      justifyContent="flex-start"
                      borderRadius="0"
                      px={4}
                      py={3}
                      h="44px"
                      fontWeight="600"
                      fontSize="sm"
                      color="gray.700"
                      _hover={{ bg: "rgba(139,92,246,0.06)", color: "#8b5cf6" }}
                      transition="all 0.2s"
                      leftIcon={<Text fontSize="16px">💿</Text>}
                    >
                      Score 12 Agent Badge
                    </Button>
                    <Box h="1px" bg="gray.100" />
                    <Button
                      onClick={() => {
                        navigate("/pulse-cards");
                        setIsToolsOpen(false);
                      }}
                      variant="ghost"
                      justifyContent="flex-start"
                      borderRadius="0"
                      px={4}
                      py={3}
                      h="44px"
                      fontWeight="600"
                      fontSize="sm"
                      color="gray.700"
                      _hover={{ bg: "rgba(168,85,247,0.06)", color: "#a855f7" }}
                      transition="all 0.2s"
                      leftIcon={<Text fontSize="16px">💿</Text>}
                    >
                      Score 10 · Pulse Cards
                    </Button>
                    <Box h="1px" bg="gray.100" />
                    <Button
                      onClick={() => {
                        navigate("/gmorning");
                        setIsToolsOpen(false);
                      }}
                      variant="ghost"
                      justifyContent="flex-start"
                      borderRadius="0"
                      px={4}
                      py={3}
                      h="44px"
                      fontWeight="600"
                      fontSize="sm"
                      color="gray.700"
                      _hover={{ bg: "rgba(45,212,191,0.06)", color: "#2dd4bf" }}
                      transition="all 0.2s"
                      leftIcon={<Text fontSize="16px">🌅</Text>}
                    >
                      GMorning · GM & Deploy
                    </Button>
                    <Box h="1px" bg="gray.100" />
                    <Button
                      onClick={() => {
                        navigate("/bridge");
                        setIsToolsOpen(false);
                      }}
                      variant="ghost"
                      justifyContent="flex-start"
                      borderRadius="0"
                      px={4}
                      py={3}
                      h="44px"
                      fontWeight="600"
                      fontSize="sm"
                      color="gray.700"
                      _hover={{ bg: "rgba(59,130,246,0.06)", color: "#3b82f6" }}
                      transition="all 0.2s"
                      leftIcon={<Text fontSize="16px">🌉</Text>}
                    >
                      Cross-Chain Bridge
                    </Button>
                    <Box h="1px" bg="gray.100" />
                    <Button
                      as="a"
                      href="https://docs.gm-agent.xyz"
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="ghost"
                      justifyContent="flex-start"
                      borderRadius="0"
                      px={4}
                      py={3}
                      h="44px"
                      fontWeight="600"
                      fontSize="sm"
                      color="gray.700"
                      _hover={{ bg: "rgba(59,130,246,0.06)", color: "#3b82f6" }}
                      transition="all 0.2s"
                      leftIcon={<Text fontSize="16px">📚</Text>}
                      onClick={() => setIsToolsOpen(false)}
                    >
                      Docs
                    </Button>
                  </VStack>
                </Box>
              )}
            </Box>

            {/* ===== ACTIVITY REPUTATION BUTTON ===== */}
            <Box position="relative" display="inline-block">
              <Tooltip
                label="Complete activities to boost your reputation score"
                hasArrow
                placement="bottom"
                bg="rgba(0,0,0,0.85)"
                color="white"
                fontSize="xs"
                fontWeight="normal"
                px={4}
                py={2.5}
                borderRadius="lg"
                border="1px solid rgba(59,130,246,0.3)"
                boxShadow="0 0 30px rgba(0,0,0,0.5)"
              >
                <Button
                  onClick={() => navigate("/activity-reputation")}
                  bg="white"
                  color="gray.800"
                  size="sm"
                  borderRadius="full"
                  px={4}
                  py={1.5}
                  h="40px"
                  fontWeight="700"
                  letterSpacing="0.01em"
                  fontSize="sm"
                  border="1px solid rgba(0,0,0,0.08)"
                  boxShadow="0 2px 8px rgba(0,0,0,0.06)"
                  _hover={{
                    bg: "gray.50",
                    transform: "translateY(-2px) scale(1.02)",
                    boxShadow: "0 8px 25px rgba(0,0,0,0.12)",
                    borderColor: "rgba(59,130,246,0.3)",
                  }}
                  _active={{
                    transform: "translateY(0px) scale(0.98)",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                  }}
                  transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                  leftIcon={
                    <Box as="span" fontSize="14px">
                      🏆
                    </Box>
                  }
                  rightIcon={
                    <Box
                      as="span"
                      fontSize="12px"
                      transition="transform 0.3s"
                      _groupHover={{ transform: "translateX(3px)" }}
                    >
                      →
                    </Box>
                  }
                >
                  Activity Reputation
                </Button>
              </Tooltip>

              {/* ===== ANIMATED POINTER - SUB BUTON, ARATĂ ÎN SUS ===== */}
              {showActivityPointer && (
                <Box
                  position="absolute"
                  bottom="-180px"
                  left="50%"
                  transform="translateX(-50%)"
                  zIndex={50}
                  pointerEvents="none"
                >
                  <Box
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    animation={`${pointerBounce} 2.2s ease-in-out infinite`}
                  >
                    {/* Inele pulsante - SUB buton */}
                    <Box position="relative" width="50px" height="50px" mb="-8px">
                      <svg width="50" height="50" viewBox="0 0 50 50" style={{ position: 'absolute', top: 0, left: 0 }}>
                        <circle cx="25" cy="25" r="12" fill="none" stroke="rgba(251, 191, 36, 0.5)" strokeWidth="2.5">
                          <animate
                            attributeName="r"
                            from="12"
                            to="35"
                            dur="2s"
                            repeatCount="indefinite"
                          />
                          <animate
                            attributeName="opacity"
                            from="0.8"
                            to="0"
                            dur="2s"
                            repeatCount="indefinite"
                          />
                        </circle>
                        <circle cx="25" cy="25" r="12" fill="none" stroke="rgba(251, 191, 36, 0.3)" strokeWidth="2">
                          <animate
                            attributeName="r"
                            from="12"
                            to="30"
                            dur="2.5s"
                            begin="0.5s"
                            repeatCount="indefinite"
                          />
                          <animate
                            attributeName="opacity"
                            from="0.6"
                            to="0"
                            dur="2.5s"
                            begin="0.5s"
                            repeatCount="indefinite"
                          />
                        </circle>
                      </svg>
                      
                      {/* Deget arătând în SUS spre buton */}
                      <Box
                        position="absolute"
                        top="50%"
                        left="50%"
                        transform="translate(-50%, -50%)"
                        fontSize="28px"
                        lineHeight="1"
                        filter="drop-shadow(0 4px 15px rgba(251, 191, 36, 0.5))"
                        sx={{
                          textShadow: "0 0 20px rgba(251, 191, 36, 0.4)"
                        }}
                      >
                        ☝️
                      </Box>
                    </Box>

                    {/* Balon de text sub deget */}
                    <Box
                      bg="rgba(0, 0, 0, 0.88)"
                      backdropFilter="blur(16px)"
                      borderRadius="2xl"
                      px={5}
                      py={3}
                      border="1px solid rgba(251, 191, 36, 0.2)"
                      boxShadow="0 0 40px rgba(251, 191, 36, 0.08), inset 0 0 40px rgba(251, 191, 36, 0.02)"
                      maxW="280px"
                      animation={`${floatUp} 3s ease-in-out infinite`}
                      position="relative"
                      mt="2px"
                    >
                      {/* Triunghi mic care arată în sus spre deget */}
                      <Box
                        position="absolute"
                        top="-8px"
                        left="50%"
                        transform="translateX(-50%)"
                        width="0"
                        height="0"
                        borderLeft="8px solid transparent"
                        borderRight="8px solid transparent"
                        borderBottom="8px solid rgba(0, 0, 0, 0.88)"
                      />
                      
                      <VStack spacing={1} align="center">
                        <HStack spacing={2}>
                          <Text fontSize="14px">⭐</Text>
                          <Text
                            fontSize="11px"
                            fontWeight="800"
                            bgGradient="linear(135deg, #fbbf24, #f59e0b, #fbbf24)"
                            bgClip="text"
                            textTransform="uppercase"
                            letterSpacing="0.08em"
                            backgroundSize="200% auto"
                            animation={`${shimmerText} 3s linear infinite`}
                          >
                            Season 12 Score
                          </Text>
                          <Badge
                            bg="rgba(251, 191, 36, 0.15)"
                            color="#fbbf24"
                            fontSize="8px"
                            px={2}
                            py={0.5}
                            borderRadius="full"
                            border="1px solid rgba(251, 191, 36, 0.2)"
                          >
                            Soneium
                          </Badge>
                        </HStack>
                        <Text fontSize="11px" color="gray.300" fontWeight="400" lineHeight="1.4" textAlign="center">
                          Complete tasks to earn points &amp; badges
                        </Text>
                        <Text
                          fontSize="9px"
                          color="#fbbf24"
                          fontWeight="600"
                          letterSpacing="0.05em"
                          opacity={0.8}
                          mt="2px"
                        >
                          ☝️ Click the button above
                        </Text>
                      </VStack>
                    </Box>
                  </Box>
                </Box>
              )}
            </Box>

            <Box transition="transform 0.3s" _hover={{ transform: "scale(1.02)" }}>
              <ConnectButton
                chainStatus="full"
                accountStatus="full"
                showBalance={false}
              />
            </Box>
          </HStack>

          {/* Mobile: stacked, connect button first */}
          <VStack
            spacing={3}
            display={{ base: "flex", md: "none" }}
            width="full"
            animation={`${slideInRight} 0.6s ease-out`}
          >
            <Box
              transition="transform 0.3s"
              _hover={{ transform: "scale(1.02)" }}
              width="full"
              display="flex"
              justifyContent="center"
            >
              <ConnectButton
                chainStatus="full"
                accountStatus="full"
                showBalance={false}
              />
            </Box>

            <HStack spacing={2} width="full" justify="center" flexWrap="wrap" position="relative">
              {/* TOOLS DROPDOWN - Mobile */}
              <Box position="relative" zIndex={999}>
                <Button
                  onClick={() => setIsToolsOpen(!isToolsOpen)}
                  bg="white"
                  color="gray.800"
                  size="md"
                  borderRadius="full"
                  px={5}
                  h="46px"
                  fontWeight="700"
                  letterSpacing="0.01em"
                  fontSize="sm"
                  border="1px solid rgba(0,0,0,0.08)"
                  boxShadow="0 2px 8px rgba(0,0,0,0.06)"
                  _hover={{
                    bg: "gray.50",
                    transform: "translateY(-2px) scale(1.02)",
                    boxShadow: "0 8px 25px rgba(0,0,0,0.12)",
                    borderColor: "rgba(59,130,246,0.3)",
                  }}
                  _active={{
                    transform: "translateY(0px) scale(0.98)",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                  }}
                  transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                  rightIcon={
                    <ChevronDownIcon
                      boxSize={4}
                      transition="transform 0.3s"
                      transform={isToolsOpen ? "rotate(180deg)" : "rotate(0deg)"}
                    />
                  }
                >
                  <Text as="span" mr={1}>🛠️</Text>
                  Tools
                </Button>

                {/* Dropdown Menu - Mobile */}
                {isToolsOpen && (
                  <Box
                    position="absolute"
                    top="calc(100% + 8px)"
                    right="-10"
                    bg="white"
                    borderRadius="2xl"
                    boxShadow="0 20px 60px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.05)"
                    minW="220px"
                    overflow="hidden"
                    zIndex={1000}
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <VStack spacing={0} align="stretch">
                      <Button
                        onClick={() => {
                          setIsToolsOpen(false);
                          navigate("/agent-reputation");
                        }}
                        onTouchStart={() => {
                          setTimeout(() => {
                            setIsToolsOpen(false);
                            navigate("/agent-reputation");
                          }, 50);
                        }}
                        variant="ghost"
                        justifyContent="flex-start"
                        borderRadius="0"
                        px={4}
                        py={3.5}
                        h="48px"
                        fontWeight="600"
                        fontSize="sm"
                        color="gray.700"
                        _hover={{ bg: "rgba(139,92,246,0.08)", color: "#8b5cf6" }}
                        _active={{ bg: "rgba(139,92,246,0.12)" }}
                        leftIcon={<Text fontSize="16px">💿</Text>}
                        width="100%"
                        _focus={{ bg: "rgba(139,92,246,0.12)" }}
                      >
                        Score 12 · Agent Badge
                      </Button>
                      <Box h="1px" bg="gray.100" />
                      <Button
                        onClick={() => {
                          setIsToolsOpen(false);
                          navigate("/pulse-cards");
                        }}
                        onTouchStart={() => {
                          setTimeout(() => {
                            setIsToolsOpen(false);
                            navigate("/pulse-cards");
                          }, 50);
                        }}
                        variant="ghost"
                        justifyContent="flex-start"
                        borderRadius="0"
                        px={4}
                        py={3.5}
                        h="48px"
                        fontWeight="600"
                        fontSize="sm"
                        color="gray.700"
                        _hover={{ bg: "rgba(168,85,247,0.08)", color: "#a855f7" }}
                        _active={{ bg: "rgba(168,85,247,0.12)" }}
                        leftIcon={<Text fontSize="16px">💿</Text>}
                        width="100%"
                        _focus={{ bg: "rgba(168,85,247,0.12)" }}
                      >
                        Score 10 · Pulse Cards
                      </Button>
                      <Box h="1px" bg="gray.100" />
                      <Button
                        onClick={() => {
                          setIsToolsOpen(false);
                          navigate("/gmorning");
                        }}
                        onTouchStart={() => {
                          setTimeout(() => {
                            setIsToolsOpen(false);
                            navigate("/gmorning");
                          }, 50);
                        }}
                        variant="ghost"
                        justifyContent="flex-start"
                        borderRadius="0"
                        px={4}
                        py={3.5}
                        h="48px"
                        fontWeight="600"
                        fontSize="sm"
                        color="gray.700"
                        _hover={{ bg: "rgba(45,212,191,0.08)", color: "#2dd4bf" }}
                        _active={{ bg: "rgba(45,212,191,0.12)" }}
                        leftIcon={<Text fontSize="16px">🌅</Text>}
                        width="100%"
                        _focus={{ bg: "rgba(45,212,191,0.12)" }}
                      >
                        GMorning · GM & Deploy
                      </Button>
                      <Box h="1px" bg="gray.100" />
                      <Button
                        onClick={() => {
                          setIsToolsOpen(false);
                          navigate("/bridge");
                        }}
                        onTouchStart={() => {
                          setTimeout(() => {
                            setIsToolsOpen(false);
                            navigate("/bridge");
                          }, 50);
                        }}
                        variant="ghost"
                        justifyContent="flex-start"
                        borderRadius="0"
                        px={4}
                        py={3.5}
                        h="48px"
                        fontWeight="600"
                        fontSize="sm"
                        color="gray.700"
                        _hover={{ bg: "rgba(59,130,246,0.08)", color: "#3b82f6" }}
                        _active={{ bg: "rgba(59,130,246,0.12)" }}
                        leftIcon={<Text fontSize="16px">🌉</Text>}
                        width="100%"
                        _focus={{ bg: "rgba(59,130,246,0.12)" }}
                      >
                        Cross-Chain Bridge
                      </Button>
                      <Box h="1px" bg="gray.100" />
                      <Button
                        onClick={() => {
                          setIsToolsOpen(false);
                          navigate("/docs");
                        }}
                        onTouchStart={() => {
                          setTimeout(() => {
                            setIsToolsOpen(false);
                            navigate("/docs");
                          }, 50);
                        }}
                        variant="ghost"
                        justifyContent="flex-start"
                        borderRadius="0"
                        px={4}
                        py={3.5}
                        h="48px"
                        fontWeight="600"
                        fontSize="sm"
                        color="gray.700"
                        _hover={{ bg: "rgba(59,130,246,0.08)", color: "#3b82f6" }}
                        _active={{ bg: "rgba(59,130,246,0.12)" }}
                        leftIcon={<Text fontSize="16px">📚</Text>}
                        width="100%"
                        _focus={{ bg: "rgba(59,130,246,0.12)" }}
                      >
                        Docs
                      </Button>
                    </VStack>
                  </Box>
                )}
              </Box>

              {/* ===== MOBILE: Activity Reputation Button ===== */}
              <Box position="relative" display="inline-block">
                <Tooltip
                  label="Complete activities to boost your reputation score"
                  hasArrow
                  placement="top"
                  bg="rgba(0,0,0,0.85)"
                  color="white"
                  fontSize="xs"
                  fontWeight="normal"
                  px={4}
                  py={2.5}
                  borderRadius="lg"
                  border="1px solid rgba(59,130,246,0.3)"
                >
                  <Button
                    onClick={() => navigate("/activity-reputation")}
                    bg="white"
                    color="gray.800"
                    size="md"
                    borderRadius="full"
                    px={6}
                    h="46px"
                    fontWeight="700"
                    letterSpacing="0.01em"
                    fontSize="sm"
                    border="1px solid rgba(0,0,0,0.08)"
                    boxShadow="0 2px 8px rgba(0,0,0,0.06)"
                    _hover={{
                      bg: "gray.50",
                      transform: "translateY(-2px) scale(1.02)",
                      boxShadow: "0 8px 25px rgba(0,0,0,0.12)",
                      borderColor: "rgba(59,130,246,0.3)",
                    }}
                    _active={{
                      transform: "translateY(0px) scale(0.98)",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                    }}
                    transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                    leftIcon={<Box as="span" fontSize="14px">🏆</Box>}
                  >
                    Activity
                  </Button>
                </Tooltip>

                {/* ===== MOBILE ANIMATED POINTER - SUB BUTON ===== */}
                {showActivityPointer && (
                  <Box
                    position="absolute"
                    bottom="-100px"
                    left="75%"
                    transform="translateX(-50%)"
                    zIndex={50}
                    pointerEvents="none"
                  >
                    <Box
                      display="flex"
                      flexDirection="column"
                      alignItems="center"
                      animation={`${pointerBounce} 2.2s ease-in-out infinite`}
                    >
                      <Box position="relative" width="35px" height="35px" mb="-5px">
                        <svg width="35" height="35" viewBox="0 0 35 35" style={{ position: 'absolute', top: 0, left: 0 }}>
                          <circle cx="17.5" cy="17.5" r="9" fill="none" stroke="rgba(251, 191, 36, 0.4)" strokeWidth="2">
                            <animate attributeName="r" from="9" to="25" dur="2s" repeatCount="indefinite" />
                            <animate attributeName="opacity" from="0.7" to="0" dur="2s" repeatCount="indefinite" />
                          </circle>
                        </svg>
                        <Box
                          position="absolute"
                          top="50%"
                          left="50%"
                          transform="translate(-50%, -50%)"
                          fontSize="20px"
                          lineHeight="1"
                          filter="drop-shadow(0 3px 10px rgba(251, 191, 36, 0.4))"
                        >
                          ☝️
                        </Box>
                      </Box>

                      <Box
                        bg="rgba(0, 0, 0, 0.88)"
                        backdropFilter="blur(16px)"
                        borderRadius="xl"
                        px={3}
                        py={2}
                        border="1px solid rgba(251, 191, 36, 0.15)"
                        boxShadow="0 0 20px rgba(251, 191, 36, 0.06)"
                        maxW="180px"
                        animation={`${floatUp} 3s ease-in-out infinite`}
                        mt="2px"
                      >
                        <VStack spacing={0.5} align="center">
                          <HStack spacing={1.5}>
                            <Text fontSize="10px">⭐</Text>
                            <Text
                              fontSize="8px"
                              fontWeight="800"
                              bgGradient="linear(135deg, #fbbf24, #f59e0b)"
                              bgClip="text"
                              textTransform="uppercase"
                              letterSpacing="0.06em"
                            >
                              Season 12
                            </Text>
                            <Badge
                              bg="rgba(251, 191, 36, 0.12)"
                              color="#fbbf24"
                              fontSize="6px"
                              px={1.5}
                              py={0.5}
                              borderRadius="full"
                            >
                              Soneium
                            </Badge>
                          </HStack>
                          <Text fontSize="8px" color="gray.300" lineHeight="1.2" textAlign="center">
                            Tasks → Points &amp; Badges
                          </Text>
                          <Text fontSize="7px" color="#fbbf24" fontWeight="600" opacity={0.7}>
                            ☝️ Tap above
                          </Text>
                        </VStack>
                      </Box>
                    </Box>
                  </Box>
                )}
              </Box>
            </HStack>
          </VStack>
        </Flex>

        {/* ===== UNSUPPORTED CHAIN WARNING ===== */}
        {isUnsupportedChain && (
          <Alert
            status="warning"
            borderRadius="2xl"
            mb={8}
            bg="rgba(239,68,68,0.08)"
            border="1px solid rgba(239,68,68,0.2)"
            backdropFilter="blur(10px)"
            px={6}
            py={4}
          >
            <AlertIcon color="#f87171" />
            <AlertDescription>
              <Text color="white" fontWeight="600" fontSize="sm">
                ⚠️ Unsupported Network
              </Text>
              <Text color="gray.400" fontSize="sm">
                The Agent GM Protocol is currently deployed on <Text as="span" fontWeight="600" color="#fbbf24">Soneium</Text>,{' '}
                <Text as="span" fontWeight="600" color="#fbbf24">Ink</Text>,{' '}
                <Text as="span" fontWeight="600" color="#fbbf24">Optimism</Text>,{' '}
                <Text as="span" fontWeight="600" color="#fbbf24">Base</Text>, and{' '}
                <Text as="span" fontWeight="600" color="#fbbf24">Unichain</Text>.
                Please switch to one of the supported networks to interact with the protocol.
              </Text>
            </AlertDescription>
          </Alert>
        )}

        {/* HERO — cleaner, more direct */}
        <VStack spacing={4} textAlign="center" mb={12} animation={`${slideUp} 0.8s ease-out`}>
          <HStack spacing={3} wrap="wrap" justify="center">
            <Badge
              bgGradient={`linear(135deg, ${chainAccent.primary}, ${chainAccent.secondary})`}
              px={5}
              py={2.5}
              rounded="full"
              color="white"
              fontSize="sm"
              fontWeight="600"
              letterSpacing="wide"
              boxShadow={`0 0 30px ${chainAccent.primary}40`}
              animation={`${glowPulse} 3s ease-in-out infinite`}
            >
              {isUnsupportedChain ? "⚠️ Unsupported" : `${currentChainName} · Live`}
            </Badge>
          </HStack>

          <Heading
            fontSize={{ base: "3xl", md: "5xl", lg: "6xl" }}
            fontWeight="800"
            bgGradient={`linear(135deg, #ffffff 0%, ${chainAccent.primary} 40%, #a855f7 100%)`}
            bgClip="text"
            lineHeight="1.2"
            maxW="1000px"
            mx="auto"
            letterSpacing="-0.02em"
          >
            Prove your daily on-chain activity
          </Heading>

          <Text
            fontSize={{ base: "sm", md: "lg" }}
            color="gray.400"
            maxW="650px"
            mx="auto"
            lineHeight="1.7"
            px={{ base: 4, md: 0 }}
          >
            Register once as an ERC-8004 Agent, then check in daily. Every GM builds your
            verifiable on-chain reputation — no exceptions.
          </Text>
        </VStack>

        {/* MAIN CARD GRID */}
        <Grid
          templateColumns={{ base: "1fr", lg: "1.2fr 0.8fr" }}
          gap={{ base: 6, lg: 8 }}
          alignItems="start"
          w="full"
        >
          {/* Status Card */}
          <GridItem animation={`${slideInLeft} 0.7s ease-out 0.1s both`}>
            <Box
              bg="rgba(8, 8, 18, 0.85)"
              backdropFilter="blur(20px)"
              borderRadius={{ base: "2xl", md: "3xl" }}
              border="1px solid"
              borderColor={isUnsupportedChain ? "rgba(239,68,68,0.3)" : `${chainAccent.primary}40`}
              overflow="hidden"
              transition="all 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
              w="full"
              _hover={{
                borderColor: isUnsupportedChain ? "rgba(239,68,68,0.5)" : `${chainAccent.primary}80`,
                transform: { base: "none", md: "translateY(-4px)" },
                boxShadow: isUnsupportedChain ? "0 0 30px rgba(239,68,68,0.1)" : `0 20px 40px rgba(0,0,0,0.3), 0 0 30px ${chainAccent.primary}20`
              }}
            >
              <Box
                h="4px"
                bgGradient={isUnsupportedChain ? "linear(90deg, #ef4444, #dc2626, #ef4444)" : chainAccent.gradient}
                backgroundSize="300% 100%"
                animation={`${shimmer} 4s ease infinite`}
              />
              <VStack p={{ base: 5, md: 8 }} spacing={6} align="stretch">
                <HStack justify="space-between">
                  <Text color="gray.400" fontWeight="600" letterSpacing="wide" fontSize="sm" textTransform="uppercase">
                    Agent status
                  </Text>
                  <HStack spacing={2}>
                    <Tooltip label={isRegistered ? "Soulbound NFT minted to your wallet" : "Not yet registered"} hasArrow>
                      <Badge
                        bg={isRegistered ? "rgba(34,197,94,0.15)" : `rgba(139,92,246,0.15)`}
                        color={isRegistered ? "#4ade80" : "#a855f7"}
                        px={3}
                        py={1.5}
                        rounded="full"
                        fontSize="xs"
                        fontWeight="600"
                        borderWidth="1px"
                        borderColor={isRegistered ? "#4ade80" : "#a855f7"}
                        boxShadow={isRegistered ? "0 0 10px rgba(74,222,128,0.3)" : "none"}
                      >
                        {isRegistered ? "Registered" : "Pending"}
                      </Badge>
                    </Tooltip>
                  </HStack>
                </HStack>

                <VStack spacing={5}>
                  <Box position="relative" w="130px" h="130px">
                    {isRegistered && (
                      <Box
                        position="absolute"
                        top="-3px"
                        left="-3px"
                        right="-3px"
                        bottom="-3px"
                        borderRadius="full"
                        bgGradient={`linear(135deg, ${chainAccent.primary}, #ec4899, ${chainAccent.secondary})`}
                        animation={`${rotateBorder} 4s linear infinite`}
                        opacity={0.5}
                      />
                    )}
                    <Box
                      w="130px"
                      h="130px"
                      borderRadius="full"
                      bg={`linear-gradient(135deg, ${chainAccent.primary}20, rgba(236,72,153,0.15))`}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      backdropFilter="blur(10px)"
                      border={`2px solid ${isUnsupportedChain ? "#ef4444" : chainAccent.primary}50`}
                      transition="all 0.3s"
                      _hover={{ transform: "scale(1.05)" }}
                      animation={isRegistered ? `${breathe} 3s ease-in-out infinite` : "none"}
                      overflow="hidden"
                    >
                      <Image
                        src="/agent.png"
                        alt="Agent"
                        w="100%"
                        h="100%"
                        objectFit="cover"
                        fallbackSrc="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'><text y='50%' x='50%' text-anchor='middle' font-size='48'>🧬</text></svg>"
                      />
                    </Box>
                  </Box>

                  {isRegistered ? (
                    <VStack spacing={2}>
                      <Heading size="lg" color="white" fontFamily="mono">
                        Agent #{Number(agentId).toString()}
                      </Heading>
                      <HStack spacing={2} wrap="wrap" justify="center">
                        <Badge variant="outline" colorScheme="purple" px={2} py={1} fontSize="xs">
                          Soulbound
                        </Badge>
                      </HStack>
                    </VStack>
                  ) : (
                    <Text fontSize="xl" fontWeight="600" color="gray.300" textAlign="center">
                      Not registered yet
                    </Text>
                  )}
                </VStack>

                <SimpleGrid columns={2} spacing={4} pt={4}>
                  <Box
                    bg={`linear-gradient(135deg, ${chainAccent.primary}15, ${chainAccent.primary}05)`}
                    rounded="2xl"
                    p={4}
                    transition="all 0.3s"
                    _hover={{ transform: "translateY(-2px)", bg: `${chainAccent.primary}20` }}
                  >
                    <Text color="gray.400" fontSize="xs" textTransform="uppercase" letterSpacing="wide">
                      Standard
                    </Text>
                    <Text color="white" fontWeight="bold" fontSize="lg" fontFamily="mono">
                      ERC-8004
                    </Text>
                  </Box>
                  <Box
                    bg={`linear-gradient(135deg, ${chainAccent.primary}15, ${chainAccent.primary}05)`}
                    rounded="2xl"
                    p={4}
                    transition="all 0.3s"
                    _hover={{ transform: "translateY(-2px)", bg: `${chainAccent.primary}20` }}
                  >
                    <Text color="gray.400" fontSize="xs" textTransform="uppercase" letterSpacing="wide">
                      Token type
                    </Text>
                    <Text color="white" fontWeight="bold" fontSize="lg" fontFamily="mono">
                      Soulbound
                    </Text>
                  </Box>
                  <Box
                    bg={`linear-gradient(135deg, ${chainAccent.primary}15, ${chainAccent.primary}05)`}
                    rounded="2xl"
                    p={4}
                    transition="all 0.3s"
                    _hover={{ transform: "translateY(-2px)", bg: `${chainAccent.primary}20` }}
                  >
                    <Text color="gray.400" fontSize="xs" textTransform="uppercase" letterSpacing="wide">
                      Network
                    </Text>
                    <HStack spacing={1}>
                      <Box w="8px" h="8px" borderRadius="full" bg={isUnsupportedChain ? "#ef4444" : chainAccent.primary} animation={`${pulseGlow} 2s ease-in-out infinite`} />
                      <Text color="white" fontWeight="bold" fontSize="lg" fontFamily="mono">
                        {isUnsupportedChain ? "Unsupported" : currentChainName}
                      </Text>
                    </HStack>
                  </Box>
                  <Box
                    bg={`linear-gradient(135deg, ${chainAccent.primary}15, ${chainAccent.primary}05)`}
                    rounded="2xl"
                    p={4}
                    transition="all 0.3s"
                    _hover={{ transform: "translateY(-2px)", bg: `${chainAccent.primary}20` }}
                  >
                    <Text color="gray.400" fontSize="xs" textTransform="uppercase" letterSpacing="wide">
                      Cooldown
                    </Text>
                    <Text color="white" fontWeight="bold" fontSize="lg" fontFamily="mono">
                      24h
                    </Text>
                  </Box>
                </SimpleGrid>
              </VStack>
            </Box>
          </GridItem>

          {/* Action Card — centerpiece of the daily interaction */}
          <GridItem animation={`${slideInRight} 0.7s ease-out 0.1s both`}>
            <Box
              bg="rgba(8, 8, 18, 0.85)"
              backdropFilter="blur(20px)"
              borderRadius={{ base: "2xl", md: "3xl" }}
              border="1px solid"
              borderColor={isUnsupportedChain ? "rgba(239,68,68,0.3)" : isRegistered && canSendGM ? "rgba(34, 197, 94, 0.5)" : `${chainAccent.primary}40`}
              overflow="hidden"
              transition="all 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
              w="full"
              position="relative"
              _hover={{
                transform: { base: "none", md: "translateY(-4px)" },
                borderColor: isUnsupportedChain ? "rgba(239,68,68,0.5)" : isRegistered && canSendGM ? "rgba(34, 197, 94, 0.8)" : `${chainAccent.primary}80`,
                boxShadow: isUnsupportedChain ? "0 0 30px rgba(239,68,68,0.1)" : isRegistered && canSendGM ? "0 0 30px rgba(34,197,94,0.15)" : `0 0 30px ${chainAccent.primary}20`
              }}
            >
              <Box
                h="4px"
                bgGradient={isUnsupportedChain
                  ? "linear(90deg, #ef4444, #dc2626, #ef4444)"
                  : isRegistered && canSendGM
                    ? "linear(90deg, #22c55e, #4ade80, #22c55e)"
                    : isRegistered
                      ? chainAccent.gradient
                      : "linear(90deg, #8b5cf6, #ec4899, #3b82f6, #8b5cf6)"
                }
                backgroundSize="300% 100%"
                animation={`${shimmer} 4s ease infinite`}
              />

              <VStack p={{ base: 5, md: 8 }} spacing={5} align="stretch">
                <HStack justify="space-between" wrap="wrap" rowGap={2}>
                  <Text color="gray.400" fontWeight="600" letterSpacing="wide" fontSize="sm" textTransform="uppercase">
                    Daily check-in
                  </Text>
                </HStack>

                <VStack spacing={4}>
                  <Box position="relative" w={{ base: "150px", md: "200px" }} h={{ base: "150px", md: "200px" }}>
                    {isRegistered && !canSendGM && !isUnsupportedChain && (
                      <Box
                        position="absolute"
                        top="-2px"
                        left="-2px"
                        right="-2px"
                        bottom="-2px"
                        borderRadius="full"
                        bg={`conic-gradient(from 0deg, ${chainAccent.primary}, #ec4899, #3b82f6, ${chainAccent.primary})`}
                        animation={`${rotateBorder} 6s linear infinite`}
                        opacity={0.3}
                      />
                    )}
                    <Box
                      w="100%"
                      h="100%"
                      borderRadius="full"
                      bg={isUnsupportedChain
                        ? "linear-gradient(135deg, rgba(239,68,68,0.2), rgba(239,68,68,0.05))"
                        : isRegistered && canSendGM
                          ? "linear-gradient(135deg, rgba(34,197,94,0.25), rgba(34,197,94,0.08))"
                          : `linear-gradient(135deg, ${chainAccent.primary}20, rgba(236,72,153,0.12))`
                      }
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      backdropFilter="blur(10px)"
                      border="2px solid"
                      borderColor={isUnsupportedChain
                        ? "#ef4444"
                        : isRegistered && canSendGM
                          ? "#22c55e"
                          : `${chainAccent.primary}50`
                      }
                      transition="all 0.3s"
                      _hover={{ transform: "scale(1.02)" }}
                      animation={isRegistered && canSendGM ? `${breathe} 2.5s ease-in-out infinite` : "none"}
                      overflow="hidden"
                    >
                      <Image
                        src={isRegistered ? "/gmagent.png" : "/unlockme.png"}
                        alt={isRegistered ? "GM Agent" : "Unlock"}
                        w="100%"
                        h="100%"
                        objectFit="cover"
                        fallbackSrc={`data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'><text y='50%' x='50%' text-anchor='middle' font-size='48'>${isUnsupportedChain ? '⚠️' : isRegistered ? '📨' : '🔒'}</text></svg>`}
                        opacity={isUnsupportedChain ? 1 : isRegistered ? (canSendGM ? 1 : 0.6) : 1}
                      />
                    </Box>
                  </Box>

                  {isUnsupportedChain ? (
                    <VStack spacing={3} w="full" minH="130px">
                      <HStack spacing={2} wrap="wrap" justify="center">
                        <Box
                          w="10px"
                          h="10px"
                          borderRadius="full"
                          bg="#ef4444"
                          animation={`${pulseGold} 1.5s ease-in-out infinite`}
                          boxShadow="0 0 20px rgba(239,68,68,0.3)"
                        />
                        <Heading
                          size="md"
                          color="#ef4444"
                          fontWeight="700"
                          letterSpacing="0.01em"
                        >
                          Unsupported Chain
                        </Heading>
                      </HStack>
                      <Text color="gray.400" fontSize="sm" textAlign="center" maxW="320px" mx="auto">
                        Please switch to one of the supported networks:
                      </Text>
                      <HStack spacing={2} wrap="wrap" justify="center">
                        <Badge bg="rgba(251,191,36,0.12)" color="#fbbf24" px={2} py={1} borderRadius="full" fontSize="10px">
                          Soneium
                        </Badge>
                        <Badge bg="rgba(251,191,36,0.12)" color="#fbbf24" px={2} py={1} borderRadius="full" fontSize="10px">
                          Ink
                        </Badge>
                        <Badge bg="rgba(251,191,36,0.12)" color="#fbbf24" px={2} py={1} borderRadius="full" fontSize="10px">
                          Optimism
                        </Badge>
                        <Badge bg="rgba(251,191,36,0.12)" color="#fbbf24" px={2} py={1} borderRadius="full" fontSize="10px">
                          Base
                        </Badge>
                        <Badge bg="rgba(251,191,36,0.12)" color="#fbbf24" px={2} py={1} borderRadius="full" fontSize="10px">
                          Unichain
                        </Badge>
                      </HStack>
                      <Box h="24px" />
                    </VStack>
                  ) : isRegistered ? (
                    <VStack spacing={3} w="full" minH="130px">
                      {canSendGM ? (
                        <>
                          <HStack spacing={2} wrap="wrap" justify="center">
                            <Box
                              w="10px"
                              h="10px"
                              borderRadius="full"
                              bg="#22c55e"
                              animation={`${pulseGreen} 1.5s ease-in-out infinite`}
                              boxShadow="0 0 20px rgba(34,197,94,0.5)"
                            />
                            <Heading
                              size="md"
                              color="#4ade80"
                              fontWeight="700"
                              letterSpacing="0.01em"
                              animation={`${glowPulse} 2.5s ease-in-out infinite`}
                            >
                              Ready to GM
                            </Heading>
                            <Badge
                              bg="rgba(34,197,94,0.12)"
                              color="#4ade80"
                              px={2}
                              py={0.5}
                              borderRadius="full"
                              fontSize="9px"
                              fontWeight="600"
                              border="1px solid rgba(34,197,94,0.15)"
                              animation={`${pulseGreen} 2s ease-in-out infinite`}
                            >
                              +1
                            </Badge>
                          </HStack>
                          <Text color="gray.400" fontSize="sm" textAlign="center" maxW="320px" mx="auto">
                            Send today's GM as{" "}
                            <Text as="span" color="#4ade80" fontWeight="600">Agent #{Number(agentId).toString()}</Text>
                          </Text>
                          <Box h="24px" />
                        </>
                      ) : (
                        <>
                          <HStack spacing={2} justify="center">
                            <Box
                              w="10px"
                              h="10px"
                              borderRadius="full"
                              bg="#fbbf24"
                              animation={`${pulseGold} 2s ease-in-out infinite`}
                            />
                            <Heading
                              size="md"
                              bgGradient={`linear(135deg, ${chainAccent.primary}, #ec4899)`}
                              bgClip="text"
                              fontWeight="700"
                              letterSpacing="0.01em"
                            >
                              Cooldown
                            </Heading>
                          </HStack>
                          <VStack spacing={1.5} w="full">
                            <Text color="gray.400" fontSize="xs" letterSpacing="0.05em" fontWeight="500" textTransform="uppercase">
                              Next GM in
                            </Text>
                            <Text
                              fontSize="3xl"
                              fontWeight="800"
                              fontFamily="mono"
                              bgGradient={progressPercent > 75 ? `linear(135deg, ${chainAccent.primary}, #ec4899)` : `linear(135deg, #8b5cf6, #a855f7)`}
                              bgClip="text"
                              letterSpacing="3px"
                            >
                              {timeLeft}
                            </Text>
                            <Progress
                              value={progressPercent}
                              size="sm"
                              w="full"
                              maxW="300px"
                              mx="auto"
                              borderRadius="full"
                              bg="rgba(139,92,246,0.1)"
                              sx={{
                                "& > div": {
                                  bgGradient: `linear(90deg, ${chainAccent.primary}, #ec4899)`,
                                  borderRadius: "full",
                                }
                              }}
                            />
                            <Text fontSize="xs" color="gray.500" fontWeight="500">
                              {Math.floor(progressPercent)}%
                            </Text>
                          </VStack>
                        </>
                      )}
                    </VStack>
                  ) : !loadingRegistered ? (
                    <Text color="gray.400" fontSize="sm" textAlign="center">
                      Register to start your daily streak
                    </Text>
                  ) : (
                    <Skeleton height="40px" w="full" borderRadius="lg" startColor="rgba(139,92,246,0.15)" endColor="rgba(139,92,246,0.05)" />
                  )}

                  <Button
                    size="lg"
                    w="full"
                    h="56px"
                    fontSize="lg"
                    fontWeight="bold"
                    borderRadius="full"
                    isLoading={isTxPending || switching}
                    isDisabled={isMainDisabled}
                    onClick={() => {
                      if (isUnsupportedChain) {
                        handleSwitchToSoneium();
                      } else if (!isCorrectChain) {
                        switchChain?.({ chainId: targetChainId });
                      } else if (mainActionType) {
                        handleAction(mainActionType);
                      }
                    }}
                    bgGradient={isUnsupportedChain ? "linear(135deg, #06b6d4, #3b82f6)" : buttonGradient}
                    color="white"
                    boxShadow={isUnsupportedChain
                      ? "0 0 25px rgba(6,182,212,0.5)"
                      : canSendGM
                        ? "0 0 25px rgba(34, 197, 94, 0.5), 0 0 50px rgba(34, 197, 94, 0.2)"
                        : `0 0 25px ${chainAccent.primary}50, 0 0 50px ${chainAccent.primary}20`
                    }
                    _hover={{
                      transform: isUnsupportedChain ? "translateY(-3px)" : "translateY(-3px)",
                      boxShadow: isUnsupportedChain
                        ? "0 0 40px rgba(6,182,212,0.7), 0 0 80px rgba(6,182,212,0.3)"
                        : canSendGM
                          ? "0 0 40px rgba(34, 197, 94, 0.7), 0 0 80px rgba(34, 197, 94, 0.3)"
                          : `0 0 40px ${chainAccent.primary}70, 0 0 80px ${chainAccent.primary}30`
                    }}
                    transition="all 0.35s cubic-bezier(0.4, 0, 0.2, 1)"
                    _active={{ transform: isUnsupportedChain ? "translateY(0px)" : "translateY(0px)" }}
                    cursor={isUnsupportedChain ? "pointer" : "pointer"}
                  >
                    {isUnsupportedChain ? "Switch to Soneium" : mainButtonLabel}
                  </Button>
                </VStack>
              </VStack>
            </Box>
          </GridItem>
        </Grid>

        {/* HOW IT WORKS — cleaner, no numbered steps, just icons */}
        <Box mt={20} animation={`${slideUp} 0.7s ease-out 0.2s both`}>
          <VStack spacing={10}>
            <VStack spacing={3}>
              <Badge variant="outline" colorScheme="purple" px={3} py={1} fontSize="xs" letterSpacing="wide">
                Protocol Guide
              </Badge>
              <Heading
                fontSize={{ base: "2xl", md: "3xl" }}
                bgGradient={`linear(135deg, ${chainAccent.primary}, #ec4899)`}
                bgClip="text"
                textAlign="center"
              >
                How it works
              </Heading>
            </VStack>

            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} w="full">
              {[
                {
                  title: "Connect & register",
                  desc: "One transaction to become an ERC-8004 Agent.",
                  icon: "🔗",
                  color: chainAccent.primary,
                  gradient: `linear(135deg, ${chainAccent.primary}15, ${chainAccent.primary}05)`,
                },
                {
                  title: "Get your badge",
                  desc: "Receive your permanent Soulbound Agent NFT.",
                  icon: "🎖️",
                  color: "#ec4899",
                  gradient: "linear(135deg, rgba(236,72,153,0.15), rgba(236,72,153,0.05))",
                },
                {
                  title: "Send daily GM",
                  desc: "Check in once every 24 hours to build your streak.",
                  icon: "💬",
                  color: "#3b82f6",
                  gradient: "linear(135deg, rgba(59,130,246,0.15), rgba(59,130,246,0.05))",
                },
                {
                  title: "Build reputation",
                  desc: "Every GM is recorded on-chain for future rewards.",
                  icon: "📈",
                  color: "#22c55e",
                  gradient: "linear(135deg, rgba(34,197,94,0.15), rgba(34,197,94,0.05))",
                },
              ].map((item, idx) => (
                <Tooltip key={idx} label={item.title} hasArrow>
                  <Box
                    bg={item.gradient}
                    backdropFilter="blur(10px)"
                    borderRadius="2xl"
                    p={6}
                    border="1px solid"
                    borderColor={`${item.color}20`}
                    transition="all 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
                    _hover={{
                      transform: "translateY(-6px)",
                      borderColor: item.color,
                      boxShadow: `0 10px 30px ${item.color}15`,
                    }}
                    onMouseEnter={() => setHoverEffect(`step-${idx}`)}
                    onMouseLeave={() => setHoverEffect(null)}
                  >
                    <HStack spacing={3} mb={4}>
                      <Box
                        fontSize="40px"
                        transition="transform 0.3s"
                        transform={hoverEffect === `step-${idx}` ? "scale(1.1)" : "scale(1)"}
                      >
                        {item.icon}
                      </Box>
                    </HStack>
                    <Heading size="sm" mb={2} color="white" fontWeight="600">
                      {item.title}
                    </Heading>
                    <Text fontSize="sm" color="gray.400" lineHeight="1.5">
                      {item.desc}
                    </Text>
                  </Box>
                </Tooltip>
              ))}
            </SimpleGrid>
          </VStack>
        </Box>

        {/* STATS — cleaner, more focus on numbers */}
        <Box mt={16} mb={8} animation={`${slideUp} 0.7s ease-out 0.3s both`}>
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
            {[
              { label: "Agents", value: Number(totalAgents).toLocaleString(), icon: "👥", color: chainAccent.primary },
              { label: "Total GM", value: Number(totalGM).toLocaleString(), icon: "💬", color: "#ec4899" },
              { label: "Your streak", value: `${Number(userStreak)}d`, icon: "🔥", color: "#f59e0b" },
              { label: "Network", value: isUnsupportedChain ? "Unsupported" : currentChainName, icon: isUnsupportedChain ? "⚠️" : "⛓️", color: isUnsupportedChain ? "#ef4444" : chainAccent.primary },
            ].map((stat, idx) => (
              <Box
                key={idx}
                bg="rgba(8, 8, 18, 0.6)"
                backdropFilter="blur(10px)"
                borderRadius="xl"
                p={5}
                textAlign="center"
                transition="all 0.3s"
                _hover={{
                  bg: `${stat.color}10`,
                  transform: "translateY(-2px)",
                  borderColor: stat.color,
                }}
                border="1px solid"
                borderColor={`${stat.color}15`}
              >
                <Text fontSize="28px" mb={1}>{stat.icon}</Text>
                <Text fontSize="xs" color="gray.400" textTransform="uppercase" letterSpacing="wide" fontWeight="500">
                  {stat.label}
                </Text>
                <Text fontSize="2xl" fontWeight="bold" color="white" fontFamily="mono" mt={1}>
                  {stat.value}
                </Text>
              </Box>
            ))}
          </SimpleGrid>
        </Box>

        {/* FOOTER — clean, minimal */}
        <Center pt={12} pb={6}>
          <Flex
            direction={{ base: "column", md: "row" }}
            justify="space-between"
            align="center"
            w="full"
            maxW="1400px"
            gap={{ base: 6, md: 0 }}
          >
            <Box flex="1" display={{ base: "none", md: "block" }} />

            <VStack spacing={4} flex="2">
              <Text color="gray.300" fontSize="sm" fontFamily="mono" fontWeight="500" textAlign="center">
                © 2026 Agent GM Protocol · ERC-8004
              </Text>

              <HStack spacing={4} wrap="wrap" justify="center">
                <HStack spacing={1}>
                  <Box as="span" fontSize="10px">🔗</Box>
                  <Text fontSize="10px" color="gray.500" fontWeight="400" letterSpacing="wide">On-chain</Text>
                </HStack>
                <Box w="3px" h="3px" borderRadius="full" bg="gray.600" />
                <HStack spacing={1}>
                  <Box as="span" fontSize="10px">⚡</Box>
                  <Text fontSize="10px" color="gray.500" fontWeight="400" letterSpacing="wide">Real-time</Text>
                </HStack>
                <Box w="3px" h="3px" borderRadius="full" bg="gray.600" />
                <HStack spacing={1}>
                  <Box as="span" fontSize="10px">🛡️</Box>
                  <Text fontSize="10px" color="gray.500" fontWeight="400" letterSpacing="wide">Secure</Text>
                </HStack>
                <Box w="3px" h="3px" borderRadius="full" bg="gray.600" />
                <HStack spacing={1}>
                  <Box as="span" fontSize="10px">🌐</Box>
                  <Text fontSize="10px" color="gray.500" fontWeight="400" letterSpacing="wide">Decentralized</Text>
                </HStack>
              </HStack>
            </VStack>

            <HStack spacing={4} flex="1" justify="center">
              <Text fontSize="10px" color="gray.500" letterSpacing="wide" display={{ base: "none", md: "block" }}>
                Follow
              </Text>
              <Box w="1px" h="20px" bg={`${chainAccent.primary}30`} display={{ base: "none", md: "block" }} />
              <HStack spacing={3}>
                {[
                  { href: "https://x.com/silviu_asy", icon: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z", label: "X" },
                  { href: "https://github.com/SilviuASY/gm-agent", icon: "M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.03-2.682-.103-.253-.447-1.27.098-2.646 0 0 .84-.269 2.75 1.025.8-.223 1.65-.334 2.5-.334.85 0 1.7.111 2.5.334 1.91-1.294 2.75-1.025 2.75-1.025.545 1.376.201 2.393.099 2.646.64.698 1.03 1.591 1.03 2.682 0 3.841-2.337 4.687-4.565 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z", label: "GitHub" },
                  { href: "https://t.me/silviuasy", icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.66-.35-1.02.22-1.61.15-.15 2.71-2.48 2.76-2.69.01-.03.02-.14-.05-.2-.07-.06-.18-.04-.26-.02-.11.02-1.86 1.18-5.26 3.48-.5.34-.95.51-1.36.5-.45-.01-1.31-.25-1.95-.46-.78-.25-1.4-.38-1.35-.81.03-.22.33-.45.92-.68 2.02-.88 4.26-1.78 6.18-2.38 1.56-.49 3.98-1.06 4.49-1.06.18 0 .46.04.64.19.15.13.19.31.17.53-.02.09-.01.18-.03.28z", label: "Telegram" },
                  { href: "https://discord.com/invite/FVSQT68NPC", icon: "M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z", label: "Discord" },
                ].map((social) => (
                  <Box
                    key={social.label}
                    as="a"
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    w="36px"
                    h="36px"
                    borderRadius="full"
                    bg={`${chainAccent.primary}08`}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    transition="all 0.3s ease"
                    _hover={{
                      bg: `${chainAccent.primary}25`,
                      transform: "translateY(-2px)",
                    }}
                  >
                    <Box
                      as="svg"
                      width="16px"
                      height="16px"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      color="gray.500"
                      transition="color 0.2s ease"
                      _hover={{ color: chainAccent.primary }}
                    >
                      <path d={social.icon} />
                    </Box>
                  </Box>
                ))}
              </HStack>
            </HStack>
          </Flex>
        </Center>
      </Container>

      <TransactionModal
        isOpen={txOpen}
        status={txStatus}
        title={txTitle}
        description={txDesc}
        onClose={() => {
          setTxOpen(false);
          setTimeout(() => {
            if (txStatus === "success" || txStatus === "rejected" || txStatus === "failed") {
              setTxStatus("idle");
              setTxTitle("");
              setTxDesc("");
            }
          }, 300);
        }}
      />
    </Box>
  );
}

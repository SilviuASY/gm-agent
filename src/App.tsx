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

const FIXED_AGENT_URI = "ipfs://bafkreihgnwtxqd34dosxms2ud5wupa5mblw4pogswpk7scytgol3v2shue";
const COOLDOWN_SECONDS = 86400;

// ================= ENHANCED ANIMATIONS =================
const float = keyframes`
  0% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(2deg); }
  100% { transform: translateY(0px) rotate(0deg); }
`;

const floatSlow = keyframes`
  0% { transform: translateY(0px) translateX(0px); }
  33% { transform: translateY(-15px) translateX(10px); }
  66% { transform: translateY(10px) translateX(-10px); }
  100% { transform: translateY(0px) translateX(0px); }
`;

const pulseGlow = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.6); opacity: 0.8; }
  50% { box-shadow: 0 0 0 25px rgba(139, 92, 246, 0); opacity: 1; }
  100% { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0); opacity: 0.8; }
`;

const pulseGreen = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.6); }
  70% { box-shadow: 0 0 0 20px rgba(74, 222, 128, 0); }
  100% { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0); }
`;

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const glowPulse = keyframes`
  0% { filter: brightness(1); }
  50% { filter: brightness(1.2); }
  100% { filter: brightness(1); }
`;

const slideUp = keyframes`
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
`;

const slideInLeft = keyframes`
  from { opacity: 0; transform: translateX(-30px); }
  to { opacity: 1; transform: translateX(0); }
`;

const slideInRight = keyframes`
  from { opacity: 0; transform: translateX(30px); }
  to { opacity: 1; transform: translateX(0); }
`;

const rotateBorder = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

// Helper to get chain key from chainId
const getChainKeyFromId = (chainId: number): keyof typeof CONTRACTS | null => {
  for (const [key, config] of Object.entries(CONTRACTS)) {
    if (config.chainId === chainId) {
      return key as keyof typeof CONTRACTS;
    }
  }
  return null;
};

// Helper to get chain config from chainId
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

// Helper to get URL parameter
const getUrlParam = (param: string): string | null => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
};

// Helper to clean URL (remove chainId parameter without page reload)
const cleanUrl = () => {
  const url = new URL(window.location.href);
  url.searchParams.delete('chainId');
  window.history.replaceState({}, '', url.toString());
};

export default function App() {
  const { address, isConnected, status: accountStatus } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: switching } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const navigate = useNavigate();

  // Track if initial chain from URL has been applied
  const hasAppliedInitialChain = useRef(false);
  const hasCleanedUrl = useRef(false);
  const isSwitchingRef = useRef(false);
  
  // State for selected chain (can be changed by user via Wagmi selector)
  const [selectedChainKey, setSelectedChainKey] = useState<keyof typeof CONTRACTS>("soneium");

  // Store the requested chain ID from URL
  const requestedChainIdRef = useRef<number | null>(null);

  // INITIAL LOAD: Read chainId from URL parameter
  useEffect(() => {
    if (hasAppliedInitialChain.current) return;
    
    const urlChainIdParam = getUrlParam("chainId");
    
    if (urlChainIdParam) {
      const parsedChainId = parseInt(urlChainIdParam, 10);
      if (!isNaN(parsedChainId)) {
        const chainKey = getChainKeyFromId(parsedChainId);
        if (chainKey && CONTRACTS[chainKey]) {
          requestedChainIdRef.current = parsedChainId;
          // Set the selected chain key immediately for UI display
          setSelectedChainKey(chainKey);
          hasAppliedInitialChain.current = true;
        }
      }
    }
  }, []);

  // Handle chain switching when wallet is ready and we have a requested chain
  useEffect(() => {
    // Don't proceed if no requested chain or already switching
    if (!requestedChainIdRef.current || isSwitchingRef.current) return;
    
    const requestedChainId = requestedChainIdRef.current;
    
    // If wallet is connected and the current chain is not the requested one, switch
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

  // Clean URL after initial chain switch is complete or if no switch was needed
  useEffect(() => {
    // Wait for either:
    // 1. No requested chain (nothing to clean)
    // 2. Already cleaned
    // 3. Wallet is connected and chain matches requested OR no switch needed
    if (hasCleanedUrl.current) return;
    
    if (!requestedChainIdRef.current) {
      // No chain requested, nothing to clean
      hasCleanedUrl.current = true;
      return;
    }
    
    const requestedChainId = requestedChainIdRef.current;
    
    // If wallet is not connected, we can still clean the URL after a short delay
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
    
    // Wallet is connected, check if we're on the right chain
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

  // 🔄 SYNCRONIZE: Update selectedChainKey when chainId changes from wallet
  useEffect(() => {
    if (chainId) {
      const currentChain = getChainKeyFromId(chainId);
      if (currentChain && currentChain !== selectedChainKey) {
        console.log(`🔄 Chain changed to: ${currentChain} (ID: ${chainId})`);
        setSelectedChainKey(currentChain);
      }
    }
  }, [chainId]);

  // Update selected chain when user changes network via Wagmi (after initial load)
  useEffect(() => {
    if (!hasAppliedInitialChain.current) return;
    
    if (chainId) {
      const currentChain = getChainKeyFromId(chainId);
      if (currentChain && currentChain !== selectedChainKey) {
        setSelectedChainKey(currentChain);
      }
    }
  }, [chainId, selectedChainKey]);

  // === Target Chain ===
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

  const isCorrectChain = chainId === targetChainId;

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

  const { data: userStreak = 0n } = useReadContract({
    address: currentDailyGM,
    abi: DailyAgentABI,
    functionName: "currentStreak",
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

  // ================= TIMER =================
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

// ================= TRANSACTION =================
const [txOpen, setTxOpen] = useState(false);
const [txStatus, setTxStatus] = useState<"idle" | "wallet" | "pending" | "success" | "rejected" | "failed">("idle");
const [txTitle, setTxTitle] = useState("");
const [txDesc, setTxDesc] = useState("");

const handleAction = async (type: "register" | "gm") => {
  if (isTxPending) return;

  setIsTxPending(true);
  setTxOpen(true);
  setTxStatus("wallet");
  setTxTitle(type === "register" ? "⚡ Confirm Registration" : "💬 Confirm GM");
  setTxDesc(type === "register" ? `Registering as ERC-8004 Agent on ${currentChainName}...` : `Sending daily GM on ${currentChainName}...`);

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
    setTxTitle("Transaction Sent");
    setTxDesc("Waiting for confirmation...");

    const receipt = await publicClient!.waitForTransactionReceipt({ hash });

    if (receipt.status === "success") {
      setTxStatus("success");
      setTxTitle(type === "register" ? "🎉 Registration Complete!" : "✅ GM Sent Successfully!");
      setTxDesc(type === "register" ? "You are now a registered ERC-8004 Agent!" : "Your daily on-chain activity has been recorded.");

      confetti({
        particleCount: type === "register" ? 300 : 180,
        spread: 100,
        origin: { y: 0.6 },
        startVelocity: 25,
        colors: ['#8b5cf6', '#ec4899', '#3b82f6', '#22c55e']
      });

      await Promise.all([refetchRegistered(), refetchAgentId(), refetchLastGM(), refetchTotalAgents(), refetchTotalGM()]);
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
      setTxTitle("Transaction Cancelled");
      setTxDesc("You cancelled the transaction in your wallet.");
    } else {
      setTxStatus("failed");
      setTxTitle("Transaction Failed");
      setTxDesc(err?.message || "Something went wrong. Please try again.");
    }
  } finally {
    setIsTxPending(false);
  }
};

  // ================= BUTTON LOGIC =================
  let mainButtonLabel = "🔌 Connect Wallet";
  let mainActionType: "register" | "gm" | null = null;
  let isMainDisabled = true;
  let buttonGradient = "linear(135deg, #8b5cf6, #ec4899)";

  if (isConnected) {
    if (!isCorrectChain) {
      mainButtonLabel = `🔄 Switch to ${currentChainName}`;
      isMainDisabled = false;
      buttonGradient = "linear(135deg, #3b82f6, #8b5cf6)";
    } else if (!isRegistered) {
      mainButtonLabel = "🎟️ Register as Agent";
      mainActionType = "register";
      isMainDisabled = false;
      buttonGradient = "linear(135deg, #8b5cf6, #a855f7)";
    } else if (canSendGM) {
      mainButtonLabel = "✉️ Send GM Now";
      mainActionType = "gm";
      isMainDisabled = false;
      buttonGradient = "linear(135deg, #22c55e, #16a34a)";
    } else {
      mainButtonLabel = "⏳ Cooldown Active";
      isMainDisabled = true;
      buttonGradient = "linear(135deg, #475569, #334155)";
    }
  }

  return (
    <Box
      minH="100vh"
      position="relative"
      bg="radial-gradient(ellipse at 20% 30%, #0a0a1a 0%, #05050f 100%)"
      overflowX="hidden"
    >
      {/* Enhanced Animated Background Orbs */}
      <Box
        position="fixed"
        top="5%"
        left="-5%"
        w="600px"
        h="600px"
        borderRadius="full"
        bg="radial-gradient(circle, rgba(139,92,246,0.25) 0%, rgba(139,92,246,0.05) 70%)"
        filter="blur(100px)"
        animation={`${floatSlow} 25s ease-in-out infinite`}
        zIndex={0}
        pointerEvents="none"
      />
      <Box
        position="fixed"
        bottom="0%"
        right="-5%"
        w="700px"
        h="700px"
        borderRadius="full"
        bg="radial-gradient(circle, rgba(236,72,153,0.2) 0%, rgba(236,72,153,0.05) 70%)"
        filter="blur(120px)"
        animation={`${float} 30s ease-in-out infinite`}
        zIndex={0}
        pointerEvents="none"
      />
      <Box
        position="fixed"
        top="40%"
        left="30%"
        w="400px"
        h="400px"
        borderRadius="full"
        bg="radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(59,130,246,0) 70%)"
        filter="blur(80px)"
        animation={`${floatSlow} 20s ease-in-out infinite reverse`}
        zIndex={0}
        pointerEvents="none"
      />

      {/* Animated Grid Pattern Overlay */}
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        opacity={0.03}
        pointerEvents="none"
        zIndex={0}
        bgImage="url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCI+PHBhdGggZD0iTTMwIDMwIG0tMjkgMCBhIDI5IDI5IDAgMSAwIDU4IDAgYSAyOSAyOSAwIDEgMC01OCAwIiBzdHJva2U9IiM4YjVjZjYiIGZpbGw9Im5vbmUiIG9wYWNpdHk9IjAuMSIvPjwvc3ZnPg==')"
        bgRepeat="repeat"
      />

      <Container maxW="1400px" position="relative" zIndex={1} px={{ base: 4, md: 6, lg: 8 }} py={{ base: 6, md: 8 }}>
        {/* ENHANCED HEADER */}
        <Flex justify="space-between" align="center" mb={{ base: 8, md: 12 }} direction={{ base: "column", md: "row" }} gap={{ base: 4, md: 0 }}>
          <VStack align={{ base: "center", md: "start" }} spacing={2} animation={`${slideInLeft} 0.6s ease-out`}>
            <HStack spacing={3}>
              <Box
                w="10px"
                h="10px"
                borderRadius="full"
                bgGradient="linear(135deg, #22c55e, #4ade80)"
                animation={`${pulseGreen} 2s ease-in-out infinite`}
              />
              <Heading
                fontSize={{ base: "2xl", md: "3xl", lg: "4xl" }}
                fontWeight="800"
                bgGradient="linear(135deg, #c084fc 0%, #ec4899 40%, #3b82f6 100%)"
                bgClip="text"
                letterSpacing="tight"
                _hover={{ filter: "brightness(1.1)" }}
                transition="filter 0.3s"
              >
                Agent GM Protocol
              </Heading>
            </HStack>
            <HStack spacing={2} pl={{ base: 0, md: "37px" }}>
              <Box as="span" fontSize="10px" color="#4ade80">●</Box>
              <Text color="gray.400" fontSize="sm" letterSpacing="wider" fontFamily="mono">
                ERC-8004 • On-Chain Activity Proof
              </Text>
            </HStack>
          </VStack>

          {/* Pe desktop: HStack orizontal în dreapta */}
          <HStack 
            spacing={4} 
            display={{ base: "none", md: "flex" }}
            animation={`${slideInRight} 0.6s ease-out`}
          >
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
                bg="rgba(59,130,246,0.12)"
                border="1.5px solid rgba(59,130,246,0.4)"
                color="white"
                size="md"
                borderRadius="full"
                px={7}
                py={6}
                fontWeight="600"
                letterSpacing="0.02em"
                fontSize="sm"
                backdropFilter="blur(10px)"
                _hover={{
                  bg: "rgba(59,130,246,0.25)",
                  transform: "translateY(-3px) scale(1.03)",
                  borderColor: "rgba(59,130,246,0.8)",
                  boxShadow: "0 0 40px rgba(59,130,246,0.4), inset 0 0 20px rgba(59,130,246,0.1)",
                  "& > span:first-of-type": {
                    transform: "rotate(-5deg) scale(1.1)",
                  },
                  "& > span:last-of-type": {
                    transform: "translateX(4px)",
                  },
                }}
                _active={{
                  transform: "translateY(0px) scale(0.98)",
                }}
                transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                leftIcon={
                  <Box 
                    as="span" 
                    fontSize="18px"
                    transition="transform 0.3s"
                  >
                    🏆
                  </Box>
                }
                rightIcon={
                  <Box 
                    as="span" 
                    fontSize="14px"
                    transition="transform 0.3s"
                  >
                    →
                  </Box>
                }
              >
                Activity Reputation
              </Button>
            </Tooltip>
            
            <Box transition="transform 0.3s" _hover={{ transform: "scale(1.02)" }}>
              <ConnectButton 
                chainStatus="full"
                accountStatus="full"
                showBalance={false}
              />
            </Box>
          </HStack>


          {/* Pe mobil: VStack vertical, ConnectButton sus, Activity Reputation jos */}
          <VStack 
            spacing={4} 
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
                bg="rgba(59,130,246,0.12)"
                border="1.5px solid rgba(59,130,246,0.4)"
                color="white"
                size="sm"
                borderRadius="full"
                px={5}
                py={3}
                fontWeight="600"
                letterSpacing="0.02em"
                fontSize="xs"
                backdropFilter="blur(10px)"
                _hover={{
                  bg: "rgba(59,130,246,0.25)",
                  transform: "translateY(-2px) scale(1.02)",
                  borderColor: "rgba(59,130,246,0.8)",
                  boxShadow: "0 0 30px rgba(59,130,246,0.4)",
                }}
                _active={{
                  transform: "translateY(0px) scale(0.97)",
                }}
                transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                leftIcon={
                  <Box as="span" fontSize="16px">
                    🏆
                  </Box>
                }
                rightIcon={
                  <Box as="span" fontSize="12px">
                    →
                  </Box>
                }
                width="auto"
                display="inline-flex"
                alignSelf="center"
              >
                Activity Reputation
              </Button>
            </Tooltip>
          </VStack>
        </Flex>


        {/* ENHANCED HERO SECTION */}
        <VStack spacing={4} textAlign="center" mb={12} animation={`${slideUp} 0.8s ease-out`}>
          <HStack spacing={3} wrap="wrap" justify="center">
            <Badge
              bgGradient="linear(135deg, #8b5cf6, #ec4899)"
              px={5}
              py={2.5}
              rounded="full"
              color="white"
              fontSize="sm"
              fontWeight="600"
              letterSpacing="wider"
              boxShadow="0 0 20px rgba(139,92,246,0.5)"
              animation={`${glowPulse} 3s ease-in-out infinite`}
            >
              🌟 {currentChainName} Mainnet Active
            </Badge>
            {chainId === 1868 && (
              <Badge
                bgGradient="linear(135deg, #fbbf24, #ec4899)"
                px={4}
                py={2.5}
                rounded="full"
                color="white"
                fontSize="sm"
                fontWeight="700"
                letterSpacing="wider"
                boxShadow="0 0 20px rgba(251,191,36,0.4)"
                animation={`${glowPulse} 3s ease-in-out infinite`}
              >
                🏆 Season 12 • +7.5 Bonus
              </Badge>
            )}
          </HStack>
          
          <Heading
            fontSize={{ base: "3xl", md: "5xl", lg: "6xl" }}
            fontWeight="800"
            bgGradient="linear(135deg, #ffffff 0%, #c084fc 40%, #a855f7 100%)"
            bgClip="text"
            lineHeight="1.2"
            maxW="1000px"
            mx="auto"
            letterSpacing="-0.02em"
            whiteSpace={{ base: "normal", md: "nowrap" }}
          >
            Prove Your Daily On-Chain Activity
          </Heading>
          
          <Text 
            fontSize={{ base: "sm", md: "lg" }} 
            color="gray.400" 
            maxW="750px" 
            mx="auto" 
            lineHeight="1.6"
            whiteSpace={{ base: "normal", md: "nowrap" }}
          >
            Register once as an ERC-8004 Agent and send GM daily to build your verifiable on-chain reputation
          </Text>

          {/* Season 12 Quests - doar pe Soneium, stil card */}
          {chainId === 1868 && (
            <Box
              bg="rgba(251,191,36,0.05)"
              borderRadius="xl"
              px={{ base: 4, md: 6 }}
              py={{ base: 3, md: 4 }}
              border="1px solid rgba(251,191,36,0.12)"
              maxW="500px"
              mx="auto"
              w="full"
              transition="all 0.3s"
              _hover={{ borderColor: "rgba(251,191,36,0.25)", bg: "rgba(251,191,36,0.08)" }}
            >
              <VStack spacing={3} align="stretch">
                {/* Header */}
                <HStack justify="space-between" align="center">
                  <HStack spacing={2}>
                    <Text fontSize={{ base: "sm", md: "md" }} color="#fbbf24" fontWeight="700">🏆 S12 Quests</Text>
                    <Badge
                      bg={isRegistered && Number(userStreak) >= 5 ? "rgba(34,197,94,0.2)" : "rgba(251,191,36,0.15)"}
                      color={isRegistered && Number(userStreak) >= 5 ? "#4ade80" : "#fbbf24"}
                      px={2.5}
                      py={0.5}
                      borderRadius="full"
                      fontSize={{ base: "8px", md: "10px" }}
                      fontWeight="600"
                      border="1px solid"
                      borderColor={isRegistered && Number(userStreak) >= 5 ? "rgba(34,197,94,0.2)" : "rgba(251,191,36,0.15)"}
                    >
                      {isRegistered && Number(userStreak) >= 5 ? "✅ COMPLETE" : "IN PROGRESS"}
                    </Badge>
                  </HStack>
                  <Text fontSize={{ base: "sm", md: "md" }} color="#fbbf24" fontWeight="700">
                    +7.5 Bonus
                  </Text>
                </HStack>

                {/* Quest 1: Register */}
                <HStack justify="space-between" align="center" p={2} bg="rgba(0,0,0,0.2)" borderRadius="lg">
                  <HStack spacing={3} align="center">
                    <Box
                      w={{ base: "20px", md: "24px" }}
                      h={{ base: "20px", md: "24px" }}
                      borderRadius="full"
                      bg={isRegistered ? "rgba(34,197,94,0.2)" : "rgba(139,92,246,0.15)"}
                      border="2px solid"
                      borderColor={isRegistered ? "#4ade80" : "rgba(139,92,246,0.3)"}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      fontSize={{ base: "10px", md: "12px" }}
                      color={isRegistered ? "#4ade80" : "gray.500"}
                      transition="all 0.3s"
                    >
                      {isRegistered ? "✓" : "1"}
                    </Box>
                    <Text fontSize={{ base: "sm", md: "md" }} color={isRegistered ? "#4ade80" : "gray.300"} fontWeight="500">
                      Register as Agent
                    </Text>
                  </HStack>
                  <Badge
                    bg={isRegistered ? "rgba(34,197,94,0.15)" : "rgba(139,92,246,0.15)"}
                    color={isRegistered ? "#4ade80" : "#a855f7"}
                    px={2.5}
                    py={1}
                    borderRadius="full"
                    fontSize={{ base: "8px", md: "10px" }}
                    fontWeight="600"
                  >
                    {isRegistered ? "✓ Done" : "Pending"}
                  </Badge>
                </HStack>

                {/* Quest 2: Send 5 GM */}
                <HStack justify="space-between" align="center" p={2} bg="rgba(0,0,0,0.2)" borderRadius="lg">
                  <HStack spacing={3} align="center">
                    <Box
                      w={{ base: "20px", md: "24px" }}
                      h={{ base: "20px", md: "24px" }}
                      borderRadius="full"
                      bg={Number(userStreak) >= 5 ? "rgba(34,197,94,0.2)" : "rgba(139,92,246,0.15)"}
                      border="2px solid"
                      borderColor={Number(userStreak) >= 5 ? "#4ade80" : "rgba(139,92,246,0.3)"}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      fontSize={{ base: "10px", md: "12px" }}
                      color={Number(userStreak) >= 5 ? "#4ade80" : "gray.500"}
                      transition="all 0.3s"
                    >
                      {Number(userStreak) >= 5 ? "✓" : "2"}
                    </Box>
                    <HStack spacing={2} align="center">
                      <Text fontSize={{ base: "sm", md: "md" }} color={Number(userStreak) >= 5 ? "#4ade80" : "gray.300"} fontWeight="500">
                        Send 5 GM
                      </Text>
                      <Badge
                        bg={Number(userStreak) >= 5 ? "rgba(34,197,94,0.15)" : "rgba(139,92,246,0.15)"}
                        color={Number(userStreak) >= 5 ? "#4ade80" : "#a855f7"}
                        px={2}
                        py={0.5}
                        borderRadius="full"
                        fontSize={{ base: "8px", md: "10px" }}
                        fontWeight="600"
                      >
                        {Number(userStreak) >= 5 ? "✓" : `${Number(userStreak)}/5`}
                      </Badge>
                    </HStack>
                  </HStack>
                  <Badge
                    bg={Number(userStreak) >= 5 ? "rgba(34,197,94,0.15)" : "rgba(139,92,246,0.15)"}
                    color={Number(userStreak) >= 5 ? "#4ade80" : "#a855f7"}
                    px={2.5}
                    py={1}
                    borderRadius="full"
                    fontSize={{ base: "8px", md: "10px" }}
                    fontWeight="600"
                  >
                    {Number(userStreak) >= 5 ? "✓ Done" : `${Number(userStreak)}/5`}
                  </Badge>
                </HStack>

                {/* Bonus Unlocked */}
                {isRegistered && Number(userStreak) >= 5 && (
                  <Box
                    textAlign="center"
                    p={2}
                    bg="rgba(34,197,94,0.08)"
                    borderRadius="lg"
                    border="1px solid rgba(34,197,94,0.15)"
                    animation={`${pulseGreen} 2s ease-in-out infinite`}
                  >
                    <Text fontSize={{ base: "sm", md: "md" }} color="#4ade80" fontWeight="700">
                      🎉 Bonus +7.5 points unlocked!
                    </Text>
                  </Box>
                )}
              </VStack>
            </Box>
          )}
        </VStack>

        {/* ENHANCED Main Card Grid */}
        <Grid
          templateColumns={{ base: "1fr", lg: "1.2fr 0.8fr" }}
          gap={{ base: 6, lg: 8 }}
          alignItems="start"
        >
          {/* Enhanced Status Card */}
          <GridItem animation={`${slideInLeft} 0.7s ease-out 0.1s both`}>
            <Box
              bg="rgba(10, 10, 20, 0.7)"
              backdropFilter="blur(20px)"
              borderRadius="3xl"
              border="1px solid"
              borderColor="rgba(139, 92, 246, 0.3)"
              overflow="hidden"
              transition="all 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
              _hover={{
                borderColor: "rgba(139, 92, 246, 0.8)",
                transform: "translateY(-4px)",
                boxShadow: "0 20px 40px rgba(0,0,0,0.3), 0 0 30px rgba(139,92,246,0.2)"
              }}
            >
              <Box
                h="4px"
                bgGradient={chainId === 1868 ? "linear(90deg, #fbbf24, #ec4899, #8b5cf6, #fbbf24)" : "linear(90deg, #8b5cf6, #ec4899, #3b82f6, #8b5cf6)"}
                backgroundSize="300% 100%"
                animation={`${shimmer} 4s ease infinite`}
              />
              <VStack p={{ base: 6, md: 8 }} spacing={6} align="stretch">
                <HStack justify="space-between">
                  <Text color="gray.400" fontWeight="600" letterSpacing="wider" fontSize="sm">
                    AGENT STATUS
                  </Text>
                  <HStack spacing={2}>
                    {chainId === 1868 && (
                      <Badge
                        bg="rgba(251,191,36,0.15)"
                        color="#fbbf24"
                        px={2}
                        py={1}
                        rounded="full"
                        fontSize="17px"
                        fontWeight="600"
                        border="1px solid rgba(251,191,36,0.2)"
                      >
                        🏆 Season 12 score
                      </Badge>
                    )}
                    <Tooltip label={isRegistered ? "Soulbound NFT Minted" : "Not yet registered"} hasArrow>
                      <Badge
                        bg={isRegistered ? "linear-gradient(135deg, rgba(34,197,94,0.2), rgba(34,197,94,0.1))" : "linear-gradient(135deg, rgba(139,92,246,0.2), rgba(139,92,246,0.1))"}
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
                        {isRegistered ? "✓ REGISTERED" : "⚡ PENDING"}
                      </Badge>
                    </Tooltip>
                  </HStack>
                </HStack>

                <VStack spacing={5}>
                  <Box
                    position="relative"
                    w="130px"
                    h="130px"
                  >
                    {isRegistered && (
                      <Box
                        position="absolute"
                        top="-3px"
                        left="-3px"
                        right="-3px"
                        bottom="-3px"
                        borderRadius="full"
                        bgGradient={chainId === 1868 ? "linear(135deg, #fbbf24, #ec4899, #8b5cf6)" : "linear(135deg, #8b5cf6, #ec4899, #3b82f6)"}
                        animation={`${rotateBorder} 4s linear infinite`}
                        opacity={0.6}
                      />
                    )}
                    <Box
                      w="130px"
                      h="130px"
                      borderRadius="full"
                      bgGradient="linear(135deg, rgba(139,92,246,0.2), rgba(236,72,153,0.2))"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      fontSize="64px"
                      backdropFilter="blur(10px)"
                      border="2px solid rgba(139,92,246,0.4)"
                      transition="all 0.3s"
                      _hover={{ transform: "scale(1.05)" }}
                    >
                      {loadingRegistered ? "⏳" : isRegistered ? "🧬" : "🚀"}
                    </Box>
                  </Box>
                  
                  {isRegistered ? (
                    <VStack spacing={2}>
                      <Heading size="lg" color="white" fontFamily="mono">
                        Agent #{Number(agentId).toString()}
                      </Heading>
                      <HStack spacing={2} wrap="wrap" justify="center">
                        <Badge variant="outline" colorScheme="purple" px={2} py={1} fontSize="xs">
                          🔒 Soulbound NFT
                        </Badge>
                        {chainId === 1868 && isRegistered && Number(userStreak) >= 5 && (
                          <Badge bgGradient="linear(135deg, #fbbf24, #ec4899)" color="white" px={2} py={1} fontSize="xs" fontWeight="600">
                            🏆 S12 Complete
                          </Badge>
                        )}
                      </HStack>
                    </VStack>
                  ) : (
                    <Text fontSize="xl" fontWeight="600" color="gray.300" textAlign="center">
                      Not Registered Yet
                    </Text>
                  )}
                </VStack>

                {/* Enhanced Stats Grid - revenit la 4 iteme */}
                <SimpleGrid columns={2} spacing={4} pt={4}>
                  <Box
                    bg="linear-gradient(135deg, rgba(139,92,246,0.15), rgba(139,92,246,0.05))"
                    rounded="2xl"
                    p={4}
                    transition="all 0.3s"
                    _hover={{ transform: "translateY(-2px)", bg: "rgba(139,92,246,0.2)" }}
                  >
                    <Text color="gray.400" fontSize="xs" textTransform="uppercase" letterSpacing="wider">
                      Standard
                    </Text>
                    <Text color="white" fontWeight="bold" fontSize="lg" fontFamily="mono">
                      ERC-8004
                    </Text>
                  </Box>
                  <Box
                    bg="linear-gradient(135deg, rgba(139,92,246,0.15), rgba(139,92,246,0.05))"
                    rounded="2xl"
                    p={4}
                    transition="all 0.3s"
                    _hover={{ transform: "translateY(-2px)", bg: "rgba(139,92,246,0.2)" }}
                  >
                    <Text color="gray.400" fontSize="xs" textTransform="uppercase" letterSpacing="wider">
                      Type
                    </Text>
                    <Text color="white" fontWeight="bold" fontSize="lg" fontFamily="mono">
                      Soulbound
                    </Text>
                  </Box>
                  <Box
                    bg="linear-gradient(135deg, rgba(139,92,246,0.15), rgba(139,92,246,0.05))"
                    rounded="2xl"
                    p={4}
                    transition="all 0.3s"
                    _hover={{ transform: "translateY(-2px)", bg: "rgba(139,92,246,0.2)" }}
                  >
                    <Text color="gray.400" fontSize="xs" textTransform="uppercase" letterSpacing="wider">
                      Network
                    </Text>
                    <HStack spacing={1}>
                      <Box w="8px" h="8px" borderRadius="full" bg="#22c55e" animation={`${pulseGlow} 2s ease-in-out infinite`} />
                      <Text color="white" fontWeight="bold" fontSize="lg" fontFamily="mono">
                        {currentChainName}
                      </Text>
                    </HStack>
                  </Box>
                  <Box
                    bg="linear-gradient(135deg, rgba(139,92,246,0.15), rgba(139,92,246,0.05))"
                    rounded="2xl"
                    p={4}
                    transition="all 0.3s"
                    _hover={{ transform: "translateY(-2px)", bg: "rgba(139,92,246,0.2)" }}
                  >
                    <Text color="gray.400" fontSize="xs" textTransform="uppercase" letterSpacing="wider">
                      Cooldown
                    </Text>
                    <Text color="white" fontWeight="bold" fontSize="lg" fontFamily="mono">
                      24 Hours
                    </Text>
                  </Box>
                </SimpleGrid>
              </VStack>
            </Box>
          </GridItem>

          {/* Enhanced Action Card */}
          <GridItem animation={`${slideInRight} 0.7s ease-out 0.1s both`}>
            <Box
              bg="rgba(10, 10, 20, 0.7)"
              backdropFilter="blur(20px)"
              borderRadius="3xl"
              border="1px solid"
              borderColor={isRegistered && canSendGM ? "rgba(34, 197, 94, 0.5)" : "rgba(139, 92, 246, 0.3)"}
              overflow="hidden"
              transition="all 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
              _hover={{
                transform: "translateY(-4px)",
                borderColor: isRegistered && canSendGM ? "rgba(34, 197, 94, 0.8)" : "rgba(139, 92, 246, 0.8)",
                boxShadow: isRegistered && canSendGM ? "0 0 30px rgba(34,197,94,0.2)" : "0 0 30px rgba(139,92,246,0.2)"
              }}
            >
              {isRegistered && canSendGM && (
                <Box
                  h="4px"
                  bgGradient="linear(90deg, #22c55e, #4ade80, #22c55e)"
                  backgroundSize="200% 100%"
                  animation={`${shimmer} 2s ease infinite`}
                />
              )}
              <VStack p={{ base: 6, md: 8 }} spacing={6} align="stretch">
                <HStack justify="space-between">
                  <Text color="gray.400" fontWeight="600" letterSpacing="wider" fontSize="sm">
                    DAILY INTERACTION
                  </Text>
                  {chainId === 1868 && isRegistered && (
                    <Badge
                      bg="rgba(251,191,36,0.15)"
                      color={Number(userStreak) >= 5 ? "#4ade80" : "#fbbf24"}
                      px={2}
                      py={1}
                      rounded="full"
                      fontSize="17px"
                      fontWeight="600"
                      border="1px solid rgba(251,191,36,0.2)"
                      animation={Number(userStreak) >= 5 ? `${pulseGreen} 2s ease-in-out infinite` : `${pulseGlow} 3s ease-in-out infinite`}
                    >
                      {Number(userStreak) >= 5 ? "✅ GM Complete" : `📨 ${Number(userStreak)}/5 GM`}
                    </Badge>
                  )}
                </HStack>

                <VStack spacing={4}>
                  <Box
                    position="relative"
                    w={{ base: "180px", md: "200px" }}
                    h={{ base: "180px", md: "200px" }}
                  >
                    {isRegistered && !canSendGM && (
                      <Box
                        position="absolute"
                        top="-2px"
                        left="-2px"
                        right="-2px"
                        bottom="-2px"
                        borderRadius="full"
                        bg="conic-gradient(from 0deg, #8b5cf6, #ec4899, #3b82f6, #8b5cf6)"
                        animation={`${rotateBorder} 6s linear infinite`}
                        opacity={0.4}
                      />
                    )}
                    <Box
                      w="100%"
                      h="100%"
                      borderRadius="full"
                      bg={isRegistered && canSendGM
                        ? "linear-gradient(135deg, rgba(34,197,94,0.3), rgba(34,197,94,0.1))"
                        : "linear-gradient(135deg, rgba(139,92,246,0.3), rgba(236,72,153,0.2))"
                      }
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      fontSize={{ base: "80px", md: "96px" }}
                      backdropFilter="blur(10px)"
                      border="2px solid"
                      borderColor={isRegistered && canSendGM ? "#22c55e" : "rgba(139,92,246,0.4)"}
                      transition="all 0.3s"
                      _hover={{ transform: "scale(1.02)" }}
                    >
                      {isRegistered ? (canSendGM ? "📨" : "⏳") : "🔒"}
                    </Box>
                  </Box>

            {isRegistered && (
              <VStack spacing={3} w="full" minH="130px">
                {canSendGM ? (
                  <>
                    <HStack spacing={2}>
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
                        letterSpacing="0.02em"
                        animation={`${glowPulse} 2.5s ease-in-out infinite`}
                      >
                        ✅ GM Available
                      </Heading>
                      <Badge
                        bg="rgba(34,197,94,0.15)"
                        color="#4ade80"
                        px={2}
                        py={0.5}
                        borderRadius="full"
                        fontSize="9px"
                        fontWeight="600"
                        border="1px solid rgba(34,197,94,0.2)"
                        animation={`${pulseGreen} 2s ease-in-out infinite`}
                      >
                        +1 Point
                      </Badge>
                    </HStack>
                    <Text color="gray.400" fontSize="sm" textAlign="center" maxW="320px" mx="auto">
                      Your daily GM is ready to be sent on-chain as <Text as="span" color="#4ade80" fontWeight="600">Agent #{Number(agentId).toString()}</Text>
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
                        animation={`${pulseGlow} 2s ease-in-out infinite`}
                      />
                      <Heading 
                        size="md" 
                        bgGradient="linear(135deg, #c084fc, #ec4899)" 
                        bgClip="text"
                        fontWeight="700"
                        letterSpacing="0.02em"
                      >
                        Cooldown Active
                      </Heading>
                    </HStack>
                    <VStack spacing={1.5} w="full">
                      <Text color="gray.400" fontSize="xs" letterSpacing="0.05em" fontWeight="500">
                        NEXT GM AVAILABLE IN
                      </Text>
                      <Text
                        fontSize="3xl"
                        fontWeight="800"
                        fontFamily="mono"
                        bgGradient={progressPercent > 75 ? "linear(135deg, #c084fc, #ec4899)" : "linear(135deg, #8b5cf6, #a855f7)"}
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
                        bg="rgba(139,92,246,0.15)"
                        sx={{
                          "& > div": {
                            bgGradient: "linear(90deg, #8b5cf6, #ec4899)",
                            borderRadius: "full",
                          }
                        }}
                      />
                      <Text fontSize="xs" color="gray.500" fontWeight="500">
                        {Math.floor(progressPercent)}% completed
                      </Text>
                    </VStack>
                  </>
                )}
              </VStack>
            )}

                  {!isRegistered && !loadingRegistered && (
                    <Text color="gray.400" fontSize="sm" textAlign="center">
                      Register as an Agent to start your daily streak
                    </Text>
                  )}

                  {loadingRegistered && (
                    <Skeleton height="40px" w="full" borderRadius="lg" startColor="rgba(139,92,246,0.2)" endColor="rgba(139,92,246,0.1)" />
                  )}

                  <Button
                    size="lg"
                    w="full"
                    h="60px"
                    fontSize="lg"
                    fontWeight="bold"
                    borderRadius="full"
                    isLoading={isTxPending || switching}
                    isDisabled={isMainDisabled}
                    onClick={() => {
                      if (!isCorrectChain) {
                        switchChain?.({ chainId: targetChainId });
                      } else if (mainActionType) {
                        handleAction(mainActionType);
                      }
                    }}
                    bgGradient={buttonGradient}
                    color="white"
                    boxShadow={canSendGM 
                      ? "0 0 25px rgba(34, 197, 94, 0.6), 0 0 50px rgba(34, 197, 94, 0.3)" 
                      : "0 0 25px rgba(139, 92, 246, 0.6), 0 0 50px rgba(139, 92, 246, 0.3)"
                    }
                    _hover={{ 
                      transform: "translateY(-3px)", 
                      boxShadow: canSendGM 
                        ? "0 0 40px rgba(34, 197, 94, 0.9), 0 0 80px rgba(34, 197, 94, 0.5)" 
                        : "0 0 40px rgba(139, 92, 246, 0.9), 0 0 80px rgba(139, 92, 246, 0.5)"
                    }}
                    transition="all 0.35s cubic-bezier(0.4, 0, 0.2, 1)"
                    _active={{ transform: "translateY(0px)" }}
                  >
                    {mainButtonLabel}
                  </Button>
                </VStack>
              </VStack>
            </Box>
          </GridItem>
        </Grid>

        {/* Enhanced How It Works Section */}
        <Box mt={20} animation={`${slideUp} 0.7s ease-out 0.2s both`}>
          <VStack spacing={10}>
            <VStack spacing={3}>
              <Badge variant="outline" colorScheme="purple" px={3} py={1} fontSize="xs" letterSpacing="wider">
                PROTOCOL GUIDE
              </Badge>
              <Heading
                fontSize={{ base: "2xl", md: "3xl" }}
                bgGradient="linear(135deg, #c084fc, #ec4899)"
                bgClip="text"
                textAlign="center"
              >
                How It Works
              </Heading>
            </VStack>

            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} w="full">
              {[
                {
                  step: "01",
                  title: "Connect & Register",
                  desc: "Connect your wallet and register as an ERC-8004 Agent with a single transaction",
                  icon: "🔗",
                  color: "#8b5cf6",
                  gradient: "linear(135deg, rgba(139,92,246,0.2), rgba(139,92,246,0.05))",
                },
                {
                  step: "02",
                  title: "Get Your Badge",
                  desc: "Receive your permanent Soulbound Agent NFT - your on-chain identity",
                  icon: "🎖️",
                  color: "#ec4899",
                  gradient: "linear(135deg, rgba(236,72,153,0.2), rgba(236,72,153,0.05))",
                },
                {
                  step: "03",
                  title: "Daily GM",
                  desc: "Send GM once every 24 hours to prove consistent on-chain activity",
                  icon: "💬",
                  color: "#3b82f6",
                  gradient: "linear(135deg, rgba(59,130,246,0.2), rgba(59,130,246,0.05))",
                },
                {
                  step: "04",
                  title: "Build Reputation",
                  desc: "Your streak is recorded on-chain for future rewards & integrations",
                  icon: "📈",
                  color: "#22c55e",
                  gradient: "linear(135deg, rgba(34,197,94,0.2), rgba(34,197,94,0.05))",
                },
              ].map((item, idx) => (
                <Tooltip key={idx} label={`Step ${item.step}`} hasArrow>
                  <Box
                    bg={item.gradient}
                    backdropFilter="blur(10px)"
                    borderRadius="2xl"
                    p={6}
                    border="1px solid"
                    borderColor={`rgba(${parseInt(item.color.slice(1, 3), 16)}, ${parseInt(item.color.slice(3, 5), 16)}, ${parseInt(item.color.slice(5, 7), 16)}, 0.2)`}
                    transition="all 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
                    _hover={{
                      transform: "translateY(-8px)",
                      borderColor: item.color,
                      boxShadow: `0 10px 30px ${item.color}20`,
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
                      <Text
                        fontSize="12px"
                        fontWeight="bold"
                        color={item.color}
                        letterSpacing="wider"
                        fontFamily="mono"
                      >
                        STEP {item.step}
                      </Text>
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

        {/* Enhanced Stats Section */}
        <Box mt={16} mb={8} animation={`${slideUp} 0.7s ease-out 0.3s both`}>
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
            {[
              { label: "Total Agents", value: Number(totalAgents).toLocaleString(), change: `on ${currentChainName}`, icon: "👥", color: "#8b5cf6" },
              { label: "Total GM Sent", value: Number(totalGM).toLocaleString(), change: "all time", icon: "💬", color: "#ec4899" },
              { label: "Active Streak", value: `${Number(userStreak)}d`, change: "your streak", icon: "🔥", color: "#f59e0b" },
              { label: "Network", value: currentChainName, change: "Mainnet", icon: "⛓️", color: "#3b82f6" },
            ].map((stat, idx) => (
              <Box
                key={idx}
                bg="linear-gradient(135deg, rgba(15, 15, 30, 0.6), rgba(10, 10, 20, 0.4))"
                backdropFilter="blur(10px)"
                borderRadius="xl"
                p={5}
                textAlign="center"
                transition="all 0.3s"
                _hover={{
                  bg: `linear-gradient(135deg, ${stat.color}10, rgba(10, 10, 20, 0.4))`,
                  transform: "translateY(-2px)",
                  borderColor: stat.color,
                }}
                border="1px solid"
                borderColor={`${stat.color}20`}
              >
                <Text fontSize="28px" mb={1}>{stat.icon}</Text>
                <Text fontSize="xs" color="gray.400" textTransform="uppercase" letterSpacing="wider" fontWeight="500">
                  {stat.label}
                </Text>
                <Text fontSize="2xl" fontWeight="bold" color="white" fontFamily="mono" mt={1}>
                  {stat.value}
                </Text>
                <Text fontSize="xs" color={stat.color} fontWeight="500">
                  {stat.change}
                </Text>
              </Box>
            ))}
          </SimpleGrid>
        </Box>


        {/* Footer */}
        <Center pt={12} pb={6}>
          <Flex 
            direction={{ base: "column", md: "row" }} 
            justify="space-between" 
            align="center"
            w="full"
            maxW="1400px"
            gap={{ base: 6, md: 0 }}
          >
            {/* Centered Text */}
            <Box flex="1" />
            
            <VStack spacing={4} flex="2">
              <HStack spacing={8} opacity={0.8}>
                <Text color="gray.300" fontSize="sm" fontFamily="mono" fontWeight="500">
                  © 2026 • Agent GM Protocol • ERC-8004 Standard
                </Text>
              </HStack>
              
              <HStack spacing={4} wrap="wrap" justify="center">
                <HStack spacing={1}>
                  <Box as="span" fontSize="10px">🔗</Box>
                  <Text fontSize="10px" color="gray.500" fontWeight="400">ON-CHAIN TRACKING</Text>
                </HStack>
                <Box w="3px" h="3px" borderRadius="full" bg="gray.600" />
                <HStack spacing={1}>
                  <Box as="span" fontSize="10px">⚡</Box>
                  <Text fontSize="10px" color="gray.500" fontWeight="400">REAL-TIME</Text>
                </HStack>
                <Box w="3px" h="3px" borderRadius="full" bg="gray.600" />
                <HStack spacing={1}>
                  <Box as="span" fontSize="10px">🛡️</Box>
                  <Text fontSize="10px" color="gray.500" fontWeight="400">SECURE</Text>
                </HStack>
                <Box w="3px" h="3px" borderRadius="full" bg="gray.600" />
                <HStack spacing={1}>
                  <Box as="span" fontSize="10px">🌐</Box>
                  <Text fontSize="10px" color="gray.500" fontWeight="400">DECENTRALIZED</Text>
                </HStack>
              </HStack>
            </VStack>

            {/* Right Side - Social Icons */}
            <HStack spacing={4} flex="1" justify="flex-end">
              <Text fontSize="10px" color="gray.500" letterSpacing="wider" display={{ base: "none", md: "block" }}>
                FOLLOW US
              </Text>
              <Box w="1px" h="20px" bg="rgba(139,92,246,0.3)" display={{ base: "none", md: "block" }} />
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
                    w="32px"
                    h="32px"
                    borderRadius="full"
                    bg="rgba(139,92,246,0.08)"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    transition="all 0.3s ease"
                    _hover={{
                      bg: "rgba(59,130,246,0.3)",
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

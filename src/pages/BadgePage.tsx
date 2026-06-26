// src/pages/BadgePage.tsx
import {
  Box,
  Container,
  Flex,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Button,
  Image,
  Progress,
  useToast,
  SimpleGrid,
} from "@chakra-ui/react";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  useAccount,
  useChainId,
  useSwitchChain,
  useReadContract,
  useWriteContract,
  usePublicClient,
} from "wagmi";
import { useState, useEffect, useMemo } from "react";
import { ChevronLeftIcon, InfoIcon } from "@chakra-ui/icons";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";

import { useFixScroll } from "../hooks/useFixScroll";
import { useNavigate } from "react-router-dom";
import { PULSE_ENTRY_ADDRESS, PULSE_ENTRY_ABI } from "../abi/PulseEntryABI";
import { PULSE_CARDS_ADDRESS, PULSE_CARDS_ABI } from "../abi/PulseCardsABI";
import { soneiumChain } from "../wagmi";
import TransactionModal from "../components/TransactionModal";
import PuzzleGrid from "../components/PuzzleGrid";

// ============= Constants =============
const COOLDOWN_SECONDS = 86400;

const PULSE_ENTRY_IMAGE =
  "https://bafybeiddo3w2y7ja43agkv5qppoee2k2dfwn67etxbiea2f44himtrphd4.ipfs.dweb.link/";

const PULSECARDS_SOULBOUND_IMAGE =
  "https://bafybeidppabfrrpps7imkev35luyqq3zzn75ukxudi5bk5eb67m7uwffni.ipfs.dweb.link/";

const PUZZLE_IMAGES = [
  "https://bafkreibqkbvu3vqxcblnidrrk5uhrsx6zz4qp7mqeajvtej5k6lzzs5mmu.ipfs.dweb.link/",
  "https://bafkreiesvguxt66btdqmiewytwadj5c444wkxkftqimw3rfehm3hnm2eme.ipfs.dweb.link/",
  "https://bafkreicndjrqnsruwtj6fjwdeee3q2djmrhbtuehr6afbfo6wwmyujvmey.ipfs.dweb.link/",
  "https://bafkreigh6we2el2ggplgjtz6wtolwdeawwpzshuub7oxpp5ac6xh6ly6te.ipfs.dweb.link/",
  "https://bafkreib2o4phl2wjdzfeleyzpzzfyzvdvzlbig7pveqym3pr3jqrxqi7na.ipfs.dweb.link/",
  "https://bafkreidte2j2y6g76vfvylxduhdynqdknxjyrxrneenskgbrhwbkeijte4.ipfs.dweb.link/",
  "https://bafkreic5hew4yabatxlcwggmkhg3mxs6u2chyrg6l5vc3syky3vi6qcq3m.ipfs.dweb.link/",
  "https://bafkreidiafgqtwujqswsc5nwflu6j4lgahzsvgxocb2jojhn7lyy54hrwm.ipfs.dweb.link/",
  "https://bafkreidb5ytfidv5qhj5grzapaz47cn5hfvk3b4hvegy6fszaf5l7id77a.ipfs.dweb.link/",
];

// ============= Motion =============
const MotionBox = motion(Box);

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
  @keyframes orbFloat {
    0%, 100% { transform: scale(1)   translateY(0px);   opacity: 0.45; }
    50%      { transform: scale(1.1) translateY(-20px);  opacity: 0.7; }
  }
  @keyframes countUp {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes pulseAnimation {
    0% { opacity: 0.6; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.05); }
    100% { opacity: 0.6; transform: scale(1); }
  }
  @keyframes neonGlow {
    0% { text-shadow: 0 0 5px #a855f7, 0 0 10px #a855f7, 0 0 20px #22c55e; }
    100% { text-shadow: 0 0 15px #a855f7, 0 0 25px #a855f7, 0 0 35px #22c55e; }
  }
`;

// ============= Stat Card =============
const StatCard = ({ stat, index }: { stat: any; index: number }) => (
  <MotionBox
    initial={{ opacity: 0, y: 24 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: index * 0.08 }}
    position="relative"
    h="full"
    _hover={{ transform: "translateY(-5px)" }}
    sx={{ transition: "transform 0.3s cubic-bezier(0.175,0.885,0.32,1.275)" }}
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
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        h="1px"
        bg={`linear-gradient(90deg, transparent, ${stat.color}60, transparent)`}
      />
      <Box
        position="absolute"
        top={0}
        right={0}
        w="80px"
        h="80px"
        bg={`radial-gradient(circle at top right, ${stat.color}15, transparent 70%)`}
      />

      <HStack spacing={3} align="center" position="relative" zIndex={1}>
        <Flex
          align="center"
          justify="center"
          w={{ base: "40px", md: "52px" }}
          h={{ base: "40px", md: "52px" }}
          bg={`${stat.color}10`}
          border={`1px solid ${stat.color}22`}
          borderRadius="xl"
          flexShrink={0}
          fontSize={{ base: "18px", md: "24px" }}
          style={{ animation: "floatCard 5s ease-in-out infinite" }}
        >
          {stat.icon}
        </Flex>
        <Box flex="1" minW="0">
          <Text
            fontSize="9px"
            color="gray.500"
            textTransform="uppercase"
            letterSpacing="0.2em"
            fontFamily="'Space Mono', monospace"
            fontWeight="700"
            mb={0.5}
          >
            {stat.label}
          </Text>
          <Text
            fontSize={{ base: "lg", md: "xl" }}
            fontWeight="800"
            color="white"
            fontFamily="'Space Mono', monospace"
            letterSpacing="-0.02em"
            lineHeight="1.1"
            style={{ animation: "countUp 0.6s ease-out forwards" }}
          >
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

// ============= Footer =============
const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <Box pt={10} pb={6} position="relative">
      <Box
        h="1px"
        mb={8}
        bg="linear-gradient(90deg, transparent, rgba(168,85,247,0.2), rgba(34,197,94,0.2), transparent)"
      />

      <VStack spacing={4}>
        {/* stat row */}
        <HStack
          spacing={0}
          justify="center"
          flexWrap="wrap"
          bg="rgba(255,255,255,0.02)"
          border="1px solid rgba(255,255,255,0.04)"
          borderRadius="2xl"
          px={6}
          py={3}
          gap={0}
        >
          {[
            { label: "Protocol", value: "ERC-721" },
            { label: "Chain", value: "Soneium" },
            { label: "Status", value: "Live ✓" },
          ].map(({ label, value }, i, arr) => (
            <HStack key={label} spacing={0}>
              <VStack spacing={0} px={{ base: 4, md: 6 }} py={1}>
                <Text
                  fontSize="9px"
                  color="gray.600"
                  textTransform="uppercase"
                  letterSpacing="0.18em"
                  fontFamily="'Space Mono', monospace"
                >
                  {label}
                </Text>
                <Text
                  fontSize="xs"
                  fontWeight="700"
                  color="gray.300"
                  fontFamily="'Space Mono', monospace"
                >
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
          <Text
            fontSize="9px"
            color="gray.500"
            fontFamily="'Space Mono', monospace"
            letterSpacing="0.12em"
            textAlign="center"
          >
            © {currentYear} · PulseVault · All rights reserved
          </Text>
          <Text
            fontSize="9px"
            color="gray.600"
            fontFamily="'Space Mono', monospace"
            letterSpacing="0.08em"
          >
            Built on Soneium · Powered by SilviuASY
          </Text>
        </VStack>
      </VStack>
    </Box>
  );
};

// ============= SBT Modal =============
const SbtModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null;

  return (
    <Box
      position="fixed"
      inset={0}
      bg="rgba(0,0,0,0.85)"
      backdropFilter="blur(14px)"
      display="flex"
      alignItems="center"
      justifyContent="center"
      zIndex={1000}
      onClick={onClose}
    >
      <MotionBox
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        bg="rgba(4,4,14,0.95)"
        border="1px solid rgba(168,85,247,0.3)"
        borderRadius="2xl"
        p={8}
        maxW="600px"
        w="90%"
        onClick={(e) => e.stopPropagation()}
        boxShadow="0 40px 80px rgba(0,0,0,0.6)"
        position="relative"
        overflow="hidden"
      >
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          h="3px"
          bgGradient="linear(90deg, #a855f7, #22c55e, #38bdf8, #a855f7)"
          backgroundSize="300% 100%"
          style={{ animation: "shimmerBorder 3s infinite" }}
        />

        <VStack spacing={5} align="stretch">
          <Heading size="md" fontFamily="'Space Grotesk', sans-serif">
            <Text as="span" bgGradient="linear(135deg, #a855f7, #22c55e, #38bdf8)" bgClip="text" fontWeight="800">
              PulseCards SBT Utility
            </Text>
          </Heading>

          <Text color="gray.400" fontSize="sm" lineHeight="1.7" fontFamily="'Space Grotesk', sans-serif">
            A Soulbound identity that unlocks free daily on-chain actions and tracks your activity across the Soneium ecosystem.
          </Text>

          <Box bg="rgba(168,85,247,0.06)" border="1px solid rgba(168,85,247,0.1)" borderRadius="xl" p={4}>
            <VStack align="stretch" spacing={3}>
              <HStack spacing={3}>
                <Badge colorScheme="purple" borderRadius="full" px={3} py={1} fontSize="10px" fontFamily="'Space Mono', monospace">
                  ⚡ GM
                </Badge>
                <Text fontSize="xs" color="gray.400" fontFamily="'Space Grotesk', sans-serif">
                  Send a free on-chain GM once every 24 hours
                </Text>
              </HStack>
              <HStack spacing={3}>
                <Badge colorScheme="green" borderRadius="full" px={3} py={1} fontSize="10px" fontFamily="'Space Mono', monospace">
                  🛠 Deploy
                </Badge>
                <Text fontSize="xs" color="gray.400" fontFamily="'Space Grotesk', sans-serif">
                  Deploy a smart contract once every 24 hours at no cost
                </Text>
              </HStack>
            </VStack>
          </Box>

          <VStack align="stretch" spacing={1}>
            <Text fontSize="xs" color="gray.500" fontFamily="'Space Grotesk', sans-serif" lineHeight="1.5">
              This is a <Text as="span" color="purple.300" fontWeight="600">non-transferable (Soulbound)</Text> identity permanently tied to your wallet.
            </Text>
            <Text fontSize="xs" color="gray.400" fontFamily="'Space Grotesk', sans-serif" lineHeight="1.5">
              Your consistency becomes your <Text as="span" color="green.300" fontWeight="600">on-chain reputation</Text>.
            </Text>
          </VStack>

          <Button
            colorScheme="purple"
            w="full"
            onClick={onClose}
            borderRadius="full"
            fontWeight="700"
            fontFamily="'Space Grotesk', sans-serif"
            _hover={{ transform: "translateY(-2px)", boxShadow: "0 10px 40px rgba(168,85,247,0.3)" }}
            transition="all 0.2s"
          >
            Close
          </Button>
        </VStack>
      </MotionBox>
    </Box>
  );
};

// ============= Main Page =============
export default function BadgePage() {
  useFixScroll();

  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const toast = useToast();
  const navigate = useNavigate();

  const [isSbtOpen, setIsSbtOpen] = useState(false);
  const [isTxPending, setIsTxPending] = useState(false);
  const [tempBoostCount, setTempBoostCount] = useState<number | null>(null);
  const [txOpen, setTxOpen] = useState(false);
  const [txStatus, setTxStatus] = useState<"idle" | "wallet" | "pending" | "success" | "rejected" | "failed">("idle");
  const [txTitle, setTxTitle] = useState("");
  const [txDesc, setTxDesc] = useState("");
  const [timeLeft, setTimeLeft] = useState("–");
  const [cooldownReady, setCooldownReady] = useState(false);

  const isCorrectChain = chainId === soneiumChain.id;
  const enabled = !!address && isConnected && isCorrectChain;

  // ===== Read Contracts =====
  const { data: isPaused = false } = useReadContract({
    address: PULSE_ENTRY_ADDRESS,
    abi: PULSE_ENTRY_ABI,
    functionName: "paused",
    query: { enabled },
  });

  const { data: entryLevel = 0n, refetch: refetchEntryLevel } = useReadContract({
    address: PULSE_ENTRY_ADDRESS,
    abi: PULSE_ENTRY_ABI,
    functionName: "getLevel",
    args: [address!],
    query: { enabled },
  });

  const { data: boostCountRaw = 0n, refetch: refetchBoost } = useReadContract({
    address: PULSE_ENTRY_ADDRESS,
    abi: PULSE_ENTRY_ABI,
    functionName: "getBoostCount",
    args: [address!],
    query: { enabled },
  });

  const { data: lastBoostTime = 0n, refetch: refetchLastBoost } = useReadContract({
    address: PULSE_ENTRY_ADDRESS,
    abi: PULSE_ENTRY_ABI,
    functionName: "lastBoost",
    args: [address!],
    query: { enabled },
  });

  const { data: entryTokenId, refetch: refetchToken } = useReadContract({
    address: PULSE_ENTRY_ADDRESS,
    abi: PULSE_ENTRY_ABI,
    functionName: "tokenOfOwnerByIndex",
    args: [address!, 0n],
    query: { enabled: enabled && entryLevel > 0n },
  });

  const { data: ownsPulseCards = 0n, refetch: refetchPulseCards } = useReadContract({
    address: PULSE_CARDS_ADDRESS,
    abi: PULSE_CARDS_ABI,
    functionName: "balanceOf",
    args: [address!],
    query: { enabled },
  });

  const { data: mintFee } = useReadContract({
    address: PULSE_ENTRY_ADDRESS,
    abi: PULSE_ENTRY_ABI,
    functionName: "feeMintInitial",
    query: { enabled },
  });

  const { data: boostFee } = useReadContract({
    address: PULSE_ENTRY_ADDRESS,
    abi: PULSE_ENTRY_ABI,
    functionName: "feeBoost",
    query: { enabled },
  });

  const { data: pulseCardsFee } = useReadContract({
    address: PULSE_CARDS_ADDRESS,
    abi: PULSE_CARDS_ABI,
    functionName: "mintFee",
    query: { enabled },
  });

  // ===== Computed =====
  const boostCount = tempBoostCount ?? Number(boostCountRaw);
  const hasEntry = entryLevel > 0n;
  const hasMintedPulseCards = ownsPulseCards > 0n;
  const piecesUnlocked = Math.min(boostCount, 9);
  const canMintPulseCards = piecesUnlocked >= 9 && entryLevel >= 2n && !hasMintedPulseCards;

  // ===== Cooldown Timer =====
  useEffect(() => {
    if (!enabled || !hasEntry) {
      setTimeLeft("–");
      setCooldownReady(false);
      return;
    }

    const updateTimer = () => {
      const now = Math.floor(Date.now() / 1000);
      const last = Number(lastBoostTime);
      const diff = last + COOLDOWN_SECONDS - now;
      if (diff <= 0) {
        setCooldownReady(true);
        setTimeLeft("Ready");
      } else {
        setCooldownReady(false);
        const h = Math.floor(diff / 3600).toString().padStart(2, "0");
        const m = Math.floor((diff % 3600) / 60).toString().padStart(2, "0");
        const s = (diff % 60).toString().padStart(2, "0");
        setTimeLeft(`${h}:${m}:${s}`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [lastBoostTime, enabled, hasEntry]);

  const canBoost = hasEntry && cooldownReady && piecesUnlocked < 9;

  // ===== Auto-switch from URL =====
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const targetChainId = params.get("chainId");
    if (targetChainId && switchChain && chainId !== 1868) {
      if (Number(targetChainId) === 1868) {
        console.log("🔁 Switching to Soneium (chainId 1868) from URL param");
        switchChain({ chainId: 1868 });
      }
    }
  }, [chainId, switchChain]);

  // ===== Confetti on completion =====
  useEffect(() => {
    if (piecesUnlocked === 9 && !hasMintedPulseCards) {
      confetti({ particleCount: 180, spread: 90, origin: { y: 0.6 } });
    }
  }, [piecesUnlocked, hasMintedPulseCards]);

  // ===== Handle Actions =====
  const handleAction = async (type: "mintEntry" | "boost" | "mintPulseCards") => {
    if (isTxPending) return;
    if (isPaused && type !== "mintPulseCards") {
      setTxOpen(true);
      setTxStatus("failed");
      setTxTitle("Contract Paused");
      setTxDesc("PulseEntry contract is currently paused.");
      return;
    }

    setIsTxPending(true);
    setTxOpen(true);
    setTxStatus("wallet");
    setTxTitle("Confirm in wallet");

    try {
      let hash: `0x${string}`;

      if (type === "mintEntry") {
        setTxDesc("Minting your PulseEntry...");
        if (!mintFee) throw new Error("Mint fee not loaded");
        hash = await writeContractAsync({
          address: PULSE_ENTRY_ADDRESS,
          abi: PULSE_ENTRY_ABI,
          functionName: "mintPulseEntry",
          value: mintFee,
        });
      } else if (type === "boost") {
        setTxDesc("Boosting... waiting for confirmation");
        if (!entryTokenId) throw new Error("No PulseEntry token found");
        if (!boostFee) throw new Error("Boost fee not loaded");
        hash = await writeContractAsync({
          address: PULSE_ENTRY_ADDRESS,
          abi: PULSE_ENTRY_ABI,
          functionName: "boost",
          args: [entryTokenId],
          value: boostFee,
        });
      } else {
        setTxDesc("Minting your Soulbound PulseCards...");
        if (!pulseCardsFee) throw new Error("PulseCards fee not loaded");
        hash = await writeContractAsync({
          address: PULSE_CARDS_ADDRESS,
          abi: PULSE_CARDS_ABI,
          functionName: "mintPulseCards",
          value: pulseCardsFee as bigint,
        });
      }

      setTxStatus("pending");
      setTxTitle("Transaction sent");

      const receipt = await publicClient!.waitForTransactionReceipt({ hash });

      if (receipt.status === "success") {
        setTxStatus("success");
        setTxTitle("Success!");
        setTxDesc(
          type === "mintEntry"
            ? "PulseEntry minted!"
            : type === "boost"
              ? "Boost successful – piece unlocked!"
              : "Soulbound PulseCards minted forever!"
        );

        if (type === "mintPulseCards") {
          confetti({ particleCount: 300, spread: 120, origin: { y: 0.7 } });
        }

        await Promise.all([
          refetchEntryLevel(),
          refetchBoost(),
          refetchLastBoost(),
          refetchToken(),
          refetchPulseCards(),
        ]);

        if (type === "boost") {
          setTempBoostCount(Number(boostCountRaw) + 1);
        }

        toast({
          title: "Success! 🎉",
          description: txDesc,
          status: "success",
          duration: 5000,
          isClosable: true,
          position: "top-right",
        });
      } else {
        throw new Error("Transaction reverted");
      }
    } catch (err: any) {
      console.error(err);
      const rejected = err?.message?.includes("rejected") || err?.shortMessage?.includes("rejected");
      setTxStatus(rejected ? "rejected" : "failed");
      setTxTitle(rejected ? "Cancelled" : "Failed");
      setTxDesc(rejected ? "You cancelled the transaction" : "Transaction failed");
    } finally {
      setIsTxPending(false);
    }
  };

  const handleSwitchToSoneium = async () => {
    try {
      await switchChain({ chainId: 1868 });
      toast({
        title: "Switched to Soneium",
        description: "You can now use PulseCards features.",
        status: "success",
        duration: 3000,
        position: "top-right",
      });
    } catch (err) {
      toast({
        title: "Switch Failed",
        description: "Please switch manually in your wallet.",
        status: "error",
        duration: 5000,
        position: "top-right",
      });
    }
  };

  // ===== Stats =====
  const stats = useMemo(() => [
    {
      label: "Pieces",
      value: `${piecesUnlocked}/9`,
      icon: "🧩",
      color: "#a855f7",
      description: "Puzzle pieces unlocked",
      glowColor: "rgba(168,85,247,0.3)",
    },
    {
      label: "Boosts",
      value: boostCount.toString(),
      icon: "⚡",
      color: "#4ade80",
      description: "Total boosts performed",
      glowColor: "rgba(74,222,128,0.3)",
    },
    {
      label: "Level",
      value: entryLevel.toString(),
      icon: "⭐",
      color: "#fbbf24",
      description: "Current PulseEntry level",
      glowColor: "rgba(251,191,36,0.3)",
    },
    {
      label: "Status",
      value: hasMintedPulseCards ? "Minted ✅" : hasEntry ? "Active" : "Not Started",
      icon: hasMintedPulseCards ? "🏆" : hasEntry ? "🟢" : "⏳",
      color: hasMintedPulseCards ? "#4ade80" : hasEntry ? "#2dd4bf" : "#6b7280",
      description: hasMintedPulseCards ? "Soulbound acquired" : hasEntry ? "Journey in progress" : "Mint to begin",
      glowColor: hasMintedPulseCards ? "rgba(74,222,128,0.3)" : hasEntry ? "rgba(45,212,191,0.3)" : "rgba(107,114,128,0.3)",
    },
  ], [piecesUnlocked, boostCount, entryLevel, hasMintedPulseCards, hasEntry]);

  // ===== Button Logic =====
  let mainButtonLabel = "";
  let mainActionType: "mintEntry" | "boost" | "mintPulseCards" | null = null;
  let isMainDisabled = isTxPending;

  if (isConnected) {
    if (!isCorrectChain) {
      mainButtonLabel = "Switch to Soneium";
    } else if (!hasEntry) {
      mainButtonLabel = "Mint PulseEntry";
      mainActionType = "mintEntry";
    } else if (canBoost) {
      mainButtonLabel = `Boost Now ${piecesUnlocked}/9`;
      mainActionType = "boost";
    } else if (canMintPulseCards) {
      mainButtonLabel = "🌟 Mint Soulbound 🌟";
      mainActionType = "mintPulseCards";
    } else if (hasMintedPulseCards) {
      mainButtonLabel = "✨ Already Minted ✨";
      isMainDisabled = true;
    } else {
      mainButtonLabel = "⏳ Cooldown";
      isMainDisabled = true;
    }
  }

  // ===== Handle Main Button Click =====
  const handleMainClick = () => {
    if (!isCorrectChain) {
      handleSwitchToSoneium();
    } else if (mainActionType) {
      handleAction(mainActionType);
    }
  };

  return (
    <>
      <style>{pageStyles}</style>

      <Box minH="100vh" bg="#03030f" position="relative" fontFamily="'Space Grotesk', sans-serif">
        {/* Ambient orbs */}
        <Box
          position="fixed"
          top="-10%"
          left="-10%"
          w="650px"
          h="650px"
          borderRadius="full"
          bg="radial-gradient(circle, rgba(168,85,247,0.08) 0%, transparent 65%)"
          filter="blur(90px)"
          style={{ animation: "orbFloat 22s ease-in-out infinite" }}
          zIndex={0}
          pointerEvents="none"
        />
        <Box
          position="fixed"
          bottom="-10%"
          right="-10%"
          w="750px"
          h="750px"
          borderRadius="full"
          bg="radial-gradient(circle, rgba(34,197,94,0.06) 0%, transparent 65%)"
          filter="blur(110px)"
          style={{ animation: "orbFloat 30s ease-in-out infinite 8s" }}
          zIndex={0}
          pointerEvents="none"
        />
        <Box
          position="fixed"
          top="45%"
          left="30%"
          w="450px"
          h="450px"
          borderRadius="full"
          bg="radial-gradient(circle, rgba(56,189,248,0.05) 0%, transparent 65%)"
          filter="blur(70px)"
          style={{ animation: "orbFloat 18s ease-in-out infinite reverse 4s" }}
          zIndex={0}
          pointerEvents="none"
        />

        {/* subtle dot grid */}
        <Box
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          zIndex={0}
          pointerEvents="none"
          opacity={0.018}
          bgImage="radial-gradient(rgba(255,255,255,0.9) 1px, transparent 1px)"
          bgSize="32px 32px"
        />

        <Container maxW="1440px" position="relative" zIndex={1} px={{ base: 3, md: 6, lg: 8 }} py={{ base: 4, md: 8 }}>
          {/* ─── Header ─── */}
          <Flex
            justify="space-between"
            align="center"
            mb={{ base: 6, md: 10 }}
            direction={{ base: "column", md: "row" }}
            gap={{ base: 3, md: 0 }}
          >
            <HStack spacing={4}>
              <Button
                onClick={() => navigate("/")}
                variant="ghost"
                size={{ base: "sm", md: "md" }}
                leftIcon={<ChevronLeftIcon />}
                color="gray.500"
                _hover={{
                  color: "white",
                  bg: "rgba(168,85,247,0.08)",
                  borderColor: "rgba(168,85,247,0.25)",
                }}
                borderRadius="xl"
                border="1px solid rgba(255,255,255,0.07)"
                fontFamily="'Space Grotesk', sans-serif"
                fontWeight="500"
                transition="all 0.2s"
              >
                Back
              </Button>

              <Box h="36px" w="1px" bg="rgba(255,255,255,0.05)" display={{ base: "none", md: "block" }} />

              <VStack align="start" spacing={0.5}>
                <HStack spacing={3} align="center">
                  <Box
                    w="7px"
                    h="7px"
                    borderRadius="full"
                    bg="#4ade80"
                    boxShadow="0 0 8px rgba(74,222,128,0.8)"
                    style={{ animation: "pulseGlow 2.5s ease-in-out infinite" }}
                  />
                  <Heading
                    fontSize={{ base: "xl", md: "2xl", lg: "3xl" }}
                    fontWeight="800"
                    bgGradient="linear(135deg, #a855f7 0%, #22c55e 50%, #38bdf8 100%)"
                    bgClip="text"
                    letterSpacing="-0.03em"
                    fontFamily="'Space Grotesk', sans-serif"
                    style={{ animation: "neonGlow 2s infinite alternate" }}
                  >
                    PulseCards
                  </Heading>
                  <Badge
                    bg="rgba(168,85,247,0.1)"
                    color="#a855f7"
                    fontSize="9px"
                    px={2}
                    py={0.5}
                    borderRadius="full"
                    border="1px solid rgba(168,85,247,0.2)"
                    fontFamily="'Space Mono', monospace"
                  >
                    Season 10
                  </Badge>
                </HStack>
                <Text
                  color="gray.600"
                  fontSize={{ base: "9px", md: "10px" }}
                  letterSpacing="0.2em"
                  fontFamily="'Space Mono', monospace"
                  textTransform="uppercase"
                >
                  Soulbound · Puzzle · Rewards
                </Text>
              </VStack>
            </HStack>

            <Box display={{ base: "none", md: "block" }} _hover={{ transform: "scale(1.02)" }} transition="transform 0.2s">
              <ConnectButton chainStatus="full" accountStatus="full" showBalance={false} />
            </Box>
          </Flex>

          {/* Mobile wallet */}
          <Box display={{ base: "flex", md: "none" }} justifyContent="center" mb={5}>
            <ConnectButton chainStatus="full" accountStatus="full" showBalance={false} />
          </Box>

          {/* Wrong Network Alert */}
          {isConnected && !isCorrectChain && (
            <MotionBox initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} mb={5}>
              <Box
                bg="rgba(239,68,68,0.08)"
                border="1px solid rgba(239,68,68,0.2)"
                borderRadius="2xl"
                p={4}
                backdropFilter="blur(14px)"
                position="relative"
                overflow="hidden"
              >
                <Box
                  position="absolute"
                  top={0}
                  left={0}
                  right={0}
                  h="2px"
                  bgGradient="linear(90deg, transparent, #f97316, #ef4444, #f97316, transparent)"
                  backgroundSize="300% 100%"
                  style={{ animation: "shimmerBorder 3s infinite" }}
                />
                <Flex align="center" gap={4} flexWrap="wrap">
                  <Flex
                    align="center"
                    justify="center"
                    w="40px"
                    h="40px"
                    borderRadius="full"
                    bg="rgba(239,68,68,0.1)"
                    border="1px solid rgba(239,68,68,0.2)"
                    flexShrink={0}
                  >
                    <Text fontSize="xl">⚠️</Text>
                  </Flex>
                  <Box flex="1">
                    <Text fontSize="sm" fontWeight="700" color="#f87171" fontFamily="'Space Grotesk', sans-serif">
                      Wrong Network
                    </Text>
                    <Text fontSize="xs" color="gray.500" fontFamily="'Space Grotesk', sans-serif">
                      PulseCards require Soneium Network. Please switch to continue.
                    </Text>
                  </Box>
                  <Button
                    size="sm"
                    colorScheme="purple"
                    borderRadius="full"
                    fontWeight="700"
                    px={6}
                    onClick={handleSwitchToSoneium}
                    fontFamily="'Space Grotesk', sans-serif"
                    _hover={{ transform: "translateY(-2px)", boxShadow: "0 4px 20px rgba(168,85,247,0.3)" }}
                    transition="all 0.2s"
                  >
                    Switch to Soneium
                  </Button>
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

          {/* ─── Main Content ─── */}
          <Flex
            direction={{ base: "column", lg: "row" }}
            gap={{ base: 8, lg: 12 }}
            align={{ base: "center", lg: "flex-start" }}
          >
            {/* LEFT - Puzzle Grid */}
            <Box flex="1" w="full" maxW={{ lg: "580px" }}>
              <Box
                bg="rgba(4,4,14,0.85)"
                backdropFilter="blur(20px)"
                borderRadius="2xl"
                border="1px solid rgba(255,255,255,0.06)"
                p={{ base: 4, md: 6 }}
                _hover={{ borderColor: "rgba(168,85,247,0.3)", boxShadow: "0 20px 60px rgba(168,85,247,0.05)" }}
                transition="all 0.35s ease"
              >
                <VStack spacing={4}>
                  <HStack justify="space-between" w="full">
                    <Heading size="sm" color="white" fontFamily="'Space Grotesk', sans-serif" fontWeight="700">
                      🧩 Pulse Puzzle
                    </Heading>
                    <Badge
                      colorScheme="purple"
                      variant="solid"
                      fontSize="10px"
                      px={3}
                      py={1}
                      borderRadius="full"
                      fontFamily="'Space Mono', monospace"
                    >
                      {piecesUnlocked}/9
                    </Badge>
                  </HStack>

                  <PuzzleGrid piecesUnlocked={piecesUnlocked} images={PUZZLE_IMAGES} />

                  <Box w="full">
                    <Progress
                      value={(piecesUnlocked / 9) * 100}
                      size="sm"
                      colorScheme="green"
                      bg="rgba(255,255,255,0.05)"
                      borderRadius="full"
                      sx={{
                        "& > div": {
                          bgGradient: "linear(135deg, #a855f7, #22c55e)",
                        },
                      }}
                    />
                    <Flex justify="space-between" mt={1}>
                      <Text fontSize="9px" color="gray.500" fontFamily="'Space Mono', monospace">
                        {piecesUnlocked} unlocked
                      </Text>
                      <Text fontSize="9px" color="gray.500" fontFamily="'Space Mono', monospace">
                        {9 - piecesUnlocked} remaining
                      </Text>
                    </Flex>
                  </Box>

                  {piecesUnlocked > 0 && piecesUnlocked < 9 && (
                    <HStack spacing={2} justify="center" w="full">
                      <Badge
                        variant="subtle"
                        colorScheme={piecesUnlocked >= 6 ? "purple" : piecesUnlocked >= 3 ? "blue" : "gray"}
                        borderRadius="full"
                        px={3}
                        py={1}
                        fontSize="9px"
                        fontFamily="'Space Mono', monospace"
                      >
                        {piecesUnlocked >= 6 ? "⭐ Collector" : piecesUnlocked >= 3 ? "🧩 Novice" : "🚀 Started"}
                      </Badge>
                      {cooldownReady && hasEntry && piecesUnlocked < 9 && (
                        <Badge colorScheme="green" borderRadius="full" px={3} py={1} fontSize="9px" fontFamily="'Space Mono', monospace">
                          ✅ Ready to Boost
                        </Badge>
                      )}
                    </HStack>
                  )}
                </VStack>
              </Box>
            </Box>

            {/* RIGHT - Preview & Actions */}
            <VStack flex="1" spacing={6} w="full" maxW={{ lg: "420px" }}>
              <Box
                w="full"
                bg="rgba(4,4,14,0.85)"
                backdropFilter="blur(20px)"
                borderRadius="2xl"
                border="2px solid"
                borderColor={
                  hasMintedPulseCards
                    ? "rgba(74,222,128,0.4)"
                    : canMintPulseCards
                      ? "rgba(74,222,128,0.3)"
                      : hasEntry
                        ? "rgba(168,85,247,0.3)"
                        : "rgba(255,255,255,0.06)"
                }
                p={{ base: 4, md: 6 }}
                textAlign="center"
                position="relative"
                overflow="hidden"
                transition="all 0.5s ease"
                _hover={{
                  borderColor: hasEntry ? "rgba(168,85,247,0.5)" : "rgba(255,255,255,0.1)",
                  boxShadow: canMintPulseCards || hasMintedPulseCards ? "0 0 60px rgba(74,222,128,0.1)" : "none",
                }}
              >
                <Box
                  position="absolute"
                  top={0}
                  left={0}
                  right={0}
                  h="3px"
                  bgGradient={
                    hasMintedPulseCards
                      ? "linear(90deg, #4ade80, #22c55e, #4ade80)"
                      : canMintPulseCards
                        ? "linear(90deg, #a855f7, #22c55e, #a855f7)"
                        : hasEntry
                          ? "linear(90deg, #a855f7, #8b5cf6, #a855f7)"
                          : "linear(90deg, #6b7280, #4b5563, #6b7280)"
                  }
                  backgroundSize="200% 100%"
                  style={{ animation: "shimmerBorder 3s infinite" }}
                />

                {hasEntry && (
                  <Box
                    position="absolute"
                    top="-8px"
                    left="50%"
                    transform="translateX(-50%)"
                    bg="rgba(168,85,247,0.15)"
                    backdropFilter="blur(10px)"
                    px={4}
                    py={1}
                    borderRadius="full"
                    border="1px solid rgba(168,85,247,0.3)"
                    whiteSpace="nowrap"
                    boxShadow="0 0 30px rgba(168,85,247,0.2)"
                  >
                    <HStack spacing={2}>
                      <Image src={PULSE_ENTRY_IMAGE} alt="PulseEntry" boxSize="18px" borderRadius="full" objectFit="cover" />
                      <Text fontSize="10px" fontWeight="700" color="#a855f7" fontFamily="'Space Mono', monospace">
                        PulseEntry Owned
                      </Text>
                    </HStack>
                  </Box>
                )}

                <Box pt={hasEntry ? 6 : 0} position="relative">
                  {hasEntry ? (
                    <Box position="relative" display="inline-block">
                      <Image
                        src={PULSECARDS_SOULBOUND_IMAGE}
                        alt="PulseCards Soulbound"
                        boxSize={{ base: "180px", md: "220px" }}
                        objectFit="contain"
                        mx="auto"
                        filter={
                          hasMintedPulseCards
                            ? "none"
                            : canMintPulseCards
                              ? "drop-shadow(0 0 40px rgba(168,85,247,0.4))"
                              : "blur(10px) grayscale(60%) brightness(0.5)"
                        }
                        transition="filter 1s ease, transform 0.8s"
                        borderRadius="2xl"
                      />

                      {!canMintPulseCards && !hasMintedPulseCards && hasEntry && (
                        <Box
                          position="absolute"
                          inset={0}
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          bg="rgba(0,0,0,0.6)"
                          borderRadius="2xl"
                          backdropFilter="blur(4px)"
                        >
                          <Badge colorScheme="purple" fontSize="sm" px={4} py={2} borderRadius="full" fontFamily="'Space Mono', monospace">
                            {9 - piecesUnlocked} Boost{9 - piecesUnlocked !== 1 ? "s" : ""} remaining
                          </Badge>
                        </Box>
                      )}
                    </Box>
                  ) : (
                    <Image
                      src={PULSE_ENTRY_IMAGE}
                      alt="PulseEntry Preview"
                      boxSize={{ base: "200px", md: "240px" }}
                      objectFit="contain"
                      mx="auto"
                      borderRadius="2xl"
                      boxShadow="0 0 40px rgba(168,85,247,0.2)"
                    />
                  )}
                </Box>

                {/* Status Text */}
                {hasMintedPulseCards ? (
                  <Text fontSize="lg" fontWeight="700" color="#4ade80" fontFamily="'Space Grotesk', sans-serif" mt={2}>
                    ✦ Soulbound PulseCards Minted! ✦
                  </Text>
                ) : canMintPulseCards ? (
                  <Text fontSize="lg" fontWeight="700" color="#22c55e" fontFamily="'Space Grotesk', sans-serif" mt={2} style={{ animation: "pulseAnimation 1.5s infinite" }}>
                    🔓 Achievement Unlocked!
                  </Text>
                ) : hasEntry ? (
                  <Text fontSize="sm" color="gray.400" fontFamily="'Space Grotesk', sans-serif" mt={2}>
                    {9 - piecesUnlocked} Boost{9 - piecesUnlocked !== 1 ? "s" : ""} remaining
                  </Text>
                ) : (
                  <Text fontSize="sm" color="gray.400" fontFamily="'Space Grotesk', sans-serif" mt={2}>
                    Mint PulseEntry to start your journey
                  </Text>
                )}

                {/* Cooldown Timer */}
                {hasEntry && !canBoost && piecesUnlocked < 9 && (
                  <HStack spacing={3} justify="center" bg="rgba(168,85,247,0.05)" px={4} py={2} borderRadius="full" mt={3}>
                    <Badge colorScheme="orange" variant="solid" borderRadius="full" px={2} fontSize="9px" fontFamily="'Space Mono', monospace">
                      ⏱️
                    </Badge>
                    <Text fontSize="md" color="#a855f7" fontWeight="600" fontFamily="'Space Mono', monospace">
                      {timeLeft}
                    </Text>
                  </HStack>
                )}
              </Box>

              {/* Main Action Button */}
              {isConnected ? (
                <Button
                  w="full"
                  size="lg"
                  h="56px"
                  fontSize="lg"
                  fontWeight="700"
                  fontFamily="'Space Grotesk', sans-serif"
                  bgGradient={
                    !isCorrectChain
                      ? "linear(135deg, #ef4444, #dc2626)"
                      : mainActionType === "mintPulseCards"
                        ? "linear(135deg, #a855f7, #7c3aed)"
                        : mainActionType === "mintEntry"
                          ? "linear(135deg, #8b5cf6, #6d28d9)"
                          : mainActionType === "boost"
                            ? "linear(135deg, #22c55e, #16a34a)"
                            : "linear(135deg, #6b7280, #4b5563)"
                  }
                  color="white"
                  borderRadius="xl"
                  onClick={handleMainClick}
                  isDisabled={isMainDisabled || (mainActionType === "boost" && !canBoost) || (mainActionType === "mintEntry" && hasEntry)}
                  isLoading={isTxPending}
                  _hover={
                    !isMainDisabled && mainActionType
                      ? {
                          transform: "translateY(-3px)",
                          boxShadow: `0 10px 40px ${
                            mainActionType === "mintPulseCards"
                              ? "rgba(168,85,247,0.4)"
                              : mainActionType === "boost"
                                ? "rgba(34,197,94,0.4)"
                                : "rgba(139,92,246,0.4)"
                          }`,
                        }
                      : {}
                  }
                  _active={!isMainDisabled && mainActionType ? { transform: "scale(0.97)" } : {}}
                  transition="all 0.2s"
                >
                  {!isCorrectChain ? "⚠️ Switch to Soneium" : mainButtonLabel}
                </Button>
              ) : (
                <Box w="full" p={4} textAlign="center" bg="rgba(255,255,255,0.03)" borderRadius="xl" border="1px solid rgba(255,255,255,0.06)">
                  <Text fontSize="sm" color="gray.500" fontFamily="'Space Grotesk', sans-serif">
                    Connect your wallet to start
                  </Text>
                </Box>
              )}

              {/* SBT Utility Teaser */}
              <Box
                w="full"
                bg="rgba(168,85,247,0.05)"
                border="1px solid rgba(168,85,247,0.15)"
                borderRadius="xl"
                p={4}
                _hover={{
                  borderColor: "rgba(168,85,247,0.3)",
                  bg: "rgba(168,85,247,0.08)",
                }}
                transition="all 0.3s ease"
                cursor="pointer"
                onClick={() => setIsSbtOpen(true)}
              >
                <Flex justify="space-between" align="center" wrap="wrap" gap={3}>
                  <HStack spacing={3}>
                    <Text fontSize="lg">🎯</Text>
                    <Box>
                      <Text fontSize="sm" fontWeight="600" color="white" fontFamily="'Space Grotesk', sans-serif">
                        PulseCards SBT Utility
                      </Text>
                      <Text fontSize="10px" color="gray.500" fontFamily="'Space Grotesk', sans-serif">
                        Free daily on-chain actions
                      </Text>
                    </Box>
                  </HStack>
                  <HStack spacing={2}>
                    <Badge colorScheme="green" borderRadius="full" px={2} py={0.5} fontSize="8px" fontFamily="'Space Mono', monospace">
                      ● LIVE
                    </Badge>
                    <Button size="xs" colorScheme="purple" variant="ghost" borderRadius="full" fontSize="10px" fontWeight="600">
                      Learn More →
                    </Button>
                  </HStack>
                </Flex>
              </Box>
            </VStack>
          </Flex>

          {/* ─── How It Works ─── */}
          <Box mt={16}>
            <Box
              bg="rgba(4,4,14,0.85)"
              backdropFilter="blur(20px)"
              borderRadius="2xl"
              border="1px solid rgba(255,255,255,0.06)"
              p={{ base: 5, md: 7 }}
              overflow="hidden"
              position="relative"
            >
              <Box
                position="absolute"
                top={0}
                left={0}
                right={0}
                h="2px"
                bgGradient="linear(90deg, #a855f7, #22c55e, #38bdf8, #a855f7)"
                backgroundSize="300% 100%"
                style={{ animation: "shimmerBorder 4s infinite" }}
              />

              <VStack spacing={6} align="stretch" position="relative" zIndex={1}>
                <HStack spacing={3}>
                  <Flex
                    w="34px"
                    h="34px"
                    align="center"
                    justify="center"
                    bg="rgba(168,85,247,0.1)"
                    border="1px solid rgba(168,85,247,0.2)"
                    borderRadius="lg"
                  >
                    <InfoIcon color="#a855f7" boxSize={4} />
                  </Flex>
                  <Box>
                    <Heading size="sm" color="white" fontWeight="700" fontFamily="'Space Grotesk', sans-serif">
                      How It Works
                    </Heading>
                    <Text fontSize="xs" color="gray.500" fontFamily="'Space Grotesk', sans-serif">
                      Complete the puzzle to earn your Soulbound PulseCards
                    </Text>
                  </Box>
                </HStack>

                <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
                  {[
                    {
                      num: "01",
                      icon: "🎫",
                      title: "Mint PulseEntry",
                      desc: "Mint your PulseEntry NFT (one per wallet) – your entry ticket to start the daily boosting journey",
                      color: "#a855f7",
                    },
                    {
                      num: "02",
                      icon: "⚡",
                      title: "Daily Boosts",
                      desc: "Boost once every 24 hours (max 9 times total) – each successful boost unlocks one puzzle piece",
                      color: "#22c55e",
                    },
                    {
                      num: "03",
                      icon: "🧩",
                      title: "Complete Puzzle",
                      desc: "Reach level 2 through consistent boosting and complete the 9-piece puzzle",
                      color: "#38bdf8",
                    },
                    {
                      num: "04",
                      icon: "🏆",
                      title: "Mint Soulbound",
                      desc: "Mint your permanent Soulbound PulseCards NFT – proof of daily activity on Soneium",
                      color: "#fbbf24",
                    },
                  ].map((step, index) => (
                    <MotionBox
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                      <Box
                        p={4}
                        bg="rgba(255,255,255,0.02)"
                        borderRadius="xl"
                        border="1px solid rgba(255,255,255,0.04)"
                        _hover={{
                          bg: `rgba(255,255,255,0.04)`,
                          borderColor: `${step.color}30`,
                          transform: "translateY(-4px)",
                        }}
                        transition="all 0.3s ease"
                      >
                        <VStack align="start" spacing={2}>
                          <HStack spacing={2}>
                            <Text fontSize="18px">{step.icon}</Text>
                            <Badge
                              colorScheme="purple"
                              variant="subtle"
                              fontSize="9px"
                              px={2}
                              py={0.5}
                              borderRadius="full"
                              fontFamily="'Space Mono', monospace"
                              color={step.color}
                            >
                              {step.num}
                            </Badge>
                          </HStack>
                          <Text fontWeight="700" fontSize="sm" color="white" fontFamily="'Space Grotesk', sans-serif">
                            {step.title}
                          </Text>
                          <Text fontSize="xs" color="gray.400" lineHeight="1.5" fontFamily="'Space Grotesk', sans-serif">
                            {step.desc}
                          </Text>
                        </VStack>
                      </Box>
                    </MotionBox>
                  ))}
                </SimpleGrid>
              </VStack>
            </Box>
          </Box>

          {/* Footer */}
          <Footer />
        </Container>
      </Box>

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={txOpen}
        status={txStatus}
        title={txTitle}
        description={txDesc}
        onClose={() => setTxOpen(false)}
      />

      {/* SBT Modal */}
      <SbtModal isOpen={isSbtOpen} onClose={() => setIsSbtOpen(false)} />
    </>
  );
}

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
  Skeleton,
  Link,
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
  useBalance,
} from "wagmi";
import { useState, useEffect, useMemo, useRef } from "react";
import { ChevronLeftIcon, InfoIcon, CheckCircleIcon, CopyIcon, ExternalLinkIcon } from "@chakra-ui/icons";
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
const TOTAL_PIECES = 9;

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

// Shown in place of any NFT art image while it's loading or if the IPFS gateway is
// slow/unreachable — better than a broken-image icon.
const IMAGE_FALLBACK =
  "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><rect width='200' height='200' fill='%23120a1f'/><text y='54%25' x='50%25' text-anchor='middle' dominant-baseline='middle' font-size='64'>🧩</text></svg>";

const SONEIUM_ADDRESS_EXPLORER = "https://soneium.blockscout.com/address/";

const CONTRACTS_INFO = [
  { name: "PulseEntry", description: "Entry NFT · daily boosts", address: PULSE_ENTRY_ADDRESS },
  { name: "PulseCards", description: "Soulbound completion badge", address: PULSE_CARDS_ADDRESS },
] as const;

// ============= Motion =============
const MotionBox = motion(Box);

// ============= Styles =============
const pageStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700;800&family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap');

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
  @keyframes auroraDrift {
    0%   { transform: translateX(-50%) rotate(0deg); }
    100% { transform: translateX(-50%) rotate(360deg); }
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
  @keyframes progressShimmer {
    0%   { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
  @keyframes progressGlow {
    0%   { background-position: 0% 50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  @keyframes completePulse {
    0%, 100% { transform: scale(1); }
    50%      { transform: scale(1.08); }
  }
  @keyframes starFloat {
    0%, 100% { transform: translateY(0) rotate(0deg); }
    50%      { transform: translateY(-4px) rotate(10deg); }
  }
  @keyframes progressPop {
    0%   { opacity: 0; transform: scale(0.5); }
    70%  { opacity: 1; transform: scale(1.2); }
    100% { opacity: 1; transform: scale(1); }
  }
`;

// ============= Compact Stat Chip =============
// Redesigned to sit as a tight metrics strip under the hero headline — a single thin
// gradient top-line and a restrained icon chip instead of the previous stack of
// competing radial glows + a permanently bobbing icon, which read as busy/noisy.
const StatCard = ({ stat, index }: { stat: any; index: number }) => (
  <MotionBox
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.45, delay: index * 0.06 }}
    h="full"
  >
    <Box
      bg="rgba(255,255,255,0.02)"
      backdropFilter="blur(20px)"
      borderRadius="xl"
      p={{ base: 3.5, md: 4 }}
      border="1px solid rgba(255,255,255,0.07)"
      position="relative"
      overflow="hidden"
      h="full"
      _hover={{ borderColor: `${stat.color}45`, transform: "translateY(-3px)" }}
      transition="all 0.3s ease"
    >
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        h="1px"
        bg={`linear-gradient(90deg, transparent, ${stat.color}80, transparent)`}
      />
      <HStack spacing={3} align="center">
        <Flex
          align="center"
          justify="center"
          w={{ base: "34px", md: "38px" }}
          h={{ base: "34px", md: "38px" }}
          bg={`${stat.color}12`}
          border={`1px solid ${stat.color}28`}
          borderRadius="lg"
          flexShrink={0}
          fontSize={{ base: "15px", md: "17px" }}
        >
          {stat.icon}
        </Flex>
        <Box flex="1" minW="0">
          <Text
            fontSize="9px"
            color="gray.500"
            textTransform="uppercase"
            letterSpacing="0.16em"
            fontFamily="'Space Mono', monospace"
            fontWeight="700"
            mb={0.5}
          >
            {stat.label}
          </Text>
          {stat.isLoading ? (
            <Skeleton
              height="18px"
              width="46px"
              borderRadius="md"
              startColor="rgba(255,255,255,0.04)"
              endColor="rgba(255,255,255,0.16)"
            />
          ) : (
            <Text
              fontSize={{ base: "md", md: "lg" }}
              fontWeight="800"
              color="white"
              fontFamily="'Space Mono', monospace"
              letterSpacing="-0.01em"
              lineHeight="1.1"
              style={{ animation: "countUp 0.5s ease-out forwards" }}
            >
              {stat.value}
            </Text>
          )}
        </Box>
      </HStack>
    </Box>
  </MotionBox>
);

// ============= Milestone Tracker =============
// Replaces the previous plain 9-dot row with a connected node path — each node shows
// its step number until completed (then a checkmark), the current "next" node pulses
// gently when a boost is available, and a gradient fill line tracks overall progress.
const MilestoneTracker = ({
  piecesUnlocked,
  cooldownReady,
}: {
  piecesUnlocked: number;
  cooldownReady: boolean;
}) => {
  const progressPct = (piecesUnlocked / TOTAL_PIECES) * 100;

  return (
    <Box position="relative" py={2} px={{ base: 1, md: 2 }}>
      <Box
        position="absolute"
        top="50%"
        left="4%"
        right="4%"
        h="2px"
        bg="rgba(255,255,255,0.08)"
        transform="translateY(-50%)"
        borderRadius="full"
      />
      <Box
        position="absolute"
        top="50%"
        left="4%"
        h="2px"
        bgGradient="linear(90deg, #a855f7, #22c55e)"
        transform="translateY(-50%)"
        width={`${(progressPct / 100) * 92}%`}
        transition="width 0.8s cubic-bezier(0.4, 0, 0.2, 1)"
        borderRadius="full"
      />
      <Flex justify="space-between" position="relative" px={{ base: "2%", md: "4%" }}>
        {Array.from({ length: TOTAL_PIECES }).map((_, i) => {
          const step = i + 1;
          const isDone = step <= piecesUnlocked;
          const isNext = step === piecesUnlocked + 1 && piecesUnlocked < TOTAL_PIECES;
          return (
            <Flex
              key={step}
              w={{ base: "20px", md: "26px" }}
              h={{ base: "20px", md: "26px" }}
              borderRadius="full"
              align="center"
              justify="center"
              bg={isDone ? "linear-gradient(135deg, #22c55e, #4ade80)" : "rgba(10,10,20,0.9)"}
              border={isNext ? "2px solid #a855f7" : isDone ? "none" : "1px solid rgba(255,255,255,0.14)"}
              boxShadow={
                isNext && cooldownReady
                  ? "0 0 14px rgba(168,85,247,0.55)"
                  : isDone
                    ? "0 0 8px rgba(34,197,94,0.35)"
                    : "none"
              }
              animation={isNext && cooldownReady ? "completePulse 1.4s ease-in-out infinite" : "none"}
              fontSize={{ base: "9px", md: "10px" }}
              fontWeight="800"
              color={isDone ? "#052e0f" : isNext ? "#e9d5ff" : "gray.600"}
              fontFamily="'Space Mono', monospace"
              transition="all 0.3s ease"
              flexShrink={0}
            >
              {isDone ? "✓" : step}
            </Flex>
          );
        })}
      </Flex>
    </Box>
  );
};

// ============= Contract Transparency Row =============
const ContractRow = ({
  name,
  description,
  address,
}: {
  name: string;
  description: string;
  address: string;
}) => {
  const toast = useToast();
  const short = `${address.slice(0, 6)}...${address.slice(-4)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      toast({
        title: `${name} address copied`,
        status: "success",
        duration: 2000,
        isClosable: true,
        position: "top-right",
      });
    } catch {
      toast({ title: "Could not copy address", status: "error", duration: 2000, isClosable: true, position: "top-right" });
    }
  };

  return (
    <Flex
      justify="space-between"
      align="center"
      py={3}
      borderBottom="1px solid rgba(255,255,255,0.05)"
      _last={{ borderBottom: "none" }}
      flexWrap="wrap"
      gap={2}
    >
      <HStack spacing={2.5}>
        <CheckCircleIcon color="#4ade80" boxSize={3.5} />
        <Box>
          <Text fontSize="xs" color="white" fontWeight="700" fontFamily="'Space Grotesk', sans-serif">
            {name}
          </Text>
          <Text fontSize="10px" color="gray.500" fontFamily="'Space Grotesk', sans-serif">
            {description}
          </Text>
        </Box>
      </HStack>
      <HStack spacing={1}>
        <Text fontSize="11px" color="gray.500" fontFamily="'Space Mono', monospace" mr={1}>
          {short}
        </Text>
        <Button
          size="xs"
          variant="ghost"
          onClick={handleCopy}
          minW="auto"
          h="24px"
          px={1.5}
          color="gray.500"
          _hover={{ color: "white", bg: "rgba(255,255,255,0.06)" }}
          aria-label={`Copy ${name} contract address`}
        >
          <CopyIcon boxSize={3} />
        </Button>
        <Link href={`${SONEIUM_ADDRESS_EXPLORER}${address}`} isExternal aria-label={`View ${name} on explorer`}>
          <Button
            size="xs"
            variant="ghost"
            minW="auto"
            h="24px"
            px={1.5}
            color="gray.500"
            _hover={{ color: "white", bg: "rgba(255,255,255,0.06)" }}
          >
            <ExternalLinkIcon boxSize={3} />
          </Button>
        </Link>
      </HStack>
    </Flex>
  );
};

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
            { label: "Protocol", value: "ERC-8004" },
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
            © {currentYear} · Agent Protocol · All rights reserved
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
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const toast = useToast();
  const navigate = useNavigate();

  const [isSbtOpen, setIsSbtOpen] = useState(false);
  const [isTxPending, setIsTxPending] = useState(false);
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

  const {
    data: entryLevel = 0n,
    isLoading: isEntryLevelLoading,
    refetch: refetchEntryLevel,
  } = useReadContract({
    address: PULSE_ENTRY_ADDRESS,
    abi: PULSE_ENTRY_ABI,
    functionName: "getLevel",
    args: [address!],
    query: { enabled },
  });

  const {
    data: boostCountRaw = 0n,
    isLoading: isBoostCountLoading,
    refetch: refetchBoost,
  } = useReadContract({
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

  // Native balance on Soneium — used to warn before the user signs a transaction they
  // can't actually afford, instead of letting the wallet reject it after the fact.
  const { data: nativeBalance, isLoading: isBalanceLoading } = useBalance({
    address,
    chainId: soneiumChain.id,
    query: { enabled: !!address && isConnected },
  });

  // ===== Computed =====
  const boostCount = Number(boostCountRaw);
  const hasEntry = entryLevel > 0n;
  const hasMintedPulseCards = ownsPulseCards > 0n;
  const piecesUnlocked = Math.min(boostCount, TOTAL_PIECES);
  const canMintPulseCards = piecesUnlocked >= TOTAL_PIECES && entryLevel >= 2n && !hasMintedPulseCards;
  const isStatsLoading = enabled && (isEntryLevelLoading || isBoostCountLoading);

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

  const canBoost = hasEntry && cooldownReady && piecesUnlocked < TOTAL_PIECES;

  // ===== Auto-switch from URL (?chainId=1868) =====
  // Only attempted once per page load — if the user rejects the switch, we don't keep
  // re-prompting on every unrelated chain change. The "Wrong Network" banner below still
  // gives them a manual retry button either way. Uses switchChainAsync specifically so
  // the try/catch below can actually catch a rejection — the non-async `switchChain`
  // mutate function returns void, not a promise, so awaiting/catching its return value
  // (as the previous version of this effect did) never actually worked.
  const hasAttemptedAutoSwitchRef = useRef(false);

  useEffect(() => {
    if (hasAttemptedAutoSwitchRef.current) return;

    const params = new URLSearchParams(window.location.search);
    const rawChainId = params.get("chainId");
    if (!rawChainId) return;

    const parsed = Number(rawChainId);
    if (!Number.isFinite(parsed) || parsed !== soneiumChain.id) return;
    if (chainId === soneiumChain.id) return;

    hasAttemptedAutoSwitchRef.current = true;

    (async () => {
      try {
        await switchChainAsync?.({ chainId: soneiumChain.id });
      } catch {
        // Silent — this is an unsolicited background attempt, not a user-initiated
        // action. The "Wrong Network" banner already offers a manual, explicit retry.
      }
    })();
  }, [chainId, switchChainAsync]);

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

        // Refetch everything, and — for boosts — use the *actual* refetched count (not a
        // client-side guess) to decide whether this action just completed the puzzle.
        const [, boostResult] = await Promise.all([
          refetchEntryLevel(),
          refetchBoost(),
          refetchLastBoost(),
          refetchToken(),
          refetchPulseCards(),
        ]);

        if (type === "boost") {
          const refreshedCount = Number(boostResult.data ?? boostCountRaw);
          if (Math.min(refreshedCount, TOTAL_PIECES) === TOTAL_PIECES && !hasMintedPulseCards) {
            confetti({ particleCount: 180, spread: 90, origin: { y: 0.6 } });
          }
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
      await switchChainAsync({ chainId: soneiumChain.id });
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
      value: `${piecesUnlocked}/${TOTAL_PIECES}`,
      icon: "🧩",
      color: "#a855f7",
      isLoading: isStatsLoading,
    },
    {
      label: "Boosts",
      value: boostCount.toString(),
      icon: "⚡",
      color: "#4ade80",
      isLoading: isStatsLoading,
    },
    {
      label: "Level",
      value: entryLevel.toString(),
      icon: "⭐",
      color: "#fbbf24",
      isLoading: isStatsLoading,
    },
    {
      label: "Status",
      value: hasMintedPulseCards ? "Minted" : hasEntry ? "Active" : "Not Started",
      icon: hasMintedPulseCards ? "🏆" : hasEntry ? "🟢" : "⏳",
      color: hasMintedPulseCards ? "#4ade80" : hasEntry ? "#2dd4bf" : "#6b7280",
      isLoading: isStatsLoading,
    },
  ], [piecesUnlocked, boostCount, entryLevel, hasMintedPulseCards, hasEntry, isStatsLoading]);

  // ===== Button Logic =====
  let mainButtonLabel = "";
  let mainActionType: "mintEntry" | "boost" | "mintPulseCards" | null = null;
  let isMainDisabled = isTxPending;

  if (isConnected) {
    if (!isCorrectChain) {
      mainButtonLabel = "Switch to Soneium";
    } else if (!hasEntry) {
      if (isPaused) {
        mainButtonLabel = "⏸ Contract Paused";
        isMainDisabled = true;
      } else {
        mainButtonLabel = "Mint PulseEntry";
        mainActionType = "mintEntry";
      }
    } else if (canBoost) {
      if (isPaused) {
        mainButtonLabel = "⏸ Contract Paused";
        isMainDisabled = true;
      } else {
        mainButtonLabel = `Boost Now · ${piecesUnlocked}/${TOTAL_PIECES}`;
        mainActionType = "boost";
      }
    } else if (canMintPulseCards) {
      mainButtonLabel = "🌟 Mint Soulbound Badge";
      mainActionType = "mintPulseCards";
    } else if (hasMintedPulseCards) {
      mainButtonLabel = "✨ Already Minted";
      isMainDisabled = true;
    } else {
      mainButtonLabel = "⏳ Cooldown";
      isMainDisabled = true;
    }
  }

  // Fee for whichever action the main button currently represents — shown to the user
  // before they click, and used for the insufficient-balance check below.
  const currentFee: bigint | undefined =
    mainActionType === "mintEntry"
      ? (mintFee as bigint | undefined)
      : mainActionType === "boost"
        ? (boostFee as bigint | undefined)
        : mainActionType === "mintPulseCards"
          ? (pulseCardsFee as bigint | undefined)
          : undefined;

  const hasInsufficientBalance =
    isConnected &&
    isCorrectChain &&
    !!mainActionType &&
    currentFee !== undefined &&
    !isBalanceLoading &&
    nativeBalance?.value !== undefined &&
    nativeBalance.value < currentFee;

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

      <Box
        minH="100vh"
        bgGradient="linear(180deg, #05040d 0%, #030309 45%, #050308 100%)"
        position="relative"
        fontFamily="'Space Grotesk', sans-serif"
        overflowX="hidden"
      >
        {/* ─── Background layers ─── */}
        <Box
          position="fixed"
          top="-8%"
          left="50%"
          w="1000px"
          h="580px"
          pointerEvents="none"
          zIndex={0}
          bg="conic-gradient(from 180deg at 50% 50%, rgba(168,85,247,0.26), rgba(34,197,94,0.2), rgba(56,189,248,0.2), rgba(168,85,247,0.26))"
          filter="blur(90px)"
          opacity={0.85}
          style={{ animation: "auroraDrift 24s linear infinite" }}
        />
        <Box
          position="fixed"
          top="10%"
          left="-15%"
          w="600px"
          h="600px"
          borderRadius="full"
          bg="radial-gradient(circle, rgba(56,189,248,0.13) 0%, transparent 65%)"
          filter="blur(100px)"
          style={{ animation: "orbFloat 26s ease-in-out infinite" }}
          zIndex={0}
          pointerEvents="none"
        />
        <Box
          position="fixed"
          bottom="-12%"
          right="-10%"
          w="700px"
          h="700px"
          borderRadius="full"
          bg="radial-gradient(circle, rgba(34,197,94,0.13) 0%, transparent 65%)"
          filter="blur(110px)"
          style={{ animation: "orbFloat 30s ease-in-out infinite 8s" }}
          zIndex={0}
          pointerEvents="none"
        />
        {/* mid-page accent — keeps color energy going further down instead of fading
            to flat black once you scroll past the hero */}
        <Box
          position="absolute"
          top="70%"
          left="50%"
          transform="translateX(-50%)"
          w="900px"
          h="500px"
          borderRadius="full"
          bg="radial-gradient(circle, rgba(168,85,247,0.1) 0%, transparent 70%)"
          filter="blur(120px)"
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
          opacity={0.02}
          bgImage="radial-gradient(rgba(255,255,255,0.9) 1px, transparent 1px)"
          bgSize="32px 32px"
        />
        {/* fine grain texture — adds material depth instead of a flat color field */}
        <Box
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          zIndex={0}
          pointerEvents="none"
          opacity={0.035}
          mixBlendMode="overlay"
          bgImage={`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`}
        />
        {/* vignette — focuses attention toward the center instead of a uniform flat field */}
        <Box
          position="fixed"
          inset={0}
          zIndex={0}
          pointerEvents="none"
          bg="radial-gradient(ellipse at 50% 30%, transparent 45%, rgba(0,0,0,0.55) 100%)"
        />


        <Container maxW="1280px" position="relative" zIndex={1} px={{ base: 3, md: 6, lg: 8 }} py={{ base: 4, md: 8 }}>
          {/* ─── Header ─── */}
          <Flex
            justify="space-between"
            align="center"
            mb={{ base: 6, md: 8 }}
            direction={{ base: "column", md: "row" }}
            gap={{ base: 3, md: 0 }}
          >
            <HStack spacing={4}>
              <Button
                onClick={() => navigate("/")}
                variant="ghost"
                size={{ base: "sm", md: "md" }}
                leftIcon={<ChevronLeftIcon />}
                color="gray.300"
                _hover={{
                  color: "white",
                  bg: "rgba(168,85,247,0.12)",
                  borderColor: "rgba(168,85,247,0.5)",
                }}
                borderRadius="xl"
                border="1px solid rgba(168,85,247,0.28)"
                fontFamily="'Space Grotesk', sans-serif"
                fontWeight="500"
                transition="all 0.2s"
              >
                Back
              </Button>

              <Box h="36px" w="1px" bg="rgba(255,255,255,0.05)" display={{ base: "none", md: "block" }} />

              <HStack spacing={2.5}>
                <Box
                  w="7px"
                  h="7px"
                  borderRadius="full"
                  bg="#4ade80"
                  boxShadow="0 0 8px rgba(74,222,128,0.8)"
                  style={{ animation: "pulseGlow 2.5s ease-in-out infinite" }}
                />
                <Text
                  fontSize={{ base: "sm", md: "md" }}
                  fontWeight="700"
                  color="white"
                  letterSpacing="-0.01em"
                  fontFamily="'Space Grotesk', sans-serif"
                >
                  PulseCards
                </Text>
                <Badge
                  bgGradient="linear(135deg, rgba(168,85,247,0.55), rgba(56,189,248,0.4), rgba(34,197,94,0.45), rgba(168,85,247,0.55))"
                  backgroundSize="300% auto"
                  color="#f5f3ff"
                  fontSize="11px"
                  fontWeight="800"
                  px={3.5}
                  py={1.5}
                  borderRadius="full"
                  border="1px solid rgba(196,181,253,0.6)"
                  fontFamily="'Space Mono', monospace"
                  letterSpacing="0.03em"
                  boxShadow="0 0 20px rgba(168,85,247,0.5), 0 0 8px rgba(56,189,248,0.3)"
                  style={{ animation: "shimmerBorder 2.5s linear infinite, pulseGlow 2s ease-in-out infinite" }}
                >
                  ✨ Season 10
                </Badge>
              </HStack>
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

          {/* ─── Hero ─── */}
          <Box mb={{ base: 10, md: 14 }}>
            <MotionBox initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <VStack spacing={4} textAlign="center" maxW="700px" mx="auto" mb={{ base: 7, md: 9 }}>
                <Badge
                  bg="rgba(168,85,247,0.1)"
                  color="#c4b5fd"
                  fontSize="10px"
                  px={3}
                  py={1.5}
                  borderRadius="full"
                  border="1px solid rgba(168,85,247,0.25)"
                  fontFamily="'Space Mono', monospace"
                  letterSpacing="0.1em"
                >
                  <HStack spacing={1.5} align="center">
                    <Image
                      src="/soneium.png"
                      alt="Soneium"
                      boxSize="14px"
                      borderRadius="full"
                      fallbackSrc={IMAGE_FALLBACK}
                    />
                    <Text as="span">SONEIUM · SOULBOUND IDENTITY</Text>
                  </HStack>
                </Badge>
                <Heading
                  fontSize={{ base: "3xl", md: "5xl" }}
                  fontWeight="800"
                  letterSpacing="-0.03em"
                  lineHeight="1.1"
                  bgGradient="linear(120deg, #f5f3ff 0%, #c4b5fd 35%, #86efac 70%, #f5f3ff 100%)"
                  backgroundSize="220% auto"
                  bgClip="text"
                  fontFamily="'Space Grotesk', sans-serif"
                  style={{ animation: "shimmerBorder 7s linear infinite" }}
                >
                  Turn daily consistency
                  <br />
                  into permanent proof.
                </Heading>
                <Text fontSize={{ base: "sm", md: "md" }} color="gray.400" fontFamily="'Space Grotesk', sans-serif" maxW="540px" lineHeight="1.7">
                  Mint your PulseEntry, boost once a day for nine days, and earn a
                  non-transferable PulseCards badge — on-chain reputation that can't be
                  bought, only earned.
                </Text>
              </VStack>
            </MotionBox>

            <MotionBox initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}>
              <SimpleGrid columns={{ base: 2, md: 4 }} spacing={{ base: 2.5, md: 4 }}>
                {stats.map((stat, i) => (
                  <StatCard key={stat.label} stat={stat} index={i} />
                ))}
              </SimpleGrid>
            </MotionBox>
          </Box>

          {/* ─── Main Content ─── */}
          <Flex
            direction={{ base: "column", lg: "row" }}
            gap={{ base: 8, lg: 8 }}
            align={{ base: "center", lg: "flex-start" }}
            justify="center"
          >
            {/* LEFT — Puzzle */}
            <Box flex="1.15" w="full" minW="0" maxW={{ lg: "680px" }}>
              <Box
                bg="rgba(4,4,14,0.85)"
                backdropFilter="blur(20px)"
                borderRadius="2xl"
                border="1px solid rgba(255,255,255,0.07)"
                p={{ base: 3, md: 4 }}
                position="relative"
                overflow="hidden"
                _hover={{ borderColor: "rgba(168,85,247,0.25)" }}
                transition="all 0.35s ease"
              >
                <Box
                  position="absolute"
                  top={0}
                  left={0}
                  right={0}
                  h="1px"
                  bgGradient="linear(90deg, transparent, rgba(168,85,247,0.5), transparent)"
                />
                <VStack spacing={4} align="stretch">
                  <HStack justify="space-between" w="full" px={1}>
                    <Heading size="sm" color="white" fontFamily="'Space Grotesk', sans-serif" fontWeight="700">
                      🧩 Pulse Puzzle
                    </Heading>
                    <Badge
                      bg="rgba(168,85,247,0.12)"
                      color="#c4b5fd"
                      fontSize="10px"
                      px={3}
                      py={1}
                      borderRadius="full"
                      fontFamily="'Space Mono', monospace"
                    >
                      {piecesUnlocked}/{TOTAL_PIECES}
                    </Badge>
                  </HStack>

                  <Box w="full" overflow="hidden" borderRadius="xl" position="relative">
                    <PuzzleGrid piecesUnlocked={piecesUnlocked} images={PUZZLE_IMAGES} />
                  </Box>

                  {/* Progress bar */}
                  <Box w="full" px={1}>
                    <Box position="relative" mb={2}>
                      <Progress
                        value={(piecesUnlocked / TOTAL_PIECES) * 100}
                        size="sm"
                        colorScheme="green"
                        bg="rgba(255,255,255,0.05)"
                        borderRadius="full"
                        sx={{
                          "& > div": {
                            bgGradient: piecesUnlocked === TOTAL_PIECES
                              ? "linear(135deg, #22c55e, #4ade80, #22c55e)"
                              : "linear(135deg, #a855f7, #22c55e)",
                            borderRadius: "full",
                            transition: "width 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
                            backgroundSize: piecesUnlocked === TOTAL_PIECES ? "200% 100%" : "100%",
                            animation: piecesUnlocked === TOTAL_PIECES ? "progressGlow 1.5s ease-in-out infinite" : "none",
                            position: "relative",
                            "&::after": {
                              content: '""',
                              position: "absolute",
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)",
                              animation: "progressShimmer 2.5s ease-in-out infinite",
                            },
                          },
                        }}
                      />
                    </Box>

                    {/* Milestone node tracker — replaces the old plain dot row */}
                    <MilestoneTracker piecesUnlocked={piecesUnlocked} cooldownReady={cooldownReady} />

                    {piecesUnlocked === TOTAL_PIECES ? (
                      <HStack spacing={2} justify="center" mt={2}>
                        <Text fontSize="16px" animation="starFloat 1.5s ease-in-out infinite">⭐</Text>
                        <Text fontSize="13px" color="#4ade80" fontWeight="700" fontFamily="'Space Grotesk', sans-serif" animation="completePulse 1.2s ease-in-out infinite">
                          Puzzle Complete!
                        </Text>
                        <Text fontSize="16px" animation="starFloat 1.5s ease-in-out infinite" style={{ animationDelay: "0.3s" }}>⭐</Text>
                      </HStack>
                    ) : cooldownReady && piecesUnlocked > 0 ? (
                      <Text
                        fontSize="9px"
                        color="#22c55e"
                        fontFamily="'Space Mono', monospace"
                        textAlign="center"
                        mt={2}
                        animation="progressPop 0.4s ease-out"
                        fontWeight="600"
                      >
                        ⚡ Boost ready — click to unlock the next piece
                      </Text>
                    ) : null}
                  </Box>

                  {piecesUnlocked > 0 && piecesUnlocked < TOTAL_PIECES && (
                    <HStack spacing={2} justify="center" w="full" flexWrap="wrap">
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
                      {cooldownReady && hasEntry && (
                        <Badge colorScheme="green" borderRadius="full" px={3} py={1} fontSize="9px" fontFamily="'Space Mono', monospace">
                          ✅ Ready to Boost
                        </Badge>
                      )}
                    </HStack>
                  )}
                </VStack>
              </Box>
            </Box>

            {/* RIGHT — Preview & Actions */}
            <Box flex="1" w="full" maxW={{ lg: "440px" }}>
              <VStack spacing={5} align="stretch" w="full">
                <Box
                  w="full"
                  bg="linear-gradient(180deg, rgba(22,16,36,0.92) 0%, rgba(4,4,14,0.94) 100%)"
                  backdropFilter="blur(24px)"
                  borderRadius="24px"
                  border="1px solid"
                  borderColor={
                    hasMintedPulseCards
                      ? "rgba(74,222,128,0.35)"
                      : canMintPulseCards
                        ? "rgba(74,222,128,0.28)"
                        : hasEntry
                          ? "rgba(168,85,247,0.25)"
                          : "rgba(255,255,255,0.08)"
                  }
                  p={{ base: 5, md: 6 }}
                  textAlign="center"
                  position="relative"
                  overflow="visible"
                  boxShadow="0 24px 60px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.05)"
                  transition="all 0.5s ease"
                  _hover={{ borderColor: hasEntry ? "rgba(168,85,247,0.45)" : "rgba(255,255,255,0.14)" }}
                >
                  {/* corner accents — a small HUD-style detail that reads as more "engineered" */}
                  <Box position="absolute" top="14px" left="14px" w="14px" h="14px" borderTop="2px solid" borderLeft="2px solid" borderColor="rgba(168,85,247,0.35)" borderTopLeftRadius="6px" pointerEvents="none" />
                  <Box position="absolute" top="14px" right="14px" w="14px" h="14px" borderTop="2px solid" borderRight="2px solid" borderColor="rgba(168,85,247,0.35)" borderTopRightRadius="6px" pointerEvents="none" />
                  <Box position="absolute" bottom="14px" left="14px" w="14px" h="14px" borderBottom="2px solid" borderLeft="2px solid" borderColor="rgba(168,85,247,0.2)" borderBottomLeftRadius="6px" pointerEvents="none" />
                  <Box position="absolute" bottom="14px" right="14px" w="14px" h="14px" borderBottom="2px solid" borderRight="2px solid" borderColor="rgba(168,85,247,0.2)" borderBottomRightRadius="6px" pointerEvents="none" />

                  <Box
                    position="absolute"
                    top={0}
                    left={0}
                    right={0}
                    h="1px"
                    bgGradient={
                      hasMintedPulseCards
                        ? "linear(90deg, transparent, #4ade80, transparent)"
                        : canMintPulseCards
                          ? "linear(90deg, transparent, #22c55e, transparent)"
                          : hasEntry
                            ? "linear(90deg, transparent, #a855f7, transparent)"
                            : "linear(90deg, transparent, #6b7280, transparent)"
                    }
                  />

                  {hasEntry && (
                    <Box
                      position="absolute"
                      top="-16px"
                      left="50%"
                      transform="translateX(-50%)"
                      bg="linear-gradient(135deg, rgba(168,85,247,0.28), rgba(139,92,246,0.16))"
                      backdropFilter="blur(12px)"
                      px={4}
                      py={1.5}
                      borderRadius="full"
                      border="1px solid rgba(168,85,247,0.5)"
                      whiteSpace="nowrap"
                      boxShadow="0 4px 24px rgba(168,85,247,0.25), inset 0 1px 0 rgba(255,255,255,0.1)"
                      zIndex={10}
                    >
                      <HStack spacing={2}>
                        <Image
                          src={PULSE_ENTRY_IMAGE}
                          alt="PulseEntry"
                          boxSize="18px"
                          borderRadius="full"
                          objectFit="cover"
                          border="1px solid rgba(255,255,255,0.25)"
                          fallbackSrc={IMAGE_FALLBACK}
                        />
                        <Text fontSize="10px" fontWeight="700" color="#e9d5ff" fontFamily="'Space Mono', monospace" letterSpacing="0.06em">
                          PULSEENTRY VERIFIED
                        </Text>
                        <CheckCircleIcon color="#c4b5fd" boxSize={2.5} />
                      </HStack>
                    </Box>
                  )}

                  <Box pt={hasEntry ? 8 : 0} position="relative">
                    {hasEntry ? (
                      <Box position="relative" display="inline-block">
                        <Image
                          src={PULSECARDS_SOULBOUND_IMAGE}
                          alt="PulseCards Soulbound"
                          boxSize={{ base: "170px", md: "200px" }}
                          objectFit="contain"
                          mx="auto"
                          fallbackSrc={IMAGE_FALLBACK}
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
                              {TOTAL_PIECES - piecesUnlocked} Boost{TOTAL_PIECES - piecesUnlocked !== 1 ? "s" : ""} remaining
                            </Badge>
                          </Box>
                        )}
                      </Box>
                    ) : (
                      <Image
                        src={PULSE_ENTRY_IMAGE}
                        alt="PulseEntry Preview"
                        boxSize={{ base: "190px", md: "220px" }}
                        objectFit="contain"
                        mx="auto"
                        borderRadius="2xl"
                        boxShadow="0 0 40px rgba(168,85,247,0.18)"
                        fallbackSrc={IMAGE_FALLBACK}
                      />
                    )}
                  </Box>

                  {hasMintedPulseCards ? (
                    <Text fontSize="md" fontWeight="700" color="#4ade80" fontFamily="'Space Grotesk', sans-serif" mt={3}>
                      ✦ Soulbound PulseCards Minted ✦
                    </Text>
                  ) : canMintPulseCards ? (
                    <Text fontSize="md" fontWeight="700" color="#22c55e" fontFamily="'Space Grotesk', sans-serif" mt={3} style={{ animation: "pulseAnimation 1.5s infinite" }}>
                      🔓 Achievement Unlocked
                    </Text>
                  ) : hasEntry ? (
                    <HStack justify="center" spacing={2} mt={3}>
                      <Badge
                        bg="rgba(168,85,247,0.1)"
                        color="#c4b5fd"
                        fontSize="10px"
                        px={2.5}
                        py={1}
                        borderRadius="full"
                        border="1px solid rgba(168,85,247,0.2)"
                        fontFamily="'Space Mono', monospace"
                      >
                        {TOTAL_PIECES - piecesUnlocked} Boost{TOTAL_PIECES - piecesUnlocked !== 1 ? "s" : ""} remaining
                      </Badge>
                    </HStack>
                  ) : (
                    <Text fontSize="sm" color="gray.400" fontFamily="'Space Grotesk', sans-serif" mt={3}>
                      Mint PulseEntry to start your journey
                    </Text>
                  )}

                  {hasEntry && !canBoost && piecesUnlocked < TOTAL_PIECES && (
                    <Box
                      mt={4}
                      bg="linear-gradient(135deg, rgba(168,85,247,0.08), rgba(139,92,246,0.04))"
                      border="1px solid rgba(168,85,247,0.2)"
                      borderRadius="16px"
                      px={5}
                      py={3}
                    >
                      <Text
                        fontSize="8px"
                        color="gray.500"
                        textTransform="uppercase"
                        letterSpacing="0.18em"
                        fontFamily="'Space Mono', monospace"
                        mb={1}
                      >
                        ⏱ Next boost available in
                      </Text>
                      <Text
                        fontSize="xl"
                        color="#c4b5fd"
                        fontWeight="800"
                        fontFamily="'Space Mono', monospace"
                        letterSpacing="0.03em"
                      >
                        {timeLeft}
                      </Text>
                    </Box>
                  )}
                </Box>

                {/* Entry Details — fills out the panel with real, useful info instead of
                    empty space, and doubles as another small transparency touch. */}
                {hasEntry && (
                  <Box
                    w="full"
                    bg="rgba(255,255,255,0.02)"
                    border="1px solid rgba(255,255,255,0.07)"
                    borderRadius="16px"
                    p={4}
                  >
                    <Text
                      fontSize="9px"
                      color="gray.500"
                      textTransform="uppercase"
                      letterSpacing="0.16em"
                      fontFamily="'Space Mono', monospace"
                      fontWeight="700"
                      mb={2.5}
                    >
                      Entry Details
                    </Text>
                    <VStack spacing={2} align="stretch">
                      <Flex justify="space-between" align="center">
                        <Text fontSize="xs" color="gray.500" fontFamily="'Space Grotesk', sans-serif">
                          Token ID
                        </Text>
                        <Text fontSize="xs" color="gray.200" fontFamily="'Space Mono', monospace">
                          #{entryTokenId !== undefined ? entryTokenId.toString() : "—"}
                        </Text>
                      </Flex>
                      <Flex justify="space-between" align="center">
                        <Text fontSize="xs" color="gray.500" fontFamily="'Space Grotesk', sans-serif">
                          Level
                        </Text>
                        <Badge
                          bg="rgba(251,191,36,0.1)"
                          color="#fbbf24"
                          fontSize="9px"
                          px={2}
                          py={0.5}
                          borderRadius="full"
                          fontFamily="'Space Mono', monospace"
                        >
                          ⭐ {entryLevel.toString()}
                        </Badge>
                      </Flex>
                      <Flex justify="space-between" align="center">
                        <Text fontSize="xs" color="gray.500" fontFamily="'Space Grotesk', sans-serif">
                          Puzzle Progress
                        </Text>
                        <Text fontSize="xs" color="gray.200" fontFamily="'Space Mono', monospace">
                          {piecesUnlocked}/{TOTAL_PIECES} pieces
                        </Text>
                      </Flex>
                      <Flex justify="space-between" align="center">
                        <Text fontSize="xs" color="gray.500" fontFamily="'Space Grotesk', sans-serif">
                          Network
                        </Text>
                        <HStack spacing={1.5}>
                          <Box w="6px" h="6px" borderRadius="full" bg="#4ade80" boxShadow="0 0 6px rgba(74,222,128,0.7)" />
                          <Text fontSize="xs" color="gray.200" fontFamily="'Space Mono', monospace">
                            Soneium
                          </Text>
                        </HStack>
                      </Flex>
                      <Flex justify="space-between" align="center">
                        <Text fontSize="xs" color="gray.500" fontFamily="'Space Grotesk', sans-serif">
                          Soulbound Status
                        </Text>
                        <Text fontSize="xs" color={hasMintedPulseCards ? "#4ade80" : "gray.400"} fontFamily="'Space Mono', monospace">
                          {hasMintedPulseCards ? "Minted" : "Not yet minted"}
                        </Text>
                      </Flex>
                    </VStack>
                  </Box>
                )}

                {/* Fee disclosure */}
                {mainActionType && currentFee !== undefined && (
                  <Text fontSize="xs" color="gray.500" textAlign="center" fontFamily="'Space Mono', monospace">
                    Fee: {(Number(currentFee) / 1e18).toFixed(6)} ETH
                  </Text>
                )}

                {/* Main Action Button */}
                {isConnected ? (
                  <Button
                    w="full"
                    size="lg"
                    h="52px"
                    fontSize="md"
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
                    isDisabled={
                      isMainDisabled ||
                      (mainActionType === "boost" && !canBoost) ||
                      (mainActionType === "mintEntry" && hasEntry) ||
                      hasInsufficientBalance
                    }
                    isLoading={isTxPending}
                    _hover={
                      !isMainDisabled && mainActionType && !hasInsufficientBalance
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

                {hasInsufficientBalance && (
                  <Text fontSize="xs" color="#f87171" textAlign="center" fontFamily="'Space Grotesk', sans-serif">
                    Insufficient ETH balance on Soneium to cover this action's fee
                  </Text>
                )}

                {/* Separator — pushes the teaser down a bit and visually detaches it from
                    the primary action above, so it reads as a secondary, optional card. */}
                <Box h="1px" bg="linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)" mt={2} />

                {/* SBT Utility Teaser */}
                <Box
                  w="full"
                  bg="linear-gradient(135deg, rgba(168,85,247,0.09), rgba(34,197,94,0.05))"
                  border="1px solid rgba(168,85,247,0.2)"
                  borderRadius="18px"
                  p={4}
                  position="relative"
                  overflow="hidden"
                  _hover={{ borderColor: "rgba(168,85,247,0.4)", transform: "translateY(-2px)" }}
                  transition="all 0.3s ease"
                  cursor="pointer"
                  role="button"
                  tabIndex={0}
                  aria-label="Learn more about PulseCards SBT utility"
                  onClick={() => setIsSbtOpen(true)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setIsSbtOpen(true);
                    }
                  }}
                >
                  <Box
                    position="absolute"
                    top={0}
                    left={0}
                    right={0}
                    h="1px"
                    bgGradient="linear(90deg, transparent, #a855f7, #22c55e, transparent)"
                  />
                  <Flex justify="space-between" align="center" wrap="wrap" gap={3}>
                    <HStack spacing={3}>
                      <Flex
                        w="36px"
                        h="36px"
                        align="center"
                        justify="center"
                        bg="rgba(168,85,247,0.14)"
                        border="1px solid rgba(168,85,247,0.3)"
                        borderRadius="full"
                        flexShrink={0}
                        fontSize="15px"
                      >
                        🎯
                      </Flex>
                      <Box>
                        <Text fontSize="xs" fontWeight="700" color="white" fontFamily="'Space Grotesk', sans-serif">
                          PulseCards SBT Utility
                        </Text>
                        <Text fontSize="10px" color="gray.400" fontFamily="'Space Grotesk', sans-serif">
                          Free daily on-chain actions
                        </Text>
                      </Box>
                    </HStack>
                    <HStack spacing={2}>
                      <Badge
                        bg="rgba(74,222,128,0.12)"
                        color="#4ade80"
                        borderRadius="full"
                        px={2.5}
                        py={0.5}
                        fontSize="8px"
                        fontFamily="'Space Mono', monospace"
                        border="1px solid rgba(74,222,128,0.25)"
                      >
                        ● LIVE
                      </Badge>
                      <Button
                        size="xs"
                        variant="outline"
                        borderRadius="full"
                        fontSize="9px"
                        fontWeight="700"
                        color="#c4b5fd"
                        borderColor="rgba(168,85,247,0.35)"
                        _hover={{ bg: "rgba(168,85,247,0.12)" }}
                        fontFamily="'Space Grotesk', sans-serif"
                      >
                        Learn More →
                      </Button>
                    </HStack>
                  </Flex>
                </Box>
              </VStack>
            </Box>
          </Flex>


          {/* ─── How It Works — connected stepper ─── */}
          <Box mt={16}>
            <Box
              bg="rgba(4,4,14,0.85)"
              backdropFilter="blur(20px)"
              borderRadius="2xl"
              border="1px solid rgba(255,255,255,0.06)"
              p={{ base: 5, md: 8 }}
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
                style={{ animation: "shimmerBorder 5s infinite" }}
              />

              <VStack spacing={8} align="stretch" position="relative" zIndex={1}>
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
                      Four steps from zero to Soulbound
                    </Text>
                  </Box>
                </HStack>

                <Box position="relative">
                  <Box
                    display={{ base: "none", md: "block" }}
                    position="absolute"
                    top="20px"
                    left="12%"
                    right="12%"
                    h="1px"
                    bg="linear-gradient(90deg, rgba(168,85,247,0.4), rgba(34,197,94,0.4), rgba(56,189,248,0.4), rgba(251,191,36,0.4))"
                    zIndex={0}
                  />
                  <SimpleGrid columns={{ base: 1, md: 4 }} spacing={{ base: 6, md: 4 }} position="relative" zIndex={1}>
                    {[
                      { num: "01", icon: "🎫", title: "Mint PulseEntry", desc: "One NFT per wallet — your ticket into the daily boosting journey.", color: "#a855f7" },
                      { num: "02", icon: "⚡", title: "Daily Boosts", desc: "Boost once every 24h, up to 9 times. Each boost reveals a puzzle piece.", color: "#22c55e" },
                      { num: "03", icon: "🧩", title: "Complete the Puzzle", desc: "Reach level 2 through consistent boosting and unlock all 9 pieces.", color: "#38bdf8" },
                      { num: "04", icon: "🏆", title: "Mint Soulbound", desc: "Claim your permanent, non-transferable PulseCards badge.", color: "#fbbf24" },
                    ].map((step, index) => (
                      <MotionBox
                        key={step.num}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                      >
                        <VStack align={{ base: "start", md: "center" }} spacing={3} textAlign={{ base: "left", md: "center" }}>
                          <Flex
                            w="40px"
                            h="40px"
                            borderRadius="full"
                            align="center"
                            justify="center"
                            bg="#0a0a16"
                            border={`2px solid ${step.color}`}
                            fontSize="16px"
                            boxShadow={`0 0 16px ${step.color}40`}
                            flexShrink={0}
                          >
                            {step.icon}
                          </Flex>
                          <Box>
                            <Text fontSize="9px" color={step.color} fontFamily="'Space Mono', monospace" fontWeight="700" letterSpacing="0.15em" mb={1}>
                              STEP {step.num}
                            </Text>
                            <Text fontWeight="700" fontSize="sm" color="white" fontFamily="'Space Grotesk', sans-serif" mb={1}>
                              {step.title}
                            </Text>
                            <Text fontSize="xs" color="gray.400" lineHeight="1.6" fontFamily="'Space Grotesk', sans-serif">
                              {step.desc}
                            </Text>
                          </Box>
                        </VStack>
                      </MotionBox>
                    ))}
                  </SimpleGrid>
                </Box>
              </VStack>
            </Box>
          </Box>

          {/* ─── Contract Transparency ─── */}
          <Box mt={6}>
            <Box
              bg="rgba(4,4,14,0.85)"
              backdropFilter="blur(20px)"
              borderRadius="2xl"
              border="1px solid rgba(255,255,255,0.06)"
              p={{ base: 5, md: 6 }}
            >
              <HStack spacing={3} mb={3}>
                <Flex
                  w="30px"
                  h="30px"
                  align="center"
                  justify="center"
                  bg="rgba(74,222,128,0.1)"
                  border="1px solid rgba(74,222,128,0.2)"
                  borderRadius="lg"
                >
                  <CheckCircleIcon color="#4ade80" boxSize={3.5} />
                </Flex>
                <Box>
                  <Heading size="sm" color="white" fontWeight="700" fontFamily="'Space Grotesk', sans-serif">
                    Verified Contracts
                  </Heading>
                  <Text fontSize="xs" color="gray.500" fontFamily="'Space Grotesk', sans-serif">
                    Deployed on Soneium — check them yourself
                  </Text>
                </Box>
              </HStack>
              <Box>
                {CONTRACTS_INFO.map((c) => (
                  <ContractRow key={c.address} name={c.name} description={c.description} address={c.address} />
                ))}
              </Box>
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

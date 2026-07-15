// src/pages/Academy.tsx

import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  SimpleGrid,
  useToast,
  Radio,
  RadioGroup,
  Stack,
  Progress,
  Spinner,
  Skeleton,
  Image,
  Divider,
  Tooltip,
  Link,
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
import { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import { ChevronLeftIcon, CheckCircleIcon, SmallCloseIcon, ExternalLinkIcon } from "@chakra-ui/icons";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import { useFixScroll } from "../hooks/useFixScroll";
import { useTransactionModal } from "../hooks/useTransactionModal";
import TransactionModal from "../components/TransactionModal";

// Constants
import { SONEIUM_CHAIN_ID } from "../constants/contracts";
import { toHexAddress } from "../utils/helpers";

// ABIs
import { AgentQuestABI } from "../abi/AgentQuestABI";
import { AgentGraduateABI } from "../abi/AgentGraduateABI";

// Contract addresses
const AGENT_QUEST_ADDRESS = "0xED6F70AFD5A622d71885b74DE0F0eD812fc0c389";
const AGENT_GRADUATE_ADDRESS = "0xbCc5358C06C980598A674FEDA35Ab7A7E833D54c";

const BLOCKSCOUT_URL = "https://soneium.blockscout.com";

// ============= Motion =============
const MotionBox = motion(Box);

// ============= Types =============
interface Question {
  question: string;
}

interface QuestProgress {
  completed: boolean;
  badgeMinted: boolean;
  completedAt: bigint;
}

// ============= Styles =============
const pageStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap');

  @keyframes floatCard {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-7px); }
  }
  @keyframes shimmerBorder {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  @keyframes pulseGlow {
    0%, 100% { opacity: 0.55; }
    50% { opacity: 1; }
  }
  @keyframes orbFloat {
    0%, 100% { transform: scale(1) translateY(0px); opacity: 0.35; }
    50% { transform: scale(1.08) translateY(-18px); opacity: 0.6; }
  }
  @keyframes confettiDrop {
    0% { transform: translateY(-50px) scale(0.5); opacity: 0; }
    50% { transform: translateY(10px) scale(1.1); opacity: 1; }
    100% { transform: translateY(0px) scale(1); opacity: 1; }
  }
  @keyframes glowPulse {
    0%, 100% { box-shadow: 0 0 20px rgba(139,92,246,0.2); }
    50% { box-shadow: 0 0 50px rgba(139,92,246,0.45); }
  }
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  @keyframes scanline {
    0% { transform: translateY(-100%); }
    100% { transform: translateY(400%); }
  }
  @keyframes fadeSlideUp {
    0% { opacity: 0; transform: translateY(24px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  @keyframes borderRotate {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  @keyframes dotPulse {
    0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
    40% { transform: scale(1); opacity: 1; }
  }
  @keyframes nodeGlow {
    0%, 100% { box-shadow: 0 0 0 0 rgba(139,92,246,0.35); }
    50% { box-shadow: 0 0 0 8px rgba(139,92,246,0); }
  }
  @keyframes railFlow {
    0% { background-position: 0% 0%; }
    100% { background-position: 0% -200%; }
  }
  @keyframes ticker {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }

  .aa-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
  .aa-scrollbar::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.35); border-radius: 999px; }
`;

// ============= Quest Meta =============
const questMeta: { [key: number]: { icon: string; color: string; bg: string; accent: string; tag: string; difficulty: string; duration: string; xp: string; nftImage: string; codename: string } } = {
  1: { icon: "/soneium.png", color: "#06b6d4", bg: "rgba(6,182,212,0.08)", accent: "rgba(6,182,212,0.2)", tag: "Fundamentals", difficulty: "Beginner", duration: "~5 min", xp: "+50 XP", nftImage: "/agentquest.png", codename: "PROTOCOL-01" },
  2: { icon: "/dex.png", color: "#3b82f6", bg: "rgba(59,130,246,0.08)", accent: "rgba(59,130,246,0.2)", tag: "DeFi", difficulty: "Intermediate", duration: "~8 min", xp: "+75 XP", nftImage: "/agentquest.png", codename: "PROTOCOL-02" },
  3: { icon: "/deploy.png", color: "#ec4899", bg: "rgba(236,72,153,0.08)", accent: "rgba(236,72,153,0.2)", tag: "Smart Contracts", difficulty: "Advanced", duration: "~10 min", xp: "+100 XP", nftImage: "/agentquest.png", codename: "PROTOCOL-03" },
  4: { icon: "/agent.png", color: "#8b5cf6", bg: "rgba(139,92,246,0.08)", accent: "rgba(139,92,246,0.2)", tag: "AI Agents", difficulty: "Advanced", duration: "~12 min", xp: "+125 XP", nftImage: "/agentquest.png", codename: "PROTOCOL-04" },
};

const getQuestMeta = (id: number) => questMeta[id] || questMeta[4];

// ============= Main Page =============
export default function Academy() {
  const navigate = useNavigate();
  const toast = useToast();
  useFixScroll();

  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  const isCorrectChain = chainId === SONEIUM_CHAIN_ID;

  // ============= Transaction Modal =============
  const {
    txOpen, setTxOpen,
    txStatus, setTxStatus,
    txTitle, setTxTitle,
    txDesc, setTxDesc,
    closeTx,
  } = useTransactionModal();

  // ============= State =============
  const [selectedQuest, setSelectedQuest] = useState<number | null>(null);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [currentStep, setCurrentStep] = useState<"list" | "quiz" | "result">("list");
  const [questQuestions, setQuestQuestions] = useState<Question[]>([]);
  const [questName, setQuestName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signature, setSignature] = useState<`0x${string}` | null>(null);
  const [deadline, setDeadline] = useState<number>(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [userProgress, setUserProgress] = useState<{ [key: number]: QuestProgress }>({});
  const [hasGraduateBadge, setHasGraduateBadge] = useState(false);
  const [isEligible, setIsEligible] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [buyFee, setBuyFee] = useState<bigint>(0n);
  const [questMintFee, setQuestMintFee] = useState<bigint>(0n);
  const [lastMintedTokenId, setLastMintedTokenId] = useState<number | null>(null);
  const [lastMintedContract, setLastMintedContract] = useState<string | null>(null);

  // ============= Read Contracts =============
  const { data: questsData, refetch: refetchQuests } = useReadContract({
    address: toHexAddress(AGENT_QUEST_ADDRESS),
    abi: AgentQuestABI,
    functionName: "getQuests",
    query: { enabled: isCorrectChain },
  });

  const { data: graduateStatus, refetch: refetchGraduateStatus } = useReadContract({
    address: toHexAddress(AGENT_GRADUATE_ADDRESS),
    abi: AgentGraduateABI,
    functionName: "getGraduateStatus",
    args: address ? [address as `0x${string}`] : undefined,
    query: { enabled: !!address && isConnected && isCorrectChain },
  });

  const { data: graduateConfig, refetch: refetchGraduateConfig } = useReadContract({
    address: toHexAddress(AGENT_GRADUATE_ADDRESS),
    abi: AgentGraduateABI,
    functionName: "getConfig",
    query: { enabled: isCorrectChain },
  });

  const { data: balance, refetch: refetchBalance } = useBalance({
    address: address,
    query: { enabled: !!address && isConnected && isCorrectChain },
  });

  // ============= Helper Functions =============
  const hasSufficientBalance = (requiredAmount: bigint): boolean => {
    if (!balance) return false;
    return balance.value >= requiredAmount;
  };

  const formatEth = (amount: bigint): string => {
    return (Number(amount) / 1e18).toFixed(6);
  };

  const fetchQuestions = async (questId: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/agent-quest/${questId}`);
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setQuestQuestions(data.questions);
      setQuestName(data.name);
      setAnswers(new Array(data.questions.length).fill(null as any));
      setSelectedQuest(questId);
      setCurrentStep("quiz");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load questions",
        status: "error",
        duration: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerChange = (index: number, value: string) => {
    const newAnswers = [...answers];
    newAnswers[index] = value === "true";
    setAnswers(newAnswers);
  };

  const handleSubmitQuiz = async () => {
    if (!address) return;
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/verify-quiz-answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questId: selectedQuest,
          userAddress: address,
          answers: answers,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Quiz verification failed");
      }

      setSignature(data.signature as `0x${string}`);
      setDeadline(data.deadline);
      setQuizCompleted(true);
      setCurrentStep("result");

      toast({
        title: "🎉 All answers correct!",
        description: "You can now mint your badge!",
        status: "success",
        duration: 4000,
      });

    } catch (error: any) {
      toast({
        title: "Incorrect Answers",
        description: error.message || "Please try again",
        status: "error",
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMintBadge = async () => {
    if (!address || !signature || selectedQuest === null) {
      toast({
        title: "Error",
        description: "Missing signature. Please complete the quiz first.",
        status: "error",
        duration: 4000,
      });
      return;
    }

    if (deadline && Date.now() / 1000 > deadline) {
      toast({
        title: "Signature Expired",
        description: "Please complete the quiz again to get a new signature.",
        status: "error",
        duration: 5000,
      });
      setQuizCompleted(false);
      setSignature(null);
      setCurrentStep("list");
      return;
    }

    const quest = questsData as any[];
    const questData = quest?.find((q: any) => Number(q.id) === selectedQuest);
    const fee = questData ? BigInt(questData.fee) : 0n;

    if (!hasSufficientBalance(fee)) {
      toast({
        title: "Insufficient Balance",
        description: `You need at least ${formatEth(fee)} ETH + gas fees to mint this badge. Current balance: ${balance ? Number(balance.formatted).toFixed(4) : '0'} ETH.`,
        status: "error",
        duration: 8000,
      });
      return;
    }

    try {
      setTxOpen(true);
      setTxStatus("wallet");
      setTxTitle("🏅 Mint Badge");
      setTxDesc("Confirm mint transaction on Soneium...");

      const hash = await writeContractAsync({
        address: toHexAddress(AGENT_QUEST_ADDRESS),
        abi: AgentQuestABI,
        functionName: "mintBadge",
        args: [BigInt(selectedQuest), signature, BigInt(deadline)],
        value: fee,
      });

      setTxStatus("pending");
      setTxDesc("Waiting for confirmation...");

      const receipt = await publicClient!.waitForTransactionReceipt({ hash });

      if (receipt.status === "success") {
        let tokenId: number | null = null;
        for (const log of receipt.logs || []) {
          if (log.topics && log.topics[0] === '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef') {
            tokenId = Number(log.topics[3]);
            break;
          }
        }

        setLastMintedTokenId(tokenId);
        setLastMintedContract(AGENT_QUEST_ADDRESS);

        confetti({
          particleCount: 300,
          spread: 100,
          origin: { y: 0.6 },
          colors: ["#8b5cf6", "#ec4899", "#3b82f6", "#22c55e", "#fbbf24"],
        });

        toast({
          title: "🎉 Badge Minted!",
          description: tokenId ? `Token ID: #${tokenId}` : "Your badge has been minted successfully!",
          status: "success",
          duration: 8000,
        });

        setUserProgress(prev => ({
          ...prev,
          [selectedQuest]: {
            completed: true,
            badgeMinted: true,
            completedAt: BigInt(Date.now())
          }
        }));

        setQuizCompleted(false);
        setSignature(null);
        setDeadline(0);
        setCurrentStep("list");
        refetchQuests();
        refetchGraduateStatus();
        refetchBalance();

        setTimeout(() => {
          setTxOpen(false);
        }, 2000);
      }
    } catch (error: any) {
      const rejected = error?.message?.includes("rejected") || error?.code === 4001;
      setTxStatus(rejected ? "rejected" : "failed");
      setTxTitle(rejected ? "Transaction Cancelled" : "Transaction Failed");
      setTxDesc(rejected ? "You cancelled the transaction." : error?.message || "Something went wrong.");
    }
  };

  const handleMintGraduate = async () => {
    if (!address) return;

    if (!hasSufficientBalance(questMintFee)) {
      toast({
        title: "Insufficient Balance",
        description: `You need at least ${formatEth(questMintFee)} ETH + gas fees. Current balance: ${balance ? Number(balance.formatted).toFixed(4) : '0'} ETH.`,
        status: "error",
        duration: 8000,
      });
      return;
    }

    try {
      setTxOpen(true);
      setTxStatus("wallet");
      setTxTitle("🎓 Mint Graduate Badge");
      setTxDesc(`Confirm mint with ${formatEth(questMintFee)} ETH fee...`);

      const hash = await writeContractAsync({
        address: toHexAddress(AGENT_GRADUATE_ADDRESS),
        abi: AgentGraduateABI,
        functionName: "mintGraduate",
        args: [address],
        value: questMintFee > 0n ? questMintFee : undefined,
      });

      setTxStatus("pending");
      setTxDesc("Waiting for confirmation...");

      const receipt = await publicClient!.waitForTransactionReceipt({ hash });

      if (receipt.status === "success") {
        let tokenId: number | null = null;
        for (const log of receipt.logs || []) {
          if (log.topics && log.topics[0] === '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef') {
            tokenId = Number(log.topics[3]);
            break;
          }
        }

        setLastMintedTokenId(tokenId);
        setLastMintedContract(AGENT_GRADUATE_ADDRESS);

        confetti({ particleCount: 300, spread: 100, origin: { y: 0.6 }, colors: ["#fbbf24", "#ec4899", "#8b5cf6", "#22c55e", "#3b82f6"] });

        toast({ title: "🎓 Graduate Badge Minted!", description: tokenId ? `Token ID: #${tokenId}` : "Successfully minted!", status: "success", duration: 8000 });

        setHasGraduateBadge(true);
        refetchGraduateStatus();
        refetchGraduateConfig();
        refetchBalance();
        setTimeout(() => setTxOpen(false), 2000);
      }
    } catch (error: any) {
      const rejected = error?.message?.includes("rejected") || error?.code === 4001;
      setTxStatus(rejected ? "rejected" : "failed");
      setTxTitle(rejected ? "Transaction Cancelled" : "Transaction Failed");
      setTxDesc(rejected ? "You cancelled the transaction." : error?.message || "Something went wrong.");
    }
  };

  const handleBuyGraduate = async () => {
    if (!address) return;

    if (!hasSufficientBalance(buyFee)) {
      toast({
        title: "Insufficient Balance",
        description: `You need at least ${formatEth(buyFee)} ETH + gas. Current balance: ${balance ? Number(balance.formatted).toFixed(4) : '0'} ETH.`,
        status: "error",
        duration: 8000,
      });
      return;
    }

    try {
      setTxOpen(true);
      setTxStatus("wallet");
      setTxTitle("💎 Buy Graduate Badge");
      setTxDesc(`Confirm purchase with ${Number(buyFee) / 1e18} ETH...`);

      const hash = await writeContractAsync({
        address: toHexAddress(AGENT_GRADUATE_ADDRESS),
        abi: AgentGraduateABI,
        functionName: "buyGraduate",
        value: buyFee,
      });

      setTxStatus("pending");
      setTxDesc("Waiting for confirmation...");

      const receipt = await publicClient!.waitForTransactionReceipt({ hash });

      if (receipt.status === "success") {
        let tokenId: number | null = null;
        for (const log of receipt.logs || []) {
          if (log.topics && log.topics[0] === '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef') {
            tokenId = Number(log.topics[3]);
            break;
          }
        }

        setLastMintedTokenId(tokenId);
        setLastMintedContract(AGENT_GRADUATE_ADDRESS);

        confetti({ particleCount: 300, spread: 100, origin: { y: 0.6 }, colors: ["#fbbf24", "#ec4899", "#8b5cf6", "#22c55e", "#3b82f6"] });
        toast({ title: "💎 Graduate Badge Purchased!", description: tokenId ? `Token ID: #${tokenId}` : "Purchased successfully!", status: "success", duration: 8000 });

        setHasGraduateBadge(true);
        refetchGraduateStatus();
        refetchGraduateConfig();
        refetchBalance();
        setTimeout(() => setTxOpen(false), 2000);
      }
    } catch (error: any) {
      const rejected = error?.message?.includes("rejected") || error?.code === 4001;
      setTxStatus(rejected ? "rejected" : "failed");
      setTxTitle(rejected ? "Transaction Cancelled" : "Transaction Failed");
      setTxDesc(rejected ? "You cancelled the transaction." : error?.message || "Something went wrong.");
    }
  };

  // ============= Fetch User Progress =============
  const fetchUserProgress = async (questId: number) => {
    if (!address || !isConnected || !isCorrectChain) return;

    try {
      const result = await publicClient?.readContract({
        address: toHexAddress(AGENT_QUEST_ADDRESS),
        abi: AgentQuestABI,
        functionName: "getUserProgress",
        args: [BigInt(questId), address as `0x${string}`],
      });

      if (result) {
        const progress = result as [boolean, boolean, bigint];
        setUserProgress(prev => ({
          ...prev,
          [questId]: {
            completed: progress[0],
            badgeMinted: progress[1],
            completedAt: progress[2]
          }
        }));
      }
    } catch (error) {
      console.error(`Failed to fetch progress for quest ${questId}:`, error);
    }
  };

  useEffect(() => {
    if (address && isConnected && isCorrectChain && questsData) {
      const quests = questsData as any[];
      quests.forEach((quest: any) => fetchUserProgress(Number(quest.id)));
    }
  }, [address, isConnected, isCorrectChain, questsData]);

  useEffect(() => {
    if (graduateStatus) {
      const status = graduateStatus as any;
      setHasGraduateBadge(status[0] || false);
      setIsEligible(status[1] || false);
      setCompletedCount(Number(status[2] || 0));
    }
  }, [graduateStatus]);

  useEffect(() => {
    if (graduateConfig) {
      const config = graduateConfig as any;
      setQuestMintFee(config[1] || 0n);
      setBuyFee(config[2] || 0n);
    }
  }, [graduateConfig]);

  // ============= Derived helpers =============
  const hasUserCompletedQuest = (questId: number): boolean => userProgress[questId]?.completed || false;
  const hasUserMintedBadge = (questId: number): boolean => userProgress[questId]?.badgeMinted || false;

  const canMint = (questId: number): boolean => {
    if (!signature || selectedQuest !== questId) return false;
    if (hasUserMintedBadge(questId)) return false;
    if (deadline && Date.now() / 1000 > deadline) return false;
    const quest = (questsData as any[])?.find((q: any) => Number(q.id) === questId);
    if (!quest?.isActive) return false;
    return true;
  };

  const isSignatureExpired = (): boolean => deadline > 0 && Date.now() / 1000 > deadline;
  const allAnswersSelected = (): boolean => answers.every(a => a !== undefined && a !== null);

  const getExplorerLink = (contract: string, tokenId: number | null): string => {
    if (tokenId) return `${BLOCKSCOUT_URL}/token/${contract}/instance/${tokenId}`;
    return `${BLOCKSCOUT_URL}/token/${contract}`;
  };

  const totalMinted = (questsData as any[])?.reduce((acc: number, q: any) => acc + (Number(q.totalCompleted) || 0), 0) || 0;

  return (
    <>
      <style>{pageStyles}</style>

      <Box minH="100vh" bg="#03030f" position="relative" fontFamily="'Space Grotesk', sans-serif">
        {/* ── Ambient Background ── */}
        <Box position="fixed" top="-15%" left="-10%" w="700px" h="700px" borderRadius="full"
          bg="radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 65%)"
          filter="blur(100px)" style={{ animation: "orbFloat 24s ease-in-out infinite" }} zIndex={0} pointerEvents="none" />
        <Box position="fixed" bottom="-15%" right="-10%" w="800px" h="800px" borderRadius="full"
          bg="radial-gradient(circle, rgba(236,72,153,0.05) 0%, transparent 65%)"
          filter="blur(120px)" style={{ animation: "orbFloat 32s ease-in-out infinite 10s" }} zIndex={0} pointerEvents="none" />
        <Box position="fixed" top="40%" left="50%" transform="translateX(-50%)" w="600px" h="400px" borderRadius="full"
          bg="radial-gradient(circle, rgba(59,130,246,0.04) 0%, transparent 65%)"
          filter="blur(80px)" style={{ animation: "orbFloat 18s ease-in-out infinite 4s" }} zIndex={0} pointerEvents="none" />

        {/* ── Grid texture overlay ── */}
        <Box position="fixed" inset={0} zIndex={0} pointerEvents="none" opacity={0.025}
          backgroundImage="linear-gradient(rgba(139,92,246,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.5) 1px, transparent 1px)"
          backgroundSize="60px 60px" />

        {/* ── Fine scanline sweep for a "live terminal" feel ── */}
        <Box position="fixed" inset={0} zIndex={0} pointerEvents="none" overflow="hidden" opacity={0.03}>
          <Box h="140%" w="100%" bg="linear-gradient(180deg, transparent 0%, rgba(139,92,246,0.6) 50%, transparent 100%)"
            style={{ animation: "scanline 9s linear infinite" }} />
        </Box>

        <Container maxW="1440px" position="relative" zIndex={1} px={{ base: 3, md: 6, lg: 8 }} py={{ base: 4, md: 8 }}>

          {/* ══════════════════════════════════════════════════════════
              HEADER
          ══════════════════════════════════════════════════════════ */}
          <Flex justify="space-between" align="center" mb={{ base: 6, md: 10 }}
            direction={{ base: "column", md: "row" }} gap={{ base: 3, md: 0 }}>
            <HStack spacing={4}>
              <Button onClick={() => navigate("/")} variant="ghost" size={{ base: "sm", md: "md" }}
                leftIcon={<ChevronLeftIcon />} color="gray.500"
                _hover={{ color: "white", bg: "rgba(139,92,246,0.08)", borderColor: "rgba(139,92,246,0.25)" }}
                borderRadius="xl" border="1px solid rgba(255,255,255,0.07)"
                fontFamily="'Space Grotesk', sans-serif" fontWeight="500">
                Back
              </Button>

              <Box h="36px" w="1px" bg="rgba(255,255,255,0.05)" display={{ base: "none", md: "block" }} />

              <VStack align="start" spacing={0.5}>
                <HStack spacing={3} align="center">
                  <Box position="relative" w="9px" h="9px">
                    <Box position="absolute" inset={0} borderRadius="full" bg="#4ade80"
                      style={{ animation: "nodeGlow 2.4s ease-in-out infinite" }} />
                    <Box position="absolute" inset={0} borderRadius="full" bg="#4ade80" />
                  </Box>
                  <Heading fontSize={{ base: "xl", md: "2xl", lg: "3xl" }} fontWeight="800"
                    bgGradient="linear(135deg, #a855f7 0%, #ec4899 50%, #fbbf24 100%)"
                    bgClip="text" letterSpacing="-0.03em">
                    Agent Academy
                  </Heading>
                  <Badge bg="rgba(139,92,246,0.12)" color="#a855f7" fontSize="9px" px={2.5} py={0.5}
                    borderRadius="full" border="1px solid rgba(139,92,246,0.25)"
                    fontFamily="'Space Mono', monospace" letterSpacing="0.08em">
                    SEASON 13
                  </Badge>
                </HStack>
                <Text color="gray.500" fontSize={{ base: "9px", md: "10px" }} letterSpacing="0.22em"
                  fontFamily="'Space Mono', monospace" textTransform="uppercase">
                  On-chain learning path · Soneium
                </Text>
              </VStack>
            </HStack>

            <HStack spacing={3} display={{ base: "none", md: "flex" }}>
              <Box _hover={{ transform: "scale(1.02)" }} transition="transform 0.2s">
              <ConnectButton chainStatus="full" accountStatus="full" showBalance={{ smallScreen: false, largeScreen: true }} />
              </Box>
            </HStack>
          </Flex>

          {/* Mobile wallet */}
          <VStack spacing={3} display={{ base: "flex", md: "none" }} w="full" mb={5}>
            <Box w="full" display="flex" justifyContent="center">
              <ConnectButton chainStatus="full" accountStatus="full" showBalance={{ smallScreen: false, largeScreen: true }} />
            </Box>
          </VStack>

          {/* Network Warning */}
          {!isCorrectChain && isConnected && (
            <MotionBox initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} mb={5}>
              <Box bg="rgba(239,68,68,0.06)" border="1px solid rgba(239,68,68,0.18)"
                borderRadius="2xl" p={4} backdropFilter="blur(14px)">
                <Flex align="center" gap={4} flexWrap="wrap">
                  <Flex align="center" justify="center" w="40px" h="40px" borderRadius="full"
                    bg="rgba(239,68,68,0.1)" border="1px solid rgba(239,68,68,0.2)" flexShrink={0}>
                    <Text fontSize="xl">⚠️</Text>
                  </Flex>
                  <Box flex="1">
                    <Text fontSize="sm" fontWeight="700" color="#f87171">Wrong Network Detected</Text>
                    <Text fontSize="xs" color="gray.500">
                      Agent Academy runs exclusively on Soneium Mainnet. Switch to continue.
                    </Text>
                  </Box>
                  <Button size="sm" colorScheme="purple" borderRadius="full" fontWeight="700" px={6}
                    onClick={() => switchChain?.({ chainId: SONEIUM_CHAIN_ID })}>
                    Switch to Soneium
                  </Button>
                </Flex>
              </Box>
            </MotionBox>
          )}

          {/* ══════════════════════════════════════════════════════════
              QUEST LIST VIEW
          ══════════════════════════════════════════════════════════ */}
          {currentStep === "list" && (
            <>
              {/* ── Hero: the four-stage path, shown as a thesis rather than a banner ── */}
              {(!isConnected || !isCorrectChain) && (
                <MotionBox initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} mb={8}>
                  <Box bg="rgba(4,4,14,0.9)" backdropFilter="blur(24px)" borderRadius="3xl"
                    border="1px solid rgba(139,92,246,0.2)" p={{ base: 7, md: 10 }}
                    position="relative" overflow="hidden">
                    {/* Top shimmer bar */}
                    <Box position="absolute" top={0} left={0} right={0} h="2px"
                      bgGradient="linear(90deg, transparent, #8b5cf6, #ec4899, #fbbf24, transparent)"
                      style={{ animation: "shimmerBorder 4s linear infinite" }} />

                    <Badge mb={4} bg="rgba(251,191,36,0.15)" color="#fbbf24" px={3} py={1}
                      borderRadius="full" fontSize="9px" fontFamily="'Space Mono', monospace" letterSpacing="0.1em">
                      SEASON 13 · ENROLLMENT OPEN
                    </Badge>

                    <Heading fontSize={{ base: "2xl", md: "4xl" }} fontWeight="800" color="white" mb={3} lineHeight="1.15" maxW="620px">
                      Four protocols stand between you and{" "}
                      <Text as="span" bgGradient="linear(135deg, #a855f7, #ec4899)" bgClip="text">
                        Graduate status
                      </Text>
                    </Heading>
                    <Text color="gray.400" fontSize="md" lineHeight="1.7" mb={7} maxW="640px">
                      Agent Academy is a structured, on-chain curriculum for the Soneium ecosystem. Clear each
                      quiz, sign your proof of knowledge, and mint the badge — no shortcuts, every credential
                      lives on-chain.
                    </Text>

                    {/* Path preview — a real sequence: nodes sit ON the rail, not floating above a guessed offset */}
                    <Box position="relative" overflowX="auto" className="aa-scrollbar" pb={2}>
                      <Flex align="flex-start" gap={0} minW={{ base: "620px", md: "auto" }}>
                        {[1, 2, 3, 4].map((id, idx) => {
                          const meta = getQuestMeta(id);
                          const nextMeta = idx < 3 ? getQuestMeta(id + 1) : meta;
                          return (
                            <Flex key={id} align="flex-start" flex={idx < 3 ? 1 : "0 0 auto"}>
                              <VStack spacing={2.5} flexShrink={0} w="52px">
                                <Flex w="52px" h="52px" borderRadius="xl" align="center" justify="center"
                                  bg={meta.bg} border={`1.5px solid ${meta.color}70`} position="relative"
                                  boxShadow={`0 0 18px ${meta.color}25`}>
                                  <Image src={meta.icon} alt={meta.tag} w="26px" h="26px" objectFit="contain"
                                    fallbackSrc="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='26' height='26'><text y='55%' x='50%' text-anchor='middle' dominant-baseline='middle' font-size='16'>◆</text></svg>" />
                                  <Flex position="absolute" bottom="-6px" right="-6px" w="18px" h="18px" borderRadius="full"
                                    bg="#03030f" border={`1.5px solid ${meta.color}`} align="center" justify="center">
                                    <Text fontSize="8px" fontWeight="800" color={meta.color} fontFamily="'Space Mono', monospace">
                                      {idx + 1}
                                    </Text>
                                  </Flex>
                                </Flex>
                                <VStack spacing={0}>
                                  <Text fontSize="10px" color={meta.color} fontFamily="'Space Mono', monospace" fontWeight="700" whiteSpace="nowrap">
                                    {meta.tag}
                                  </Text>
                                  <Text fontSize="8px" color="gray.600" fontFamily="'Space Mono', monospace" whiteSpace="nowrap">
                                    {meta.xp}
                                  </Text>
                                </VStack>
                              </VStack>
                              {idx < 3 && (
                                <Box flex={1} position="relative" h="2px" mt="25px" mx={1} borderRadius="full"
                                  bg="rgba(255,255,255,0.06)" overflow="hidden">
                                  <Box position="absolute" inset={0}
                                    bgGradient={`linear(90deg, ${meta.color}, ${nextMeta.color})`} opacity={0.5} />
                                  <Box position="absolute" top="-2px" w="6px" h="6px" borderRadius="full"
                                    bg={nextMeta.color} boxShadow={`0 0 8px ${nextMeta.color}`}
                                    style={{ animation: `railTravel${idx} 2.8s linear infinite` }} />
                                  <style>{`@keyframes railTravel${idx} { 0% { left: -3%; opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { left: 100%; opacity: 0; } }`}</style>
                                </Box>
                              )}
                            </Flex>
                          );
                        })}
                      </Flex>
                    </Box>

                    <HStack spacing={6} flexWrap="wrap" mt={7}>
                      {[
                        { label: "NFT Badges", value: "4 Quests" },
                        { label: "Graduate Bonus", value: "+2 rep" },
                        { label: "Network", value: "Soneium" },
                      ].map(({ label, value }) => (
                        <VStack key={label} spacing={0} align="start">
                          <Text fontSize="xs" color="gray.500" fontFamily="'Space Mono', monospace" textTransform="uppercase" letterSpacing="0.12em">{label}</Text>
                          <Text fontSize="sm" fontWeight="700" color="white" fontFamily="'Space Mono', monospace">{value}</Text>
                        </VStack>
                      ))}
                    </HStack>
                  </Box>
                </MotionBox>
              )}

              {/* ── Graduate Badge Progress Panel ── */}
              {isConnected && isCorrectChain && (
                <Box mb={8}>
                  <Box bg="rgba(4,4,14,0.9)" backdropFilter="blur(24px)" borderRadius="2xl"
                    border={hasGraduateBadge
                      ? "1px solid rgba(74,222,128,0.3)"
                      : isEligible
                        ? "1px solid rgba(251,191,36,0.3)"
                        : "1px solid rgba(139,92,246,0.2)"}
                    p={{ base: 5, md: 7 }} position="relative" overflow="hidden"
                    transition="all 0.35s"
                    _hover={{ borderColor: hasGraduateBadge ? "rgba(74,222,128,0.5)" : "rgba(139,92,246,0.45)" }}>

                    {/* Status glow top bar */}
                    <Box position="absolute" top={0} left={0} right={0} h="2px"
                      bgGradient={hasGraduateBadge
                        ? "linear(90deg, transparent, #4ade80, transparent)"
                        : isEligible
                          ? "linear(90deg, transparent, #fbbf24, #ec4899, transparent)"
                          : "linear(90deg, transparent, #8b5cf6, #ec4899, transparent)"}
                      style={{ animation: "shimmerBorder 4s linear infinite" }} />

                    <Flex direction={{ base: "column", lg: "row" }} align={{ base: "stretch", lg: "center" }}
                      justify="space-between" gap={6}>

                      {/* Left: Badge info */}
                      <HStack spacing={5} align="start">
                        <Box w={{ base: "56px", md: "68px" }} h={{ base: "56px", md: "68px" }} borderRadius="2xl"
                          bg={hasGraduateBadge ? "rgba(34,197,94,0.15)" : "rgba(139,92,246,0.1)"}
                          border="1.5px solid" borderColor={hasGraduateBadge ? "#4ade80" : "rgba(139,92,246,0.3)"}
                          display="flex" alignItems="center" justifyContent="center" flexShrink={0}
                          overflow="hidden" position="relative"
                          style={{ animation: hasGraduateBadge ? "glowPulse 3s ease-in-out infinite" : "none" }}>
                          <Image src="/agentgraduate.png" alt="Agent Graduate" w="100%" h="100%" objectFit="cover"
                            fallbackSrc="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='68' height='68'><text y='55%' x='50%' text-anchor='middle' dominant-baseline='middle' font-size='36'>🎓</text></svg>" />
                        </Box>
                        <Box>
                          <HStack spacing={2} mb={1} flexWrap="wrap">
                            <Text fontWeight="800" fontSize={{ base: "lg", md: "xl" }} color="white">
                              Agent Graduate
                            </Text>
                            <Badge bg="rgba(251,191,36,0.12)" color="#fbbf24" px={2.5} py={0.5}
                              borderRadius="full" fontSize="9px" fontFamily="'Space Mono', monospace">
                              ERC-721 NFT
                            </Badge>
                            {hasGraduateBadge && (
                              <Tooltip label="View on Blockscout" hasArrow>
                                <Link href={`${BLOCKSCOUT_URL}/token/${AGENT_GRADUATE_ADDRESS}`} isExternal _hover={{ color: "#06b6d4" }}>
                                  <ExternalLinkIcon boxSize={3.5} color="gray.500" />
                                </Link>
                              </Tooltip>
                            )}
                          </HStack>
                          {hasGraduateBadge ? (
                            <Text fontSize="sm" color="#4ade80" fontWeight="600">
                              ✅ You hold the Graduate badge — +2 bonus reputation for Season 13!
                            </Text>
                          ) : isEligible ? (
                            <Text fontSize="sm" color="#fbbf24">
                              🎯 All 4 quests complete! Claim your Graduate badge to receive +2 Season 13 reputation points.
                            </Text>
                          ) : (
                            <Text fontSize="sm" color="gray.400" maxW="480px">
                              Complete all 4 educational quests to unlock this badge and earn{" "}
                              <Text as="span" color="#fbbf24" fontWeight="700">+2 bonus reputation points</Text>{" "}
                              for Season 13. Alternatively, purchase the badge directly with ETH.
                            </Text>
                          )}

                          {/* Stats row */}
                          {!hasGraduateBadge && (
                            <HStack spacing={4} mt={2} flexWrap="wrap">
                              <HStack spacing={1.5}>
                                <Box w="8px" h="8px" borderRadius="full" bg="#8b5cf6" />
                                <Text fontSize="xs" color="gray.500" fontFamily="'Space Mono', monospace">
                                  {completedCount} / 4 quests done
                                </Text>
                              </HStack>
                              <HStack spacing={1.5}>
                                <Box w="8px" h="8px" borderRadius="full" bg="#fbbf24" />
                                <Text fontSize="xs" color="gray.500" fontFamily="'Space Mono', monospace">
                                  Mint fee: {formatEth(questMintFee)} ETH
                                </Text>
                              </HStack>
                              <HStack spacing={1.5}>
                                <Box w="8px" h="8px" borderRadius="full" bg="#ec4899" />
                                <Text fontSize="xs" color="gray.500" fontFamily="'Space Mono', monospace">
                                  Buy price: {Number(buyFee) / 1e18} ETH
                                </Text>
                              </HStack>
                            </HStack>
                          )}
                        </Box>
                      </HStack>

                      {/* Right: Action */}
                      <HStack spacing={4} flexShrink={0}>
                        {/* Progress circle */}
                        <VStack spacing={0} align="center"
                          bg="rgba(0,0,0,0.3)" border="1px solid rgba(139,92,246,0.15)"
                          borderRadius="2xl" px={5} py={3}>
                          <Text fontSize="2xl" fontWeight="800"
                            bgGradient={completedCount === 4 ? "linear(135deg, #fbbf24, #ec4899)" : "linear(135deg, #a855f7, #ec4899)"}
                            bgClip="text">
                            {completedCount}/4
                          </Text>
                          <Text fontSize="9px" color="gray.500" fontFamily="'Space Mono', monospace" textTransform="uppercase" letterSpacing="0.1em">
                            Completed
                          </Text>
                        </VStack>

                        {hasGraduateBadge ? (
                          <Badge bg="rgba(34,197,94,0.15)" color="#4ade80" px={5} py={3}
                            borderRadius="xl" fontSize="sm" fontWeight="700">
                            ✅ Graduated
                          </Badge>
                        ) : isEligible ? (
                          <Button onClick={handleMintGraduate}
                            bgGradient="linear(135deg, #fbbf24, #ec4899)" color="white"
                            size="md" borderRadius="xl" fontWeight="700" px={6}
                            isDisabled={!hasSufficientBalance(questMintFee)}
                            _hover={{ transform: "scale(1.03)", boxShadow: "0 0 32px rgba(251,191,36,0.35)" }}
                            _disabled={{ opacity: 0.5, cursor: "not-allowed", transform: "none" }}
                            transition="all 0.3s">
                            🎓 Mint Graduate ({formatEth(questMintFee)} ETH)
                          </Button>
                        ) : (
                          <VStack spacing={2}>
                            <Button onClick={handleBuyGraduate}
                              bgGradient="linear(135deg, #8b5cf6, #ec4899)" color="white"
                              size="md" borderRadius="xl" fontWeight="700" px={6} w="full"
                              isDisabled={!hasSufficientBalance(buyFee)}
                              _hover={{ transform: "scale(1.02)", boxShadow: "0 0 28px rgba(139,92,246,0.35)" }}
                              _disabled={{ opacity: 0.5, cursor: "not-allowed", transform: "none" }}
                              transition="all 0.3s">
                              💎 Buy Badge ({Number(buyFee) / 1e18} ETH)
                            </Button>
                            <Text fontSize="9px" color="gray.500" textAlign="center" fontFamily="'Space Mono', monospace">
                              or complete all 4 quests to unlock the Graduate Mint.
                            </Text>
                          </VStack>
                        )}
                      </HStack>
                    </Flex>

                    {/* Progress bar */}
                    <Box mt={5}>
                      <Flex justify="space-between" mb={1.5}>
                        <Text fontSize="12px" color="gray.500" fontFamily="'Space Mono', monospace" textTransform="uppercase" letterSpacing="0.1em">
                          Progress toward Graduate
                        </Text>
                        <Text fontSize="12px" color="gray.500" fontFamily="'Space Mono', monospace">
                          {Math.round((completedCount / 4) * 100)}%
                        </Text>
                      </Flex>
                      <Progress value={(completedCount / 4) * 100} size="xs" borderRadius="full"
                        bg="rgba(139,92,246,0.08)"
                        sx={{ "& > div": { bgGradient: "linear(90deg, #8b5cf6, #ec4899, #fbbf24)", borderRadius: "full" } }} />

                      {/* Step dots */}
                      <Flex mt={2} gap={2}>
                        {[1, 2, 3, 4].map((n) => (
                          <Box key={n} flex={1} h="2px" borderRadius="full"
                            bg={n <= completedCount ? "rgba(251,191,36,0.6)" : "rgba(139,92,246,0.1)"} />
                        ))}
                      </Flex>
                    </Box>
                  </Box>
                </Box>
              )}

              {/* ── Stats Bar (only when connected) ── */}
              {isConnected && isCorrectChain && (
                <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3} mb={8}>
                  {[
                    { label: "Your Badges", value: `${completedCount}`, sub: "NFTs earned", color: "#a855f7" },
                    { label: "Total Completions", value: `${totalMinted}`, sub: "across all quests", color: "#3b82f6" },
                    { label: "Season", value: "13", sub: "currently active", color: "#ec4899" },
                    { label: "Bonus Rep", value: hasGraduateBadge ? "+2 pts" : "Locked", sub: "on graduation", color: "#fbbf24" },
                  ].map(({ label, value, sub, color }) => (
                    <Box key={label} bg="rgba(4,4,14,0.8)" borderRadius="xl"
                      border="1px solid rgba(255,255,255,0.05)"
                      p={{ base: 4, md: 5 }}
                      _hover={{ borderColor: `${color}30`, transform: "translateY(-2px)" }}
                      transition="all 0.25s">
                      <Text fontSize="12px" color="gray.500" fontFamily="'Space Mono', monospace"
                        textTransform="uppercase" letterSpacing="0.15em" mb={1}>{label}</Text>
                      <Text fontSize={{ base: "xl", md: "2xl" }} fontWeight="800" color={color}
                        fontFamily="'Space Mono', monospace">{value}</Text>
                      <Text fontSize="12px" color="gray.500" mt={0.5}>{sub}</Text>
                    </Box>
                  ))}
                </SimpleGrid>
              )}

              {/* ── Quests Grid ── */}
              <Box mb={6}>
                <Flex align="center" justify="space-between" mb={5} flexWrap="wrap" gap={2}>
                  <HStack spacing={3}>
                    <Box w="3px" h="18px" borderRadius="full"
                      bgGradient="linear(180deg, #a855f7, #ec4899)" />
                    <Heading size="sm" color="gray.200" fontWeight="700" letterSpacing="-0.01em">
                      Educational Quests
                    </Heading>
                    <Badge bg="rgba(139,92,246,0.1)" color="#a855f7" fontSize="8px" px={2.5} py={0.5}
                      borderRadius="full" fontFamily="'Space Mono', monospace">
                      4 AVAILABLE
                    </Badge>
                  </HStack>
                  {isConnected && isCorrectChain && (
                    <Text fontSize="xs" color="gray.500" fontFamily="'Space Mono', monospace">
                      {completedCount} of 4 complete
                    </Text>
                  )}
                </Flex>

                {!isConnected ? (
                  <Box textAlign="center" py={24} bg="rgba(4,4,14,0.6)" borderRadius="3xl"
                    border="1px dashed rgba(139,92,246,0.15)">
                    <Text fontSize="56px" mb={5}>🔌</Text>
                    <Text color="white" fontWeight="700" fontSize="lg" mb={2}>Connect Your Wallet</Text>
                    <Text color="gray.500" fontSize="sm" maxW="320px" mx="auto">
                      Connect your wallet to Soneium and begin your journey through Agent Academy.
                    </Text>
                  </Box>
                ) : !isCorrectChain ? (
                  <Box textAlign="center" py={24} bg="rgba(4,4,14,0.6)" borderRadius="3xl"
                    border="1px dashed rgba(239,68,68,0.15)">
                    <Text fontSize="56px" mb={5}>⚠️</Text>
                    <Text color="white" fontWeight="700" fontSize="lg" mb={2}>Switch to Soneium</Text>
                    <Text color="gray.500" fontSize="sm">
                      You're on the wrong network. Switch to Soneium Mainnet to view quests.
                    </Text>
                  </Box>
                ) : (
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={{ base: 4, md: 5 }}>
                    {questsData ? (
                      (questsData as any[]).map((quest: any) => {
                        const id = Number(quest.id);
                        const meta = getQuestMeta(id);
                        const isActive = quest.isActive;
                        const isCompleted = hasUserCompletedQuest(id);
                        const isMinted = hasUserMintedBadge(id);
                        const fee = BigInt(quest.fee);

                        return (
                          <MotionBox key={id}
                            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: id * 0.08 }}
                            whileHover={{ y: -5 }}>
                            <Box bg="rgba(4,4,14,0.9)" backdropFilter="blur(20px)" borderRadius="2xl"
                              border={`1px solid ${isMinted ? 'rgba(74,222,128,0.35)' : isCompleted ? 'rgba(251,191,36,0.25)' : 'rgba(139,92,246,0.15)'}`}
                              p={{ base: 5, md: 6 }} transition="all 0.3s"
                              _hover={{
                                borderColor: isMinted ? 'rgba(74,222,128,0.6)' : `${meta.color}60`,
                                boxShadow: isMinted ? '0 8px 40px rgba(74,222,128,0.08)' : `0 8px 40px ${meta.color}10`,
                              }}
                              opacity={isActive ? 1 : 0.45} position="relative" overflow="hidden"
                              h="full">

                              {/* Completion ribbon */}
                              {isMinted && (
                                <Box position="absolute" top={0} right={0} px={3} py={1.5}
                                  bg="rgba(34,197,94,0.85)" borderBottomLeftRadius="lg" backdropFilter="blur(8px)">
                                  <HStack spacing={1}>
                                    <CheckCircleIcon boxSize={3} color="white" />
                                    <Text fontSize="8px" color="white" fontWeight="800" fontFamily="'Space Mono', monospace" letterSpacing="0.08em">
                                      BADGE MINTED
                                    </Text>
                                  </HStack>
                                </Box>
                              )}
                              {isCompleted && !isMinted && (
                                <Box position="absolute" top={0} right={0} px={3} py={1.5}
                                  bg="rgba(251,191,36,0.8)" borderBottomLeftRadius="lg">
                                  <Text fontSize="8px" color="black" fontWeight="800" fontFamily="'Space Mono', monospace">
                                    ⏳ READY TO MINT
                                  </Text>
                                </Box>
                              )}

                              {/* Quest number + color strip */}
                              <Box position="absolute" left={0} top={0} bottom={0} w="3px" borderRadius="full"
                                bgGradient={`linear(180deg, ${meta.color}, transparent)`} />

                              <HStack spacing={4} align="start" mb={3}>
                                <Box w="52px" h="52px" borderRadius="xl" bg={meta.bg}
                                  border={`1px solid ${meta.color}25`}
                                  display="flex" alignItems="center" justifyContent="center"
                                  flexShrink={0} overflow="hidden" position="relative">
                                  <Image src={meta.icon} alt={quest.name} w="34px" h="34px" objectFit="contain"
                                    fallbackSrc="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='34' height='34'><text y='55%' x='50%' text-anchor='middle' dominant-baseline='middle' font-size='22'>📚</text></svg>" />
                                  {isMinted && (
                                    <Box position="absolute" inset={0} bg="rgba(34,197,94,0.2)" borderRadius="xl" />
                                  )}
                                </Box>
                                <Box flex={1} minW={0}>
                                  <HStack spacing={2} mb={0.5} flexWrap="wrap" justify="space-between">
                                    <Text fontWeight="700" color="white" fontSize="md" noOfLines={1}>
                                      {quest.name}
                                    </Text>
                                    <Text fontSize="9px" color="gray.600" fontFamily="'Space Mono', monospace" letterSpacing="0.05em" flexShrink={0}>
                                      {meta.codename}
                                    </Text>
                                  </HStack>
                                  <HStack spacing={2} flexWrap="wrap">
                                    <Badge bg={`${meta.color}15`} color={meta.color}
                                      fontSize="8px" px={2} py={0.5} borderRadius="full"
                                      fontFamily="'Space Mono', monospace">
                                      {meta.tag}
                                    </Badge>
                                    <Badge bg="rgba(255,255,255,0.04)" color="gray.500"
                                      fontSize="8px" px={2} py={0.5} borderRadius="full"
                                      fontFamily="'Space Mono', monospace">
                                      {meta.difficulty}
                                    </Badge>
                                    <Badge bg="rgba(255,255,255,0.04)" color="gray.500"
                                      fontSize="8px" px={2} py={0.5} borderRadius="full"
                                      fontFamily="'Space Mono', monospace">
                                      {meta.duration}
                                    </Badge>
                                    <Badge bg="rgba(251,191,36,0.1)" color="#fbbf24"
                                      fontSize="8px" px={2} py={0.5} borderRadius="full"
                                      fontFamily="'Space Mono', monospace" fontWeight="700">
                                      {meta.xp}
                                    </Badge>
                                  </HStack>
                                </Box>
                              </HStack>

                              <Text fontSize="sm" color="gray.400" lineHeight="1.65" mb={4}>
                                {quest.description || `Complete this quest to earn a badge!`}
                              </Text>

                              <Divider borderColor="rgba(255,255,255,0.05)" mb={4} />

                              <Flex align="center" justify="space-between">
                                <VStack spacing={0} align="start">
                                  <Text fontSize="9px" color="gray.500" fontFamily="'Space Mono', monospace" textTransform="uppercase" letterSpacing="0.1em">
                                    Mint Fee
                                  </Text>
                                  <Text fontSize="sm" fontWeight="700" color="gray.300" fontFamily="'Space Mono', monospace">
                                    {formatEth(fee)} ETH
                                  </Text>
                                </VStack>

                                <VStack align="end" spacing={2}>
                                  {/* Minted-badge preview — sits right above the button, sized for legibility without stretching the card */}
                                  {isMinted && (
                                    <Tooltip label="View on Blockscout" hasArrow>
                                      <Link href={`${BLOCKSCOUT_URL}/token/${AGENT_QUEST_ADDRESS}`} isExternal
                                        _hover={{ "& > div:first-of-type": { borderColor: "rgba(74,222,128,0.55)" }, "& .aa-view-link": { color: "#06b6d4" } }}>
                                        <HStack spacing={2.5}>
                                          <Box w="45px" h="45px" borderRadius="lg" overflow="hidden" flexShrink={0}
                                            border="1.5px solid rgba(74,222,128,0.3)" transition="border-color 0.2s"
                                            boxShadow="0 0 12px rgba(74,222,128,0.15)">
                                            <Image src={meta.nftImage} alt={`${quest.name} Badge`} w="100%" h="100%" objectFit="cover"
                                              fallbackSrc="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='34' height='34'><rect width='34' height='34' rx='6' fill='%231a0a2e'/><text y='55%' x='50%' text-anchor='middle' dominant-baseline='middle' font-size='18'>🏅</text></svg>" />
                                          </Box>
                                          <VStack spacing={0} align="end">
                                            <Text fontSize="10.5px" fontWeight="700" color="#4ade80" whiteSpace="nowrap">
                                              NFT Quests Minted
                                            </Text>
                                            <HStack className="aa-view-link" spacing={1} transition="color 0.2s">
                                              <Text fontSize="9px" color="gray.500" fontFamily="'Space Mono', monospace" whiteSpace="nowrap">
                                                View on Blockscout
                                              </Text>
                                              <ExternalLinkIcon boxSize={2.5} color="gray.600" />
                                            </HStack>
                                          </VStack>
                                        </HStack>
                                      </Link>
                                    </Tooltip>
                                  )}

                                  <Tooltip
                                    label={!isActive ? "Quest not active" : !hasSufficientBalance(fee) ? `Need ${formatEth(fee)} ETH` : ""}
                                    hasArrow isDisabled={isActive && hasSufficientBalance(fee)}>
                                    <Button size="sm"
                                      bg={isMinted
                                        ? "rgba(74,222,128,0.1)"
                                        : isCompleted
                                          ? "linear-gradient(135deg, #fbbf24, #ec4899)"
                                          : `linear-gradient(135deg, ${meta.color}cc, #ec4899aa)`}
                                      color={isMinted ? "#4ade80" : "white"}
                                      isDisabled={isMinted || !isActive || (isCompleted && !hasSufficientBalance(fee))}
                                      fontWeight="700" borderRadius="xl" px={6}
                                      border={isMinted ? "1px solid rgba(74,222,128,0.3)" : "none"}
                                      _hover={{
                                        transform: isMinted ? "none" : "scale(1.04)",
                                        boxShadow: isMinted ? "none" : `0 0 24px ${meta.color}40`,
                                      }}
                                      _disabled={{ opacity: 0.5, cursor: "not-allowed", transform: "none" }}
                                      transition="all 0.2s"
                                      onClick={() => {
                                        if (!isMinted) fetchQuestions(id);
                                      }}>
                                      {isMinted ? "✓ Minted" : isCompleted ? "Mint Badge →" : "Start Quiz →"}
                                    </Button>
                                  </Tooltip>
                                </VStack>
                              </Flex>
                            </Box>
                          </MotionBox>
                        );
                      })
                    ) : (
                      Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} height="260px" borderRadius="2xl"
                          startColor="rgba(139,92,246,0.06)" endColor="rgba(139,92,246,0.02)" />
                      ))
                    )}
                  </SimpleGrid>
                )}
              </Box>

              {/* ── How It Works ── */}
              {isConnected && isCorrectChain && (
                <Box bg="rgba(4,4,14,0.7)" backdropFilter="blur(16px)" borderRadius="2xl"
                  border="1px solid rgba(255,255,255,0.05)" p={{ base: 5, md: 7 }} mb={8} position="relative" overflow="hidden">
                  <Flex align="center" justify="space-between" mb={5} flexWrap="wrap" gap={2}>
                    <Text fontSize="xs" color="gray.500" fontFamily="'Space Mono', monospace"
                      textTransform="uppercase" letterSpacing="0.2em">
                      How It Works
                    </Text>
                    <Text fontSize="10px" color="gray.500" fontFamily="'Space Mono', monospace" display={{ base: "none", md: "block" }}>
                      4-STEP SEQUENCE
                    </Text>
                  </Flex>

                  <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6}>
                    {[
                      { step: "01", title: "Pick a Quest", desc: "Choose from 4 topics covering the Soneium ecosystem, from basics to AI agents.", color: "#06b6d4" },
                      { step: "02", title: "Answer Questions", desc: "Read the material and answer True / False questions to prove your understanding.", color: "#8b5cf6" },
                      { step: "03", title: "Get Signature", desc: "Pass the quiz and receive a cryptographic signature that unlocks your NFT mint.", color: "#ec4899" },
                      { step: "04", title: "Mint & Earn", desc: "Mint your badge on Soneium. Clear all 4 to unlock Graduate and +2 rep points.", color: "#fbbf24" },
                    ].map(({ step, title, desc, color }, idx) => (
                      <Box key={step} p={5} borderRadius="xl" bg="rgba(0,0,0,0.25)"
                        border="1px solid rgba(255,255,255,0.04)" position="relative" zIndex={1}
                        textAlign="center"
                        _hover={{ borderColor: `${color}30`, bg: "rgba(0,0,0,0.4)", transform: "translateY(-2px)" }}
                        transition="all 0.25s">

                        {/* connector: center of this node → center of the next, always equal length */}
                        {idx < 3 && (
                          <Box display={{ base: "none", md: "block" }} position="absolute"
                            left="50%" top="40px" width="calc(100% + 24px)" height="2px"
                            zIndex={0} pointerEvents="none" overflow="visible">
                            <Box position="absolute" inset={0} borderRadius="full"
                              bg="rgba(255,255,255,0.06)" />
                            <Box position="absolute" inset={0} borderRadius="full"
                              bgGradient={`linear(90deg, ${color}, ${[
                                "#06b6d4", "#8b5cf6", "#ec4899", "#fbbf24",
                              ][idx + 1]})`} opacity={0.45} />
                            <Box position="absolute" top="-2px" w="6px" h="6px" borderRadius="full"
                              bg={color} boxShadow={`0 0 8px ${color}`}
                              style={{ animation: `stepTravel${idx} 2.6s linear infinite` }} />
                            <style>{`@keyframes stepTravel${idx} { 0% { left: 0%; opacity: 0; } 12% { opacity: 1; } 88% { opacity: 1; } 100% { left: 100%; opacity: 0; } }`}</style>
                          </Box>
                        )}

                        <Flex w="40px" h="40px" borderRadius="lg" align="center" justify="center" mb={3} mx="auto"
                          bg={`${color}15`} border={`1px solid ${color}40`}
                          boxShadow={`0 0 14px ${color}20`}>
                          <Text fontSize="15px" color={color} fontFamily="'Space Mono', monospace"
                            fontWeight="800" letterSpacing="0.05em">{step}</Text>
                        </Flex>
                        <Text fontSize="sm" fontWeight="700" color="white" mb={1.5}>{title}</Text>
                        <Text fontSize="xs" color="gray.500" lineHeight="1.6">{desc}</Text>
                      </Box>
                    ))}
                  </SimpleGrid>
                </Box>
              )}
            </>
          )}

          {/* ══════════════════════════════════════════════════════════
              QUIZ VIEW
          ══════════════════════════════════════════════════════════ */}
          {currentStep === "quiz" && !quizCompleted && (
            <MotionBox initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <Box bg="rgba(4,4,14,0.9)" backdropFilter="blur(24px)" borderRadius="3xl"
                border="1px solid rgba(139,92,246,0.2)" p={{ base: 5, md: 8 }} position="relative" overflow="hidden">

                <Box position="absolute" top={0} left={0} right={0} h="2px"
                  bgGradient="linear(90deg, transparent, #8b5cf6, #ec4899, transparent)"
                  style={{ animation: "shimmerBorder 3s linear infinite" }} />

                {/* Quiz Header */}
                <Flex align="center" justify="space-between" mb={7} flexWrap="wrap" gap={3}>
                  <HStack spacing={3}>
                    <Button variant="ghost" size="sm" leftIcon={<ChevronLeftIcon />}
                      onClick={() => {
                        setCurrentStep("list");
                        setQuizCompleted(false);
                        setSignature(null);
                        setDeadline(0);
                        setAnswers([]);
                      }}
                      color="gray.500" _hover={{ color: "white", bg: "rgba(139,92,246,0.08)" }}
                      borderRadius="xl" border="1px solid rgba(255,255,255,0.07)">
                      Back
                    </Button>
                    <Box h="28px" w="1px" bg="rgba(255,255,255,0.07)" />
                    <VStack align="start" spacing={0}>
                      <Heading size="md" color="white" fontWeight="800">{questName}</Heading>
                      <Text fontSize="xs" color="gray.500">Answer all questions correctly to earn your badge</Text>
                    </VStack>
                  </HStack>
                  <HStack spacing={2} flexWrap="wrap">
                    <Badge bg="rgba(139,92,246,0.15)" color="#a855f7" px={3} py={1.5}
                      borderRadius="full" fontFamily="'Space Mono', monospace" fontSize="10px">
                      Quiz
                    </Badge>
                    <Badge bg="rgba(251,191,36,0.1)" color="#fbbf24" px={3} py={1.5}
                      borderRadius="full" fontFamily="'Space Mono', monospace" fontSize="10px">
                      {questQuestions.length} Questions
                    </Badge>
                    <Badge bg="rgba(34,197,94,0.08)" color="#4ade80" px={3} py={1.5}
                      borderRadius="full" fontFamily="'Space Mono', monospace" fontSize="10px">
                      {answers.filter(a => a !== null && a !== undefined).length}/{questQuestions.length} Answered
                    </Badge>
                  </HStack>
                </Flex>

                {/* Progress */}
                <Box mb={7}>
                  <Progress
                    value={(answers.filter(a => a !== null && a !== undefined).length / Math.max(questQuestions.length, 1)) * 100}
                    size="xs" borderRadius="full" bg="rgba(139,92,246,0.08)"
                    sx={{ "& > div": { bgGradient: "linear(90deg, #8b5cf6, #ec4899)", borderRadius: "full", transition: "width 0.3s" } }} />
                </Box>

                {isLoading ? (
                  <VStack py={16}>
                    <Spinner color="#8b5cf6" size="xl" thickness="3px" />
                    <Text color="gray.500" fontSize="sm" fontFamily="'Space Mono', monospace">Loading questions...</Text>
                  </VStack>
                ) : (
                  <VStack spacing={4} align="stretch">
                    {questQuestions.map((q, index) => {
                      const answered = answers[index] !== undefined && answers[index] !== null;
                      return (
                        <Box key={index} bg="rgba(0,0,0,0.3)" borderRadius="xl" p={5}
                          border="1px solid"
                          borderColor={answered ? "rgba(139,92,246,0.25)" : "rgba(139,92,246,0.08)"}
                          transition="all 0.2s"
                          _hover={{ borderColor: "rgba(139,92,246,0.35)", bg: "rgba(0,0,0,0.4)" }}>

                          <Flex align="start" gap={4}>
                            <Box w="26px" h="26px" borderRadius="lg" flexShrink={0}
                              bg={answered ? "rgba(139,92,246,0.2)" : "rgba(139,92,246,0.08)"}
                              border={`1px solid ${answered ? "rgba(139,92,246,0.4)" : "rgba(139,92,246,0.15)"}`}
                              display="flex" alignItems="center" justifyContent="center">
                              <Text fontSize="10px" fontWeight="800" color={answered ? "#a855f7" : "gray.500"}
                                fontFamily="'Space Mono', monospace">
                                {String(index + 1).padStart(2, "0")}
                              </Text>
                            </Box>
                            <Box flex={1}>
                              <Text fontWeight="600" color="white" mb={4} lineHeight="1.5" fontSize="sm">
                                {q.question}
                              </Text>
                              <RadioGroup
                                onChange={(value) => handleAnswerChange(index, value)}
                                value={answered ? (answers[index] ? "true" : "false") : ""}>
                                <Stack direction={{ base: "column", sm: "row" }} spacing={3}>
                                  {[
                                    { value: "true", label: "True", color: "green", icon: "✓" },
                                    { value: "false", label: "False", color: "red", icon: "✗" },
                                  ].map(({ value, label, color, icon }) => (
                                    <Box key={value} flex={1} as="label" cursor="pointer">
                                      <Box
                                        p={3} borderRadius="xl" transition="all 0.2s"
                                        bg={answers[index] !== null && answers[index] !== undefined && (answers[index] ? "true" : "false") === value
                                          ? value === "true" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)"
                                          : "rgba(255,255,255,0.02)"}
                                        border="1px solid"
                                        borderColor={answers[index] !== null && answers[index] !== undefined && (answers[index] ? "true" : "false") === value
                                          ? value === "true" ? "rgba(34,197,94,0.35)" : "rgba(239,68,68,0.35)"
                                          : "rgba(255,255,255,0.07)"}
                                        _hover={{ borderColor: value === "true" ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)" }}>
                                        <Radio value={value} colorScheme={color} size="md">
                                          <Text color="gray.300" fontSize="sm" fontWeight="600" ml={1}>
                                            {icon} {label}
                                          </Text>
                                        </Radio>
                                      </Box>
                                    </Box>
                                  ))}
                                </Stack>
                              </RadioGroup>
                            </Box>
                          </Flex>
                        </Box>
                      );
                    })}

                    <Box pt={2}>
                      <Button size="lg"
                        bgGradient={allAnswersSelected() ? "linear(135deg, #8b5cf6, #ec4899)" : undefined}
                        bg={!allAnswersSelected() ? "rgba(75,85,99,0.25)" : undefined}
                        color={allAnswersSelected() ? "white" : "gray.500"}
                        fontWeight="700" borderRadius="xl" w="full" h="56px"
                        isLoading={isSubmitting} loadingText="Verifying answers..."
                        isDisabled={!allAnswersSelected()}
                        border={allAnswersSelected() ? "none" : "1px solid rgba(255,255,255,0.07)"}
                        _hover={{
                          transform: allAnswersSelected() ? "scale(1.01)" : "none",
                          boxShadow: allAnswersSelected() ? "0 0 36px rgba(139,92,246,0.35)" : "none",
                        }}
                        _disabled={{ opacity: 1, cursor: "not-allowed" }}
                        transition="all 0.3s"
                        onClick={handleSubmitQuiz}>
                        {!allAnswersSelected()
                          ? `Answer all ${questQuestions.length - answers.filter(a => a !== null && a !== undefined).length} remaining question(s)`
                          : "Submit Answers →"}
                      </Button>
                      <Text fontSize="xs" color="gray.500" textAlign="center" mt={3} fontFamily="'Space Mono', monospace">
                        All questions must be answered correctly to proceed
                      </Text>
                    </Box>
                  </VStack>
                )}
              </Box>
            </MotionBox>
          )}

          {/* ══════════════════════════════════════════════════════════
              RESULT VIEW
          ══════════════════════════════════════════════════════════ */}
          {currentStep === "result" && quizCompleted && signature && selectedQuest && (
            <MotionBox initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
              <Box bg="rgba(4,4,14,0.9)" backdropFilter="blur(24px)" borderRadius="3xl"
                border="1px solid rgba(34,197,94,0.25)" p={{ base: 5, md: 8 }}
                position="relative" overflow="hidden">

                <Box position="absolute" top={0} left={0} right={0} h="2px"
                  bgGradient="linear(90deg, transparent, #22c55e, #4ade80, #22c55e, transparent)"
                  style={{ animation: "shimmerBorder 3s infinite" }} />

                {/* Success hero */}
                <VStack spacing={3} mb={8} textAlign="center">
                  <Box fontSize="72px" style={{ animation: "confettiDrop 1.2s ease-out" }} lineHeight="1">🎉</Box>
                  <VStack spacing={1}>
                    <Heading size="lg" color="#4ade80" fontWeight="800">Quiz Passed!</Heading>
                    <Text color="gray.400" fontSize="md">
                      You answered all questions correctly for{" "}
                      <Text as="span" color="white" fontWeight="600">{questName}</Text>.
                      Your badge is ready to mint.
                    </Text>
                  </VStack>
                  <HStack spacing={3} flexWrap="wrap" justify="center">
                    <Badge bg="rgba(34,197,94,0.15)" color="#4ade80" px={3} py={1.5}
                      borderRadius="full" fontSize="xs" fontFamily="'Space Mono', monospace">
                      ✓ Quiz Verified
                    </Badge>
                    <Badge bg="rgba(139,92,246,0.15)" color="#a855f7" px={3} py={1.5}
                      borderRadius="full" fontSize="xs" fontFamily="'Space Mono', monospace">
                      🔐 Signature Ready
                    </Badge>
                    <Badge bg="rgba(251,191,36,0.1)" color="#fbbf24" px={3} py={1.5}
                      borderRadius="full" fontSize="xs" fontFamily="'Space Mono', monospace">
                      ⏰ {new Date(deadline * 1000).toLocaleTimeString()} Expires
                    </Badge>
                  </HStack>
                </VStack>

                {/* NFT Preview + Details */}
                <Flex direction={{ base: "column", md: "row" }} gap={7} align="stretch" mb={8}>
                  {/* NFT Card */}
                  <Box flexShrink={0} mx={{ base: "auto", md: 0 }}>
                    <Box w={{ base: "180px", md: "200px" }} h={{ base: "180px", md: "200px" }}
                      borderRadius="2xl" overflow="hidden"
                      border="1.5px solid rgba(139,92,246,0.35)"
                      boxShadow="0 0 40px rgba(139,92,246,0.2)"
                      style={{ animation: "glowPulse 3s ease-in-out infinite" }}
                      bg="rgba(0,0,0,0.4)" position="relative">
                      <Image src="/agentquest.png" alt="Quest Badge NFT" w="100%" h="100%" objectFit="cover"
                        fallbackSrc="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><rect width='200' height='200' rx='16' fill='%231a0a2e'/><text y='50%' x='50%' text-anchor='middle' dominant-baseline='middle' font-size='48'>🏅</text></svg>" />
                      <Box position="absolute" bottom={0} left={0} right={0} p={2.5}
                        bg="linear-gradient(0deg, rgba(0,0,0,0.85) 0%, transparent 100%)">
                        <Text fontSize="9px" color="#a855f7" fontFamily="'Space Mono', monospace" fontWeight="700">
                          {questName}
                        </Text>
                        <Text fontSize="8px" color="gray.400" fontFamily="'Space Mono', monospace">
                          ERC-721 · Soneium
                        </Text>
                      </Box>
                      <Box position="absolute" top={2} right={2} bg="rgba(34,197,94,0.9)"
                        borderRadius="full" px={2} py={0.5}>
                        <Text fontSize="8px" color="white" fontFamily="'Space Mono', monospace" fontWeight="700">
                          READY
                        </Text>
                      </Box>
                    </Box>
                  </Box>

                  {/* Badge Details */}
                  <Box flex={1} bg="rgba(0,0,0,0.25)" borderRadius="xl"
                    border="1px solid rgba(255,255,255,0.05)" p={5}>
                    <Text fontSize="10px" color="gray.500" fontFamily="'Space Mono', monospace"
                      textTransform="uppercase" letterSpacing="0.15em" mb={4}>
                      Badge Details
                    </Text>

                    <VStack spacing={3} align="stretch">
                      {[
                        { label: "Quest", value: questName },
                        { label: "Network", value: "Soneium Mainnet" },
                        { label: "Standard", value: "ERC-721 NFT" },
                        { label: "Expires", value: new Date(deadline * 1000).toLocaleString() },
                      ].map(({ label, value }) => (
                        <Flex key={label} justify="space-between" align="center">
                          <Text fontSize="xs" color="gray.500" fontFamily="'Space Mono', monospace">{label}</Text>
                          <Text fontSize="xs" color="gray.300" fontWeight="600" fontFamily="'Space Mono', monospace"
                            textAlign="right" maxW="200px" noOfLines={1}>
                            {value}
                          </Text>
                        </Flex>
                      ))}

                      <Divider borderColor="rgba(255,255,255,0.05)" />

                      <Box>
                        <Text fontSize="10px" color="gray.500" fontFamily="'Space Mono', monospace" mb={1.5}>
                          Signature
                        </Text>
                        <Box bg="rgba(139,92,246,0.06)" border="1px solid rgba(139,92,246,0.15)"
                          borderRadius="lg" px={3} py={2.5}>
                          <Text fontSize="10px" color="#a855f7" fontFamily="'Space Mono', monospace"
                            wordBreak="break-all" letterSpacing="0.02em">
                            {signature.slice(0, 28)}...{signature.slice(-18)}
                          </Text>
                        </Box>
                      </Box>

                      {lastMintedTokenId && lastMintedContract === AGENT_QUEST_ADDRESS && (
                        <Box bg="rgba(251,191,36,0.08)" border="1px solid rgba(251,191,36,0.2)"
                          borderRadius="lg" px={3} py={2.5}>
                          <Flex justify="space-between" align="center">
                            <HStack spacing={2}>
                              <Text fontSize="10px" color="gray.500" fontFamily="'Space Mono', monospace">Token ID</Text>
                              <Text fontSize="sm" color="#fbbf24" fontFamily="'Space Mono', monospace" fontWeight="800">
                                #{lastMintedTokenId}
                              </Text>
                            </HStack>
                            <Tooltip label="View on Blockscout" hasArrow>
                              <Link href={getExplorerLink(AGENT_QUEST_ADDRESS, lastMintedTokenId)} isExternal>
                                <ExternalLinkIcon boxSize={3.5} color="gray.500" _hover={{ color: "#06b6d4" }} />
                              </Link>
                            </Tooltip>
                          </Flex>
                        </Box>
                      )}
                    </VStack>
                  </Box>
                </Flex>

                {isSignatureExpired() && (
                  <Box bg="rgba(239,68,68,0.08)" borderRadius="xl" p={4} mb={5}
                    border="1px solid rgba(239,68,68,0.2)">
                    <HStack spacing={3} justify="center">
                      <SmallCloseIcon color="#f87171" boxSize={4} />
                      <VStack spacing={0} align="start">
                        <Text fontSize="sm" color="#f87171" fontWeight="700">Signature Expired</Text>
                        <Text fontSize="xs" color="gray.500">
                          Your verification window has closed. Please retake the quiz to get a new signature.
                        </Text>
                      </VStack>
                    </HStack>
                  </Box>
                )}

                {/* Action Buttons */}
                <HStack spacing={4} justify="center" flexWrap="wrap">
                  <Tooltip
                    label={!hasSufficientBalance((questsData as any[])?.find((q: any) => Number(q.id) === selectedQuest)?.fee || 0n)
                      ? `Need ${formatEth((questsData as any[])?.find((q: any) => Number(q.id) === selectedQuest)?.fee || 0n)} ETH`
                      : ""} hasArrow>
                    <Button size="lg"
                      bgGradient={canMint(selectedQuest) ? "linear(135deg, #fbbf24, #ec4899)" : undefined}
                      bg={!canMint(selectedQuest) ? "rgba(75,85,99,0.2)" : undefined}
                      color={canMint(selectedQuest) ? "white" : "gray.500"}
                      fontWeight="700" borderRadius="xl" px={10} h="56px"
                      isDisabled={!canMint(selectedQuest) || !hasSufficientBalance(
                        (questsData as any[])?.find((q: any) => Number(q.id) === selectedQuest)?.fee || 0n
                      )}
                      onClick={handleMintBadge}
                      border={!canMint(selectedQuest) ? "1px solid rgba(255,255,255,0.07)" : "none"}
                      _hover={{
                        transform: canMint(selectedQuest) ? "scale(1.02)" : "none",
                        boxShadow: canMint(selectedQuest) ? "0 0 36px rgba(251,191,36,0.35)" : "none",
                      }}
                      _disabled={{ opacity: 1, cursor: "not-allowed" }}
                      transition="all 0.3s">
                      {isSignatureExpired() ? "⏳ Signature Expired" : canMint(selectedQuest) ? "🏅 Mint Badge →" : "⏳ Already Minted"}
                    </Button>
                  </Tooltip>
                  <Button size="lg" variant="outline"
                    borderColor="rgba(139,92,246,0.2)" color="gray.500" borderRadius="xl" px={8} h="56px"
                    onClick={() => {
                      setCurrentStep("list");
                      setQuizCompleted(false);
                      setSignature(null);
                      setDeadline(0);
                      setAnswers([]);
                    }}
                    _hover={{ borderColor: "rgba(139,92,246,0.5)", color: "white", bg: "rgba(139,92,246,0.06)" }}>
                    ← Back to Quests
                  </Button>
                </HStack>

                <Box mt={5} textAlign="center">
                  <Link href={`${BLOCKSCOUT_URL}/token/${AGENT_QUEST_ADDRESS}`} isExternal
                    fontSize="xs" color="gray.500" _hover={{ color: "#06b6d4" }}
                    fontFamily="'Space Mono', monospace">
                    📜 View contract on Blockscout <ExternalLinkIcon mx={1} boxSize={3} />
                  </Link>
                </Box>
              </Box>
            </MotionBox>
          )}

          {/* ── Footer ── */}
          <Box pt={12} pb={8} position="relative">
            <Box h="1px" mb={8}
              bg="linear-gradient(90deg, transparent, rgba(139,92,246,0.15), rgba(236,72,153,0.15), transparent)" />

            <VStack spacing={5}>
              <HStack spacing={0} justify="center" flexWrap="wrap"
                bg="rgba(255,255,255,0.015)" border="1px solid rgba(255,255,255,0.04)"
                borderRadius="2xl" px={6} py={3} gap={0}>
                {[
                  { label: "Season", value: "13" },
                  { label: "Chain", value: "Soneium" },
                  { label: "Status", value: "Live ✓" },
                  { label: "Quests", value: "4" },
                  { label: "Bonus Rep", value: "+2 pts" },
                ].map(({ label, value }, i, arr) => (
                  <HStack key={label} spacing={0}>
                    <VStack spacing={0} px={{ base: 4, md: 6 }} py={1.5}>
                      <Text fontSize="10px" color="gray.600" textTransform="uppercase"
                        letterSpacing="0.18em" fontFamily="'Space Mono', monospace">{label}</Text>
                      <Text fontSize="xs" fontWeight="700" color="gray.400"
                        fontFamily="'Space Mono', monospace">{value}</Text>
                    </VStack>
                    {i < arr.length - 1 && (
                      <Box w="1px" h="28px" bg="rgba(255,255,255,0.05)" flexShrink={0} />
                    )}
                  </HStack>
                ))}
              </HStack>

              <Text fontSize="10px" color="gray.500" fontFamily="'Space Mono', monospace" textAlign="center" letterSpacing="0.1em">
                AGENT ACADEMY · POWERED BY SONEIUM · SEASON 13
              </Text>
            </VStack>
          </Box>
        </Container>
      </Box>

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={txOpen}
        status={txStatus}
        title={txTitle}
        description={txDesc}
        onClose={closeTx}
      />
    </>
  );
}

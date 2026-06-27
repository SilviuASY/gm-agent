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
const AGENT_QUEST_ADDRESS = "0xD6e8C8c6B2b9ee50759fd3484e2ebCA7a208bf85";
const AGENT_GRADUATE_ADDRESS = "0x12C53cDC9BD11660b1Cc95Ab5bd0560bEb78E4C7";

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
    0%, 100% { transform: scale(1) translateY(0px); opacity: 0.45; }
    50% { transform: scale(1.1) translateY(-20px); opacity: 0.7; }
  }
  @keyframes confettiDrop {
    0% { transform: translateY(-50px) scale(0.5); opacity: 0; }
    50% { transform: translateY(10px) scale(1.1); opacity: 1; }
    100% { transform: translateY(0px) scale(1); opacity: 1; }
  }
  @keyframes glowPulse {
    0%, 100% { box-shadow: 0 0 20px rgba(139,92,246,0.2); }
    50% { box-shadow: 0 0 40px rgba(139,92,246,0.4); }
  }
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
`;

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

  // ============= Helper Functions =============

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

    try {
      const quest = questsData as any[];
      const questData = quest?.find((q: any) => Number(q.id) === selectedQuest);
      const fee = questData ? BigInt(questData.fee) : 0n;

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
        // Get token ID from logs - look for Transfer event
        let tokenId: number | null = null;
        for (const log of receipt.logs || []) {
          // Transfer event signature: 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef
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

    try {
      setTxOpen(true);
      setTxStatus("wallet");
      setTxTitle("🎓 Mint Graduate Badge");
      setTxDesc(`Confirm mint with ${Number(questMintFee) / 1e18} ETH fee...`);

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

        confetti({
          particleCount: 300,
          spread: 100,
          origin: { y: 0.6 },
          colors: ["#fbbf24", "#ec4899", "#8b5cf6", "#22c55e", "#3b82f6"],
        });

        toast({
          title: "🎓 Graduate Badge Minted!",
          description: tokenId ? `Token ID: #${tokenId}` : "Your Graduate badge has been minted successfully!",
          status: "success",
          duration: 8000,
        });

        setHasGraduateBadge(true);
        refetchGraduateStatus();
        refetchGraduateConfig();

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

  const handleBuyGraduate = async () => {
    if (!address) return;

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

        confetti({
          particleCount: 300,
          spread: 100,
          origin: { y: 0.6 },
          colors: ["#fbbf24", "#ec4899", "#8b5cf6", "#22c55e", "#3b82f6"],
        });

        toast({
          title: "💎 Graduate Badge Purchased!",
          description: tokenId ? `Token ID: #${tokenId}` : "Your Graduate badge has been purchased successfully!",
          status: "success",
          duration: 8000,
        });

        setHasGraduateBadge(true);
        refetchGraduateStatus();
        refetchGraduateConfig();

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
      quests.forEach((quest: any) => {
        fetchUserProgress(Number(quest.id));
      });
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

  // ============= UI Helpers =============

  const questIcons: { [key: number]: string } = {
    1: "/soneium.png",
    2: "/dex.png",
    3: "/deploy.png",
    4: "/agent.png",
  };

  const questColors: { [key: number]: string } = {
    1: "#06b6d4",
    2: "#3b82f6",
    3: "#ec4899",
    4: "#8b5cf6",
  };

  const questBgColors: { [key: number]: string } = {
    1: "rgba(6,182,212,0.1)",
    2: "rgba(59,130,246,0.1)",
    3: "rgba(236,72,153,0.1)",
    4: "rgba(139,92,246,0.1)",
  };

  const getQuestIcon = (id: number) => questIcons[id] || "/agent.png";
  const getQuestColor = (id: number) => questColors[id] || "#6b7280";
  const getQuestBg = (id: number) => questBgColors[id] || "rgba(139,92,246,0.05)";

  const hasUserCompletedQuest = (questId: number): boolean => {
    return userProgress[questId]?.completed || false;
  };

  const hasUserMintedBadge = (questId: number): boolean => {
    return userProgress[questId]?.badgeMinted || false;
  };

  const canMint = (questId: number): boolean => {
    if (!signature || selectedQuest !== questId) return false;
    if (hasUserMintedBadge(questId)) return false;
    if (deadline && Date.now() / 1000 > deadline) return false;
    const quest = (questsData as any[])?.find((q: any) => Number(q.id) === questId);
    if (!quest?.isActive) return false;
    return true;
  };

  const isSignatureExpired = (): boolean => {
    return deadline > 0 && Date.now() / 1000 > deadline;
  };

  const allAnswersSelected = (): boolean => {
    return answers.every(a => a !== undefined && a !== null);
  };

  const getExplorerLink = (contract: string, tokenId: number | null): string => {
    if (tokenId) {
      return `${BLOCKSCOUT_URL}/token/${contract}/instance/${tokenId}`;
    }
    return `${BLOCKSCOUT_URL}/token/${contract}`;
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
          bg="radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 65%)"
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
          bg="radial-gradient(circle, rgba(236,72,153,0.06) 0%, transparent 65%)"
          filter="blur(110px)"
          style={{ animation: "orbFloat 30s ease-in-out infinite 8s" }}
          zIndex={0}
          pointerEvents="none"
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
                  bg: "rgba(139,92,246,0.08)",
                  borderColor: "rgba(139,92,246,0.25)",
                }}
                borderRadius="xl"
                border="1px solid rgba(255,255,255,0.07)"
                fontFamily="'Space Grotesk', sans-serif"
                fontWeight="500"
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
                    bgGradient="linear(135deg, #a855f7 0%, #ec4899 50%, #fbbf24 100%)"
                    bgClip="text"
                    letterSpacing="-0.03em"
                  >
                    Agent Academy
                  </Heading>
                  <Badge
                    bg="rgba(139,92,246,0.1)"
                    color="#a855f7"
                    fontSize="9px"
                    px={2}
                    py={0.5}
                    borderRadius="full"
                    border="1px solid rgba(139,92,246,0.2)"
                    fontFamily="'Space Mono', monospace"
                  >
                    Season 13
                  </Badge>
                </HStack>
                <Text
                  color="gray.600"
                  fontSize={{ base: "9px", md: "10px" }}
                  letterSpacing="0.2em"
                  fontFamily="'Space Mono', monospace"
                  textTransform="uppercase"
                >
                  Learn & Earn · Soneium
                </Text>
              </VStack>
            </HStack>

            <HStack spacing={3} display={{ base: "none", md: "flex" }}>
              <Box _hover={{ transform: "scale(1.02)" }} transition="transform 0.2s">
                <ConnectButton chainStatus="full" accountStatus="full" showBalance={false} />
              </Box>
            </HStack>
          </Flex>

          {/* Mobile wallet */}
          <VStack spacing={3} display={{ base: "flex", md: "none" }} w="full" mb={5}>
            <Box w="full" display="flex" justifyContent="center">
              <ConnectButton chainStatus="full" accountStatus="full" showBalance={false} />
            </Box>
          </VStack>

          {/* Network Warning */}
          {!isCorrectChain && isConnected && (
            <MotionBox initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} mb={5}>
              <Box
                bg="rgba(239,68,68,0.08)"
                border="1px solid rgba(239,68,68,0.2)"
                borderRadius="2xl"
                p={4}
                backdropFilter="blur(14px)"
              >
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
                    <Text fontSize="sm" fontWeight="700" color="#f87171">
                      Wrong Network
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      Agent Academy requires Soneium Network.
                    </Text>
                  </Box>
                  <Button
                    size="sm"
                    colorScheme="purple"
                    borderRadius="full"
                    fontWeight="700"
                    px={6}
                    onClick={() => switchChain?.({ chainId: SONEIUM_CHAIN_ID })}
                  >
                    Switch to Soneium
                  </Button>
                </Flex>
              </Box>
            </MotionBox>
          )}

          {/* ============================================================ */}
          {/* QUEST LIST VIEW */}
          {/* ============================================================ */}
          {currentStep === "list" && (
            <>
              {/* Graduate Badge Progress */}
              {isConnected && isCorrectChain && (
                <Box mb={8}>
                  <Box
                    bg="rgba(4,4,14,0.85)"
                    backdropFilter="blur(20px)"
                    borderRadius="2xl"
                    border="1px solid rgba(139,92,246,0.25)"
                    p={{ base: 4, md: 6 }}
                    transition="all 0.3s"
                    _hover={{ borderColor: "rgba(139,92,246,0.5)" }}
                  >
                    <Flex
                      direction={{ base: "column", md: "row" }}
                      align={{ base: "stretch", md: "center" }}
                      justify="space-between"
                      gap={4}
                    >
                      <HStack spacing={4}>
                        <Box
                          w={{ base: "50px", md: "60px" }}
                          h={{ base: "50px", md: "60px" }}
                          borderRadius="full"
                          bg={hasGraduateBadge ? "rgba(34,197,94,0.2)" : "rgba(139,92,246,0.1)"}
                          border="2px solid"
                          borderColor={hasGraduateBadge ? "#4ade80" : "rgba(139,92,246,0.3)"}
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          flexShrink={0}
                          overflow="hidden"
                        >
                          <Image
                            src="/agentgraduate.png"
                            alt="Agent Graduate"
                            w="100%"
                            h="100%"
                            objectFit="cover"
                            fallbackSrc="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60'><text y='50%' x='50%' text-anchor='middle' font-size='32'>🎓</text></svg>"
                          />
                        </Box>
                        <Box>
                          <HStack spacing={2}>
                            <Text fontWeight="700" fontSize="lg" color="white">
                              {hasGraduateBadge ? "🎓 Graduate Agent" : "Agent Graduate"}
                            </Text>
                            {hasGraduateBadge && (
                              <Tooltip label="View on Blockscout" hasArrow>
                                <Link
                                  href={`${BLOCKSCOUT_URL}/token/${AGENT_GRADUATE_ADDRESS}`}
                                  isExternal
                                  _hover={{ color: "#06b6d4" }}
                                >
                                  <ExternalLinkIcon boxSize={4} color="gray.400" />
                                </Link>
                              </Tooltip>
                            )}
                          </HStack>
                          <Text fontSize="sm" color="gray.400">
                            {hasGraduateBadge ? (
                              "You have earned the ultimate Agent Graduate badge! 🏆"
                            ) : (
                              "Complete all 4 educational quests to unlock the Graduate badge and earn +2 bonus reputation points for Season 13. Or skip the quests and buy directly."
                            )}
                          </Text>
                        </Box>
                      </HStack>

                      <HStack spacing={4}>
                        <VStack spacing={0} align="center">
                          <Text fontSize="2xl" fontWeight="800" color="#fbbf24">
                            {completedCount}/4
                          </Text>
                          <Text fontSize="xs" color="gray.500" fontFamily="'Space Mono', monospace">
                            Quests Done
                          </Text>
                        </VStack>

                        {hasGraduateBadge ? (
                          <Badge bg="rgba(34,197,94,0.2)" color="#4ade80" px={4} py={2} borderRadius="full" fontSize="sm">
                            ✅ Minted
                          </Badge>
                        ) : isEligible ? (
                          <Button
                            onClick={handleMintGraduate}
                            bgGradient="linear(135deg, #fbbf24, #ec4899)"
                            color="white"
                            size="md"
                            borderRadius="full"
                            fontWeight="700"
                            _hover={{ transform: "scale(1.02)", boxShadow: "0 0 30px rgba(251,191,36,0.3)" }}
                            transition="all 0.3s"
                          >
                            🎓 Mint ({Number(questMintFee) / 1e18} ETH)
                          </Button>
                        ) : (
                          <HStack spacing={2}>
                            <Button
                              onClick={handleBuyGraduate}
                              bgGradient="linear(135deg, #8b5cf6, #ec4899)"
                              color="white"
                              size="md"
                              borderRadius="full"
                              fontWeight="700"
                              _hover={{ transform: "scale(1.02)", boxShadow: "0 0 30px rgba(139,92,246,0.3)" }}
                              transition="all 0.3s"
                              isDisabled={hasGraduateBadge}
                            >
                              💎 Buy ({Number(buyFee) / 1e18} ETH)
                            </Button>
                            <Button
                              isDisabled
                              size="md"
                              borderRadius="full"
                              bg="rgba(75,85,99,0.3)"
                              color="gray.500"
                            >
                              🔒 Locked
                            </Button>
                          </HStack>
                        )}
                      </HStack>
                    </Flex>

                    <Box mt={4}>
                      <Progress
                        value={(completedCount / 4) * 100}
                        size="sm"
                        borderRadius="full"
                        bg="rgba(139,92,246,0.1)"
                        sx={{
                          "& > div": {
                            bgGradient: "linear(90deg, #8b5cf6, #ec4899, #fbbf24)",
                            borderRadius: "full",
                          }
                        }}
                      />
                    </Box>

                    <Text fontSize="xs" color="gray.500" mt={3} textAlign="center" fontFamily="'Space Mono', monospace">
                      {hasGraduateBadge ? (
                        "✅ Badge minted — +2 bonus reputation points for Season 13"
                      ) : isEligible ? (
                        "🎯 All quests complete! Mint your Graduate badge now."
                      ) : (
                        `📚 ${4 - completedCount} quest(s) remaining or 💎 buy directly for ${Number(buyFee) / 1e18} ETH`
                      )}
                    </Text>
                  </Box>
                </Box>
              )}

              {/* Quests Grid */}
              <Box mb={6}>
                <HStack mb={4} spacing={2}>
                  <Box w="4px" h="4px" borderRadius="full" bg="#a855f7" animation="pulseGlow 2s infinite" />
                  <Heading size="sm" color="gray.300" fontWeight="600">
                    📚 Educational Quests
                  </Heading>
                  <Badge
                    bg="rgba(139,92,246,0.1)"
                    color="#a855f7"
                    fontSize="8px"
                    px={2}
                    py={0.5}
                    borderRadius="full"
                    fontFamily="'Space Mono', monospace"
                  >
                    Season 13
                  </Badge>
                </HStack>

                <Text fontSize="sm" color="gray.500" mb={4}>
                  Complete all {4} quests to earn the exclusive Agent Graduate badge and receive +2 bonus reputation points for Season 13 on Soneium.
                  {!hasGraduateBadge && !isEligible && ` Alternatively, you can skip the quests and purchase the badge directly for ${Number(buyFee) / 1e18} ETH using the "Buy" button above.`}
                </Text>

                {!isConnected ? (
                  <Box textAlign="center" py={20} bg="rgba(4,4,14,0.6)" borderRadius="3xl" border="1px solid rgba(139,92,246,0.15)">
                    <Text fontSize="56px" mb={4}>🔌</Text>
                    <Text color="gray.500" fontFamily="'Space Mono', monospace" fontSize="md">
                      Connect your wallet to start learning
                    </Text>
                  </Box>
                ) : !isCorrectChain ? (
                  <Box textAlign="center" py={20} bg="rgba(4,4,14,0.6)" borderRadius="3xl" border="1px solid rgba(139,92,246,0.15)">
                    <Text fontSize="56px" mb={4}>⚠️</Text>
                    <Text color="gray.500" fontFamily="'Space Mono', monospace" fontSize="md">
                      Switch to Soneium network
                    </Text>
                  </Box>
                ) : (
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={{ base: 4, md: 6 }}>
                    {questsData ? (
                      (questsData as any[]).map((quest: any) => {
                        const id = Number(quest.id);
                        const isActive = quest.isActive;
                        const isCompleted = hasUserCompletedQuest(id);
                        const isMinted = hasUserMintedBadge(id);

                        return (
                          <MotionBox
                            key={id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: id * 0.1 }}
                            whileHover={{ y: -4 }}
                          >
                            <Box
                              bg="rgba(4,4,14,0.85)"
                              backdropFilter="blur(20px)"
                              borderRadius="2xl"
                              border={`1px solid ${isMinted ? '#4ade80' : isCompleted ? 'rgba(251,191,36,0.3)' : 'rgba(139,92,246,0.2)'}`}
                              p={{ base: 5, md: 6 }}
                              transition="all 0.3s"
                              _hover={{
                                borderColor: isMinted ? '#4ade80' : 'rgba(139,92,246,0.5)',
                                boxShadow: isMinted ? '0 0 30px rgba(74,222,128,0.1)' : '0 0 30px rgba(139,92,246,0.05)',
                              }}
                              opacity={isActive ? 1 : 0.5}
                              position="relative"
                              overflow="hidden"
                            >
                              {isMinted && (
                                <Box
                                  position="absolute"
                                  top={0}
                                  right={0}
                                  px={3}
                                  py={1}
                                  bg="rgba(34,197,94,0.9)"
                                  borderBottomLeftRadius="lg"
                                >
                                  <HStack spacing={1}>
                                    <CheckCircleIcon boxSize={3} color="white" />
                                    <Text fontSize="8px" color="white" fontWeight="700" fontFamily="'Space Mono', monospace">
                                      COMPLETED
                                    </Text>
                                  </HStack>
                                </Box>
                              )}

                              <HStack justify="space-between" align="start">
                                <HStack spacing={4}>
                                  <Box
                                    w="48px"
                                    h="48px"
                                    borderRadius="full"
                                    bg={getQuestBg(id)}
                                    border={`1px solid ${getQuestColor(id)}30`}
                                    display="flex"
                                    alignItems="center"
                                    justifyContent="center"
                                    flexShrink={0}
                                    overflow="hidden"
                                  >
                                    <Image
                                      src={getQuestIcon(id)}
                                      alt={quest.name}
                                      w="32px"
                                      h="32px"
                                      objectFit="contain"
                                      fallbackSrc="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32'><text y='50%' x='50%' text-anchor='middle' font-size='24'>📚</text></svg>"
                                    />
                                  </Box>
                                  <Box>
                                    <HStack spacing={2}>
                                      <Text fontWeight="700" color="white" fontSize="md">
                                        {quest.name}
                                      </Text>
                                      {isMinted && (
                                        <Tooltip label="View on Blockscout" hasArrow>
                                          <Link
                                            href={`${BLOCKSCOUT_URL}/token/${AGENT_QUEST_ADDRESS}`}
                                            isExternal
                                            _hover={{ color: "#06b6d4" }}
                                          >
                                            <ExternalLinkIcon boxSize={3} color="gray.400" />
                                          </Link>
                                        </Tooltip>
                                      )}
                                    </HStack>
                                    <Text fontSize="xs" color="gray.400">
                                      {Number(quest.totalCompleted) || 0} completed
                                    </Text>
                                  </Box>
                                </HStack>
                                {isMinted ? (
                                  <Badge bg="rgba(34,197,94,0.2)" color="#4ade80" px={3} py={1} borderRadius="full" fontSize="xs">
                                    ✅ Minted
                                  </Badge>
                                ) : isCompleted ? (
                                  <Badge bg="rgba(251,191,36,0.15)" color="#fbbf24" px={3} py={1} borderRadius="full" fontSize="xs">
                                    ⏳ Ready to Mint
                                  </Badge>
                                ) : null}
                              </HStack>

                              <Text fontSize="sm" color="gray.400" mt={3} lineHeight="1.6">
                                {quest.description || `Complete this quest to earn a badge!`}
                              </Text>

                              <Divider my={3} borderColor="rgba(139,92,246,0.1)" />

                              <HStack mt={0} spacing={3} justify="space-between">
                                <Text fontSize="xs" color="gray.500" fontFamily="'Space Mono', monospace">
                                  Fee: {Number(quest.fee) / 1e18} ETH
                                </Text>
                                <Button
                                  size="sm"
                                  bg={isMinted ? "rgba(75,85,99,0.3)" : isCompleted ? "linear(135deg, #fbbf24, #ec4899)" : "linear(135deg, #8b5cf6, #ec4899)"}
                                  color={isMinted ? "gray.500" : "white"}
                                  isDisabled={isMinted || !isActive}
                                  fontWeight="600"
                                  borderRadius="full"
                                  px={6}
                                  _hover={{
                                    transform: isMinted ? "none" : "scale(1.02)",
                                    boxShadow: isMinted ? "none" : "0 0 20px rgba(139,92,246,0.3)",
                                  }}
                                  transition="all 0.2s"
                                  onClick={() => {
                                    if (isCompleted) {
                                      setSelectedQuest(id);
                                      fetchQuestions(id);
                                    } else {
                                      fetchQuestions(id);
                                    }
                                  }}
                                >
                                  {isMinted ? "Minted" : isCompleted ? "Mint Badge" : "Start Quiz"}
                                </Button>
                              </HStack>
                            </Box>
                          </MotionBox>
                        );
                      })
                    ) : (
                      Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} height="220px" borderRadius="2xl" startColor="rgba(139,92,246,0.1)" endColor="rgba(139,92,246,0.05)" />
                      ))
                    )}
                  </SimpleGrid>
                )}
              </Box>
            </>
          )}

          {/* ============================================================ */}
          {/* QUIZ VIEW */}
          {/* ============================================================ */}
          {currentStep === "quiz" && !quizCompleted && (
            <MotionBox
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Box
                bg="rgba(4,4,14,0.85)"
                backdropFilter="blur(20px)"
                borderRadius="3xl"
                border="1px solid rgba(139,92,246,0.25)"
                p={{ base: 5, md: 8 }}
              >
                <HStack mb={6} spacing={3}>
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<ChevronLeftIcon />}
                    onClick={() => {
                      setCurrentStep("list");
                      setQuizCompleted(false);
                      setSignature(null);
                      setDeadline(0);
                      setAnswers([]);
                    }}
                    color="gray.400"
                    _hover={{ color: "white" }}
                  >
                    Back
                  </Button>
                  <Badge bg="rgba(139,92,246,0.15)" color="#a855f7" px={3} py={1} borderRadius="full">
                    Quiz
                  </Badge>
                  <Badge bg="rgba(251,191,36,0.1)" color="#fbbf24" px={3} py={1} borderRadius="full" fontSize="9px">
                    {questQuestions.length} Questions
                  </Badge>
                </HStack>

                <Heading size="md" color="white" mb={2}>
                  {questName}
                </Heading>
                <Text color="gray.400" fontSize="sm" mb={6}>
                  Test your knowledge about {questName.replace('How to use ', '').replace('Deploy on ', '').replace('Agent ', '')}. Answer all questions correctly to earn your badge.
                </Text>

                {isLoading ? (
                  <VStack py={10}>
                    <Spinner color="#8b5cf6" size="xl" />
                    <Text color="gray.500" fontSize="sm">Loading questions...</Text>
                  </VStack>
                ) : (
                  <VStack spacing={5} align="stretch">
                    {questQuestions.map((q, index) => (
                      <Box
                        key={index}
                        bg="rgba(0,0,0,0.3)"
                        borderRadius="xl"
                        p={4}
                        border="1px solid rgba(139,92,246,0.1)"
                        transition="border-color 0.2s"
                        _hover={{ borderColor: "rgba(139,92,246,0.3)" }}
                      >
                        <Text fontWeight="600" color="white" mb={3}>
                          {index + 1}. {q.question}
                        </Text>
                        <RadioGroup
                          onChange={(value) => handleAnswerChange(index, value)}
                          value={answers[index] !== undefined && answers[index] !== null ? (answers[index] ? "true" : "false") : ""}
                        >
                          <Stack direction={{ base: "column", sm: "row" }} spacing={4}>
                            <Radio value="true" colorScheme="green" size="md">
                              <Text color="gray.300" fontSize="sm">True</Text>
                            </Radio>
                            <Radio value="false" colorScheme="red" size="md">
                              <Text color="gray.300" fontSize="sm">False</Text>
                            </Radio>
                          </Stack>
                        </RadioGroup>
                      </Box>
                    ))}

                    <Button
                      size="lg"
                      bgGradient="linear(135deg, #8b5cf6, #ec4899)"
                      color="white"
                      fontWeight="700"
                      borderRadius="full"
                      w="full"
                      mt={4}
                      isLoading={isSubmitting}
                      isDisabled={!allAnswersSelected()}
                      _hover={{
                        transform: "scale(1.02)",
                        boxShadow: "0 0 30px rgba(139,92,246,0.3)",
                      }}
                      transition="all 0.3s"
                      onClick={handleSubmitQuiz}
                    >
                      {!allAnswersSelected() ? "Answer all questions" : "Submit Answers"}
                    </Button>
                  </VStack>
                )}
              </Box>
            </MotionBox>
          )}

          {/* ============================================================ */}
          {/* RESULT VIEW */}
          {/* ============================================================ */}
          {currentStep === "result" && quizCompleted && signature && selectedQuest && (
            <MotionBox
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <Box
                bg="rgba(4,4,14,0.85)"
                backdropFilter="blur(20px)"
                borderRadius="3xl"
                border="1px solid rgba(34,197,94,0.3)"
                p={{ base: 5, md: 8 }}
                textAlign="center"
                position="relative"
                overflow="hidden"
              >
                <Box
                  position="absolute"
                  top={0}
                  left={0}
                  right={0}
                  h="3px"
                  bgGradient="linear(90deg, #22c55e, #4ade80, #22c55e)"
                  animation="shimmerBorder 3s infinite"
                />

                <Box fontSize="64px" mb={4} animation="confettiDrop 1.5s ease-in-out">
                  🎉
                </Box>
                <Heading size="lg" color="#4ade80" mb={2}>
                  All Answers Correct!
                </Heading>
                <Text color="gray.400" fontSize="md" mb={6}>
                  You've successfully completed the quiz! You can now mint your badge.
                </Text>

                <Flex
                  direction={{ base: "column", md: "row" }}
                  gap={6}
                  align="center"
                  justify="center"
                  mb={6}
                >
                  {/* NFT Preview */}
                  <Box
                    w={{ base: "150px", md: "180px" }}
                    h={{ base: "150px", md: "180px" }}
                    borderRadius="2xl"
                    overflow="hidden"
                    border="2px solid rgba(139,92,246,0.3)"
                    boxShadow="0 0 30px rgba(139,92,246,0.2)"
                    animation="glowPulse 3s ease-in-out infinite"
                    flexShrink={0}
                    bg="rgba(0,0,0,0.3)"
                    position="relative"
                  >
                    <Image
                      src="/agentquest.png"
                      alt="Quest Badge NFT"
                      w="100%"
                      h="100%"
                      objectFit="cover"
                      fallbackSrc="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><rect width='180' height='180' rx='16' fill='%231a0a2e'/><text y='50%' x='50%' text-anchor='middle' font-size='40'>🏅</text></svg>"
                    />
                    <Box
                      position="absolute"
                      bottom={2}
                      right={2}
                      bg="rgba(0,0,0,0.7)"
                      px={2}
                      py={0.5}
                      borderRadius="full"
                      border="1px solid rgba(139,92,246,0.3)"
                    >
                      <Text fontSize="8px" color="gray.400" fontFamily="'Space Mono', monospace">
                        ERC-721
                      </Text>
                    </Box>
                    <Box
                      position="absolute"
                      bottom={2}
                      left={2}
                      bg="rgba(0,0,0,0.7)"
                      px={2}
                      py={0.5}
                      borderRadius="full"
                      border="1px solid rgba(139,92,246,0.3)"
                    >
                      <Text fontSize="8px" color="#4ade80" fontFamily="'Space Mono', monospace">
                        ✓ Ready
                      </Text>
                    </Box>
                  </Box>

                  {/* Details */}
                  <Box flex={1} textAlign="left" w="full">
                    <HStack spacing={2} mb={2} flexWrap="wrap">
                      <Badge bg="rgba(139,92,246,0.2)" color="#a855f7" px={3} py={1} borderRadius="full" fontSize="10px">
                        {questName}
                      </Badge>
                      <Badge bg="rgba(34,197,94,0.15)" color="#4ade80" px={3} py={1} borderRadius="full" fontSize="10px">
                        ✓ Ready to Mint
                      </Badge>
                    </HStack>

                    <Text fontSize="xs" color="gray.500" fontFamily="'Space Mono', monospace" mb={3}>
                      🔐 Signature Generated
                    </Text>

                    <Box
                      bg="rgba(0,0,0,0.3)"
                      borderRadius="lg"
                      p={3}
                      border="1px solid rgba(34,197,94,0.1)"
                      mb={2}
                    >
                      <Text fontSize="xs" color="#4ade80" fontFamily="'Space Mono', monospace" wordBreak="break-all">
                        {signature.slice(0, 30)}...{signature.slice(-20)}
                      </Text>
                    </Box>

                    {lastMintedTokenId && lastMintedContract === AGENT_QUEST_ADDRESS && (
                      <Box
                        bg="rgba(251,191,36,0.1)"
                        borderRadius="lg"
                        p={2}
                        border="1px solid rgba(251,191,36,0.2)"
                        mb={2}
                      >
                        <HStack spacing={2} justify="center">
                          <Text fontSize="xs" color="gray.400" fontFamily="'Space Mono', monospace">
                            🆔 Token ID:
                          </Text>
                          <Text fontSize="sm" color="#fbbf24" fontFamily="'Space Mono', monospace" fontWeight="700">
                            #{lastMintedTokenId}
                          </Text>
                          <Tooltip label="View on Blockscout" hasArrow>
                            <Link
                              href={getExplorerLink(AGENT_QUEST_ADDRESS, lastMintedTokenId)}
                              isExternal
                              _hover={{ color: "#06b6d4" }}
                            >
                              <ExternalLinkIcon boxSize={3} color="gray.400" />
                            </Link>
                          </Tooltip>
                        </HStack>
                      </Box>
                    )}

                    <HStack spacing={4} flexWrap="wrap">
                      <HStack spacing={1}>
                        <Text fontSize="xs" color="gray.500" fontFamily="'Space Mono', monospace">
                          ⏰ Valid:
                        </Text>
                        <Text fontSize="xs" color="#fbbf24" fontFamily="'Space Mono', monospace">
                          {new Date(deadline * 1000).toLocaleString()}
                        </Text>
                      </HStack>
                      <HStack spacing={1}>
                        <Text fontSize="xs" color="gray.500" fontFamily="'Space Mono', monospace">
                          🔗 Chain:
                        </Text>
                        <Text fontSize="xs" color="#06b6d4" fontFamily="'Space Mono', monospace">
                          Soneium
                        </Text>
                      </HStack>
                    </HStack>
                  </Box>
                </Flex>

                {isSignatureExpired() && (
                  <Box bg="rgba(239,68,68,0.1)" borderRadius="lg" p={3} mb={4} border="1px solid rgba(239,68,68,0.2)">
                    <HStack spacing={2} justify="center">
                      <SmallCloseIcon color="#f87171" />
                      <Text fontSize="sm" color="#f87171" fontWeight="600">
                        Signature expired. Please retake the quiz.
                      </Text>
                    </HStack>
                  </Box>
                )}

                <HStack spacing={4} justify="center" flexWrap="wrap">
                  <Button
                    size="lg"
                    bgGradient={canMint(selectedQuest) ? "linear(135deg, #fbbf24, #ec4899)" : "rgba(75,85,99,0.3)"}
                    color={canMint(selectedQuest) ? "white" : "gray.500"}
                    fontWeight="700"
                    borderRadius="full"
                    px={8}
                    isDisabled={!canMint(selectedQuest)}
                    onClick={handleMintBadge}
                    _hover={{
                      transform: canMint(selectedQuest) ? "scale(1.02)" : "none",
                      boxShadow: canMint(selectedQuest) ? "0 0 30px rgba(251,191,36,0.3)" : "none",
                    }}
                    transition="all 0.3s"
                  >
                    {isSignatureExpired() ? "⏳ Expired" : canMint(selectedQuest) ? "🏅 Mint Badge" : "⏳ Already Minted"}
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    borderColor="rgba(139,92,246,0.3)"
                    color="gray.400"
                    borderRadius="full"
                    px={8}
                    onClick={() => {
                      setCurrentStep("list");
                      setQuizCompleted(false);
                      setSignature(null);
                      setDeadline(0);
                      setAnswers([]);
                    }}
                    _hover={{
                      borderColor: "rgba(139,92,246,0.6)",
                      color: "white",
                    }}
                  >
                    Back to Quests
                  </Button>
                </HStack>

                {/* Contract Explorer Link */}
                <Box mt={4}>
                  <Tooltip label="View contract on Blockscout" hasArrow>
                    <Link
                      href={`${BLOCKSCOUT_URL}/token/${AGENT_QUEST_ADDRESS}`}
                      isExternal
                      fontSize="xs"
                      color="gray.500"
                      _hover={{ color: "#06b6d4" }}
                      fontFamily="'Space Mono', monospace"
                    >
                      📜 View Contract on Blockscout <ExternalLinkIcon mx={1} boxSize={3} />
                    </Link>
                  </Tooltip>
                </Box>
              </Box>
            </MotionBox>
          )}

          {/* Footer */}
          <Box pt={10} pb={6} position="relative">
            <Box
              h="1px"
              mb={8}
              bg="linear-gradient(90deg, transparent, rgba(139,92,246,0.2), rgba(236,72,153,0.2), transparent)"
            />
            <VStack spacing={4}>
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
                  { label: "Season", value: "13" },
                  { label: "Chain", value: "Soneium" },
                  { label: "Status", value: "Live ✓" },
                  { label: "Quests", value: "4" },
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

// src/pages/ActivityReputation.tsx
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
  Avatar,
  useToast,
  Alert,
  AlertIcon,
  Divider,
  Grid,
  GridItem,
  Image,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Link,
  Tooltip,
  useDisclosure,
  Icon,
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
import { useState, useMemo } from "react";
import confetti from "canvas-confetti";
import { ChevronLeftIcon, ExternalLinkIcon, CopyIcon } from "@chakra-ui/icons";
import { FaTwitter } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import { useFixScroll } from "../hooks/useFixScroll";
import { useScrollRestore } from "../hooks/useScrollRestore";
import { useCampaign } from "../hooks/useCampaign";
import { usePartnerCooldowns } from "../hooks/usePartnerCooldowns";
import { usePartnerActions } from "../hooks/usePartnerActions";
import { useTransactionModal } from "../hooks/useTransactionModal";

import TransactionModal from "../components/TransactionModal";
import { LeaderboardModal } from "../components/LeaderboardModal";

// Constants
import {
  GM_CONTRACT,
  DEPLOY_CONTRACT,
  VOTE_CONTRACT,
  CHECKIN_CONTRACT,
  AGENT_CONTRACT,
  AGENT_GM_CONTRACT,
  AGENT_GATEWAY_CONTRACT,
  BADGE_CONTRACT,
  SONEIUM_CHAIN_ID,
  API_URL,
} from "../constants/contracts";
import { PARTNER_ACTIONS } from "../constants/partnerActions";
import { badgeABI, agentABI, agentGMABI } from "../constants/abis";

// ABIs
import { gmABI } from "../abi/gmABI";
import { VoteABI } from "../abi/VoteABI";
import { checkInABI } from "../abi/checkInABI";
import { DeployABI } from "../abi/DeployABI";
import { agentGatewayABI } from "../abi/agentGatewayABI";

// Utils
import {
  truncateAddress,
  formatNumber,
  formatFee,
  formatTimeRemaining,
  toHexAddress,
  getUserBadge,
  getNextTierTarget,
} from "../utils/helpers";
import { getPartnerABI, getPartnerArgs, getPartnerFee, getPartnerFunctionName } from "../utils/actions";

// Types
interface SuccessModalData {
  actionName: string;
  actionHandle?: string;
  points: number;
  txHash: string;
  totalCount?: number;
}

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
  @keyframes shimmerBtn {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }
  @keyframes borderRotate {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
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

        <VStack spacing={1}>
          <Text
            fontSize="9px"
            color="gray.500"
            fontFamily="'Space Mono', monospace"
            letterSpacing="0.12em"
            textAlign="center"
          >
            © {currentYear} · Agent Protocol · Activity Reputation
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

// ============= Main Page =============
export default function ActivityReputation() {
  const navigate = useNavigate();
  useFixScroll();

  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const toast = useToast();

  const { saveScrollPosition, restoreScrollPosition } = useScrollRestore();
  const { isOpen: isLeaderboardOpen, onOpen: onLeaderboardOpen, onClose: onLeaderboardClose } = useDisclosure();

  // Transaction Modal
  const {
    txOpen, setTxOpen,
    txStatus, setTxStatus,
    txTitle, setTxTitle,
    txDesc, setTxDesc,
    closeTx,
  } = useTransactionModal();

  // State
  const [isTxPending, setIsTxPending] = useState(false);
  const [actionPendingPayment, setActionPendingPayment] = useState<{ [key: number]: boolean }>({});
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState<{ action: typeof PARTNER_ACTIONS[0]; txHash: string } | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState<SuccessModalData | null>(null);

  const isCorrectChain = chainId === SONEIUM_CHAIN_ID;

  // Hooks
  const { campaignActive, campaignScheduled, timeRemaining, campaignStartTimeData } = useCampaign();
  const { getRemainingCooldown } = usePartnerCooldowns(address, isCorrectChain);
  const {
    defaultFee,
    userActionCounts,
    userPartnerTotal,
    refetchAll,
  } = usePartnerActions(address, isConnected, isCorrectChain);

  // ================= READ CONTRACT DATA =================
  const { data: gmFee = 0n } = useReadContract({
    address: toHexAddress(GM_CONTRACT),
    abi: gmABI,
    functionName: "gmFee",
    query: { enabled: true },
  });

  const { data: nextTokenId = 0n } = useReadContract({
    address: toHexAddress(GM_CONTRACT),
    abi: gmABI,
    functionName: "nextTokenId",
    query: { enabled: true },
  });
  const totalGMCount = Number(nextTokenId) - 1;

  const { data: userGmCount = 0n, refetch: refetchUserGmCount } = useReadContract({
    address: toHexAddress(GM_CONTRACT),
    abi: gmABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address && isConnected && isCorrectChain },
  });

  const { data: voteFee = 0n } = useReadContract({
    address: toHexAddress(VOTE_CONTRACT),
    abi: VoteABI,
    functionName: "voteFee",
    query: { enabled: true },
  });

  const { data: totalVotes = 0n } = useReadContract({
    address: toHexAddress(VOTE_CONTRACT),
    abi: VoteABI,
    functionName: "totalVotes",
    query: { enabled: true },
  });

  const { data: userVoteCount = 0n, refetch: refetchUserVoteCount } = useReadContract({
    address: toHexAddress(VOTE_CONTRACT),
    abi: VoteABI,
    functionName: "getUserVotes",
    args: address ? [address] : undefined,
    query: { enabled: !!address && isConnected && isCorrectChain },
  });

  const { data: checkInFee = 0n } = useReadContract({
    address: toHexAddress(CHECKIN_CONTRACT),
    abi: checkInABI,
    functionName: "checkInFee",
    query: { enabled: true },
  });

  const { data: totalCheckIns = 0n } = useReadContract({
    address: toHexAddress(CHECKIN_CONTRACT),
    abi: checkInABI,
    functionName: "totalCheckIns",
    query: { enabled: true },
  });

  const { data: userCheckInCount = 0n, refetch: refetchUserCheckInCount } = useReadContract({
    address: toHexAddress(CHECKIN_CONTRACT),
    abi: checkInABI,
    functionName: "getUserCheckIns",
    args: address ? [address] : undefined,
    query: { enabled: !!address && isConnected && isCorrectChain },
  });

  const { data: deployFee = 0n } = useReadContract({
    address: toHexAddress(DEPLOY_CONTRACT),
    abi: DeployABI,
    functionName: "gmFee",
    query: { enabled: true },
  });

  const { data: totalDeployments = 0n } = useReadContract({
    address: toHexAddress(DEPLOY_CONTRACT),
    abi: DeployABI,
    functionName: "totalDeployments",
    query: { enabled: true },
  });

  const { data: userDeployCount = 0n, refetch: refetchUserDeployCount } = useReadContract({
    address: toHexAddress(DEPLOY_CONTRACT),
    abi: DeployABI,
    functionName: "getUserDeploymentCount",
    args: address ? [address] : undefined,
    query: { enabled: !!address && isConnected && isCorrectChain },
  });

  const { data: userIsAgent = false } = useReadContract({
    address: toHexAddress(AGENT_CONTRACT),
    abi: agentABI,
    functionName: "isAgent",
    args: address ? [address] : undefined,
    query: { enabled: !!address && isConnected && isCorrectChain },
  });

  const { data: userAgentGmCount = 0n, refetch: refetchAgentGmCount } = useReadContract({
    address: toHexAddress(AGENT_GM_CONTRACT),
    abi: agentGMABI,
    functionName: "totalUserGM",
    args: address ? [address] : undefined,
    query: { enabled: !!address && isConnected && isCorrectChain },
  });

  // ================= BADGE CONTRACT READS =================
  const { data: minReputationScoreData = 0n } = useReadContract({
    address: toHexAddress(BADGE_CONTRACT),
    abi: badgeABI,
    functionName: "minReputationScore",
    query: { enabled: true },
  });
  const minReputationScore = Number(minReputationScoreData);

  const { data: userBadgeBalance = 0n, refetch: refetchBadgeBalance } = useReadContract({
    address: toHexAddress(BADGE_CONTRACT),
    abi: badgeABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address && isConnected && isCorrectChain },
  });

  const { data: userNonce = 0n } = useReadContract({
    address: toHexAddress(BADGE_CONTRACT),
    abi: badgeABI,
    functionName: "getNonce",
    args: address ? [address] : undefined,
    query: { enabled: !!address && isConnected && isCorrectChain },
  });

  const userTotalScore = Number(userGmCount) + Number(userVoteCount) + Number(userCheckInCount) + Number(userDeployCount) + Number(userAgentGmCount) + userPartnerTotal;
  const userBadge = getUserBadge(userTotalScore);
  const nextTierTarget = getNextTierTarget(userTotalScore);
  const reputationProgress = Math.min(100, (userTotalScore / nextTierTarget) * 100);
  const badgeProgress = Math.min(100, (userTotalScore / minReputationScore) * 100);

  // Refetch functions
  const refetchAllData = async () => {
    await Promise.all([
      refetchUserGmCount(),
      refetchUserVoteCount(),
      refetchUserCheckInCount(),
      refetchUserDeployCount(),
      refetchAgentGmCount(),
      refetchAll(),
    ]);
  };

  // Update leaderboard score
  const updateLeaderboardScore = async (points: number) => {
    if (!address) return;
    try {
      await fetch("/.netlify/functions/update-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, points }),
      });
    } catch (err) {
      console.error("Failed to update leaderboard:", err);
    }
  };

  // Share on X
  const shareOnX = (actionName: string, actionHandle: string | undefined, points: number) => {
    const handleTag = actionHandle ? ` ${actionHandle}` : "";
    const text = encodeURIComponent(
      `🌅 💬✨ Just completed ${actionName} on Soneium! ✨💬🌅\n\n` +
        `👤 +${points} Reputation Point\n` +
        `📈 Keeping the Web3 streak alive! 🔥\n\n` +
        `🎯 Join the community and start building your on-chain legacy!\n\n` +
        `@Soneium • @pulse_vault${handleTag}\n\n` +
        `✨ gm-agent.xyz ✨`
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank");
  };

  // ================= MINT BADGE HANDLER =================
  const handleMintBadge = async () => {
    // Verifică dacă utilizatorul are deja badge
    if (!address || !isCorrectChain || userBadgeBalance > 0n) {
      toast({
        title: "Badge Already Minted",
        description: "You already have the Reputation Badge! 🏅",
        status: "info",
        duration: 4000,
        position: "top-right",
      });
      return;
    }
    
    const score = userTotalScore;
    if (score < minReputationScore) {
      toast({
        title: "Insufficient Score",
        description: `You need at least ${minReputationScore} points (you have ${score})`,
        status: "warning",
        duration: 4000,
        position: "top-right",
      });
      return;
    }
    
    setIsTxPending(true);
    setTxOpen(true);
    setTxStatus("wallet");
    setTxTitle("🏅 Mint Reputation Badge");
    setTxDesc("Generating signature...");
    
    try {
      const response = await fetch(`${API_URL}/generate-mint-signature`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userAddress: address, score, nonce: userNonce.toString() }),
      });
      const data = await response.json();
      if (!response.ok || !data.signature) throw new Error(data.error || "Error generating signature");

      const { signature, deadline } = data;

      setTxDesc("Confirm mint on Soneium...");
      const hash = await writeContractAsync({
        address: toHexAddress(BADGE_CONTRACT),
        abi: badgeABI,
        functionName: "mint",
        args: [BigInt(score), signature, BigInt(deadline)],
      });
      setTxStatus("pending");
      setTxDesc("Waiting for blockchain confirmation...");
      const receipt = await publicClient!.waitForTransactionReceipt({ hash });
      if (receipt.status === "success") {
        setTxStatus("success");
        setTxTitle("🏅 Badge Minted!");
        setTxDesc("Congratulations! You received the Reputation Badge!");
        confetti({ particleCount: 300, spread: 90, origin: { y: 0.6 } });
        await refetchBadgeBalance();
        await updateLeaderboardScore(0);
        toast({
          title: "🎉 Success!",
          description: "Badge minted successfully!",
          status: "success",
          duration: 6000,
          position: "top-right",
        });
      }
    } catch (err: any) {
      const rejected = err?.message?.includes("rejected") || err?.code === 4001;
      setTxStatus(rejected ? "rejected" : "failed");
      setTxTitle(rejected ? "Mint Cancelled" : "Mint Failed");
    } finally {
      setIsTxPending(false);
    }
  };

  // ================= PARTNER ACTION HANDLERS =================
  const handlePayAndApprove = async (action: typeof PARTNER_ACTIONS[0]) => {
    if (isTxPending) return;
    if (!isCorrectChain) {
      switchChain?.({ chainId: SONEIUM_CHAIN_ID });
      return;
    }

    const remaining = getRemainingCooldown(action.id);
    if (remaining > 0) {
      toast({
        title: "Cooldown Active",
        description: `You must wait ${formatTimeRemaining(remaining)} before using ${action.name} again.`,
        status: "warning",
        duration: 4000,
        position: "top-right",
      });
      return;
    }

    saveScrollPosition();
    setIsTxPending(true);
    setTxOpen(true);
    setTxStatus("wallet");
    setTxTitle(`⚡ Pay & Interact: ${action.name}`);
    setTxDesc(`Confirm payment of ${formatFee(defaultFee)} ETH for ${action.name}...`);

    try {
      const hash = await writeContractAsync({
        address: toHexAddress(AGENT_GATEWAY_CONTRACT),
        abi: agentGatewayABI,
        functionName: "payAndApprove",
        args: [BigInt(action.id)],
        value: defaultFee,
      });

      setTxStatus("pending");
      setTxTitle("Payment Sent");
      setTxDesc("Waiting for confirmation...");

      const receipt = await publicClient!.waitForTransactionReceipt({ hash });

      if (receipt.status === "success") {
        setTxStatus("success");
        setTxTitle(`✅ Payment Confirmed!`);
        setTxDesc(`You can now execute the ${action.name} action.`);
        confetti({ particleCount: 200, spread: 80, origin: { y: 0.6 } });

        await refetchAllData();
        setTxOpen(false);
        setPaymentData({ action, txHash: hash });
        setShowPaymentModal(true);
        restoreScrollPosition();
      } else throw new Error("Transaction reverted on chain");
    } catch (err: any) {
      const rejected = err?.message?.includes("rejected") || err?.code === 4001;
      setTxStatus(rejected ? "rejected" : "failed");
      setTxTitle(rejected ? "Transaction Cancelled" : "Transaction Failed");
      setTxDesc(rejected ? "You cancelled the transaction." : err?.message || "Something went wrong.");
      restoreScrollPosition();
    } finally {
      setIsTxPending(false);
    }
  };

  const handleExecutePartnerAction = async (action: typeof PARTNER_ACTIONS[0]) => {
    if (isTxPending) return;
    if (!isCorrectChain) {
      switchChain?.({ chainId: SONEIUM_CHAIN_ID });
      return;
    }

    saveScrollPosition();
    setIsTxPending(true);
    setTxOpen(true);
    setTxStatus("wallet");
    setTxTitle(`⚡ Execute ${action.name}`);
    setTxDesc(`Confirm ${action.name} transaction on Soneium...`);

    try {
      const abi = getPartnerABI(action.id);
      const functionName = getPartnerFunctionName(action.id);
      const args = getPartnerArgs(action.id, address as `0x${string}`);
      const fee = getPartnerFee(action.id);

      const hash = await writeContractAsync({
        address: toHexAddress(action.target),
        abi: abi as any,
        functionName: functionName as any,
        args: args.length > 0 ? (args as any) : undefined,
        value: fee > 0n ? fee : undefined,
      } as any);

      setTxStatus("pending");
      setTxTitle("Transaction Sent");
      setTxDesc("Waiting for confirmation...");

      const receipt = await publicClient!.waitForTransactionReceipt({ hash });

      if (receipt.status === "success") {
        setTxStatus("success");
        setTxTitle(`✅ ${action.name} Completed!`);
        setTxDesc(`You earned +${action.points} reputation point!`);
        confetti({ particleCount: 200, spread: 80, origin: { y: 0.6 } });

        await refetchAllData();
        await updateLeaderboardScore(action.points);

        setActionPendingPayment((prev) => ({ ...prev, [action.id]: false }));
        setTxOpen(false);
        setShowPaymentModal(false);
        setPaymentData(null);

        const newTotalCount = Number(userActionCounts[action.id]?.data || 0n) + 1;

        setSuccessData({
          actionName: action.fullName,
          actionHandle: action.twitterHandle,
          points: action.points,
          txHash: hash,
          totalCount: newTotalCount,
        });
        setShowSuccessModal(true);
        restoreScrollPosition();
      } else throw new Error("Transaction reverted on chain");
    } catch (err: any) {
      const rejected = err?.message?.includes("rejected") || err?.code === 4001;
      setTxStatus(rejected ? "rejected" : "failed");
      setTxTitle(rejected ? "Transaction Cancelled" : "Transaction Failed");
      setTxDesc(rejected ? "You cancelled the transaction." : err?.message || "Something went wrong.");
      restoreScrollPosition();
    } finally {
      setIsTxPending(false);
    }
  };

  // ================= QUICK ACTIONS HANDLER =================
  const handleAction = async (type: "gm" | "vote" | "checkIn" | "deploy") => {
    if (isTxPending) return;
    if (!isCorrectChain) {
      switchChain?.({ chainId: SONEIUM_CHAIN_ID });
      return;
    }

    saveScrollPosition();

    let contractAddress: `0x${string}`;
    let abi: any;
    let functionName: string;
    let fee: bigint;
    let successTitle: string;
    let successDesc: string;
    let actionTitle: string;

    switch (type) {
      case "gm":
        contractAddress = toHexAddress(GM_CONTRACT);
        abi = gmABI;
        functionName = "gm";
        fee = gmFee;
        actionTitle = "GM";
        successTitle = "🎉 GM Sent!";
        successDesc = "Your daily good morning has been recorded on-chain!";
        break;
      case "vote":
        contractAddress = toHexAddress(VOTE_CONTRACT);
        abi = VoteABI;
        functionName = "vote";
        fee = voteFee;
        actionTitle = "Vote";
        successTitle = "🗳️ Vote Cast!";
        successDesc = "Your vote has been recorded on the blockchain!";
        break;
      case "checkIn":
        contractAddress = toHexAddress(CHECKIN_CONTRACT);
        abi = checkInABI;
        functionName = "checkIn";
        fee = checkInFee;
        actionTitle = "Check-In";
        successTitle = "✅ Checked In!";
        successDesc = "Your daily check-in has been recorded!";
        break;
      case "deploy":
        contractAddress = toHexAddress(DEPLOY_CONTRACT);
        abi = DeployABI;
        functionName = "deploy";
        fee = deployFee;
        actionTitle = "Deploy";
        successTitle = "🚀 Deployment Initiated!";
        successDesc = "Your contract deployment has been submitted!";
        break;
    }

    const value = fee > 0 ? fee : undefined;
    setIsTxPending(true);
    setTxOpen(true);
    setTxStatus("wallet");
    setTxTitle(`⚡ Confirm ${actionTitle}`);
    setTxDesc(`Confirm ${actionTitle} transaction on Soneium...`);

    try {
      const hash = await writeContractAsync({ address: contractAddress, abi, functionName, value });
      setTxStatus("pending");
      setTxTitle("Transaction Sent");
      setTxDesc("Waiting for confirmation...");
      const receipt = await publicClient!.waitForTransactionReceipt({ hash });

      if (receipt.status === "success") {
        setTxStatus("success");
        setTxTitle(successTitle);
        setTxDesc(successDesc);
        confetti({
          particleCount: 200,
          spread: 80,
          origin: { y: 0.6 },
          startVelocity: 30,
          colors: ["#8b5cf6", "#ec4899", "#3b82f6", "#22c55e", "#fbbf24"],
        });
        await refetchAllData();
        await updateLeaderboardScore(1);

        if (type === "gm") {
          setSuccessData({
            actionName: "GM",
            actionHandle: undefined,
            points: 1,
            txHash: hash,
            totalCount: Number(userGmCount) + 1,
          });
          setShowSuccessModal(true);
        } else {
          toast({
            title: successTitle,
            description: successDesc,
            status: "success",
            duration: 5000,
            isClosable: true,
            position: "top-right",
          });
        }
        restoreScrollPosition();
      } else throw new Error("Transaction reverted on chain");
    } catch (err: any) {
      const rejected = err?.message?.includes("rejected") || err?.shortMessage?.includes("rejected") || err?.code === 4001;
      if (rejected) {
        setTxStatus("rejected");
        setTxTitle("Transaction Cancelled");
        setTxDesc("You cancelled the transaction in your wallet.");
      } else {
        setTxStatus("failed");
        setTxTitle("Transaction Failed");
        setTxDesc(err?.message || "Something went wrong. Please try again.");
      }
      restoreScrollPosition();
    } finally {
      setIsTxPending(false);
    }
  };

  // UI Config
  const actions = [
    { type: "gm" as const, label: "Send GM", desc: "Spread positive vibes", fee: gmFee, icon: "🌅", color: "#22c55e", gradient: "linear(135deg, #22c55e, #16a34a)" },
    { type: "vote" as const, label: "Cast Vote", desc: "Shape the ecosystem", fee: voteFee, icon: "🗳️", color: "#8b5cf6", gradient: "linear(135deg, #8b5cf6, #a855f7)" },
    { type: "checkIn" as const, label: "Check-In", desc: "Daily proof of life", fee: checkInFee, icon: "✅", color: "#3b82f6", gradient: "linear(135deg, #3b82f6, #2563eb)" },
    { type: "deploy" as const, label: "Deploy", desc: "Launch smart contracts", fee: deployFee, icon: "🚀", color: "#ec4899", gradient: "linear(135deg, #ec4899, #db2777)" },
  ];

  const stats = [
    { label: "GM Sent", value: Number(userGmCount), icon: "🌅", color: "#22c55e", description: "Daily greetings sent" },
    { label: "Votes Cast", value: Number(userVoteCount), icon: "🗳️", color: "#8b5cf6", description: "Governance votes" },
    { label: "Check-Ins", value: Number(userCheckInCount), icon: "✅", color: "#3b82f6", description: "Daily check-ins" },
    { label: "Deployments", value: Number(userDeployCount), icon: "🚀", color: "#ec4899", description: "Contracts deployed" },
    { label: "Agent GM", value: Number(userAgentGmCount), icon: "🤖", color: "#c084fc", description: "Agent GM sent" },
    { label: "Partner Actions", value: userPartnerTotal, icon: "🤝", color: "#fbbf24", description: "Partner platform actions" },
  ];

  const globalStats = [
    { label: "Total GM", value: formatNumber(Math.max(0, totalGMCount)), icon: "🌅", color: "#22c55e", glowColor: "rgba(34,197,94,0.3)" },
    { label: "Total Votes", value: formatNumber(Number(totalVotes)), icon: "🗳️", color: "#8b5cf6", glowColor: "rgba(139,92,246,0.3)" },
    { label: "Total Check-Ins", value: formatNumber(Number(totalCheckIns)), icon: "✅", color: "#3b82f6", glowColor: "rgba(59,130,246,0.3)" },
    { label: "Total Deployments", value: formatNumber(Number(totalDeployments)), icon: "🚀", color: "#ec4899", glowColor: "rgba(236,72,153,0.3)" },
  ];

  // ===== Stats pentru header =====
  const headerStats = useMemo(() => [
    {
      label: "Total Actions",
      value: stats.reduce((sum, stat) => sum + stat.value, 0).toLocaleString(),
      icon: "🔄",
      color: "#a855f7",
      description: "On-chain actions",
      glowColor: "rgba(168,85,247,0.3)",
    },
    {
      label: "Reputation",
      value: userTotalScore.toString(),
      icon: "⭐",
      color: "#fbbf24",
      description: "Current score",
      glowColor: "rgba(251,191,36,0.3)",
    },
    {
      label: "Badge",
      value: userBadgeBalance > 0n ? "✅" : "🔒",
      icon: userBadgeBalance > 0n ? "🏅" : "🔐",
      color: userBadgeBalance > 0n ? "#4ade80" : "#6b7280",
      description: userBadgeBalance > 0n ? "Minted" : "Locked",
      glowColor: userBadgeBalance > 0n ? "rgba(74,222,128,0.3)" : "rgba(107,114,128,0.3)",
    },
    {
      label: "Agent",
      value: userIsAgent ? "✓" : "✗",
      icon: userIsAgent ? "🧬" : "🔬",
      color: userIsAgent ? "#2dd4bf" : "#6b7280",
      description: userIsAgent ? "Registered" : "Not registered",
      glowColor: userIsAgent ? "rgba(45,212,191,0.3)" : "rgba(107,114,128,0.3)",
    },
  ], [userTotalScore, userBadgeBalance, userIsAgent]);

  // Number of partner protocols
  const partnerProtocolsCount = PARTNER_ACTIONS.length;

  // Badge-ul a fost deja mintuit
  const hasBadge = userBadgeBalance > 0n;

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
        <Box
          position="fixed"
          top="45%"
          left="30%"
          w="450px"
          h="450px"
          borderRadius="full"
          bg="radial-gradient(circle, rgba(59,130,246,0.05) 0%, transparent 65%)"
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
                  bg: "rgba(139,92,246,0.08)",
                  borderColor: "rgba(139,92,246,0.25)",
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
                    bgGradient="linear(135deg, #a855f7 0%, #ec4899 50%, #fbbf24 100%)"
                    bgClip="text"
                    letterSpacing="-0.03em"
                    fontFamily="'Space Grotesk', sans-serif"
                  >
                    Activity Reputation
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
                    v2.1
                  </Badge>
                </HStack>
                <Text
                  color="gray.600"
                  fontSize={{ base: "9px", md: "10px" }}
                  letterSpacing="0.2em"
                  fontFamily="'Space Mono', monospace"
                  textTransform="uppercase"
                >
                  On-Chain · Reputation · Rewards
                </Text>
              </VStack>
            </HStack>

            <HStack spacing={3} display={{ base: "none", md: "flex" }}>
              <Button
                onClick={onLeaderboardOpen}
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
                leftIcon={<Text fontSize="14px">🏆</Text>}
              >
                Leaderboard
              </Button>

              <Button
                as="a"
                href="https://docs.gm-agent.xyz"
                target="_blank"
                rel="noopener noreferrer"
                bg="white"
                color="gray.800"
                size="sm"
                borderRadius="full"
                px={4}
                py={1.5}
                h="40px"
                fontWeight="700"
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
                transition="all 0.3s"
                rightIcon={<ExternalLinkIcon boxSize={3.5} />}
              >
                Docs
              </Button>

              <Box _hover={{ transform: "scale(1.02)" }} transition="transform 0.2s">
                <ConnectButton chainStatus="full" accountStatus="full" showBalance={false} />
              </Box>
            </HStack>
          </Flex>

          {/* Mobile wallet + buttons */}
          <VStack spacing={3} display={{ base: "flex", md: "none" }} w="full" mb={5}>
            <Box w="full" display="flex" justifyContent="center">
              <ConnectButton chainStatus="full" accountStatus="full" showBalance={false} />
            </Box>
            <HStack spacing={2} justify="center" w="full" flexWrap="wrap">
              <Button
                onClick={onLeaderboardOpen}
                bg="white"
                color="gray.800"
                size="sm"
                borderRadius="full"
                px={4}
                py={1.5}
                h="35px"
                fontWeight="650"
                fontSize="xs"
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
                transition="all 0.3s"
                leftIcon={<Text fontSize="sm">🏆</Text>}
              >
                Leaderboard
              </Button>
              <Button
                as="a"
                href="https://docs.gm-agent.xyz"
                target="_blank"
                rel="noopener noreferrer"
                bg="white"
                color="gray.800"
                size="sm"
                borderRadius="full"
                px={4}
                py={1.5}
                h="35px"
                fontWeight="650"
                fontSize="xs"
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
                transition="all 0.3s"
                rightIcon={<ExternalLinkIcon boxSize={2.5} />}
              >
                Docs
              </Button>
            </HStack>
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
                      Activity Reputation requires Soneium Network. Please switch to continue.
                    </Text>
                  </Box>
                  <Button
                    size="sm"
                    colorScheme="purple"
                    borderRadius="full"
                    fontWeight="700"
                    px={6}
                    onClick={() => switchChain?.({ chainId: SONEIUM_CHAIN_ID })}
                    fontFamily="'Space Grotesk', sans-serif"
                    _hover={{ transform: "translateY(-2px)", boxShadow: "0 4px 20px rgba(139,92,246,0.3)" }}
                    transition="all 0.2s"
                  >
                    Switch to Soneium
                  </Button>
                </Flex>
              </Box>
            </MotionBox>
          )}

          {/* Campaign Status Banner */}
          {isConnected && isCorrectChain && campaignStartTimeData !== undefined && (
            <Alert
              status="info"
              borderRadius="xl"
              mb={5}
              bg={campaignActive ? "rgba(34,197,94,0.08)" : campaignScheduled ? "rgba(139,92,246,0.08)" : "rgba(156,163,175,0.08)"}
              border={`1px solid ${campaignActive ? "#22c55e" : campaignScheduled ? "#a855f7" : "#6b7280"}30`}
              backdropFilter="blur(8px)"
              py={3}
            >
              <AlertIcon color={campaignActive ? "#22c55e" : campaignScheduled ? "#a855f7" : "#9ca3af"} />
              <Box flex="1">
                <HStack spacing={3} wrap="wrap">
                  <Text fontWeight="bold" color={campaignActive ? "#22c55e" : campaignScheduled ? "#a855f7" : "#9ca3af"} fontSize="sm">
                    {campaignActive ? "🎯 Campaign Active" : campaignScheduled ? "⏳ Campaign Scheduled" : "⏸️ Campaign Stopped"}
                  </Text>
                  {campaignScheduled && timeRemaining && (timeRemaining.days + timeRemaining.hours + timeRemaining.minutes + timeRemaining.seconds > 0) && (
                    <HStack spacing={1}>
                      <Text fontSize="xs" color="gray.400">Starts in:</Text>
                      <Text fontSize="sm" fontWeight="700" color="#a855f7" fontFamily="'Space Mono', monospace">
                        {timeRemaining.hours.toString().padStart(2, "0")}h {timeRemaining.minutes.toString().padStart(2, "0")}m
                      </Text>
                    </HStack>
                  )}
                  {campaignActive && (
                    <Badge colorScheme="green" variant="solid" fontSize="xs" px={2} py={0.5} borderRadius="full">
                      ● LIVE
                    </Badge>
                  )}
                </HStack>
              </Box>
            </Alert>
          )}

          {/* Stats Header */}
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={{ base: 2.5, md: 5 }} mb={{ base: 6, md: 10 }}>
            {headerStats.map((stat, i) => (
              <StatCard key={stat.label} stat={stat} index={i} />
            ))}
          </SimpleGrid>

          {/* Global Stats */}
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={{ base: 2.5, md: 5 }} mb={{ base: 6, md: 10 }}>
            {globalStats.map((stat, i) => (
              <StatCard key={stat.label} stat={stat} index={i} />
            ))}
          </SimpleGrid>

          {/* Quick Actions */}
          <Box mb={{ base: 6, md: 12 }}>
            <HStack mb={{ base: 3, md: 5 }} spacing={2}>
              <Box w="4px" h="4px" borderRadius="full" bg="#a855f7" animation="pulseGlow 2s infinite" />
              <Heading size="sm" color="gray.300" fontWeight="600" fontFamily="'Space Grotesk', sans-serif">
                ✨ Quick Actions
              </Heading>
            </HStack>
            <SimpleGrid columns={{ base: 2, sm: 2, md: 4 }} spacing={{ base: 3, md: 5 }}>
              {actions.map((action) => (
                <MotionBox
                  key={action.type}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  whileHover={{ y: -6 }}
                  cursor="pointer"
                  onClick={() => handleAction(action.type)}
                >
                  <Box
                    bg="rgba(4,4,14,0.85)"
                    backdropFilter="blur(20px)"
                    borderRadius="2xl"
                    border={`1px solid ${action.color}30`}
                    p={{ base: 4, md: 5 }}
                    transition="all 0.3s"
                    _hover={{
                      borderColor: action.color,
                      bg: "rgba(4,4,14,0.95)",
                      boxShadow: `0 0 30px ${action.color}20`,
                    }}
                  >
                    <VStack spacing={{ base: 2, md: 3 }}>
                      <Box fontSize={{ base: "40px", md: "56px" }} style={{ animation: "floatCard 4s ease-in-out infinite" }}>
                        {action.icon}
                      </Box>
                      <Heading size="xs" color="white" fontWeight="700" fontFamily="'Space Grotesk', sans-serif">
                        {action.label}
                      </Heading>
                      <Text fontSize="xs" color="gray.400" textAlign="center" fontFamily="'Space Grotesk', sans-serif" display={{ base: "none", md: "block" }}>
                        {action.desc}
                      </Text>
                      <Badge
                        bg={`${action.color}15`}
                        color={action.color}
                        px={3}
                        py={1}
                        borderRadius="full"
                        fontSize="9px"
                        border={`1px solid ${action.color}30`}
                        fontFamily="'Space Mono', monospace"
                      >
                        Fee: {formatFee(action.fee)} ETH
                      </Badge>
                      <Button
                        size="sm"
                        w="full"
                        bgGradient={action.gradient}
                        color="white"
                        isLoading={isTxPending}
                        _hover={{ opacity: 0.9, transform: "scale(1.02)" }}
                        borderRadius="full"
                        fontSize="xs"
                        fontWeight="600"
                        fontFamily="'Space Grotesk', sans-serif"
                        py={2}
                      >
                        {action.label}
                      </Button>
                    </VStack>
                  </Box>
                </MotionBox>
              ))}
            </SimpleGrid>
          </Box>

          {/* MAIN CONTENT */}
          {!isConnected ? (
            <Box textAlign="center" py={20} bg="rgba(4,4,14,0.6)" borderRadius="3xl" border="1px solid rgba(139,92,246,0.15)">
              <Text fontSize="56px" mb={4}>🔌</Text>
              <Text color="gray.500" fontFamily="'Space Mono', monospace" fontSize="md">
                Connect your wallet to see your stats
              </Text>
            </Box>
          ) : !isCorrectChain ? (
            <Box textAlign="center" py={20} bg="rgba(4,4,14,0.6)" borderRadius="3xl" border="1px solid rgba(139,92,246,0.15)">
              <Text fontSize="56px" mb={4}>⚠️</Text>
              <Text color="gray.500" fontFamily="'Space Mono', monospace" fontSize="md">
                Switch to Soneium network to see your stats
              </Text>
            </Box>
          ) : (
            <VStack spacing={{ base: 4, md: 8 }} align="stretch">
              <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={{ base: 4, md: 8 }}>
                {/* Profile Card */}
                <GridItem>
                  <Box
                    bg="rgba(4,4,14,0.85)"
                    backdropFilter="blur(24px)"
                    borderRadius={{ base: "2xl", md: "3xl" }}
                    border="1px solid rgba(139,92,246,0.25)"
                    overflow="hidden"
                    transition="all 0.4s"
                    _hover={{ borderColor: "rgba(139,92,246,0.5)", transform: "translateY(-4px)" }}
                    h="100%"
                  >
                    <Box h="3px" bgGradient="linear(90deg, #8b5cf6, #ec4899, #3b82f6, #8b5cf6)" backgroundSize="300% 100%" style={{ animation: "shimmerBorder 3s infinite" }} />

                    <Box position="absolute" top={6} left={6} zIndex={2}>
                      <Badge
                        bg={userBadge.bg}
                        color={userBadge.color}
                        px={3}
                        py={1.5}
                        borderRadius="full"
                        fontSize="xs"
                        fontWeight="700"
                        border={`1px solid ${userBadge.color}`}
                        boxShadow={`0 0 15px ${userBadge.glow}`}
                        animation="pulseGlow 2.5s ease-in-out infinite"
                        fontFamily="'Space Mono', monospace"
                      >
                        {userBadge.icon} {userBadge.label}
                      </Badge>
                    </Box>

                    <Box position="absolute" top={6} right={6} zIndex={2}>
                      {userIsAgent ? (
                        <Badge
                          bgGradient="linear(135deg, #c084fc, #ec4899)"
                          color="white"
                          px={3}
                          py={1.5}
                          borderRadius="full"
                          fontSize="xs"
                          fontWeight="700"
                          boxShadow="0 0 20px #c084fc"
                          animation="pulseGlow 2s ease-in-out infinite"
                          fontFamily="'Space Mono', monospace"
                        >
                          🧬 AGENT ✓
                        </Badge>
                      ) : (
                        <Button
                          size="xs"
                          variant="outline"
                          bg="rgba(139,92,246,0.1)"
                          borderColor="#c084fc"
                          color="#c084fc"
                          _hover={{ bg: "rgba(139,92,246,0.2)", transform: "scale(1.02)", boxShadow: "0 0 15px #c084fc" }}
                          onClick={() => (window.location.href = "/")}
                          borderRadius="full"
                          fontSize="9px"
                          fontWeight="600"
                          fontFamily="'Space Mono', monospace"
                          px={3}
                          py={1}
                          animation="pulseGlow 2s ease-in-out infinite"
                        >
                          Register
                        </Button>
                      )}
                    </Box>

                    <Box p={{ base: 5, md: 8 }} pt={{ base: 8, md: 10 }}>
                      <VStack spacing={{ base: 4, md: 5 }}>
                        <Avatar
                          size={{ base: "xl", md: "2xl" }}
                          bgGradient="linear(135deg, #8b5cf6, #ec4899)"
                          src="/agent.png"
                          icon={<Text fontSize="40px">🕵️</Text>}
                          boxShadow="0 0 30px rgba(139,92,246,0.4)"
                        />

                        <VStack spacing={2} align="center">
                          <HStack spacing={2}>
                            <Box w="6px" h="6px" borderRadius="full" bg="#4ade80" boxShadow="0 0 8px #4ade80" animation="pulseGlow 2s ease-in-out infinite" />
                            <Text fontSize="xs" color="#4ade80" fontFamily="'Space Mono', monospace" fontWeight="500">
                              Connected
                            </Text>
                          </HStack>
                          <Text fontWeight="700" fontSize="lg" fontFamily="'Space Mono', monospace" color="white" letterSpacing="tight">
                            {truncateAddress(address || "")}
                          </Text>
                        </VStack>

                        {/* Reputation Score */}
                        <Box w="full">
                          <Flex justify="space-between" mb={2}>
                            <Text fontSize="xs" color="gray.400" fontFamily="'Space Mono', monospace" fontWeight="600">
                              🏆 REPUTATION SCORE
                            </Text>
                            <Text fontWeight="800" color="#a855f7" fontSize="md">
                              {userTotalScore} / {nextTierTarget}
                            </Text>
                          </Flex>
                          <Box position="relative" h="8px" bg="rgba(139,92,246,0.15)" borderRadius="full" overflow="hidden">
                            <Box
                              h="100%"
                              borderRadius="full"
                              bgGradient="linear(90deg, #8b5cf6, #ec4899)"
                              transition="width 1.2s cubic-bezier(0.4, 0, 0.2, 1)"
                              width={`${reputationProgress}%`}
                              position="relative"
                              _after={{
                                content: '""',
                                position: "absolute",
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
                                animation: "shimmerBtn 2s infinite",
                              }}
                            />
                          </Box>
                          <Flex justify="space-between" mt={1}>
                            <Text fontSize="9px" color="gray.400" fontFamily="'Space Mono', monospace">
                              Current: {userTotalScore} pts
                            </Text>
                            <Text fontSize="9px" color="gray.400" fontFamily="'Space Mono', monospace">
                              Next: {nextTierTarget} ({nextTierTarget - userTotalScore} to go)
                            </Text>
                          </Flex>
                        </Box>

                        {/* Total Partner Actions - CORECTAT */}
                        <Box w="full" p={3} bg="rgba(0,0,0,0.3)" borderRadius="lg">
                          <Flex justify="space-between" align="center">
                            <HStack spacing={2}>
                              <Text fontSize="xs" color="gray.400" fontFamily="'Space Mono', monospace">
                                🤝 Total Partner Actions
                              </Text>
                              <Tooltip label="Total number of partner actions completed" hasArrow>
                                <Text fontSize="9px" color="gray.500">ⓘ</Text>
                              </Tooltip>
                            </HStack>
                            <Text fontSize="lg" fontWeight="800" color="#fbbf24" fontFamily="'Space Mono', monospace">
                              {userPartnerTotal}
                            </Text>
                          </Flex>
                          <Box mt={1} h="4px" bg="rgba(251,191,36,0.15)" borderRadius="full" overflow="hidden">
                            <Box
                              h="100%"
                              borderRadius="full"
                              bg="#fbbf24"
                              transition="width 1s ease-out"
                              width={`${Math.min(100, (userPartnerTotal / 500) * 100)}%`}
                            />
                          </Box>
                        </Box>

                        {/* BADGE SECTION */}
                        <Box w="full" mt={2}>
                          <Text fontSize="md" fontWeight="700" color="#a855f7" textAlign="center" fontFamily="'Space Grotesk', sans-serif">
                            🏅 REPUTATION BADGE
                          </Text>

                          <Text fontSize="9px" color="gray.400" textAlign="center" mb={3} fontWeight="500" letterSpacing="0.05em" fontFamily="'Space Grotesk', sans-serif">
                            Complete activities to earn this exclusive badge • Part of Season NFT Collections
                          </Text>

                          {/* Dacă badge-ul a fost deja mintuit */}
                        {hasBadge ? (
                          <Box
                            bg="rgba(139,92,246,0.06)"
                            borderRadius="xl"
                            border="1px solid rgba(139,92,246,0.2)"
                            p={5}
                            transition="all 0.3s"
                            _hover={{ borderColor: "rgba(139,92,246,0.4)", boxShadow: "0 0 30px rgba(139,92,246,0.05)" }}
                          >
                            <VStack spacing={3}>
                              {/* NFT Preview - mai mare și mai detaliat */}
                              <HStack spacing={4} w="full" align="center">
                                <Box
                                  position="relative"
                                  w="80px"
                                  h="80px"
                                  flexShrink={0}
                                  borderRadius="lg"
                                  overflow="hidden"
                                  border="2px solid #a855f7"
                                  boxShadow="0 0 30px rgba(168,85,247,0.4)"
                                  transition="all 0.3s"
                                  _hover={{ transform: "scale(1.05)", boxShadow: "0 0 50px rgba(168,85,247,0.6)" }}
                                >
                                  <Image
                                    src="/agentbadge.png"
                                    alt="Reputation Badge NFT"
                                    w="100%"
                                    h="100%"
                                    objectFit="cover"
                                    fallbackSrc="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'><text y='55%' x='50%' text-anchor='middle' font-size='44'>🏅</text></svg>"
                                  />
                                  <Badge
                                    position="absolute"
                                    bottom="2px"
                                    right="2px"
                                    bgGradient="linear(135deg, #a855f7, #7c3aed)"
                                    color="white"
                                    fontSize="8px"
                                    px={2}
                                    py={0.5}
                                    borderRadius="full"
                                    fontFamily="'Space Mono', monospace"
                                    border="1px solid rgba(255,255,255,0.1)"
                                  >
                                    SBT
                                  </Badge>
                                </Box>
                                <Box textAlign="left" flex="1">
                                  <HStack spacing={2} wrap="wrap">
                                    <Text fontSize="md" fontWeight="700" color="#4ade80" fontFamily="'Space Grotesk', sans-serif">
                                      ✅ Badge Minted
                                    </Text>
                                    <Badge
                                      bg="rgba(251,191,36,0.12)"
                                      color="#fbbf24"
                                      fontSize="9px"
                                      px={2.5}
                                      py={1}
                                      borderRadius="full"
                                      fontWeight="700"
                                      fontFamily="'Space Mono', monospace"
                                      animation="pulseGlow 2s ease-in-out infinite"
                                      border="1px solid rgba(251,191,36,0.15)"
                                    >
                                      🏆 S12
                                    </Badge>
                                  </HStack>
                                  <Text fontSize="xs" color="gray.400" fontFamily="'Space Grotesk', sans-serif" mt={1}>
                                    You are a verified member of the Soneium community!
                                  </Text>
                                  <Text fontSize="9px" color="gray.500" fontFamily="'Space Mono', monospace" mt={0.5}>
                                    🏆 Part of Season 12 NFT Collections
                                  </Text>
                                </Box>
                              </HStack>

                              {/* Stats Grid - mai detaliat */}
                              <SimpleGrid columns={3} spacing={2} w="full">
                                <Box 
                                  textAlign="center" 
                                  p={2} 
                                  bg="rgba(0,0,0,0.3)" 
                                  borderRadius="md" 
                                  border="1px solid rgba(139,92,246,0.1)"
                                  transition="all 0.2s"
                                  _hover={{ borderColor: "rgba(139,92,246,0.3)", bg: "rgba(0,0,0,0.4)" }}
                                >
                                  <Text fontSize="8px" color="gray.500" fontWeight="500" fontFamily="'Space Mono', monospace">Score Required</Text>
                                  <Text fontSize="md" fontWeight="700" color="#a855f7" fontFamily="'Space Mono', monospace">{minReputationScore}+</Text>
                                </Box>
                                <Box 
                                  textAlign="center" 
                                  p={2} 
                                  bg="rgba(0,0,0,0.3)" 
                                  borderRadius="md" 
                                  border="1px solid rgba(34,197,94,0.1)"
                                  transition="all 0.2s"
                                  _hover={{ borderColor: "rgba(34,197,94,0.3)", bg: "rgba(0,0,0,0.4)" }}
                                >
                                  <Text fontSize="8px" color="gray.500" fontWeight="500" fontFamily="'Space Mono', monospace">Your Score</Text>
                                  <Text fontSize="md" fontWeight="700" color="#4ade80" fontFamily="'Space Mono', monospace">{userTotalScore}</Text>
                                </Box>
                                <Box 
                                  textAlign="center" 
                                  p={2} 
                                  bg="rgba(0,0,0,0.3)" 
                                  borderRadius="md" 
                                  border="1px solid rgba(139,92,246,0.1)"
                                  transition="all 0.2s"
                                  _hover={{ borderColor: "rgba(139,92,246,0.3)", bg: "rgba(0,0,0,0.4)" }}
                                >
                                  <Text fontSize="8px" color="gray.500" fontWeight="500" fontFamily="'Space Mono', monospace">Chain</Text>
                                  <Text fontSize="md" fontWeight="700" color="#8b5cf6" fontFamily="'Space Mono', monospace">Soneium</Text>
                                </Box>
                              </SimpleGrid>

                              {/* Bonus Badge */}
                              <HStack spacing={3} justify="center" wrap="wrap" w="full">
                                <Badge
                                  bg="rgba(34,197,94,0.1)"
                                  color="#4ade80"
                                  px={3}
                                  py={1.5}
                                  rounded="full"
                                  fontSize="10px"
                                  fontFamily="'Space Mono', monospace"
                                  fontWeight="700"
                                  border="1px solid rgba(34,197,94,0.15)"
                                  animation="pulseGlow 2.5s ease-in-out infinite"
                                  display="inline-flex"
                                  alignItems="center"
                                  gap={1.5}
                                >
                                  ⚡ +2 Score Bonus
                                </Badge>
                                <Badge
                                  bg="rgba(139,92,246,0.08)"
                                  color="#a855f7"
                                  px={3}
                                  py={1.5}
                                  rounded="full"
                                  fontSize="10px"
                                  fontFamily="'Space Mono', monospace"
                                  fontWeight="600"
                                  border="1px solid rgba(139,92,246,0.12)"
                                >
                                  🧬 Soulbound
                                </Badge>
                              </HStack>

                              <Divider borderColor="rgba(139,92,246,0.1)" />

                              {/* Beneficii - mai detaliate */}
                              <SimpleGrid columns={2} spacing={2} w="full">
                                <HStack spacing={2} p={2} bg="rgba(74,222,128,0.05)" borderRadius="md" border="1px solid rgba(74,222,128,0.06)" transition="all 0.2s" _hover={{ bg: "rgba(74,222,128,0.08)" }}>
                                  <Text fontSize="14px" color="#4ade80" fontWeight="700">✓</Text>
                                  <Box>
                                    <Text fontSize="10px" color="gray.300" fontWeight="600" fontFamily="'Space Grotesk', sans-serif">Verified Status</Text>
                                    <Text fontSize="8px" color="gray.500" fontFamily="'Space Grotesk', sans-serif">On-chain reputation</Text>
                                  </Box>
                                </HStack>
                                <HStack spacing={2} p={2} bg="rgba(139,92,246,0.05)" borderRadius="md" border="1px solid rgba(139,92,246,0.06)" transition="all 0.2s" _hover={{ bg: "rgba(139,92,246,0.08)" }}>
                                  <Text fontSize="14px" color="#4ade80" fontWeight="700">✓</Text>
                                  <Box>
                                    <Text fontSize="10px" color="gray.300" fontWeight="600" fontFamily="'Space Grotesk', sans-serif">DAO Voting Power</Text>
                                    <Text fontSize="8px" color="gray.500" fontFamily="'Space Grotesk', sans-serif">Governance influence</Text>
                                  </Box>
                                </HStack>
                                <HStack spacing={2} p={2} bg="rgba(168,85,247,0.05)" borderRadius="md" border="1px solid rgba(168,85,247,0.06)" transition="all 0.2s" _hover={{ bg: "rgba(168,85,247,0.08)" }}>
                                  <Text fontSize="14px" color="#4ade80" fontWeight="700">✓</Text>
                                  <Box>
                                    <Text fontSize="10px" color="gray.300" fontWeight="600" fontFamily="'Space Grotesk', sans-serif">Exclusive Access</Text>
                                    <Text fontSize="8px" color="gray.500" fontFamily="'Space Grotesk', sans-serif">Community perks</Text>
                                  </Box>
                                </HStack>
                                <HStack spacing={2} p={2} bg="rgba(251,191,36,0.05)" borderRadius="md" border="1px solid rgba(251,191,36,0.06)" transition="all 0.2s" _hover={{ bg: "rgba(251,191,36,0.08)" }}>
                                  <Text fontSize="14px" color="#4ade80" fontWeight="700">✓</Text>
                                  <Box>
                                    <Text fontSize="10px" color="gray.300" fontWeight="600" fontFamily="'Space Grotesk', sans-serif">Future Airdrops</Text>
                                    <Text fontSize="8px" color="gray.500" fontFamily="'Space Grotesk', sans-serif">Reward eligibility</Text>
                                  </Box>
                                </HStack>
                              </SimpleGrid>

                              <Divider borderColor="rgba(139,92,246,0.1)" />

                              {/* Link către explorer */}
                              <Button
                                size="sm"
                                variant="link"
                                color="#a855f7"
                                fontSize="10px"
                                onClick={() => window.open(`https://soneium.blockscout.com/address/${BADGE_CONTRACT}`, '_blank')}
                                fontWeight="600"
                                _hover={{ color: "#7c3aed", textDecoration: "none", transform: "translateX(4px)" }}
                                py={1}
                                fontFamily="'Space Mono', monospace"
                                rightIcon={<ExternalLinkIcon boxSize={3} />}
                                w="full"
                                justifyContent="center"
                                transition="all 0.2s"
                              >
                                📜 View Badge Contract on Explorer
                              </Button>

                              <Text fontSize="9px" color="gray.500" textAlign="center" fontFamily="'Space Grotesk', sans-serif">
                                Soulbound Token (Non-Transferable) • Forever tied to your wallet
                              </Text>
                            </VStack>
                          </Box>
                        ) : !userIsAgent ? (
                            <Box
                              bg="rgba(139,92,246,0.06)"
                              borderRadius="2xl"
                              border="2px solid rgba(139,92,246,0.2)"
                              p={5}
                              transition="all 0.3s"
                              _hover={{ borderColor: "rgba(139,92,246,0.4)", bg: "rgba(139,92,246,0.1)" }}
                            >
                              <VStack spacing={3}>
                                <Box textAlign="center">
                                  <Text fontSize="40px" mb={2}>🔐</Text>
                                  <Text fontSize="lg" fontWeight="700" color="white" fontFamily="'Space Grotesk', sans-serif">
                                    Register as Agent to unlock the Badge System
                                  </Text>
                                  <Text fontSize="sm" color="gray.400" mt={2} fontFamily="'Space Grotesk', sans-serif">
                                    Becoming an ERC-8004 Agent is the first step to earning your reputation badge.
                                    Once registered, you can:
                                  </Text>
                                </Box>

                                <VStack spacing={2} align="start" w="full" bg="rgba(0,0,0,0.2)" p={3} borderRadius="lg">
                                  <HStack spacing={2}>
                                    <Text fontSize="14px">✅</Text>
                                    <Text fontSize="sm" color="gray.300" fontFamily="'Space Grotesk', sans-serif">Send daily GM messages to build your streak</Text>
                                  </HStack>
                                  <HStack spacing={2}>
                                    <Text fontSize="14px">✅</Text>
                                    <Text fontSize="sm" color="gray.300" fontFamily="'Space Grotesk', sans-serif">Cast votes and participate in governance</Text>
                                  </HStack>
                                  <HStack spacing={2}>
                                    <Text fontSize="14px">✅</Text>
                                    <Text fontSize="sm" color="gray.300" fontFamily="'Space Grotesk', sans-serif">Perform check-ins and deploy contracts</Text>
                                  </HStack>
                                  <HStack spacing={2}>
                                    <Text fontSize="14px">✅</Text>
                                    <Text fontSize="sm" color="gray.300" fontFamily="'Space Grotesk', sans-serif">Earn reputation points from partner actions</Text>
                                  </HStack>
                                  <HStack spacing={2}>
                                    <Text fontSize="14px">✅</Text>
                                    <Text fontSize="sm" color="#fbbf24" fontFamily="'Space Grotesk', sans-serif">Mint your exclusive Soulbound Reputation Badge</Text>
                                  </HStack>
                                </VStack>

                                <Button
                                  onClick={() => navigate("/")}
                                  w="full"
                                  size="lg"
                                  bgGradient="linear(135deg, #a855f7, #ec4899)"
                                  color="white"
                                  fontWeight="700"
                                  fontSize="sm"
                                  fontFamily="'Space Grotesk', sans-serif"
                                  _hover={{ transform: "scale(1.02)", boxShadow: "0 0 40px rgba(168,85,247,0.4)" }}
                                  transition="all 0.3s"
                                  borderRadius="full"
                                >
                                  🔗 Register as Agent Now
                                </Button>

                                <Text fontSize="xs" color="gray.500" textAlign="center" fontFamily="'Space Grotesk', sans-serif">
                                  One-time registration on Soneium Mainnet • Soulbound identity
                                </Text>
                              </VStack>
                            </Box>
                          ) : userIsAgent && userTotalScore >= minReputationScore ? (
                            <Box
                              bg="rgba(139,92,246,0.06)"
                              borderRadius="2xl"
                              border="2px dashed rgba(251,191,36,0.3)"
                              p={5}
                              transition="all 0.3s"
                              _hover={{ borderColor: "rgba(251,191,36,0.5)", bg: "rgba(139,92,246,0.1)" }}
                            >
                              <VStack spacing={3}>
                                <Box
                                  position="relative"
                                  w="80px"
                                  h="80px"
                                  mx="auto"
                                  borderRadius="xl"
                                  overflow="hidden"
                                  opacity={0.6}
                                  filter="grayscale(50%)"
                                  transition="all 0.3s"
                                  _hover={{ opacity: 0.8, filter: "grayscale(30%)" }}
                                >
                                  <Image
                                    src="/agentbadge.png"
                                    alt="Reputation Badge Preview"
                                    w="100%"
                                    h="100%"
                                    objectFit="cover"
                                    fallbackSrc="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'><text y='55%' x='50%' text-anchor='middle' font-size='48'>🏅</text></svg>"
                                  />
                                  <Box position="absolute" inset={0} bg="rgba(0,0,0,0.5)" display="flex" alignItems="center" justifyContent="center">
                                    <Badge bg="#a855f7" fontSize="9px" fontWeight="700" px={2} py={1} borderRadius="full" fontFamily="'Space Mono', monospace">
                                      LOCKED
                                    </Badge>
                                  </Box>
                                </Box>

                                <Text fontWeight="700" fontSize="lg" color="#a855f7" textAlign="center" fontFamily="'Space Grotesk', sans-serif">
                                  Exclusive Reputation Badge
                                </Text>

                                <Text fontSize="sm" color="gray.400" textAlign="center" fontWeight="500" fontFamily="'Space Grotesk', sans-serif">
                                  You've earned the right to mint this badge!
                                </Text>

                                <Badge
                                  bg="rgba(251,191,36,0.12)"
                                  color="#fbbf24"
                                  fontSize="xs"
                                  px={3}
                                  py={1.5}
                                  borderRadius="full"
                                  fontWeight="600"
                                  animation="pulseGlow 2s ease-in-out infinite"
                                  fontFamily="'Space Mono', monospace"
                                >
                                  ⚡ +2 Score Bonus on mint
                                </Badge>

                                <Button
                                  onClick={handleMintBadge}
                                  isLoading={isTxPending}
                                  w="full"
                                  size="lg"
                                  bgGradient="linear(135deg, #a855f7, #ec4899)"
                                  color="white"
                                  fontWeight="700"
                                  fontSize="sm"
                                  leftIcon={<Text>🏅</Text>}
                                  _hover={{ transform: "scale(1.02)", boxShadow: "0 0 40px rgba(168,85,247,0.4)" }}
                                  transition="all 0.3s"
                                  borderRadius="full"
                                  fontFamily="'Space Grotesk', sans-serif"
                                >
                                  MINT REPUTATION BADGE
                                </Button>
                              </VStack>
                            </Box>
                          ) : userIsAgent && userTotalScore < minReputationScore ? (
                            <Box
                              bg="rgba(139,92,246,0.04)"
                              borderRadius="2xl"
                              border="1px solid rgba(139,92,246,0.15)"
                              p={4}
                              transition="all 0.3s"
                              _hover={{ borderColor: "rgba(139,92,246,0.3)", bg: "rgba(139,92,246,0.06)" }}
                            >
                              <VStack spacing={2.5}>
                                <Box
                                  position="relative"
                                  w="70px"
                                  h="70px"
                                  mx="auto"
                                  borderRadius="xl"
                                  overflow="hidden"
                                  filter="blur(4px)"
                                  opacity={0.4}
                                >
                                  <Image
                                    src="/agentbadge.png"
                                    alt="Badge Preview"
                                    w="100%"
                                    h="100%"
                                    objectFit="cover"
                                    fallbackSrc="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='70' height='70'><text y='55%' x='50%' text-anchor='middle' font-size='40'>🏅</text></svg>"
                                  />
                                </Box>

                                <Text fontWeight="700" fontSize="md" color="#9ca3af" textAlign="center" fontFamily="'Space Grotesk', sans-serif">
                                  🔒 Reputation Badge (Locked)
                                </Text>

                                <Text fontSize="xs" color="gray.400" textAlign="center" fontWeight="500" fontFamily="'Space Grotesk', sans-serif">
                                  Complete activities to unlock this exclusive badge
                                </Text>

                                <Badge
                                  bg="rgba(251,191,36,0.08)"
                                  color="#fbbf24"
                                  fontSize="9px"
                                  px={3}
                                  py={1}
                                  borderRadius="full"
                                  fontWeight="600"
                                  border="1px solid rgba(251,191,36,0.15)"
                                  animation="pulseGlow 3s ease-in-out infinite"
                                  fontFamily="'Space Mono', monospace"
                                >
                                  🏆 Soneium Season 12 Score
                                </Badge>

                                <Box p={3} bg="rgba(0,0,0,0.3)" borderRadius="lg" border="1px solid rgba(139,92,246,0.1)">
                                  <Flex justify="space-between" mb={1}>
                                    <Text fontSize="9px" color="gray.400" fontWeight="600" letterSpacing="0.05em" fontFamily="'Space Mono', monospace">
                                      BADGE REQUIREMENTS
                                    </Text>
                                    <Text fontSize="9px" color="#a855f7" fontWeight="700" fontFamily="'Space Mono', monospace">
                                      {userTotalScore} / {minReputationScore}
                                    </Text>
                                  </Flex>
                                  <Box h="5px" bg="rgba(139,92,246,0.2)" borderRadius="full" overflow="hidden">
                                    <Box
                                      h="100%"
                                      borderRadius="full"
                                      bgGradient="linear(90deg, #8b5cf6, #ec4899)"
                                      transition="width 1s ease-out"
                                      width={`${badgeProgress}%`}
                                      position="relative"
                                      _after={{
                                        content: '""',
                                        position: "absolute",
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
                                        animation: "shimmerBtn 1.5s infinite",
                                      }}
                                    />
                                  </Box>
                                  <Flex justify="space-between" align="center" mt={1}>
                                    <HStack spacing={1}>
                                      <Text fontSize="9px" color="#fbbf24">⭐</Text>
                                      <Text fontSize="9px" color="gray.400" fontWeight="500" fontFamily="'Space Grotesk', sans-serif">
                                        Points needed:
                                      </Text>
                                    </HStack>
                                    <Text fontSize="md" fontWeight="800" color="#a855f7" fontFamily="'Space Mono', monospace">
                                      {minReputationScore - userTotalScore} more
                                    </Text>
                                  </Flex>
                                </Box>

                                <Text fontSize="8px" color="gray.400" fontWeight="600" letterSpacing="0.05em" fontFamily="'Space Mono', monospace">
                                  ✨ BADGE BENEFITS:
                                </Text>

                                <VStack spacing={0.5} align="start" w="full">
                                  <HStack spacing={2} w="full" p={0.5} borderRadius="md" transition="all 0.3s" _hover={{ bg: "rgba(74,222,128,0.03)" }}>
                                    <Text fontSize="9px" color="#4ade80" fontWeight="700">✓</Text>
                                    <Text fontSize="9px" color="gray.400" fontWeight="500" fontFamily="'Space Grotesk', sans-serif">Verified Reputation Status</Text>
                                  </HStack>
                                  <HStack spacing={2} w="full" p={0.5} borderRadius="md" transition="all 0.3s" _hover={{ bg: "rgba(139,92,246,0.03)" }}>
                                    <Text fontSize="9px" color="#4ade80" fontWeight="700">✓</Text>
                                    <Text fontSize="9px" color="gray.400" fontWeight="500" fontFamily="'Space Grotesk', sans-serif">Exclusive Community Access</Text>
                                  </HStack>
                                  <HStack spacing={2} w="full" p={0.5} borderRadius="md" transition="all 0.3s" _hover={{ bg: "rgba(168,85,247,0.03)" }}>
                                    <Text fontSize="9px" color="#4ade80" fontWeight="700">✓</Text>
                                    <Text fontSize="9px" color="gray.400" fontWeight="500" fontFamily="'Space Grotesk', sans-serif">On-Chain Achievement Proof</Text>
                                  </HStack>
                                  <HStack spacing={2} w="full" p={0.5} borderRadius="md" transition="all 0.3s" _hover={{ bg: "rgba(251,191,36,0.03)" }}>
                                    <Text fontSize="9px" color="#4ade80" fontWeight="700">✓</Text>
                                    <Text fontSize="9px" color="gray.400" fontWeight="500" fontFamily="'Space Grotesk', sans-serif">Future Airdrop Eligibility</Text>
                                  </HStack>
                                  <HStack spacing={2} w="full" p={1} borderRadius="md" bg="rgba(251,191,36,0.04)" border="1px solid rgba(251,191,36,0.08)">
                                    <Text fontSize="9px" color="#fbbf24" fontWeight="700">⭐</Text>
                                    <Text fontSize="9px" color="gray.400" fontWeight="500" fontFamily="'Space Grotesk', sans-serif">+2 Score Bonus upon mint</Text>
                                  </HStack>
                                </VStack>

                                <Text fontSize="8px" color="gray.400" textAlign="center" fontWeight="500" fontFamily="'Space Grotesk', sans-serif" mt={1}>
                                  💡 Complete more activities to unlock the badge! Each partner action gives you +1 point.
                                </Text>
                              </VStack>
                            </Box>
                          ) : null}
                        </Box>
                      </VStack>
                    </Box>
                  </Box>
                </GridItem>

                {/* Activity Breakdown */}
                <GridItem>
                  <Box
                    bg="rgba(4,4,14,0.85)"
                    backdropFilter="blur(24px)"
                    borderRadius={{ base: "2xl", md: "3xl" }}
                    border="1px solid rgba(139,92,246,0.25)"
                    overflow="hidden"
                    transition="all 0.4s"
                    _hover={{ borderColor: "rgba(139,92,246,0.5)", transform: "translateY(-4px)" }}
                    h="100%"
                  >
                    <Box h="3px" bgGradient="linear(90deg, #ec4899, #8b5cf6, #3b82f6, #ec4899)" backgroundSize="300% 100%" style={{ animation: "shimmerBorder 3s infinite" }} />

                    <Box p={{ base: 4, md: 6 }}>
                      <HStack justify="space-between" mb={{ base: 4, md: 5 }}>
                        <Heading size="sm" color="gray.200" fontWeight="600" fontFamily="'Space Grotesk', sans-serif">
                          Activity Breakdown
                        </Heading>
                        <Badge bg="rgba(139,92,246,0.15)" color="#a855f7" px={3} py={1} borderRadius="full" fontSize="xs" fontFamily="'Space Mono', monospace">
                          Lifetime
                        </Badge>
                      </HStack>

                      <VStack spacing={{ base: 3, md: 4 }}>
                        {stats.map((stat) => {
                          const targets: { [key: string]: number } = {
                            "GM Sent": 100,
                            "Votes Cast": 50,
                            "Check-Ins": 100,
                            "Deployments": 25,
                            "Agent GM": 200,
                            "Partner Actions": 500,
                          };
                          const target = targets[stat.label] || 100;
                          const percentage = Math.min(100, (stat.value / target) * 100);
                          const nextMilestone = target - stat.value;

                          return (
                            <Box
                              key={stat.label}
                              w="full"
                              p={{ base: 2.5, md: 3 }}
                              bg="rgba(0,0,0,0.3)"
                              borderRadius="lg"
                              transition="all 0.3s"
                              _hover={{ bg: "rgba(139,92,246,0.04)" }}
                            >
                              <Flex justify="space-between" mb={2}>
                                <HStack spacing={3}>
                                  <Box
                                    w="32px"
                                    h="32px"
                                    bg={`${stat.color}15`}
                                    borderRadius="lg"
                                    display="flex"
                                    alignItems="center"
                                    justifyContent="center"
                                  >
                                    <Text fontSize="lg">{stat.icon}</Text>
                                  </Box>
                                  <Box>
                                    <Text fontWeight="700" fontSize="sm" color="gray.200" fontFamily="'Space Grotesk', sans-serif">
                                      {stat.label}
                                    </Text>
                                    <Text fontSize="9px" color="gray.400" display={{ base: "none", md: "block" }} fontFamily="'Space Grotesk', sans-serif">
                                      {stat.description}
                                    </Text>
                                  </Box>
                                </HStack>
                                <Box textAlign="right">
                                  <Text fontWeight="800" fontSize="lg" color={stat.color} fontFamily="'Space Mono', monospace">
                                    {stat.value}
                                  </Text>
                                  <Text fontSize="9px" color="gray.500" fontFamily="'Space Mono', monospace">
                                    target: {target}
                                  </Text>
                                </Box>
                              </Flex>

                              <Box h="5px" bg="rgba(255,255,255,0.04)" borderRadius="full" overflow="hidden">
                                <Box
                                  h="100%"
                                  borderRadius="full"
                                  bg={stat.color}
                                  transition="width 1s ease-out"
                                  width={`${percentage}%`}
                                  boxShadow={`0 0 8px ${stat.color}60`}
                                  position="relative"
                                  _after={{
                                    content: '""',
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
                                    animation: "shimmerBtn 1.5s infinite",
                                  }}
                                />
                              </Box>

                              <Flex justify="space-between" mt={1}>
                                <Text fontSize="8px" color="gray.500" fontFamily="'Space Mono', monospace">
                                  Progress
                                </Text>
                                <Text fontSize="8px" fontWeight="600" color={stat.color} fontFamily="'Space Mono', monospace">
                                  {percentage.toFixed(0)}%
                                </Text>
                              </Flex>

                              {nextMilestone > 0 && percentage < 100 && (
                                <Text fontSize="8px" color="gray.400" mt={1} fontFamily="'Space Mono', monospace">
                                  🎯 {nextMilestone} more to next milestone
                                </Text>
                              )}
                              {percentage >= 100 && (
                                <Badge bg={stat.color} color="white" size="xs" mt={1} fontSize="8px" fontFamily="'Space Mono', monospace">
                                  ✓ MILESTONE
                                </Badge>
                              )}
                            </Box>
                          );
                        })}
                      </VStack>

                      <Divider my={5} borderColor="rgba(139,92,246,0.1)" />

                      <Box textAlign="center">
                        <HStack justify="center" spacing={6}>
                          <Box>
                            <Text fontSize="9px" color="gray.500" fontFamily="'Space Mono', monospace">
                              Total Actions
                            </Text>
                            <Text fontSize="xl" fontWeight="800" color="#a855f7" fontFamily="'Space Mono', monospace">
                              {stats.reduce((sum, stat) => sum + stat.value, 0)}
                            </Text>
                          </Box>
                          <Box w="1px" h="30px" bg="rgba(139,92,246,0.15)" />
                          <Box>
                            <Text fontSize="9px" color="gray.500" fontFamily="'Space Mono', monospace">
                              Unique Types
                            </Text>
                            <Text fontSize="xl" fontWeight="800" color="#8b5cf6" fontFamily="'Space Mono', monospace">
                              {stats.length}
                            </Text>
                          </Box>
                          <Box w="1px" h="30px" bg="rgba(139,92,246,0.15)" />
                          <Box>
                            <Text fontSize="9px" color="gray.500" fontFamily="'Space Mono', monospace">
                              Reputation Score
                            </Text>
                            <Text fontSize="xl" fontWeight="800" color="#ec4899" fontFamily="'Space Mono', monospace">
                              {userTotalScore}
                            </Text>
                          </Box>
                        </HStack>
                      </Box>
                    </Box>
                  </Box>
                </GridItem>
              </Grid>

              {/* ═══════════ PARTNER ACTIONS ═══════════ */}
              <Box>
                <Box
                  border="1px solid rgba(251,191,36,0.15)"
                  overflow="hidden"
                  position="relative"
                  bg="rgba(4,4,14,0.85)"
                  backdropFilter="blur(24px)"
                  borderRadius={{ base: "2xl", md: "3xl" }}
                  transition="all 0.4s"
                  _hover={{ borderColor: "rgba(251,191,36,0.3)", transform: "translateY(-4px)" }}
                >
                  <Box
                    h={{ base: "2px", md: "3px" }}
                    bgGradient="linear(90deg, #fbbf24, #ec4899, #8b5cf6, #fbbf24)"
                    backgroundSize="300% 100%"
                    style={{ animation: "borderRotate 5s ease infinite" }}
                  />
                  <Box p={{ base: "16px", md: "30px" }}>
                    <Flex align="center" gap={3} mb={{ base: 4, md: 6 }}>
                      <Box
                        w={{ base: "5px", md: "7px" }}
                        h={{ base: "5px", md: "7px" }}
                        borderRadius="full"
                        bg="#fbbf24"
                        boxShadow="0 0 8px #fbbf24"
                        animation="pulseGlow 2s infinite"
                      />
                      <Text
                        fontSize={{ base: "12px", md: "15px" }}
                        fontWeight="700"
                        color="rgba(220,220,255,0.85)"
                        letterSpacing="0.02em"
                        fontFamily="'Space Grotesk', sans-serif"
                      >
                        🤝 Partner Actions
                      </Text>
                      <Badge
                        bg="rgba(251,191,36,0.15)"
                        color="#fbbf24"
                        fontSize={{ base: "9px", md: "11px" }}
                        px={2.5}
                        py={0.8}
                        borderRadius="full"
                        fontWeight="800"
                        border="1px solid rgba(251,191,36,0.25)"
                        letterSpacing="0.04em"
                        fontFamily="'Space Mono', monospace"
                      >
                        {partnerProtocolsCount} PROTOCOLS
                      </Badge>
                    </Flex>

                    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={{ base: 2.5, md: 5 }}>
                      {PARTNER_ACTIONS.map((action, index) => {
                        const hasPaidForThisSession = actionPendingPayment[action.id] === true;
                        const totalExecutedCount = Number(userActionCounts[index]?.data || 0n);
                        const frontendCooldown = getRemainingCooldown(action.id);
                        const isOnCooldown = frontendCooldown > 0;

                        return (
                          <MotionBox
                            key={action.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: index * 0.05 }}
                            whileHover={{ y: -5 }}
                          >
                            <Box
                              bg="rgba(0,0,0,0.35)"
                              borderRadius="18px"
                              border={`1px solid ${hasPaidForThisSession ? `${action.color}50` : `${action.color}18`}`}
                              p={{ base: "12px", md: "18px" }}
                              transition="all 0.3s cubic-bezier(0.4,0,0.2,1)"
                              position="relative"
                              overflow="hidden"
                              _before={{
                                content: '""',
                                position: "absolute",
                                top: 0,
                                left: 0,
                                right: 0,
                                h: "1px",
                                bgGradient: `linear(90deg, transparent, ${action.color}40, transparent)`,
                              }}
                              _hover={{
                                borderColor: `${action.color}55`,
                                transform: "translateY(-5px)",
                                boxShadow: `0 12px 36px ${action.color}18`,
                                bg: "rgba(0,0,0,0.50)",
                              }}
                            >
                              <VStack spacing={{ base: 2, md: 2.5 }}>
                                {/* Header row */}
                                <HStack w="full" justify="space-between">
                                  <HStack spacing={2}>
                                    <Box
                                      w={{ base: "30px", md: "38px" }}
                                      h={{ base: "30px", md: "38px" }}
                                      bg="rgba(255,255,255,0.04)"
                                      borderRadius="10px"
                                      border="1px solid rgba(255,255,255,0.07)"
                                      display="flex"
                                      alignItems="center"
                                      justifyContent="center"
                                      flexShrink={0}
                                    >
                                      <Image
                                        src={action.logo}
                                        boxSize={{ base: "20px", md: "26px" }}
                                        borderRadius="full"
                                        fallbackSrc="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='26' height='26'><rect width='26' height='26' rx='6' fill='%236b7280'/></svg>"
                                      />
                                    </Box>
                                    <HStack spacing={1.5}>
                                      <Text
                                        fontWeight="700"
                                        color="rgba(220,220,255,0.88)"
                                        fontSize={{ base: "11px", md: "13px" }}
                                        letterSpacing="-0.01em"
                                        fontFamily="'Space Grotesk', sans-serif"
                                      >
                                        {action.name}
                                      </Text>
                                      {action.twitterUrl && action.twitterHandle && (
                                        <Tooltip label={`Follow ${action.twitterHandle}`} hasArrow placement="top">
                                          <Link
                                            href={action.twitterUrl}
                                            isExternal
                                            _hover={{ transform: "scale(1.15)" }}
                                            transition="transform 0.2s"
                                            display="flex"
                                          >
                                            <Icon as={FaTwitter} boxSize={{ base: "12px", md: "16px" }} color="#1DA1F2" />
                                          </Link>
                                        </Tooltip>
                                      )}
                                    </HStack>
                                  </HStack>
                                  <Badge
                                    bg={`${action.color}15`}
                                    color={action.color}
                                    fontSize={{ base: "8px", md: "10px" }}
                                    px={2}
                                    py={0.8}
                                    borderRadius="full"
                                    fontWeight="800"
                                    border={`1px solid ${action.color}28`}
                                    letterSpacing="0.05em"
                                    fontFamily="'Space Mono', monospace"
                                  >
                                    +{action.points} ⭐
                                  </Badge>
                                </HStack>

                                {/* Status + count row */}
                                <HStack w="full" justify="space-between">
                                  <Badge
                                    bg={hasPaidForThisSession ? "rgba(34,197,94,0.12)" : isOnCooldown ? "rgba(251,191,36,0.10)" : "rgba(156,163,175,0.08)"}
                                    color={hasPaidForThisSession ? "#22c55e" : isOnCooldown ? "#fbbf24" : "rgba(156,163,175,0.6)"}
                                    fontSize={{ base: "7px", md: "9px" }}
                                    px={2}
                                    py={0.8}
                                    borderRadius="full"
                                    fontWeight="700"
                                    border={`1px solid ${hasPaidForThisSession ? "rgba(34,197,94,0.25)" : isOnCooldown ? "rgba(251,191,36,0.22)" : "rgba(156,163,175,0.15)"}`}
                                    letterSpacing="0.05em"
                                    fontFamily="'Space Mono', monospace"
                                  >
                                    {hasPaidForThisSession ? "✓ Ready to Execute" : isOnCooldown ? "⏳ Cooldown" : "● Awaiting Payment"}
                                  </Badge>
                                  <HStack spacing={1}>
                                    <Text fontSize={{ base: "7px", md: "9px" }} color="rgba(156,163,175,0.45)" fontWeight="500" fontFamily="'Space Mono', monospace">
                                      done:
                                    </Text>
                                    <Text
                                      fontSize={{ base: "13px", md: "15px" }}
                                      fontWeight="800"
                                      color={action.color}
                                      fontFamily="'Space Mono', monospace"
                                      lineHeight={1}
                                    >
                                      {totalExecutedCount}x
                                    </Text>
                                  </HStack>
                                </HStack>

                                {/* Cooldown / next */}
                                {isOnCooldown && !hasPaidForThisSession && (
                                  <Box
                                    w="full"
                                    bg="rgba(251,191,36,0.05)"
                                    borderRadius="10px"
                                    p="8px"
                                    border="1px solid rgba(251,191,36,0.12)"
                                  >
                                    <Text
                                      fontSize={{ base: "8px", md: "10px" }}
                                      color="rgba(251,191,36,0.7)"
                                      textAlign="center"
                                      fontWeight="600"
                                      fontFamily="'Space Mono', monospace"
                                    >
                                      ⏰ {formatTimeRemaining(frontendCooldown)}
                                    </Text>
                                  </Box>
                                )}

                                <Divider borderColor="rgba(255,255,255,0.06)" />

                                {/* Fee info */}
                                <HStack w="full" justify="space-between">
                                  <VStack spacing={0.5} align="start">
                                    <Text fontSize={{ base: "7px", md: "9px" }} color="rgba(156,163,175,0.45)" fontWeight="500" fontFamily="'Space Mono', monospace">
                                      Protocol: <Text as="span" color="#fbbf24" fontWeight="700">{formatFee(defaultFee)} ETH</Text>
                                    </Text>
                                    <Text fontSize={{ base: "7px", md: "9px" }} color="rgba(156,163,175,0.45)" fontWeight="500" fontFamily="'Space Mono', monospace">
                                      External:{" "}
                                      {action.externalFee > 0 ? (
                                        <Text as="span" color="#22c55e" fontWeight="700">{formatFee(BigInt(action.externalFee))} ETH</Text>
                                      ) : (
                                        <Text as="span" color="#22c55e" fontWeight="700">FREE</Text>
                                      )}
                                    </Text>
                                  </VStack>
                                  <Text
                                    fontSize={{ base: "8px", md: "10px" }}
                                    color={totalExecutedCount === 0 ? "#22c55e" : frontendCooldown === 0 ? "#22c55e" : "#fbbf24"}
                                    fontWeight="700"
                                    fontFamily="'Space Mono', monospace"
                                  >
                                    {totalExecutedCount === 0 ? "✓ Ready" : frontendCooldown === 0 ? "✓ Ready" : formatTimeRemaining(frontendCooldown)}
                                  </Text>
                                </HStack>

                                {/* Action button */}
                                <Button
                                  size={{ base: "xs", md: "sm" }}
                                  w="full"
                                  bg={isOnCooldown && !hasPaidForThisSession
                                    ? "rgba(75,85,99,0.25)"
                                    : hasPaidForThisSession
                                      ? `linear-gradient(135deg, ${action.color}, ${action.color}aa)`
                                      : `linear-gradient(135deg, ${action.color}, ${action.color}bb)`
                                  }
                                  color={isOnCooldown && !hasPaidForThisSession ? "rgba(156,163,175,0.5)" : "white"}
                                  fontWeight="700"
                                  fontSize={{ base: "9px", md: "11px" }}
                                  letterSpacing="0.04em"
                                  h={{ base: "30px", md: "38px" }}
                                  isLoading={isTxPending}
                                  isDisabled={!hasPaidForThisSession && isOnCooldown}
                                  _hover={{
                                    opacity: isOnCooldown && !hasPaidForThisSession ? 0.6 : 0.88,
                                    transform: isOnCooldown && !hasPaidForThisSession ? "none" : "scale(1.02)",
                                    boxShadow: isOnCooldown && !hasPaidForThisSession ? "none" : `0 4px 18px ${action.color}45`,
                                  }}
                                  _active={{ transform: "scale(0.97)" }}
                                  _disabled={{ cursor: "not-allowed" }}
                                  transition="all 0.2s"
                                  borderRadius="full"
                                  border={isOnCooldown && !hasPaidForThisSession ? "1px solid rgba(75,85,99,0.35)" : "none"}
                                  fontFamily="'Space Grotesk', sans-serif"
                                  onClick={() => !hasPaidForThisSession ? handlePayAndApprove(action) : handleExecutePartnerAction(action)}
                                >
                                  {!hasPaidForThisSession
                                    ? (isOnCooldown ? "⏳ In Cooldown" : "💰 Pay & Interact")
                                    : `✨ Execute ${action.name.split(" ")[0]}`
                                  }
                                </Button>

                                {!hasPaidForThisSession && !isOnCooldown && (
                                  <Text
                                    fontSize={{ base: "7px", md: "9px" }}
                                    color="rgba(156,163,175,0.38)"
                                    textAlign="center"
                                    fontWeight="500"
                                    fontFamily="'Space Grotesk', sans-serif"
                                  >
                                    {totalExecutedCount === 0 ? "Pay to earn your first point" : "Pay again to earn more points"}
                                  </Text>
                                )}
                              </VStack>
                            </Box>
                          </MotionBox>
                        );
                      })}
                    </SimpleGrid>
                  </Box>
                </Box>
              </Box>
            </VStack>
          )}

          {/* Payment Modal */}
          <Modal isOpen={showPaymentModal} onClose={() => { setShowPaymentModal(false); setPaymentData(null); }} isCentered size="md">
            <ModalOverlay backdropFilter="blur(10px)" />
            <ModalContent bg="rgba(4,4,14,0.98)" border="1px solid rgba(139,92,246,0.3)" borderRadius="2xl" mx={3}>
              <ModalCloseButton color="gray.400" />
              <ModalBody py={8}>
                <VStack spacing={5}>
                  <Box fontSize="56px">✅</Box>
                  <Text fontSize="xl" fontWeight="800" bgGradient="linear(135deg, #22c55e, #16a34a)" bgClip="text" fontFamily="'Space Grotesk', sans-serif">
                    PAYMENT SUCCESSFUL!
                  </Text>
                  <Badge bg="#22c55e15" color="#22c55e" px={4} py={2} borderRadius="full" fontSize="xs" fontFamily="'Space Mono', monospace">
                    Transaction Confirmed
                  </Badge>

                  <Box w="full" bg="rgba(0,0,0,0.4)" borderRadius="lg" p={4}>
                    <VStack spacing={2.5} align="stretch">
                      <HStack justify="space-between">
                        <Text color="gray.400" fontSize="xs" fontFamily="'Space Mono', monospace">Action</Text>
                        <Text fontWeight="600" color="white" fontSize="xs" fontFamily="'Space Grotesk', sans-serif">
                          {paymentData?.action.fullName}
                        </Text>
                      </HStack>
                      <Divider borderColor="rgba(139,92,246,0.15)" />
                      <HStack justify="space-between">
                        <Text color="gray.400" fontSize="xs" fontFamily="'Space Mono', monospace">Fee Paid</Text>
                        <Text fontWeight="600" color="#22c55e" fontSize="xs" fontFamily="'Space Mono', monospace">
                          {formatFee(defaultFee)} ETH
                        </Text>
                      </HStack>
                      <Divider borderColor="rgba(139,92,246,0.15)" />
                      <HStack justify="space-between">
                        <Text color="gray.400" fontSize="xs" fontFamily="'Space Mono', monospace">Transaction</Text>
                        <Link href={`https://soneium.blockscout.com/tx/${paymentData?.txHash}`} isExternal>
                          <Text fontSize="xs" fontFamily="'Space Mono', monospace" color="#a855f7" _hover={{ textDecoration: "underline" }}>
                            {truncateAddress(paymentData?.txHash || "")}
                          </Text>
                        </Link>
                      </HStack>
                    </VStack>
                  </Box>

                  <Button
                    bgGradient={`linear(135deg, ${paymentData?.action.color || "#8b5cf6"}, ${paymentData?.action.color || "#ec4899"}cc)`}
                    color="white"
                    size="lg"
                    w="full"
                    fontWeight="700"
                    fontSize="sm"
                    fontFamily="'Space Grotesk', sans-serif"
                    onClick={() => {
                      if (paymentData) {
                        setShowPaymentModal(false);
                        handleExecutePartnerAction(paymentData.action);
                      }
                    }}
                    isLoading={isTxPending}
                    _hover={{ opacity: 0.9, transform: "scale(1.02)" }}
                    borderRadius="full"
                  >
                    ✨ Execute {paymentData?.action.name} ✨
                  </Button>
                </VStack>
              </ModalBody>
              <ModalFooter pt={0} pb={4}>
                <Text fontSize="xs" color="gray.500" textAlign="center" w="full" fontFamily="'Space Grotesk', sans-serif">
                  You have paid the protocol fee. Now confirm the second transaction to complete the action.
                </Text>
              </ModalFooter>
            </ModalContent>
          </Modal>

          {/* Success Modal */}
          <Modal isOpen={showSuccessModal} onClose={() => { setShowSuccessModal(false); restoreScrollPosition(); }} isCentered size="lg">
            <ModalOverlay backdropFilter="blur(10px)" />
            <ModalContent bg="rgba(4,4,14,0.98)" border="1px solid rgba(139,92,246,0.3)" borderRadius="2xl" mx={3}>
              <ModalCloseButton color="gray.400" />
              <ModalBody py={8}>
                <VStack spacing={5}>
                  <Box fontSize="56px">🌅</Box>
                  <Text fontSize="xl" fontWeight="800" bgGradient="linear(135deg, #a855f7, #ec4899)" bgClip="text" fontFamily="'Space Grotesk', sans-serif">
                    DAILY RITUAL
                  </Text>
                  <Badge bg="#22c55e15" color="#22c55e" px={4} py={2} borderRadius="full" fontSize="xs" fontFamily="'Space Mono', monospace">
                    Action Completed! ✨
                  </Badge>

                  <Box w="full" bg="rgba(0,0,0,0.4)" borderRadius="lg" p={4}>
                    <VStack spacing={2.5} align="stretch">
                      <HStack justify="space-between">
                        <Text color="gray.400" fontSize="xs" fontFamily="'Space Mono', monospace">Network</Text>
                        <Badge bg="#8b5cf6" color="white" fontSize="8px" fontFamily="'Space Mono', monospace">Soneium</Badge>
                      </HStack>
                      <Divider borderColor="rgba(139,92,246,0.15)" />
                      <HStack justify="space-between">
                        <Text color="gray.400" fontSize="xs" fontFamily="'Space Mono', monospace">Transaction</Text>
                        <Text fontWeight="600" color="white" fontSize="xs" fontFamily="'Space Grotesk', sans-serif">
                          {successData?.actionName}
                        </Text>
                      </HStack>
                      <Divider borderColor="rgba(139,92,246,0.15)" />
                      <HStack justify="space-between">
                        <Text color="gray.400" fontSize="xs" fontFamily="'Space Mono', monospace">Points Earned</Text>
                        <Text fontWeight="700" color="#fbbf24" fontSize="md" fontFamily="'Space Mono', monospace">
                          +{successData?.points}
                        </Text>
                      </HStack>
                      <Divider borderColor="rgba(139,92,246,0.15)" />
                      <HStack justify="space-between">
                        <Text color="gray.400" fontSize="xs" fontFamily="'Space Mono', monospace">Total Completed</Text>
                        <Text fontWeight="700" color="#22c55e" fontSize="sm" fontFamily="'Space Mono', monospace">
                          {successData?.totalCount}x
                        </Text>
                      </HStack>
                      <Divider borderColor="rgba(139,92,246,0.15)" />
                      <HStack justify="space-between">
                        <Text color="gray.400" fontSize="xs" fontFamily="'Space Mono', monospace">Transaction</Text>
                        <Link href={`https://soneium.blockscout.com/tx/${successData?.txHash}`} isExternal>
                          <Text fontSize="xs" fontFamily="'Space Mono', monospace" color="#a855f7" _hover={{ textDecoration: "underline" }}>
                            {truncateAddress(successData?.txHash || "")}
                          </Text>
                        </Link>
                      </HStack>
                    </VStack>
                  </Box>

                  <HStack spacing={2} w="full" flexWrap="wrap">
                    <Button
                      leftIcon={<FaTwitter />}
                      bg="#1DA1F2"
                      color="white"
                      flex={1}
                      size="md"
                      borderRadius="full"
                      fontFamily="'Space Grotesk', sans-serif"
                      _hover={{ opacity: 0.9, transform: "scale(1.02)" }}
                      onClick={() => shareOnX(successData?.actionName || "", successData?.actionHandle, successData?.points || 0)}
                    >
                      Share
                    </Button>
                    <Button
                      leftIcon={<CopyIcon />}
                      variant="outline"
                      borderColor="rgba(139,92,246,0.4)"
                      color="gray.300"
                      flex={1}
                      size="md"
                      borderRadius="full"
                      fontFamily="'Space Grotesk', sans-serif"
                      _hover={{ bg: "rgba(139,92,246,0.08)" }}
                      onClick={() => {
                        navigator.clipboard.writeText(successData?.txHash || "");
                        toast({
                          title: "Copied!",
                          description: "Transaction hash copied to clipboard",
                          status: "success",
                          duration: 2000,
                          position: "top-right",
                        });
                      }}
                    >
                      Copy
                    </Button>
                    <Button
                      rightIcon={<ExternalLinkIcon />}
                      variant="solid"
                      bg="rgba(139,92,246,0.15)"
                      color="white"
                      flex={1}
                      size="md"
                      borderRadius="full"
                      fontFamily="'Space Grotesk', sans-serif"
                      _hover={{ bg: "rgba(139,92,246,0.3)" }}
                      onClick={() => window.open(`https://soneium.blockscout.com/tx/${successData?.txHash}`, "_blank")}
                    >
                      Explorer
                    </Button>
                  </HStack>
                </VStack>
              </ModalBody>
              <ModalFooter pt={0} pb={4}>
                <Text fontSize="xs" color="gray.500" textAlign="center" w="full" fontFamily="'Space Grotesk', sans-serif">
                  🌅 💬✨ Just completed on Soneium! ✨💬🌅
                </Text>
              </ModalFooter>
            </ModalContent>
          </Modal>

          {/* Footer */}
          <Footer />
        </Container>
      </Box>

      {/* Leaderboard Modal */}
      <LeaderboardModal isOpen={isLeaderboardOpen} onClose={onLeaderboardClose} />

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

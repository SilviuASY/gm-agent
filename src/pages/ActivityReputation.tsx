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
  useColorMode,
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
import { useState } from "react";
import confetti from "canvas-confetti";
import { ChevronLeftIcon, ExternalLinkIcon, CopyIcon } from "@chakra-ui/icons";
import { FaTwitter } from "react-icons/fa";

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

// Hooks
import { useFixScroll } from "../hooks/useFixScroll";
import { useScrollRestore } from "../hooks/useScrollRestore";
import { useCampaign } from "../hooks/useCampaign";
import { usePartnerCooldowns } from "../hooks/usePartnerCooldowns";
import { usePartnerActions } from "../hooks/usePartnerActions";
import { useTransactionModal } from "../hooks/useTransactionModal";

// Utils
import {
  float,
  floatSlow,
  pulseGlow,
  shimmer,
  slideUp,
  slideInLeft,
  slideInRight,
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

export default function ActivityReputation() {
  useFixScroll();

  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const toast = useToast();
  useColorMode();

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
    userTotalActionsContract,
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
      await fetch('/.netlify/functions/update-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, points }),
      });
    } catch (err) {
      console.error("Failed to update leaderboard:", err);
    }
  };

  // Share on X
  const shareOnX = (actionName: string, actionHandle: string | undefined, points: number) => {
    const handleTag = actionHandle ? ` ${actionHandle}` : '';
    const text = encodeURIComponent(
      `🌅 💬✨ Just completed ${actionName} on Soneium! ✨💬🌅\n\n` +
      `👤 +${points} Reputation Point\n` +
      `📈 Keeping the Web3 streak alive! 🔥\n\n` +
      `🎯 Join the community and start building your on-chain legacy!\n\n` +
      `@Soneium • @pulse_vault${handleTag}\n\n` +
      `✨ gm-agent.xyz ✨`
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  };

  // ================= MINT BADGE HANDLER =================
  const handleMintBadge = async () => {
    if (!address || !isCorrectChain || userBadgeBalance > 0n) return;
    const score = userTotalScore;
    if (score < minReputationScore) {
      toast({ title: "Insufficient Score", description: `You need at least ${minReputationScore} points (you have ${score})`, status: "warning", duration: 4000 });
      return;
    }
    setIsTxPending(true);
    setTxOpen(true);
    setTxStatus("wallet");
    setTxTitle("🏅 Mint Reputation Badge");
    setTxDesc("Generating signature...");
    try {
      const response = await fetch(`${API_URL}/generate-mint-signature`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userAddress: address, score, nonce: userNonce.toString() }),
      });
      const data = await response.json();
      if (!response.ok || !data.signature) throw new Error(data.error || 'Error generating signature');
      
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
        toast({ title: "🎉 Success!", description: "Badge minted successfully!", status: "success", duration: 6000 });
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
    if (!isCorrectChain) { switchChain?.({ chainId: SONEIUM_CHAIN_ID }); return; }

    const remaining = getRemainingCooldown(action.id);
    if (remaining > 0) {
      toast({ title: "Cooldown Active", description: `You must wait ${formatTimeRemaining(remaining)} before using ${action.name} again.`, status: "warning", duration: 4000 });
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
    if (!isCorrectChain) { switchChain?.({ chainId: SONEIUM_CHAIN_ID }); return; }

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

        setActionPendingPayment(prev => ({ ...prev, [action.id]: false }));
        setTxOpen(false);
        setShowPaymentModal(false);
        setPaymentData(null);

        const newTotalCount = Number(userActionCounts[action.id]?.data || 0n) + 1;

        setSuccessData({
          actionName: action.fullName,
          actionHandle: action.twitterHandle,
          points: action.points,
          txHash: hash,
          totalCount: newTotalCount
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
    if (!isCorrectChain) { switchChain?.({ chainId: SONEIUM_CHAIN_ID }); return; }

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
        confetti({ particleCount: 200, spread: 80, origin: { y: 0.6 }, startVelocity: 30, colors: ['#8b5cf6', '#ec4899', '#3b82f6', '#22c55e', '#fbbf24'] });
        await refetchAllData();
        await updateLeaderboardScore(1);

        if (type === "gm") {
          setSuccessData({
            actionName: "GM",
            actionHandle: undefined,
            points: 1,
            txHash: hash,
            totalCount: Number(userGmCount) + 1
          });
          setShowSuccessModal(true);
        } else {
          toast({ title: successTitle, description: successDesc, status: "success", duration: 5000, isClosable: true, position: "top-right" });
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

  return (
    <Box 
      minH="100vh" 
      bg="#020208"
    >
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>

      {/* Animated Background Orbs */}
      <Box position="fixed" top="5%" left="-5%" w="600px" h="600px" borderRadius="full" bg="radial-gradient(circle, rgba(139,92,246,0.3) 0%, rgba(139,92,246,0) 70%)" filter="blur(100px)" animation={`${floatSlow} 25s ease-in-out infinite`} zIndex={0} pointerEvents="none" />
      <Box position="fixed" bottom="0%" right="-5%" w="700px" h="700px" borderRadius="full" bg="radial-gradient(circle, rgba(236,72,153,0.25) 0%, rgba(236,72,153,0) 70%)" filter="blur(120px)" animation={`${float} 30s ease-in-out infinite`} zIndex={0} pointerEvents="none" />
      <Box position="fixed" top="40%" left="30%" w="400px" h="400px" borderRadius="full" bg="radial-gradient(circle, rgba(59,130,246,0.2) 0%, rgba(59,130,246,0) 70%)" filter="blur(80px)" animation={`${floatSlow} 20s ease-in-out infinite reverse`} zIndex={0} pointerEvents="none" />
      <Box position="fixed" top="50%" left="70%" w="300px" h="300px" borderRadius="full" bg="radial-gradient(circle, rgba(34,197,94,0.15) 0%, rgba(34,197,94,0) 70%)" filter="blur(70px)" animation={`${float} 18s ease-in-out infinite`} zIndex={0} pointerEvents="none" />

      {/* Grid overlay */}
      <Box position="fixed" top={0} left={0} right={0} bottom={0} opacity={0.03} pointerEvents="none" zIndex={0} bgImage="url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MCIgaGVpZ2h0PSI4MCI+PHBhdGggZD0iTTQwIDQwIG0tMzAgMCBhIDMwIDMwIDAgMSAwIDYwIDAgYSAzMCAzMCAwIDEgMC02MCAwIiBzdHJva2U9IiM4YjVjZjYiIGZpbGw9Im5vbmUiIG9wYWNpdHk9IjAuMSIvPjwvc3ZnPg==')" bgRepeat="repeat" backgroundSize="60px" />

      <Container maxW="1400px" position="relative" zIndex={1} px={{ base: 3, md: 6, lg: 8 }} py={{ base: 4, md: 8 }}>

        {/* Header */}
        <Flex justify="space-between" align="center" mb={{ base: 4, md: 8 }} direction={{ base: "column", md: "row" }} gap={{ base: 3, md: 4 }}>
          <HStack spacing={{ base: 1, md: 4 }} animation={`${slideInLeft} 0.6s ease-out`} w={{ base: "full", md: "auto" }} justify={{ base: "flex-start", md: "flex-start" }}>
            <Button
              onClick={() => window.history.back()}
              variant="solid"
              bg="rgba(139,92,246,0.2)"
              color="white"
              size={{ base: "sm", md: "lg" }}
              leftIcon={<ChevronLeftIcon boxSize={{ base: 2.5, md: 5 }} />}
              _hover={{ bg: "rgba(139,92,246,0.4)", transform: "scale(1.02)", boxShadow: "0 0 20px rgba(139,92,246,0.4)" }}
              transition="all 0.2s"
              borderRadius="full"
              border="1px solid rgba(139,92,246,0.5)"
              fontWeight="500"
              px={{ base: 1.5, md: 6 }}
              py={{ base: 0.5, md: 3 }}
              fontSize={{ base: "10px", md: "16px" }}
            >
              Back
            </Button>
            <VStack align="start" spacing={0.3} pl={{ base: 4, md: 10 }}>
              <HStack spacing={{ base: 0.5, md: 2 }} flexWrap="wrap" align="center">
                <Box w={{ base: "3px", md: "8px" }} h={{ base: "3px", md: "8px" }} borderRadius="full" bg="#4ade80" animation={`${pulseGlow} 2s ease-in-out infinite`} />
                <Heading
                  fontSize={{ base: "12px", md: "3xl", lg: "4xl" }}
                  fontWeight="800"
                  bgGradient="linear(135deg, #f0f0ff 0%, #c084fc 30%, #a855f7 60%, #7c3aed 100%)"
                  bgClip="text"
                  letterSpacing="-0.02em"
                  fontFamily="'Inter', 'Segoe UI', system-ui, sans-serif"
                  textShadow="0 0 40px rgba(192,132,252,0.15)"
                  position="relative"
                  _after={{
                    content: '""',
                    position: "absolute",
                    top: "-2px",
                    left: "-10px",
                    right: "-10px",
                    bottom: "-2px",
                    background: "linear-gradient(90deg, transparent, rgba(192,132,252,0.05), transparent)",
                    filter: "blur(20px)",
                    zIndex: -1,
                    borderRadius: "full",
                  }}
                >
                  Activity Reputation
                </Heading>
              </HStack>
              <Text
                color="gray.400"
                fontSize={{ base: "7px", md: "sm" }}
                letterSpacing="0.15em"
                fontFamily="'Inter', 'Segoe UI', system-ui, sans-serif"
                fontWeight="400"
                textTransform="uppercase"
                opacity={0.8}
              >
                Track your on-chain legacy
              </Text>
            </VStack>
          </HStack>
          
          {/* Desktop Header Buttons */}
          <HStack spacing={3} display={{ base: "none", md: "flex" }} animation={`${slideInRight} 0.6s ease-out`}>
            <Button
              onClick={onLeaderboardOpen}
              bg="white"
              color="gray.800"
              size="md"
              borderRadius="full"
              px={6}
              py={2}
              h="40px"
              fontWeight="650"
              fontSize="md"
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
              leftIcon={<Text fontSize="lg">🏆</Text>}
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
              size="md"
              borderRadius="full"
              px={6}
              py={2}
              h="40px"
              fontWeight="650"
              fontSize="md"
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
              rightIcon={<ExternalLinkIcon boxSize={3.5} />}
            >
              DOCS
            </Button>
            <Box _hover={{ transform: "scale(1.02)" }} transition="transform 0.3s">
              <ConnectButton chainStatus="full" accountStatus="full" showBalance={false} />
            </Box>
          </HStack>
        </Flex>

          {/* Mobile Header Buttons */}
          <VStack spacing={2} display={{ base: "flex", md: "none" }} w="full" animation={`${slideInRight} 0.6s ease-out`} mb={3}>
            <Box w="full" display="flex" justifyContent="center">
              <ConnectButton chainStatus="full" accountStatus="full" showBalance={false} />
            </Box>
            <HStack spacing={2} justify="center" w="full">
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
                fontSize="md"
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
                fontSize="md"
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
                rightIcon={<ExternalLinkIcon boxSize={2.5} />}
              >
                DOCS
              </Button>
            </HStack>
          </VStack>

        {/* Network Warning */}
        {!isCorrectChain && isConnected && (
          <Alert status="warning" borderRadius="2xl" mb={{ base: 3, md: 6 }} bg="rgba(236,72,153,0.12)" border="1px solid rgba(236,72,153,0.5)" backdropFilter="blur(8px)" p={{ base: 2, md: 3 }}>
            <AlertIcon color="#fbbf24" boxSize={{ base: "12px", md: "16px" }} />
            <Box flex="1">
              <Text fontWeight="bold" color="#fbbf24" fontFamily="mono" fontSize={{ base: "xs", md: "sm" }}>⚠️ Network Mismatch</Text>
              <Text fontSize={{ base: "10px", md: "sm" }} color="#d1d5db">Switch to Soneium Mainnet</Text>
            </Box>
            <Button size={{ base: "xs", md: "sm" }} onClick={() => switchChain?.({ chainId: SONEIUM_CHAIN_ID })} bgGradient="linear(135deg, #8b5cf6, #ec4899)" _hover={{ opacity: 0.9, transform: "scale(1.02)" }} color="white" borderRadius="full" fontSize={{ base: "9px", md: "xs" }}>Switch</Button>
          </Alert>
        )}

        {/* Campaign Status Banner */}
        {isConnected && isCorrectChain && campaignStartTimeData !== undefined && (
          <Alert status="info" borderRadius="xl" mb={{ base: 3, md: 6 }} bg={campaignActive ? "rgba(34,197,94,0.1)" : campaignScheduled ? "rgba(139,92,246,0.1)" : "rgba(156,163,175,0.1)"} border={`1px solid ${campaignActive ? "#22c55e" : campaignScheduled ? "#c084fc" : "#6b7280"}40`} backdropFilter="blur(8px)" py={{ base: 2, md: 3 }}>
            <AlertIcon color={campaignActive ? "#22c55e" : campaignScheduled ? "#c084fc" : "#9ca3af"} boxSize={{ base: "12px", md: "16px" }} />
            <Box flex="1">
              <HStack spacing={{ base: 2, md: 4 }} wrap="wrap" justify="space-between">
                <HStack spacing={2}>
                  <Text fontWeight="bold" color={campaignActive ? "#22c55e" : campaignScheduled ? "#c084fc" : "#9ca3af"} fontFamily="mono" fontSize={{ base: "10px", md: "sm" }}>
                    {campaignActive ? "🎯 Active" : campaignScheduled ? "⏳ Scheduled" : "⏸️ Stopped"}
                  </Text>
                  {campaignScheduled && timeRemaining && (timeRemaining.days + timeRemaining.hours + timeRemaining.minutes + timeRemaining.seconds > 0) && (
                    <HStack spacing={1}>
                      <Text fontSize={{ base: "10px", md: "sm" }} color="gray.400">in:</Text>
                      <Text fontSize={{ base: "xs", md: "lg" }} fontWeight="800" color="#c084fc">{timeRemaining.hours.toString().padStart(2, '0')}</Text><Text fontSize={{ base: "8px", md: "xs" }} color="gray.500">h</Text>
                      <Text fontSize={{ base: "xs", md: "lg" }} fontWeight="800" color="#c084fc">:</Text>
                      <Text fontSize={{ base: "xs", md: "lg" }} fontWeight="800" color="#c084fc">{timeRemaining.minutes.toString().padStart(2, '0')}</Text><Text fontSize={{ base: "8px", md: "xs" }} color="gray.500">m</Text>
                    </HStack>
                  )}
                  {campaignActive && (<Text fontSize={{ base: "9px", md: "sm" }} color="#22c55e">✓ Active</Text>)}
                </HStack>
              </HStack>
            </Box>
          </Alert>
        )}

        {/* Global Stats - MOBILE: 2 coloane, mai mici */}
        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={{ base: 2, md: 5 }} mb={{ base: 6, md: 10 }} animation={`${slideUp} 0.5s ease-out`}>
          {[
            { label: "Total GM", value: formatNumber(Math.max(0, totalGMCount)), icon: "🌅", color: "#22c55e", glowColor: "#22c55e" },
            { label: "Total Votes", value: formatNumber(Number(totalVotes)), icon: "🗳️", color: "#8b5cf6", glowColor: "#8b5cf6" },
            { label: "Total Check-Ins", value: formatNumber(Number(totalCheckIns)), icon: "✅", color: "#3b82f6", glowColor: "#3b82f6" },
            { label: "Total Deployments", value: formatNumber(Number(totalDeployments)), icon: "🚀", color: "#ec4899", glowColor: "#ec4899" },
          ].map((stat) => (
            <Box 
              key={stat.label} 
              bg="rgba(8,8,20,0.7)" 
              backdropFilter="blur(12px)" 
              borderRadius={{ base: "xl", md: "2xl" }} 
              p={{ base: 2, md: 5 }} 
              border={`1px solid ${stat.color}40`} 
              overflow="hidden"
              transition="all 0.4s cubic-bezier(0.2,0.9,0.4,1.1)" 
              _hover={{ 
                transform: { base: "translateY(-2px) scale(1.01)", md: "translateY(-8px) scale(1.02)" }, 
                borderColor: stat.color, 
                boxShadow: `0 0 30px ${stat.glowColor}`, 
                bg: "rgba(8,8,20,0.9)" 
              }}
            >
              <HStack spacing={{ base: 1.5, md: 4 }} align="center">
                <Box 
                  fontSize={{ base: "24px", md: "48px" }} 
                  animation={`${float} 4s ease-in-out infinite`}
                  position="relative"
                  zIndex={1}
                  transform={{ base: "translateY(2px)", md: "translateY(4px)" }}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  minWidth={{ base: "30px", md: "60px" }}
                  minHeight={{ base: "30px", md: "60px" }}
                >
                  {stat.icon}
                </Box>
                <Box flex="1" minW="0">
                  <Text 
                    fontSize={{ base: "7px", md: "xs" }} 
                    color="gray.500" 
                    textTransform="uppercase" 
                    letterSpacing={{ base: "wider", md: "wider" }} 
                    fontFamily="mono"
                    lineHeight="1.2"
                    noOfLines={1}
                  >
                    {stat.label}
                  </Text>
                  <Text 
                    fontSize={{ base: "sm", md: "2xl" }} 
                    fontWeight="800" 
                    color="white" 
                    fontFamily="mono" 
                    letterSpacing="tight"
                    noOfLines={1}
                  >
                    {stat.value}
                  </Text>
                </Box>
              </HStack>
            </Box>
          ))}
        </SimpleGrid>

        {/* Quick Actions - MOBILE: mai mici */}
        <Box mb={{ base: 6, md: 12 }} animation={`${slideUp} 0.5s ease-out 0.1s both`}>
          <HStack mb={{ base: 3, md: 5 }} spacing={2}>
            <Box w={{ base: "4px", md: "6px" }} h={{ base: "4px", md: "6px" }} borderRadius="full" bg="#c084fc" animation={`${pulseGlow} 2s infinite`} />
            <Heading size={{ base: "sm", md: "md" }} color="gray.300" fontWeight="600" letterSpacing="tight">✨ Quick Actions</Heading>
          </HStack>
          <SimpleGrid columns={{ base: 2, sm: 2, md: 4 }} spacing={{ base: 2, md: 6 }}>
            {actions.map((action) => (
              <Box key={action.type} position="relative" onClick={() => handleAction(action.type)} cursor="pointer" transition="all 0.4s cubic-bezier(0.2,0.9,0.4,1.1)" _hover={{ transform: { base: "translateY(-4px) scale(1.01)", md: "translateY(-10px) scale(1.02)" } }}>
                <Box position="absolute" inset={0} bg={`${action.color}20`} filter="blur(24px)" borderRadius="2xl" opacity={0} transition="opacity 0.4s" />
                <Box bg="rgba(10,10,25,0.85)" backdropFilter="blur(20px)" borderRadius={{ base: "xl", md: "2xl" }} border={`2px solid ${action.color}40`} p={{ base: 3, md: 5 }} transition="all 0.3s" _hover={{ borderColor: action.color, bg: "rgba(15,15,35,0.95)", boxShadow: `0 0 20px ${action.color}80` }}>
                  <VStack spacing={{ base: 1, md: 3 }}>
                    <Box fontSize={{ base: "32px", md: "56px" }} animation={`${float} 4s ease-in-out infinite`} transform={{ base: "scale(0.95)", md: "scale(1)" }} > {action.icon}</Box>
                    <Heading size={{ base: "xs", md: "sm" }} color="white" fontWeight="700">{action.label}</Heading>
                    <Text fontSize={{ base: "8px", md: "xs" }} color="gray.500" textAlign="center" fontFamily="mono" display={{ base: "none", md: "block" }}>{action.desc}</Text>
                    <Badge bg={`${action.color}20`} color={action.color} px={{ base: 2, md: 3 }} py={{ base: 1, md: 1.5 }} borderRadius="full" fontSize={{ base: "8px", md: "xs" }} border={`1px solid ${action.color}40`}>Fee: {formatFee(action.fee)} ETH</Badge>
                    <Button size={{ base: "xs", md: "sm" }} w="full" bgGradient={action.gradient} color="white" isLoading={isTxPending} _hover={{ opacity: 0.9, transform: "scale(1.02)" }} borderRadius="full" fontSize={{ base: "9px", md: "xs" }} fontWeight="600" py={{ base: 1.5, md: 2 }}>{action.label}</Button>
                  </VStack>
                </Box>
              </Box>
            ))}
          </SimpleGrid>
        </Box>

{/* MAIN CONTENT */}
        {!isConnected ? (
          <Box textAlign="center" py={{ base: 10, md: 20 }} bg="rgba(8,8,20,0.6)" borderRadius="3xl" border="1px solid rgba(139,92,246,0.2)">
            <Text fontSize={{ base: "40px", md: "64px" }} mb={{ base: 2, md: 4 }}>🔌</Text>
            <Text color="gray.500" fontFamily="mono" fontSize={{ base: "sm", md: "md" }}>Connect your wallet to see your stats</Text>
          </Box>
        ) : !isCorrectChain ? (
          <Box textAlign="center" py={{ base: 10, md: 20 }} bg="rgba(8,8,20,0.6)" borderRadius="3xl" border="1px solid rgba(139,92,246,0.2)">
            <Text fontSize={{ base: "40px", md: "64px" }} mb={{ base: 2, md: 4 }}>⚠️</Text>
            <Text color="gray.500" fontFamily="mono" fontSize={{ base: "sm", md: "md" }}>Switch to Soneium network to see your stats</Text>
          </Box>
        ) : (
          <VStack spacing={{ base: 4, md: 8 }} align="stretch">
            <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={{ base: 4, md: 8 }}>
              {/* Profile Card - MOBILE: mai compact */}
              <GridItem>
                <Box position="relative" bg="rgba(8,8,20,0.8)" backdropFilter="blur(24px)" borderRadius={{ base: "2xl", md: "3xl" }} border="1px solid rgba(139,92,246,0.3)" overflow="hidden" transition="all 0.4s" _hover={{ borderColor: "rgba(139,92,246,0.6)", transform: "translateY(-5px)" }} h="100%">
                  <Box h={{ base: "2px", md: "4px" }} bgGradient="linear(90deg, #8b5cf6, #ec4899, #3b82f6, #8b5cf6)" backgroundSize="300% 100%" animation={`${shimmer} 4s ease infinite`} />
                  
                  {/* Badge-uri în colțuri - poziționate absolut */}
                  <Box position="absolute" top={{ base: "24px", md: "44px" }} left={{ base: "20px", md: "40px" }} zIndex={2}>
                    <Badge 
                      bg={userBadge.bg} 
                      color={userBadge.color} 
                      px={{ base: 2.5, md: 4 }} 
                      py={{ base: 1, md: 1.5 }} 
                      borderRadius="full" 
                      fontSize={{ base: "8px", md: "sm" }} 
                      fontWeight="700" 
                      border={`1px solid ${userBadge.color}`} 
                      boxShadow={`0 0 15px ${userBadge.glow}`}
                      animation={`${pulseGlow} 2.5s ease-in-out infinite`}
                      display="inline-flex"
                      alignItems="center"
                      gap={1}
                    >
                      {userBadge.icon} {userBadge.label}
                    </Badge>
                  </Box>
                  
                  <Box position="absolute" top={{ base: "24px", md: "44px" }} right={{ base: "20px", md: "40px" }} zIndex={2}>
                    {userIsAgent ? (
                      <Badge 
                        bgGradient="linear(135deg, #c084fc, #ec4899)" 
                        color="white" 
                        px={{ base: 2.5, md: 4 }} 
                        py={{ base: 1, md: 1.5 }} 
                        borderRadius="full" 
                        fontSize={{ base: "8px", md: "sm" }} 
                        fontWeight="700" 
                        boxShadow="0 0 20px #c084fc" 
                        animation={`${pulseGlow} 2s ease-in-out infinite`}
                        display="inline-flex"
                        alignItems="center"
                        gap={1}
                      >
                        🧬 AGENT ✓
                      </Badge>
                    ) : (
                      <Button 
                        size={{ base: "xs", md: "xs" }} 
                        variant="outline" 
                        bg="rgba(139,92,246,0.1)" 
                        borderColor="#c084fc" 
                        color="#c084fc" 
                        _hover={{ bg: "rgba(139,92,246,0.2)", transform: "scale(1.02)", boxShadow: "0 0 15px #c084fc" }} 
                        onClick={() => window.location.href = "/"} 
                        borderRadius="full" 
                        fontSize={{ base: "7px", md: "10px" }} 
                        fontWeight="600"
                        px={{ base: 2.5, md: 3 }}
                        py={{ base: 0.5, md: 1 }}
                        animation={`${pulseGlow} 2s ease-in-out infinite`}
                      >
                        Register
                      </Button>
                    )}
                  </Box>
                  
                  <Box p={{ base: 4, md: 8 }}>
                    <VStack spacing={{ base: 2, md: 3.5 }}>
                      <VStack spacing={{ base: 2, md: 3 }} align="center" w="full" pt={{ base: 4, md: 6 }}>
                        <Avatar 
                          size={{ base: "lg", md: "2xl" }} 
                          bgGradient="linear(135deg, #8b5cf6, #ec4899)" 
                          icon={<Text fontSize={{ base: "28px", md: "48px" }}>🕵️</Text>} 
                          boxShadow="0 0 30px rgba(139,92,246,0.5)" 
                        />
                        
                        <HStack spacing={2} justify="center">
                          <Box w={{ base: "6px", md: "8px" }} h={{ base: "6px", md: "8px" }} borderRadius="full" bg="#4ade80" boxShadow="0 0 8px #4ade80" animation={`${pulseGlow} 2s ease-in-out infinite`} />
                          <Text fontSize={{ base: "9px", md: "xs" }} color="#4ade80" fontFamily="mono" fontWeight="500">Connected</Text>
                        </HStack>
                        
                        <Text fontWeight="700" fontSize={{ base: "sm", md: "xl" }} fontFamily="mono" color="white" letterSpacing="tight">{truncateAddress(address || "")}</Text>
                      </VStack>

                      {/* Reputation Score Section - MOBILE: mai compact */}
                      <Box w="full" mt={{ base: 1, md: 2 }}>
                        <Flex justify="space-between" mb={1}>
                          <Text fontSize={{ base: "9px", md: "sm" }} color="gray.400" fontFamily="mono">🏆 REPUTATION SCORE</Text>
                          <Text fontWeight="800" color="#c084fc" fontSize={{ base: "sm", md: "lg" }}>{userTotalScore} / {nextTierTarget}</Text>
                        </Flex>
                        <Box position="relative" mb={1}>
                          <Box h={{ base: "6px", md: "10px" }} bg="rgba(139,92,246,0.15)" borderRadius="full" overflow="hidden">
                            <Box
                              h="100%"
                              borderRadius="full"
                              bgGradient="linear(90deg, #8b5cf6, #ec4899)"
                              transition="width 1.5s cubic-bezier(0.4, 0, 0.2, 1)"
                              width={`${reputationProgress}%`}
                              position="relative"
                              _after={{
                                content: '""',
                                position: "absolute",
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
                                animation: "shimmer 2s infinite",
                              }}
                            />
                          </Box>
                        </Box>
                        <Flex justify="space-between" mt={0.5}>
                          <Text fontSize={{ base: "8px", md: "xs" }} color="gray.500">Current: {userTotalScore} pts</Text>
                          <Text fontSize={{ base: "8px", md: "xs" }} color="gray.500">Next: {nextTierTarget} ({nextTierTarget - userTotalScore} to go)</Text>
                        </Flex>
                      </Box>

                      {/* Total Actions - MOBILE: mai compact */}
                      <Box w="full" mt={{ base: 1, md: 1.5 }} p={{ base: 2, md: 3 }} bg="rgba(0,0,0,0.3)" borderRadius={{ base: "lg", md: "xl" }}>
                        <Flex justify="space-between" align="center">
                          <HStack spacing={1}>
                            <Text fontSize={{ base: "9px", md: "sm" }} color="gray.400">🔄 Total On-Chain Actions</Text>
                            <Tooltip label="Total number of actions tracked by the Agent Gateway contract" hasArrow placement="top">
                              <Box as="span" fontSize={{ base: "8px", md: "xs" }} color="gray.500">ⓘ</Box>
                            </Tooltip>
                          </HStack>
                          <Text fontSize={{ base: "lg", md: "xl" }} fontWeight="800" color="#c084fc">{Number(userTotalActionsContract)}</Text>
                        </Flex>
                        <Box mt={1}>
                          <Box h={{ base: "4px", md: "5px" }} bg="rgba(139,92,246,0.2)" borderRadius="full" overflow="hidden">
                            <Box
                              h="100%"
                              borderRadius="full"
                              bg="#c084fc"
                              transition="width 1s ease-out"
                              width={`${Math.min(100, (Number(userTotalActionsContract) / 100) * 100)}%`}
                            />
                          </Box>
                        </Box>
                      </Box>

                      {/* BADGE SECTION - MOBILE: mai compact */}
                      <Box w="full" mt={{ base: 2, md: 3 }}>
                        <Text fontSize={{ base: "sm", md: "lg" }} fontWeight="700" color="#c084fc" mb={{ base: 1, md: 1.5 }} textAlign="center">
                          🏅 REPUTATION BADGE
                        </Text>
                        
                        {/* Text suplimentar pentru încurajare */}
                        <Text 
                          fontSize={{ base: "8px", md: "xs" }} 
                          color="gray.400" 
                          textAlign="center" 
                          mb={{ base: 2, md: 2 }}
                          fontWeight="500"
                          letterSpacing="0.05em"
                        >
                          Complete activities to earn this exclusive badge • Part of Season NFT Collections
                        </Text>
                        
                        {userBadgeBalance > 0n ? (
                          <Box>
                            <Box 
                              position="relative" 
                              bg="rgba(139,92,246,0.1)" 
                              borderRadius={{ base: "xl", md: "2xl" }} 
                              border="2px solid #c084fc" 
                              p={{ base: 3, md: 5 }} 
                              backdropFilter="blur(10px)" 
                              boxShadow="0 0 30px rgba(192,132,252,0.3)"
                              transition="all 0.3s ease"
                              _hover={{ boxShadow: "0 0 50px rgba(192,132,252,0.5)" }}
                            >
                              <VStack spacing={{ base: 2, md: 3 }}>
                                <Box 
                                  position="relative" 
                                  w={{ base: "80px", md: "120px" }} 
                                  h={{ base: "80px", md: "120px" }} 
                                  mx="auto" 
                                  borderRadius={{ base: "xl", md: "2xl" }} 
                                  overflow="hidden" 
                                  border="3px solid #c084fc" 
                                  boxShadow="0 0 25px rgba(192,132,252,0.6)" 
                                  transition="all 0.3s" 
                                  _hover={{ transform: "scale(1.05)", boxShadow: "0 0 40px rgba(192,132,252,0.9)" }}
                                >
                                  <Box as="img" src="https://bafybeibnlhweiehqzce7sj3gjuv7567qdebz6lbjqrvbjei73agmuigf4i.ipfs.dweb.link/" alt="Reputation Badge NFT" w="100%" h="100%" objectFit="cover" />
                                  <Badge 
                                    position="absolute" 
                                    bottom="4px" 
                                    right="4px" 
                                    bg="#c084fc" 
                                    color="white" 
                                    fontSize={{ base: "7px", md: "10px" }} 
                                    px={{ base: 1, md: 2 }} 
                                    py={{ base: 0.5, md: 1 }} 
                                    borderRadius="full"
                                  >
                                    SBT
                                  </Badge>
                                </Box>
                                
                                <Text 
                                  fontWeight="800" 
                                  fontSize={{ base: "md", md: "lg" }} 
                                  color="#c084fc"
                                  textAlign="center"
                                >
                                  Reputation Guardian
                                </Text>
                                
                                <Text 
                                  fontSize={{ base: "7px", md: "xs" }} 
                                  color="gray.400" 
                                  textAlign="center"
                                >
                                  Soulbound Token (Non-Transferable) • Forever tied to your wallet
                                </Text>
                                
                                {/* Soneium Season 12 Badge */}
                                <Badge 
                                  bgGradient="linear(135deg, #fbbf24, #ec4899)" 
                                  px={{ base: 2, md: 3.5 }} 
                                  py={{ base: 0.8, md: 1.5 }} 
                                  rounded="full" 
                                  fontSize={{ base: "8px", md: "12px" }} 
                                  color="white" 
                                  boxShadow="0 0 25px rgba(251,191,36,0.5)"
                                  fontFamily="mono"
                                  fontWeight="700"
                                  border="1px solid rgba(251,191,36,0.4)"
                                  animation={`${pulseGlow} 2s ease-in-out infinite`}
                                  display="inline-flex"
                                  alignItems="center"
                                  gap={1}
                                >
                                  🏆 Soneium Season 12 Score
                                </Badge>
                                
                                <SimpleGrid columns={3} spacing={{ base: 2, md: 3 }} w="full" pt={{ base: 0.5, md: 1 }}>
                                  <Box 
                                    textAlign="center" 
                                    p={{ base: 1, md: 1.5 }} 
                                    bg="rgba(0,0,0,0.3)" 
                                    borderRadius={{ base: "md", md: "lg" }}
                                    border="1px solid rgba(139,92,246,0.15)"
                                    transition="all 0.3s"
                                    _hover={{ borderColor: "#c084fc", bg: "rgba(139,92,246,0.15)" }}
                                  >
                                    <Text fontSize={{ base: "7px", md: "9px" }} color="gray.500" fontWeight="500">Score Required</Text>
                                    <Text fontSize={{ base: "sm", md: "lg" }} fontWeight="800" color="#c084fc">{minReputationScore}+</Text>
                                  </Box>
                                  <Box 
                                    textAlign="center" 
                                    p={{ base: 1, md: 1.5 }} 
                                    bg="rgba(0,0,0,0.3)" 
                                    borderRadius={{ base: "md", md: "lg" }}
                                    border="1px solid rgba(34,197,94,0.15)"
                                    transition="all 0.3s"
                                    _hover={{ borderColor: "#4ade80", bg: "rgba(34,197,94,0.1)" }}
                                  >
                                    <Text fontSize={{ base: "7px", md: "9px" }} color="gray.500" fontWeight="500">Your Score</Text>
                                    <Text fontSize={{ base: "sm", md: "lg" }} fontWeight="800" color="#4ade80">{userTotalScore}</Text>
                                  </Box>
                                  <Box 
                                    textAlign="center" 
                                    p={{ base: 1, md: 1.5 }} 
                                    bg="rgba(0,0,0,0.3)" 
                                    borderRadius={{ base: "md", md: "lg" }}
                                    border="1px solid rgba(139,92,246,0.15)"
                                    transition="all 0.3s"
                                    _hover={{ borderColor: "#8b5cf6", bg: "rgba(139,92,246,0.15)" }}
                                  >
                                    <Text fontSize={{ base: "7px", md: "9px" }} color="gray.500" fontWeight="500">Chain</Text>
                                    <Text fontSize={{ base: "sm", md: "lg" }} fontWeight="800" color="#8b5cf6">Soneium</Text>
                                  </Box>
                                </SimpleGrid>
                                
                                {/* +2 Score Bonus Badge */}
                                <Badge 
                                  bg="rgba(34,197,94,0.12)" 
                                  color="#4ade80" 
                                  px={{ base: 2, md: 3 }} 
                                  py={{ base: 0.6, md: 1.2 }} 
                                  rounded="full" 
                                  fontSize={{ base: "7px", md: "10px" }}
                                  fontFamily="mono"
                                  fontWeight="600"
                                  border="1px solid rgba(34,197,94,0.3)"
                                  animation={`${pulseGlow} 2.5s ease-in-out infinite`}
                                  display="inline-flex"
                                  alignItems="center"
                                  gap={1}
                                >
                                  ⚡ +2 Score Bonus
                                </Badge>
                                
                                <Divider borderColor="rgba(139,92,246,0.2)" />
                                
                                <Box 
                                  textAlign="center" 
                                  p={{ base: 2, md: 3 }} 
                                  bg="rgba(251,191,36,0.05)" 
                                  borderRadius={{ base: "lg", md: "xl" }} 
                                  w="full"
                                  border="1px solid rgba(251,191,36,0.15)"
                                  transition="all 0.3s"
                                  _hover={{ borderColor: "rgba(251,191,36,0.3)", bg: "rgba(251,191,36,0.08)" }}
                                >
                                  <Text fontSize={{ base: "xs", md: "md" }} fontWeight="700" color="#fbbf24">🎉 Congratulations! 🎉</Text>
                                  <Text fontSize={{ base: "8px", md: "sm" }} color="gray.400" mt={1} fontWeight="500">
                                    You are now a verified member of the Soneium community!
                                  </Text>
                                  <Text 
                                    fontSize={{ base: "7px", md: "10px" }} 
                                    color="#c084fc" 
                                    mt={1} 
                                    fontWeight="600"
                                    animation={`${pulseGlow} 3s ease-in-out infinite`}
                                  >
                                    🏆 Part of Soneium Season 12 NFT Collections
                                  </Text>
                                </Box>
                                
                                <SimpleGrid columns={2} spacing={2} w="full">
                                  <HStack spacing={1} p={0.5} bg="rgba(0,0,0,0.2)" borderRadius="md" transition="all 0.3s" _hover={{ bg: "rgba(74,222,128,0.05)" }}>
                                    <Text fontSize={{ base: "7px", md: "10px" }} color="#4ade80" fontWeight="700">✓</Text>
                                    <Text fontSize={{ base: "7px", md: "10px" }} color="gray.400" fontWeight="500">Verified Status</Text>
                                  </HStack>
                                  <HStack spacing={1} p={0.5} bg="rgba(0,0,0,0.2)" borderRadius="md" transition="all 0.3s" _hover={{ bg: "rgba(139,92,246,0.05)" }}>
                                    <Text fontSize={{ base: "7px", md: "10px" }} color="#4ade80" fontWeight="700">✓</Text>
                                    <Text fontSize={{ base: "7px", md: "10px" }} color="gray.400" fontWeight="500">DAO Voting Power</Text>
                                  </HStack>
                                  <HStack spacing={1} p={0.5} bg="rgba(0,0,0,0.2)" borderRadius="md" transition="all 0.3s" _hover={{ bg: "rgba(251,191,36,0.05)" }}>
                                    <Text fontSize={{ base: "7px", md: "10px" }} color="#4ade80" fontWeight="700">✓</Text>
                                    <Text fontSize={{ base: "7px", md: "10px" }} color="gray.400" fontWeight="500">Exclusive Access</Text>
                                  </HStack>
                                  <HStack spacing={1} p={0.5} bg="rgba(0,0,0,0.2)" borderRadius="md" transition="all 0.3s" _hover={{ bg: "rgba(236,72,153,0.05)" }}>
                                    <Text fontSize={{ base: "7px", md: "10px" }} color="#4ade80" fontWeight="700">✓</Text>
                                    <Text fontSize={{ base: "7px", md: "10px" }} color="gray.400" fontWeight="500">Future Airdrops</Text>
                                  </HStack>
                                </SimpleGrid>
                                
                                <Button 
                                  size={{ base: "xs", md: "sm" }} 
                                  variant="link" 
                                  color="#c084fc" 
                                  fontSize={{ base: "8px", md: "10px" }} 
                                  onClick={() => window.open(`https://soneium.blockscout.com/address/${BADGE_CONTRACT}`, '_blank')}
                                  fontWeight="500"
                                  _hover={{ color: "#a855f7", textDecoration: "none" }}
                                  py={0}
                                >
                                  📜 View Badge Contract on Explorer
                                </Button>
                              </VStack>
                            </Box>
                          </Box>
                        ) : userIsAgent && userTotalScore >= minReputationScore ? (
                          <Box>
                            <Box 
                              position="relative" 
                              bg="rgba(139,92,246,0.08)" 
                              borderRadius={{ base: "xl", md: "2xl" }} 
                              border="2px dashed rgba(251,191,36,0.4)" 
                              p={{ base: 3, md: 4 }} 
                              mb={{ base: 2, md: 3 }}
                              transition="all 0.3s"
                              _hover={{ borderColor: "rgba(251,191,36,0.6)", bg: "rgba(139,92,246,0.12)" }}
                            >
                              <VStack spacing={{ base: 2, md: 2.5 }}>
                                <Box 
                                  position="relative" 
                                  w={{ base: "60px", md: "90px" }} 
                                  h={{ base: "60px", md: "90px" }} 
                                  mx="auto" 
                                  borderRadius="xl" 
                                  overflow="hidden" 
                                  opacity={0.6} 
                                  filter="grayscale(50%)"
                                  transition="all 0.3s"
                                  _hover={{ opacity: 0.8, filter: "grayscale(30%)" }}
                                >
                                  <Box as="img" src="https://bafybeibnlhweiehqzce7sj3gjuv7567qdebz6lbjqrvbjei73agmuigf4i.ipfs.dweb.link/" alt="Reputation Badge Preview" w="100%" h="100%" objectFit="cover" />
                                  <Box position="absolute" inset={0} bg="rgba(0,0,0,0.5)" display="flex" alignItems="center" justifyContent="center">
                                    <Badge bg="#c084fc" fontSize={{ base: "7px", md: "10px" }} fontWeight="700" px={2} py={1} borderRadius="full">LOCKED</Badge>
                                  </Box>
                                </Box>
                                <Text 
                                  fontWeight="700" 
                                  fontSize={{ base: "sm", md: "lg" }} 
                                  color="#c084fc"
                                  textAlign="center"
                                >
                                  Exclusive Reputation Badge
                                </Text>
                                <Text 
                                  fontSize={{ base: "8px", md: "sm" }} 
                                  color="gray.400" 
                                  textAlign="center"
                                  fontWeight="500"
                                >
                                  You've earned the right to mint this badge!
                                </Text>
                                
                                <Badge 
                                  bg="rgba(251,191,36,0.15)" 
                                  color="#fbbf24" 
                                  fontSize={{ base: "8px", md: "10px" }} 
                                  px={{ base: 2, md: 3 }} 
                                  py={{ base: 0.6, md: 1.2 }} 
                                  borderRadius="full"
                                  fontWeight="600"
                                  animation={`${pulseGlow} 2s ease-in-out infinite`}
                                >
                                  ⚡ +2 Score Bonus on mint
                                </Badge>
                                
                                <Button 
                                  onClick={handleMintBadge} 
                                  isLoading={isTxPending} 
                                  w="full" 
                                  size={{ base: "sm", md: "lg" }} 
                                  bgGradient="linear(135deg, #c084fc, #ec4899)" 
                                  color="white" 
                                  fontWeight="700" 
                                  fontSize={{ base: "sm", md: "md" }}
                                  leftIcon={<Text fontSize={{ base: "md", md: "xl" }}>🏅</Text>} 
                                  _hover={{ transform: "scale(1.02)", boxShadow: "0 0 40px rgba(192,132,252,0.5)" }}
                                  transition="all 0.3s"
                                  borderRadius="full"
                                  py={{ base: 1.5, md: 2 }}
                                >
                                  MINT REPUTATION BADGE
                                </Button>
                                <Text 
                                  fontSize={{ base: "8px", md: "10px" }} 
                                  color="gray.500" 
                                  textAlign="center"
                                  fontWeight="500"
                                >
                                  ✓ You have {minReputationScore}+ reputation points • Click to mint your SBT badge
                                </Text>
                                <Text 
                                  fontSize={{ base: "7px", md: "10px" }} 
                                  color="#c084fc" 
                                  textAlign="center"
                                  fontWeight="500"
                                  animation={`${pulseGlow} 3s ease-in-out infinite`}
                                >
                                  🏆 This badge is part of Soneium Season 12 NFT Collections
                                </Text>
                              </VStack>
                            </Box>
                          </Box>
                        ) : userIsAgent ? (
                          <Box>
                            <Box 
                              position="relative" 
                              bg="rgba(139,92,246,0.05)" 
                              borderRadius={{ base: "xl", md: "2xl" }} 
                              border="1px solid rgba(139,92,246,0.2)" 
                              p={{ base: 3, md: 4 }}
                              transition="all 0.3s"
                              _hover={{ borderColor: "rgba(139,92,246,0.4)", bg: "rgba(139,92,246,0.08)" }}
                            >
                              <VStack spacing={{ base: 2, md: 2.5 }} align="stretch">
                                <Box 
                                  position="relative" 
                                  w={{ base: "60px", md: "90px" }} 
                                  h={{ base: "60px", md: "90px" }} 
                                  mx="auto" 
                                  borderRadius="xl" 
                                  overflow="hidden" 
                                  filter="blur(4px)" 
                                  opacity={0.5}
                                >
                                  <Box as="img" src="https://bafybeibnlhweiehqzce7sj3gjuv7567qdebz6lbjqrvbjei73agmuigf4i.ipfs.dweb.link/" alt="Badge Preview" w="100%" h="100%" objectFit="cover" />
                                </Box>
                                <Text 
                                  fontWeight="700" 
                                  fontSize={{ base: "sm", md: "lg" }} 
                                  color="#9ca3af" 
                                  textAlign="center"
                                >
                                  🔒 Reputation Badge (Locked)
                                </Text>
                                <Text 
                                  fontSize={{ base: "8px", md: "sm" }} 
                                  color="gray.500" 
                                  textAlign="center"
                                  fontWeight="500"
                                >
                                  Complete activities to unlock this exclusive badge
                                </Text>
                                
                                <Badge 
                                  bg="rgba(251,191,36,0.1)" 
                                  color="#fbbf24" 
                                  fontSize={{ base: "8px", md: "10px" }} 
                                  px={{ base: 2, md: 3 }} 
                                  py={{ base: 0.6, md: 1.2 }} 
                                  borderRadius="full"
                                  fontWeight="600"
                                  border="1px solid rgba(251,191,36,0.2)"
                                  animation={`${pulseGlow} 3s ease-in-out infinite`}
                                  display="inline-flex"
                                  alignItems="center"
                                  gap={1}
                                >
                                  🏆 Soneium Season 12 Score
                                </Badge>
                                
                                <Box 
                                  mt={{ base: 1, md: 1.5 }} 
                                  p={{ base: 2, md: 2.5 }} 
                                  bg="rgba(0,0,0,0.3)" 
                                  borderRadius={{ base: "md", md: "lg" }}
                                  border="1px solid rgba(139,92,246,0.15)"
                                  transition="all 0.3s"
                                  _hover={{ borderColor: "rgba(139,92,246,0.3)" }}
                                >
                                  <Flex justify="space-between" mb={1}>
                                    <Text fontSize={{ base: "8px", md: "xs" }} color="gray.400" fontWeight="600" letterSpacing="0.05em">BADGE REQUIREMENTS</Text>
                                    <Text fontSize={{ base: "8px", md: "xs" }} color="#c084fc" fontWeight="700">{userTotalScore} / {minReputationScore}</Text>
                                  </Flex>
                                  <Box h={{ base: "5px", md: "7px" }} bg="rgba(139,92,246,0.2)" borderRadius="full" overflow="hidden" mb={1}>
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
                                        background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
                                        animation: "shimmer 1.5s infinite",
                                      }}
                                    />
                                  </Box>
                                  <Flex justify="space-between" align="center">
                                    <HStack spacing={1}>
                                      <Text fontSize={{ base: "7px", md: "10px" }} color="#fbbf24">⭐</Text>
                                      <Text fontSize={{ base: "7px", md: "10px" }} color="gray.400" fontWeight="500">Points needed:</Text>
                                    </HStack>
                                    <Text fontSize={{ base: "sm", md: "lg" }} fontWeight="800" color="#c084fc">{minReputationScore - userTotalScore} more</Text>
                                  </Flex>
                                </Box>

                                <Divider my={0.5} borderColor="rgba(139,92,246,0.15)" />
                                
                                <Text fontSize={{ base: "8px", md: "10px" }} color="gray.500" fontWeight="600" letterSpacing="0.05em">✨ BADGE BENEFITS:</Text>
                                
                                <VStack spacing={0.5} align="start" w="full">
                                  <HStack spacing={2} w="full" p={0.5} borderRadius="md" transition="all 0.3s" _hover={{ bg: "rgba(74,222,128,0.03)" }}>
                                    <Text fontSize={{ base: "7px", md: "10px" }} color="#4ade80" fontWeight="700">✓</Text>
                                    <Text fontSize={{ base: "7px", md: "10px" }} color="gray.400" fontWeight="500">Verified Reputation Status</Text>
                                  </HStack>
                                  <HStack spacing={2} w="full" p={0.5} borderRadius="md" transition="all 0.3s" _hover={{ bg: "rgba(139,92,246,0.03)" }}>
                                    <Text fontSize={{ base: "7px", md: "10px" }} color="#4ade80" fontWeight="700">✓</Text>
                                    <Text fontSize={{ base: "7px", md: "10px" }} color="gray.400" fontWeight="500">Exclusive Community Access</Text>
                                  </HStack>
                                  <HStack spacing={2} w="full" p={0.5} borderRadius="md" transition="all 0.3s" _hover={{ bg: "rgba(192,132,252,0.03)" }}>
                                    <Text fontSize={{ base: "7px", md: "10px" }} color="#4ade80" fontWeight="700">✓</Text>
                                    <Text fontSize={{ base: "7px", md: "10px" }} color="gray.400" fontWeight="500">On-Chain Achievement Proof</Text>
                                  </HStack>
                                  <HStack spacing={2} w="full" p={0.5} borderRadius="md" transition="all 0.3s" _hover={{ bg: "rgba(251,191,36,0.03)" }}>
                                    <Text fontSize={{ base: "7px", md: "10px" }} color="#4ade80" fontWeight="700">✓</Text>
                                    <Text fontSize={{ base: "7px", md: "10px" }} color="gray.400" fontWeight="500">Future Airdrop Eligibility</Text>
                                  </HStack>
                                  <HStack spacing={2} w="full" p={0.8} borderRadius="md" bg="rgba(251,191,36,0.05)" border="1px solid rgba(251,191,36,0.1)">
                                    <Text fontSize={{ base: "7px", md: "10px" }} color="#fbbf24" fontWeight="700">⭐</Text>
                                    <Text fontSize={{ base: "7px", md: "10px" }} color="gray.400" fontWeight="500">+2 Score Bonus upon mint</Text>
                                  </HStack>
                                </VStack>

                                <Box 
                                  mt={1.5} 
                                  p={1.5} 
                                  bg="rgba(139,92,246,0.08)" 
                                  borderRadius={{ base: "md", md: "lg" }} 
                                  border="1px solid rgba(139,92,246,0.15)"
                                  transition="all 0.3s"
                                  _hover={{ borderColor: "rgba(139,92,246,0.3)", bg: "rgba(139,92,246,0.12)" }}
                                >
                                  <Text fontSize={{ base: "8px", md: "10px" }} color="gray.400" textAlign="center" fontWeight="500">
                                    💡 Complete more activities to unlock the badge! Each partner action gives you +1 point.
                                  </Text>
                                  <Text 
                                    fontSize={{ base: "7px", md: "10px" }} 
                                    color="#c084fc" 
                                    textAlign="center" 
                                    mt={1}
                                    fontWeight="600"
                                    animation={`${pulseGlow} 3s ease-in-out infinite`}
                                  >
                                    🏆 Part of Soneium Season 12 NFT Collections
                                  </Text>
                                </Box>
                              </VStack>
                            </Box>
                          </Box>
                        ) : (
                          <Box 
                            textAlign="center" 
                            p={{ base: 3, md: 4 }} 
                            bg="rgba(139,92,246,0.05)" 
                            borderRadius="xl" 
                            border="1px dashed rgba(139,92,246,0.3)"
                            transition="all 0.3s"
                            _hover={{ borderColor: "rgba(139,92,246,0.5)", bg: "rgba(139,92,246,0.08)" }}
                          >
                            <Text fontSize={{ base: "sm", md: "md" }} color="gray.500" fontWeight="600">🔒 Register as Agent to unlock Badge System</Text>
                            <Text fontSize={{ base: "8px", md: "10px" }} color="gray.500" mt={1} fontWeight="500">
                              Earn your Reputation Badge and join Soneium Season 12 NFT Collections
                            </Text>
                          </Box>
                        )}
                      </Box>
                    </VStack>
                  </Box>
                </Box>
              </GridItem>

              {/* Activity Breakdown - MOBILE: mai compact */}
              <GridItem>
                <Box bg="rgba(8,8,20,0.8)" backdropFilter="blur(24px)" borderRadius={{ base: "2xl", md: "3xl" }} border="1px solid rgba(139,92,246,0.3)" overflow="hidden" transition="all 0.4s" _hover={{ borderColor: "rgba(139,92,246,0.6)", transform: "translateY(-5px)" }} h="100%">
                  <Box h={{ base: "2px", md: "4px" }} bgGradient="linear(90deg, #ec4899, #8b5cf6, #3b82f6, #ec4899)" backgroundSize="300% 100%" animation={`${shimmer} 4s ease infinite`} />
                  <Box p={{ base: 3, md: 6 }}>
                    <HStack justify="space-between" mb={{ base: 3, md: 5 }}>
                      <Heading size={{ base: "sm", md: "md" }} color="gray.200" fontWeight="600">Activity Breakdown</Heading>
                      <Badge bg="rgba(139,92,246,0.2)" color="#c084fc" px={{ base: 2, md: 3 }} py={{ base: 0.5, md: 1 }} borderRadius="full" fontSize={{ base: "8px", md: "xs" }}>Lifetime</Badge>
                    </HStack>
                    <VStack spacing={{ base: 2, md: 5 }}>
                      {stats.map((stat) => {
                        const targets: { [key: string]: number } = { "GM Sent": 100, "Votes Cast": 50, "Check-Ins": 100, "Deployments": 25, "Agent GM": 200, "Partner Actions": 500 };
                        const target = targets[stat.label] || 100;
                        const percentage = Math.min(100, (stat.value / target) * 100);
                        const nextMilestone = target - stat.value;
                        return (
                          <Box key={stat.label} w="full" p={{ base: 2, md: 3 }} bg="rgba(0,0,0,0.3)" borderRadius={{ base: "lg", md: "xl" }} transition="all 0.3s" _hover={{ bg: "rgba(139,92,246,0.05)" }}>
                            <Flex justify="space-between" mb={{ base: 1, md: 2 }}>
                              <HStack spacing={{ base: 2, md: 3 }}>
                                <Box w={{ base: "28px", md: "40px" }} h={{ base: "28px", md: "40px" }} bg={`${stat.color}15`} borderRadius={{ base: "md", md: "lg" }} display="flex" alignItems="center" justifyContent="center">
                                  <Text fontSize={{ base: "16px", md: "24px" }}>{stat.icon}</Text>
                                </Box>
                                <Box>
                                  <Text fontWeight="700" fontSize={{ base: "xs", md: "md" }} color="gray.200">{stat.label}</Text>
                                  <Text fontSize={{ base: "7px", md: "xs" }} color="gray.500" display={{ base: "none", md: "block" }}>{stat.description}</Text>
                                </Box>
                              </HStack>
                              <Box textAlign="right">
                                <Text fontWeight="800" fontSize={{ base: "md", md: "2xl" }} color={stat.color}>{stat.value}</Text>
                                <Text fontSize={{ base: "7px", md: "xs" }} color="gray.600">target: {target}</Text>
                              </Box>
                            </Flex>
                            <Box h={{ base: "5px", md: "8px" }} bg="rgba(255,255,255,0.05)" borderRadius="full" overflow="hidden" mb={{ base: 0.5, md: 2 }}>
                              <Box
                                h="100%"
                                borderRadius="full"
                                bg={stat.color}
                                transition="width 1s ease-out"
                                width={`${percentage}%`}
                                boxShadow={`0 0 8px ${stat.color}80`}
                                position="relative"
                                _after={{
                                  content: '""',
                                  position: "absolute",
                                  top: 0,
                                  left: 0,
                                  right: 0,
                                  bottom: 0,
                                  background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
                                  animation: "shimmer 1.5s infinite",
                                }}
                              />
                            </Box>
                            <Flex justify="space-between">
                              <Text fontSize={{ base: "7px", md: "xs" }} color="gray.500">Progress</Text>
                              <Text fontSize={{ base: "7px", md: "xs" }} fontWeight="600" color={stat.color}>{percentage.toFixed(0)}%</Text>
                            </Flex>
                            {nextMilestone > 0 && percentage < 100 && (
                              <Text fontSize={{ base: "7px", md: "xs" }} color="gray.600" mt={{ base: 0.5, md: 1 }}>🎯 {nextMilestone} more to next milestone</Text>
                            )}
                            {percentage >= 100 && (
                              <Badge bg={stat.color} color="white" size="xs" mt={{ base: 0.5, md: 1 }} fontSize={{ base: "7px", md: "10px" }}>✓ MILESTONE</Badge>
                            )}
                          </Box>
                        );
                      })}
                    </VStack>
                    <Divider my={{ base: 4, md: 6 }} borderColor="rgba(139,92,246,0.15)" />
                    <Box textAlign="center">
                      <HStack justify="center" spacing={{ base: 3, md: 6 }}>
                        <Box>
                          <Text fontSize={{ base: "8px", md: "xs" }} color="gray.500">Total Actions</Text>
                          <Text fontSize={{ base: "lg", md: "2xl" }} fontWeight="800" color="#c084fc">{stats.reduce((sum, stat) => sum + stat.value, 0)}</Text>
                        </Box>
                        <Box w={{ base: "1px", md: "1px" }} h={{ base: "20px", md: "30px" }} bg="rgba(139,92,246,0.2)" />
                        <Box>
                          <Text fontSize={{ base: "8px", md: "xs" }} color="gray.500">Unique Types</Text>
                          <Text fontSize={{ base: "lg", md: "2xl" }} fontWeight="800" color="#8b5cf6">{stats.length}</Text>
                        </Box>
                        <Box w={{ base: "1px", md: "1px" }} h={{ base: "20px", md: "30px" }} bg="rgba(139,92,246,0.2)" />
                        <Box>
                          <Text fontSize={{ base: "8px", md: "xs" }} color="gray.500">Reputation Score</Text>
                          <Text fontSize={{ base: "lg", md: "2xl" }} fontWeight="800" color="#ec4899">{userTotalScore}</Text>
                        </Box>
                      </HStack>
                    </Box>
                  </Box>
                </Box>
              </GridItem>
            </Grid>

            {/* Partner Actions - MOBILE: mai compact */}
            <Box>
              <Box bg="rgba(8,8,20,0.8)" backdropFilter="blur(24px)" borderRadius={{ base: "2xl", md: "3xl" }} border="1px solid rgba(139,92,246,0.3)" overflow="hidden" transition="all 0.4s" _hover={{ borderColor: "rgba(139,92,246,0.6)", transform: "translateY(-5px)" }}>
                <Box h={{ base: "2px", md: "4px" }} bgGradient="linear(90deg, #fbbf24, #ec4899, #8b5cf6, #fbbf24)" backgroundSize="300% 100%" animation={`${shimmer} 4s ease infinite`} />
                <Box p={{ base: 3, md: 8 }}>
                  <HStack spacing={2} mb={{ base: 3, md: 6 }}>
                    <Box w={{ base: "3px", md: "4px" }} h={{ base: "3px", md: "4px" }} borderRadius="full" bg="#fbbf24" animation={`${pulseGlow} 2s infinite`} />
                    <Heading size={{ base: "sm", md: "md" }} color="gray.300" fontWeight="600">🤝 Partner Actions</Heading>
                    <Badge bg="#fbbf24" color="black" ml={{ base: 1, md: 2 }} fontSize={{ base: "8px", md: "xs" }}>21</Badge>
                  </HStack>

                  <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={{ base: 2, md: 6 }}>
                    {PARTNER_ACTIONS.map((action, index) => {
                      const hasPaidForThisSession = actionPendingPayment[action.id] === true;
                      const totalExecutedCount = Number(userActionCounts[index]?.data || 0n);
                      const frontendCooldown = getRemainingCooldown(action.id);
                      const isOnCooldown = frontendCooldown > 0;

                      return (
                        <Box key={action.id} bg="rgba(0,0,0,0.4)" borderRadius={{ base: "xl", md: "2xl" }} border={`1.5px solid ${action.color}30`} p={{ base: 3, md: 5 }} transition="all 0.3s ease-in-out" _hover={{ borderColor: action.color, transform: "translateY(-6px)", boxShadow: `0 10px 30px ${action.color}20`, bg: "rgba(0,0,0,0.6)" }}>
                          <VStack spacing={{ base: 2, md: 3 }}>
                            <HStack w="full" justify="space-between">
                              <HStack spacing={2}>
                                <Box w={{ base: "28px", md: "36px" }} h={{ base: "28px", md: "36px" }} bg="rgba(255,255,255,0.05)" borderRadius={{ base: "md", md: "xl" }} display="flex" alignItems="center" justifyContent="center">
                                  <Image src={action.logo} boxSize={{ base: "18px", md: "24px" }} borderRadius="full" fallbackSrc="https://via.placeholder.com/24" />
                                </Box>
                                <HStack spacing={2}>
                                  <Text fontWeight="700" color="white" fontSize={{ base: "xs", md: "md" }}>{action.name}</Text>
                                  {action.twitterUrl && action.twitterHandle && (
                                    <Tooltip label={`Follow ${action.twitterHandle} on X`} hasArrow placement="top">
                                      <Link href={action.twitterUrl} isExternal _hover={{ transform: "scale(1.1)" }} transition="transform 0.2s">
                                        <Icon as={FaTwitter} boxSize={{ base: "14px", md: "20px" }} color="#1DA1F2" />
                                      </Link>
                                    </Tooltip>
                                  )}
                                </HStack>
                              </HStack>
                              <Badge bg={`${action.color}20`} color={action.color} fontSize={{ base: "8px", md: "xs" }} px={{ base: 1.5, md: 2.5 }} py={{ base: 0.5, md: 1 }} borderRadius="full" fontWeight="600">
                                <HStack spacing={0.5}>
                                  <Text fontSize={{ base: "8px", md: "xs" }}>⭐</Text>
                                  <Text fontSize={{ base: "8px", md: "xs" }}>+{action.points}</Text>
                                </HStack>
                              </Badge>
                            </HStack>

                            <HStack w="full" justify="space-between">
                              <Text fontSize={{ base: "8px", md: "xs" }} color="gray.400" fontWeight="500">Status:</Text>
                              <Badge bg={hasPaidForThisSession ? "#22c55e20" : isOnCooldown ? "#fbbf2420" : "#fbbf2420"} color={hasPaidForThisSession ? "#22c55e" : isOnCooldown ? "#fbbf24" : "#fbbf24"} fontSize={{ base: "8px", md: "xs" }} px={{ base: 1.5, md: 2.5 }} py={{ base: 0.5, md: 1 }} borderRadius="full" fontWeight="600">
                                {hasPaidForThisSession ? "✓ Ready" : isOnCooldown ? "⏳ Cooldown" : "⏳ Pay First"}
                              </Badge>
                            </HStack>

                            <HStack w="full" justify="space-between">
                              <Text fontSize={{ base: "8px", md: "xs" }} color="gray.400" fontWeight="500">Completed:</Text>
                              <Text fontSize={{ base: "sm", md: "md" }} fontWeight="700" color={action.color}>{totalExecutedCount}x</Text>
                            </HStack>

                            <HStack w="full" justify="space-between">
                              <Text fontSize={{ base: "8px", md: "xs" }} color="gray.400" fontWeight="500">Next:</Text>
                              <Text fontSize={{ base: "xs", md: "sm" }} fontWeight="700" color={totalExecutedCount === 0 ? "#22c55e" : (frontendCooldown === 0 ? "#22c55e" : "#fbbf24")}>
                                {totalExecutedCount === 0 ? "✓ Ready" : (frontendCooldown === 0 ? "✓ Ready" : formatTimeRemaining(frontendCooldown))}
                              </Text>
                            </HStack>

                            <Divider borderColor="rgba(255,255,255,0.1)" my={{ base: 0.5, md: 1 }} />

                            <VStack spacing={0.5} w="full">
                              <Text fontSize={{ base: "7px", md: "xs" }} color="gray.400" fontWeight="500">Protocol Fee: <Text as="span" color="#fbbf24" fontWeight="700">{formatFee(defaultFee)} ETH</Text></Text>
                              <Text fontSize={{ base: "7px", md: "xs" }} color="gray.400" fontWeight="500">
                                External Fee: {action.externalFee > 0 ? (
                                  <Text as="span" color="#22c55e" fontWeight="700">{formatFee(BigInt(action.externalFee))} ETH</Text>
                                ) : (
                                  <Text as="span" color="#fbbf24" fontWeight="700">FREE</Text>
                                )}
                              </Text>
                            </VStack>

                            <Button
                              size={{ base: "xs", md: "md" }}
                              w="full"
                              bg={!hasPaidForThisSession ? `linear-gradient(135deg, ${action.color}, ${action.color}cc)` : `linear-gradient(135deg, ${action.color}, ${action.color}cc)`}
                              color="white"
                              fontWeight="bold"
                              fontSize={{ base: "9px", md: "sm" }}
                              py={{ base: 1.5, md: 2.5 }}
                              isLoading={isTxPending}
                              isDisabled={!hasPaidForThisSession && isOnCooldown}
                              _hover={{ opacity: 0.9, transform: "scale(1.02)", boxShadow: `0 0 15px ${action.color}80` }}
                              borderRadius="full"
                              onClick={() => !hasPaidForThisSession ? handlePayAndApprove(action) : handleExecutePartnerAction(action)}
                            >
                              {!hasPaidForThisSession ? (isOnCooldown ? `⏳ Cooldown` : `💰 Pay & Interact `) : `✨ ${action.name.split(" ")[0]} ✨`}
                            </Button>

                            {!hasPaidForThisSession && !isOnCooldown && (
                              <Text fontSize={{ base: "7px", md: "xs" }} color="gray.500" textAlign="center" mt={0.5}>
                                💡 {totalExecutedCount === 0 ? "Pay & Interact to earn points!" : "Pay again for more points!"}
                              </Text>
                            )}
                            {isOnCooldown && !hasPaidForThisSession && (
                              <Text fontSize={{ base: "7px", md: "xs" }} color="gray.500" textAlign="center" mt={0.5}>⏰ Come back in {formatTimeRemaining(frontendCooldown)}</Text>
                            )}
                          </VStack>
                        </Box>
                      );
                    })}
                  </SimpleGrid>
                </Box>
              </Box>
            </Box>
          </VStack>
        )}

        {/* Payment Modal */}
        <Modal isOpen={showPaymentModal} onClose={() => { setShowPaymentModal(false); setPaymentData(null); }} isCentered size={{ base: "sm", md: "md" }}>
          <ModalOverlay backdropFilter="blur(10px)" />
          <ModalContent bg="rgba(8,8,20,0.98)" border="1px solid rgba(139,92,246,0.4)" borderRadius={{ base: "xl", md: "2xl" }} mx={3}>
            <ModalCloseButton color="gray.400" />
            <ModalBody py={{ base: 4, md: 8 }}>
              <VStack spacing={{ base: 4, md: 6 }}>
                <Box fontSize={{ base: "40px", md: "56px" }}>✅</Box>
                <Text fontSize={{ base: "lg", md: "24px" }} fontWeight="800" bgGradient="linear(135deg, #22c55e, #16a34a)" bgClip="text">PAYMENT SUCCESSFUL!</Text>
                <Badge bg="#22c55e20" color="#22c55e" px={{ base: 3, md: 4 }} py={{ base: 1.5, md: 2 }} borderRadius="full" fontSize={{ base: "xs", md: "md" }}>Transaction Confirmed</Badge>

                <Box w="full" bg="rgba(0,0,0,0.4)" borderRadius={{ base: "lg", md: "xl" }} p={{ base: 3, md: 4 }}>
                  <VStack spacing={{ base: 2, md: 3 }} align="stretch">
                    <HStack justify="space-between">
                      <Text color="gray.400" fontSize={{ base: "xs", md: "sm" }}>Action</Text>
                      <Text fontWeight="600" color="white" fontSize={{ base: "xs", md: "sm" }}>{paymentData?.action.fullName}</Text>
                    </HStack>
                    <Divider borderColor="rgba(139,92,246,0.2)" />
                    <HStack justify="space-between">
                      <Text color="gray.400" fontSize={{ base: "xs", md: "sm" }}>Fee Paid</Text>
                      <Text fontWeight="600" color="#22c55e" fontSize={{ base: "xs", md: "sm" }}>{formatFee(defaultFee)} ETH</Text>
                    </HStack>
                    <Divider borderColor="rgba(139,92,246,0.2)" />
                    <HStack justify="space-between">
                      <Text color="gray.400" fontSize={{ base: "xs", md: "sm" }}>Transaction</Text>
                      <Link href={`https://soneium.blockscout.com/tx/${paymentData?.txHash}`} isExternal>
                        <Text fontSize={{ base: "xs", md: "sm" }} fontFamily="mono" color="#c084fc" _hover={{ textDecoration: "underline" }}>{truncateAddress(paymentData?.txHash || "")}</Text>
                      </Link>
                    </HStack>
                  </VStack>
                </Box>

                <Button
                  bgGradient={`linear(135deg, ${paymentData?.action.color || "#8b5cf6"}, ${paymentData?.action.color || "#ec4899"}cc)`}
                  color="white"
                  size={{ base: "sm", md: "lg" }}
                  w="full"
                  fontWeight="bold"
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
            <ModalFooter pt={0} pb={{ base: 4, md: 6 }}>
              <Text fontSize={{ base: "8px", md: "xs" }} color="gray.500" textAlign="center" w="full">
                You have paid the protocol fee. Now confirm the second transaction to complete the action.
              </Text>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Success Modal */}
        <Modal isOpen={showSuccessModal} onClose={() => {
          setShowSuccessModal(false);
          setTimeout(() => {
            restoreScrollPosition();
          }, 300);
        }} isCentered size={{ base: "sm", md: "lg" }}>
          <ModalOverlay backdropFilter="blur(10px)" />
          <ModalContent bg="rgba(8,8,20,0.98)" border="1px solid rgba(139,92,246,0.4)" borderRadius={{ base: "xl", md: "2xl" }} mx={3}>
            <ModalCloseButton color="gray.400" />
            <ModalBody py={{ base: 4, md: 8 }}>
              <VStack spacing={{ base: 4, md: 6 }}>
                <Box fontSize={{ base: "40px", md: "56px" }}>🌅</Box>
                <Text fontSize={{ base: "lg", md: "24px" }} fontWeight="800" bgGradient="linear(135deg, #c084fc, #ec4899)" bgClip="text">DAILY RITUAL</Text>
                <Badge bg="#22c55e20" color="#22c55e" px={{ base: 3, md: 4 }} py={{ base: 1.5, md: 2 }} borderRadius="full" fontSize={{ base: "xs", md: "md" }}>Action Completed! ✨</Badge>

                <Box w="full" bg="rgba(0,0,0,0.4)" borderRadius={{ base: "lg", md: "xl" }} p={{ base: 3, md: 4 }}>
                  <VStack spacing={{ base: 2, md: 3 }} align="stretch">
                    <HStack justify="space-between">
                      <Text color="gray.400" fontSize={{ base: "xs", md: "sm" }}>Network</Text>
                      <HStack><Badge bg="#8b5cf6" color="white" fontSize={{ base: "8px", md: "xs" }}>Soneium</Badge></HStack>
                    </HStack>
                    <Divider borderColor="rgba(139,92,246,0.2)" />
                    <HStack justify="space-between">
                      <Text color="gray.400" fontSize={{ base: "xs", md: "sm" }}>Transaction</Text>
                      <Text fontWeight="600" color="white" fontSize={{ base: "xs", md: "sm" }}>{successData?.actionName}</Text>
                    </HStack>
                    <Divider borderColor="rgba(139,92,246,0.2)" />
                    <HStack justify="space-between">
                      <Text color="gray.400" fontSize={{ base: "xs", md: "sm" }}>Points Earned</Text>
                      <Text fontWeight="700" color="#fbbf24" fontSize={{ base: "md", md: "lg" }}>+{successData?.points}</Text>
                    </HStack>
                    <Divider borderColor="rgba(139,92,246,0.2)" />
                    <HStack justify="space-between">
                      <Text color="gray.400" fontSize={{ base: "xs", md: "sm" }}>Total Completed</Text>
                      <Text fontWeight="700" color="#22c55e" fontSize={{ base: "sm", md: "md" }}>{successData?.totalCount}x</Text>
                    </HStack>
                    <Divider borderColor="rgba(139,92,246,0.2)" />
                    <HStack justify="space-between">
                      <Text color="gray.400" fontSize={{ base: "xs", md: "sm" }}>Transaction</Text>
                      <Link href={`https://soneium.blockscout.com/tx/${successData?.txHash}`} isExternal>
                        <Text fontSize={{ base: "xs", md: "sm" }} fontFamily="mono" color="#c084fc" _hover={{ textDecoration: "underline" }}>{truncateAddress(successData?.txHash || "")}</Text>
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
                    size={{ base: "xs", md: "md" }}
                    borderRadius="full"
                    _hover={{ opacity: 0.9, transform: "scale(1.02)" }}
                    onClick={() => shareOnX(successData?.actionName || "", successData?.actionHandle, successData?.points || 0)}
                  >
                    Share
                  </Button>
                  <Button
                    leftIcon={<CopyIcon />}
                    variant="outline"
                    borderColor="rgba(139,92,246,0.5)"
                    color="gray.300"
                    flex={1}
                    size={{ base: "xs", md: "md" }}
                    borderRadius="full"
                    _hover={{ bg: "rgba(139,92,246,0.1)" }}
                    onClick={() => {
                      navigator.clipboard.writeText(successData?.txHash || "");
                      toast({ title: "Copied!", description: "Transaction hash copied to clipboard", status: "success", duration: 2000 });
                    }}
                  >
                    Copy
                  </Button>
                  <Button
                    rightIcon={<ExternalLinkIcon />}
                    variant="solid"
                    bg="rgba(139,92,246,0.2)"
                    color="white"
                    flex={1}
                    size={{ base: "xs", md: "md" }}
                    borderRadius="full"
                    _hover={{ bg: "rgba(139,92,246,0.4)" }}
                    onClick={() => window.open(`https://soneium.blockscout.com/tx/${successData?.txHash}`, '_blank')}
                  >
                    Explorer
                  </Button>
                </HStack>
              </VStack>
            </ModalBody>
            <ModalFooter pt={0} pb={{ base: 4, md: 6 }}>
              <Text fontSize={{ base: "8px", md: "xs" }} color="gray.500" textAlign="center" w="full">
                🌅 💬✨ Just completed on Soneium! ✨💬🌅
              </Text>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Container>

      {/* Footer */}
      <Box 
        pt={{ base: 4, md: 6 }} 
        pb={{ base: 3, md: 4 }} 
        bg="black" 
        borderTop="1px solid" 
        borderColor="rgba(139,92,246,0.15)" 
        position="relative"
        width="100%"
        left="0"
        right="0"
      >
        <Container maxW="container.lg" mx="auto" px={{ base: 3, md: 6 }}>
          <VStack spacing={{ base: 1, md: 2 }} w="full">
            <Divider opacity={0.3} borderColor="rgba(139,92,246,0.3)" maxW={{ base: "200px", md: "300px" }} />
            <Text fontSize={{ base: "8px", md: "xs" }} fontWeight="500" letterSpacing="0.08em" fontFamily="mono" color="gray.400" textAlign="center">
              © 2026 • Activity Reputation • Soneium Mainnet
            </Text>
            <HStack spacing={{ base: 2, md: 4 }} justify="center" flexWrap="wrap" align="center">
              <Text fontSize={{ base: "7px", md: "xs" }} color="gray.500" fontWeight="500" letterSpacing="0.1em" _hover={{ color: "gray.400" }} transition="color 0.2s">
                🔗 ON-CHAIN
              </Text>
              <Box w="2px" h="2px" borderRadius="full" bg="gray.600" />
              <Text fontSize={{ base: "7px", md: "xs" }} color="gray.500" fontWeight="500" letterSpacing="0.1em" _hover={{ color: "gray.400" }} transition="color 0.2s">
                ⚡ REAL-TIME
              </Text>
              <Box w="2px" h="2px" borderRadius="full" bg="gray.600" />
              <Text fontSize={{ base: "7px", md: "xs" }} color="gray.500" fontWeight="500" letterSpacing="0.1em" _hover={{ color: "gray.400" }} transition="color 0.2s">
                🛡️ SECURE
              </Text>
              <Box w="2px" h="2px" borderRadius="full" bg="gray.600" />
              <Text fontSize={{ base: "7px", md: "xs" }} color="gray.500" fontWeight="500" letterSpacing="0.1em" _hover={{ color: "gray.400" }} transition="color 0.2s">
                🌐 DECENTRALIZED
              </Text>
            </HStack>
          </VStack>
        </Container>
        
        {/* Social Icons */}
        <HStack 
          spacing={{ base: 2, md: 3 }} 
          position={{ base: "relative", md: "absolute" }}
          right={{ base: "auto", md: "15%" }}
          bottom={{ base: "auto", md: "50%" }}
          top={{ base: "auto", md: "50%" }}
          transform={{ base: "none", md: "translateY(-50%)" }}
          mt={{ base: 2, md: 0 }}
          justify="center"
          width={{ base: "100%", md: "auto" }}
        >
          <Text fontSize={{ base: "7px", md: "9px" }} color="gray.500" letterSpacing="wider" display={{ base: "none", md: "block" }}>
            FOLLOW
          </Text>
          <Box w="1px" h={{ base: "12px", md: "16px" }} bg="rgba(139,92,246,0.3)" display={{ base: "none", md: "block" }} />
          
          <Tooltip label="X (Twitter) - @silviu_asy" hasArrow placement="top">
            <Box
              as="a"
              href="https://x.com/silviu_asy"
              target="_blank"
              rel="noopener noreferrer"
              w={{ base: "24px", md: "28px" }}
              h={{ base: "24px", md: "28px" }}
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
                width={{ base: "12px", md: "14px" }}
                height={{ base: "12px", md: "14px" }}
                viewBox="0 0 24 24"
                fill="currentColor"
                color="gray.500"
                transition="color 0.2s ease"
                _hover={{ color: "white" }}
              >
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </Box>
            </Box>
          </Tooltip>
          
          <Tooltip label="GitHub - SilviuASY" hasArrow placement="top">
            <Box
              as="a"
              href="https://github.com/SilviuASY/gm-agent"
              target="_blank"
              rel="noopener noreferrer"
              w={{ base: "24px", md: "28px" }}
              h={{ base: "24px", md: "28px" }}
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
                width={{ base: "12px", md: "14px" }}
                height={{ base: "12px", md: "14px" }}
                viewBox="0 0 24 24"
                fill="currentColor"
                color="gray.500"
                transition="color 0.2s ease"
                _hover={{ color: "white" }}
              >
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.03-2.682-.103-.253-.447-1.27.098-2.646 0 0 .84-.269 2.75 1.025.8-.223 1.65-.334 2.5-.334.85 0 1.7.111 2.5.334 1.91-1.294 2.75-1.025 2.75-1.025.545 1.376.201 2.393.099 2.646.64.698 1.03 1.591 1.03 2.682 0 3.841-2.337 4.687-4.565 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
              </Box>
            </Box>
          </Tooltip>
          
          <Tooltip label="Telegram - @silviuasy" hasArrow placement="top">
            <Box
              as="a"
              href="https://t.me/silviuasy"
              target="_blank"
              rel="noopener noreferrer"
              w={{ base: "24px", md: "28px" }}
              h={{ base: "24px", md: "28px" }}
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
                width={{ base: "12px", md: "14px" }}
                height={{ base: "12px", md: "14px" }}
                viewBox="0 0 24 24"
                fill="currentColor"
                color="gray.500"
                transition="color 0.2s ease"
                _hover={{ color: "white" }}
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.66-.35-1.02.22-1.61.15-.15 2.71-2.48 2.76-2.69.01-.03.02-.14-.05-.2-.07-.06-.18-.04-.26-.02-.11.02-1.86 1.18-5.26 3.48-.5.34-.95.51-1.36.5-.45-.01-1.31-.25-1.95-.46-.78-.25-1.4-.38-1.35-.81.03-.22.33-.45.92-.68 2.02-.88 4.26-1.78 6.18-2.38 1.56-.49 3.98-1.06 4.49-1.06.18 0 .46.04.64.19.15.13.19.31.17.53-.02.09-.01.18-.03.28z" />
              </Box>
            </Box>
          </Tooltip>
          
          <Tooltip label="Discord - Join our community" hasArrow placement="top">
            <Box
              as="a"
              href="https://discord.com/invite/FVSQT68NPC"
              target="_blank"
              rel="noopener noreferrer"
              w={{ base: "24px", md: "28px" }}
              h={{ base: "24px", md: "28px" }}
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
                width={{ base: "12px", md: "14px" }}
                height={{ base: "12px", md: "14px" }}
                viewBox="0 0 24 24"
                fill="currentColor"
                color="gray.500"
                transition="color 0.2s ease"
                _hover={{ color: "white" }}
              >
                <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </Box>
            </Box>
          </Tooltip>
        </HStack>
      </Box>

      {/* Leaderboard Modal */}
      <LeaderboardModal isOpen={isLeaderboardOpen} onClose={onLeaderboardClose} />

      <TransactionModal isOpen={txOpen} status={txStatus} title={txTitle} description={txDesc} onClose={closeTx} />
    </Box>
  );
}

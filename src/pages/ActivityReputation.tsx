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
  Progress,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Avatar,
  useToast,
  Input,
  InputGroup,
  InputLeftElement,
  Spinner,
  Alert,
  AlertIcon,
  Tooltip,
  IconButton,
  Divider,
  Grid,
  GridItem,
  useColorMode,
  Image,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
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
import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { keyframes } from "@emotion/react";
import { ChevronLeftIcon, SearchIcon, StarIcon } from "@chakra-ui/icons";
import { LiFiWidget, WidgetSkeleton } from '@lifi/widget';

import TransactionModal from "../components/TransactionModal";

// Import ABI-uri
import { gmABI } from "../abi/gmABI";
import { VoteABI } from "../abi/VoteABI";
import { checkInABI } from "../abi/checkInABI";
import { DeployABI } from "../abi/DeployABI";

// ================= CONTRACT ADDRESSES =================
const GM_CONTRACT = "0x92030EB87e27ED80351f346dea4B14Ac61a1f57C";
const DEPLOY_CONTRACT = "0x539040c447A4a0D61C396b74308efe959A2eD86a";
const VOTE_CONTRACT = "0xd01c919c63856a9732a6A0BAfc63eb2494e4a19F";
const CHECKIN_CONTRACT = "0x72c89BA5def57c642582E536d351483b9D85CA8C";
const AGENT_CONTRACT = "0x29c4632A1710BC58cE8D9d46Ec227fc569f58bF1";
const AGENT_GM_CONTRACT = "0xb19922c27C86cc08dc4f0f3Cb4e76c30494c22dc";
const AGENT_GATEWAY_CONTRACT = "0xBfaEB593E555f207b96D4BB08c149595Ddf2371D";

const SONEIUM_CHAIN_ID = 1868;
const BADGE_CONTRACT = "0x141224Bcdd1AE69E510c74928eD8d5B41dCe0D66";
const API_URL = "/api";

// ================= PARTNER ACTIONS =================
const PARTNER_ACTIONS = [
  { id: 0, name: "Dice Or Die Check In", logo: "/dod.png", target: "0x17c7E99c2c1aEFdf3811F72ce960a0d560F039B4", selector: "0x183ff085", functionName: "checkIn", points: 1, color: "#d32a14", hasReferral: false, externalFee: 0, isPayable: false },
  { id: 1, name: "AXD Daily Check In", logo: "/axd.png", target: "0x6b2249389dC3Db6B27833279F594910caa6465e7", selector: "0x4e71d92d", functionName: "claim", points: 1, color: "#d83fdd", hasReferral: false, externalFee: 0, isPayable: false },
  { id: 2, name: "Rubyscore Vote", logo: "/ruby.png", target: "0x6cf740D3145b71F705A9745A35b9C91f8B4F7DDF", selector: "0x632a9a52", functionName: "vote", points: 1, color: "#c6f1f1", hasReferral: false, externalFee: 5000000000000, isPayable: true },
  { id: 3, name: "Lootcoin Check In", logo: "/loot.png", target: "0x21Be1D69A77eA5882aCcD5c5319Feb7AC3854751", selector: "0xd9a59e33", functionName: "checkIn", points: 1, color: "#e2f818", hasReferral: true, externalFee: 0, isPayable: false },
  { id: 4, name: "PressA Daily", logo: "/presa.png", target: "0xf1Be6F9d4ff40Cac47C620E058535451596a5aBD", selector: "0x183ff085", functionName: "checkIn", points: 1, color: "#55e412", hasReferral: false, externalFee: 0, isPayable: false },
  { id: 5, name: "OnChain GM", logo: "/onchaingm.png", target: "0x8ADA1808cc5ed8493836e6A79080ea0ea2f008eC", selector: "0x84a3bb6b", functionName: "onChainGM", points: 1, color: "#0fa1e4", hasReferral: true, externalFee: 29000000000000, isPayable: true },
  { id: 6, name: "Captain Check In", logo: "/captain.png", target: "0xedCbF9D4CC3BA9aAA896adADeac1b6DF6326f7D8", selector: "0x183ff085", functionName: "checkIn", points: 1, color: "#f1ee0f", hasReferral: false, externalFee: 0, isPayable: false },
  { id: 7, name: "Arkada Check In", logo: "/arkada.png", target: "0x98826e728977B25279ad7629134FD0e96bd5A7b2", selector: "0x919840ad", functionName: "check", points: 1, color: "#e9660e", hasReferral: false, externalFee: 0, isPayable: false },
  { id: 8, name: "Owlto Check In", logo: "/owlto.png", target: "0xF40448F38d99A2Db70de37416B22B4338A1c2Ad7", selector: "0xf516f88e", functionName: "checkIn", points: 1, color: "#e9b60e", hasReferral: false, externalFee: 55000000000000, isPayable: true },
  { id: 9, name: "NekoKat GMeow", logo: "/neko.png", target: "0xfF3aC835a193Cc08543256e24508b42248A63A26", selector: "0x95b2fd73", functionName: "signGMeow", points: 1, color: "#ecf0b4", hasReferral: false, externalFee: 0, isPayable: false },
  { id: 10, name: "SurfLayer GM", logo: "/surf.png", target: "0x3d97B802fFD7F36d50CE1498e8Ca5318C5c8e9EC", selector: "0x498c249a", functionName: "dailyGM", points: 1, color: "#22c23d", hasReferral: false, externalFee: 40000000000000, isPayable: true },
  { id: 11, name: "WheelX GM", logo: "/wheels.png", target: "0x62f79aab09B60A27cd3607aCaE55281Efd7294Bb", selector: "0xc0129d43", functionName: "gm", points: 1, color: "#8413c5", hasReferral: false, externalFee: 20000000000000, isPayable: true },
];

// ================= ABI-uri pentru contractele partenere =================
const dodABI = [{ inputs: [], name: "checkIn", outputs: [], stateMutability: "nonpayable", type: "function" }] as const;
const axdABI = [{ inputs: [], name: "claim", outputs: [], stateMutability: "nonpayable", type: "function" }] as const;
const rubyscoreABI = [{ inputs: [], name: "vote", outputs: [], stateMutability: "payable", type: "function" }] as const;
const lootcoinABI = [{ inputs: [{ internalType: "address", name: "referrer", type: "address" }], name: "checkIn", outputs: [], stateMutability: "nonpayable", type: "function" }] as const;
const presaABI = [{ inputs: [], name: "checkIn", outputs: [], stateMutability: "nonpayable", type: "function" }] as const;
const onchainGMABI = [{ inputs: [{ internalType: "address", name: "referrer", type: "address" }], name: "onChainGM", outputs: [], stateMutability: "payable", type: "function" }] as const;
const owltoABI = [{ inputs: [{ internalType: "uint256", name: "date", type: "uint256" }, { internalType: "uint256", name: "timestamp", type: "uint256" }], name: "checkIn", outputs: [],stateMutability: "payable", type: "function"}] as const;
const captainABI = [{ inputs: [], name: "checkIn", outputs: [], stateMutability: "nonpayable", type: "function" }] as const;
const arkadaABI = [{ inputs: [], name: "check", outputs: [], stateMutability: "nonpayable", type: "function" }] as const;
const nekoABI = [{inputs:[{internalType:"string",name:"message",type:"string"},{internalType:"uint256",name:"dayNumber",type:"uint256"},{internalType:"uint256",name:"currentStreak",type:"uint256"}],name:"signGMeow",outputs:[],stateMutability:"nonpayable",type:"function"}] as const;
const surfABI = [{ inputs: [], name: "dailyGM", outputs: [], stateMutability: "payable", type: "function" }] as const;
const wheelABI = [{ inputs: [], name: "gm", outputs: [], stateMutability: "payable", type: "function" }] as const;

// ================= ANIMATIONS =================
const float = keyframes`
  0% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-25px) rotate(3deg); }
  100% { transform: translateY(0px) rotate(0deg); }
`;

const floatSlow = keyframes`
  0% { transform: translateY(0px) translateX(0px); }
  33% { transform: translateY(-20px) translateX(15px); }
  66% { transform: translateY(15px) translateX(-15px); }
  100% { transform: translateY(0px) translateX(0px); }
`;

const pulseGlow = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.7); opacity: 0.9; }
  70% { box-shadow: 0 0 0 30px rgba(139, 92, 246, 0); opacity: 1; }
  100% { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0); opacity: 0.9; }
`;

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const slideUp = keyframes`
  from { opacity: 0; transform: translateY(40px); filter: blur(8px); }
  to { opacity: 1; transform: translateY(0); filter: blur(0); }
`;

const slideInLeft = keyframes`
  from { opacity: 0; transform: translateX(-40px); filter: blur(8px); }
  to { opacity: 1; transform: translateX(0); filter: blur(0); }
`;

const slideInRight = keyframes`
  from { opacity: 0; transform: translateX(40px); filter: blur(8px); }
  to { opacity: 1; transform: translateX(0); filter: blur(0); }
`;

// Helper functions
const truncateAddress = (address: string) => {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const formatNumber = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

const formatFee = (fee: bigint) => {
  if (fee === 0n) return "0";
  return (Number(fee) / 1e18).toFixed(6);
};

const toHexAddress = (addr: string): `0x${string}` => addr as `0x${string}`;

// Get user rank badge
const getUserBadge = (score: number) => {
  if (score >= 1000) return { label: "LEGEND", icon: "👑", color: "#ffd700", glow: "#ffd70080", bg: "linear(135deg, #ffd70020, #ffd70005)" };
  if (score >= 500) return { label: "ELITE", icon: "⚡", color: "#c0c0c0", glow: "#c0c0c080", bg: "linear(135deg, #c0c0c020, #c0c0c005)" };
  if (score >= 250) return { label: "ACTIVE", icon: "🔥", color: "#ff6b35", glow: "#ff6b3580", bg: "linear(135deg, #ff6b3520, #ff6b3505)" };
  if (score >= 100) return { label: "RISING", icon: "⭐", color: "#c084fc", glow: "#c084fc80", bg: "linear(135deg, #c084fc20, #c084fc05)" };
  if (score >= 50) return { label: "BEGINNER", icon: "🌿", color: "#4ade80", glow: "#4ade8080", bg: "linear(135deg, #4ade8020, #4ade8005)" };
  return { label: "NEW", icon: "✨", color: "#9ca3af", glow: "#9ca3af80", bg: "linear(135deg, #9ca3af20, #9ca3af05)" };
};

// Campaign ABI
const campaignABI = [
  { inputs: [], name: "campaignStartTime", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "campaignActive", outputs: [{ internalType: "bool", name: "", type: "bool" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "campaignScheduled", outputs: [{ internalType: "bool", name: "", type: "bool" }], stateMutability: "view", type: "function" },
] as const;

// AgentGateway ABI
const agentGatewayABI = [
  { inputs: [{ internalType: "uint256", name: "actionId", type: "uint256" }], name: "payAndApprove", outputs: [], stateMutability: "payable", type: "function" },
  { inputs: [], name: "defaultFee", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ internalType: "address", name: "", type: "address" }, { internalType: "uint256", name: "", type: "uint256" }], name: "userActionCount", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ internalType: "address", name: "user", type: "address" }, { internalType: "uint256", name: "actionId", type: "uint256" }], name: "hasPaidForAction", outputs: [{ internalType: "bool", name: "", type: "bool" }], stateMutability: "view", type: "function" },
] as const;

// Agent ABI
const agentABI = [{ inputs: [{ internalType: "address", name: "wallet", type: "address" }], name: "isAgent", outputs: [{ internalType: "bool", name: "", type: "bool" }], stateMutability: "view", type: "function" }] as const;

// AgentGM ABI
const agentGMABI = [{ inputs: [{ internalType: "address", name: "user", type: "address" }], name: "totalUserGM", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" }] as const;

// Badge ABI
const badgeABI = [
  { inputs: [], name: "minReputationScore", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ internalType: "address", name: "user", type: "address" }], name: "balanceOf", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ internalType: "uint256", name: "score", type: "uint256" }, { internalType: "bytes", name: "signature", type: "bytes" }], name: "mint", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ internalType: "address", name: "user", type: "address" }], name: "getNonce", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
] as const;

export default function ActivityReputation() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const toast = useToast();
  const { colorMode } = useColorMode();

  // === LI.FI WIDGET STATE ===
  const [isWidgetReady, setIsWidgetReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsWidgetReady(true), 400);
    return () => clearTimeout(timer);
  }, []);

  // UI State
  const [isTxPending, setIsTxPending] = useState(false);
  const [searchAddress, setSearchAddress] = useState("");
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(true);
  
  // ================= RESETARE PLATĂ - FLAG PENTRU FIECARE ACȚIUNE =================
  // Acest flag permite resetarea după fiecare execuție
  const [actionPendingPayment, setActionPendingPayment] = useState<{ [key: number]: boolean }>({});

  // Success Modal State
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<typeof PARTNER_ACTIONS[0] | null>(null);

  // Campaign State
  const [campaignStartTime, setCampaignStartTime] = useState<number>(0);
  const [campaignActive, setCampaignActive] = useState<boolean>(false);
  const [campaignScheduled, setCampaignScheduled] = useState<boolean>(false);
  const [timeRemaining, setTimeRemaining] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);

  // Transaction Modal State
  const [txOpen, setTxOpen] = useState(false);
  const [txStatus, setTxStatus] = useState<"idle" | "wallet" | "pending" | "success" | "rejected" | "failed">("idle");
  const [txTitle, setTxTitle] = useState("");
  const [txDesc, setTxDesc] = useState("");

  const isCorrectChain = chainId === SONEIUM_CHAIN_ID;

  // ================= READ CAMPAIGN INFO =================
  const { data: campaignStartTimeData = 0n } = useReadContract({
    address: toHexAddress(GM_CONTRACT),
    abi: campaignABI,
    functionName: "campaignStartTime",
    query: { enabled: true },
  });

  const { data: campaignActiveData = false } = useReadContract({
    address: toHexAddress(GM_CONTRACT),
    abi: campaignABI,
    functionName: "campaignActive",
    query: { enabled: true },
  });

  const { data: campaignScheduledData = false } = useReadContract({
    address: toHexAddress(GM_CONTRACT),
    abi: campaignABI,
    functionName: "campaignScheduled",
    query: { enabled: true },
  });

  useEffect(() => {
    if (campaignStartTimeData) setCampaignStartTime(Number(campaignStartTimeData));
    setCampaignActive(campaignActiveData);
    setCampaignScheduled(campaignScheduledData);
  }, [campaignStartTimeData, campaignActiveData, campaignScheduledData]);

  // ================= READ DEFAULT FEE =================
  const { data: defaultFee = 0n } = useReadContract({
    address: toHexAddress(AGENT_GATEWAY_CONTRACT),
    abi: agentGatewayABI,
    functionName: "defaultFee",
    query: { enabled: true },
  });

  // ================= READ PARTNER ACTION COUNTS =================
  const { data: userAction0Count = 0n, refetch: refetchAction0 } = useReadContract({
    address: toHexAddress(AGENT_GATEWAY_CONTRACT),
    abi: agentGatewayABI,
    functionName: "userActionCount",
    args: address ? [address, 0n] : undefined,
    query: { enabled: !!address && isConnected && isCorrectChain },
  });
  const { data: userAction1Count = 0n, refetch: refetchAction1 } = useReadContract({
    address: toHexAddress(AGENT_GATEWAY_CONTRACT),
    abi: agentGatewayABI,
    functionName: "userActionCount",
    args: address ? [address, 1n] : undefined,
    query: { enabled: !!address && isConnected && isCorrectChain },
  });
  const { data: userAction2Count = 0n, refetch: refetchAction2 } = useReadContract({
    address: toHexAddress(AGENT_GATEWAY_CONTRACT),
    abi: agentGatewayABI,
    functionName: "userActionCount",
    args: address ? [address, 2n] : undefined,
    query: { enabled: !!address && isConnected && isCorrectChain },
  });
  const { data: userAction3Count = 0n, refetch: refetchAction3 } = useReadContract({
    address: toHexAddress(AGENT_GATEWAY_CONTRACT),
    abi: agentGatewayABI,
    functionName: "userActionCount",
    args: address ? [address, 3n] : undefined,
    query: { enabled: !!address && isConnected && isCorrectChain },
  });
  const { data: userAction4Count = 0n, refetch: refetchAction4 } = useReadContract({
    address: toHexAddress(AGENT_GATEWAY_CONTRACT),
    abi: agentGatewayABI,
    functionName: "userActionCount",
    args: address ? [address, 4n] : undefined,
    query: { enabled: !!address && isConnected && isCorrectChain },
  });
  const { data: userAction5Count = 0n, refetch: refetchAction5 } = useReadContract({
    address: toHexAddress(AGENT_GATEWAY_CONTRACT),
    abi: agentGatewayABI,
    functionName: "userActionCount",
    args: address ? [address, 5n] : undefined,
    query: { enabled: !!address && isConnected && isCorrectChain },
  });
  const { data: userAction6Count = 0n, refetch: refetchAction6 } = useReadContract({
    address: toHexAddress(AGENT_GATEWAY_CONTRACT),
    abi: agentGatewayABI,
    functionName: "userActionCount",
    args: address ? [address, 6n] : undefined,
    query: { enabled: !!address && isConnected && isCorrectChain },
  });
  const { data: userAction7Count = 0n, refetch: refetchAction7 } = useReadContract({
    address: toHexAddress(AGENT_GATEWAY_CONTRACT),
    abi: agentGatewayABI,
    functionName: "userActionCount",
    args: address ? [address, 7n] : undefined,
    query: { enabled: !!address && isConnected && isCorrectChain },
  });
  const { data: userAction8Count = 0n, refetch: refetchAction8 } = useReadContract({
    address: toHexAddress(AGENT_GATEWAY_CONTRACT),
    abi: agentGatewayABI,
    functionName: "userActionCount",
    args: address ? [address, 8n] : undefined,
    query: { enabled: !!address && isConnected && isCorrectChain },
  });
  const { data: userAction9Count = 0n, refetch: refetchAction9 } = useReadContract({
    address: toHexAddress(AGENT_GATEWAY_CONTRACT),
    abi: agentGatewayABI,
    functionName: "userActionCount",
    args: address ? [address, 9n] : undefined,
    query: { enabled: !!address && isConnected && isCorrectChain },
  });
  const { data: userAction10Count = 0n, refetch: refetchAction10 } = useReadContract({
    address: toHexAddress(AGENT_GATEWAY_CONTRACT),
    abi: agentGatewayABI,
    functionName: "userActionCount",
    args: address ? [address, 10n] : undefined,
    query: { enabled: !!address && isConnected && isCorrectChain },
  });
  const { data: userAction11Count = 0n, refetch: refetchAction11 } = useReadContract({
    address: toHexAddress(AGENT_GATEWAY_CONTRACT),
    abi: agentGatewayABI,
    functionName: "userActionCount",
    args: address ? [address, 11n] : undefined,
    query: { enabled: !!address && isConnected && isCorrectChain },
  });

  const userPartnerTotal = Number(userAction0Count) + Number(userAction1Count) + Number(userAction2Count) + Number(userAction3Count) + Number(userAction4Count) + Number(userAction5Count) + Number(userAction6Count) + Number(userAction7Count) + Number(userAction8Count) + Number(userAction9Count) + Number(userAction10Count) + Number(userAction11Count);

  // ================= COUNTDOWN TIMER =================
  useEffect(() => {
    if (campaignStartTime > 0) {
      const updateTimer = () => {
        const now = Math.floor(Date.now() / 1000);
        const diff = campaignStartTime - now;
        if (diff <= 0) { setTimeRemaining(null); return; }
        const days = Math.floor(diff / 86400);
        const hours = Math.floor((diff % 86400) / 3600);
        const minutes = Math.floor((diff % 3600) / 60);
        const seconds = diff % 60;
        setTimeRemaining({ days, hours, minutes, seconds });
      };
      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    } else {
      setTimeRemaining(null);
    }
  }, [campaignStartTime]);

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

  // Searched User Data
  const { data: searchedUserGmCount = 0n } = useReadContract({
    address: toHexAddress(GM_CONTRACT),
    abi: gmABI,
    functionName: "balanceOf",
    args: searchAddress && searchAddress.length === 42 ? [toHexAddress(searchAddress)] : undefined,
    query: { enabled: !!searchAddress && searchAddress.length === 42 && isCorrectChain },
  });
  const { data: searchedUserVoteCount = 0n } = useReadContract({
    address: toHexAddress(VOTE_CONTRACT),
    abi: VoteABI,
    functionName: "getUserVotes",
    args: searchAddress && searchAddress.length === 42 ? [toHexAddress(searchAddress)] : undefined,
    query: { enabled: !!searchAddress && searchAddress.length === 42 && isCorrectChain },
  });
  const { data: searchedUserCheckInCount = 0n } = useReadContract({
    address: toHexAddress(CHECKIN_CONTRACT),
    abi: checkInABI,
    functionName: "getUserCheckIns",
    args: searchAddress && searchAddress.length === 42 ? [toHexAddress(searchAddress)] : undefined,
    query: { enabled: !!searchAddress && searchAddress.length === 42 && isCorrectChain },
  });
  const { data: searchedUserDeployCount = 0n } = useReadContract({
    address: toHexAddress(DEPLOY_CONTRACT),
    abi: DeployABI,
    functionName: "getUserDeploymentCount",
    args: searchAddress && searchAddress.length === 42 ? [toHexAddress(searchAddress)] : undefined,
    query: { enabled: !!searchAddress && searchAddress.length === 42 && isCorrectChain },
  });
  const { data: searchedUserIsSBT = false } = useReadContract({
    address: toHexAddress(CHECKIN_CONTRACT),
    abi: checkInABI,
    functionName: "isSBTTokenHolder",
    args: searchAddress && searchAddress.length === 42 ? [toHexAddress(searchAddress)] : undefined,
    query: { enabled: !!searchAddress && searchAddress.length === 42 && isCorrectChain },
  });
  const { data: searchedUserIsAgent = false } = useReadContract({
    address: toHexAddress(AGENT_CONTRACT),
    abi: agentABI,
    functionName: "isAgent",
    args: searchAddress && searchAddress.length === 42 ? [toHexAddress(searchAddress)] : undefined,
    query: { enabled: !!searchAddress && searchAddress.length === 42 && isCorrectChain },
  });
  const { data: searchedUserAgentGmCount = 0n } = useReadContract({
    address: toHexAddress(AGENT_GM_CONTRACT),
    abi: agentGMABI,
    functionName: "totalUserGM",
    args: searchAddress && searchAddress.length === 42 ? [toHexAddress(searchAddress)] : undefined,
    query: { enabled: !!searchAddress && searchAddress.length === 42 && isCorrectChain },
  });
  const { data: searchedUserAction0Count = 0n } = useReadContract({
    address: toHexAddress(AGENT_GATEWAY_CONTRACT),
    abi: agentGatewayABI,
    functionName: "userActionCount",
    args: searchAddress && searchAddress.length === 42 ? [toHexAddress(searchAddress), 0n] : undefined,
    query: { enabled: !!searchAddress && searchAddress.length === 42 && isCorrectChain },
  });
  const { data: searchedUserAction1Count = 0n } = useReadContract({
    address: toHexAddress(AGENT_GATEWAY_CONTRACT),
    abi: agentGatewayABI,
    functionName: "userActionCount",
    args: searchAddress && searchAddress.length === 42 ? [toHexAddress(searchAddress), 1n] : undefined,
    query: { enabled: !!searchAddress && searchAddress.length === 42 && isCorrectChain },
  });
  const { data: searchedUserAction2Count = 0n } = useReadContract({
    address: toHexAddress(AGENT_GATEWAY_CONTRACT),
    abi: agentGatewayABI,
    functionName: "userActionCount",
    args: searchAddress && searchAddress.length === 42 ? [toHexAddress(searchAddress), 2n] : undefined,
    query: { enabled: !!searchAddress && searchAddress.length === 42 && isCorrectChain },
  });
  const { data: searchedUserAction3Count = 0n } = useReadContract({
    address: toHexAddress(AGENT_GATEWAY_CONTRACT),
    abi: agentGatewayABI,
    functionName: "userActionCount",
    args: searchAddress && searchAddress.length === 42 ? [toHexAddress(searchAddress), 3n] : undefined,
    query: { enabled: !!searchAddress && searchAddress.length === 42 && isCorrectChain },
  });
  const { data: searchedUserAction4Count = 0n } = useReadContract({
    address: toHexAddress(AGENT_GATEWAY_CONTRACT),
    abi: agentGatewayABI,
    functionName: "userActionCount",
    args: searchAddress && searchAddress.length === 42 ? [toHexAddress(searchAddress), 4n] : undefined,
    query: { enabled: !!searchAddress && searchAddress.length === 42 && isCorrectChain },
  });
  const { data: searchedUserAction5Count = 0n } = useReadContract({
    address: toHexAddress(AGENT_GATEWAY_CONTRACT),
    abi: agentGatewayABI,
    functionName: "userActionCount",
    args: searchAddress && searchAddress.length === 42 ? [toHexAddress(searchAddress), 5n] : undefined,
    query: { enabled: !!searchAddress && searchAddress.length === 42 && isCorrectChain },
  });

  const searchedUserPartnerTotal = Number(searchedUserAction0Count) + Number(searchedUserAction1Count) + Number(searchedUserAction2Count) + Number(searchedUserAction3Count) + Number(searchedUserAction4Count) + Number(searchedUserAction5Count);

  const userTotalScore = Number(userGmCount) + Number(userVoteCount) + Number(userCheckInCount) + Number(userDeployCount) + Number(userAgentGmCount) + userPartnerTotal;
  const searchedUserTotalScore = Number(searchedUserGmCount) + Number(searchedUserVoteCount) + Number(searchedUserCheckInCount) + Number(searchedUserDeployCount) + Number(searchedUserAgentGmCount) + searchedUserPartnerTotal;
  const userBadge = getUserBadge(userTotalScore);
  const searchedUserBadge = getUserBadge(searchedUserTotalScore);

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
      setTxDesc("Confirm mint on Soneium...");
      const hash = await writeContractAsync({
        address: toHexAddress(BADGE_CONTRACT),
        abi: badgeABI,
        functionName: "mint",
        args: [BigInt(score), data.signature],
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
  
  // Pasul 1: Plătește fee-ul în AgentGateway
  const handlePayAndApprove = async (action: typeof PARTNER_ACTIONS[0]) => {
    if (isTxPending) return;
    if (!isCorrectChain) { switchChain?.({ chainId: SONEIUM_CHAIN_ID }); return; }
    
    setIsTxPending(true);
    setTxOpen(true);
    setTxStatus("wallet");
    setTxTitle(`⚡ Pay Fee: ${action.name}`);
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
        
        // Reîncarcă contoarele
        await Promise.all([
          refetchAction0(),
          refetchAction1(),
          refetchAction2(),
          refetchAction3(),
          refetchAction4(),
          refetchAction5(),
          refetchAction6(),
          refetchAction7(),
          refetchAction8(),
          refetchAction9(),
          refetchAction10(),
          refetchAction11(),
        ]);
        
        // ===== CHEIA: SETEAZĂ FLAG-UL CĂ A PLĂTIT =====
        setActionPendingPayment(prev => ({ ...prev, [action.id]: true }));
        
        setTxOpen(false);
        setShowSuccessModal(true);
        setPendingAction(action);
        
        toast({ 
          title: `✅ Payment Successful!`, 
          description: `Click "${action.name.split(" ")[0]}" to complete the action and earn points.`, 
          status: "success", 
          duration: 5000, 
          isClosable: true, 
          position: "top-right" 
        });
      } else throw new Error("Transaction reverted on chain");
    } catch (err: any) {
      const rejected = err?.message?.includes("rejected") || err?.code === 4001;
      setTxStatus(rejected ? "rejected" : "failed");
      setTxTitle(rejected ? "Transaction Cancelled" : "Transaction Failed");
      setTxDesc(rejected ? "You cancelled the transaction." : err?.message || "Something went wrong.");
    } finally { setIsTxPending(false); }
  };

  // Pasul 2: Execută acțiunea direct pe contractul partener
  const handleExecutePartnerAction = async (action: typeof PARTNER_ACTIONS[0]) => {
    if (isTxPending) return;
    if (!isCorrectChain) { switchChain?.({ chainId: SONEIUM_CHAIN_ID }); return; }
    
    setIsTxPending(true);
    setTxOpen(true);
    setTxStatus("wallet");
    setTxTitle(`⚡ Execute ${action.name}`);
    setTxDesc(`Confirm ${action.name} transaction on Soneium...`);

    try {
      let hash;
      const zeroAddress = "0x0000000000000000000000000000000000000000";
      
      switch(action.id) {
        case 0:
          hash = await writeContractAsync({ address: toHexAddress(action.target), abi: dodABI, functionName: "checkIn" });
          break;
        case 1:
          hash = await writeContractAsync({ address: toHexAddress(action.target), abi: axdABI, functionName: "claim" });
          break;
        case 2:
          hash = await writeContractAsync({ address: toHexAddress(action.target), abi: rubyscoreABI, functionName: "vote", value: BigInt(action.externalFee) });
          break;
        case 3:
          hash = await writeContractAsync({ address: toHexAddress(action.target), abi: lootcoinABI, functionName: "checkIn", args: [zeroAddress] });
          break;
        case 4:
          hash = await writeContractAsync({ address: toHexAddress(action.target), abi: presaABI, functionName: "checkIn" });
          break;
        case 5:
          hash = await writeContractAsync({ address: toHexAddress(action.target), abi: onchainGMABI, functionName: "onChainGM", args: [zeroAddress], value: BigInt(action.externalFee) });
          break;
        case 6:
          hash = await writeContractAsync({ address: toHexAddress(action.target), abi: captainABI, functionName: "checkIn" });
          break;
        case 7:
          hash = await writeContractAsync({ address: toHexAddress(action.target), abi: arkadaABI, functionName: "check" });
          break;
        case 8:
          const todayDate = new Date();
          const currentDate = BigInt(parseInt(todayDate.getFullYear().toString() + (todayDate.getMonth() + 1).toString().padStart(2, '0') + todayDate.getDate().toString().padStart(2, '0')));
          const owltoFee = BigInt(action.externalFee);
          hash = await writeContractAsync({ address: toHexAddress(action.target), abi: owltoABI, functionName: "checkIn", args: [currentDate, owltoFee], value: owltoFee });
          break;
        case 9:
          const startDate = new Date(2026, 4, 1);
          const dayNum = BigInt(Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
          const streak = BigInt(1);
          hash = await writeContractAsync({ address: toHexAddress(action.target), abi: nekoABI, functionName: "signGMeow", args: ["GMeow", dayNum, streak] });
          break;
          case 10:
          hash = await writeContractAsync({ address: toHexAddress(action.target), abi: surfABI, functionName: "dailyGM", value: BigInt(action.externalFee) });
          break;
          case 11:
          hash = await writeContractAsync({ address: toHexAddress(action.target), abi: wheelABI, functionName: "gm", value: BigInt(action.externalFee) });
          break;
        default: throw new Error("Unknown action");
      }
      
      setTxStatus("pending");
      setTxTitle("Transaction Sent");
      setTxDesc("Waiting for confirmation...");
      
      const receipt = await publicClient!.waitForTransactionReceipt({ hash });
      
      if (receipt.status === "success") {
        setTxStatus("success");
        setTxTitle(`✅ ${action.name} Completed!`);
        setTxDesc(`You earned +${action.points} reputation point!`);
        confetti({ particleCount: 200, spread: 80, origin: { y: 0.6 } });
        
        // Reîncarcă toate datele
        await Promise.all([
          refetchUserGmCount(),
          refetchUserVoteCount(),
          refetchUserCheckInCount(),
          refetchUserDeployCount(),
          refetchAgentGmCount(),
          refetchAction0(),
          refetchAction1(),
          refetchAction2(),
          refetchAction3(),
          refetchAction4(),
          refetchAction5(),
          refetchAction6(),
          refetchAction7(),
          refetchAction8(),
          refetchAction9(),
          refetchAction10(),
          refetchAction11(),
        ]);
        
        // ===== CHEIA: RESETEAZĂ FLAG-UL PENTRU CA UTILIZATORUL SĂ PLĂTEASCĂ DIN NOU =====
        setActionPendingPayment(prev => ({ ...prev, [action.id]: false }));
        
        setShowSuccessModal(false);
        setPendingAction(null);
        
        toast({ 
          title: `🎉 +${action.points} Point!`, 
          description: `${action.name} completed! Pay fee again to earn more points.`, 
          status: "success", 
          duration: 5000, 
          isClosable: true, 
          position: "top-right" 
        });
      } else throw new Error("Transaction reverted on chain");
    } catch (err: any) {
      const rejected = err?.message?.includes("rejected") || err?.code === 4001;
      setTxStatus(rejected ? "rejected" : "failed");
      setTxTitle(rejected ? "Transaction Cancelled" : "Transaction Failed");
      setTxDesc(rejected ? "You cancelled the transaction." : err?.message || "Something went wrong.");
    } finally { 
      setIsTxPending(false);
    }
  };

  // ================= LEADERBOARD =================
  useEffect(() => {
    const fetchLeaderboard = async () => {
      if (!publicClient || !isCorrectChain) return;
      setIsLoadingLeaderboard(true);
      try {
        const currentBlock = await publicClient.getBlockNumber();
        const fromBlock = currentBlock > BigInt(10000) ? currentBlock - BigInt(10000) : BigInt(0);
        const gmEvents = await publicClient.getLogs({
          address: toHexAddress(GM_CONTRACT),
          event: { type: 'event', name: 'Transfer', inputs: [{ type: 'address', indexed: true, name: 'from' }, { type: 'address', indexed: true, name: 'to' }, { type: 'uint256', indexed: true, name: 'tokenId' }] },
          fromBlock: fromBlock,
          toBlock: 'latest',
        });
        const usersMap = new Map<string, any>();
        const uniqueAddresses = new Set<string>();
        for (const log of gmEvents.slice(-50)) {
          const userAddress = (log as any).args?.to;
          if (userAddress && userAddress !== '0x0000000000000000000000000000000000000000') uniqueAddresses.add(userAddress);
        }
        const userPromises = Array.from(uniqueAddresses).slice(0, 30).map(async (userAddress) => {
          try {
            const [gmCount, voteCount, checkInCount, deployCount, agentGmCount, action0, action1, action2, action3, action4, action5] = await Promise.all([
              publicClient.readContract({ address: toHexAddress(GM_CONTRACT as `0x${string}`), abi: gmABI, functionName: 'balanceOf', args: [userAddress as `0x${string}`] }),
              publicClient.readContract({ address: toHexAddress(VOTE_CONTRACT as `0x${string}`), abi: VoteABI, functionName: 'getUserVotes', args: [userAddress as `0x${string}`] }),
              publicClient.readContract({ address: toHexAddress(CHECKIN_CONTRACT as `0x${string}`), abi: checkInABI, functionName: 'getUserCheckIns', args: [userAddress as `0x${string}`] }),
              publicClient.readContract({ address: toHexAddress(DEPLOY_CONTRACT as `0x${string}`), abi: DeployABI, functionName: 'getUserDeploymentCount', args: [userAddress as `0x${string}`] }),
              publicClient.readContract({ address: toHexAddress(AGENT_GM_CONTRACT as `0x${string}`), abi: agentGMABI, functionName: 'totalUserGM', args: [userAddress as `0x${string}`] }),
              publicClient.readContract({ address: toHexAddress(AGENT_GATEWAY_CONTRACT as `0x${string}`), abi: agentGatewayABI, functionName: 'userActionCount', args: [userAddress as `0x${string}`, 0n] }),
              publicClient.readContract({ address: toHexAddress(AGENT_GATEWAY_CONTRACT as `0x${string}`), abi: agentGatewayABI, functionName: 'userActionCount', args: [userAddress as `0x${string}`, 1n] }),
              publicClient.readContract({ address: toHexAddress(AGENT_GATEWAY_CONTRACT as `0x${string}`), abi: agentGatewayABI, functionName: 'userActionCount', args: [userAddress as `0x${string}`, 2n] }),
              publicClient.readContract({ address: toHexAddress(AGENT_GATEWAY_CONTRACT as `0x${string}`), abi: agentGatewayABI, functionName: 'userActionCount', args: [userAddress as `0x${string}`, 3n] }),
              publicClient.readContract({ address: toHexAddress(AGENT_GATEWAY_CONTRACT as `0x${string}`), abi: agentGatewayABI, functionName: 'userActionCount', args: [userAddress as `0x${string}`, 4n] }),
              publicClient.readContract({ address: toHexAddress(AGENT_GATEWAY_CONTRACT as `0x${string}`), abi: agentGatewayABI, functionName: 'userActionCount', args: [userAddress as `0x${string}`, 5n] }),
            ]);
            const partnerTotal = Number(action0) + Number(action1) + Number(action2) + Number(action3) + Number(action4) + Number(action5);
            const totalScore = Number(gmCount) + Number(voteCount) + Number(checkInCount) + Number(deployCount) + Number(agentGmCount) + partnerTotal;
            return { address: userAddress, gmCount: Number(gmCount), voteCount: Number(voteCount), checkInCount: Number(checkInCount), deployCount: Number(deployCount), agentGmCount: Number(agentGmCount), partnerTotal, totalScore };
          } catch { return null; }
        });
        const results = await Promise.all(userPromises);
        for (const result of results) { if (result && result.totalScore > 0) usersMap.set(result.address, result); }
        const usersArray = Array.from(usersMap.values());
        usersArray.sort((a, b) => b.totalScore - a.totalScore);
        setLeaderboardData(usersArray.slice(0, 20));
      } catch (err) { console.error("Error fetching leaderboard:", err); } finally { setIsLoadingLeaderboard(false); }
    };
    if (publicClient && isCorrectChain) fetchLeaderboard();
  }, [publicClient, isCorrectChain]);

  // ================= QUICK ACTIONS HANDLER =================
  const handleAction = async (type: "gm" | "vote" | "checkIn" | "deploy") => {
    if (isTxPending) return;
    if (!isCorrectChain) { switchChain?.({ chainId: SONEIUM_CHAIN_ID }); return; }
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
        await Promise.all([refetchUserGmCount(), refetchUserVoteCount(), refetchUserCheckInCount(), refetchUserDeployCount(), refetchAgentGmCount(), refetchAction0(), refetchAction1(), refetchAction2(), refetchAction3(), refetchAction4(), refetchAction5(), refetchAction6(), refetchAction7(), refetchAction8(), refetchAction9(), refetchAction10(), refetchAction11()]);
        toast({ title: successTitle, description: successDesc, status: "success", duration: 5000, isClosable: true, position: "top-right" });
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
    } finally { setIsTxPending(false); }
  };

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
    <Box minH="100vh" position="relative" bg="#020208" overflowX="hidden">
      {/* Animated Background Orbs */}
      <Box position="fixed" top="5%" left="-5%" w="600px" h="600px" borderRadius="full" bg="radial-gradient(circle, rgba(139,92,246,0.3) 0%, rgba(139,92,246,0) 70%)" filter="blur(100px)" animation={`${floatSlow} 25s ease-in-out infinite`} zIndex={0} pointerEvents="none" />
      <Box position="fixed" bottom="0%" right="-5%" w="700px" h="700px" borderRadius="full" bg="radial-gradient(circle, rgba(236,72,153,0.25) 0%, rgba(236,72,153,0) 70%)" filter="blur(120px)" animation={`${float} 30s ease-in-out infinite`} zIndex={0} pointerEvents="none" />
      <Box position="fixed" top="40%" left="30%" w="400px" h="400px" borderRadius="full" bg="radial-gradient(circle, rgba(59,130,246,0.2) 0%, rgba(59,130,246,0) 70%)" filter="blur(80px)" animation={`${floatSlow} 20s ease-in-out infinite reverse`} zIndex={0} pointerEvents="none" />
      <Box position="fixed" top="50%" left="70%" w="300px" h="300px" borderRadius="full" bg="radial-gradient(circle, rgba(34,197,94,0.15) 0%, rgba(34,197,94,0) 70%)" filter="blur(70px)" animation={`${float} 18s ease-in-out infinite`} zIndex={0} pointerEvents="none" />
      
      {/* Grid overlay */}
      <Box position="fixed" top={0} left={0} right={0} bottom={0} opacity={0.03} pointerEvents="none" zIndex={0} bgImage="url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MCIgaGVpZ2h0PSI4MCI+PHBhdGggZD0iTTQwIDQwIG0tMzAgMCBhIDMwIDMwIDAgMSAwIDYwIDAgYSAzMCAzMCAwIDEgMC02MCAwIiBzdHJva2U9IiM4YjVjZjYiIGZpbGw9Im5vbmUiIG9wYWNpdHk9IjAuMSIvPjwvc3ZnPg==')" bgRepeat="repeat" backgroundSize="60px" />

      <Container maxW="1400px" position="relative" zIndex={1} px={{ base: 4, md: 6, lg: 8 }} py={{ base: 6, md: 8 }}>
        {/* Header */}
        <Flex justify="space-between" align="center" mb={8} direction={{ base: "column", md: "row" }} gap={4}>
          <HStack spacing={4} animation={`${slideInLeft} 0.6s ease-out`}>
            <IconButton aria-label="Go back" icon={<ChevronLeftIcon boxSize={6} />} variant="solid" bg="rgba(139,92,246,0.2)" color="white" size="lg" onClick={() => window.history.back()} _hover={{ bg: "rgba(139,92,246,0.4)", transform: "scale(1.05)", boxShadow: "0 0 20px rgba(139,92,246,0.4)" }} transition="all 0.2s" borderRadius="full" border="1px solid rgba(139,92,246,0.5)" />
            <VStack align="start" spacing={1}>
              <HStack spacing={3}>
                <Box w="10px" h="10px" borderRadius="full" bg="#4ade80" animation={`${pulseGlow} 2s ease-in-out infinite`} />
                <Heading fontSize={{ base: "xl", md: "3xl", lg: "4xl" }} fontWeight="800" bgGradient="linear(135deg, #c084fc 0%, #ec4899 40%, #3b82f6 100%)" bgClip="text" letterSpacing="tight">Activity Reputation</Heading>
                <Badge bgGradient="linear(135deg, #8b5cf6, #ec4899)" px={4} py={1.5} rounded="full" fontSize="xs" color="white" boxShadow="0 0 12px rgba(139,92,246,0.6)" fontFamily="mono">✨ Soneium</Badge>
              </HStack>
              <Text color="gray.500" fontSize="sm" letterSpacing="wider" fontFamily="mono">Track your on-chain legacy across GM, Votes, Check-Ins & Deployments</Text>
            </VStack>
          </HStack>
          <Box animation={`${slideInRight} 0.6s ease-out`} _hover={{ transform: "scale(1.02)" }} transition="transform 0.3s">
            <ConnectButton chainStatus="full" accountStatus="full" showBalance={false} />
          </Box>
        </Flex>

        {/* Network Warning */}
        {!isCorrectChain && isConnected && (
          <Alert status="warning" borderRadius="2xl" mb={6} bg="rgba(236,72,153,0.12)" border="1px solid rgba(236,72,153,0.5)" backdropFilter="blur(8px)">
            <AlertIcon color="#fbbf24" />
            <Box flex="1">
              <Text fontWeight="bold" color="#fbbf24" fontFamily="mono">⚠️ Network Mismatch</Text>
              <Text fontSize="sm" color="#d1d5db">Switch to Soneium Mainnet to unlock full functionality</Text>
            </Box>
            <Button size="sm" onClick={() => switchChain?.({ chainId: SONEIUM_CHAIN_ID })} bgGradient="linear(135deg, #8b5cf6, #ec4899)" _hover={{ opacity: 0.9, transform: "scale(1.02)" }} color="white" borderRadius="full" fontSize="xs">Switch Network</Button>
          </Alert>
        )}

        {/* Campaign Status Banner */}
        {isConnected && isCorrectChain && campaignStartTimeData !== undefined && (
          <Alert status="info" borderRadius="xl" mb={6} bg={campaignActive ? "rgba(34,197,94,0.1)" : campaignScheduled ? "rgba(139,92,246,0.1)" : "rgba(156,163,175,0.1)"} border={`1px solid ${campaignActive ? "#22c55e" : campaignScheduled ? "#c084fc" : "#6b7280"}40`} backdropFilter="blur(8px)" py={3}>
            <AlertIcon color={campaignActive ? "#22c55e" : campaignScheduled ? "#c084fc" : "#9ca3af"} />
            <Box flex="1">
              <HStack spacing={4} wrap="wrap" justify="space-between">
                <HStack spacing={3}>
                  <Text fontWeight="bold" color={campaignActive ? "#22c55e" : campaignScheduled ? "#c084fc" : "#9ca3af"} fontFamily="mono">
                    {campaignActive ? "🎯 Campaign Active" : campaignScheduled ? "⏳ Campaign Scheduled" : "⏸️ Campaign Stopped"}
                  </Text>
                  {campaignScheduled && timeRemaining && (timeRemaining.days + timeRemaining.hours + timeRemaining.minutes + timeRemaining.seconds > 0) && (
                    <HStack spacing={2}>
                      <Text fontSize="sm" color="gray.400">Starts in:</Text>
                      <Text fontSize="lg" fontWeight="800" color="#c084fc">{timeRemaining.hours.toString().padStart(2, '0')}</Text><Text fontSize="xs" color="gray.500">h</Text>
                      <Text fontSize="lg" fontWeight="800" color="#c084fc">:</Text>
                      <Text fontSize="lg" fontWeight="800" color="#c084fc">{timeRemaining.minutes.toString().padStart(2, '0')}</Text><Text fontSize="xs" color="gray.500">m</Text>
                      <Text fontSize="lg" fontWeight="800" color="#c084fc">:</Text>
                      <Text fontSize="lg" fontWeight="800" color="#c084fc">{timeRemaining.seconds.toString().padStart(2, '0')}</Text><Text fontSize="xs" color="gray.500">s</Text>
                    </HStack>
                  )}
                  {campaignActive && (<Text fontSize="sm" color="#22c55e">✓ Active now</Text>)}
                </HStack>
                {campaignStartTime > 0 && (campaignActive || campaignScheduled) && (
                  <Text fontSize="xs" color="gray.500">{new Date(campaignStartTime * 1000).toLocaleDateString()} {new Date(campaignStartTime * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                )}
              </HStack>
            </Box>
          </Alert>
        )}

        {/* Global Stats */}
        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={5} mb={10} animation={`${slideUp} 0.5s ease-out`}>
          {[
            { label: "Total GM", value: formatNumber(Math.max(0, totalGMCount)), icon: "🌅", color: "#22c55e", glowColor: "#22c55e" },
            { label: "Total Votes", value: formatNumber(Number(totalVotes)), icon: "🗳️", color: "#8b5cf6", glowColor: "#8b5cf6" },
            { label: "Total Check-Ins", value: formatNumber(Number(totalCheckIns)), icon: "✅", color: "#3b82f6", glowColor: "#3b82f6" },
            { label: "Total Deployments", value: formatNumber(Number(totalDeployments)), icon: "🚀", color: "#ec4899", glowColor: "#ec4899" },
          ].map((stat) => (
            <Box key={stat.label} bg="rgba(8,8,20,0.7)" backdropFilter="blur(12px)" borderRadius="2xl" p={5} border={`1px solid ${stat.color}40`} transition="all 0.4s cubic-bezier(0.2,0.9,0.4,1.1)" _hover={{ transform: "translateY(-8px) scale(1.02)", borderColor: stat.color, boxShadow: `0 0 30px ${stat.glowColor}`, bg: "rgba(8,8,20,0.9)" }}>
              <HStack spacing={4}>
                <Box fontSize="48px" animation={`${float} 4s ease-in-out infinite`}>{stat.icon}</Box>
                <Box>
                  <Text fontSize="xs" color="gray.500" textTransform="uppercase" letterSpacing="wider" fontFamily="mono">{stat.label}</Text>
                  <Text fontSize="2xl" fontWeight="800" color="white" fontFamily="mono" letterSpacing="tight">{stat.value}</Text>
                </Box>
              </HStack>
            </Box>
          ))}
        </SimpleGrid>

        {/* Quick Actions */}
        <Box mb={12} animation={`${slideUp} 0.5s ease-out 0.1s both`}>
          <HStack mb={5} spacing={2}>
            <Box w="6px" h="6px" borderRadius="full" bg="#c084fc" animation={`${pulseGlow} 2s infinite`} />
            <Heading size="md" color="gray.300" fontWeight="600" letterSpacing="tight">✨ Quick Actions</Heading>
          </HStack>
          <SimpleGrid columns={{ base: 1, sm: 2, md: 4 }} spacing={6}>
            {actions.map((action) => (
              <Box key={action.type} position="relative" onClick={() => handleAction(action.type)} cursor="pointer" transition="all 0.4s cubic-bezier(0.2,0.9,0.4,1.1)" _hover={{ transform: "translateY(-10px) scale(1.02)" }}>
                <Box position="absolute" inset={0} bg={`${action.color}20`} filter="blur(24px)" borderRadius="2xl" opacity={0} transition="opacity 0.4s" />
                <Box bg="rgba(10,10,25,0.85)" backdropFilter="blur(20px)" borderRadius="2xl" border={`2px solid ${action.color}40`} p={5} transition="all 0.3s" _hover={{ borderColor: action.color, bg: "rgba(15,15,35,0.95)", boxShadow: `0 0 20px ${action.color}80` }}>
                  <VStack spacing={3}>
                    <Box fontSize="56px" animation={`${float} 4s ease-in-out infinite`}>{action.icon}</Box>
                    <Heading size="sm" color="white" fontWeight="700">{action.label}</Heading>
                    <Text fontSize="xs" color="gray.500" textAlign="center" fontFamily="mono">{action.desc}</Text>
                    <Badge bg={`${action.color}20`} color={action.color} px={3} py={1.5} borderRadius="full" fontSize="xs" border={`1px solid ${action.color}40`}>Fee: {formatFee(action.fee)} ETH</Badge>
                    <Button size="sm" w="full" bgGradient={action.gradient} color="white" isLoading={isTxPending} _hover={{ opacity: 0.9, transform: "scale(1.02)" }} borderRadius="full" fontSize="xs" fontWeight="600">{action.label}</Button>
                  </VStack>
                </Box>
              </Box>
            ))}
          </SimpleGrid>
        </Box>

        {/* Tabs */}
        <Tabs variant="unstyled" defaultIndex={0}>
          <Box position="relative" mb={8}>
            <TabList display="flex" gap={1} bg="rgba(8,8,20,0.6)" backdropFilter="blur(12px)" borderRadius="2xl" p={1.5} border="1px solid rgba(139,92,246,0.2)">
              {[
                { id: "dashboard", label: "📊 Dashboard", shortLabel: "Dashboard" },
                { id: "explorer", label: "🔍 Explorer", shortLabel: "Explorer" },
                { id: "leaderboard", label: "🏆 Leaderboard", shortLabel: "Leaderboard" },
                { id: "bridge", label: "🌉 Bridge", shortLabel: "Bridge" },
                { id: "info", label: "ℹ️ Info", shortLabel: "Info" },
              ].map((tab) => (
                <Tab key={tab.id} flex="1" py={3} px={4} borderRadius="xl" fontWeight="600" fontSize="sm" transition="all 0.2s ease" color="gray.500" _selected={{ color: "white", bg: "rgba(139,92,246,0.2)", borderBottom: "none", boxShadow: "0 0 15px rgba(139,92,246,0.3)" }} _hover={{ color: "#c084fc", bg: "rgba(139,92,246,0.08)" }}>
                  <HStack spacing={2} justify="center">
                    <Text fontSize="lg">{tab.label.split(" ")[0]}</Text>
                    <Text display={{ base: "none", md: "block" }} fontWeight="500">{tab.shortLabel}</Text>
                  </HStack>
                </Tab>
              ))}
            </TabList>
          </Box>

          <TabPanels>
            {/* Dashboard Panel */}
            <TabPanel px={0} pt={2}>
              {!isConnected ? (
                <Box textAlign="center" py={20} bg="rgba(8,8,20,0.6)" borderRadius="3xl" border="1px solid rgba(139,92,246,0.2)">
                  <Text fontSize="64px" mb={4}>🔌</Text>
                  <Text color="gray.500" fontFamily="mono">Connect your wallet to see your stats</Text>
                </Box>
              ) : !isCorrectChain ? (
                <Box textAlign="center" py={20} bg="rgba(8,8,20,0.6)" borderRadius="3xl" border="1px solid rgba(139,92,246,0.2)">
                  <Text fontSize="64px" mb={4}>⚠️</Text>
                  <Text color="gray.500" fontFamily="mono">Switch to Soneium network to see your stats</Text>
                </Box>
              ) : (
                <VStack spacing={8} align="stretch">
                  <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={8}>
                    {/* Profile Card */}
                    <GridItem>
                      <Box position="relative" bg="rgba(8,8,20,0.8)" backdropFilter="blur(24px)" borderRadius="3xl" border="1px solid rgba(139,92,246,0.3)" overflow="hidden" transition="all 0.4s" _hover={{ borderColor: "rgba(139,92,246,0.6)", transform: "translateY(-5px)" }} h="100%">
                        <Box position="absolute" top="-2px" left="-2px" right="-2px" bottom="-2px" bgGradient="linear(90deg, #8b5cf6, #ec4899, #3b82f6, #8b5cf6)" backgroundSize="300% 300%" borderRadius="3xl" opacity={0} transition="opacity 0.4s" pointerEvents="none" />
                        <Box h="4px" bgGradient="linear(90deg, #8b5cf6, #ec4899, #3b82f6, #8b5cf6)" backgroundSize="300% 100%" animation={`${shimmer} 4s ease infinite`} />
                        <Box p={8}>
                          <VStack spacing={4}>
                            <Avatar size="2xl" bgGradient="linear(135deg, #8b5cf6, #ec4899)" icon={<Text fontSize="48px">🕵️</Text>} boxShadow="0 0 30px rgba(139,92,246,0.5)" />
                            <HStack spacing={2} justify="center">
                              <Box w="8px" h="8px" borderRadius="full" bg="#4ade80" boxShadow="0 0 8px #4ade80" animation={`${pulseGlow} 2s ease-in-out infinite`} />
                              <Text fontSize="xs" color="#4ade80" fontFamily="mono" fontWeight="500">Connected</Text>
                            </HStack>
                            <Text fontWeight="700" fontSize="xl" fontFamily="mono" color="white" letterSpacing="tight">{truncateAddress(address || "")}</Text>
                            <HStack spacing={3} wrap="wrap" justify="center">
                              <Badge bg={userBadge.bg} color={userBadge.color} px={5} py={2} borderRadius="full" fontSize="md" fontWeight="700" border={`1px solid ${userBadge.color}`} boxShadow={`0 0 15px ${userBadge.glow}`}>{userBadge.icon} {userBadge.label}</Badge>
                              {userIsAgent ? (
                                <Badge bgGradient="linear(135deg, #c084fc, #ec4899)" color="white" px={5} py={2} borderRadius="full" fontSize="md" fontWeight="700" boxShadow="0 0 20px #c084fc" animation={`${pulseGlow} 2s infinite`}>🧬 REGISTERED AGENT ✓</Badge>
                              ) : (
                                <Button size="sm" variant="outline" bg="rgba(139,92,246,0.1)" borderColor="#c084fc" color="#c084fc" _hover={{ bg: "rgba(139,92,246,0.2)", transform: "scale(1.02)", boxShadow: "0 0 15px #c084fc" }} onClick={() => window.location.href = "/"} borderRadius="full" fontSize="xs" fontWeight="600">Register as Agent</Button>
                              )}
                            </HStack>
                            <Box w="full" mt={2}>
                              <Flex justify="space-between" mb={3}>
                                <Text fontSize="sm" color="gray.500" fontFamily="mono">Reputation Score</Text>
                                <Text fontWeight="800" color="#c084fc" fontSize="lg">{userTotalScore}</Text>
                              </Flex>
                              <Progress value={Math.min(100, (userTotalScore / 1000) * 100)} size="lg" borderRadius="full" bg="rgba(139,92,246,0.15)" sx={{ "& > div": { bgGradient: "linear(90deg, #8b5cf6, #ec4899)" } }} />
                              <Text fontSize="xs" color="gray.500" textAlign="center" mt={2}>Next tier: {userTotalScore < 50 ? "50 points" : userTotalScore < 100 ? "100 points" : userTotalScore < 250 ? "250 points" : userTotalScore < 500 ? "500 points" : "1000 points"}</Text>
                            </Box>

                            {/* MINT BADGE SECTION */}
                            <Box mt={4}>
                              {userBadgeBalance > 0n ? (
                                <Box>
                                  <Badge w="full" py={4} fontSize="lg" bgGradient="linear(135deg, #c084fc, #ec4899)" color="white" textAlign="center" borderRadius="2xl" boxShadow="0 0 25px #c084fc" mb={4}>🏅 REPUTATION BADGE MINTED ✓</Badge>
                                  <Box p={4} bg="rgba(139,92,246,0.1)" borderRadius="2xl" border="1px solid rgba(139,92,246,0.3)" backdropFilter="blur(10px)">
                                    <VStack spacing={4}>
                                      <Box position="relative" w="120px" h="120px" mx="auto" borderRadius="2xl" overflow="hidden" border="2px solid #c084fc" boxShadow="0 0 20px rgba(192,132,252,0.5)" transition="all 0.3s" _hover={{ transform: "scale(1.05)", boxShadow: "0 0 30px rgba(192,132,252,0.8)" }}>
                                        <Box as="img" src="https://bafybeihyei7jbscpelyes2hlza4z5fpipvxija7g4gotv52hlqa5iq62ca.ipfs.dweb.link/" alt="Reputation Badge NFT" w="100%" h="100%" objectFit="cover" />
                                        <Badge position="absolute" bottom="8px" right="8px" bg="#c084fc" color="white" fontSize="9px" px={2} py={0.5} borderRadius="full">SBT</Badge>
                                      </Box>
                                      <VStack spacing={2} w="full">
                                        <Text fontWeight="800" fontSize="lg" color="#c084fc">Reputation Guardian</Text>
                                        <Text fontSize="xs" color="gray.400" textAlign="center">Soulbound Token (Non-Transferable)</Text>
                                        <HStack spacing={3} justify="center" w="full" pt={2}>
                                          <Box textAlign="center"><Text fontSize="10px" color="gray.500">Score Required</Text><Text fontSize="md" fontWeight="700" color="#c084fc">{minReputationScore}+</Text></Box>
                                          <Box textAlign="center"><Text fontSize="10px" color="gray.500">Your Score</Text><Text fontSize="md" fontWeight="700" color="#4ade80">{userTotalScore}</Text></Box>
                                          <Box textAlign="center"><Text fontSize="10px" color="gray.500">Chain</Text><Text fontSize="md" fontWeight="700" color="#8b5cf6">Soneium</Text></Box>
                                        </HStack>
                                      </VStack>
                                      <Divider borderColor="rgba(139,92,246,0.2)" />
                                      <Box textAlign="center"><Text fontSize="sm" fontWeight="600" color="#fbbf24">🎉 Congratulations! 🎉</Text><Text fontSize="xs" color="gray.400" mt={1}>You are now a verified member of the Soneium community!</Text></Box>
                                      <SimpleGrid columns={2} spacing={2} w="full">
                                        <HStack spacing={1}><Text fontSize="10px">✓</Text><Text fontSize="10px" color="gray.400">Verified Status</Text></HStack>
                                        <HStack spacing={1}><Text fontSize="10px">✓</Text><Text fontSize="10px" color="gray.400">DAO Voting Power</Text></HStack>
                                        <HStack spacing={1}><Text fontSize="10px">✓</Text><Text fontSize="10px" color="gray.400">Exclusive Access</Text></HStack>
                                        <HStack spacing={1}><Text fontSize="10px">✓</Text><Text fontSize="10px" color="gray.400">Future Airdrops</Text></HStack>
                                      </SimpleGrid>
                                      <Button size="xs" variant="link" color="#c084fc" fontSize="10px" onClick={() => window.open(`https://soneium.blockscout.com/address/${BADGE_CONTRACT}`, '_blank')}>📜 View Badge Contract on Explorer</Button>
                                    </VStack>
                                  </Box>
                                </Box>
                              ) : userIsAgent && userTotalScore >= minReputationScore ? (
                                <Button onClick={handleMintBadge} isLoading={isTxPending} w="full" size="lg" bgGradient="linear(135deg, #c084fc, #ec4899)" color="white" fontWeight="700" leftIcon={<Text fontSize="2xl">🏅</Text>} _hover={{ transform: "scale(1.02)", boxShadow: "0 0 30px #c084fc" }}>MINT REPUTATION BADGE</Button>
                              ) : userIsAgent ? (
                                <Box>
                                  <Box position="relative" p={4} bg="rgba(139,92,246,0.05)" borderRadius="xl" border="1px solid rgba(139,92,246,0.2)" filter="blur(4px)" pointerEvents="none" opacity={0.7}>
                                    <VStack spacing={2}>
                                      <HStack spacing={2}><Text fontSize="28px">🏅</Text><Text fontWeight="700" fontSize="md" color="#c084fc">Reputation Badge</Text></HStack>
                                      <Text fontSize="xs" color="gray.400" textAlign="center">Exclusive badge for active community members</Text>
                                      <Button size="sm" bgGradient="linear(135deg, #c084fc, #ec4899)" color="white" isDisabled opacity={0.5}>Locked</Button>
                                    </VStack>
                                  </Box>
                                  <Box mt={3} p={3} bg="rgba(0,0,0,0.3)" borderRadius="lg">
                                    <Flex justify="space-between" mb={2}><Text fontSize="xs" color="gray.400" fontWeight="600">BADGE REQUIREMENTS</Text><Text fontSize="xs" color="#c084fc" fontWeight="700">{userTotalScore} / {minReputationScore}</Text></Flex>
                                    <Progress value={(userTotalScore / minReputationScore) * 100} size="sm" mb={2} borderRadius="full" bg="rgba(139,92,246,0.2)" sx={{ "& > div": { bgGradient: "linear(90deg, #8b5cf6, #ec4899)" } }} />
                                    <Flex justify="space-between" align="center" mt={2}><HStack spacing={1}><Text fontSize="10px" color="#fbbf24">⭐</Text><Text fontSize="10px" color="gray.400">Points needed:</Text></HStack><Text fontSize="sm" fontWeight="800" color="#c084fc">{minReputationScore - userTotalScore} more points</Text></Flex>
                                    <Divider my={3} borderColor="rgba(139,92,246,0.15)" />
                                    <VStack spacing={1.5} align="start">
                                      <Text fontSize="10px" color="gray.500" fontWeight="600">✨ BADGE BENEFITS:</Text>
                                      <HStack spacing={2}><Text fontSize="10px">✓</Text><Text fontSize="10px" color="gray.400">Verified Reputation Status</Text></HStack>
                                      <HStack spacing={2}><Text fontSize="10px">✓</Text><Text fontSize="10px" color="gray.400">Exclusive Community Access</Text></HStack>
                                      <HStack spacing={2}><Text fontSize="10px">✓</Text><Text fontSize="10px" color="gray.400">On-Chain Achievement Proof</Text></HStack>
                                    </VStack>
                                    <Box mt={3} p={2} bg="rgba(139,92,246,0.1)" borderRadius="lg" border="1px solid rgba(139,92,246,0.2)"><Text fontSize="10px" color="gray.400" textAlign="center">💡 Complete more activities to unlock the badge</Text></Box>
                                  </Box>
                                </Box>
                              ) : (
                                <Box textAlign="center" p={4} bg="rgba(139,92,246,0.05)" borderRadius="xl" border="1px dashed rgba(139,92,246,0.3)"><Text fontSize="sm" color="gray.500">🔒 Register as Agent to unlock Badge System</Text></Box>
                              )}
                            </Box>
                          </VStack>
                        </Box>
                      </Box>
                    </GridItem>

                    {/* Activity Breakdown */}
                    <GridItem>
                      <Box bg="rgba(8,8,20,0.8)" backdropFilter="blur(24px)" borderRadius="3xl" border="1px solid rgba(139,92,246,0.3)" overflow="hidden" transition="all 0.4s" _hover={{ borderColor: "rgba(139,92,246,0.6)", transform: "translateY(-5px)" }} h="100%">
                        <Box h="4px" bgGradient="linear(90deg, #ec4899, #8b5cf6, #3b82f6, #ec4899)" backgroundSize="300% 100%" animation={`${shimmer} 4s ease infinite`} />
                        <Box p={6}>
                          <HStack justify="space-between" mb={5}><Heading size="md" color="gray.200" fontWeight="600">Activity Breakdown</Heading><Badge bg="rgba(139,92,246,0.2)" color="#c084fc" px={3} py={1} borderRadius="full" fontSize="xs">Lifetime Stats</Badge></HStack>
                          <VStack spacing={5}>
                            {stats.map((stat) => {
                              const targets: { [key: string]: number } = { "GM Sent": 100, "Votes Cast": 50, "Check-Ins": 100, "Deployments": 25, "Agent GM": 200, "Partner Actions": 500 };
                              const target = targets[stat.label] || 100;
                              const percentage = Math.min(100, (stat.value / target) * 100);
                              const nextMilestone = target - stat.value;
                              return (
                                <Box key={stat.label} w="full" p={3} bg="rgba(0,0,0,0.3)" borderRadius="xl" transition="all 0.3s" _hover={{ bg: "rgba(139,92,246,0.05)" }}>
                                  <Flex justify="space-between" mb={2}>
                                    <HStack spacing={3}>
                                      <Box w="40px" h="40px" bg={`${stat.color}15`} borderRadius="lg" display="flex" alignItems="center" justifyContent="center"><Text fontSize="24px">{stat.icon}</Text></Box>
                                      <Box><Text fontWeight="700" fontSize="md" color="gray.200">{stat.label}</Text><Text fontSize="xs" color="gray.500">{stat.description}</Text></Box>
                                    </HStack>
                                    <Box textAlign="right"><Text fontWeight="800" fontSize="2xl" color={stat.color}>{stat.value}</Text><Text fontSize="xs" color="gray.600">target: {target}</Text></Box>
                                  </Flex>
                                  <Progress value={percentage} size="md" borderRadius="full" bg="rgba(255,255,255,0.05)" mb={2} sx={{ "& > div": { bg: stat.color, boxShadow: `0 0 10px ${stat.color}80` } }} />
                                  <Flex justify="space-between"><Text fontSize="xs" color="gray.500">Progress</Text><Text fontSize="xs" fontWeight="600" color={stat.color}>{percentage.toFixed(0)}%</Text></Flex>
                                  {nextMilestone > 0 && percentage < 100 && (<Text fontSize="xs" color="gray.600" mt={1}>🎯 {nextMilestone} more to next milestone</Text>)}
                                  {percentage >= 100 && (<Badge bg={stat.color} color="white" size="sm" mt={1} fontSize="10px">✓ MILESTONE ACHIEVED</Badge>)}
                                </Box>
                              );
                            })}
                          </VStack>
                          <Divider my={6} borderColor="rgba(139,92,246,0.15)" />
                          <Box textAlign="center">
                            <HStack justify="center" spacing={6}>
                              <Box><Text fontSize="xs" color="gray.500">Total Actions</Text><Text fontSize="2xl" fontWeight="800" color="#c084fc">{stats.reduce((sum, stat) => sum + stat.value, 0)}</Text></Box>
                              <Box w="1px" h="30px" bg="rgba(139,92,246,0.2)" />
                              <Box><Text fontSize="xs" color="gray.500">Unique Types</Text><Text fontSize="2xl" fontWeight="800" color="#8b5cf6">{stats.length}</Text></Box>
                              <Box w="1px" h="30px" bg="rgba(139,92,246,0.2)" />
                              <Box><Text fontSize="xs" color="gray.500">Reputation Score</Text><Text fontSize="2xl" fontWeight="800" color="#ec4899">{userTotalScore}</Text></Box>
                            </HStack>
                          </Box>
                        </Box>
                      </Box>
                    </GridItem>
                  </Grid>

                  {/* Partner Actions - Professional Cards with Reset */}
                  <Box>
                    <Box bg="rgba(8,8,20,0.8)" backdropFilter="blur(24px)" borderRadius="3xl" border="1px solid rgba(139,92,246,0.3)" overflow="hidden" transition="all 0.4s" _hover={{ borderColor: "rgba(139,92,246,0.6)", transform: "translateY(-5px)" }}>
                      <Box h="4px" bgGradient="linear(90deg, #fbbf24, #ec4899, #8b5cf6, #fbbf24)" backgroundSize="300% 100%" animation={`${shimmer} 4s ease infinite`} />
                      <Box p={8}>
                        <HStack spacing={2} mb={6}>
                          <Box w="4px" h="4px" borderRadius="full" bg="#fbbf24" animation={`${pulseGlow} 2s infinite`} />
                          <Heading size="md" color="gray.300" fontWeight="600">🤝 Partner Actions</Heading>
                          <Badge bg="#fbbf24" color="black" ml={2}>9 Actions Available</Badge>
                        </HStack>

                        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                          {PARTNER_ACTIONS.map((action) => {
                            // Determină dacă utilizatorul a plătit pentru această sesiune
                            const hasPaidForThisSession = actionPendingPayment[action.id] === true;
                            
                            // Obține numărul total de execuții (din contract)
                            let totalExecutedCount = 0;
                            switch(action.id) {
                              case 0: totalExecutedCount = Number(userAction0Count); break;
                              case 1: totalExecutedCount = Number(userAction1Count); break;
                              case 2: totalExecutedCount = Number(userAction2Count); break;
                              case 3: totalExecutedCount = Number(userAction3Count); break;
                              case 4: totalExecutedCount = Number(userAction4Count); break;
                              case 5: totalExecutedCount = Number(userAction5Count); break;
                              case 6: totalExecutedCount = Number(userAction6Count); break;
                              case 7: totalExecutedCount = Number(userAction7Count); break;
                              case 8: totalExecutedCount = Number(userAction8Count); break;
                              case 9: totalExecutedCount = Number(userAction9Count); break;
                              case 10: totalExecutedCount = Number(userAction10Count); break;
                              case 11: totalExecutedCount = Number(userAction11Count); break;
                              default: totalExecutedCount = 0;
                            }
                            
                            // Pentru afișarea butonului: poate executa DOAR dacă a plătit în această sesiune
                            const canExecute = hasPaidForThisSession;
                            
                            return (
                              <Box key={action.id} bg="rgba(0,0,0,0.4)" borderRadius="2xl" border={`1.5px solid ${action.color}30`} p={5} transition="all 0.3s ease-in-out" _hover={{ borderColor: action.color, transform: "translateY(-6px)", boxShadow: `0 10px 30px ${action.color}20`, bg: "rgba(0,0,0,0.6)" }}>
                                <VStack spacing={3}>
                                  <HStack w="full" justify="space-between">
                                    <HStack spacing={3}>
                                      <Box w="40px" h="40px" bg="rgba(255,255,255,0.05)" borderRadius="xl" display="flex" alignItems="center" justifyContent="center">
                                        <Image src={action.logo} boxSize="28px" borderRadius="full" fallbackSrc="https://via.placeholder.com/28" />
                                      </Box>
                                      <Text fontWeight="700" color="white" fontSize="md">{action.name}</Text>
                                    </HStack>
                                    <Badge bg={`${action.color}20`} color={action.color} fontSize="xs" px={2.5} py={1} borderRadius="full" fontWeight="600">+{action.points} pt</Badge>
                                  </HStack>
                                  
                                  <HStack w="full" justify="space-between">
                                    <Text fontSize="xs" color="gray.400" fontWeight="500">Status:</Text>
                                    <Badge bg={canExecute ? "#22c55e20" : "#fbbf2420"} color={canExecute ? "#22c55e" : "#fbbf24"} fontSize="xs" px={2.5} py={1} borderRadius="full" fontWeight="600">
                                      {canExecute ? "✓ Ready" : "⏳ Pay First"}
                                    </Badge>
                                  </HStack>
                                  
                                  <HStack w="full" justify="space-between">
                                    <Text fontSize="xs" color="gray.400" fontWeight="500">Total Completed:</Text>
                                    <Text fontSize="md" fontWeight="700" color={action.color}>{totalExecutedCount}x</Text>
                                  </HStack>
                                  
                                  <Divider borderColor="rgba(255,255,255,0.1)" my={1} />
                                  
                                  <VStack spacing={1} w="full">
                                    <Text fontSize="xs" color="gray.400" fontWeight="500">Protocol Fee: <Text as="span" color="#fbbf24" fontWeight="700">{formatFee(defaultFee)} ETH</Text></Text>
                                    <Text fontSize="xs" color="gray.400" fontWeight="500">
                                      External Fee: {action.externalFee > 0 ? (
                                        <Text as="span" color="#22c55e" fontWeight="700">{formatFee(BigInt(action.externalFee))} ETH</Text>
                                      ) : (
                                        <Text as="span" color="#fbbf24" fontWeight="700">FREE</Text>
                                      )}
                                    </Text>
                                  </VStack>
                                  
                                  <Button 
                                    size="md" 
                                    w="full" 
                                    bg={!canExecute ? `linear-gradient(135deg, ${action.color}, ${action.color}cc)` : `linear-gradient(135deg, ${action.color}, ${action.color}cc)`}
                                    color="white" 
                                    fontWeight="bold"
                                    fontSize="sm"
                                    py={2.5}
                                    isLoading={isTxPending} 
                                    _hover={{ opacity: 0.9, transform: "scale(1.02)", boxShadow: `0 0 15px ${action.color}80` }} 
                                    borderRadius="full"
                                    onClick={() => !canExecute ? handlePayAndApprove(action) : handleExecutePartnerAction(action)}
                                  >
                                    {!canExecute ? `💰 Pay & Approve (${formatFee(defaultFee)} ETH)` : `✨ ${action.name.split(" ")[0]} ✨`}
                                  </Button>
                                  
                                  {totalExecutedCount > 0 && !canExecute && (
                                    <Text fontSize="xs" color="gray.500" textAlign="center" mt={1}>💡 Pay fee again to earn more points!</Text>
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
            </TabPanel>

            {/* Success Modal */}
            <Modal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)} isCentered>
              <ModalOverlay backdropFilter="blur(10px)" />
              <ModalContent bg="rgba(8,8,20,0.95)" border="1px solid rgba(139,92,246,0.3)" borderRadius="2xl">
                <ModalHeader color="#c084fc">✅ Payment Successful!</ModalHeader>
                <ModalCloseButton color="gray.400" />
                <ModalBody>
                  <VStack spacing={4}>
                    <Text color="gray.300">You have successfully paid the protocol fee.</Text>
                    <Text color="gray.400" fontSize="sm">Click below to execute the {pendingAction?.name} action.</Text>
                    {pendingAction && (
                      <Button
                        bgGradient={`linear(135deg, ${pendingAction.color}, ${pendingAction.color}cc)`}
                        color="white"
                        size="lg"
                        w="full"
                        onClick={() => handleExecutePartnerAction(pendingAction)}
                        isLoading={isTxPending}
                        _hover={{ opacity: 0.9, transform: "scale(1.02)" }}
                      >
                        Execute {pendingAction.name}
                      </Button>
                    )}
                  </VStack>
                </ModalBody>
                <ModalFooter>
                  <Button variant="ghost" color="gray.400" onClick={() => setShowSuccessModal(false)}>
                    Close
                  </Button>
                </ModalFooter>
              </ModalContent>
            </Modal>

            {/* Explorer Panel */}
            <TabPanel px={0} pt={2}>
              <Box bg="rgba(8,8,20,0.8)" backdropFilter="blur(24px)" borderRadius="3xl" border="1px solid rgba(139,92,246,0.3)" p={8}>
                <InputGroup size="lg" mb={8}>
                  <InputLeftElement pointerEvents="none"><SearchIcon color="#8b5cf6" /></InputLeftElement>
                  <Input placeholder="Search wallet address (0x...)" value={searchAddress} onChange={(e) => setSearchAddress(e.target.value)} bg="rgba(0,0,0,0.4)" borderColor="rgba(139,92,246,0.4)" color="white" _hover={{ borderColor: "#8b5cf6" }} _focus={{ borderColor: "#c084fc", boxShadow: "0 0 0 2px #c084fc", bg: "rgba(0,0,0,0.6)" }} fontFamily="mono" borderRadius="2xl" fontSize="sm" />
                </InputGroup>
                {searchAddress && searchAddress.length === 42 && (
                  <VStack spacing={6} align="stretch">
                    <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
                      <HStack spacing={3}><Avatar size="md" bgGradient="linear(135deg, #8b5cf6, #ec4899)" name={truncateAddress(searchAddress)} /><Text fontWeight="700" fontFamily="mono" color="white">{truncateAddress(searchAddress)}</Text></HStack>
                      <HStack spacing={3}>
                        {searchedUserIsSBT && (<Tooltip label="Soulbound Token Holder"><Badge bg="#8b5cf6" color="white" fontSize="sm" px={4} py={2} borderRadius="full" boxShadow="0 0 10px #8b5cf6">🔒 SBT Holder</Badge></Tooltip>)}
                        {searchedUserIsAgent ? (<Badge bgGradient="linear(135deg, #c084fc, #ec4899)" color="white" px={5} py={2} borderRadius="full" fontSize="sm" fontWeight="700" boxShadow="0 0 20px #c084fc" animation={`${pulseGlow} 2s infinite`}>🧬 REGISTERED AGENT ✓</Badge>) : (<Button size="sm" variant="outline" bg="rgba(139,92,246,0.1)" borderColor="#c084fc" color="#c084fc" _hover={{ bg: "rgba(139,92,246,0.2)", transform: "scale(1.02)", boxShadow: "0 0 15px #c084fc" }} onClick={() => window.location.href = "/"} borderRadius="full" fontSize="xs" fontWeight="600">Register as Agent</Button>)}
                      </HStack>
                    </Flex>
                    <SimpleGrid columns={{ base: 2, md: 4 }} spacing={5}>
                      {[
                        { label: "GM", value: Number(searchedUserGmCount), icon: "🌅", color: "#22c55e", desc: "Sent" },
                        { label: "Votes", value: Number(searchedUserVoteCount), icon: "🗳️", color: "#8b5cf6", desc: "Cast" },
                        { label: "Check-Ins", value: Number(searchedUserCheckInCount), icon: "✅", color: "#3b82f6", desc: "Recorded" },
                        { label: "Deploys", value: Number(searchedUserDeployCount), icon: "🚀", color: "#ec4899", desc: "Deployed" },
                        { label: "Agent GM", value: Number(searchedUserAgentGmCount), icon: "🤖", color: "#c084fc", desc: "Agent GM Sent" },
                        { label: "Partner", value: searchedUserPartnerTotal, icon: "🤝", color: "#fbbf24", desc: "Partner Actions" },
                      ].map((item) => (
                        <Box key={item.label} textAlign="center" p={5} bg="rgba(0,0,0,0.3)" borderRadius="xl" border={`1px solid ${item.color}30`}>
                          <Text fontSize="40px">{item.icon}</Text>
                          <Text fontSize="sm" color="gray.500">{item.label}</Text>
                          <Text fontSize="3xl" fontWeight="800" color={item.color}>{item.value}</Text>
                          <Text fontSize="xs" color="gray.600">{item.desc}</Text>
                        </Box>
                      ))}
                    </SimpleGrid>
                    <Box textAlign="center" pt={4}>
                      <Divider borderColor="rgba(139,92,246,0.15)" mb={6} />
                      <Flex justify="center" align="center" gap={5}>
                        <Text color="gray.500" fontFamily="mono">Total Score:</Text>
                        <Text fontSize="2xl" fontWeight="800" color="#c084fc">{searchedUserTotalScore}</Text>
                        <Badge bg={searchedUserBadge.bg} color={searchedUserBadge.color} px={4} py={2} borderRadius="full" border={`1px solid ${searchedUserBadge.color}`}>{searchedUserBadge.icon} {searchedUserBadge.label}</Badge>
                      </Flex>
                    </Box>
                  </VStack>
                )}
              </Box>
            </TabPanel>

            {/* Leaderboard Panel */}
            <TabPanel px={0} pt={2}>
              <Box bg="rgba(8,8,20,0.8)" backdropFilter="blur(24px)" borderRadius="3xl" border="1px solid rgba(139,92,246,0.3)" p={8}>
                <HStack spacing={2} mb={6}><Text fontSize="32px">🏆</Text><Heading size="md" color="gray.200" fontWeight="600">Top Users Leaderboard</Heading></HStack>
                {isLoadingLeaderboard ? (<Flex justify="center" py={16}><Spinner color="#8b5cf6" size="xl" thickness="3px" /></Flex>) : leaderboardData.length === 0 ? (<Text textAlign="center" color="gray.500" py={16} fontFamily="mono">No users found. Be the first to interact!</Text>) : (
                  <Box overflowX="auto">
                    <Table variant="unstyled">
                      <Thead><Tr borderBottom="2px solid rgba(139,92,246,0.2)">
                        <Th color="gray.500" fontSize="xs" fontWeight="600" fontFamily="mono">#</Th>
                        <Th color="gray.500" fontSize="xs" fontWeight="600" fontFamily="mono">Explorer</Th>
                        <Th color="gray.500" fontSize="xs" fontWeight="600" fontFamily="mono" textAlign="center">🌅</Th>
                        <Th color="gray.500" fontSize="xs" fontWeight="600" fontFamily="mono" textAlign="center">🗳️</Th>
                        <Th color="gray.500" fontSize="xs" fontWeight="600" fontFamily="mono" textAlign="center">✅</Th>
                        <Th color="gray.500" fontSize="xs" fontWeight="600" fontFamily="mono" textAlign="center">🚀</Th>
                        <Th color="gray.500" fontSize="xs" fontWeight="600" fontFamily="mono" textAlign="center">🤖</Th>
                        <Th color="gray.500" fontSize="xs" fontWeight="600" fontFamily="mono" textAlign="center">🤝</Th>
                        <Th color="gray.500" fontSize="xs" fontWeight="600" fontFamily="mono" textAlign="center">Score</Th>
                        <Th color="gray.500" fontSize="xs" fontWeight="600" fontFamily="mono" textAlign="center">Badge</Th>
                      </Tr></Thead>
                      <Tbody>
                        {leaderboardData.slice(0, 20).map((user, idx) => {
                          const badge = getUserBadge(user.totalScore);
                          return (<Tr key={user.address} borderBottom="1px solid rgba(139,92,246,0.08)" _hover={{ bg: "rgba(139,92,246,0.05)", transition: "all 0.2s" }}>
                            <Td><HStack spacing={2}>{idx === 0 && <StarIcon color="#fbbf24" boxSize={3} />}{idx === 1 && <StarIcon color="#9ca3af" boxSize={3} />}{idx === 2 && <StarIcon color="#cd7f32" boxSize={3} />}<Text fontWeight="700" color={idx < 3 ? "#fbbf24" : "gray.500"} fontFamily="mono">#{idx + 1}</Text></HStack></Td>
                            <Td><Tooltip label={user.address}><Text fontFamily="mono" fontSize="sm" color="white" fontWeight="500">{truncateAddress(user.address)}</Text></Tooltip></Td>
                            <Td textAlign="center" color="#22c55e" fontWeight="700">{user.gmCount}</Td>
                            <Td textAlign="center" color="#8b5cf6" fontWeight="700">{user.voteCount}</Td>
                            <Td textAlign="center" color="#3b82f6" fontWeight="700">{user.checkInCount}</Td>
                            <Td textAlign="center" color="#ec4899" fontWeight="700">{user.deployCount}</Td>
                            <Td textAlign="center" color="#c084fc" fontWeight="700">{user.agentGmCount || 0}</Td>
                            <Td textAlign="center" color="#fbbf24" fontWeight="700">{user.partnerTotal || 0}</Td>
                            <Td textAlign="center"><Badge bg="#8b5cf6" color="white" fontSize="sm" px={3} py={1.5} borderRadius="full">{user.totalScore}</Badge></Td>
                            <Td textAlign="center"><Badge bg={badge.bg} color={badge.color} fontSize="xs" px={3} py={1.5} borderRadius="full" border={`1px solid ${badge.color}`}>{badge.icon} {badge.label}</Badge></Td>
                          </Tr>);
                        })}
                      </Tbody>
                    </Table>
                  </Box>
                )}
              </Box>
            </TabPanel>

            {/* Bridge Panel */}
            <TabPanel px={0} pt={2}>
              <Box bg="rgba(8,8,25,0.95)" backdropFilter="blur(32px)" borderRadius="3xl" border="2px solid rgba(139,92,246,0.5)" p={8} position="relative" boxShadow="0 0 80px rgba(139,92,246,0.2)" transition="all 0.4s" _hover={{ borderColor: "rgba(139,92,246,0.8)", boxShadow: "0 0 100px rgba(139,92,246,0.3)" }}>
                <Box position="absolute" top={0} left={0} right={0} h="3px" bgGradient="linear(90deg, #8b5cf6, #ec4899, #3b82f6, #8b5cf6)" backgroundSize="300% 100%" animation={`${shimmer} 8s linear infinite`} borderRadius="full" />
                <VStack spacing={6} align="stretch">
                  <HStack justify="space-between" align="center" wrap="wrap" gap={4}>
                    <HStack spacing={4}><Box fontSize="56px" animation={`${float} 4s ease-in-out infinite`}>🌉</Box><Box><Heading size="xl" bgGradient="linear(135deg, #c084fc, #a855f7, #60a5fa)" bgClip="text" letterSpacing="tight" fontWeight="800">Cross-Chain Exchange</Heading><Text color="gray.500" fontSize="sm" fontFamily="mono">Bridge & Swap • Powered by LI.FI</Text></Box></HStack>
                    <Badge px={5} py={2.5} bgGradient="linear(135deg, #22c55e, #86efac)" color="black" fontWeight="800" borderRadius="full" boxShadow="0 0 25px rgba(74,222,128,0.4)" fontSize="xs">5 NETWORKS SUPPORTED</Badge>
                  </HStack>
                  <Box bg="#07070F" borderRadius="2xl" border="1px solid rgba(139,92,246,0.3)" p={4} minH="640px">
                    {isWidgetReady ? (<LiFiWidget integrator="PulseVault" config={{ apiKey: '7b415723-cfa7-4d4e-b58d-4dea6e36b71a.be9467a8-914e-4511-8d07-01987626c5ed', appearance: colorMode, fromChain: chainId, toChain: 1868, chains: { allow: [1868, 8453, 10, 57073, 130] }, theme: { shape: { borderRadius: 16 }, typography: { fontFamily: "'Inter', 'Rubik', sans-serif", fontSize: 14 }, palette: { mode: colorMode, primary: { main: colorMode === 'dark' ? '#a855f7' : '#7c3aed' }, secondary: { main: '#60a5fa' }, background: { default: colorMode === 'dark' ? '#07070F' : '#F8FAFC', paper: colorMode === 'dark' ? '#0F0F1A' : '#FFFFFF' }, text: { primary: colorMode === 'dark' ? '#F1F5F9' : '#0F172A', secondary: colorMode === 'dark' ? '#94A3B8' : '#475569' }, action: { hover: colorMode === 'dark' ? 'rgba(165,85,247,0.15)' : 'rgba(124,58,237,0.1)' }, divider: colorMode === 'dark' ? 'rgba(148,163,184,0.08)' : 'rgba(0,0,0,0.06)' }, container: { boxShadow: 'none' } } }} />) : (<WidgetSkeleton config={{ appearance: colorMode }} />)}
                  </Box>
                  <HStack justify="center" spacing={8} color="gray.600" fontSize="xs" fontFamily="mono"><Text>⚡ Instant Cross-Chain</Text><Text>🔒 Secure & Audited</Text><Text>Soneium • Base • Optimism • Ink • Unichain</Text></HStack>
                </VStack>
              </Box>
            </TabPanel>

            {/* Info Panel */}
            <TabPanel px={0} pt={2}>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
                <Box bg="rgba(8,8,20,0.8)" backdropFilter="blur(24px)" borderRadius="3xl" border="1px solid rgba(139,92,246,0.3)" p={8}>
                  <Heading size="md" mb={6} color="#c084fc" fontWeight="700">📘 How It Works</Heading>
                  <VStack spacing={5} align="stretch">
                    {[{ step: "01", title: "Connect Wallet", desc: "Connect your Web3 wallet to start building reputation", color: "#8b5cf6" }, { step: "02", title: "Perform Actions", desc: "Send GM, Vote, Check-In, or Deploy contracts", color: "#ec4899" }, { step: "03", title: "Pay Small Fees", desc: "Each action has a small ETH fee to prevent spam", color: "#3b82f6" }, { step: "04", title: "Build Score", desc: "Your total score increases with every action", color: "#22c55e" }].map((item) => (<HStack key={item.step} spacing={4}><Badge fontSize="lg" px={4} py={2.5} borderRadius="full" bgGradient={`linear(135deg, ${item.color}, #a855f7)`} color="white" fontWeight="800">{item.step}</Badge><Box><Text fontWeight="700" color="white">{item.title}</Text><Text fontSize="sm" color="gray.500">{item.desc}</Text></Box></HStack>))}
                  </VStack>
                </Box>
                <Box bg="rgba(8,8,20,0.8)" backdropFilter="blur(24px)" borderRadius="3xl" border="1px solid rgba(139,92,246,0.3)" p={8}>
                  <Heading size="md" mb={6} color="#c084fc" fontWeight="700">🔗 Contract Information</Heading>
                  <VStack spacing={4} align="stretch">
                    <Box p={3} bg="rgba(0,0,0,0.4)" borderRadius="xl"><Text fontSize="xs" color="gray.500" fontFamily="mono">GM CONTRACT</Text><Text fontSize="sm" fontFamily="mono" color="white">{truncateAddress(GM_CONTRACT)}</Text></Box>
                    <Box p={3} bg="rgba(0,0,0,0.4)" borderRadius="xl"><Text fontSize="xs" color="gray.500" fontFamily="mono">VOTE CONTRACT</Text><Text fontSize="sm" fontFamily="mono" color="white">{truncateAddress(VOTE_CONTRACT)}</Text></Box>
                    <Box p={3} bg="rgba(0,0,0,0.4)" borderRadius="xl"><Text fontSize="xs" color="gray.500" fontFamily="mono">CHECK-IN CONTRACT</Text><Text fontSize="sm" fontFamily="mono" color="white">{truncateAddress(CHECKIN_CONTRACT)}</Text></Box>
                    <Box p={3} bg="rgba(0,0,0,0.4)" borderRadius="xl"><Text fontSize="xs" color="gray.500" fontFamily="mono">DEPLOY CONTRACT</Text><Text fontSize="sm" fontFamily="mono" color="white">{truncateAddress(DEPLOY_CONTRACT)}</Text></Box>
                    <Box p={3} bg="rgba(0,0,0,0.4)" borderRadius="xl"><Text fontSize="xs" color="gray.500" fontFamily="mono">AGENT CONTRACT</Text><Text fontSize="sm" fontFamily="mono" color="white">{truncateAddress(AGENT_CONTRACT)}</Text></Box>
                    <Box p={3} bg="rgba(0,0,0,0.4)" borderRadius="xl"><Text fontSize="xs" color="gray.500" fontFamily="mono">AGENT GM CONTRACT</Text><Text fontSize="sm" fontFamily="mono" color="white">{truncateAddress(AGENT_GM_CONTRACT)}</Text></Box>
                    <Box p={3} bg="rgba(0,0,0,0.4)" borderRadius="xl"><Text fontSize="xs" color="gray.500" fontFamily="mono">AGENT GATEWAY</Text><Text fontSize="sm" fontFamily="mono" color="white">{truncateAddress(AGENT_GATEWAY_CONTRACT)}</Text></Box>
                  </VStack>
                  <Divider my={6} borderColor="rgba(139,92,246,0.15)" />
                  <Heading size="md" mb={5} color="#c084fc" fontWeight="700">🏅 Badge System</Heading>
                  <SimpleGrid columns={{ base: 2, md: 3 }} spacing={3}>
                    <Badge bg="rgba(255,215,0,0.12)" color="#ffd700" py={2.5} textAlign="center" borderRadius="full" border="1px solid #ffd70040">👑 LEGEND (1000+)</Badge>
                    <Badge bg="rgba(192,192,192,0.12)" color="#c0c0c0" py={2.5} textAlign="center" borderRadius="full" border="1px solid #c0c0c040">⚡ ELITE (500-999)</Badge>
                    <Badge bg="rgba(255,107,53,0.12)" color="#ff6b35" py={2.5} textAlign="center" borderRadius="full" border="1px solid #ff6b3540">🔥 ACTIVE (250-499)</Badge>
                    <Badge bg="rgba(192,132,252,0.12)" color="#c084fc" py={2.5} textAlign="center" borderRadius="full" border="1px solid #c084fc40">⭐ RISING (100-249)</Badge>
                    <Badge bg="rgba(74,222,128,0.12)" color="#4ade80" py={2.5} textAlign="center" borderRadius="full" border="1px solid #4ade8040">🌿 BEGINNER (50-99)</Badge>
                    <Badge bg="rgba(156,163,175,0.12)" color="#9ca3af" py={2.5} textAlign="center" borderRadius="full" border="1px solid #9ca3af40">✨ NEW (0-49)</Badge>
                  </SimpleGrid>
                </Box>
              </SimpleGrid>
            </TabPanel>
          </TabPanels>
        </Tabs>

        {/* Footer */}
        <Box pt={20} pb={10} textAlign="center" bg="black" borderTop="1px solid" borderColor="rgba(139,92,246,0.2)">
          <VStack spacing={6} maxW="container.lg" mx="auto">
            <Divider opacity={0.4} borderColor="rgba(139,92,246,0.4)" maxW="420px" />
            <Text fontSize="sm" fontWeight="600" letterSpacing="0.08em" fontFamily="mono" color="gray.300">© 2026 • Activity Reputation • Soneium Mainnet</Text>
            <HStack spacing={8} justify="center" flexWrap="wrap" align="center">
              <Text fontSize="xs" color="gray.400" fontWeight="600" letterSpacing="0.1em" _hover={{ color: "white" }} transition="color 0.2s">🔗 ON-CHAIN ACTIVITY TRACKING</Text>
              <Box w="4px" h="4px" borderRadius="full" bg="gray.500" />
              <Text fontSize="xs" color="gray.400" fontWeight="600" letterSpacing="0.1em" _hover={{ color: "white" }} transition="color 0.2s">⚡ REAL-TIME DATA</Text>
              <Box w="4px" h="4px" borderRadius="full" bg="gray.500" />
              <Text fontSize="xs" color="gray.400" fontWeight="600" letterSpacing="0.1em" _hover={{ color: "white" }} transition="color 0.2s">🛡️ SECURE & TRANSPARENT</Text>
              <Box w="4px" h="4px" borderRadius="full" bg="gray.500" />
              <Text fontSize="xs" color="gray.400" fontWeight="600" letterSpacing="0.1em" _hover={{ color: "white" }} transition="color 0.2s">🌐 DECENTRALIZED</Text>
            </HStack>
            <Text fontSize="xs" color="gray.400" fontFamily="mono" letterSpacing="0.12em" fontWeight="500" textTransform="uppercase">ACTIVITY REPUTATION SYSTEM — BUILD YOUR ON-CHAIN LEGACY</Text>
          </VStack>
        </Box>
      </Container>

      <TransactionModal isOpen={txOpen} status={txStatus} title={txTitle} description={txDesc} onClose={() => { setTxOpen(false); setTimeout(() => { if (txStatus === "success" || txStatus === "rejected" || txStatus === "failed") { setTxStatus("idle"); setTxTitle(""); setTxDesc(""); } }, 300); }} />
    </Box>
  );
}

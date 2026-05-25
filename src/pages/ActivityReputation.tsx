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
  Icon,
  Tooltip,
  Input,
  InputGroup,
  InputLeftElement,
  Spinner,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  useDisclosure,
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
import { useEffect, useState, useRef, useCallback } from "react";
import confetti from "canvas-confetti";
import { keyframes } from "@emotion/react";
import { ChevronLeftIcon, ExternalLinkIcon, CopyIcon, SearchIcon } from "@chakra-ui/icons";
import { FaTwitter } from "react-icons/fa";

import TransactionModal from "../components/TransactionModal";

// Import ABI-uri
import { gmABI } from "../abi/gmABI";
import { VoteABI } from "../abi/VoteABI";
import { checkInABI } from "../abi/checkInABI";
import { DeployABI } from "../abi/DeployABI";
import { agentGatewayABI } from "../abi/agentGatewayABI";

// ================= CONTRACT ADDRESSES =================
const GM_CONTRACT = "0x92030EB87e27ED80351f346dea4B14Ac61a1f57C";
const DEPLOY_CONTRACT = "0x539040c447A4a0D61C396b74308efe959A2eD86a";
const VOTE_CONTRACT = "0xd01c919c63856a9732a6A0BAfc63eb2494e4a19F";
const CHECKIN_CONTRACT = "0x72c89BA5def57c642582E536d351483b9D85CA8C";
const AGENT_CONTRACT = "0x29c4632A1710BC58cE8D9d46Ec227fc569f58bF1";
const AGENT_GM_CONTRACT = "0xb19922c27C86cc08dc4f0f3Cb4e76c30494c22dc";
const AGENT_GATEWAY_CONTRACT = "0x1a5d31E9d0bf403aD5782DBc44CD5B891D1e91f4";

const SONEIUM_CHAIN_ID = 1868;
const BADGE_CONTRACT = "0x141224Bcdd1AE69E510c74928eD8d5B41dCe0D66";
const API_URL = "/api";

// ================= PARTNER ACTIONS WITH TWITTER =================
const PARTNER_ACTIONS = [
  { id: 0, name: "Dice Or Die", fullName: "Dice Or Die Check In", logo: "/dod.png", twitterHandle: "@DiceOrDieGame", twitterUrl: "https://x.com/DiceOrDieGame", target: "0x17c7E99c2c1aEFdf3811F72ce960a0d560F039B4", selector: "0x183ff085", functionName: "checkIn", points: 1, color: "#d32a14", hasReferral: false, externalFee: 0, isPayable: false },
  { id: 1, name: "Axolts", fullName: "AXD Daily Check In", logo: "/axd.png", twitterHandle: "@Axoltsescape", twitterUrl: "https://x.com/Axoltsescape", target: "0x6b2249389dC3Db6B27833279F594910caa6465e7", selector: "0x4e71d92d", functionName: "claim", points: 1, color: "#d83fdd", hasReferral: false, externalFee: 0, isPayable: false },
  { id: 2, name: "Rubyscore", fullName: "Rubyscore Vote", logo: "/ruby.png", twitterHandle: "@rubyscore_io", twitterUrl: "https://x.com/rubyscore_io", target: "0x6cf740D3145b71F705A9745A35b9C91f8B4F7DDF", selector: "0x632a9a52", functionName: "vote", points: 1, color: "#c6f1f1", hasReferral: false, externalFee: 5000000000000, isPayable: true },
  { id: 3, name: "Lootcoin", fullName: "Lootcoin Check In", logo: "/loot.png", twitterHandle: "@Lootcointech", twitterUrl: "https://x.com/Lootcointech", target: "0x21Be1D69A77eA5882aCcD5c5319Feb7AC3854751", selector: "0xd9a59e33", functionName: "checkIn", points: 1, color: "#e2f818", hasReferral: true, externalFee: 0, isPayable: false },
  { id: 4, name: "PressA", fullName: "PressA Daily", logo: "/presa.png", twitterHandle: "@PressA_to_start", twitterUrl: "https://x.com/PressA_to_start", target: "0xf1Be6F9d4ff40Cac47C620E058535451596a5aBD", selector: "0x183ff085", functionName: "checkIn", points: 1, color: "#55e412", hasReferral: false, externalFee: 0, isPayable: false },
  { id: 5, name: "OnChain GM", fullName: "OnChain GM", logo: "/onchaingm.png", twitterHandle: "@OnChainGm", twitterUrl: "https://x.com/OnChainGm", target: "0x8ADA1808cc5ed8493836e6A79080ea0ea2f008eC", selector: "0x84a3bb6b", functionName: "onChainGM", points: 1, color: "#0fa1e4", hasReferral: true, externalFee: 29000000000000, isPayable: true },
  { id: 6, name: "Captain", fullName: "Captain Check In", logo: "/captain.png", twitterHandle: "@capncompany", twitterUrl: "https://x.com/capncompany", target: "0xedCbF9D4CC3BA9aAA896adADeac1b6DF6326f7D8", selector: "0x183ff085", functionName: "checkIn", points: 1, color: "#f1ee0f", hasReferral: false, externalFee: 0, isPayable: false },
  { id: 7, name: "Arkada", fullName: "Arkada Check In", logo: "/arkada.png", twitterHandle: "@Arkada_gg", twitterUrl: "https://x.com/Arkada_gg", target: "0x98826e728977B25279ad7629134FD0e96bd5A7b2", selector: "0x919840ad", functionName: "check", points: 1, color: "#e9660e", hasReferral: false, externalFee: 0, isPayable: false },
  { id: 8, name: "Owlto", fullName: "Owlto Check In", logo: "/owlto.png", twitterHandle: "@Owlto_Finance", twitterUrl: "https://x.com/Owlto_Finance", target: "0xF40448F38d99A2Db70de37416B22B4338A1c2Ad7", selector: "0xf516f88e", functionName: "checkIn", points: 1, color: "#e9b60e", hasReferral: false, externalFee: 55000000000000, isPayable: true },
  { id: 9, name: "NekoKat", fullName: "NekoKat GMeow", logo: "/neko.png", twitterHandle: "@nekocat_world", twitterUrl: "https://x.com/nekocat_world", target: "0xfF3aC835a193Cc08543256e24508b42248A63A26", selector: "0x95b2fd73", functionName: "signGMeow", points: 1, color: "#ecf0b4", hasReferral: false, externalFee: 0, isPayable: false },
  { id: 10, name: "SurfLayer", fullName: "SurfLayer GM", logo: "/surf.png", twitterHandle: "@SurfLayer", twitterUrl: "https://x.com/SurfLayer", target: "0x3d97B802fFD7F36d50CE1498e8Ca5318C5c8e9EC", selector: "0x498c249a", functionName: "dailyGM", points: 1, color: "#22c23d", hasReferral: false, externalFee: 40000000000000, isPayable: true },
  { id: 11, name: "WheelX", fullName: "WheelX GM", logo: "/wheels.png", twitterHandle: "@WheelX_fi", twitterUrl: "https://x.com/WheelX_fi", target: "0x62f79aab09B60A27cd3607aCaE55281Efd7294Bb", selector: "0xc0129d43", functionName: "gm", points: 1, color: "#8413c5", hasReferral: false, externalFee: 20000000000000, isPayable: true },
  { id: 12, name: "MetaMap", fullName: "Meta Mint", logo: "/meta.png", twitterHandle: "@MetaMap_xyz", twitterUrl: "https://x.com/MetaMap_xyz", target: "0xc09286a6F0687C769579ac38dD682390A48d0092", selector: "0x77097fc8", functionName: "mint", points: 1, color: "#3b82f6", hasReferral: false, externalFee: 25000000000000, isPayable: true },
  { id: 13, name: "Dmail", fullName: "Dmail Send", logo: "/dmail.png", twitterHandle: "@Dmailofficial", twitterUrl: "https://x.com/Dmailofficial", target: "0xbf930F20E468428968E72F219795D679f45cf2A4", selector: "0x5b7d7482", functionName: "send_mail", points: 1, color: "#f97316", hasReferral: false, externalFee: 6000000000000, isPayable: true },
  { id: 14, name: "Pods", fullName: "Pods Mint", logo: "/pods.png", twitterHandle: "", twitterUrl: "", target: "0x43048F15167BDB4A592C2f0F92B9A39e51240F39", selector: "0xd204c45e", functionName: "safeMint", points: 1, color: "#a855f7", hasReferral: false, externalFee: 0, isPayable: false },
  { id: 15, name: "Startale", fullName: "Startale Check In", logo: "/startale.png", twitterHandle: "@StartaleGroup", twitterUrl: "https://x.com/StartaleGroup", target: "0x0B9f730bF4C1Bf1c0D5B548556a239d5eC0A1D3e", selector: "0x183ff085", functionName: "checkIn", points: 1, color: "#a7d0e0", hasReferral: false, externalFee: 0, isPayable: false },
  { id: 16, name: "Exarta", fullName: "Exarta Check In", logo: "/exarta.png", twitterHandle: "@ExartaOfficial", twitterUrl: "https://x.com/ExartaOfficial", target: "0xb97DDf414748d1DBEF846fc2Fe74391f7Bc8A715", selector: "0x7c21bd5a", functionName: "checkin", points: 1, color: "#e0d420", hasReferral: false, externalFee: 0, isPayable: false },
  { id: 17, name: "ZombieIdle", fullName: "ZombieIdle Check In", logo: "/zombie.png", twitterHandle: "@zombieidle", twitterUrl: "https://x.com/zombieidle", target: "0x1e6d5018970F982Af9208AA10322c29e808cBC89", selector: "0xc63e529b", functionName: "buy", points: 1, color: "#3b5f05", hasReferral: false, externalFee: 1500000000000, isPayable: true },
];

// ================= ABI-uri pentru contractele partenere =================
const dodABI = [{ inputs: [], name: "checkIn", outputs: [], stateMutability: "nonpayable", type: "function" }] as const;
const axdABI = [{ inputs: [], name: "claim", outputs: [], stateMutability: "nonpayable", type: "function" }] as const;
const rubyscoreABI = [{ inputs: [], name: "vote", outputs: [], stateMutability: "payable", type: "function" }] as const;
const lootcoinABI = [{ inputs: [{ internalType: "address", name: "referrer", type: "address" }], name: "checkIn", outputs: [], stateMutability: "nonpayable", type: "function" }] as const;
const presaABI = [{ inputs: [], name: "checkIn", outputs: [], stateMutability: "nonpayable", type: "function" }] as const;
const onchainGMABI = [{ inputs: [{ internalType: "address", name: "referrer", type: "address" }], name: "onChainGM", outputs: [], stateMutability: "payable", type: "function" }] as const;
const owltoABI = [{ inputs: [{ internalType: "uint256", name: "date", type: "uint256" }, { internalType: "uint256", name: "timestamp", type: "uint256" }], name: "checkIn", outputs: [], stateMutability: "payable", type: "function" }] as const;
const captainABI = [{ inputs: [], name: "checkIn", outputs: [], stateMutability: "nonpayable", type: "function" }] as const;
const arkadaABI = [{ inputs: [], name: "check", outputs: [], stateMutability: "nonpayable", type: "function" }] as const;
const nekoABI = [{ inputs: [{ internalType: "string", name: "message", type: "string" }, { internalType: "uint256", name: "dayNumber", type: "uint256" }, { internalType: "uint256", name: "currentStreak", type: "uint256" }], name: "signGMeow", outputs: [], stateMutability: "nonpayable", type: "function" }] as const;
const surfABI = [{ inputs: [], name: "dailyGM", outputs: [], stateMutability: "payable", type: "function" }] as const;
const wheelABI = [{ inputs: [], name: "gm", outputs: [], stateMutability: "payable", type: "function" }] as const;
const metaABI = [{ inputs: [{ internalType: "uint256", name: "quantity", type: "uint256" }, { internalType: "string", name: "iso", type: "string" }], name: "mint", outputs: [], stateMutability: "payable", type: "function" }] as const;
const dmailABI = [{ inputs: [{ internalType: "string", name: "to", type: "string" }, { internalType: "string", name: "path", type: "string" }], name: "send_mail", outputs: [], stateMutability: "payable", type: "function" }] as const;
const podsABI = [{ inputs: [{ internalType: "address", name: "to", type: "address" }, { internalType: "string", name: "uri", type: "string" }], name: "safeMint", outputs: [], stateMutability: "nonpayable", type: "function" }] as const;
const startaleABI = [{ inputs: [], name: "checkIn", outputs: [], stateMutability: "nonpayable", type: "function" }] as const;
const exartaABI = [{ inputs: [{ internalType: "uint256", name: "id", type: "uint256" }, { internalType: "uint256", name: "amount", type: "uint256" }], name: "checkin", outputs: [], stateMutability: "nonpayable", type: "function" }] as const;
const zombieABI = [{ inputs: [{ internalType: "string", name: "_id", type: "string" }, { internalType: "string", name: "_symbol", type: "string" }], name: "buy", outputs: [], stateMutability: "payable", type: "function" }] as const;

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

const formatTimeRemaining = (seconds: number) => {
  if (seconds <= 0) return "Ready!";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
};

const toHexAddress = (addr: string): `0x${string}` => addr as `0x${string}`;

// Get user rank badge
const getUserBadge = (score: number) => {
  if (score >= 1000) return { label: "LEGEND", icon: "👑", color: "#ffd700", glow: "#ffd70080", bg: "linear(135deg, #ffd70020, #ffd70005)", minScore: 1000 };
  if (score >= 500) return { label: "ELITE", icon: "⚡", color: "#c0c0c0", glow: "#c0c0c080", bg: "linear(135deg, #c0c0c020, #c0c0c005)", minScore: 500 };
  if (score >= 250) return { label: "ACTIVE", icon: "🔥", color: "#ff6b35", glow: "#ff6b3580", bg: "linear(135deg, #ff6b3520, #ff6b3505)", minScore: 250 };
  if (score >= 100) return { label: "RISING", icon: "⭐", color: "#c084fc", glow: "#c084fc80", bg: "linear(135deg, #c084fc20, #c084fc05)", minScore: 100 };
  if (score >= 50) return { label: "BEGINNER", icon: "🌿", color: "#4ade80", glow: "#4ade8080", bg: "linear(135deg, #4ade8020, #4ade8005)", minScore: 50 };
  return { label: "NEW", icon: "✨", color: "#9ca3af", glow: "#9ca3af80", bg: "linear(135deg, #9ca3af20, #9ca3af05)", minScore: 0 };
};

// Campaign ABI
const campaignABI = [
  { inputs: [], name: "campaignStartTime", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "campaignActive", outputs: [{ internalType: "bool", name: "", type: "bool" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "campaignScheduled", outputs: [{ internalType: "bool", name: "", type: "bool" }], stateMutability: "view", type: "function" },
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

// Types
interface PaymentModalData {
  action: typeof PARTNER_ACTIONS[0];
  txHash: string;
}

interface SuccessModalData {
  actionName: string;
  actionHandle?: string;
  points: number;
  txHash: string;
  totalCount?: number;
}

// Leaderboard Modal Component
function LeaderboardModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [userRank, setUserRank] = useState<{ rank: number; score: number; total_users: number } | null>(null);
  const { address } = useAccount();
  const toast = useToast();

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const response = await fetch('/.netlify/functions/leaderboard');
      const data = await response.json();
      if (data.leaderboard) {
        setLeaderboard(data.leaderboard);
      }
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRank = async () => {
    if (!address) return;
    try {
      const response = await fetch(`/.netlify/functions/leaderboard?userAddress=${address}`);
      const data = await response.json();
      if (data.rank !== undefined) {
        setUserRank(data);
      }
    } catch (error) {
      console.error("Failed to fetch user rank:", error);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const response = await fetch(`/.netlify/functions/leaderboard?search=${encodeURIComponent(searchTerm)}`);
      const data = await response.json();
      if (data.users) {
        setSearchResults(data.users);
      }
    } catch (error) {
      toast({ title: "Search failed", description: "Please try again", status: "error", duration: 3000 });
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLeaderboard();
      fetchUserRank();
    }
  }, [isOpen, address]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchTerm) {
        handleSearch();
      } else {
        setSearchResults([]);
      }
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  const displayData = searchResults.length > 0 ? searchResults : leaderboard;

  const getBadgeStyle = (score: number) => {
    if (score >= 1000) return { label: "LEGEND", icon: "👑", color: "#ffd700" };
    if (score >= 500) return { label: "ELITE", icon: "⚡", color: "#c0c0c0" };
    if (score >= 250) return { label: "ACTIVE", icon: "🔥", color: "#ff6b35" };
    if (score >= 100) return { label: "RISING", icon: "⭐", color: "#c084fc" };
    if (score >= 50) return { label: "BEGINNER", icon: "🌿", color: "#4ade80" };
    return { label: "NEW", icon: "✨", color: "#9ca3af" };
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered scrollBehavior="inside">
      <ModalOverlay backdropFilter="blur(10px)" />
      <ModalContent bg="rgba(8,8,20,0.98)" border="1px solid rgba(139,92,246,0.4)" borderRadius="2xl" maxW="800px">
        <ModalCloseButton color="gray.400" />
        
        <ModalBody py={6}>
          <VStack spacing={5} align="stretch">
            <HStack justify="space-between">
              <HStack spacing={2}>
                <Text fontSize="24px" fontWeight="800" bgGradient="linear(135deg, #c084fc, #ec4899)" bgClip="text">🏆 Leaderboard</Text>
                <Badge bg="#c084fc" color="white">Top 50</Badge>
              </HStack>
              <Text fontSize="xs" color="gray.500">Live • Real-time scores</Text>
            </HStack>

            {address && userRank && (
              <Box bg="rgba(139,92,246,0.1)" borderRadius="xl" p={4} border="1px solid rgba(139,92,246,0.3)">
                <HStack justify="space-between" wrap="wrap" spacing={4}>
                  <HStack spacing={3}>
                    <Text fontSize="sm" color="gray.400">Your Rank</Text>
                    {userRank.rank ? (
                      <Badge fontSize="lg" px={3} py={1} borderRadius="full" bgGradient="linear(135deg, #c084fc, #ec4899)" color="white">
                        #{userRank.rank}
                      </Badge>
                    ) : (
                      <Badge fontSize="sm" px={3} py={1} borderRadius="full" bg="gray.600" color="gray.300">
                        Unranked
                      </Badge>
                    )}
                  </HStack>
                  <HStack spacing={3}>
                    <Text fontSize="sm" color="gray.400">Your Score</Text>
                    <Text fontSize="xl" fontWeight="800" color="#c084fc">{userRank.score} pts</Text>
                  </HStack>
                  <HStack spacing={3}>
                    <Text fontSize="sm" color="gray.400">Total Users</Text>
                    <Text fontSize="lg" fontWeight="700" color="#4ade80">{userRank.total_users || 0}</Text>
                  </HStack>
                </HStack>
                {!userRank.rank && userRank.score === 0 && (
                  <Text fontSize="xs" color="gray.500" mt={2} textAlign="center">
                    💡 Complete an action to appear on the leaderboard!
                  </Text>
                )}
              </Box>
            )}

            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <SearchIcon color="gray.500" />
              </InputLeftElement>
              <Input
                placeholder="Search by wallet address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                bg="rgba(0,0,0,0.3)"
                border="1px solid rgba(139,92,246,0.3)"
                _hover={{ borderColor: "rgba(139,92,246,0.5)" }}
                _focus={{ borderColor: "#c084fc", boxShadow: "0 0 0 1px #c084fc" }}
                color="white"
                borderRadius="full"
              />
            </InputGroup>

            {loading ? (
              <Flex justify="center" py={10}>
                <Spinner size="xl" color="#c084fc" />
              </Flex>
            ) : displayData.length === 0 ? (
              <Box textAlign="center" py={10}>
                <Text fontSize="lg" color="gray.500">No users found</Text>
                <Text fontSize="sm" color="gray.600" mt={2}>Be the first to complete an action!</Text>
              </Box>
            ) : (
              <TableContainer>
                <Table variant="unstyled" size="sm">
                  <Thead>
                    <Tr borderBottom="1px solid rgba(139,92,246,0.2)">
                      <Th color="gray.500" fontSize="xs" fontWeight="500" fontFamily="mono">RANK</Th>
                      <Th color="gray.500" fontSize="xs" fontWeight="500" fontFamily="mono">WALLET</Th>
                      <Th color="gray.500" fontSize="xs" fontWeight="500" fontFamily="mono" isNumeric>SCORE</Th>
                      <Th color="gray.500" fontSize="xs" fontWeight="500" fontFamily="mono">BADGE</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {displayData.map((user, idx) => {
                      const badge = getBadgeStyle(user.score);
                      const isCurrentUser = address && user.address.toLowerCase() === address.toLowerCase();
                      return (
                        <Tr 
                          key={idx} 
                          borderBottom="1px solid rgba(139,92,246,0.1)"
                          bg={isCurrentUser ? "rgba(139,92,246,0.15)" : "transparent"}
                          _hover={{ bg: "rgba(139,92,246,0.08)" }}
                          transition="all 0.2s"
                        >
                          <Td>
                            <Text fontWeight="700" color={user.rank <= 3 ? "#fbbf24" : "gray.400"} fontSize="md">
                              #{user.rank}
                            </Text>
                          </Td>
                          <Td>
                            <HStack spacing={2}>
                              <Text fontWeight="500" color={isCurrentUser ? "#c084fc" : "white"} fontSize="sm" fontFamily="mono">
                                {user.truncated_address || user.address.slice(0, 6) + '...' + user.address.slice(-4)}
                              </Text>
                              {isCurrentUser && (
                                <Badge bg="#c084fc20" color="#c084fc" fontSize="9px" px={2}>You</Badge>
                              )}
                            </HStack>
                          </Td>
                          <Td isNumeric>
                            <Text fontWeight="700" color="#c084fc" fontSize="md">{user.score}</Text>
                          </Td>
                          <Td>
                            <Badge bg={`${badge.color}20`} color={badge.color} px={2} py={1} borderRadius="full" fontSize="10px" fontWeight="600">
                              {badge.icon} {badge.label}
                            </Badge>
                          </Td>
                        </Tr>
                      );
                    })}
                  </Tbody>
                </Table>
              </TableContainer>
            )}

            {searchTerm && searchResults.length > 0 && (
              <Text fontSize="xs" color="gray.500" textAlign="center">
                Found {searchResults.length} result(s)
              </Text>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter borderTop="1px solid rgba(139,92,246,0.15)" py={4}>
          <HStack spacing={4} justify="center" w="full">
            <Text fontSize="10px" color="gray.500">🏆 Top 50 users by reputation score</Text>
            <Text fontSize="10px" color="gray.500">🔄 Updates in real-time</Text>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default function ActivityReputation() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const toast = useToast();
  useColorMode();

  // Refs for scroll position
  const scrollPositionRef = useRef<number>(0);

  // Save scroll position before any action
  const saveScrollPosition = useCallback(() => {
    scrollPositionRef.current = window.scrollY;
  }, []);

  // Restore scroll position after action
  const restoreScrollPosition = useCallback(() => {
    setTimeout(() => {
      window.scrollTo({ top: scrollPositionRef.current, behavior: 'instant' });
    }, 100);
  }, []);

  // UI State
  const [isTxPending, setIsTxPending] = useState(false);
  const [actionPendingPayment, setActionPendingPayment] = useState<{ [key: number]: boolean }>({});

  // Payment Modal State (first step - after successful payment)
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentModalData | null>(null);

  // Success Modal State (second step - after execution)
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState<SuccessModalData | null>(null);

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

  // Leaderboard Modal State
  const { isOpen: isLeaderboardOpen, onOpen: onLeaderboardOpen, onClose: onLeaderboardClose } = useDisclosure();

  const isCorrectChain = chainId === SONEIUM_CHAIN_ID;

  // ================= CITIRE COOLDOWN DIN CONTRACT PER ACȚIUNE =================
  const cooldownData = PARTNER_ACTIONS.map(action =>
    useReadContract({
      address: toHexAddress(AGENT_GATEWAY_CONTRACT),
      abi: agentGatewayABI,
      functionName: "getRemainingCooldown",
      args: address && isCorrectChain ? [address, BigInt(action.id)] : undefined,
      query: {
        enabled: !!address && isCorrectChain,
        refetchInterval: 5000,
      },
    })
  );

  const [cooldownRemaining, setCooldownRemaining] = useState<{ [key: number]: number }>({});

  useEffect(() => {
    const newCooldowns: { [key: number]: number } = {};
    PARTNER_ACTIONS.forEach((action, index) => {
      const data = cooldownData[index]?.data;
      if (data !== undefined && data !== null) {
        const remaining = Number(data);
        if (remaining > 0) {
          newCooldowns[action.id] = remaining;
        }
      }
    });
    setCooldownRemaining(prev => {
      const prevStr = JSON.stringify(prev);
      const newStr = JSON.stringify(newCooldowns);
      if (prevStr !== newStr) {
        return newCooldowns;
      }
      return prev;
    });
  }, [cooldownData.map(d => d.dataUpdatedAt).join(',')]);

  const getRemainingCooldown = (actionId: number): number => {
    return cooldownRemaining[actionId] || 0;
  };

  // ================= CITIRE CAMPAIGN INFO =================
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

  // ================= CITIRE DEFAULT FEE =================
  const { data: defaultFee = 0n } = useReadContract({
    address: toHexAddress(AGENT_GATEWAY_CONTRACT),
    abi: agentGatewayABI,
    functionName: "defaultFee",
    query: { enabled: true },
  });

  // ================= CITIRE USER TOTAL ACTIONS =================
  const { data: userTotalActionsContract = 0n, refetch: refetchTotalActions } = useReadContract({
    address: toHexAddress(AGENT_GATEWAY_CONTRACT),
    abi: agentGatewayABI,
    functionName: "getUserTotalActions",
    args: address ? [address] : undefined,
    query: { enabled: !!address && isConnected && isCorrectChain },
  });

  // ================= CITIRE PARTNER ACTION COUNTS =================
  const userActionCounts = PARTNER_ACTIONS.map((_, index) =>
    useReadContract({
      address: toHexAddress(AGENT_GATEWAY_CONTRACT),
      abi: agentGatewayABI,
      functionName: "getUserActionCount",
      args: address && isCorrectChain ? [address, BigInt(index)] : undefined,
      query: { enabled: !!address && isConnected && isCorrectChain },
    })
  );

  const userPartnerTotal = userActionCounts.reduce((sum, count) => sum + Number(count.data || 0n), 0);

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

  const userTotalScore = Number(userGmCount) + Number(userVoteCount) + Number(userCheckInCount) + Number(userDeployCount) + Number(userAgentGmCount) + userPartnerTotal;
  const userBadge = getUserBadge(userTotalScore);

  const getNextTierTarget = (score: number) => {
    if (score < 50) return 50;
    if (score < 100) return 100;
    if (score < 250) return 250;
    if (score < 500) return 500;
    if (score < 1000) return 1000;
    return 1000;
  };
  const nextTierTarget = getNextTierTarget(userTotalScore);
  const reputationProgress = Math.min(100, (userTotalScore / nextTierTarget) * 100);
  const badgeProgress = Math.min(100, (userTotalScore / minReputationScore) * 100);

  // Funcție reîmprospătare date
  const refetchAllData = async () => {
    await Promise.all([
      refetchUserGmCount(), refetchUserVoteCount(), refetchUserCheckInCount(), refetchUserDeployCount(),
      refetchAgentGmCount(), refetchTotalActions(),
      ...userActionCounts.map(refetch => refetch.refetch()),
    ]);
  };

  // Funcție pentru update leaderboard score
  const updateLeaderboardScore = async (points: number) => {
    if (!address) return;
    try {
      await fetch('/.netlify/functions/update-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: address, points: points }),
      });
    } catch (err) {
      console.error("Failed to update leaderboard:", err);
    }
  };

  // Funcție Share on X cu tag pentru echipa parteneră
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
      let hash: `0x${string}`;
      const zeroAddress = "0x0000000000000000000000000000000000000000";

      switch (action.id) {
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
        case 12:
          hash = await writeContractAsync({ address: toHexAddress(action.target), abi: metaABI, functionName: "mint", args: [1n, "https://gm-agent.xyz/"], value: BigInt(action.externalFee) });
          break;
        case 13:
          hash = await writeContractAsync({ address: toHexAddress(action.target), abi: dmailABI, functionName: "send_mail", args: ["0xe5271cfad1cbf0200337a2dff847239dbd42f8b2a8edec7ada8638d402b3d03d", "0x49f5b25165973e49ca79684733f5645b8fac5ef0e0ce3f3fe0e0742bcc90341f"], value: BigInt(action.externalFee) });
          break;
        case 14:
          hash = await writeContractAsync({ address: toHexAddress(action.target), abi: podsABI, functionName: "safeMint", args: [address as `0x${string}`, "https://gm-agent.xyz/"] });
          break;
        case 15:
          hash = await writeContractAsync({ address: toHexAddress(action.target), abi: startaleABI, functionName: "checkIn" });
          break;
        case 16:
          hash = await writeContractAsync({ address: toHexAddress(action.target), abi: exartaABI, functionName: "checkin", args: [205970022n, 0n] });
          break;
        case 17:
          hash = await writeContractAsync({ address: toHexAddress(action.target), abi: zombieABI, functionName: "buy", args: ["bearstudio.zombie.ads", "ETH"], value: BigInt(action.externalFee) });
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

      <Container maxW="1400px" position="relative" zIndex={1} px={{ base: 4, md: 6, lg: 8 }} py={{ base: 6, md: 8 }}>
        {/* Header - Back button unificat */}
        <Flex justify="space-between" align="center" mb={8} direction={{ base: "column", md: "row" }} gap={4}>
          <HStack spacing={4} animation={`${slideInLeft} 0.6s ease-out`}>
            <Button
              onClick={() => window.history.back()}
              variant="solid"
              bg="rgba(139,92,246,0.2)"
              color="white"
              size="lg"
              leftIcon={<ChevronLeftIcon boxSize={5} />}
              _hover={{ bg: "rgba(139,92,246,0.4)", transform: "scale(1.02)", boxShadow: "0 0 20px rgba(139,92,246,0.4)" }}
              transition="all 0.2s"
              borderRadius="full"
              border="1px solid rgba(139,92,246,0.5)"
              fontWeight="500"
            >
              Back
            </Button>
            <VStack align="start" spacing={1}>
              <HStack spacing={3} flexWrap="wrap">
                <Box w="10px" h="10px" borderRadius="full" bg="#4ade80" animation={`${pulseGlow} 2s ease-in-out infinite`} />
                <Heading fontSize={{ base: "xl", md: "3xl", lg: "4xl" }} fontWeight="800" bgGradient="linear(135deg, #c084fc 0%, #ec4899 40%, #3b82f6 100%)" bgClip="text" letterSpacing="tight">Activity Reputation</Heading>
                <Badge bgGradient="linear(135deg, #8b5cf6, #ec4899)" px={4} py={1.5} rounded="full" fontSize="xs" color="white" boxShadow="0 0 12px rgba(139,92,246,0.6)" fontFamily="mono">✨ Soneium</Badge>
              </HStack>
              <Text color="gray.500" fontSize={{ base: "xs", md: "sm" }} letterSpacing="wider" fontFamily="mono" maxW={{ base: "280px", md: "100%" }}>Track your on-chain legacy across GM, Votes, Check-Ins, Deployments & Partner Actions</Text>
            </VStack>
          </HStack>
          <HStack spacing={3} animation={`${slideInRight} 0.6s ease-out`}>
            <Button
              onClick={onLeaderboardOpen}
              size="md"
              bg="rgba(139,92,246,0.15)"
              border="1px solid rgba(139,92,246,0.4)"
              color="gray.300"
              _hover={{ bg: "rgba(139,92,246,0.3)", color: "white", borderColor: "rgba(139,92,246,0.8)", transform: "scale(1.02)" }}
              borderRadius="full"
              fontSize="sm"
              fontWeight="600"
              px={6}
              py={5}
              leftIcon={<Text fontSize="lg">🏆</Text>}
            >
              Leaderboard
            </Button>
            <Button
              as="a"
              href="https://docs.gm-agent.xyz"
              target="_blank"
              rel="noopener noreferrer"
              size="md"
              bg="rgba(139,92,246,0.15)"
              border="1px solid rgba(139,92,246,0.4)"
              color="gray.300"
              _hover={{ bg: "rgba(139,92,246,0.3)", color: "white", borderColor: "rgba(139,92,246,0.8)", transform: "scale(1.02)" }}
              borderRadius="full"
              fontSize="sm"
              fontWeight="600"
              px={6}
              py={5}
              rightIcon={<ExternalLinkIcon />}
            >
              DOCS
            </Button>
            <Box _hover={{ transform: "scale(1.02)" }} transition="transform 0.3s">
              <ConnectButton chainStatus="full" accountStatus="full" showBalance={false} />
            </Box>
          </HStack>
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

        {/* MAIN CONTENT - No Tabs, just Dashboard directly */}
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

                      {/* Reputation Score Section */}
                      <Box w="full" mt={4}>
                        <Flex justify="space-between" mb={2}>
                          <Text fontSize="sm" color="gray.400" fontFamily="mono">🏆 REPUTATION SCORE</Text>
                          <Text fontWeight="800" color="#c084fc" fontSize="lg">{userTotalScore} / {nextTierTarget}</Text>
                        </Flex>
                        <Box position="relative" mb={2}>
                          <Box h="12px" bg="rgba(139,92,246,0.15)" borderRadius="full" overflow="hidden">
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
                        <Flex justify="space-between" mt={1}>
                          <Text fontSize="xs" color="gray.500">Current: {userTotalScore} pts</Text>
                          <Text fontSize="xs" color="gray.500">Next tier: {nextTierTarget} pts ({nextTierTarget - userTotalScore} to go)</Text>
                        </Flex>
                        <Text fontSize="15px" color="gray.500" mt={1} textAlign="center">✨ Complete activities to reach higher tiers and unlock exclusive benefits ✨</Text>
                      </Box>

                      {/* Total Actions from Contract */}
                      <Box w="full" mt={2} p={4} bg="rgba(0,0,0,0.3)" borderRadius="xl">
                        <Flex justify="space-between" align="center">
                          <HStack spacing={2}>
                            <Text fontSize="sm" color="gray.400">🔄 Total On-Chain Actions</Text>
                            <Tooltip label="Total number of actions tracked by the Agent Gateway contract" hasArrow placement="top">
                              <Box as="span" fontSize="xs" color="gray.500">ⓘ</Box>
                            </Tooltip>
                          </HStack>
                          <Text fontSize="xl" fontWeight="800" color="#c084fc">{Number(userTotalActionsContract)}</Text>
                        </Flex>
                        <Box mt={2}>
                          <Box h="6px" bg="rgba(139,92,246,0.2)" borderRadius="full" overflow="hidden">
                            <Box
                              h="100%"
                              borderRadius="full"
                              bg="#c084fc"
                              transition="width 1s ease-out"
                              width={`${Math.min(100, (Number(userTotalActionsContract) / 100) * 100)}%`}
                            />
                          </Box>
                        </Box>
                        <Text fontSize="12px" color="gray.500" textAlign="center" mt={2}>Each action contributes to your reputation score</Text>
                      </Box>

                      {/* BADGE SECTION - Enhanced with preview image */}
                      <Box w="full" mt={4}>
                        <Text fontSize="lg" fontWeight="700" color="#c084fc" mb={3} textAlign="center">🏅 REPUTATION BADGE</Text>
                        
                        {userBadgeBalance > 0n ? (
                          <Box>
                            <Box position="relative" bg="rgba(139,92,246,0.1)" borderRadius="2xl" border="2px solid #c084fc" p={6} backdropFilter="blur(10px)" boxShadow="0 0 30px rgba(192,132,252,0.3)">
                              <VStack spacing={4}>
                                <Box position="relative" w="140px" h="140px" mx="auto" borderRadius="2xl" overflow="hidden" border="3px solid #c084fc" boxShadow="0 0 25px rgba(192,132,252,0.6)" transition="all 0.3s" _hover={{ transform: "scale(1.05)", boxShadow: "0 0 40px rgba(192,132,252,0.9)" }}>
                                  <Box as="img" src="https://bafybeihyei7jbscpelyes2hlza4z5fpipvxija7g4gotv52hlqa5iq62ca.ipfs.dweb.link/" alt="Reputation Badge NFT" w="100%" h="100%" objectFit="cover" />
                                  <Badge position="absolute" bottom="8px" right="8px" bg="#c084fc" color="white" fontSize="10px" px={2} py={1} borderRadius="full">SBT</Badge>
                                </Box>
                                <Text fontWeight="800" fontSize="xl" color="#c084fc">Reputation Guardian</Text>
                                <Text fontSize="xs" color="gray.400" textAlign="center">Soulbound Token (Non-Transferable) • Forever tied to your wallet</Text>
                                <SimpleGrid columns={3} spacing={4} w="full" pt={2}>
                                  <Box textAlign="center" p={2} bg="rgba(0,0,0,0.3)" borderRadius="lg">
                                    <Text fontSize="9px" color="gray.500">Score Required</Text>
                                    <Text fontSize="md" fontWeight="700" color="#c084fc">{minReputationScore}+</Text>
                                  </Box>
                                  <Box textAlign="center" p={2} bg="rgba(0,0,0,0.3)" borderRadius="lg">
                                    <Text fontSize="9px" color="gray.500">Your Score</Text>
                                    <Text fontSize="md" fontWeight="700" color="#4ade80">{userTotalScore}</Text>
                                  </Box>
                                  <Box textAlign="center" p={2} bg="rgba(0,0,0,0.3)" borderRadius="lg">
                                    <Text fontSize="9px" color="gray.500">Chain</Text>
                                    <Text fontSize="md" fontWeight="700" color="#8b5cf6">Soneium</Text>
                                  </Box>
                                </SimpleGrid>
                                <Divider borderColor="rgba(139,92,246,0.2)" />
                                <Box textAlign="center" p={3} bg="rgba(0,0,0,0.3)" borderRadius="xl" w="full">
                                  <Text fontSize="sm" fontWeight="600" color="#fbbf24">🎉 Congratulations! 🎉</Text>
                                  <Text fontSize="xs" color="gray.400" mt={1}>You are now a verified member of the Soneium community!</Text>
                                </Box>
                                <SimpleGrid columns={2} spacing={2} w="full">
                                  <HStack spacing={1} p={1}><Text fontSize="10px" color="#4ade80">✓</Text><Text fontSize="10px" color="gray.400">Verified Status</Text></HStack>
                                  <HStack spacing={1} p={1}><Text fontSize="10px" color="#4ade80">✓</Text><Text fontSize="10px" color="gray.400">DAO Voting Power</Text></HStack>
                                  <HStack spacing={1} p={1}><Text fontSize="10px" color="#4ade80">✓</Text><Text fontSize="10px" color="gray.400">Exclusive Access</Text></HStack>
                                  <HStack spacing={1} p={1}><Text fontSize="10px" color="#4ade80">✓</Text><Text fontSize="10px" color="gray.400">Future Airdrops</Text></HStack>
                                </SimpleGrid>
                                <Button size="sm" variant="link" color="#c084fc" fontSize="10px" onClick={() => window.open(`https://soneium.blockscout.com/address/${BADGE_CONTRACT}`, '_blank')}>📜 View Badge Contract on Explorer</Button>
                              </VStack>
                            </Box>
                          </Box>
                        ) : userIsAgent && userTotalScore >= minReputationScore ? (
                          <Box>
                            <Box position="relative" bg="rgba(139,92,246,0.08)" borderRadius="2xl" border="1px dashed rgba(139,92,246,0.4)" p={5} mb={4}>
                              <VStack spacing={3}>
                                <Box position="relative" w="100px" h="100px" mx="auto" borderRadius="xl" overflow="hidden" opacity={0.6} filter="grayscale(50%)">
                                  <Box as="img" src="https://bafybeihyei7jbscpelyes2hlza4z5fpipvxija7g4gotv52hlqa5iq62ca.ipfs.dweb.link/" alt="Reputation Badge Preview" w="100%" h="100%" objectFit="cover" />
                                  <Box position="absolute" inset={0} bg="rgba(0,0,0,0.5)" display="flex" alignItems="center" justifyContent="center">
                                    <Badge bg="#c084fc" fontSize="10px">LOCKED</Badge>
                                  </Box>
                                </Box>
                                <Text fontWeight="700" fontSize="md" color="#c084fc">Exclusive Reputation Badge</Text>
                                <Text fontSize="xs" color="gray.400" textAlign="center">You've earned the right to mint this badge!</Text>
                                <Button onClick={handleMintBadge} isLoading={isTxPending} w="full" size="lg" bgGradient="linear(135deg, #c084fc, #ec4899)" color="white" fontWeight="700" leftIcon={<Text fontSize="xl">🏅</Text>} _hover={{ transform: "scale(1.02)", boxShadow: "0 0 30px #c084fc" }}>MINT REPUTATION BADGE</Button>
                                <Text fontSize="10px" color="gray.500" textAlign="center">✓ You have {minReputationScore}+ reputation points • Click to mint your SBT badge</Text>
                              </VStack>
                            </Box>
                          </Box>
                        ) : userIsAgent ? (
                          <Box>
                            <Box position="relative" bg="rgba(139,92,246,0.05)" borderRadius="2xl" border="1px solid rgba(139,92,246,0.2)" p={5}>
                              <VStack spacing={3} align="stretch">
                                <Box position="relative" w="100px" h="100px" mx="auto" borderRadius="xl" overflow="hidden" filter="blur(4px)" opacity={0.5}>
                                  <Box as="img" src="https://bafybeihyei7jbscpelyes2hlza4z5fpipvxija7g4gotv52hlqa5iq62ca.ipfs.dweb.link/" alt="Badge Preview" w="100%" h="100%" objectFit="cover" />
                                </Box>
                                <Text fontWeight="700" fontSize="md" color="#9ca3af" textAlign="center">🔒 Reputation Badge (Locked)</Text>
                                <Text fontSize="xs" color="gray.500" textAlign="center">Exclusive badge for active community members</Text>
                                
                                <Box mt={2} p={3} bg="rgba(0,0,0,0.3)" borderRadius="lg">
                                  <Flex justify="space-between" mb={2}>
                                    <Text fontSize="xs" color="gray.400" fontWeight="600">BADGE REQUIREMENTS</Text>
                                    <Text fontSize="xs" color="#c084fc" fontWeight="700">{userTotalScore} / {minReputationScore}</Text>
                                  </Flex>
                                  <Box h="8px" bg="rgba(139,92,246,0.2)" borderRadius="full" overflow="hidden" mb={2}>
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
                                  <Flex justify="space-between" align="center" mt={2}>
                                    <HStack spacing={1}>
                                      <Text fontSize="10px" color="#fbbf24">⭐</Text>
                                      <Text fontSize="10px" color="gray.400">Points needed:</Text>
                                    </HStack>
                                    <Text fontSize="sm" fontWeight="800" color="#c084fc">{minReputationScore - userTotalScore} more points</Text>
                                  </Flex>
                                </Box>

                                <Divider my={2} borderColor="rgba(139,92,246,0.15)" />
                                
                                <VStack spacing={2} align="start">
                                  <Text fontSize="10px" color="gray.500" fontWeight="600">✨ BADGE BENEFITS:</Text>
                                  <HStack spacing={2}><Text fontSize="10px" color="#4ade80">✓</Text><Text fontSize="10px" color="gray.400">Verified Reputation Status</Text></HStack>
                                  <HStack spacing={2}><Text fontSize="10px" color="#4ade80">✓</Text><Text fontSize="10px" color="gray.400">Exclusive Community Access</Text></HStack>
                                  <HStack spacing={2}><Text fontSize="10px" color="#4ade80">✓</Text><Text fontSize="10px" color="gray.400">On-Chain Achievement Proof</Text></HStack>
                                  <HStack spacing={2}><Text fontSize="10px" color="#4ade80">✓</Text><Text fontSize="10px" color="gray.400">Future Airdrop Eligibility</Text></HStack>
                                </VStack>

                                <Box mt={3} p={3} bg="rgba(139,92,246,0.1)" borderRadius="lg" border="1px solid rgba(139,92,246,0.2)">
                                  <Text fontSize="10px" color="gray.400" textAlign="center">💡 Complete more activities to unlock the badge! Each partner action gives you +1 point.</Text>
                                </Box>
                              </VStack>
                            </Box>
                          </Box>
                        ) : (
                          <Box textAlign="center" p={5} bg="rgba(139,92,246,0.05)" borderRadius="xl" border="1px dashed rgba(139,92,246,0.3)">
                            <Text fontSize="sm" color="gray.500">🔒 Register as Agent to unlock Badge System</Text>
                          </Box>
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
                            <Box h="8px" bg="rgba(255,255,255,0.05)" borderRadius="full" overflow="hidden" mb={2}>
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

            {/* Partner Actions */}
            <Box>
              <Box bg="rgba(8,8,20,0.8)" backdropFilter="blur(24px)" borderRadius="3xl" border="1px solid rgba(139,92,246,0.3)" overflow="hidden" transition="all 0.4s" _hover={{ borderColor: "rgba(139,92,246,0.6)", transform: "translateY(-5px)" }}>
                <Box h="4px" bgGradient="linear(90deg, #fbbf24, #ec4899, #8b5cf6, #fbbf24)" backgroundSize="300% 100%" animation={`${shimmer} 4s ease infinite`} />
                <Box p={8}>
                  <HStack spacing={2} mb={6}>
                    <Box w="4px" h="4px" borderRadius="full" bg="#fbbf24" animation={`${pulseGlow} 2s infinite`} />
                    <Heading size="md" color="gray.300" fontWeight="600">🤝 Partner Actions</Heading>
                    <Badge bg="#fbbf24" color="black" ml={2}>18 Actions Available</Badge>
                  </HStack>

                  <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                    {PARTNER_ACTIONS.map((action, index) => {
                      const hasPaidForThisSession = actionPendingPayment[action.id] === true;
                      const totalExecutedCount = Number(userActionCounts[index]?.data || 0n);
                      const frontendCooldown = getRemainingCooldown(action.id);
                      const isOnCooldown = frontendCooldown > 0;

                      return (
                        <Box key={action.id} bg="rgba(0,0,0,0.4)" borderRadius="2xl" border={`1.5px solid ${action.color}30`} p={5} transition="all 0.3s ease-in-out" _hover={{ borderColor: action.color, transform: "translateY(-6px)", boxShadow: `0 10px 30px ${action.color}20`, bg: "rgba(0,0,0,0.6)" }}>
                          <VStack spacing={3}>
                            <HStack w="full" justify="space-between">
                              <HStack spacing={2}>
                                <Box w="36px" h="36px" bg="rgba(255,255,255,0.05)" borderRadius="xl" display="flex" alignItems="center" justifyContent="center">
                                  <Image src={action.logo} boxSize="24px" borderRadius="full" fallbackSrc="https://via.placeholder.com/24" />
                                </Box>
                                <HStack spacing={3}>
                                  <Text fontWeight="700" color="white" fontSize="md">{action.name}</Text>
                                  {action.twitterUrl && action.twitterHandle && (
                                    <Tooltip label={`Follow ${action.twitterHandle} on X`} hasArrow placement="top">
                                      <Link href={action.twitterUrl} isExternal _hover={{ transform: "scale(1.1)" }} transition="transform 0.2s">
                                        <Icon as={FaTwitter} boxSize="20px" color="#1DA1F2" />
                                      </Link>
                                    </Tooltip>
                                  )}
                                </HStack>
                              </HStack>
                              <Badge bg={`${action.color}20`} color={action.color} fontSize="xs" px={2.5} py={1} borderRadius="full" fontWeight="600">
                                <HStack spacing={1}>
                                  <Text>⭐</Text>
                                  <Text>+{action.points}</Text>
                                </HStack>
                              </Badge>
                            </HStack>

                            <HStack w="full" justify="space-between">
                              <Text fontSize="xs" color="gray.400" fontWeight="500">Status:</Text>
                              <Badge bg={hasPaidForThisSession ? "#22c55e20" : isOnCooldown ? "#fbbf2420" : "#fbbf2420"} color={hasPaidForThisSession ? "#22c55e" : isOnCooldown ? "#fbbf24" : "#fbbf24"} fontSize="xs" px={2.5} py={1} borderRadius="full" fontWeight="600">
                                {hasPaidForThisSession ? "✓ Ready" : isOnCooldown ? "⏳ Cooldown" : "⏳ Pay First"}
                              </Badge>
                            </HStack>

                            <HStack w="full" justify="space-between">
                              <Text fontSize="xs" color="gray.400" fontWeight="500">Total Completed:</Text>
                              <Text fontSize="md" fontWeight="700" color={action.color}>{totalExecutedCount}x</Text>
                            </HStack>

                            <HStack w="full" justify="space-between">
                              <Text fontSize="xs" color="gray.400" fontWeight="500">Next available:</Text>
                              <Text fontSize="sm" fontWeight="700" color={totalExecutedCount === 0 ? "#22c55e" : (frontendCooldown === 0 ? "#22c55e" : "#fbbf24")}>
                                {totalExecutedCount === 0 ? "✓ Ready" : (frontendCooldown === 0 ? "✓ Ready" : formatTimeRemaining(frontendCooldown))}
                              </Text>
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
                              bg={!hasPaidForThisSession ? `linear-gradient(135deg, ${action.color}, ${action.color}cc)` : `linear-gradient(135deg, ${action.color}, ${action.color}cc)`}
                              color="white"
                              fontWeight="bold"
                              fontSize="sm"
                              py={2.5}
                              isLoading={isTxPending}
                              isDisabled={!hasPaidForThisSession && isOnCooldown}
                              _hover={{ opacity: 0.9, transform: "scale(1.02)", boxShadow: `0 0 15px ${action.color}80` }}
                              borderRadius="full"
                              onClick={() => !hasPaidForThisSession ? handlePayAndApprove(action) : handleExecutePartnerAction(action)}
                            >
                              {!hasPaidForThisSession ? (isOnCooldown ? `⏳ Cooldown (${formatTimeRemaining(frontendCooldown)})` : `💰 Pay & Interact (${formatFee(defaultFee)} ETH)`) : `✨ ${action.name.split(" ")[0]} ✨`}
                            </Button>

                            {!hasPaidForThisSession && !isOnCooldown && (
                              <Text fontSize="xs" color="gray.500" textAlign="center" mt={1}>
                                💡 {totalExecutedCount === 0 ? "Pay & Interact to earn points!" : "Pay & Interact again to earn more points!"}
                              </Text>
                            )}
                            {isOnCooldown && !hasPaidForThisSession && (
                              <Text fontSize="xs" color="gray.500" textAlign="center" mt={1}>⏰ Come back in {formatTimeRemaining(frontendCooldown)} to do this action again</Text>
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
        <Modal isOpen={showPaymentModal} onClose={() => { setShowPaymentModal(false); setPaymentData(null); }} isCentered size="md">
          <ModalOverlay backdropFilter="blur(10px)" />
          <ModalContent bg="rgba(8,8,20,0.98)" border="1px solid rgba(139,92,246,0.4)" borderRadius="2xl" mx={4}>
            <ModalCloseButton color="gray.400" />
            <ModalBody py={8}>
              <VStack spacing={6}>
                <Box fontSize="56px">✅</Box>
                <Text fontSize="24px" fontWeight="800" bgGradient="linear(135deg, #22c55e, #16a34a)" bgClip="text">PAYMENT SUCCESSFUL!</Text>
                <Badge bg="#22c55e20" color="#22c55e" px={4} py={2} borderRadius="full" fontSize="md">Transaction Confirmed</Badge>

                <Box w="full" bg="rgba(0,0,0,0.4)" borderRadius="xl" p={4}>
                  <VStack spacing={3} align="stretch">
                    <HStack justify="space-between">
                      <Text color="gray.400" fontSize="sm">Action</Text>
                      <Text fontWeight="600" color="white" fontSize="sm">{paymentData?.action.fullName}</Text>
                    </HStack>
                    <Divider borderColor="rgba(139,92,246,0.2)" />
                    <HStack justify="space-between">
                      <Text color="gray.400" fontSize="sm">Fee Paid</Text>
                      <Text fontWeight="600" color="#22c55e" fontSize="sm">{formatFee(defaultFee)} ETH</Text>
                    </HStack>
                    <Divider borderColor="rgba(139,92,246,0.2)" />
                    <HStack justify="space-between">
                      <Text color="gray.400" fontSize="sm">Transaction Hash</Text>
                      <Link href={`https://soneium.blockscout.com/tx/${paymentData?.txHash}`} isExternal>
                        <Text fontSize="sm" fontFamily="mono" color="#c084fc" _hover={{ textDecoration: "underline" }}>{truncateAddress(paymentData?.txHash || "")}</Text>
                      </Link>
                    </HStack>
                  </VStack>
                </Box>

                <Text fontSize="md" fontWeight="500" textAlign="center" color="gray.300">
                  Payment confirmed! Now you can execute the action to earn points.
                </Text>

                <Button
                  bgGradient={`linear(135deg, ${paymentData?.action.color || "#8b5cf6"}, ${paymentData?.action.color || "#ec4899"}cc)`}
                  color="white"
                  size="lg"
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

                <Text fontSize="xs" color="gray.500" textAlign="center">
                  💡 Click above to complete your action and earn +{paymentData?.action.points} reputation point!
                </Text>
              </VStack>
            </ModalBody>
            <ModalFooter pt={0} pb={6}>
              <Text fontSize="xs" color="gray.500" textAlign="center" w="full">
                You have paid the protocol fee. Now confirm the second transaction to complete the action.
              </Text>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Unified Success Modal */}
        <Modal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)} isCentered size="lg">
          <ModalOverlay backdropFilter="blur(10px)" />
          <ModalContent bg="rgba(8,8,20,0.98)" border="1px solid rgba(139,92,246,0.4)" borderRadius="2xl" mx={4}>
            <ModalCloseButton color="gray.400" />
            <ModalBody py={8}>
              <VStack spacing={6}>
                <Box fontSize="56px">🌅</Box>
                <Text fontSize="24px" fontWeight="800" bgGradient="linear(135deg, #c084fc, #ec4899)" bgClip="text">DAILY RITUAL</Text>
                <Badge bg="#22c55e20" color="#22c55e" px={4} py={2} borderRadius="full" fontSize="md">Action Completed! ✨</Badge>

                <Box w="full" bg="rgba(0,0,0,0.4)" borderRadius="xl" p={4}>
                  <VStack spacing={3} align="stretch">
                    <HStack justify="space-between">
                      <Text color="gray.400" fontSize="sm">Network</Text>
                      <HStack><Badge bg="#8b5cf6" color="white">Soneium</Badge><Text fontSize="xs" color="gray.500">Chain ID: 1868</Text></HStack>
                    </HStack>
                    <Divider borderColor="rgba(139,92,246,0.2)" />
                    <HStack justify="space-between">
                      <Text color="gray.400" fontSize="sm">Transaction</Text>
                      <Text fontWeight="600" color="white" fontSize="sm">{successData?.actionName}</Text>
                    </HStack>
                    <Divider borderColor="rgba(139,92,246,0.2)" />
                    <HStack justify="space-between">
                      <Text color="gray.400" fontSize="sm">Points Earned</Text>
                      <Text fontWeight="700" color="#fbbf24" fontSize="lg">+{successData?.points}</Text>
                    </HStack>
                    <Divider borderColor="rgba(139,92,246,0.2)" />
                    <HStack justify="space-between">
                      <Text color="gray.400" fontSize="sm">Total Completed</Text>
                      <Text fontWeight="700" color="#22c55e" fontSize="md">{successData?.totalCount}x</Text>
                    </HStack>
                    <Divider borderColor="rgba(139,92,246,0.2)" />
                    <HStack justify="space-between">
                      <Text color="gray.400" fontSize="sm">Transaction Hash</Text>
                      <Link href={`https://soneium.blockscout.com/tx/${successData?.txHash}`} isExternal>
                        <Text fontSize="sm" fontFamily="mono" color="#c084fc" _hover={{ textDecoration: "underline" }}>{truncateAddress(successData?.txHash || "")}</Text>
                      </Link>
                    </HStack>
                  </VStack>
                </Box>

                <Text fontSize="md" fontWeight="500" textAlign="center" color="gray.300">
                  {successData?.actionName === "GM" 
                    ? `Good morning! You've sent GM on Soneium!` 
                    : `You've completed ${successData?.actionName} on Soneium!`}
                </Text>

                <HStack spacing={3} w="full">
                  <Button
                    leftIcon={<FaTwitter />}
                    bg="#1DA1F2"
                    color="white"
                    flex={1}
                    size="md"
                    borderRadius="full"
                    _hover={{ opacity: 0.9, transform: "scale(1.02)" }}
                    onClick={() => shareOnX(successData?.actionName || "", successData?.actionHandle, successData?.points || 0)}
                  >
                    Share on X
                  </Button>
                  <Button
                    leftIcon={<CopyIcon />}
                    variant="outline"
                    borderColor="rgba(139,92,246,0.5)"
                    color="gray.300"
                    flex={1}
                    size="md"
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
                    size="md"
                    borderRadius="full"
                    _hover={{ bg: "rgba(139,92,246,0.4)" }}
                    onClick={() => window.open(`https://soneium.blockscout.com/tx/${successData?.txHash}`, '_blank')}
                  >
                    Explorer
                  </Button>
                </HStack>
              </VStack>
            </ModalBody>
            <ModalFooter pt={0} pb={6}>
              <Text fontSize="xs" color="gray.500" textAlign="center" w="full">
                🌅 💬✨ Just completed on Soneium! ✨💬🌅
              </Text>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Container>

      {/* Footer */}
      <Box pt={6} pb={4} bg="black" borderTop="1px solid" borderColor="rgba(139,92,246,0.15)" position="relative">
        <Box maxW="container.lg" mx="auto" px={{ base: 4, md: 6 }}>
          {/* Text centrat */}
          <VStack spacing={2} w="full">
            <Divider opacity={0.3} borderColor="rgba(139,92,246,0.3)" maxW="300px" />
            <Text fontSize="xs" fontWeight="500" letterSpacing="0.08em" fontFamily="mono" color="gray.400" textAlign="center">
              © 2026 • Activity Reputation • Soneium Mainnet
            </Text>
            <HStack spacing={4} justify="center" flexWrap="wrap" align="center">
              <Text fontSize="xs" color="gray.500" fontWeight="500" letterSpacing="0.1em" _hover={{ color: "gray.400" }} transition="color 0.2s">
                🔗 ON-CHAIN TRACKING
              </Text>
              <Box w="2px" h="2px" borderRadius="full" bg="gray.600" />
              <Text fontSize="xs" color="gray.500" fontWeight="500" letterSpacing="0.1em" _hover={{ color: "gray.400" }} transition="color 0.2s">
                ⚡ REAL-TIME
              </Text>
              <Box w="2px" h="2px" borderRadius="full" bg="gray.600" />
              <Text fontSize="xs" color="gray.500" fontWeight="500" letterSpacing="0.1em" _hover={{ color: "gray.400" }} transition="color 0.2s">
                🛡️ SECURE
              </Text>
              <Box w="2px" h="2px" borderRadius="full" bg="gray.600" />
              <Text fontSize="xs" color="gray.500" fontWeight="500" letterSpacing="0.1em" _hover={{ color: "gray.400" }} transition="color 0.2s">
                🌐 DECENTRALIZED
              </Text>
            </HStack>
            <Text fontSize="9px" color="gray.500" fontFamily="mono" letterSpacing="0.1em" fontWeight="400" textTransform="uppercase" textAlign="center">
              ACTIVITY REPUTATION SYSTEM — BUILD YOUR ON-CHAIN LEGACY
            </Text>
          </VStack>
        </Box>
        
        {/* Social Icons - poziționate absolut în dreapta */}
        <HStack 
          spacing={3} 
          position="absolute" 
          right={{ base: "50%", md: "15%" }}
          bottom={{ base: "auto", md: "50%" }}
          top={{ base: "auto", md: "50%" }}
          transform={{ base: "none", md: "translateY(-50%)" }}
          mt={{ base: 4, md: 0 }}
          justify="center"
        >
          <Text fontSize="9px" color="gray.500" letterSpacing="wider" display={{ base: "none", md: "block" }}>
            FOLLOW
          </Text>
          <Box w="1px" h="16px" bg="rgba(139,92,246,0.3)" display={{ base: "none", md: "block" }} />
          
          <Tooltip label="X (Twitter) - @silviu_asy" hasArrow placement="top">
            <Box
              as="a"
              href="https://x.com/silviu_asy"
              target="_blank"
              rel="noopener noreferrer"
              w="28px"
              h="28px"
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
                width="14px"
                height="14px"
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
              w="28px"
              h="28px"
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
                width="14px"
                height="14px"
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
              w="28px"
              h="28px"
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
                width="14px"
                height="14px"
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
              w="28px"
              h="28px"
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
                width="14px"
                height="14px"
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

      <TransactionModal isOpen={txOpen} status={txStatus} title={txTitle} description={txDesc} onClose={() => { setTxOpen(false); setTimeout(() => { if (txStatus === "success" || txStatus === "rejected" || txStatus === "failed") { setTxStatus("idle"); setTxTitle(""); setTxDesc(""); } }, 300); }} />
    </Box>
  );
}

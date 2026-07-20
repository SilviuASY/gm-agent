// src/pages/Attestation.tsx
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
  useToast,
  Skeleton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Link,
  Icon,
  Divider,
  Tooltip,
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
import { useState, useEffect, useMemo, useCallback } from "react";
import { ChevronLeftIcon, ExternalLinkIcon, CheckCircleIcon, RepeatIcon } from "@chakra-ui/icons";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { useNavigate } from "react-router-dom";

import { useFixScroll } from "../hooks/useFixScroll";
import { SONEIUM_CHAIN_ID, API_URL, REPUTATION_ATTESTER_CONTRACT } from "../constants/contracts";

// ============= ABI =============
const attesterABI = [
  {
    inputs: [
      { internalType: "uint256", name: "score", type: "uint256" },
      { internalType: "uint256", name: "txCount", type: "uint256" },
      { internalType: "uint256", name: "walletAgeDays", type: "uint256" },
      { internalType: "uint256", name: "gmStreak", type: "uint256" },
      { internalType: "uint256", name: "deployCount", type: "uint256" },
      { internalType: "uint256", name: "deadline", type: "uint256" },
      { internalType: "bytes", name: "signature", type: "bytes" },
    ],
    name: "mintAttestation",
    outputs: [{ internalType: "bytes32", name: "uid", type: "bytes32" }],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "wallet", type: "address" }],
    name: "latestAttestationUID",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "attestFee",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalAttestationsMinted",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

const EASSCAN_ADDRESS_URL = "https://soneium.easscan.org/address/";
const ZERO_UID = "0x0000000000000000000000000000000000000000000000000000000000000000";

// ============= Types =============
interface ReputationProfile {
  score: number;
  txCount: number;
  walletAgeDays: number;
  gmStreak: number;
  deployCount: number;
  nonce: string;
  deadline: number;
  attestFee: string;
  signature: `0x${string}`;
}

// ============= Motion =============
const MotionBox = motion(Box);

// ============= Styles =============
const pageStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap');
  @keyframes floatCard { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-7px); } }
  @keyframes shimmerBorder { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
  @keyframes pulseGlow { 0%, 100% { opacity: 0.55; } 50% { opacity: 1; } }
  @keyframes orbFloat { 0%, 100% { transform: scale(1) translateY(0px); opacity: 0.45; } 50% { transform: scale(1.1) translateY(-20px); opacity: 0.7; } }
  @keyframes countUp { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes successPop {
    0%   { transform: scale(0.75) translateY(16px); opacity: 0; }
    65%  { transform: scale(1.04) translateY(-3px); opacity: 1; }
    100% { transform: scale(1)    translateY(0px);  opacity: 1; }
  }
  @keyframes rotateRing { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;

// ============= Stat Card =============
const StatCard = ({
  label,
  value,
  icon,
  color,
  description,
  isLoading,
  index,
}: {
  label: string;
  value: string | number;
  icon: string;
  color: string;
  description: string;
  isLoading?: boolean;
  index: number;
}) => (
  <MotionBox
    initial={{ opacity: 0, y: 24 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: index * 0.07 }}
    h="full"
  >
    <Box
      bg="rgba(4,4,14,0.85)"
      backdropFilter="blur(20px)"
      borderRadius="2xl"
      p={{ base: 3.5, md: 5 }}
      border={`1px solid ${color}20`}
      position="relative"
      overflow="hidden"
      h="full"
      _hover={{ borderColor: `${color}55`, boxShadow: `0 0 40px ${color}30` }}
      transition="all 0.35s ease"
    >
      <Box position="absolute" top={0} left={0} right={0} h="1px" bg={`linear-gradient(90deg, transparent, ${color}60, transparent)`} />
      <HStack spacing={3} align="center">
        <Flex
          align="center" justify="center"
          w={{ base: "40px", md: "48px" }} h={{ base: "40px", md: "48px" }}
          bg={`${color}10`} border={`1px solid ${color}22`} borderRadius="xl" flexShrink={0}
          fontSize={{ base: "18px", md: "22px" }}
          style={{ animation: "floatCard 5s ease-in-out infinite" }}
        >
          {icon}
        </Flex>
        <Box flex="1" minW="0">
          <Text fontSize="9px" color="gray.500" textTransform="uppercase" letterSpacing="0.16em" fontFamily="'Space Mono', monospace" fontWeight="700" mb={0.5}>
            {label}
          </Text>
          {isLoading ? (
            <Skeleton height="20px" width="50px" borderRadius="md" startColor="rgba(255,255,255,0.04)" endColor="rgba(255,255,255,0.14)" />
          ) : (
            <Text fontSize={{ base: "lg", md: "xl" }} fontWeight="800" color="white" fontFamily="'Space Mono', monospace" letterSpacing="-0.02em" lineHeight="1.1" style={{ animation: "countUp 0.5s ease-out forwards" }}>
              {value}
            </Text>
          )}
          <Text fontSize="9px" color="gray.400" mt={1} fontFamily="'Space Grotesk', sans-serif">{description}</Text>
        </Box>
      </HStack>
    </Box>
  </MotionBox>
);

// ============= Success Modal =============
const MintSuccessModal = ({
  isOpen,
  onClose,
  txHash,
  address,
}: {
  isOpen: boolean;
  onClose: () => void;
  txHash: string | null;
  address: string | undefined;
}) => {
  if (!txHash) return null;
  const shortHash = `${txHash.slice(0, 10)}...${txHash.slice(-8)}`;
  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="sm">
      <ModalOverlay bg="rgba(0,0,0,0.8)" backdropFilter="blur(14px)" />
      <ModalContent bg="transparent" border="none" boxShadow="none" mx={4}>
        <ModalCloseButton color="gray.500" top={4} right={4} zIndex={10} _hover={{ color: "white", bg: "rgba(255,255,255,0.08)" }} borderRadius="full" />
        <ModalBody p={0}>
          <Box
            bg="rgba(4,4,14,0.98)"
            border="1px solid rgba(139,92,246,0.4)"
            borderRadius="2xl"
            overflow="hidden"
            position="relative"
            style={{ animation: "successPop 0.42s cubic-bezier(0.34,1.56,0.64,1) forwards" }}
            boxShadow="0 0 80px rgba(139,92,246,0.3)"
          >
            <Box h="2px" bgGradient="linear(90deg, #8b5cf6, #ec4899, #8b5cf6)" backgroundSize="200% 100%" style={{ animation: "shimmerBorder 2s infinite" }} />
            <VStack spacing={5} p={7}>
              <Box position="relative" w="84px" h="84px">
                <Box position="absolute" inset={0} borderRadius="full" border="1px solid rgba(139,92,246,0.3)" style={{ animation: "rotateRing 5s linear infinite" }} />
                <Flex position="absolute" inset="16px" borderRadius="full" bg="rgba(139,92,246,0.12)" border="1px solid rgba(139,92,246,0.25)" align="center" justify="center" fontSize="26px">
                  🛡️
                </Flex>
              </Box>
              <VStack spacing={1.5}>
                <HStack spacing={2}>
                  <Icon as={CheckCircleIcon} color="#4ade80" boxSize={4} />
                  <Heading fontSize="xl" fontWeight="800" bgGradient="linear(135deg, #8b5cf6, #ec4899)" bgClip="text" fontFamily="'Space Grotesk', sans-serif">
                    Attestation Minted!
                  </Heading>
                </HStack>
                <Text fontSize="sm" color="gray.400" textAlign="center" fontFamily="'Space Grotesk', sans-serif">
                  Your reputation is now verifiable on-chain, outside this site too.
                </Text>
              </VStack>
              <Box w="full" h="1px" bg="linear-gradient(90deg, transparent, rgba(139,92,246,0.25), transparent)" />
              <VStack spacing={2} w="full" align="stretch">
                <Text fontSize="9px" textTransform="uppercase" letterSpacing="0.2em" color="gray.600" fontFamily="'Space Mono', monospace">
                  Transaction Hash
                </Text>
                <Box bg="rgba(255,255,255,0.025)" border="1px solid rgba(255,255,255,0.06)" borderRadius="lg" px={3} py={2.5}>
                  <Text fontSize="xs" fontFamily="'Space Mono', monospace" color="#a855f7" wordBreak="break-all">{shortHash}</Text>
                </Box>
              </VStack>
              <Link href={`https://soneium.blockscout.com/tx/${txHash}`} isExternal w="full" _hover={{ textDecoration: "none" }}>
                <Button
                  w="full" h="46px" variant="outline" borderColor="rgba(139,92,246,0.4)" color="#c084fc"
                  fontWeight="700" fontSize="sm" borderRadius="xl" rightIcon={<ExternalLinkIcon boxSize={3.5} />}
                  _hover={{ bg: "rgba(139,92,246,0.1)" }} fontFamily="'Space Grotesk', sans-serif"
                >
                  View Transaction
                </Button>
              </Link>
              <Link href={`${EASSCAN_ADDRESS_URL}${address}`} isExternal w="full" _hover={{ textDecoration: "none" }}>
                <Button
                  w="full" h="50px" bgGradient="linear(135deg, #8b5cf6, #ec4899)" color="white"
                  fontWeight="700" fontSize="sm" borderRadius="xl" rightIcon={<ExternalLinkIcon boxSize={3.5} />}
                  _hover={{ opacity: 0.88, transform: "translateY(-2px)", boxShadow: "0 10px 35px rgba(139,92,246,0.35)" }}
                  transition="all 0.22s" fontFamily="'Space Grotesk', sans-serif"
                >
                  View on EASScan
                </Button>
              </Link>
              <Button variant="ghost" size="sm" color="gray.600" onClick={onClose} _hover={{ color: "white", bg: "rgba(255,255,255,0.04)" }} borderRadius="full" fontFamily="'Space Grotesk', sans-serif">
                Close
              </Button>
            </VStack>
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

// ============= Main Page =============
export default function AttestationPage() {
  useFixScroll();
  const navigate = useNavigate();
  const toast = useToast();

  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  const isCorrectChain = chainId === SONEIUM_CHAIN_ID;

  const [profile, setProfile] = useState<ReputationProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isMinting, setIsMinting] = useState(false);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);
  const { isOpen: isSuccessOpen, onOpen: openSuccess, onClose: closeSuccess } = useDisclosure();

  // ================= Existing attestation on-chain =================
  const { data: latestUID, refetch: refetchLatestUID } = useReadContract({
    address: REPUTATION_ATTESTER_CONTRACT as `0x${string}`,
    abi: attesterABI,
    functionName: "latestAttestationUID",
    args: address ? [address] : undefined,
    query: { enabled: !!address && isConnected && isCorrectChain },
  });

  const { data: totalMinted } = useReadContract({
    address: REPUTATION_ATTESTER_CONTRACT as `0x${string}`,
    abi: attesterABI,
    functionName: "totalAttestationsMinted",
    query: { enabled: true },
  });

  const hasExistingAttestation = !!latestUID && latestUID !== ZERO_UID;

  // ================= Fetch profile + signature from backend =================
  const fetchProfile = useCallback(async () => {
    if (!address || !isConnected || !isCorrectChain) return;
    setIsLoadingProfile(true);
    setProfileError(null);
    try {
      const res = await fetch(`${API_URL}/generate-attestation-signature`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userAddress: address }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load your reputation profile");
      setProfile(data);
    } catch (err: any) {
      setProfileError(err?.message || "Something went wrong while loading your profile.");
    } finally {
      setIsLoadingProfile(false);
    }
  }, [address, isConnected, isCorrectChain]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Refresh once the signed deadline has passed, so the mint button never
  // silently tries to use an expired signature.
  const isSignatureExpired = useMemo(() => {
    if (!profile) return false;
    return Math.floor(Date.now() / 1000) > profile.deadline;
  }, [profile]);

  // ================= Mint handler =================
  const handleMint = async () => {
    if (!address || !profile || isMinting) return;
    if (!isCorrectChain) {
      switchChain?.({ chainId: SONEIUM_CHAIN_ID });
      return;
    }
    if (isSignatureExpired) {
      await fetchProfile();
      toast({
        title: "Refreshed",
        description: "Your signature had expired — refreshed it, please try again.",
        status: "info",
        duration: 4000,
        position: "top-right",
      });
      return;
    }

    setIsMinting(true);
    try {
      const hash = await writeContractAsync({
        address: REPUTATION_ATTESTER_CONTRACT as `0x${string}`,
        abi: attesterABI,
        functionName: "mintAttestation",
        args: [
          BigInt(profile.score),
          BigInt(profile.txCount),
          BigInt(profile.walletAgeDays),
          BigInt(profile.gmStreak),
          BigInt(profile.deployCount),
          BigInt(profile.deadline),
          profile.signature,
        ],
        value: BigInt(profile.attestFee),
      });

      const receipt = await publicClient!.waitForTransactionReceipt({ hash });
      if (receipt.status === "success") {
        setLastTxHash(hash);
        openSuccess();
        confetti({ particleCount: 260, spread: 90, origin: { y: 0.6 }, colors: ["#8b5cf6", "#ec4899", "#a855f7", "#3b82f6"] });
        await refetchLatestUID();
        // Signature is single-use per nonce — pull a fresh one for next time.
        fetchProfile();
      } else {
        throw new Error("Transaction reverted on chain");
      }
    } catch (err: any) {
      const msg = `${err?.shortMessage || err?.message || ""}`;
      const lower = msg.toLowerCase();
      const rejected = lower.includes("rejected") || lower.includes("denied") || err?.code === 4001;

      if (!rejected) {
        let title = "Mint Failed";
        let description = msg.split("\n")[0] || "Something went wrong. Please try again.";

        if (lower.includes("insufficient funds")) {
          title = "Insufficient Funds";
          description = "You don't have enough ETH to cover the attestation fee and gas.";
        } else if (lower.includes("signature expired") || lower.includes("invalid signature")) {
          title = "Signature Issue";
          description = "Your signed profile is no longer valid. Refreshing — please try minting again.";
          fetchProfile();
        }

        toast({ title, description, status: "error", duration: 6000, isClosable: true, position: "top-right" });
      }
    } finally {
      setIsMinting(false);
    }
  };

  const feeEth = profile ? (Number(profile.attestFee) / 1e18).toFixed(5) : "—";

  return (
    <>
      <style>{pageStyles}</style>
      <MintSuccessModal isOpen={isSuccessOpen} onClose={closeSuccess} txHash={lastTxHash} address={address} />

      <Box minH="100vh" bg="#03030f" position="relative" fontFamily="'Space Grotesk', sans-serif">
        {/* Ambient orbs */}
        <Box position="fixed" top="-10%" left="-10%" w="650px" h="650px" borderRadius="full"
          bg="radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 65%)" filter="blur(90px)"
          style={{ animation: "orbFloat 22s ease-in-out infinite" }} zIndex={0} pointerEvents="none" />
        <Box position="fixed" bottom="-10%" right="-10%" w="750px" h="750px" borderRadius="full"
          bg="radial-gradient(circle, rgba(236,72,153,0.08) 0%, transparent 65%)" filter="blur(110px)"
          style={{ animation: "orbFloat 30s ease-in-out infinite 8s" }} zIndex={0} pointerEvents="none" />
        <Box position="fixed" top={0} left={0} right={0} bottom={0} zIndex={0} pointerEvents="none" opacity={0.018}
          bgImage="radial-gradient(rgba(255,255,255,0.9) 1px, transparent 1px)" bgSize="32px 32px" />

        <Container maxW="1100px" position="relative" zIndex={1} px={{ base: 3, md: 6, lg: 8 }} py={{ base: 4, md: 8 }}>
          {/* Header */}
          <Flex justify="space-between" align="center" mb={{ base: 6, md: 10 }} direction={{ base: "column", md: "row" }} gap={{ base: 3, md: 0 }}>
            <HStack spacing={4}>
              <Button
                onClick={() => navigate("/")} variant="ghost" size={{ base: "sm", md: "md" }} leftIcon={<ChevronLeftIcon />}
                color="gray.500" _hover={{ color: "white", bg: "rgba(139,92,246,0.08)", borderColor: "rgba(139,92,246,0.25)" }}
                borderRadius="xl" border="1px solid rgba(255,255,255,0.07)" fontFamily="'Space Grotesk', sans-serif" fontWeight="500" transition="all 0.2s"
              >
                Back
              </Button>
              <Box h="36px" w="1px" bg="rgba(255,255,255,0.05)" display={{ base: "none", md: "block" }} />
              <VStack align="start" spacing={0.5}>
                <HStack spacing={3} align="center">
                  <Box w="7px" h="7px" borderRadius="full" bg="#4ade80" boxShadow="0 0 8px rgba(74,222,128,0.8)" style={{ animation: "pulseGlow 2.5s ease-in-out infinite" }} />
                  <Heading fontSize={{ base: "xl", md: "2xl", lg: "3xl" }} fontWeight="800" bgGradient="linear(135deg, #8b5cf6 0%, #ec4899 60%, #a855f7 100%)" bgClip="text" letterSpacing="-0.03em" fontFamily="'Space Grotesk', sans-serif">
                    Reputation Attestation
                  </Heading>
                  <Badge bg="rgba(139,92,246,0.1)" color="#a855f7" fontSize="9px" px={2} py={0.5} borderRadius="full" border="1px solid rgba(139,92,246,0.2)" fontFamily="'Space Mono', monospace">
                    EAS
                  </Badge>
                </HStack>
                <Text color="gray.600" fontSize={{ base: "9px", md: "10px" }} letterSpacing="0.2em" fontFamily="'Space Mono', monospace" textTransform="uppercase">
                  Soneium · Ethereum Attestation Service
                </Text>
              </VStack>
            </HStack>

            <Box className="wallet-connect-btn" _hover={{ transform: "scale(1.02)" }} transition="transform 0.2s">
              <ConnectButton chainStatus="full" accountStatus="full" showBalance={false} />
            </Box>
          </Flex>

          {/* Intro */}
          <MotionBox initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} mb={{ base: 6, md: 8 }}>
            <Box bg="rgba(4,4,14,0.8)" backdropFilter="blur(20px)" borderRadius="2xl" border="1px solid rgba(139,92,246,0.15)" p={{ base: 5, md: 6 }} position="relative" overflow="hidden">
              <Box position="absolute" top={0} left={0} right={0} h="2px" bgGradient="linear(90deg, #8b5cf6, #ec4899, #a855f7, #8b5cf6)" backgroundSize="300% 100%" style={{ animation: "shimmerBorder 4s infinite" }} />
              <Text fontSize="sm" color="gray.400" lineHeight="1.8" fontFamily="'Space Grotesk', sans-serif">
                Mint a portable, on-chain proof of your Soneium activity using the{" "}
                <Text as="span" color="#c084fc" fontWeight="600">Ethereum Attestation Service (EAS)</Text>.
                Your score is computed and signed by our backend from your real on-chain activity, then anyone —
                not just this site — can verify it directly on{" "}
                <Link href="https://soneium.easscan.org" isExternal color="#c084fc" fontWeight="600">EASScan</Link>.
              </Text>
            </Box>
          </MotionBox>

          {/* Connection / chain gates */}
          {!isConnected ? (
            <Box textAlign="center" py={16} bg="rgba(4,4,14,0.6)" borderRadius="3xl" border="1px solid rgba(139,92,246,0.15)">
              <Text fontSize="48px" mb={4}>🔌</Text>
              <Text color="gray.500" fontFamily="'Space Mono', monospace" fontSize="md">Connect your wallet to view your reputation profile</Text>
            </Box>
          ) : !isCorrectChain ? (
            <Box textAlign="center" py={16} bg="rgba(4,4,14,0.6)" borderRadius="3xl" border="1px solid rgba(139,92,246,0.15)">
              <Text fontSize="48px" mb={4}>⚠️</Text>
              <Text color="gray.500" fontFamily="'Space Mono', monospace" fontSize="md" mb={4}>Attestations are minted on Soneium</Text>
              <Button
                colorScheme="purple" borderRadius="full" fontWeight="700" px={6}
                onClick={() => switchChain?.({ chainId: SONEIUM_CHAIN_ID })} fontFamily="'Space Grotesk', sans-serif"
              >
                Switch to Soneium
              </Button>
            </Box>
          ) : (
            <VStack spacing={{ base: 5, md: 7 }} align="stretch">
              {/* Existing attestation banner */}
              {hasExistingAttestation && (
                <MotionBox initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                  <Box bg="rgba(74,222,128,0.05)" border="1px solid rgba(74,222,128,0.2)" borderRadius="2xl" p={4} display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={3}>
                    <HStack spacing={3}>
                      <Icon as={CheckCircleIcon} color="#4ade80" boxSize={5} />
                      <Box>
                        <Text fontSize="sm" fontWeight="700" color="#4ade80" fontFamily="'Space Grotesk', sans-serif">You already have an attestation</Text>
                        <Text fontSize="xs" color="gray.500" fontFamily="'Space Grotesk', sans-serif">Mint again anytime to refresh it with your latest score.</Text>
                      </Box>
                    </HStack>
                    <Link href={`${EASSCAN_ADDRESS_URL}${address}`} isExternal>
                      <Button size="sm" variant="outline" borderColor="rgba(74,222,128,0.3)" color="#4ade80" borderRadius="full" rightIcon={<ExternalLinkIcon boxSize={3} />} _hover={{ bg: "rgba(74,222,128,0.08)" }} fontFamily="'Space Grotesk', sans-serif">
                        View on EASScan
                      </Button>
                    </Link>
                  </Box>
                </MotionBox>
              )}

              {/* Profile error */}
              {profileError && (
                <Box bg="rgba(239,68,68,0.06)" border="1px solid rgba(239,68,68,0.2)" borderRadius="2xl" p={4}>
                  <HStack justify="space-between" wrap="wrap" gap={3}>
                    <Text fontSize="sm" color="#f87171" fontFamily="'Space Grotesk', sans-serif">{profileError}</Text>
                    <Button size="sm" leftIcon={<RepeatIcon />} onClick={fetchProfile} variant="outline" borderColor="rgba(239,68,68,0.3)" color="#f87171" borderRadius="full" _hover={{ bg: "rgba(239,68,68,0.08)" }}>
                      Retry
                    </Button>
                  </HStack>
                </Box>
              )}

              {/* Profile stats */}
              <SimpleGrid columns={{ base: 2, md: 5 }} spacing={{ base: 2.5, md: 4 }}>
                <StatCard index={0} label="Score" value={profile?.score ?? 0} icon="⭐" color="#fbbf24" description="Composite reputation" isLoading={isLoadingProfile} />
                <StatCard index={1} label="Transactions" value={profile?.txCount ?? 0} icon="🔄" color="#3b82f6" description="Total on Soneium" isLoading={isLoadingProfile} />
                <StatCard index={2} label="Wallet Age" value={profile ? `${profile.walletAgeDays}d` : "0d"} icon="⏳" color="#22c55e" description="Since first tx" isLoading={isLoadingProfile} />
                <StatCard index={3} label="GM Activity" value={profile?.gmStreak ?? 0} icon="🌅" color="#ec4899" description="Total GM count" isLoading={isLoadingProfile} />
                <StatCard index={4} label="Deployments" value={profile?.deployCount ?? 0} icon="🚀" color="#a855f7" description="Contracts deployed" isLoading={isLoadingProfile} />
              </SimpleGrid>

              {/* Mint card */}
              <Box
                bg="rgba(4,4,14,0.9)" backdropFilter="blur(24px)" borderRadius="3xl" border="1px solid rgba(139,92,246,0.3)"
                overflow="hidden" position="relative" _hover={{ borderColor: "rgba(139,92,246,0.5)" }} transition="all 0.4s"
              >
                <Box h="3px" bgGradient="linear(90deg, #8b5cf6, #ec4899, #3b82f6, #8b5cf6)" backgroundSize="300% 100%" style={{ animation: "shimmerBorder 4s infinite" }} />
                <VStack p={{ base: 6, md: 8 }} spacing={5} align="stretch">
                  <HStack justify="space-between" wrap="wrap" gap={2}>
                    <Text color="gray.400" fontWeight="600" letterSpacing="wide" fontSize="sm" textTransform="uppercase" fontFamily="'Space Mono', monospace">
                      Mint Attestation
                    </Text>
                    <Tooltip label="Attestations stay valid for a limited time and can be re-minted to refresh your score" hasArrow>
                      <Badge bg="rgba(139,92,246,0.1)" color="#c084fc" fontSize="9px" px={2.5} py={1} borderRadius="full" border="1px solid rgba(139,92,246,0.2)" fontFamily="'Space Mono', monospace">
                        90-DAY VALIDITY
                      </Badge>
                    </Tooltip>
                  </HStack>

                  <Divider borderColor="rgba(139,92,246,0.1)" />

                  <HStack justify="space-between">
                    <Text fontSize="sm" color="gray.400" fontFamily="'Space Grotesk', sans-serif">Attestation fee</Text>
                    {isLoadingProfile ? (
                      <Skeleton height="20px" width="80px" borderRadius="md" startColor="rgba(255,255,255,0.04)" endColor="rgba(255,255,255,0.14)" />
                    ) : (
                      <Text fontSize="md" fontWeight="800" color="#c084fc" fontFamily="'Space Mono', monospace">{feeEth} ETH</Text>
                    )}
                  </HStack>

                  <Button
                    onClick={handleMint}
                    isLoading={isMinting}
                    loadingText="Minting..."
                    isDisabled={!profile || isLoadingProfile || isMinting}
                    w="full" h="56px" fontSize="lg" fontWeight="800" borderRadius="full"
                    bgGradient="linear(135deg, #8b5cf6, #ec4899)" color="white"
                    boxShadow="0 0 25px rgba(139,92,246,0.4)"
                    _hover={{ transform: "translateY(-2px)", boxShadow: "0 0 40px rgba(139,92,246,0.6)" }}
                    transition="all 0.3s cubic-bezier(0.4,0,0.2,1)"
                    fontFamily="'Space Grotesk', sans-serif"
                  >
                    🛡️ {hasExistingAttestation ? "Refresh Attestation" : "Mint Attestation"}
                  </Button>

                  <Text fontSize="10px" color="gray.500" textAlign="center" fontFamily="'Space Grotesk', sans-serif">
                    Your score is computed server-side from real on-chain data and signed before you mint —
                    it can't be edited or faked from the browser.
                  </Text>
                </VStack>
              </Box>

              {/* Footer stat */}
              <HStack justify="center" spacing={2} pt={2}>
                <Text fontSize="10px" color="gray.600" fontFamily="'Space Mono', monospace" letterSpacing="0.1em" textTransform="uppercase">
                  Total Attestations Minted
                </Text>
                <Text fontSize="10px" color="#c084fc" fontFamily="'Space Mono', monospace" fontWeight="700">
                  {totalMinted !== undefined ? totalMinted.toString() : "—"}
                </Text>
              </HStack>
            </VStack>
          )}
        </Container>
      </Box>
    </>
  );
}

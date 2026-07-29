// src/pages/Verify.tsx
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
  Spinner,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Link,
  Icon,
  Divider,
} from "@chakra-ui/react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useSwitchChain, useReadContracts, useSignMessage, useWriteContract } from "wagmi";
import { waitForTransactionReceipt, getAccount } from "@wagmi/core";
import { useState, useEffect } from "react";
import { ChevronLeftIcon, CheckCircleIcon, ExternalLinkIcon, WarningIcon, LockIcon } from "@chakra-ui/icons";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { createSiweMessage, generateSiweNonce } from "viem/siwe";
import { baseSepolia } from "viem/chains";
import { useFixScroll } from "../hooks/useFixScroll";
import { useNavigate } from "react-router-dom";
import { config as wagmiConfig } from "../wagmi";

// ============= Contract / API config =============
// Base Verify Onchain is Base-Sepolia-only during the test phase — no network selector.
const VERIFY_CONTRACT_ADDRESS = "0xf5806DCC0d824a46a0b4EFddeb0555A541786264" as const;
const BASE_SEPOLIA_ID = baseSepolia.id; // 84532
const EXPLORER_ADDRESS_URL = "https://sepolia.basescan.org/address/";
const EXPLORER_TX_URL = "https://sepolia.basescan.org/tx/";
// Calls our own Netlify Function (netlify/functions/verify-onchain.ts), which relays
// this server-to-server to verify.base.dev — the API itself doesn't send CORS headers,
// so a direct browser fetch to it always fails the preflight, regardless of how the
// request is built. Locally, run `netlify dev` (not just `vite`) so this path is served.
const VERIFY_API_URL = "/api/verify-onchain";
const VERIFY_APP_URL = "https://verify.base.dev";

const CONDITION_COMPONENTS = [
  { name: "name", type: "string" },
  { name: "op", type: "string" },
  { name: "value", type: "string" },
] as const;

const VERIFY_ABI = [
  { type: "function", name: "REGISTRY", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { type: "function", name: "provider", stateMutability: "pure", inputs: [], outputs: [{ type: "string" }] },
  {
    type: "function", name: "conditions", stateMutability: "pure", inputs: [],
    outputs: [{ type: "tuple[]", components: CONDITION_COMPONENTS }],
  },
  { type: "function", name: "cutoffBlock", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "isParticipant", stateMutability: "view", inputs: [{ name: "wallet", type: "address" }], outputs: [{ type: "bool" }] },
  { type: "function", name: "enrolled", stateMutability: "view", inputs: [{ name: "identityHash", type: "bytes32" }], outputs: [{ type: "bool" }] },
  {
    type: "function", name: "enroll", stateMutability: "nonpayable",
    inputs: [
      { name: "identityHash", type: "bytes32" },
      { name: "expiration", type: "uint40" },
      { name: "signature", type: "bytes" },
    ],
    outputs: [],
  },
  { type: "error", name: "AlreadyEnrolled", inputs: [] },
] as const;

interface Condition {
  name: string;
  op: string;
  value: string;
}

type Step = "idle" | "signing" | "checking" | "submitting";

interface ApiIssue {
  kind: "redirect" | "blocked" | "error";
  title: string;
  description: string;
}

// ============= Helpers =============
const shortAddr = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;
const isChainMismatchError = (error: any): boolean => {
  const msg = `${error?.shortMessage || error?.message || ""}`.toLowerCase();
  return msg.includes("does not match") || msg.includes("chain mismatch") || msg.includes("chainmismatch");
};
const isUserRejection = (error: any): boolean => {
  const msg = `${error?.shortMessage || error?.message || ""}`.toLowerCase();
  return msg.includes("user rejected") || msg.includes("user denied") || msg.includes("rejected the request");
};
const ensureWalletOnChain = async (targetChainId: number, timeoutMs = 10000): Promise<boolean> => {
  if (getAccount(wagmiConfig).chainId === targetChainId) return true;
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (getAccount(wagmiConfig).chainId === targetChainId) return true;
    await new Promise((r) => setTimeout(r, 150));
  }
  return getAccount(wagmiConfig).chainId === targetChainId;
};
const getTxErrorDetails = (error: any): { title: string; description: string } | null => {
  if (isUserRejection(error)) return null;
  const raw = `${error?.shortMessage || error?.message || ""}`;
  const msg = raw.toLowerCase();
  if (msg.includes("alreadyenrolled")) {
    return { title: "Already Enrolled", description: "This identity is already enrolled — no need to verify again." };
  }
  if (msg.includes("insufficient funds") || msg.includes("exceeds balance")) {
    return { title: "Insufficient Funds", description: "You need a small amount of Base Sepolia ETH to cover gas." };
  }
  if (isChainMismatchError(error)) {
    return { title: "Network Switch Issue", description: "Your wallet didn't fully switch to Base Sepolia in time. Please wait a moment and try again." };
  }
  if (msg.includes("timeout") || msg.includes("failed to fetch") || msg.includes("network error") || msg.includes("429")) {
    return { title: "Network Congested", description: "The RPC endpoint seems busy right now. Please wait a few seconds and try again." };
  }
  return { title: "Enrollment Failed", description: raw.split("\n")[0] || "Something went wrong. Please try again." };
};

// Response body field names for API errors aren't fixed by the docs to one exact key, so
// this matches on the documented short codes anywhere in the parsed (or raw) body text
// instead of assuming a specific field.
const interpretApiError = (status: number, body: any, rawText: string): ApiIssue => {
  const haystack = `${JSON.stringify(body ?? {})} ${rawText}`.toLowerCase();
  if (haystack.includes("verification_not_found") || haystack.includes("needs_reauth")) {
    return {
      kind: "redirect",
      title: "Coinbase Verification Needed",
      description: "You haven't verified your Coinbase account with Base Verify yet (or it needs refreshing). Do that first, then come back.",
    };
  }
  if (haystack.includes("conditions_not_satisfied")) {
    return {
      kind: "blocked",
      title: "Not Eligible Yet",
      description: "Your Coinbase account is verified, but you don't currently meet the requirement below.",
    };
  }
  if (haystack.includes("contract_not_found")) {
    return {
      kind: "error",
      title: "Contract Not Recognized",
      description: "Base Verify couldn't find this contract's policy on Base Sepolia. Please try again shortly.",
    };
  }
  if (haystack.includes("invalid_policy")) {
    return {
      kind: "error",
      title: "Unsupported Policy",
      description: "This contract's provider/condition combination isn't supported by Base Verify.",
    };
  }
  if (haystack.includes("invalid_argument")) {
    return {
      kind: "error",
      title: "Request Invalid",
      description: "The verification request was malformed or expired. Please try again.",
    };
  }
  if (status === 429) {
    return { kind: "error", title: "Too Many Attempts", description: "Please wait a moment before trying again." };
  }
  return {
    kind: "error",
    title: "Verification Failed",
    description: "Base Verify is unavailable right now. Please try again shortly.",
  };
};

// ============= Motion =============
const MotionBox = motion(Box);

// ============= Design system =============
// Trust/security feel rather than launch-hype: Coinbase blue as the primary identity,
// calm — this page is about proving who you are, not about excitement.
const BLUE = "#0052FF";
const SKY = "#36A9F7";
const MINT = "#34d399";
const DANGER = "#f87171";
const AMBER = "#f97316";
const VERIFY_GRADIENT = "linear(135deg, #0052FF 0%, #36A9F7 100%)";
const VERIFY_GLOW = "rgba(0,82,255,0.35)";

// ============= Styles =============
const pageStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700;800&family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap');
  @keyframes floatCard { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-7px); } }
  @keyframes shimmerBorder { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
  @keyframes pulseGlow { 0%, 100% { opacity: 0.55; } 50% { opacity: 1; } }
  @keyframes orbFloat { 0%, 100% { transform: scale(1) translateY(0px); opacity: 0.5; } 50% { transform: scale(1.12) translateY(-20px); opacity: 0.8; } }
  @keyframes rotateRing { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  @keyframes successPop { 0% { transform: scale(0.75) translateY(16px); opacity: 0; } 65% { transform: scale(1.04) translateY(-3px); opacity: 1; } 100% { transform: scale(1) translateY(0px); opacity: 1; } }
  @keyframes hashReveal { from { opacity: 0; letter-spacing: 0.4em; } to { opacity: 1; letter-spacing: 0.07em; } }
  @keyframes shieldPulse { 0%, 100% { box-shadow: 0 0 30px rgba(0,82,255,0.3); } 50% { box-shadow: 0 0 50px rgba(0,82,255,0.5); } }
  .wallet-connect-btn button, .wallet-connect-btn button * { white-space: nowrap !important; }
`;

// ============= Stat Card =============
const StatCard = ({ label, value, icon, description, index, color }: { label: string; value: string; icon: string; description: string; index: number; color: string }) => (
  <MotionBox initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: index * 0.08 }} h="full">
    <Box
      bg="rgba(8,10,16,0.85)" backdropFilter="blur(20px)" borderRadius="2xl"
      p={{ base: 3.5, md: 5 }} border={`1px solid ${color}30`} h="full" position="relative" overflow="hidden"
      _hover={{ borderColor: `${color}70`, boxShadow: `0 0 44px ${color}40`, transform: "translateY(-3px)" }}
      transition="all 0.3s ease"
    >
      <Box position="absolute" top={0} left={0} right={0} h="2px" bg={`linear-gradient(90deg, transparent, ${color}, transparent)`} />
      <Box position="absolute" top="-10px" right="-10px" w="90px" h="90px" borderRadius="full" bg={`radial-gradient(circle, ${color}30, transparent 70%)`} />
      <HStack spacing={3} align="center" position="relative">
        <Flex align="center" justify="center" w={{ base: "42px", md: "54px" }} h={{ base: "42px", md: "54px" }}
          bg={`${color}18`} border={`1px solid ${color}45`} borderRadius="xl" flexShrink={0}
          fontSize={{ base: "20px", md: "26px" }} style={{ animation: "floatCard 5s ease-in-out infinite" }}>
          {icon}
        </Flex>
        <Box flex="1" minW="0">
          <Text fontSize="9px" color="gray.500" textTransform="uppercase" letterSpacing="0.2em" fontFamily="'Space Mono', monospace" fontWeight="700" mb={0.5}>
            {label}
          </Text>
          <Text fontSize={{ base: "md", md: "lg" }} fontWeight="800" color={color} fontFamily="'Space Mono', monospace" letterSpacing="-0.02em" lineHeight="1.1" noOfLines={1}>
            {value}
          </Text>
          <Text fontSize="9px" color="gray.400" mt={1} fontFamily="'Space Grotesk', sans-serif" fontWeight="500">
            {description}
          </Text>
        </Box>
      </HStack>
    </Box>
  </MotionBox>
);

// ============= Status Card =============
const StatusCard = ({ isConnected, isParticipant, walletAddress }: { isConnected: boolean; isParticipant?: boolean; walletAddress?: string }) => {
  const state = !isConnected ? "disconnected" : isParticipant === undefined ? "loading" : isParticipant ? "verified" : "unverified";
  const config = {
    disconnected: { icon: "🔌", color: "gray.500", title: "Connect your wallet", text: "We'll check your enrollment status once you're connected." },
    loading: { icon: "···", color: "gray.500", title: "Checking status…", text: "Reading your enrollment from the contract." },
    verified: { icon: "✅", color: MINT, title: "You're verified & enrolled", text: "This wallet's identity has already completed Base Verify." },
    unverified: { icon: "🛡️", color: BLUE, title: "Not enrolled yet", text: "Verify your Coinbase One membership to enroll this identity." },
  }[state];
  return (
    <MotionBox initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} h="full">
      <Box
        bg="rgba(8,10,16,0.85)" backdropFilter="blur(20px)" borderRadius="2xl" p={{ base: 4, md: 5 }}
        border={`1px solid ${config.color}35`} position="relative" overflow="hidden" h="full"
      >
        <Box position="absolute" top={0} left={0} right={0} h="2px" bg={`linear-gradient(90deg, transparent, ${config.color}, transparent)`} />
        <HStack spacing={4} align="center">
          <Flex align="center" justify="center" w="52px" h="52px" bg={`${config.color}18`} border={`1px solid ${config.color}40`} borderRadius="xl" fontSize="24px" flexShrink={0}>
            {config.icon}
          </Flex>
          <Box>
            <Text fontSize="sm" fontWeight="800" color="white" fontFamily="'Space Grotesk', sans-serif">{config.title}</Text>
            <Text fontSize="xs" color="gray.400" fontFamily="'Space Grotesk', sans-serif" mt={0.5}>{config.text}</Text>
            {walletAddress && (
              <Text fontSize="10px" color="gray.600" fontFamily="'Space Mono', monospace" mt={1}>
                {shortAddr(walletAddress)}
              </Text>
            )}
          </Box>
        </HStack>
      </Box>
    </MotionBox>
  );
};

// ============= Success Modal =============
const EnrolledModal = ({ isOpen, onClose, txHash }: { isOpen: boolean; onClose: () => void; txHash: string | null }) => {
  if (!txHash) return null;
  const explorerUrl = `${EXPLORER_TX_URL}${txHash}`;
  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="sm">
      <ModalOverlay bg="rgba(0,0,0,0.82)" backdropFilter="blur(14px)" />
      <ModalContent bg="transparent" border="none" boxShadow="none" mx={4}>
        <ModalCloseButton color="gray.500" top={4} right={4} zIndex={10} _hover={{ color: "white", bg: "rgba(255,255,255,0.08)" }} borderRadius="full" />
        <ModalBody p={0}>
          <Box
            bg="rgba(6,8,16,0.98)" border={`1px solid ${BLUE}55`} borderRadius="2xl" overflow="hidden" position="relative"
            style={{ animation: "successPop 0.42s cubic-bezier(0.34,1.56,0.64,1) forwards" }}
            boxShadow={`0 0 90px ${VERIFY_GLOW}, 0 0 0 1px rgba(255,255,255,0.04) inset`}
          >
            <Box h="3px" bgGradient={VERIFY_GRADIENT} backgroundSize="200% 100%" style={{ animation: "shimmerBorder 2s infinite" }} />
            <VStack spacing={5} p={7}>
              <Box position="relative" w="88px" h="88px">
                <Box position="absolute" inset={0} borderRadius="full" border={`1px solid ${BLUE}45`} style={{ animation: "rotateRing 5s linear infinite" }} />
                <Flex position="absolute" inset="10px" borderRadius="full" bgGradient={VERIFY_GRADIENT} align="center" justify="center" fontSize="32px" boxShadow={`0 0 30px ${VERIFY_GLOW}`}>
                  🛡️
                </Flex>
              </Box>
              <VStack spacing={1.5}>
                <HStack spacing={2}>
                  <Icon as={CheckCircleIcon} color={MINT} boxSize={4} />
                  <Heading fontSize="xl" fontWeight="800" bgGradient={VERIFY_GRADIENT} bgClip="text" fontFamily="'Space Grotesk', sans-serif" letterSpacing="-0.02em">
                    You're Verified!
                  </Heading>
                </HStack>
                <Text fontSize="sm" color="gray.400" textAlign="center" fontFamily="'Space Grotesk', sans-serif">
                  Your identity is enrolled on-chain — one real person, counted once.
                </Text>
              </VStack>
              <Box w="full" h="1px" bg={`linear-gradient(90deg, transparent, ${BLUE}40, transparent)`} />
              <Link href={explorerUrl} isExternal w="full" _hover={{ textDecoration: "none" }}>
                <Button w="full" h="50px" bgGradient={VERIFY_GRADIENT} color="white" fontWeight="800" fontSize="sm" borderRadius="xl"
                  rightIcon={<ExternalLinkIcon boxSize={3.5} />}
                  _hover={{ opacity: 0.9, transform: "translateY(-2px)", boxShadow: `0 12px 40px ${VERIFY_GLOW}` }}
                  _active={{ transform: "scale(0.97)" }} transition="all 0.22s" fontFamily="'Space Grotesk', sans-serif">
                  View Transaction
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

// ============= Footer =============
const Footer = () => (
  <Box pt={10} pb={6} position="relative">
    <Box h="1px" mb={8} bg={`linear-gradient(90deg, transparent, ${BLUE}30, ${SKY}30, transparent)`} />
    <VStack spacing={5}>
      <HStack spacing={0} justify="center" flexWrap="wrap" bg="rgba(255,255,255,0.02)" border="1px solid rgba(255,255,255,0.05)" borderRadius="2xl" px={6} py={3} gap={0}>
        {[
          { label: "Network", value: "Base Sepolia" },
          { label: "Provider", value: "Coinbase" },
          { label: "Cost", value: "Gas only" },
          { label: "Status", value: "Live ✓" },
        ].map(({ label, value }, i, arr) => (
          <HStack key={label} spacing={0}>
            <VStack spacing={0} px={{ base: 4, md: 6 }} py={1}>
              <Text fontSize="9px" color="gray.600" textTransform="uppercase" letterSpacing="0.18em" fontFamily="'Space Mono', monospace">{label}</Text>
              <Text fontSize="xs" fontWeight="700" color="gray.400" fontFamily="'Space Mono', monospace">{value}</Text>
            </VStack>
            {i < arr.length - 1 && <Box w="1px" h="28px" bg="rgba(255,255,255,0.06)" flexShrink={0} />}
          </HStack>
        ))}
      </HStack>
      <VStack spacing={1}>
        <Text fontSize="11px" color="gray.400" fontFamily="'Space Mono', monospace" letterSpacing="0.12em" textAlign="center">
          © 2026 · Agent Protocol · All rights reserved
        </Text>
        <Text fontSize="11px" color="gray.400" fontFamily="'Space Mono', monospace" letterSpacing="0.08em">
          Built on Base · Powered by SilviuASY
        </Text>
      </VStack>
    </VStack>
  </Box>
);

// ============= Main Page =============
export default function VerifyPage() {
  useFixScroll();
  const { address, isConnected, chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const { signMessageAsync } = useSignMessage();
  const { writeContractAsync } = useWriteContract();
  const toast = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("idle");
  const [apiIssue, setApiIssue] = useState<ApiIssue | null>(null);
  const [enrolledTxHash, setEnrolledTxHash] = useState<string | null>(null);
  const [isSwitching, setIsSwitching] = useState(false);

  const { isOpen: isSuccessOpen, onOpen: openSuccess, onClose: closeSuccess } = useDisclosure();

  const isOnBaseSepolia = chainId === BASE_SEPOLIA_ID;

  const { data: contractReads, refetch: refetchStatus } = useReadContracts({
    contracts: [
      { address: VERIFY_CONTRACT_ADDRESS, abi: VERIFY_ABI, functionName: "provider", chainId: BASE_SEPOLIA_ID },
      { address: VERIFY_CONTRACT_ADDRESS, abi: VERIFY_ABI, functionName: "conditions", chainId: BASE_SEPOLIA_ID },
      {
        address: VERIFY_CONTRACT_ADDRESS, abi: VERIFY_ABI, functionName: "isParticipant",
        args: address ? [address] : undefined, chainId: BASE_SEPOLIA_ID,
      },
    ],
    query: { enabled: true, staleTime: 15000 },
  });

  const providerName = contractReads?.[0]?.status === "success" ? (contractReads[0].result as string) : undefined;
  const conditionsList = contractReads?.[1]?.status === "success" ? (contractReads[1].result as unknown as Condition[]) : [];
  const isParticipant = contractReads?.[2]?.status === "success" ? (contractReads[2].result as boolean) : undefined;
  const primaryCondition = conditionsList[0];

  useEffect(() => {
    if (isConnected && !isOnBaseSepolia) {
      switchChain?.({ chainId: BASE_SEPOLIA_ID });
    }
  }, [isConnected, isOnBaseSepolia, switchChain]);

  const handleSwitchNetwork = async () => {
    setIsSwitching(true);
    try {
      await switchChain?.({ chainId: BASE_SEPOLIA_ID });
    } catch {
      toast({ title: "Network Switch Failed", description: "Please switch to Base Sepolia manually from your wallet.", status: "error", duration: 4000, isClosable: true, position: "top-right" });
    } finally {
      setIsSwitching(false);
    }
  };

  const handleVerify = async () => {
    if (!address) {
      toast({ title: "Wallet Not Connected", description: "Connect your wallet first.", status: "warning", duration: 4000, isClosable: true, position: "top-right" });
      return;
    }
    setApiIssue(null);
    try {
      if (getAccount(wagmiConfig).chainId !== BASE_SEPOLIA_ID) {
        try {
          await switchChain?.({ chainId: BASE_SEPOLIA_ID });
        } catch {
          toast({ title: "Network Switch Failed", description: "Please switch to Base Sepolia manually.", status: "error", duration: 4000, isClosable: true, position: "top-right" });
          return;
        }
        const switched = await ensureWalletOnChain(BASE_SEPOLIA_ID);
        if (!switched) {
          toast({ title: "Network Switch Failed", description: "Please switch to Base Sepolia manually and try again.", status: "error", duration: 4000, isClosable: true, position: "top-right" });
          return;
        }
      }

      setStep("signing");
      const nonce = generateSiweNonce();
      const message = createSiweMessage({
        domain: window.location.host,
        address,
        statement: "Claim eligibility for a Base Verify onchain benefit.",
        uri: window.location.origin,
        version: "1",
        chainId: BASE_SEPOLIA_ID,
        nonce,
        resources: [`eip155:${BASE_SEPOLIA_ID}:${VERIFY_CONTRACT_ADDRESS}`],
      });
      const signature = await signMessageAsync({ message });

      setStep("checking");
      const res = await fetch(VERIFY_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, signature }),
      });
      const rawText = await res.text();
      let body: any = null;
      try {
        body = JSON.parse(rawText);
      } catch {
        /* not json */
      }

      if (!res.ok) {
        setApiIssue(interpretApiError(res.status, body, rawText));
        setStep("idle");
        return;
      }

      const { identityHash, expiration, signature: verifySignature } = body as {
        identityHash: `0x${string}`;
        expiration: number;
        signature: `0x${string}`;
      };

      setStep("submitting");
      const txHash = await writeContractAsync({
        address: VERIFY_CONTRACT_ADDRESS,
        abi: VERIFY_ABI,
        functionName: "enroll",
        args: [identityHash, expiration, verifySignature],
        chainId: BASE_SEPOLIA_ID,
      });

      try {
        await waitForTransactionReceipt(wagmiConfig, { hash: txHash, chainId: BASE_SEPOLIA_ID });
      } catch (receiptError) {
        console.warn("Could not fetch receipt (tx was likely still mined):", receiptError);
      }

      setEnrolledTxHash(txHash);
      openSuccess();
      confetti({ particleCount: 180, spread: 70, origin: { y: 0.55 }, colors: [BLUE, SKY, MINT, "#ffffff"] });
      refetchStatus();
    } catch (error: any) {
      if (isUserRejection(error)) {
        // silent — user closed the signature or tx prompt
      } else {
        const details = getTxErrorDetails(error);
        if (details) {
          toast({ title: details.title, description: details.description, status: "error", duration: 6000, isClosable: true, position: "top-right" });
        }
      }
    } finally {
      setStep("idle");
    }
  };

  const redirectToBaseVerify = () => {
    const url = `${VERIFY_APP_URL}?redirect_uri=${encodeURIComponent(window.location.href)}&providers=coinbase`;
    window.location.href = url;
  };

  const stepLabel: Record<Step, string> = {
    idle: "Verify & Enroll",
    signing: "Sign the message in your wallet…",
    checking: "Checking eligibility…",
    submitting: "Submitting on-chain…",
  };

  const isBusy = step !== "idle";
  const alreadyDone = isParticipant === true;
  const yourStatusLabel = !isConnected ? "Connect" : isParticipant === undefined ? "…" : isParticipant ? "Verified" : "Pending";

  return (
    <>
      <style>{pageStyles}</style>
      <EnrolledModal isOpen={isSuccessOpen} onClose={closeSuccess} txHash={enrolledTxHash} />
      <Box minH="100vh" bg="#03040a" position="relative" fontFamily="'Space Grotesk', sans-serif">
        <Box position="fixed" top="-12%" left="-10%" w="700px" h="700px" borderRadius="full"
          bg={`radial-gradient(circle, ${BLUE}1e 0%, transparent 65%)`} filter="blur(95px)"
          style={{ animation: "orbFloat 20s ease-in-out infinite" }} zIndex={0} pointerEvents="none" />
        <Box position="fixed" bottom="-12%" right="-10%" w="780px" h="780px" borderRadius="full"
          bg={`radial-gradient(circle, ${SKY}1a 0%, transparent 65%)`} filter="blur(115px)"
          style={{ animation: "orbFloat 26s ease-in-out infinite 6s" }} zIndex={0} pointerEvents="none" />
        <Box position="fixed" top="35%" left="55%" w="500px" h="500px" borderRadius="full"
          bg={`radial-gradient(circle, ${MINT}12 0%, transparent 65%)`} filter="blur(90px)"
          style={{ animation: "orbFloat 17s ease-in-out infinite reverse 3s" }} zIndex={0} pointerEvents="none" />

        <Container maxW="1200px" position="relative" zIndex={1} px={{ base: 3, md: 6, lg: 8 }} py={{ base: 4, md: 8 }}>
          {/* Header */}
          <Flex justify="space-between" align="center" mb={{ base: 6, md: 8 }} direction={{ base: "column", md: "row" }} gap={{ base: 3, md: 0 }}>
            <HStack spacing={4}>
              <Button onClick={() => navigate("/")} variant="ghost" size={{ base: "sm", md: "md" }} leftIcon={<ChevronLeftIcon />}
                color="gray.500" _hover={{ color: "white", bg: `${BLUE}14`, borderColor: `${BLUE}35` }}
                borderRadius="xl" border="1px solid rgba(255,255,255,0.07)" fontFamily="'Space Grotesk', sans-serif" fontWeight="500" transition="all 0.2s">
                Back
              </Button>
              <Box h="36px" w="1px" bg="rgba(255,255,255,0.05)" display={{ base: "none", md: "block" }} />
              <VStack align="start" spacing={0.5}>
                <HStack spacing={3} align="center">
                  <Box w="7px" h="7px" borderRadius="full" bg={MINT} boxShadow={`0 0 8px ${MINT}`} style={{ animation: "pulseGlow 2.5s ease-in-out infinite" }} />
                  <Heading fontSize={{ base: "xl", md: "2xl", lg: "3xl" }} fontWeight="800" bgGradient={VERIFY_GRADIENT} bgClip="text" letterSpacing="-0.03em" fontFamily="'Space Grotesk', sans-serif">
                    Verify
                  </Heading>
                  <Badge bg={`${BLUE}18`} color={SKY} fontSize="9px" px={2} py={0.5} borderRadius="full" border={`1px solid ${BLUE}40`} fontFamily="'Space Mono', monospace">
                    Base Sepolia
                  </Badge>
                </HStack>
                <Text color="gray.400" fontSize={{ base: "10px", md: "11px" }} letterSpacing="0.2em" fontFamily="'Space Mono', monospace" textTransform="uppercase">
                  Sybil-Resistant Onchain Identity
                </Text>
              </VStack>
            </HStack>
            <Box className="wallet-connect-btn" _hover={{ transform: "scale(1.02)" }} transition="transform 0.2s">
              <ConnectButton chainStatus="full" accountStatus="full" showBalance={{ smallScreen: false, largeScreen: false }} />
            </Box>
          </Flex>

          {/* Hero explainer */}
          <MotionBox initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }} mb={{ base: 6, md: 8 }}>
            <Box position="relative" overflow="hidden" borderRadius="2xl" p={{ base: 5, md: 7 }} border={`1px solid ${BLUE}30`} bg="rgba(6,8,16,0.9)">
              <Box position="absolute" inset={0} bgGradient={`linear(120deg, ${BLUE}14, ${SKY}0d)`} />
              <Box position="absolute" top={0} left={0} right={0} h="2px" bgGradient={VERIFY_GRADIENT} backgroundSize="300% 100%" style={{ animation: "shimmerBorder 5s infinite" }} />
              <Flex position="relative" direction={{ base: "column", md: "row" }} align={{ base: "flex-start", md: "center" }} gap={4}>
                <Flex w={{ base: "48px", md: "60px" }} h={{ base: "48px", md: "60px" }} borderRadius="2xl" bgGradient={VERIFY_GRADIENT}
                  align="center" justify="center" fontSize={{ base: "24px", md: "30px" }} flexShrink={0}
                  boxShadow={`0 0 30px ${VERIFY_GLOW}`} style={{ animation: "shieldPulse 3.5s ease-in-out infinite" }}>
                  🛡️
                </Flex>
                <Box>
                  <Text fontSize={{ base: "10px", md: "11px" }} color="gray.400" textTransform="uppercase" letterSpacing="0.2em" fontFamily="'Space Mono', monospace" fontWeight="700" mb={1}>
                    One real person, verified once
                  </Text>
                  <Text fontSize={{ base: "md", md: "lg" }} color="white" fontFamily="'Space Grotesk', sans-serif" fontWeight="700">
                    Prove eligibility without doxxing yourself
                  </Text>
                </Box>
              </Flex>
            </Box>
          </MotionBox>

          {isConnected && !isOnBaseSepolia && (
            <MotionBox initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} mb={5}>
              <Flex justify="space-between" align="center" wrap="wrap" gap={3} bg={`${AMBER}12`} border={`1px solid ${AMBER}45`} borderRadius="xl" p={3.5}>
                <HStack spacing={2}>
                  <Icon as={WarningIcon} color={AMBER} boxSize={4} />
                  <Text fontSize="sm" color={AMBER} fontFamily="'Space Grotesk', sans-serif">
                    Wrong network — Base Verify only runs on Base Sepolia right now.
                  </Text>
                </HStack>
                <Button onClick={handleSwitchNetwork} isLoading={isSwitching} loadingText="Switching…" size="sm"
                  bg={`${AMBER}22`} color={AMBER} border={`1px solid ${AMBER}50`} borderRadius="lg" fontWeight="700"
                  fontFamily="'Space Grotesk', sans-serif" _hover={{ bg: `${AMBER}33` }}>
                  Switch to Base Sepolia
                </Button>
              </Flex>
            </MotionBox>
          )}

          {apiIssue && (
            <MotionBox initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} mb={5}>
              <Box
                bg={apiIssue.kind === "redirect" ? `${BLUE}12` : `${DANGER}12`}
                border={`1px solid ${apiIssue.kind === "redirect" ? BLUE : DANGER}40`} borderRadius="xl" p={4}
              >
                <VStack align="stretch" spacing={3}>
                  <HStack spacing={2} align="start">
                    <Icon as={WarningIcon} color={apiIssue.kind === "redirect" ? SKY : DANGER} boxSize={4} mt={0.5} />
                    <Box>
                      <Text fontSize="sm" fontWeight="700" color="white" fontFamily="'Space Grotesk', sans-serif">{apiIssue.title}</Text>
                      <Text fontSize="xs" color="gray.400" fontFamily="'Space Grotesk', sans-serif" mt={0.5}>{apiIssue.description}</Text>
                    </Box>
                  </HStack>
                  {apiIssue.kind === "redirect" && (
                    <Button onClick={redirectToBaseVerify} size="sm" bgGradient={VERIFY_GRADIENT} color="white" fontWeight="700"
                      borderRadius="lg" fontFamily="'Space Grotesk', sans-serif" alignSelf="flex-start"
                      rightIcon={<ExternalLinkIcon boxSize={3} />} _hover={{ opacity: 0.9 }}>
                      Verify with Coinbase
                    </Button>
                  )}
                </VStack>
              </Box>
            </MotionBox>
          )}

          {/* Stats — read live from the contract's own policy, same convention as the rest of the site */}
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={{ base: 2.5, md: 5 }} mb={{ base: 7, md: 10 }}>
            <StatCard index={0} icon="🏢" label="Provider" value={providerName ? providerName : "..."} description="Identity source" color={BLUE} />
            <StatCard index={1} icon="📋" label="Requirement" value={primaryCondition ? `${primaryCondition.name} ${primaryCondition.op} ${primaryCondition.value}` : "..."} description="Eligibility policy" color={SKY} />
            <StatCard index={2} icon="🌐" label="Network" value="Sepolia" description="Base testnet" color={MINT} />
            <StatCard index={3} icon="👤" label="Your Status" value={yourStatusLabel} description="This wallet" color={isParticipant ? MINT : BLUE} />
          </SimpleGrid>

          {/* Two-column layout: action flow left, policy + how-it-works right — uses the
              full page width instead of a single narrow centered column. */}
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={{ base: 5, md: 6 }} alignItems="start">
            <VStack spacing={5} align="stretch">
              <StatusCard isConnected={isConnected} isParticipant={isConnected ? isParticipant : undefined} walletAddress={address} />

              <Box
                bg="rgba(6,8,16,0.93)" backdropFilter="blur(28px)" borderRadius="2xl" border="1px solid" borderColor={`${BLUE}30`}
                overflow="hidden" position="relative"
              >
                <Box position="absolute" top={0} left={0} right={0} h="2px" bgGradient={VERIFY_GRADIENT} backgroundSize="200% 100%" style={{ animation: "shimmerBorder 3.5s infinite" }} />
                <Box p={{ base: 5, md: 6 }}>
                  <VStack spacing={4} align="stretch">
                    <HStack justify="space-between" align="center">
                      <Heading fontSize="lg" fontWeight="800" color="white" fontFamily="'Space Grotesk', sans-serif">
                        {alreadyDone ? "You're all set" : "Verify your eligibility"}
                      </Heading>
                      <Icon as={LockIcon} color={SKY} boxSize={4} />
                    </HStack>
                    <Text fontSize="sm" color="gray.400" fontFamily="'Space Grotesk', sans-serif" lineHeight="1.7">
                      {alreadyDone
                        ? "This wallet's identity is already enrolled. No further action needed."
                        : "This is a free signature first — no gas until the final on-chain step. We check your Coinbase status privately and only ask you to submit a transaction once you're confirmed eligible."}
                    </Text>

                    <Divider borderColor="rgba(255,255,255,0.08)" />

                    <Button
                      w="full" h="56px" fontWeight="800" fontSize="sm" color="white" borderRadius="xl"
                      bgGradient={VERIFY_GRADIENT} backgroundSize="200% auto"
                      _hover={{ transform: "translateY(-2px)", boxShadow: `0 16px 50px ${VERIFY_GLOW}`, backgroundPosition: "right center" }}
                      _active={{ transform: "scale(0.97)" }}
                      onClick={handleVerify}
                      isLoading={isBusy}
                      loadingText={stepLabel[step]}
                      spinner={<Spinner size="sm" />}
                      isDisabled={!isConnected || isBusy || alreadyDone}
                      fontFamily="'Space Grotesk', sans-serif"
                      transition="all 0.28s ease"
                    >
                      {alreadyDone ? "Already Enrolled ✅" : stepLabel.idle}
                    </Button>
                    {!isConnected && (
                      <Text fontSize="10px" color="gray.700" textAlign="center" fontFamily="'Space Grotesk', sans-serif">
                        Connect your wallet to continue
                      </Text>
                    )}
                  </VStack>
                </Box>
              </Box>
            </VStack>

            <Box
              bg="rgba(6,8,16,0.93)" backdropFilter="blur(28px)" borderRadius="2xl" border="1px solid" borderColor={`${SKY}30`}
              overflow="hidden" position="relative" h="full"
            >
              <Box position="absolute" top={0} left={0} right={0} h="2px" bgGradient={VERIFY_GRADIENT} backgroundSize="200% 100%" style={{ animation: "shimmerBorder 3.5s infinite" }} />
              <Box p={{ base: 5, md: 6 }}>
                <Heading fontSize="lg" fontWeight="800" color="white" fontFamily="'Space Grotesk', sans-serif" mb={4}>
                  How it works
                </Heading>
                <VStack spacing={3} align="stretch">
                  {[
                    { icon: "✍️", color: BLUE, title: "1. Sign a message", text: "Prove wallet ownership with a free signature — no gas, no transaction yet." },
                    { icon: "🔍", color: SKY, title: "2. We check eligibility", text: "Base Verify reads this contract's policy and checks your real credential against it, privately." },
                    { icon: "⛓️", color: MINT, title: "3. Enroll on-chain", text: "Submit the signed result — your identity is recorded once, deduplicated across every wallet you own." },
                  ].map((item) => (
                    <Box key={item.title} p={4} bg={`${item.color}0d`} borderRadius="xl" border={`1px solid ${item.color}30`}>
                      <HStack spacing={3} align="start">
                        <Text fontSize="xl" flexShrink={0}>{item.icon}</Text>
                        <Box>
                          <Text fontWeight="700" color={item.color} fontSize="sm" mb={1} fontFamily="'Space Grotesk', sans-serif">{item.title}</Text>
                          <Text fontSize="xs" color="gray.400" lineHeight="1.7" fontFamily="'Space Grotesk', sans-serif">{item.text}</Text>
                        </Box>
                      </HStack>
                    </Box>
                  ))}
                </VStack>
                <Box h="1px" bg={`linear-gradient(90deg, transparent, ${BLUE}30, transparent)`} my={4} />
                <VStack spacing={2} align="stretch">
                  {[
                    { dot: MINT, text: "We never see your identity — only a one-way hash" },
                    { dot: BLUE, text: "Same person, any wallet, counted once" },
                    { dot: SKY, text: "Verification expires in minutes if unused" },
                  ].map(({ dot, text }) => (
                    <HStack key={text} spacing={2}>
                      <Box w="6px" h="6px" borderRadius="full" bg={dot} flexShrink={0} boxShadow={`0 0 8px ${dot}`} />
                      <Text fontSize="xs" color="gray.400" fontFamily="'Space Grotesk', sans-serif">{text}</Text>
                    </HStack>
                  ))}
                </VStack>
                <Link href={`${EXPLORER_ADDRESS_URL}${VERIFY_CONTRACT_ADDRESS}`} isExternal _hover={{ textDecoration: "none" }}>
                  <Button
                    mt={4} w="full" size="sm" variant="outline" borderColor="rgba(255,255,255,0.12)" color="gray.400"
                    borderRadius="lg" fontFamily="'Space Grotesk', sans-serif" rightIcon={<ExternalLinkIcon boxSize={3} />}
                    _hover={{ bg: `${BLUE}14`, borderColor: `${BLUE}45`, color: "white" }}
                  >
                    View Contract
                  </Button>
                </Link>
              </Box>
            </Box>
          </SimpleGrid>

          <Footer />
        </Container>
      </Box>
    </>
  );
}

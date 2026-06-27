// src/pages/Vault.tsx
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
  Image,
  Input,
  InputGroup,
  InputRightElement,
  Divider,
  Tooltip,
  Skeleton,
} from "@chakra-ui/react";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  useAccount,
  useBalance,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useChainId,
  useSwitchChain,
} from "wagmi";
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { ChevronLeftIcon, InfoIcon, CopyIcon, WarningTwoIcon } from "@chakra-ui/icons";
import { motion, AnimatePresence } from "framer-motion";
import { formatEther, formatUnits, parseEther, parseUnits } from "viem";

import { useFixScroll } from "../hooks/useFixScroll";
import { useNavigate } from "react-router-dom";
import { VaultABI } from "../abi/Vault";
import { ERC20ABI } from "../abi/ERC20";
import { soneiumChain } from "../wagmi";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const BRAND = "Agent Vault";
const SONEIUM_CHAIN_ID = 1868;

const CONTRACTS = {
  Vault: "0xc03Cd4C759825AC5c6240F15c07dE87dF12480A3" as `0x${string}`,
  LXP:   "0x8A66ACe4B63Ee9f64B62172d68c230A2d655116b" as `0x${string}`,
  USDC:  "0xbA9986D2381edf1DA03B0B9c1f8b00dc4AacC369" as `0x${string}`,
  USDT:  "0x102d758f688a4C1C5a80b116bD945d4455460282" as `0x${string}`,
  USDC_DECIMALS: 6,
  USDT_DECIMALS: 6,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Motion wrapper
// ─────────────────────────────────────────────────────────────────────────────
const MotionBox = motion(Box);

// ─────────────────────────────────────────────────────────────────────────────
// Global styles
// ─────────────────────────────────────────────────────────────────────────────
const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap');

  @keyframes shimmer {
    0%   { background-position: -200% 0; }
    100% { background-position:  200% 0; }
  }
  @keyframes pulseGlow {
    0%, 100% { opacity: 0.5; }
    50%       { opacity: 1;   }
  }
  @keyframes floatSlow {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-8px); }
  }
  @keyframes orbDrift {
    0%, 100% { transform: scale(1)   translateY(0px);   opacity: 0.4; }
    50%       { transform: scale(1.1) translateY(-22px); opacity: 0.65; }
  }
  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0);   }
  }

  /* Remove number input spinners */
  input[type=number]::-webkit-outer-spin-button,
  input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
  input[type=number] { -moz-appearance: textfield; }
`;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
export function formatDisplay(value: string, symbol: string): string {
  const n = parseFloat(value ?? "0");
  if (isNaN(n)) return "0";
  if (symbol === "ETH") return n.toFixed(6);
  if (symbol === "USDC" || symbol === "USDT" || symbol === "USDT0") return n.toFixed(2);
  return n.toFixed(6);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function pollReceipt(txHash: `0x${string}`, timeoutMs = 90_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const rec = await (window as any).ethereum.request({
        method: "eth_getTransactionReceipt",
        params: [txHash],
      });
      if (rec?.blockNumber) return;
    } catch {}
    await sleep(1_500);
  }
  throw new Error("Transaction receipt timeout.");
}

// ─────────────────────────────────────────────────────────────────────────────
// Design tokens
// ─────────────────────────────────────────────────────────────────────────────
const TOKEN_COLORS = {
  ETH:  { base: "#9ca3af", glow: "rgba(156,163,175,0.25)", bar: "linear-gradient(90deg,#6b7280,#9ca3af,#6b7280)" },
  USDC: { base: "#60a5fa", glow: "rgba(96,165,250,0.25)",  bar: "linear-gradient(90deg,#3b82f6,#60a5fa,#3b82f6)" },
  USDT: { base: "#4ade80", glow: "rgba(74,222,128,0.25)",  bar: "linear-gradient(90deg,#22c55e,#4ade80,#22c55e)" },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// WrongNetworkBanner
// ─────────────────────────────────────────────────────────────────────────────
function WrongNetworkBanner({ onSwitch }: { onSwitch: () => void }) {
  return (
    <AnimatePresence>
      <MotionBox
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -16 }}
        transition={{ duration: 0.35 }}
        mb={6}
      >
        <Box
          position="relative"
          overflow="hidden"
          borderRadius="2xl"
          bg="rgba(239,68,68,0.06)"
          border="1px solid rgba(239,68,68,0.18)"
          backdropFilter="blur(16px)"
          p={{ base: 3, md: 4 }}
        >
          <Box
            position="absolute" top={0} left={0} right={0} h="2px"
            bgGradient="linear(90deg, transparent, #ef4444, #f97316, #ef4444, transparent)"
            backgroundSize="300% 100%"
            sx={{ animation: "shimmer 3s linear infinite" }}
          />
          <Flex align="center" gap={4} flexWrap="wrap">
            <Flex align="center" justify="center" w="40px" h="40px" borderRadius="full"
              bg="rgba(239,68,68,0.1)" border="1px solid rgba(239,68,68,0.2)" flexShrink={0}>
              <WarningTwoIcon color="#f87171" boxSize={4} />
            </Flex>
            <Box flex="1">
              <Text fontSize="sm" fontWeight="700" color="#f87171" fontFamily="'Space Grotesk', sans-serif">
                Wrong Network
              </Text>
              <Text fontSize="xs" color="gray.400" fontFamily="'Space Grotesk', sans-serif">
                Agent Vault runs exclusively on{" "}
                <Text as="span" color="gray.300" fontWeight="600">Soneium</Text>.
                Switch your network to continue.
              </Text>
            </Box>
            <Button
              size="sm" borderRadius="full" fontWeight="700" px={6} onClick={onSwitch}
              bg="linear-gradient(135deg,#f97316,#ef4444)" color="white"
              fontFamily="'Space Grotesk', sans-serif"
              _hover={{ transform: "translateY(-2px)", boxShadow: "0 4px 24px rgba(249,115,22,0.35)" }}
              transition="all 0.2s"
            >
              Switch to Soneium
            </Button>
          </Flex>
        </Box>
      </MotionBox>
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ConnectPrompt — shown when wallet is disconnected
// ─────────────────────────────────────────────────────────────────────────────
function ConnectPrompt() {
  return (
    <MotionBox
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <Box
        borderRadius="3xl" border="1px dashed rgba(45,212,191,0.2)"
        bg="rgba(4,4,14,0.7)" backdropFilter="blur(20px)"
        p={{ base: 8, md: 12 }} textAlign="center"
      >
        <Box fontSize="40px" mb={4} sx={{ animation: "floatSlow 4s ease-in-out infinite" }}>🔐</Box>
        <Heading size="md" color="white" fontFamily="'Space Grotesk', sans-serif" fontWeight="700" mb={2}>
          Connect Your Wallet
        </Heading>
        <Text fontSize="sm" color="gray.400" fontFamily="'Space Grotesk', sans-serif" maxW="340px" mx="auto">
          Connect a wallet to view your Vault balances, deposit assets and track LXP rewards.
        </Text>
      </Box>
    </MotionBox>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// StatCard
// ─────────────────────────────────────────────────────────────────────────────
function StatCard({ stat, index }: { stat: any; index: number }) {
  return (
    <MotionBox
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.07 }}
      h="full"
    >
      <Box
        position="relative" overflow="hidden" h="full"
        bg="rgba(4,4,14,0.88)" backdropFilter="blur(20px)"
        borderRadius="2xl" p={{ base: 4, md: 5 }}
        border={`1px solid ${stat.color}18`}
        _hover={{ borderColor: `${stat.color}40`, boxShadow: `0 0 40px ${stat.glow}` }}
        transition="all 0.3s ease"
      >
        <Box position="absolute" top={0} left={0} right={0} h="1px"
          bg={`linear-gradient(90deg,transparent,${stat.color}55,transparent)`} />
        <Box position="absolute" top={0} right={0} w="70px" h="70px"
          bg={`radial-gradient(circle at top right,${stat.color}12,transparent 70%)`} />

        <HStack spacing={3} align="center" position="relative" zIndex={1}>
          <Flex align="center" justify="center"
            w={{ base: "42px", md: "50px" }} h={{ base: "42px", md: "50px" }}
            bg={`${stat.color}10`} border={`1px solid ${stat.color}20`}
            borderRadius="xl" flexShrink={0} fontSize={{ base: "18px", md: "22px" }}
            sx={{ animation: "floatSlow 5s ease-in-out infinite" }}
          >
            {stat.icon}
          </Flex>
          <Box flex="1" minW="0">
            <Text fontSize="10px" color="gray.500" textTransform="uppercase"
              letterSpacing="0.2em" fontFamily="'Space Mono', monospace" fontWeight="600" mb={1}>
              {stat.label}
            </Text>
            <Text fontSize={{ base: "lg", md: "xl" }} fontWeight="800" color="white"
              fontFamily="'Space Mono', monospace" letterSpacing="-0.02em" lineHeight="1.2"
              sx={{ animation: "fadeSlideUp 0.5s ease-out forwards" }}>
              {stat.value}
            </Text>
            <Text fontSize="10px" color="gray.400" mt={1} fontFamily="'Space Grotesk', sans-serif" fontWeight="500">
              {stat.description}
            </Text>
          </Box>
        </HStack>
      </Box>
    </MotionBox>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BalanceRow — tiny reusable component
// ─────────────────────────────────────────────────────────────────────────────
function BalanceRow({
  label, value, symbol, color, loading,
}: { label: string; value: string; symbol: string; color?: string; loading?: boolean }) {
  return (
    <Box>
      <Text fontSize="9px" color="gray.500" fontWeight="600" textTransform="uppercase"
        letterSpacing="0.12em" fontFamily="'Space Mono', monospace" mb={0.5}>
        {label}
      </Text>
      {loading ? (
        <Skeleton height="24px" width="120px" borderRadius="md" startColor="gray.800" endColor="gray.700" />
      ) : (
        <Text fontSize="lg" fontWeight="700" color={color ?? "white"}
          fontFamily="'Space Mono', monospace" letterSpacing="-0.02em">
          {value}{" "}
          <Text as="span" fontSize="xs" fontWeight="400" color="gray.500">{symbol}</Text>
        </Text>
      )}
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AmountInput — deposit / withdraw input row
// ─────────────────────────────────────────────────────────────────────────────
function AmountInput({
  label, value, onChange, onMax, onAction, actionLabel, accentColor, isLoading,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onMax: () => void;
  onAction: () => Promise<void>;
  actionLabel: string;
  accentColor: string;
  isLoading?: boolean;
}) {
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    setBusy(true);
    try { await onAction(); } finally { setBusy(false); }
  }

  return (
    <VStack align="stretch" spacing={2}>
      <Text fontSize="9px" color="gray.500" fontWeight="600" textTransform="uppercase"
        letterSpacing="0.12em" fontFamily="'Space Mono', monospace">
        {label}
      </Text>
      <InputGroup size="sm">
        <Input
          type="number" placeholder="0.00" value={value}
          onChange={(e) => onChange(e.target.value)}
          bg="rgba(255,255,255,0.025)" color="white"
          border="1px solid rgba(255,255,255,0.07)"
          _focus={{ borderColor: accentColor, boxShadow: `0 0 0 2px ${accentColor}28` }}
          _placeholder={{ color: "gray.600" }}
          borderRadius="xl" fontSize="sm" height="42px"
          fontFamily="'Space Grotesk', sans-serif"
          _hover={{ borderColor: "rgba(255,255,255,0.14)" }}
          transition="all 0.2s"
        />
        <InputRightElement width="4rem" height="42px">
          <Button size="xs" variant="ghost" color={accentColor}
            onClick={onMax} fontSize="8px" fontWeight="800"
            fontFamily="'Space Mono', monospace"
            _hover={{ bg: `${accentColor}12` }} borderRadius="lg" px={2}>
            MAX
          </Button>
        </InputRightElement>
      </InputGroup>
      <Button
        w="full" h="40px" fontSize="xs" fontWeight="700" borderRadius="xl"
        bg={accentColor} color="white"
        onClick={handleClick}
        isLoading={busy || isLoading}
        loadingText="Confirming…"
        _hover={{ filter: "brightness(1.12)", transform: "translateY(-2px)", boxShadow: `0 8px 32px ${accentColor}40` }}
        _active={{ transform: "scale(0.97)" }}
        transition="all 0.2s"
        fontFamily="'Space Grotesk', sans-serif"
      >
        {actionLabel}
      </Button>
    </VStack>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VaultTokenCard
// ─────────────────────────────────────────────────────────────────────────────
type TokenSymbol = "ETH" | "USDC" | "USDT0";

function VaultTokenCard({
  symbol,
  tokenAddress,
  icon,
  onTransactionSuccess,
}: {
  symbol: TokenSymbol;
  tokenAddress?: string;
  icon: string;
  onTransactionSuccess: () => void;
}) {
  const { address } = useAccount();
  const toast = useToast();
  const { writeContractAsync } = useWriteContract();
  const [depositAmount,  setDepositAmount]  = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [lastTx, setLastTx] = useState<`0x${string}` | undefined>();

  const { isSuccess, isError } = useWaitForTransactionReceipt({ hash: lastTx });

  const isNative = symbol === "ETH";
  const displaySymbol = symbol === "USDT0" ? "USDT" : symbol;
  const tokenColor = TOKEN_COLORS[displaySymbol as keyof typeof TOKEN_COLORS];

  const decimals =
    symbol === "USDC"  ? CONTRACTS.USDC_DECIMALS :
    symbol === "USDT0" ? CONTRACTS.USDT_DECIMALS : 18;

  // ── wallet balance
  const { data: ethWallet, isLoading: ethWalletLoading } = useBalance({
    address, chainId: soneiumChain.id,
    query: { enabled: !!address && isNative, staleTime: 20_000, refetchInterval: 20_000 },
  });
  const { data: tokenWallet, isLoading: tokenWalletLoading } = useBalance({
    address, token: tokenAddress as `0x${string}`, chainId: soneiumChain.id,
    query: { enabled: !!address && !!tokenAddress && !isNative, staleTime: 20_000, refetchInterval: 20_000 },
  });

  const walletFormatted  = isNative ? (ethWallet?.formatted ?? "0") : (tokenWallet?.formatted ?? "0");
  const walletLoading    = isNative ? ethWalletLoading : tokenWalletLoading;

  // ── vault balance
  const { data: vaultETH, isLoading: vaultEthLoading } = useReadContract({
    address: CONTRACTS.Vault, abi: VaultABI, functionName: "getETHBalance",
    args: [address], chainId: soneiumChain.id,
    query: { enabled: !!address && isNative, staleTime: 20_000, refetchInterval: 20_000 },
  });
  const { data: vaultToken, isLoading: vaultTokenLoading } = useReadContract({
    address: CONTRACTS.Vault, abi: VaultABI, functionName: "getTokenBalance",
    args: tokenAddress ? [address, tokenAddress as `0x${string}`] : undefined,
    chainId: soneiumChain.id,
    query: { enabled: !!address && !!tokenAddress && !isNative, staleTime: 20_000, refetchInterval: 20_000 },
  });

  const vaultFormatted = isNative
    ? (vaultETH ? formatEther(vaultETH as bigint) : "0")
    : (vaultToken ? formatUnits(vaultToken as bigint, decimals) : "0");
  const vaultLoading   = isNative ? vaultEthLoading : vaultTokenLoading;

  // ── tx feedback
  useEffect(() => {
    if (isSuccess) {
      toast({ title: "Transaction confirmed ✓", status: "success", duration: 5000, isClosable: true, position: "top-right" });
      onTransactionSuccess();
    }
    if (isError) {
      toast({ title: "Transaction failed", description: "Check your wallet for details.", status: "error", duration: 7000, isClosable: true, position: "top-right" });
    }
  }, [isSuccess, isError]); // eslint-disable-line

  // ── get referrer from localStorage or URL
  const getReferrer = useCallback(() => {
    // First check localStorage
    let ref = localStorage.getItem("referrer");
    if (ref && ref !== "0x0000000000000000000000000000000000000000") {
      return ref;
    }
    
    // If not in localStorage, check URL params
    const params = new URLSearchParams(window.location.search);
    const urlReferrer = params.get("referrer");
    if (urlReferrer && urlReferrer.toLowerCase() !== address?.toLowerCase()) {
      // Save it to localStorage for future use
      localStorage.setItem("referrer", urlReferrer);
      return urlReferrer;
    }
    
    return "0x0000000000000000000000000000000000000000";
  }, [address]);

  // ── deposit
  async function handleDeposit() {
    const amt = parseFloat(depositAmount);
    if (!depositAmount || isNaN(amt) || amt <= 0) {
      toast({ title: "Enter a valid amount", status: "warning", duration: 4000, position: "top-right" }); 
      return;
    }
    
    // Get the referrer dynamically
    const referrer = getReferrer();
    
    try {
      if (isNative) {
        const hash = await writeContractAsync({
          address: CONTRACTS.Vault, abi: VaultABI, functionName: "depositETH",
          args: [referrer], value: parseEther(depositAmount), chainId: soneiumChain.id,
        });
        setLastTx(hash);
      } else {
        const amtBN = parseUnits(depositAmount, decimals);
        // check allowance
        const hexAllowance = await (window as any).ethereum.request({
          method: "eth_call",
          params: [{
            to: tokenAddress,
            data: `0xdd62ed3e${address?.replace("0x","").padStart(64,"0")}${CONTRACTS.Vault.replace("0x","").padStart(64,"0")}`,
          }, "latest"],
        });
        if (BigInt(hexAllowance ?? "0x0") < amtBN) {
          const approveHash = await writeContractAsync({
            address: tokenAddress as `0x${string}`, abi: ERC20ABI, functionName: "approve",
            args: [CONTRACTS.Vault, amtBN], chainId: soneiumChain.id,
          });
          try { await pollReceipt(approveHash); } catch { await sleep(4000); }
        }
        const hash = await writeContractAsync({
          address: CONTRACTS.Vault, abi: VaultABI, functionName: "depositToken",
          args: [tokenAddress, amtBN, referrer], chainId: soneiumChain.id,
        });
        setLastTx(hash);
      }
      setDepositAmount("");
    } catch (err: any) {
      toast({ title: "Deposit failed", description: err?.shortMessage ?? err?.message, status: "error", duration: 9000, isClosable: true, position: "top-right" });
    }
  }

  // ── withdraw
  async function handleWithdraw() {
    const amt = parseFloat(withdrawAmount);
    if (!withdrawAmount || isNaN(amt) || amt <= 0) {
      toast({ title: "Enter a valid amount", status: "warning", duration: 4000, position: "top-right" }); 
      return;
    }
    try {
      const hash = isNative
        ? await writeContractAsync({
            address: CONTRACTS.Vault, abi: VaultABI, functionName: "withdrawETH",
            args: [parseEther(withdrawAmount)], chainId: soneiumChain.id,
          })
        : await writeContractAsync({
            address: CONTRACTS.Vault, abi: VaultABI, functionName: "withdrawToken",
            args: [tokenAddress, parseUnits(withdrawAmount, decimals)], chainId: soneiumChain.id,
          });
      setLastTx(hash);
      setWithdrawAmount("");
    } catch (err: any) {
      toast({ title: "Withdrawal failed", description: err?.shortMessage ?? err?.message, status: "error", duration: 9000, isClosable: true, position: "top-right" });
    }
  }

  return (
    <MotionBox
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      whileHover={{ y: -4 }}
      h="full"
    >
      <Box
        position="relative" overflow="hidden" h="full"
        bg="rgba(4,4,14,0.88)" backdropFilter="blur(20px)"
        borderRadius="2xl" border="1px solid rgba(255,255,255,0.055)"
        _hover={{ borderColor: `${tokenColor.base}30`, boxShadow: `0 24px 64px ${tokenColor.glow}` }}
        transition="all 0.35s ease"
      >
        <Box position="absolute" top={0} left={0} right={0} h="2px"
          bg={tokenColor.bar} backgroundSize="200% 100%"
          sx={{ animation: "shimmer 3s linear infinite" }} />

        <Box p={{ base: 4, md: 5 }}>
          <HStack spacing={3} align="center" mb={5}>
            <Box sx={{ animation: "floatSlow 3s ease-in-out infinite" }}>
              <Image src={icon} alt={`${displaySymbol} icon`} boxSize="28px" borderRadius="full" />
            </Box>
            <Heading size="sm" fontWeight="700" color="white" fontFamily="'Space Grotesk', sans-serif">
              {displaySymbol} Vault
            </Heading>
            <Tooltip label={`Deposit or withdraw ${displaySymbol} in the Soneium vault`} hasArrow placement="top">
              <InfoIcon color="gray.600" boxSize={3} cursor="help" />
            </Tooltip>
          </HStack>

          <VStack align="stretch" spacing={4}>
            <SimpleGrid columns={2} spacing={3}>
              <BalanceRow label="In Wallet"    value={formatDisplay(walletFormatted, symbol)}  symbol={displaySymbol} loading={walletLoading} />
              <BalanceRow label="In Vault"     value={formatDisplay(vaultFormatted, symbol)}   symbol={displaySymbol} color={tokenColor.base}  loading={vaultLoading} />
            </SimpleGrid>

            <Divider borderColor="rgba(255,255,255,0.05)" />

            <AmountInput
              label="Deposit"
              value={depositAmount}
              onChange={setDepositAmount}
              onMax={() => setDepositAmount(walletFormatted)}
              onAction={handleDeposit}
              actionLabel={`Deposit ${displaySymbol}`}
              accentColor="#22c55e"
            />

            <AmountInput
              label="Withdraw"
              value={withdrawAmount}
              onChange={setWithdrawAmount}
              onMax={() => setWithdrawAmount(vaultFormatted)}
              onAction={handleWithdraw}
              actionLabel={`Withdraw ${displaySymbol}`}
              accentColor="#ef4444"
            />
          </VStack>
        </Box>
      </Box>
    </MotionBox>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SidePanel — Referral + LXP
// ─────────────────────────────────────────────────────────────────────────────
function SidePanel({ onTransactionSuccess }: { onTransactionSuccess: number }) {
  const { address } = useAccount();
  const toast = useToast();
  const { writeContractAsync } = useWriteContract();
  const [claimTx, setClaimTx] = useState<`0x${string}` | undefined>();
  const { isSuccess: claimOk } = useWaitForTransactionReceipt({ hash: claimTx });
  const [copying, setCopying] = useState(false);

  // Build referral link with the current path
  const referralLink = address ? `${window.location.origin}/tools/vault?referrer=${address}` : "";

  const { data: pending, refetch: refetchPending } = useReadContract({
    address: CONTRACTS.Vault, abi: VaultABI, functionName: "getPendingRewards",
    args: [address], chainId: soneiumChain.id,
    query: { enabled: !!address, staleTime: 12_000, refetchInterval: 12_000 },
  });
  const { data: lxpWallet } = useBalance({
    address, token: CONTRACTS.LXP, chainId: soneiumChain.id,
    query: { enabled: !!address, staleTime: 30_000, refetchInterval: 30_000 },
  });
  const { data: referralCount, refetch: refetchReferrals } = useReadContract({
    address: CONTRACTS.Vault, abi: VaultABI, functionName: "referralCount",
    args: [address], chainId: soneiumChain.id,
    query: { enabled: !!address, staleTime: 30_000, refetchInterval: 30_000 },
  });

  useEffect(() => {
    if (claimOk || onTransactionSuccess) {
      const id = setTimeout(() => { refetchPending(); refetchReferrals(); }, 800);
      if (claimOk) toast({ title: "LXP rewards claimed ✓", status: "success", duration: 5000, isClosable: true, position: "top-right" });
      return () => clearTimeout(id);
    }
  }, [claimOk, onTransactionSuccess]); // eslint-disable-line

  async function handleClaim() {
    try {
      const hash = await writeContractAsync({
        address: CONTRACTS.Vault, abi: VaultABI, functionName: "claimRewards",
        chainId: soneiumChain.id,
      });
      setClaimTx(hash);
    } catch (err: any) {
      toast({ title: "Claim failed", description: err?.shortMessage ?? err?.message, status: "error", duration: 8000, isClosable: true, position: "top-right" });
    }
  }

  async function handleCopy() {
    if (!referralLink) return;
    setCopying(true);
    try {
      await navigator.clipboard.writeText(referralLink);
      toast({ title: "Referral link copied", status: "success", duration: 3500, position: "top-right" });
    } catch {
      toast({ title: "Copy failed", description: "Use Ctrl+C", status: "error", duration: 5000, position: "top-right" });
    } finally { setCopying(false); }
  }

  const pendingAmt = pending ? parseFloat(formatUnits(pending as bigint, 18)) : 0;
  const hasPending = pendingAmt > 0.001;

  const panelBase = {
    bg: "rgba(4,4,14,0.88)" as const,
    backdropFilter: "blur(20px)" as const,
    borderRadius: "2xl" as const,
    border: "1px solid rgba(255,255,255,0.055)" as const,
    overflow: "hidden" as const,
    position: "relative" as const,
    transition: "all 0.35s ease" as const,
  };

  return (
    <VStack align="stretch" spacing={4}>

      {/* ── Referral */}
      <MotionBox initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.08 }} whileHover={{ y: -3 }}>
        <Box {...panelBase}
          _hover={{ borderColor: "rgba(45,212,191,0.28)", boxShadow: "0 20px 60px rgba(45,212,191,0.06)" }}>
          <Box position="absolute" top={0} left={0} right={0} h="2px"
            bg="linear-gradient(90deg,#2dd4bf,#0d9488,#2dd4bf)" backgroundSize="200% 100%"
            sx={{ animation: "shimmer 3s linear infinite" }} />
          <Box p={4}>
            <Flex justify="space-between" align="center" mb={3}>
              <Heading size="xs" fontWeight="700" color="white" fontFamily="'Space Grotesk', sans-serif">
                Referral Program
              </Heading>
              <HStack spacing={1.5}>
                <Box w="6px" h="6px" borderRadius="full" bg="#2dd4bf"
                  boxShadow="0 0 6px rgba(45,212,191,0.9)"
                  sx={{ animation: "pulseGlow 2s ease-in-out infinite" }} />
                <Text fontSize="9px" color="#2dd4bf" fontFamily="'Space Mono', monospace" fontWeight="700">
                  {referralCount ? referralCount.toString() : "0"} referred
                </Text>
              </HStack>
            </Flex>

            <Box mb={3}
              bg="rgba(45,212,191,0.04)" border="1px solid rgba(45,212,191,0.12)"
              borderRadius="lg" px={3} py={2}>
              <Text fontSize="9px" color="#2dd4bf" fontFamily="'Space Mono', monospace"
                isTruncated letterSpacing="0.04em">
                {referralLink || "Connect wallet to generate link"}
              </Text>
            </Box>

            <Button w="full" size="sm" leftIcon={<CopyIcon boxSize={3} />}
              bg="linear-gradient(135deg,#2dd4bf,#0d9488)" color="white"
              fontWeight="700" borderRadius="xl" h="36px" fontSize="xs"
              fontFamily="'Space Grotesk', sans-serif"
              isLoading={copying} loadingText="Copying…"
              onClick={handleCopy}
              _hover={{ transform: "translateY(-2px)", boxShadow: "0 10px 32px rgba(45,212,191,0.3)" }}
              _active={{ transform: "scale(0.97)" }} transition="all 0.2s">
              Copy Referral Link
            </Button>
          </Box>
        </Box>
      </MotionBox>

      {/* ── LXP */}
      <MotionBox initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.14 }} whileHover={{ y: -3 }}>
        <Box {...panelBase}
          _hover={{ borderColor: "rgba(167,139,250,0.28)", boxShadow: "0 20px 60px rgba(167,139,250,0.06)" }}>
          <Box position="absolute" top={0} left={0} right={0} h="2px"
            bg="linear-gradient(90deg,#8b5cf6,#a78bfa,#8b5cf6)" backgroundSize="200% 100%"
            sx={{ animation: "shimmer 3s linear infinite" }} />
          <Box p={4}>
            <Flex justify="space-between" align="center" mb={3}>
              <Heading size="xs" fontWeight="700" color="white" fontFamily="'Space Grotesk', sans-serif">
                LXP Rewards
              </Heading>
              <Badge colorScheme="purple" variant="subtle" fontSize="8px" px={2} py={0.5}
                borderRadius="full" fontFamily="'Space Mono', monospace">
                Live
              </Badge>
            </Flex>

            <SimpleGrid columns={2} spacing={2} mb={3}>
              {[
                { label: "Pending",     val: `${pendingAmt.toFixed(2)} LXP`, color: "#fbbf24" },
                { label: "In Wallet",   val: lxpWallet ? `${formatDisplay(lxpWallet.formatted, "LXP")} LXP` : "—", color: "#a78bfa" },
              ].map(({ label, val, color }) => (
                <Box key={label} bg="rgba(255,255,255,0.025)" borderRadius="lg" p={2.5}>
                  <Text fontSize="8px" color="gray.500" fontFamily="'Space Mono', monospace" textTransform="uppercase" letterSpacing="0.1em" mb={1}>{label}</Text>
                  <Text fontSize="sm" fontWeight="700" color={color} fontFamily="'Space Mono', monospace">{val}</Text>
                </Box>
              ))}
            </SimpleGrid>

            <Button w="full" size="sm" h="36px" fontSize="xs" fontWeight="700" borderRadius="xl"
              fontFamily="'Space Grotesk', sans-serif"
              isDisabled={!hasPending}
              bg={hasPending ? "linear-gradient(135deg,#8b5cf6,#7c3aed)" : "rgba(255,255,255,0.04)"}
              color={hasPending ? "white" : "gray.500"}
              onClick={handleClaim}
              _hover={hasPending ? { transform: "translateY(-2px)", boxShadow: "0 10px 32px rgba(139,92,246,0.3)" } : {}}
              _active={hasPending ? { transform: "scale(0.97)" } : {}}
              transition="all 0.2s">
              {hasPending ? `Claim ${pendingAmt.toFixed(2)} LXP` : "No pending rewards"}
            </Button>
          </Box>
        </Box>
      </MotionBox>
    </VStack>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VaultGrid
// ─────────────────────────────────────────────────────────────────────────────
function VaultGrid({ onSuccess }: { onSuccess: () => void }) {
  return (
    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={5}>
      <VaultTokenCard symbol="ETH"   icon="/eth.png"   onTransactionSuccess={onSuccess} />
      <VaultTokenCard symbol="USDC"  icon="/usdc.png" tokenAddress={CONTRACTS.USDC} onTransactionSuccess={onSuccess} />
      <VaultTokenCard symbol="USDT0" icon="/usdt.png" tokenAddress={CONTRACTS.USDT} onTransactionSuccess={onSuccess} />
    </SimpleGrid>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Footer
// ─────────────────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <Box pt={16} pb={10}>
      <Box h="1px" mb={10}
        bg="linear-gradient(90deg,transparent,rgba(45,212,191,0.2),rgba(192,38,211,0.2),transparent)" />
      
      <VStack spacing={6}>

        {/* Chain badge - Soneium only */}
        <Box px={5} py={2.5} borderRadius="full"
          bg="rgba(45,212,191,0.06)" border="1px solid rgba(45,212,191,0.2)"
          _hover={{ bg: "rgba(45,212,191,0.1)", transform: "translateY(-2px)", borderColor: "rgba(45,212,191,0.3)" }}
          transition="all 0.25s">
          <Text fontSize="11px" fontWeight="700" color="#2dd4bf"
            fontFamily="'Space Mono', monospace" letterSpacing="0.15em">
            ⚡ Soneium Network
          </Text>
        </Box>

        {/* Protocol meta - enhanced visibility */}
        <HStack spacing={0} bg="rgba(255,255,255,0.025)"
          border="1px solid rgba(255,255,255,0.06)"
          borderRadius="2xl" px={8} py={4} flexWrap="wrap" justify="center" gap={0}>
          {([
            ["Protocol", "ERC-4626"],
            ["Chain",    "Soneium"],
            ["Status",   "Live ✓"],
          ] as const).map(([label, value], i, arr) => (
            <HStack key={label} spacing={0}>
              <VStack spacing={0.5} px={{ base: 4, md: 7 }} py={1.5}>
                <Text fontSize="10px" color="gray.500" textTransform="uppercase"
                  letterSpacing="0.2em" fontFamily="'Space Mono', monospace" fontWeight="600">
                  {label}
                </Text>
                <Text fontSize="sm" fontWeight="700" color="gray.300"
                  fontFamily="'Space Mono', monospace">
                  {value}
                </Text>
              </VStack>
              {i < arr.length - 1 && <Box w="1px" h="32px" bg="rgba(255,255,255,0.06)" />}
            </HStack>
          ))}
        </HStack>

        {/* Copyright - improved visibility */}
        <Text fontSize="10px" color="gray.500" fontFamily="'Space Mono', monospace"
          letterSpacing="0.12em" textAlign="center" fontWeight="500">
          © {new Date().getFullYear()} · {BRAND} · Soneium Network · All rights reserved
        </Text>
      </VStack>
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VaultPage — root
// ─────────────────────────────────────────────────────────────────────────────
export default function VaultPage() {
  useFixScroll();

  const { address, isConnected } = useAccount();
  const chainId       = useChainId();
  const { switchChain } = useSwitchChain();
  const toast         = useToast();
  const navigate      = useNavigate();

  const [txTick, setTxTick]       = useState(0);
  const hasSignedRef = useRef(false);

  const onSuccess = useCallback(() => setTxTick((n) => n + 1), []);

  const isOnSoneium = chainId === SONEIUM_CHAIN_ID;

  // ── referral capture from URL
  useEffect(() => {
    if (!address) return;
    
    const params = new URLSearchParams(window.location.search);
    const referrer = params.get("referrer");
    
    // If no referrer in URL or it's the user's own address, ignore
    if (!referrer || referrer.toLowerCase() === address.toLowerCase()) {
      return;
    }

    // Check if we already have a referrer stored
    const storedReferrer = localStorage.getItem("referrer");
    if (storedReferrer && storedReferrer !== "0x0000000000000000000000000000000000000000") {
      hasSignedRef.current = true;
      return;
    }

    // Store the referrer immediately
    localStorage.setItem("referrer", referrer);
    hasSignedRef.current = true;

    // Request signature (optional but keeps record)
    (async () => {
      try {
        const msg = `Confirm referral for Agent Vault\nReferrer: ${referrer}\nBonus: +5 LXP on first deposit\nTimestamp: ${new Date().toISOString()}`;
        const sig = await (window as any).ethereum.request({ 
          method: "personal_sign", 
          params: [msg, address] 
        });
        localStorage.setItem("referralSignature", sig);
        toast({ 
          title: "Referral confirmed ✓", 
          status: "success", 
          duration: 5000, 
          isClosable: true, 
          position: "top-right" 
        });
      } catch (err: any) {
        // Referrer is still saved even if signature fails
        toast({ 
          title: "Referral saved", 
          description: "Continue with your deposit to activate the referral bonus.",
          status: "info", 
          duration: 5000, 
          isClosable: true, 
          position: "top-right" 
        });
      }
    })();

    // Optional: Clean URL after capturing referrer
    const newSearch = params.toString().replace(/referrer=[^&]*&?/, '');
    const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : '');
    window.history.replaceState({}, '', newUrl);
    
  }, [address]); // eslint-disable-line

  async function switchToSoneium() {
    try {
      await switchChain({ chainId: SONEIUM_CHAIN_ID });
      toast({ title: "Switched to Soneium ✓", status: "success", duration: 3000, position: "top-right" });
    } catch {
      toast({ title: "Switch failed", description: "Switch manually in your wallet.", status: "error", duration: 5000, position: "top-right" });
    }
  }

  const stats = useMemo(() => [
    { label: "Vaults Active", value: "3", icon: "🏦", color: "#4ade80", glow: "rgba(74,222,128,0.25)",  description: "Supported Assets" },
    { label: "LXP Distributed", value: "2,347",  icon: "⭐", color: "#a78bfa", glow: "rgba(167,139,250,0.25)", description: "Rewards Claimed" },
    { label: "Active Users", value: "1,234",  icon: "👤", color: "#fbbf24", glow: "rgba(251,191,36,0.25)",  description: "Unique Depositors" },
    { label: "Referrals", value: "194", icon: "🔗", color: "#2dd4bf", glow: "rgba(45,212,191,0.25)", description: "Total Referrals" },
  ], []);

  return (
    <>
      <style>{globalStyles}</style>

      <Box minH="100vh" bg="#03030f" position="relative" fontFamily="'Space Grotesk', sans-serif">

        {/* ── ambient orbs ── */}
        {[
          { top: "-12%", left: "-8%",  w: "620px", color: "rgba(45,212,191,0.11)",  dur: "22s",  delay: "0s" },
          { bottom: "-12%", right: "-8%", w: "720px", color: "rgba(192,38,211,0.09)", dur: "30s", delay: "8s" },
          { top: "45%", left: "28%",   w: "440px", color: "rgba(37,99,235,0.07)",   dur: "18s",  delay: "4s" },
        ].map((orb, i) => (
          <Box key={i} position="fixed" borderRadius="full" zIndex={0} pointerEvents="none"
            filter="blur(100px)"
            bg={`radial-gradient(circle,${orb.color} 0%,transparent 65%)`}
            w={orb.w} h={orb.w}
            sx={{ animation: `orbDrift ${orb.dur} ease-in-out infinite ${orb.delay}` }}
            {...(orb as any)} />
        ))}

        {/* ── dot grid ── */}
        <Box position="fixed" inset={0} zIndex={0} pointerEvents="none" opacity={0.016}
          bgImage="radial-gradient(rgba(255,255,255,0.8) 1px,transparent 1px)" bgSize="30px 30px" />

        <Container maxW="1440px" position="relative" zIndex={1}
          px={{ base: 3, md: 6, lg: 8 }} py={{ base: 4, md: 8 }}>

          {/* ── Header ── */}
          <Flex justify="space-between" align="center" mb={{ base: 6, md: 10 }}
            direction={{ base: "column", md: "row" }} gap={{ base: 3, md: 0 }}>
            <HStack spacing={4}>
              <Button onClick={() => navigate("/")} variant="ghost" size={{ base: "sm", md: "md" }}
                leftIcon={<ChevronLeftIcon />} color="gray.400"
                border="1px solid rgba(255,255,255,0.06)" borderRadius="xl"
                fontFamily="'Space Grotesk', sans-serif" fontWeight="500"
                _hover={{ color: "white", bg: "rgba(45,212,191,0.07)", borderColor: "rgba(45,212,191,0.22)" }}
                transition="all 0.2s">
                Back
              </Button>

              <Box h="36px" w="1px" bg="rgba(255,255,255,0.04)" display={{ base: "none", md: "block" }} />

              <VStack align="start" spacing={0.5}>
                <HStack spacing={3} align="center">
                  <Box w="7px" h="7px" borderRadius="full" bg="#4ade80"
                    boxShadow="0 0 10px rgba(74,222,128,0.9)"
                    sx={{ animation: "pulseGlow 2.5s ease-in-out infinite" }} />
                  <Heading
                    fontSize={{ base: "xl", md: "2xl", lg: "3xl" }}
                    fontWeight="800" letterSpacing="-0.03em"
                    fontFamily="'Space Grotesk', sans-serif"
                    bgGradient="linear(135deg,#2dd4bf 0%,#c026d3 55%,#fbbf24 100%)"
                    bgClip="text">
                    Agent Vault
                  </Heading>
                  <Badge bg="rgba(45,212,191,0.08)" color="#2dd4bf" fontSize="8px"
                    px={2} py={0.5} borderRadius="full"
                    border="1px solid rgba(45,212,191,0.18)"
                    fontFamily="'Space Mono', monospace">
                    v2.1
                  </Badge>
                </HStack>
                <HStack spacing={2}>
                  <Text color="gray.500" fontSize={{ base: "9px", md: "10px" }}
                    letterSpacing="0.2em" fontFamily="'Space Mono', monospace" textTransform="uppercase" fontWeight="500">
                    Deposit · Secure · Earn LXP
                  </Text>
                  <Box px={2} py={0.5} bg="rgba(45,212,191,0.07)"
                    border="1px solid rgba(45,212,191,0.15)" borderRadius="full">
                    <Text fontSize="8px" color="#2dd4bf" fontFamily="'Space Mono', monospace" fontWeight="700">
                      Soneium only
                    </Text>
                  </Box>
                </HStack>
              </VStack>
            </HStack>

            <Box display={{ base: "none", md: "block" }}
              _hover={{ transform: "scale(1.02)" }} transition="transform 0.2s">
              <ConnectButton chainStatus="full" accountStatus="full" showBalance={false} />
            </Box>
          </Flex>

          {/* ── Mobile wallet ── */}
          <Flex display={{ base: "flex", md: "none" }} justify="center" mb={5}>
            <ConnectButton chainStatus="full" accountStatus="full" showBalance={false} />
          </Flex>

          {/* ── Wrong network ── */}
          {isConnected && !isOnSoneium && <WrongNetworkBanner onSwitch={switchToSoneium} />}

          {/* ── Stats ── */}
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={{ base: 3, md: 4 }} mb={{ base: 7, md: 10 }}>
            {stats.map((s, i) => <StatCard key={s.label} stat={s} index={i} />)}
          </SimpleGrid>

          {/* ── Main content ── */}
          {!isConnected ? (
            <ConnectPrompt />
          ) : (
            <Flex gap={7} direction={{ base: "column", lg: "row" }} align="flex-start">
              <Box flex="1" minW="0">
                <VaultGrid onSuccess={onSuccess} />
              </Box>
              <Box flexShrink={0} w={{ base: "100%", lg: "272px" }}>
                <SidePanel onTransactionSuccess={txTick} />
              </Box>
            </Flex>
          )}

          <Footer />
        </Container>
      </Box>
    </>
  );
}

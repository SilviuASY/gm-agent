// src/pages/Bridge.tsx
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
  useToast,
  Link,
  SimpleGrid,
  Spinner,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  useDisclosure,
  Image,
} from "@chakra-ui/react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { ChevronLeftIcon, ExternalLinkIcon } from "@chakra-ui/icons";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { LiFiWidget, useAvailableChains, useWidgetEvents, WidgetEvent } from "@lifi/widget";
import { useSyncWagmiConfig } from "@lifi/wallet-management";
import {
  useMemo,
  useEffect,
  useState,
  useRef,
  useCallback,
  Component,
  type ReactNode,
} from "react";
import { useFixScroll } from "../hooks/useFixScroll";

import { config } from "../wagmi";

// ============= Motion =============
const MotionBox = motion(Box);


const LIFI_API_KEY = (import.meta as any).env?.VITE_LIFI_API_KEY as string | undefined;

if (!LIFI_API_KEY) {
  const message =
    "VITE_LIFI_API_KEY is not set. Add it to your .env file (request a key at https://apidocs.li.fi/). " +
    "Without it, the LI.FI widget runs on a shared/rate-limited tier.";
  if ((import.meta as any).env?.PROD) {
    throw new Error(`[Bridge] ${message}`);
  } else {
    console.warn(`[Bridge] ${message}`);
  }
}

const PLATFORM_FEE = 0.001; // 0.1%

const DEFAULT_FROM_CHAIN = 1868;
const EVM_ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

const parseChainId = (value: string | null): number | undefined => {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
};


const LIFI_API_BASE_URL = "https://li.quest/v1";
const LIFI_INTEGRATOR = "PulseVault";

interface BridgeHistoryEntry {
  id: string;
  timestamp: number;
  fromChainId?: number;
  toChainId?: number;
  fromSymbol?: string;
  toSymbol?: string;
  fromAmountUSD?: string;
  toAmountUSD?: string;
  txLink?: string;
  failed: boolean;
  pending: boolean;
}

const mapTransferToEntry = (t: any): BridgeHistoryEntry => {
  const sending = t?.sending ?? {};
  const receiving = t?.receiving ?? {};

  return {
    id: t?.transactionId || sending?.txHash || `${sending?.timestamp ?? Date.now()}-${sending?.chainId ?? 0}`,
    timestamp: sending?.timestamp ? sending.timestamp * 1000 : Date.now(),
    fromChainId: sending?.chainId,
    toChainId: receiving?.chainId,
    fromSymbol: sending?.token?.symbol,
    toSymbol: receiving?.token?.symbol,
    fromAmountUSD: sending?.amountUSD,
    toAmountUSD: receiving?.amountUSD,
    txLink: t?.lifiExplorerLink || sending?.txLink,
    failed: t?.status === "FAILED",
    pending: t?.status === "PENDING",
  };
};

const fetchLifiTransactionHistory = async (wallet: string): Promise<BridgeHistoryEntry[]> => {
  const tenYearsAgo = new Date();
  tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);

  const url = new URL(`${LIFI_API_BASE_URL}/analytics/transfers`);
  url.searchParams.set("integrator", LIFI_INTEGRATOR);
  url.searchParams.set("wallet", wallet);
  url.searchParams.set("fromTimestamp", Math.floor(tenYearsAgo.getTime() / 1000).toString());
  url.searchParams.set("toTimestamp", Math.floor(Date.now() / 1000).toString());

  const headers: Record<string, string> = { "x-lifi-integrator": LIFI_INTEGRATOR };
  if (LIFI_API_KEY) headers["x-lifi-api-key"] = LIFI_API_KEY;

  const response = await fetch(url.toString(), { headers });
  if (!response.ok) {
    throw new Error(`LI.FI history request failed (${response.status})`);
  }

  const data = await response.json();
  const transfers = data?.transfers ?? [];

  return transfers
    .map(mapTransferToEntry)
    .sort((a: BridgeHistoryEntry, b: BridgeHistoryEntry) => b.timestamp - a.timestamp)
    .slice(0, 20);
};

const formatTimeAgo = (timestamp: number): string => {
  const diffMin = Math.floor((Date.now() - timestamp) / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  return `${Math.floor(diffH / 24)}d ago`;
};

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
  @keyframes shimmerBtn {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }
  @keyframes spinFade {
    0%   { opacity: 0.4; }
    50%  { opacity: 1; }
    100% { opacity: 0.4; }
  }

  .lifi-widget-container {
    width: 100% !important;
    max-width: 480px !important;
    margin: 0 auto !important;
    min-height: 500px !important;
    position: relative !important;
  }

  .lifi-widget-container > div {
    border-radius: 24px !important;
    border: 1px solid rgba(139,92,246,0.2) !important;
    background: rgba(4,4,14,0.85) !important;
    backdrop-filter: blur(24px) !important;
    box-shadow: 0 8px 40px rgba(0,0,0,0.3) !important;
    overflow: hidden !important;
    transition: all 0.3s ease !important;
    min-height: 500px !important;
  }

  .lifi-widget-container > div:hover {
    border-color: rgba(139,92,246,0.4) !important;
    box-shadow: 0 8px 60px rgba(139,92,246,0.1) !important;
  }

  /* Force dark theme for LiFi widget */
  .lifi-widget-container * {
    color-scheme: dark !important;
  }
  
  .lifi-widget-container .MuiPaper-root {
    background-color: rgba(4,4,14,0.95) !important;
    color: #ffffff !important;
  }
  
  .lifi-widget-container .MuiInputBase-root {
    background-color: rgba(255,255,255,0.05) !important;
    color: #ffffff !important;
  }
  
  .lifi-widget-container .MuiOutlinedInput-notchedOutline {
    border-color: rgba(139,92,246,0.3) !important;
  }
  
  .lifi-widget-container .MuiTypography-root {
    color: #ffffff !important;
  }
  
  .lifi-widget-container .MuiTypography-colorTextSecondary {
    color: #9ca3af !important;
  }
  
  .lifi-widget-container .MuiButton-root {
    background: linear-gradient(135deg, #8b5cf6, #ec4899) !important;
    color: #ffffff !important;
  }
`;

// =====================================================================
// PageErrorBoundary
// =====================================================================
interface PageErrorBoundaryState {
  hasError: boolean;
}

class PageErrorBoundary extends Component<
  { children: ReactNode },
  PageErrorBoundaryState
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: unknown) {
    console.error("Page-level error (Bridge):", error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box
          minH="100vh"
          bg="#03030f"
          display="flex"
          alignItems="center"
          justifyContent="center"
          fontFamily="'Space Grotesk', sans-serif"
          px={4}
        >
          <VStack spacing={4} maxW="420px" textAlign="center">
            <Text fontSize="48px">⚠️</Text>
            <Text color="white" fontSize="lg" fontWeight="700">
              Something went wrong
            </Text>
            <Text color="gray.400" fontSize="sm">
              An unexpected error occurred. Please reload and check if the transaction has already been processed in your wallet.
            </Text>
            <Button
              onClick={this.handleReload}
              bg="rgba(139,92,246,0.15)"
              color="#c4b5fd"
              border="1px solid rgba(139,92,246,0.3)"
              _hover={{ bg: "rgba(139,92,246,0.25)" }}
              borderRadius="lg"
            >
              Reload page
            </Button>
          </VStack>
        </Box>
      );
    }
    return this.props.children;
  }
}

// =====================================================================
// WidgetErrorBoundary
// =====================================================================
interface WidgetErrorBoundaryProps {
  children: ReactNode;
  onRetry: () => void;
}
interface WidgetErrorBoundaryState {
  hasError: boolean;
}

class WidgetErrorBoundary extends Component<
  WidgetErrorBoundaryProps,
  WidgetErrorBoundaryState
> {
  constructor(props: WidgetErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: unknown) {
    console.error("LiFi widget error:", error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
    this.props.onRetry();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box
          textAlign="center"
          py={10}
          px={4}
          bg="rgba(0,0,0,0.3)"
          borderRadius="xl"
          border="1px solid rgba(239,68,68,0.25)"
        >
          <Text fontSize="40px" mb={3}>⚠️</Text>
          <Text color="gray.300" fontSize="sm" fontFamily="'Space Grotesk', sans-serif" mb={1}>
            The bridge widget encountered an error
          </Text>
          <Text color="gray.500" fontSize="xs" fontFamily="'Space Grotesk', sans-serif" mb={4}>
            This can happen temporarily when switching networks. Please try again.
          </Text>
          <Button
            size="sm"
            onClick={this.handleRetry}
            bg="rgba(139,92,246,0.15)"
            color="#c4b5fd"
            border="1px solid rgba(139,92,246,0.3)"
            _hover={{ bg: "rgba(139,92,246,0.25)" }}
            borderRadius="lg"
            fontFamily="'Space Grotesk', sans-serif"
          >
            Try again
          </Button>
        </Box>
      );
    }
    return this.props.children;
  }
}

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
            { label: "Bridge", value: "LI.FI ✓" },
            { label: "Chains", value: "70+" },
          ].map(({ label, value }, i, arr) => (
            <HStack key={label} spacing={0}>
              <VStack spacing={0} px={{ base: 4, md: 6 }} py={1}>
                <Text
                  fontSize="10px"
                  color="gray.500"
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
            fontSize="12px"
            color="gray.500"
            fontFamily="'Space Mono', monospace"
            letterSpacing="0.12em"
            textAlign="center"
          >
            © {currentYear} · Agent Protocol · Cross-Chain Bridge
          </Text>
          <Text
            fontSize="10px"
            color="gray.500"
            fontFamily="'Space Mono', monospace"
            letterSpacing="0.08em"
          >
            Powered by LI.FI · Built on Soneium
          </Text>
        </VStack>
      </VStack>
    </Box>
  );
};

// ============= Main Page =============
export default function Bridge() {
  const navigate = useNavigate();
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync, isPending: isSwitchPending } = useSwitchChain();
  const toast = useToast();

  const routeParams = useParams<{ tokens?: string }>();
  const [searchParams] = useSearchParams();

  const [widgetKey, setWidgetKey] = useState(0);
  const [isSwitchingChain, setIsSwitchingChain] = useState(false);
  const [history, setHistory] = useState<BridgeHistoryEntry[]>([]);

  const { isOpen: isHistoryOpen, onOpen: openHistory, onClose: closeHistory } = useDisclosure();

  const isSwitchingRef = useRef(false);
  const lastAddressRef = useRef<string | undefined>(address);
  const lastPrefillKeyRef = useRef<string>("");

  useFixScroll();

  // =====================================================================
  // Global safety net for uncaught errors
  // =====================================================================
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error("Uncaught error (bridge widget):", event.reason);
      event.preventDefault();
    };
    const handleGlobalError = (event: ErrorEvent) => {
      console.error("Uncaught global error (bridge widget):", event.error || event.message);
    };
    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    window.addEventListener("error", handleGlobalError);
    return () => {
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
      window.removeEventListener("error", handleGlobalError);
    };
  }, []);

  // =====================================================================
  // Bridge history — fetched from the same LI.FI API the widget's own history page
  // uses (see the BridgeHistoryEntry/fetchLifiTransactionHistory comment above for why).
  // =====================================================================
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!address) {
      setHistory([]);
      return;
    }
    setIsHistoryLoading(true);
    setHistoryError(null);
    try {
      const entries = await fetchLifiTransactionHistory(address);
      setHistory(entries);
    } catch (err) {
      console.warn("Could not fetch bridge transaction history:", err);
      setHistoryError("Could not load transaction history right now.");
    } finally {
      setIsHistoryLoading(false);
    }
  }, [address]);

  // Load on mount / whenever the wallet changes
  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Refresh right before showing the drawer, so it's as fresh as possible
  useEffect(() => {
    if (isHistoryOpen) fetchHistory();
  }, [isHistoryOpen, fetchHistory]);

  // The API can take a few seconds to index a transaction after it completes, so refresh
  // shortly after (rather than instantly) when the widget reports a route finished.
  const widgetEvents = useWidgetEvents();

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    const refreshSoon = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(fetchHistory, 4000);
    };

    widgetEvents.on(WidgetEvent.RouteExecutionCompleted, refreshSoon);
    widgetEvents.on(WidgetEvent.RouteExecutionFailed, refreshSoon);

    return () => {
      clearTimeout(timeoutId);
      widgetEvents.off(WidgetEvent.RouteExecutionCompleted, refreshSoon);
      widgetEvents.off(WidgetEvent.RouteExecutionFailed, refreshSoon);
    };
  }, [widgetEvents, fetchHistory]);

  // =====================================================================
  // Token pre-selection from URL
  // =====================================================================
  const tokenPrefill = useMemo(() => {
    let fromToken: string | undefined;
    let toToken: string | undefined;

    if (routeParams.tokens) {
      const parts = routeParams.tokens.split(/[-/]/).filter(Boolean);
      if (parts[0] && EVM_ADDRESS_RE.test(parts[0])) fromToken = parts[0];
      if (parts[1] && EVM_ADDRESS_RE.test(parts[1])) toToken = parts[1];
    }

    const qFromToken = searchParams.get("fromToken");
    const qToToken = searchParams.get("toToken");
    if (qFromToken && EVM_ADDRESS_RE.test(qFromToken)) fromToken = qFromToken;
    if (qToToken && EVM_ADDRESS_RE.test(qToToken)) toToken = qToToken;

    return {
      fromToken,
      toToken,
      fromChain: parseChainId(searchParams.get("fromChain")),
      toChain: parseChainId(searchParams.get("toChain")),
    };
  }, [routeParams.tokens, searchParams]);

  const { chains: availableChainsRaw } = useAvailableChains();

  // =====================================================================
  // Use chains directly from wagmi config
  // =====================================================================
  const wagmiChains = useMemo(() => {
    return config.chains as any[];
  }, []);

  // Combine wagmi chains with LiFi chains
  const combinedChains = useMemo(() => {
    const wagmiIds = wagmiChains.map((c) => c.id);
    const others = (availableChainsRaw ?? []).filter(
      (c) => !wagmiIds.includes(c.id)
    );
    return [...wagmiChains, ...others];
  }, [wagmiChains, availableChainsRaw]);

  // Sync wagmi config with LiFi
  useSyncWagmiConfig(config, [], combinedChains);

  // List of supported chains for bridging
  const supportedChainIds = useMemo(
    () => combinedChains.map((c) => c.id),
    [combinedChains]
  );

  // =====================================================================
  // Remount widget when the account changes OR when a deep-link brings new
  // prefill values (fromToken/toToken/fromChain/toChain) — e.g. navigating
  // client-side from /bridge/tokenA-tokenB to /bridge/tokenC-tokenD used to
  // leave the widget showing the old pair, since only the address change
  // triggered a remount before.
  // =====================================================================
  const prefillKey = useMemo(
    () =>
      JSON.stringify({
        fromToken: tokenPrefill.fromToken,
        toToken: tokenPrefill.toToken,
        fromChain: tokenPrefill.fromChain,
        toChain: tokenPrefill.toChain,
      }),
    [tokenPrefill]
  );

  useEffect(() => {
    const addressChanged = lastAddressRef.current !== address;
    const prefillChanged = lastPrefillKeyRef.current !== prefillKey;
    lastAddressRef.current = address;
    lastPrefillKeyRef.current = prefillKey;

    if (!addressChanged && !prefillChanged) return;

    setWidgetKey((prev) => prev + 1);
  }, [address, prefillKey]);

  // =====================================================================
  // Handler for chain switch
  // =====================================================================
  const handleBridgeChainSwitch = useCallback(async (
    targetChainId: number
  ): Promise<boolean> => {
    if (isSwitchingRef.current) {
      return false;
    }

    const isSupported = supportedChainIds.includes(targetChainId);
    if (!isSupported) {
      toast({
        title: "Unsupported network",
        description: "Please select a supported network for bridging",
        status: "warning",
        duration: 5000,
        isClosable: true,
        position: "top-right",
      });
      return false;
    }

    if (chainId === targetChainId) {
      return true;
    }

    isSwitchingRef.current = true;
    setIsSwitchingChain(true);

    toast({
      title: "Switching network...",
      description: "Please approve the network switch in your wallet",
      status: "info",
      duration: 4000,
      isClosable: true,
      position: "top-right",
    });

    try {
      await switchChainAsync({ chainId: targetChainId });

      const chainName =
        combinedChains.find((c) => c.id === targetChainId)?.name ||
        "selected network";

      toast({
        title: "Network switched ✅",
        description: `Successfully connected to ${chainName}`,
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });

      return true;
    } catch (err: any) {
      const message: string = err?.message?.toLowerCase?.() || "";
      const isRejection =
        err?.name === "UserRejectedRequestError" ||
        err?.code === 4001 ||
        message.includes("user rejected") ||
        message.includes("denied");

      if (isRejection) {
        toast({
          title: "Network switch required",
          description: "Please approve the network switch in your wallet to continue bridging.",
          status: "warning",
          duration: 5000,
          isClosable: true,
          position: "top-right",
        });
      } else {
        toast({
          title: "Network switch failed",
          description: err?.shortMessage || err?.message?.split("\n")[0] || "Please manually switch the network in your wallet",
          status: "error",
          duration: 5000,
          isClosable: true,
          position: "top-right",
        });
      }
      return false;
    } finally {
      isSwitchingRef.current = false;
      setIsSwitchingChain(false);
    }
  }, [chainId, combinedChains, supportedChainIds, switchChainAsync, toast]);

  // Find current chain to display its name
  const currentChain = combinedChains.find((c) => c.id === chainId);

  // =====================================================================
  // Widget configuration - FORCE DARK MODE
  // =====================================================================
  const lifiConfig = useMemo(() => {
    const cfg: any = {
      apiKey: LIFI_API_KEY,
      appearance: "dark", // FORCE DARK MODE - always dark
      fromChain: tokenPrefill.fromChain || chainId || DEFAULT_FROM_CHAIN,
      fee: PLATFORM_FEE,
      theme: {
        shape: { borderRadius: 16 },
        typography: {
          fontFamily: "'Space Grotesk', sans-serif",
        },
        palette: {
          mode: "dark", // FORCE DARK MODE
          primary: { main: "#8b5cf6" },
          secondary: { main: "#ec4899" },
          background: {
            default: "#0a0a1a",
            paper: "rgba(4,4,14,0.95)",
          },
          text: {
            primary: "#ffffff",
            secondary: "#9ca3af",
          },
        },
      },
      walletManagement: {
        switchChain: handleBridgeChainSwitch,
      },
    };

    if (tokenPrefill.toChain) cfg.toChain = tokenPrefill.toChain;
    if (tokenPrefill.fromToken) cfg.fromToken = tokenPrefill.fromToken;
    if (tokenPrefill.toToken) cfg.toToken = tokenPrefill.toToken;

    return cfg;
  }, [chainId, tokenPrefill, handleBridgeChainSwitch]);

  // =====================================================================
  // Stats
  // =====================================================================
  const bridgeStats = [
    {
      label: "Supported Chains",
      value: "70+",
      icon: "⛓️",
      color: "#8b5cf6",
      description: "Ethereum, Arbitrum, Optimism & more",
      glowColor: "rgba(139,92,246,0.3)",
    },
    {
      label: "Bridge Routes",
      value: "500+",
      icon: "🔄",
      color: "#ec4899",
      description: "Optimal routes for your assets",
      glowColor: "rgba(236,72,153,0.3)",
    },
    {
      label: "Protocols",
      value: "30+",
      icon: "🔗",
      color: "#22c55e",
      description: "Leading bridge protocols",
      glowColor: "rgba(34,197,94,0.3)",
    },
    {
      label: "Status",
      value: isSwitchingChain ? "🟡 Switching" : "🟢 Live",
      icon: "📡",
      color: "#fbbf24",
      description: "Cross-chain bridge active",
      glowColor: "rgba(251,191,36,0.3)",
    },
  ];

  // Stat Card
  const BridgeStatCard = ({ stat, index }: { stat: any; index: number }) => (
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

  // History button — shared between the desktop and mobile header layouts
  const HistoryButton = () => (
    <Button
      onClick={openHistory}
      size={{ base: "md", md: "md" }}
      px={{ base: 4, md: 4 }}
      color="#c4b5fd"
      bg="rgba(139,92,246,0.1)"
      border="1px solid rgba(139,92,246,0.3)"
      _hover={{
        color: "white",
        bg: "rgba(139,92,246,0.18)",
        borderColor: "rgba(139,92,246,0.5)",
        boxShadow: "0 0 20px rgba(139,92,246,0.15)",
        transform: "translateY(-1px)",
      }}
      _active={{ transform: "scale(0.97)" }}
      borderRadius="xl"
      fontFamily="'Space Grotesk', sans-serif"
      fontWeight="600"
      fontSize={{ base: "sm", md: "md" }}
      position="relative"
      transition="all 0.2s"
      leftIcon={<Image src="/history.png" alt="" boxSize={{ base: "28px", md: "28px" }} />}
      marginTop={{ base: 0, md: "4px" }}
    >
      History
      {history.length > 0 && (
        <Badge
          position="absolute"
          top="-7px"
          right="-7px"
          bgGradient="linear(135deg, #8b5cf6, #ec4899)"
          color="white"
          fontSize="9px"
          fontWeight="700"
          borderRadius="full"
          minW="19px"
          h="19px"
          display="flex"
          alignItems="center"
          justifyContent="center"
          fontFamily="'Space Mono', monospace"
          border="2px solid #03030f"
          boxShadow="0 0 10px rgba(139,92,246,0.5)"
        >
          {history.length}
        </Badge>
      )}
    </Button>
  );

  // =====================================================================
  // Render
  // =====================================================================
  return (
    <PageErrorBoundary>
      <style>{pageStyles}</style>

      {/* Bridge history drawer */}
      <Drawer isOpen={isHistoryOpen} placement="right" onClose={closeHistory} size="sm">
        <DrawerOverlay bg="rgba(0,0,0,0.7)" backdropFilter="blur(6px)" />
        <DrawerContent bg="rgba(4,4,14,0.98)" borderLeft="1px solid rgba(139,92,246,0.2)">
          <DrawerCloseButton color="gray.500" _hover={{ color: "white" }} />
          <DrawerHeader
            borderBottom="1px solid rgba(255,255,255,0.06)"
            fontFamily="'Space Grotesk', sans-serif"
            color="white"
            fontSize="md"
          >
            <HStack justify="space-between" pr={8}>
              <Text>🕘 Bridge History</Text>
              <Button
                size="xs"
                variant="ghost"
                color="gray.400"
                onClick={fetchHistory}
                isLoading={isHistoryLoading}
                _hover={{ color: "white", bg: "rgba(139,92,246,0.1)" }}
                fontFamily="'Space Mono', monospace"
              >
                ↻ Refresh
              </Button>
            </HStack>
          </DrawerHeader>
          <DrawerBody py={4}>
            {!isConnected ? (
              <Text fontSize="sm" color="gray.500" fontFamily="'Space Grotesk', sans-serif">
                Connect your wallet to see your bridge history.
              </Text>
            ) : isHistoryLoading && history.length === 0 ? (
              <VStack spacing={3} py={6}>
                <Spinner size="md" color="#8b5cf6" />
                <Text fontSize="xs" color="gray.500" fontFamily="'Space Grotesk', sans-serif">
                  Loading your transaction history...
                </Text>
              </VStack>
            ) : historyError && history.length === 0 ? (
              <VStack spacing={3} py={6} textAlign="center">
                <Text fontSize="sm" color="gray.400" fontFamily="'Space Grotesk', sans-serif">
                  {historyError}
                </Text>
                <Button
                  size="sm"
                  onClick={fetchHistory}
                  bg="rgba(139,92,246,0.15)"
                  color="#c4b5fd"
                  border="1px solid rgba(139,92,246,0.3)"
                  _hover={{ bg: "rgba(139,92,246,0.25)" }}
                  borderRadius="lg"
                >
                  Try again
                </Button>
              </VStack>
            ) : history.length === 0 ? (
              <Text fontSize="sm" color="gray.500" fontFamily="'Space Grotesk', sans-serif">
                No bridge transactions yet. Once you complete a bridge, it'll show up here.
              </Text>
            ) : (
              <VStack spacing={3} align="stretch">
                {history.map((entry) => {
                  const fromName =
                    combinedChains.find((c) => c.id === entry.fromChainId)?.name ||
                    (entry.fromChainId ? `Chain ${entry.fromChainId}` : "Unknown");
                  const toName =
                    combinedChains.find((c) => c.id === entry.toChainId)?.name ||
                    (entry.toChainId ? `Chain ${entry.toChainId}` : "Unknown");

                  return (
                    <Box
                      key={entry.id}
                      bg="rgba(255,255,255,0.03)"
                      border="1px solid rgba(255,255,255,0.06)"
                      borderRadius="xl"
                      p={3}
                    >
                      <HStack justify="space-between" mb={1}>
                        <Text
                          fontSize="xs"
                          fontWeight="700"
                          color="gray.200"
                          fontFamily="'Space Grotesk', sans-serif"
                        >
                          {fromName} → {toName}
                        </Text>
                        <Text fontSize="10px" color="gray.500" fontFamily="'Space Mono', monospace">
                          {formatTimeAgo(entry.timestamp)}
                        </Text>
                      </HStack>
                      <HStack spacing={2} mb={entry.txLink ? 2 : 0}>
                        <Text fontSize="11px" color="gray.400" fontFamily="'Space Mono', monospace">
                          {entry.fromSymbol || "—"} → {entry.toSymbol || "—"}
                          {entry.fromAmountUSD ? ` · ~$${Number(entry.fromAmountUSD).toFixed(2)}` : ""}
                        </Text>
                        {entry.failed ? (
                          <Badge bg="rgba(239,68,68,0.15)" color="#f87171" fontSize="8px" px={1.5} borderRadius="full">
                            Failed
                          </Badge>
                        ) : entry.pending ? (
                          <Badge bg="rgba(251,191,36,0.15)" color="#fbbf24" fontSize="8px" px={1.5} borderRadius="full">
                            Pending
                          </Badge>
                        ) : (
                          <Badge bg="rgba(34,197,94,0.15)" color="#4ade80" fontSize="8px" px={1.5} borderRadius="full">
                            Completed
                          </Badge>
                        )}
                      </HStack>
                      {entry.txLink && (
                        <Link
                          href={entry.txLink}
                          isExternal
                          fontSize="10px"
                          color="#8b5cf6"
                          _hover={{ color: "#ec4899" }}
                          fontFamily="'Space Grotesk', sans-serif"
                        >
                          View on Explorer <ExternalLinkIcon mx={1} boxSize={2.5} />
                        </Link>
                      )}
                    </Box>
                  );
                })}
              </VStack>
            )}
          </DrawerBody>
        </DrawerContent>
      </Drawer>

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
                    bg={isSwitchingChain ? "#fbbf24" : "#4ade80"}
                    boxShadow={
                      isSwitchingChain
                        ? "0 0 8px rgba(251,191,36,0.8)"
                        : "0 0 8px rgba(74,222,128,0.8)"
                    }
                    style={{ animation: "pulseGlow 2.5s ease-in-out infinite" }}
                  />
                  <Heading
                    fontSize={{ base: "xl", md: "2xl", lg: "3xl" }}
                    fontWeight="800"
                    bgGradient="linear(135deg, #8b5cf6 0%, #ec4899 50%, #fbbf24 100%)"
                    bgClip="text"
                    letterSpacing="-0.03em"
                    fontFamily="'Space Grotesk', sans-serif"
                  >
                    Cross-Chain Bridge
                  </Heading>
                  <Badge
                    bg="rgba(139,92,246,0.1)"
                    color="#8b5cf6"
                    fontSize="9px"
                    px={2}
                    py={0.5}
                    borderRadius="full"
                    border="1px solid rgba(139,92,246,0.2)"
                    fontFamily="'Space Mono', monospace"
                  >
                    LI.FI
                  </Badge>
                </HStack>
                <Text
                  color="gray.500"
                  fontSize={{ base: "9px", md: "10px" }}
                  letterSpacing="0.2em"
                  fontFamily="'Space Mono', monospace"
                  textTransform="uppercase"
                >
                  Seamless · Fast · Secure · 70+ Chains
                </Text>
              </VStack>
            </HStack>

            <HStack spacing={5} display={{ base: "none", md: "flex" }}>
              <HistoryButton />
              <Box _hover={{ transform: "scale(1.02)" }} transition="transform 0.2s">
                <ConnectButton chainStatus="full" accountStatus="full" showBalance={{ smallScreen: false, largeScreen: true }} />
              </Box>
            </HStack>
          </Flex>

          {/* Mobile wallet */}
          <VStack spacing={3} display={{ base: "flex", md: "none" }} w="full" mb={5}>
            <HStack spacing={3} w="full" justify="center">
              <HistoryButton />
            </HStack>
            <Box w="full" display="flex" justifyContent="center">
              <ConnectButton chainStatus="full" accountStatus="full" showBalance={{ smallScreen: false, largeScreen: true }} />
            </Box>
          </VStack>

          {/* Current Network Indicator */}
          {isConnected && currentChain && (
            <Flex justify="center" mb={4}>
              <Badge
                variant="subtle"
                colorScheme={isSwitchingChain ? "yellow" : "green"}
                fontSize="xs"
                px={4}
                py={2}
                borderRadius="full"
                display="flex"
                alignItems="center"
                gap={2}
                bg={
                  isSwitchingChain
                    ? "rgba(251,191,36,0.08)"
                    : "rgba(34,197,94,0.08)"
                }
                border={
                  isSwitchingChain
                    ? "1px solid rgba(251,191,36,0.2)"
                    : "1px solid rgba(34,197,94,0.2)"
                }
              >
                {isSwitchingChain || isSwitchPending ? (
                  <Spinner size="xs" color="#fbbf24" />
                ) : (
                  <Box
                    w="8px"
                    h="8px"
                    borderRadius="full"
                    bg="#22c55e"
                    animation="pulse 1.5s infinite"
                  />
                )}
                {isSwitchingChain || isSwitchPending
                  ? "Switching network..."
                  : `Connected to ${currentChain.name}`}
              </Badge>
            </Flex>
          )}

          {/* Bridge Stats */}
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={{ base: 2.5, md: 5 }} mb={{ base: 6, md: 10 }}>
            {bridgeStats.map((stat, i) => (
              <BridgeStatCard key={stat.label} stat={stat} index={i} />
            ))}
          </SimpleGrid>

          {/* Main Content */}
          <Flex justify="center" align="flex-start" gap={8} direction={{ base: "column", lg: "row" }}>
            {/* LiFi Widget */}
            <Box flex="1" maxW="560px" w="full" mx="auto">
              <MotionBox
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Box
                  position="relative"
                  borderRadius="2xl"
                  overflow="hidden"
                  border="1px solid rgba(139,92,246,0.15)"
                  bg="rgba(4,4,14,0.6)"
                  backdropFilter="blur(20px)"
                  p={{ base: 3, md: 5 }}
                  transition="all 0.3s"
                  _hover={{
                    borderColor: "rgba(139,92,246,0.3)",
                    boxShadow: "0 0 40px rgba(139,92,246,0.05)",
                  }}
                >
                  <VStack spacing={4} align="stretch">
                    <HStack spacing={2} justify="space-between">
                      <HStack spacing={2}>
                        <Text fontSize="sm" fontWeight="600" color="gray.300" fontFamily="'Space Grotesk', sans-serif">
                          🌉 Bridge Assets
                        </Text>
                        <Badge
                          bg={
                            isSwitchingChain
                              ? "rgba(251,191,36,0.12)"
                              : "rgba(34,197,94,0.12)"
                          }
                          color={isSwitchingChain ? "#fbbf24" : "#22c55e"}
                          fontSize="8px"
                          px={2}
                          py={0.5}
                          borderRadius="full"
                          border={
                            isSwitchingChain
                              ? "1px solid rgba(251,191,36,0.2)"
                              : "1px solid rgba(34,197,94,0.2)"
                          }
                          fontFamily="'Space Mono', monospace"
                        >
                          {isSwitchingChain ? "● Switching" : "● Live"}
                        </Badge>
                      </HStack>
                      <Link
                        href="https://li.fi"
                        isExternal
                        fontSize="xs"
                        color="gray.500"
                        _hover={{ color: "#8b5cf6" }}
                        fontFamily="'Space Grotesk', sans-serif"
                      >
                        Powered by LI.FI <ExternalLinkIcon mx={1} boxSize={3} />
                      </Link>
                    </HStack>

                    {!isConnected ? (
                      <Box
                        textAlign="center"
                        py={10}
                        px={4}
                        bg="rgba(0,0,0,0.3)"
                        borderRadius="xl"
                        border="1px solid rgba(139,92,246,0.1)"
                      >
                        <Text fontSize="48px" mb={3}>🔌</Text>
                        <Text color="gray.400" fontSize="sm" fontFamily="'Space Grotesk', sans-serif">
                          Connect your wallet to start bridging
                        </Text>
                        <Text color="gray.500" fontSize="xs" mt={2} fontFamily="'Space Grotesk', sans-serif">
                          Supports 70+ chains and 30+ bridge protocols
                        </Text>
                      </Box>
                    ) : (
                      <Box className="lifi-widget-container" position="relative">
                        {isSwitchingChain && (
                          <HStack
                            position="absolute"
                            top="10px"
                            left="50%"
                            transform="translateX(-50%)"
                            zIndex={10}
                            bg="rgba(251,191,36,0.15)"
                            border="1px solid rgba(251,191,36,0.3)"
                            borderRadius="full"
                            px={3}
                            py={1}
                            spacing={2}
                            backdropFilter="blur(8px)"
                          >
                            <Spinner size="xs" color="#fbbf24" />
                            <Text
                              fontSize="10px"
                              color="#fbbf24"
                              fontFamily="'Space Mono', monospace"
                            >
                              Switching network...
                            </Text>
                          </HStack>
                        )}
                        <WidgetErrorBoundary
                          onRetry={() => setWidgetKey((prev) => prev + 1)}
                        >
                          <LiFiWidget
                            key={widgetKey}
                            integrator="PulseVault"
                            config={lifiConfig as any}
                          />
                        </WidgetErrorBoundary>
                      </Box>
                    )}
                  </VStack>
                </Box>
              </MotionBox>
            </Box>

            {/* Info Sidebar */}
            <Box w={{ base: "full", lg: "320px" }} flexShrink={0}>
              <MotionBox
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <VStack spacing={4} align="stretch">
                  <Box
                    bg="rgba(4,4,14,0.85)"
                    backdropFilter="blur(24px)"
                    borderRadius="2xl"
                    border="1px solid rgba(139,92,246,0.2)"
                    p={5}
                    transition="all 0.3s"
                    _hover={{ borderColor: "rgba(139,92,246,0.4)" }}
                  >
                    <Text fontSize="sm" fontWeight="700" color="white" fontFamily="'Space Grotesk', sans-serif" mb={3}>
                      ✨ Why Bridge with LI.FI?
                    </Text>
                    <VStack spacing={3} align="start">
                      <HStack spacing={3}>
                        <Box w="28px" h="28px" bg="rgba(34,197,94,0.1)" borderRadius="full" display="flex" alignItems="center" justifyContent="center" flexShrink={0}>
                          <Text fontSize="14px">⚡</Text>
                        </Box>
                        <Box>
                          <Text fontSize="xs" fontWeight="600" color="gray.300" fontFamily="'Space Grotesk', sans-serif">
                            Fastest Routes
                          </Text>
                          <Text fontSize="10px" color="gray.500" fontFamily="'Space Grotesk', sans-serif">
                            Optimal paths for every bridge
                          </Text>
                        </Box>
                      </HStack>
                      <HStack spacing={3}>
                        <Box w="28px" h="28px" bg="rgba(139,92,246,0.1)" borderRadius="full" display="flex" alignItems="center" justifyContent="center" flexShrink={0}>
                          <Text fontSize="14px">🛡️</Text>
                        </Box>
                        <Box>
                          <Text fontSize="xs" fontWeight="600" color="gray.300" fontFamily="'Space Grotesk', sans-serif">
                            Secure & Audited
                          </Text>
                          <Text fontSize="10px" color="gray.500" fontFamily="'Space Grotesk', sans-serif">
                            Top security standards
                          </Text>
                        </Box>
                      </HStack>
                      <HStack spacing={3}>
                        <Box w="28px" h="28px" bg="rgba(251,191,36,0.1)" borderRadius="full" display="flex" alignItems="center" justifyContent="center" flexShrink={0}>
                          <Text fontSize="14px">💎</Text>
                        </Box>
                        <Box>
                          <Text fontSize="xs" fontWeight="600" color="gray.300" fontFamily="'Space Grotesk', sans-serif">
                            Best Rates
                          </Text>
                          <Text fontSize="10px" color="gray.500" fontFamily="'Space Grotesk', sans-serif">
                            Competitive fees & rates
                          </Text>
                        </Box>
                      </HStack>
                      <HStack spacing={3}>
                        <Box w="28px" h="28px" bg="rgba(236,72,153,0.1)" borderRadius="full" display="flex" alignItems="center" justifyContent="center" flexShrink={0}>
                          <Text fontSize="14px">🌐</Text>
                        </Box>
                        <Box>
                          <Text fontSize="xs" fontWeight="600" color="gray.300" fontFamily="'Space Grotesk', sans-serif">
                            70+ Chains
                          </Text>
                          <Text fontSize="10px" color="gray.500" fontFamily="'Space Grotesk', sans-serif">
                            Ethereum, Arbitrum, Optimism & more
                          </Text>
                        </Box>
                      </HStack>
                    </VStack>
                  </Box>

                  <Box
                    bg="rgba(4,4,14,0.85)"
                    backdropFilter="blur(24px)"
                    borderRadius="2xl"
                    border="1px solid rgba(251,191,36,0.15)"
                    p={4}
                    transition="all 0.3s"
                    _hover={{ borderColor: "rgba(251,191,36,0.3)" }}
                  >
                    <Text fontSize="xs" fontWeight="600" color="gray.400" fontFamily="'Space Mono', monospace" mb={2}>
                      💡 Quick Tips
                    </Text>
                    <VStack spacing={2} align="start">
                      <Text fontSize="10px" color="gray.500" fontFamily="'Space Grotesk', sans-serif">
                        • Bridge from ANY chain to ANY chain
                      </Text>
                      <Text fontSize="10px" color="gray.500" fontFamily="'Space Grotesk', sans-serif">
                        • Ensure you have enough gas for fees
                      </Text>
                      <Text fontSize="10px" color="gray.500" fontFamily="'Space Grotesk', sans-serif">
                        • Bridge times vary by protocol
                      </Text>
                      <Text fontSize="10px" color="gray.500" fontFamily="'Space Grotesk', sans-serif">
                        • LI.FI aggregates 30+ bridge protocols
                      </Text>
                      <Text fontSize="10px" color="gray.500" fontFamily="'Space Grotesk', sans-serif">
                        • A {(PLATFORM_FEE * 100).toFixed(1)}% platform fee applies to bridge transactions
                      </Text>
                    </VStack>
                  </Box>

                  <Box
                    bg="rgba(4,4,14,0.85)"
                    backdropFilter="blur(24px)"
                    borderRadius="2xl"
                    border="1px solid rgba(139,92,246,0.12)"
                    p={4}
                    transition="all 0.3s"
                    _hover={{ borderColor: "rgba(139,92,246,0.25)" }}
                  >
                    <Text fontSize="xs" fontWeight="600" color="gray.400" fontFamily="'Space Mono', monospace" mb={2}>
                      📊 Bridge Status
                    </Text>
                    <VStack spacing={1.5} align="start">
                      <HStack spacing={2}>
                        <Box
                          w="6px"
                          h="6px"
                          borderRadius="full"
                          bg={isSwitchingChain ? "#fbbf24" : "#22c55e"}
                        />
                        <Text fontSize="10px" color="gray.400" fontFamily="'Space Grotesk', sans-serif">
                          {isSwitchingChain
                            ? "Switching network..."
                            : "All bridges operational"}
                        </Text>
                      </HStack>
                      <HStack spacing={2}>
                        <Box w="6px" h="6px" borderRadius="full" bg="#22c55e" />
                        <Text fontSize="10px" color="gray.400" fontFamily="'Space Grotesk', sans-serif">
                          Low latency
                        </Text>
                      </HStack>
                      <HStack spacing={2}>
                        <Box w="6px" h="6px" borderRadius="full" bg="#fbbf24" />
                        <Text fontSize="10px" color="gray.400" fontFamily="'Space Grotesk', sans-serif">
                          High volume traffic
                        </Text>
                      </HStack>
                    </VStack>
                  </Box>
                </VStack>
              </MotionBox>
            </Box>
          </Flex>

          {/* Footer */}
          <Footer />
        </Container>
      </Box>
    </PageErrorBoundary>
  );
}

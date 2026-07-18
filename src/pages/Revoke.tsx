// src/pages/Revoke.tsx
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
  Image,
  Input,
  InputGroup,
  InputRightElement,
  Checkbox,
  Skeleton,
  Link,
  useToast,
  SimpleGrid,
  Spinner,
  Progress,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Textarea,
} from "@chakra-ui/react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  useAccount,
  useChainId,
  useSwitchChain,
  usePublicClient,
  useWriteContract,
} from "wagmi";
import { parseAbiItem, keccak256, toBytes, pad, createPublicClient, http, parseEther, type Address, type PublicClient } from "viem";
import { useState, useMemo, useCallback, useEffect } from "react";
import {
  ChevronLeftIcon,
  ChevronDownIcon,
  InfoIcon,
  ExternalLinkIcon,
  WarningTwoIcon,
  CheckCircleIcon,
} from "@chakra-ui/icons";
import { motion } from "framer-motion";

import { useFixScroll } from "../hooks/useFixScroll";
import { useNavigate } from "react-router-dom";
import { soneiumChain, inkChain, optimismChain, baseChain, unichainChain } from "../wagmi";

// ============= Motion =============
const MotionBox = motion(Box);

// ============= Chain configuration =============
// Each chain optionally gets a fast, indexed log search (`blockscoutBase`) — set only for
// chains confirmed to run a self-hosted Blockscout instance callable directly from the
// browser (Soneium, Ink). The others (Optimism, Base, Unichain) run Etherscan-family
// explorers instead, which need their own API keys for the equivalent search — rather than
// guess at that integration, they use the parallel, chunked RPC scan directly. It's slower
// but every bit as correct, since it reads the exact same on-chain events.
interface RevokeChainConfig {
  id: number;
  name: string;
  iconUrl: string;
  color: string;
  glow: string;
  blockscoutBase?: string;
  explorerAddressUrl: string;
  explorerTokenUrl: string;
  chainObj: any;
}

const REVOKE_CHAINS: RevokeChainConfig[] = [
  {
    id: soneiumChain.id,
    name: soneiumChain.name,
    iconUrl: soneiumChain.iconUrl,
    color: "#1c97df",
    glow: "rgba(28,151,223,0.35)",
    blockscoutBase: "https://soneium.blockscout.com",
    explorerAddressUrl: "https://soneium.blockscout.com/address/",
    explorerTokenUrl: "https://soneium.blockscout.com/token/",
    chainObj: soneiumChain,
  },
  {
    id: inkChain.id,
    name: inkChain.name,
    iconUrl: inkChain.iconUrl,
    color: "#c026d3",
    glow: "rgba(192,38,211,0.35)",
    blockscoutBase: "https://explorer.inkonchain.com",
    explorerAddressUrl: "https://explorer.inkonchain.com/address/",
    explorerTokenUrl: "https://explorer.inkonchain.com/token/",
    chainObj: inkChain,
  },
  {
    id: optimismChain.id,
    name: optimismChain.name,
    iconUrl: optimismChain.iconUrl,
    color: "#ff0420",
    glow: "rgba(255,4,32,0.35)",
    blockscoutBase: "https://optimism.blockscout.com",
    explorerAddressUrl: "https://optimistic.etherscan.io/address/",
    explorerTokenUrl: "https://optimistic.etherscan.io/token/",
    chainObj: optimismChain,
  },
  {
    id: baseChain.id,
    name: baseChain.name,
    iconUrl: baseChain.iconUrl,
    color: "#2563eb",
    glow: "rgba(37,99,235,0.35)",
    blockscoutBase: "https://base.blockscout.com",
    explorerAddressUrl: "https://basescan.org/address/",
    explorerTokenUrl: "https://basescan.org/token/",
    chainObj: baseChain,
  },
  {
    id: unichainChain.id,
    name: unichainChain.name,
    iconUrl: unichainChain.iconUrl,
    color: "#f72585",
    glow: "rgba(247,37,133,0.35)",
    blockscoutBase: "https://unichain.blockscout.com",
    explorerAddressUrl: "https://uniscan.xyz/address/",
    explorerTokenUrl: "https://uniscan.xyz/token/",
    chainObj: unichainChain,
  },
];

const CHAIN_MAP = new Map(REVOKE_CHAINS.map((c) => [c.id, c]));
const DEFAULT_CHAIN_ID = soneiumChain.id;

// This site's own GM/Deploy contracts on each chain — labeled instead of shown as a bare
// address, so users can immediately tell "this is us" apart from an unfamiliar spender.
const KNOWN_SPENDERS_BY_CHAIN: Record<number, Record<string, string>> = {
  [soneiumChain.id]: {
    "0x2aa8f86c5905f94e8b4d16b6cd6a0a5e79131821": "GM Contract (this site)",
    "0xc1966b48008b7153e9b7441f06b21ef2e52014c4": "Deploy Contract (this site)",
  },
  [inkChain.id]: {
    "0x4abac309b992b5863d70a2ef4e81b52f05f26b4c": "GM Contract (this site)",
    "0x45be5f350d14fac218158fd380283c18e8df6f2b": "Deploy Contract (this site)",
  },
  [optimismChain.id]: {
    "0x489d39ff70e8ed45261d5353c0e999c2da2fe132": "GM Contract (this site)",
    "0x56c4615c640773d6832cf27b6dd37825db267a70": "Deploy Contract (this site)",
  },
  [baseChain.id]: {
    "0xbdf4dce745f5d945df7ed88681df31bb17631692": "GM Contract (this site)",
    "0xd7de83f3be7e75dff4e3cba4cb64a6394a0e6299": "Deploy Contract (this site)",
  },
  [unichainChain.id]: {
    "0xea36d3ce511f3f91cfef12497db3bd9611072314": "GM Contract (this site)",
    "0x1e1322deed86cc53031843f323f16415ba0e9152": "Deploy Contract (this site)",
  },
};

// This site's donation contract, deployed identically on all 5 supported chains — donors
// pick whichever chain they'd like to donate on.
const DONATION_CONTRACTS: Record<number, Address> = {
  [soneiumChain.id]: "0x16ae08cBddfEC014FCddfA41B33EFc3ff8E627E7",
  [inkChain.id]: "0xf7307ce2445882953bc4e50ca5b6d0f201f1e35d",
  [optimismChain.id]: "0x0E94D57D210001538310ca02316D65C337D06555",
  [baseChain.id]: "0x75ebc5F83053a53B6784ed91c5EcE4278b5613D4",
  [unichainChain.id]: "0x5707A72f435F95D15D7C5FF32b0D350033b92588",
};

const DONATION_ABI = [
  {
    type: "function",
    name: "donate",
    stateMutability: "payable",
    inputs: [{ name: "message", type: "string" }],
    outputs: [],
  },
] as const;

// ============= Minimal ABIs (universal ERC-20 / ERC-721 / ERC-1155 fragments) =============
const ERC20_ABI = [
  { type: "function", name: "symbol", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { type: "function", name: "name", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { type: "function", name: "decimals", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
] as const;

const NFT_ABI = [
  {
    type: "function",
    name: "isApprovedForAll",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "operator", type: "address" },
    ],
    outputs: [{ type: "bool" }],
  },
  {
    type: "function",
    name: "setApprovalForAll",
    stateMutability: "nonpayable",
    inputs: [
      { name: "operator", type: "address" },
      { name: "approved", type: "bool" },
    ],
    outputs: [],
  },
  { type: "function", name: "name", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { type: "function", name: "symbol", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
] as const;

// ============= Events =============
const ERC20_APPROVAL_EVENT = parseAbiItem(
  "event Approval(address indexed owner, address indexed spender, uint256 value)"
);
const APPROVAL_FOR_ALL_EVENT = parseAbiItem(
  "event ApprovalForAll(address indexed owner, address indexed operator, bool approved)"
);
const ERC20_APPROVAL_TOPIC0 = keccak256(toBytes("Approval(address,address,uint256)"));
const APPROVAL_FOR_ALL_TOPIC0 = keccak256(toBytes("ApprovalForAll(address,address,bool)"));

// Multicall3's canonical deterministic-deployment address — the same on virtually every
// EVM chain, including all five supported here.
const MULTICALL3_ADDRESS = "0xcA11bde05977b3631167028862bE2a173976CA11" as Address;

const UNLIMITED_THRESHOLD = 2n ** 200n;
const BLOCKSCOUT_LOG_CAP = 1000;
const BLOCKS_PER_DAY = Math.floor(86_400 / 2); // ~2s blocks — used only for RPC-scan depth presets

// Informational scan summaries only print in dev — real problems still go through
// console.warn/console.error regardless.
const DEBUG = Boolean((import.meta as any).env?.DEV);

type ScanDepth = "30d" | "90d" | "365d" | "all";
const SCAN_DEPTH_OPTIONS: { value: ScanDepth; label: string; days: number | null }[] = [
  { value: "30d", label: "Last 30 days (fastest)", days: 30 },
  { value: "90d", label: "Last 90 days", days: 90 },
  { value: "365d", label: "Last year", days: 365 },
  { value: "all", label: "Full history (slowest)", days: null },
];

// ============= Types =============
interface TokenInfo {
  address: Address;
  name: string;
  symbol: string;
  type: "ERC-20" | "NFT";
  decimals: number;
  iconUrl?: string | null;
}

interface ApprovalCandidate {
  key: string;
  token: TokenInfo;
  spender: Address;
}

interface ApprovalRow extends ApprovalCandidate {
  isNft: boolean;
  allowanceRaw?: bigint;
  isApprovedForAll?: boolean;
  isUnlimited: boolean;
}

// ============= Small helpers =============
const normalizeAddr = (a: string) => a.toLowerCase();
const truncateAddr = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

const CACHE_VERSION = 2; // bumped: cache keys are now chain-scoped
const scanCacheKey = (chainId: number, addr: string) => `revoke-scan-cache-v${CACHE_VERSION}-${chainId}-${addr.toLowerCase()}`;

const saveScanCache = (chainId: number, addr: string, candidates: ApprovalCandidate[]) => {
  try {
    localStorage.setItem(scanCacheKey(chainId, addr), JSON.stringify({ candidates, timestamp: Date.now() }));
  } catch {
    // Ignore quota/private-mode errors — the cache is a nice-to-have, not critical data.
  }
};

const loadScanCache = (chainId: number, addr: string): { candidates: ApprovalCandidate[]; timestamp: number } | null => {
  try {
    const raw = localStorage.getItem(scanCacheKey(chainId, addr));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed?.candidates) || typeof parsed?.timestamp !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
};

const formatTimeAgo = (timestamp: number): string => {
  const diffMin = Math.floor((Date.now() - timestamp) / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  return `${Math.floor(diffH / 24)}d ago`;
};

// ============= Custom RPC support =============
// Free public RPCs (the ones configured by default) are shared by everyone using them —
// under heavy use they rate-limit or restrict historical queries, as seen on Optimism.
// Users can plug in their own RPC (from Alchemy, Infura, QuickNode, etc.) per chain, used
// only for read-only scanning from their own browser. Deliberately NOT persisted anywhere
// (no localStorage) — it's in-memory React state only, so it's gone the moment the page is
// refreshed or closed, protecting anyone who pastes a personal/keyed RPC URL in here.
const buildCustomClient = (chainObj: any, rpcUrl: string): PublicClient =>
  createPublicClient({ chain: chainObj, transport: http(rpcUrl) }) as unknown as PublicClient;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("Request timed out")), ms)),
  ]);
}

async function asyncPool<T, R>(concurrency: number, items: T[], fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let index = 0;
  const worker = async () => {
    while (index < items.length) {
      const current = index++;
      results[current] = await fn(items[current]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return results;
}

// ============= Chunked multicall =============
// A single multicall with hundreds/thousands of sub-calls tends to silently fail or return
// truncated/unusable results on most RPCs (gas limits, response size caps). Splitting into
// small batches (run with limited concurrency) avoids that.
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Detects "too many requests" style rejections (HTTP 429, or RPC-level rate-limit messages)
// so they can be retried with a backoff delay — a completely different fix than the
// "range too large" case, since the request itself was fine, there were just too many of
// them too fast. Retrying immediately (or shrinking the chunk, which doesn't address rate
// at all) just produces more of the same 429s.
const isRateLimitError = (err: any): boolean => {
  const status = err?.status ?? err?.cause?.status;
  if (status === 429) return true;
  const msg = String(err?.details || err?.shortMessage || err?.message || "").toLowerCase();
  return msg.includes("429") || msg.includes("too many requests") || msg.includes("rate limit") || msg.includes("requests per second");
};

async function multicallChunked(
  client: PublicClient,
  contracts: any[],
  chunkSize = 40,
  concurrency = 2
): Promise<any[]> {
  if (contracts.length === 0) return [];
  const chunks: any[][] = [];
  for (let i = 0; i < contracts.length; i += chunkSize) {
    chunks.push(contracts.slice(i, i + chunkSize));
  }
  const chunkResults = await asyncPool(concurrency, chunks, async (chunk) => {
    let backoff = 600;
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        return await client.multicall({ contracts: chunk, allowFailure: true, multicallAddress: MULTICALL3_ADDRESS });
      } catch (err) {
        if (isRateLimitError(err) && attempt < 4) {
          await sleep(backoff);
          backoff = Math.min(backoff * 2, 8000);
          continue;
        }
        console.warn("A multicall chunk failed; marking its entries as failed rather than aborting the whole batch:", err);
        return chunk.map(() => ({ status: "failure" as const, error: err, result: undefined }));
      }
    }
    return chunk.map(() => ({ status: "failure" as const, result: undefined }));
  });
  return chunkResults.flat();
}

// ============= Chunked + parallel getLogs (RPC fallback path) =============
// Some free/public RPC endpoints reject any eth_getLogs request outside a small recent
// block window with a permanent "archive access requires a paid/personal token" error —
// not a transient "range too large" issue. Retrying with a smaller chunk can never fix
// that, so it's detected and surfaced immediately instead of hammering the RPC with dozens
// of doomed retries (which is what happened before this check existed).
const isArchiveAccessError = (err: any): boolean => {
  const msg = String(err?.details || err?.shortMessage || err?.message || "").toLowerCase();
  return msg.includes("archive") || msg.includes("personal token") || msg.includes("paid plan") || msg.includes("upgrade your plan");
};

class ArchiveAccessRequiredError extends Error {
  constructor() {
    super("This chain's RPC requires a paid/archive-access token for historical log queries.");
    this.name = "ArchiveAccessRequiredError";
  }
}

// Some RPCs (notably Alchemy's free tier on Optimism) reject eth_getLogs outside a very
// small block range — e.g. "up to a 10 block range" — and say so explicitly in the error.
// Parsing that number out lets us jump straight to the exact working chunk size instead of
// blindly halving toward a fixed floor that might still be way too large (which is exactly
// what caused every single request to fail before this existed).
const parseBlockRangeLimit = (err: any): number | null => {
  const msg = String(err?.details || err?.shortMessage || err?.message || "");
  const match = msg.match(/up to an?\s*(\d+)\s*block range/i);
  if (!match) return null;
  const n = parseInt(match[1], 10);
  return Number.isFinite(n) && n > 0 ? n : null;
};

// Hard ceiling on how many individual eth_getLogs requests one scan will attempt. Some
// free-tier RPCs restrict ranges so aggressively (e.g. 10 blocks at a time) that scanning
// months of history would need hundreds of thousands of requests — clearly impossible in a
// browser session. When the working chunk size would need more than this many requests to
// cover the full range, only the most recent MAX_CHUNKS worth of blocks are scanned instead,
// and the result is marked as truncated so the UI can say so honestly.
const MAX_CHUNKS_PER_SCAN = 60;

async function getLogsChunked(
  client: PublicClient,
  params: { address?: Address; event: any; args: any; fromBlock: bigint; toBlock: bigint },
  onProgress?: (label: string) => void,
  startingChunkSize?: bigint
): Promise<{ logs: any[]; truncated: boolean; chunkSize: bigint }> {
  const results: any[] = [];
  if (params.toBlock < params.fromBlock) return { logs: results, truncated: false, chunkSize: startingChunkSize ?? 20_000n };

  const baseArgs = (from: bigint, to: bigint) => ({
    ...(params.address ? { address: params.address } : {}),
    event: params.event,
    args: params.args,
    fromBlock: from,
    toBlock: to,
  });

  // If a previous call in this same scan already learned the RPC's real limit (e.g. the
  // ERC-20 pass discovering Alchemy's 10-block cap on Optimism), start there directly
  // instead of re-learning it from scratch via another round of failed requests.
  let chunkSize = startingChunkSize ?? 20_000n;
  let cursor = params.fromBlock;
  let probeEnd = cursor + chunkSize - 1n > params.toBlock ? params.toBlock : cursor + chunkSize - 1n;
  let attempt = 0;
  let probeBackoff = 600;
  let probeElapsed = 0;
  const MAX_RETRY_BUDGET_MS = 12_000;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const logs = await withTimeout(client.getLogs(baseArgs(cursor, probeEnd)), 15_000);
      results.push(...logs);
      cursor = probeEnd + 1n;
      break;
    } catch (err) {
      if (isArchiveAccessError(err)) throw new ArchiveAccessRequiredError();

      const suggestedRange = parseBlockRangeLimit(err);
      if (suggestedRange !== null) {
        // The RPC told us exactly what range it accepts — use it directly instead of
        // guessing via halving (which could still land above or below the real limit).
        chunkSize = BigInt(suggestedRange);
        probeEnd = cursor + chunkSize - 1n > params.toBlock ? params.toBlock : cursor + chunkSize - 1n;
        attempt += 1;
        if (attempt > 25) break;
        continue;
      }

      attempt += 1;
      if (isRateLimitError(err)) {
        if (probeElapsed >= MAX_RETRY_BUDGET_MS) {
          throw new Error("RPC is persistently rate-limited (429) — giving up on this chunk.");
        }
        await sleep(probeBackoff);
        probeElapsed += probeBackoff;
        probeBackoff = Math.min(probeBackoff * 2, 4000);
      } else {
        // Lowered floor from 50 to 2 — some free tiers (e.g. Alchemy on Optimism) allow
        // as few as 10 blocks per call, so a higher floor could never succeed at all.
        chunkSize = chunkSize / 2n > 2n ? chunkSize / 2n : 2n;
        probeEnd = cursor + chunkSize - 1n > params.toBlock ? params.toBlock : cursor + chunkSize - 1n;
      }
      if (attempt > 15) break;
    }
  }

  if (cursor > params.toBlock) return { logs: results, truncated: false, chunkSize };

  // Build the remaining ranges — but if the working chunk size would need an unreasonable
  // number of requests to cover the full span, only scan the most recent MAX_CHUNKS_PER_SCAN
  // worth (working backward from the latest block), rather than trying (and never finishing)
  // the whole thing.
  const totalBlocksLeft = params.toBlock - cursor + 1n;
  const chunksNeeded = totalBlocksLeft / chunkSize + (totalBlocksLeft % chunkSize > 0n ? 1n : 0n);
  let truncated = false;
  let scanFrom = cursor;
  if (chunksNeeded > BigInt(MAX_CHUNKS_PER_SCAN)) {
    truncated = true;
    const coveredBlocks = BigInt(MAX_CHUNKS_PER_SCAN) * chunkSize;
    scanFrom = params.toBlock > coveredBlocks ? params.toBlock - coveredBlocks + 1n : cursor;
  }

  const ranges: { from: bigint; to: bigint }[] = [];
  let c = scanFrom;
  while (c <= params.toBlock) {
    const e = c + chunkSize - 1n > params.toBlock ? params.toBlock : c + chunkSize - 1n;
    ranges.push({ from: c, to: e });
    c = e + 1n;
  }

  // Fully sequential on purpose — this is the single biggest lever against per-second rate
  // limits on free/public RPC endpoints. Any concurrency here is exactly what was causing
  // repeated 429s: multiple requests firing in the same instant.
  let done = 0;
  const chunkResults = await asyncPool(1, ranges, async (range) => {
    let size = chunkSize;
    let from = range.from;
    let to = range.to;
    let att = 0;
    let backoff = 600;
    let elapsed = 0;
    const MAX_RETRY_BUDGET_MS = 12_000;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        const logs = await withTimeout(client.getLogs(baseArgs(from, to)), 15_000);
        done += 1;
        onProgress?.(`Scanned ${done}/${ranges.length} chunks`);
        return logs;
      } catch (err) {
        if (isArchiveAccessError(err)) throw new ArchiveAccessRequiredError();

        const suggestedRange = parseBlockRangeLimit(err);
        if (suggestedRange !== null) {
          size = BigInt(suggestedRange);
          to = from + size - 1n > range.to ? range.to : from + size - 1n;
          att += 1;
          if (att > 25) throw err;
          continue;
        }

        att += 1;
        if (att > 10) throw err;
        if (isRateLimitError(err)) {
          if (elapsed >= MAX_RETRY_BUDGET_MS) throw new Error("RPC is persistently rate-limited (429) — giving up on this chunk.");
          await sleep(backoff);
          elapsed += backoff;
          backoff = Math.min(backoff * 2, 4000);
        } else {
          size = size / 2n > 2n ? size / 2n : 2n;
          to = from + size - 1n > range.to ? range.to : from + size - 1n;
        }
      }
    }
  });

  for (const r of chunkResults) results.push(...r);
  return { logs: results, truncated, chunkSize };
}

// ============= Fast path: Blockscout's own indexed log search (Soneium, Ink) =============
async function fetchLogsFromBlockscoutRange(
  blockscoutBase: string,
  topic0: string,
  ownerTopic: string,
  fromBlock: bigint,
  toBlock: bigint,
  scopedAddress?: Address,
  depth = 0
): Promise<{ address: string; spender: string }[] | null> {
  if (fromBlock > toBlock) return [];
  try {
    const addressParam = scopedAddress ? `&address=${scopedAddress}` : "";
    const url = `${blockscoutBase}/api?module=logs&action=getLogs&fromBlock=${fromBlock}&toBlock=${toBlock}&topic0=${topic0}&topic1=${ownerTopic}&topic0_1_opr=and${addressParam}`;
    const res = await withTimeout(fetch(url), 20_000);
    if (!res.ok) {
      console.warn(`Blockscout getLogs HTTP ${res.status} for range ${fromBlock}-${toBlock}`);
      return null;
    }
    const data = await res.json();

    if (data?.status === "0") {
      const message = String(data?.message || "").toLowerCase();
      if (message.includes("no records found") || message.includes("no logs found")) return [];
      console.warn(`Blockscout getLogs error for range ${fromBlock}-${toBlock}:`, data?.message || data?.result);
      return null;
    }

    if (!Array.isArray(data?.result)) {
      console.warn(`Blockscout getLogs unexpected response shape for range ${fromBlock}-${toBlock}:`, data);
      return null;
    }

    const parsed: { address: string; spender: string }[] = [];
    for (const item of data.result) {
      const topics = item?.topics;
      if (!item?.address || !Array.isArray(topics) || topics.length < 3 || !topics[2]) continue;
      parsed.push({ address: item.address as string, spender: `0x${String(topics[2]).slice(-40)}` });
    }

    if (parsed.length >= BLOCKSCOUT_LOG_CAP && toBlock > fromBlock && depth < 10) {
      const mid = fromBlock + (toBlock - fromBlock) / 2n;
      const [left, right] = await Promise.all([
        fetchLogsFromBlockscoutRange(blockscoutBase, topic0, ownerTopic, fromBlock, mid, scopedAddress, depth + 1),
        fetchLogsFromBlockscoutRange(blockscoutBase, topic0, ownerTopic, mid + 1n, toBlock, scopedAddress, depth + 1),
      ]);
      if (left === null || right === null) return parsed;
      return [...left, ...right];
    }

    return parsed;
  } catch (err) {
    console.warn(`Blockscout getLogs threw for range ${fromBlock}-${toBlock}:`, err);
    return null;
  }
}

async function fetchLogsFromBlockscout(
  blockscoutBase: string,
  topic0: string,
  ownerAddress: Address,
  fromBlock: bigint,
  toBlock: bigint,
  scopedAddress?: Address
): Promise<{ address: string; spender: string }[] | null> {
  const ownerTopic = pad(ownerAddress, { size: 32 });
  return fetchLogsFromBlockscoutRange(blockscoutBase, topic0, ownerTopic, fromBlock, toBlock, scopedAddress);
}

const fetchTokenBalances = async (blockscoutBase: string, address: string): Promise<TokenInfo[]> => {
  const res = await fetch(`${blockscoutBase}/api/v2/addresses/${address}/token-balances`);
  if (!res.ok) throw new Error(`Blockscout responded ${res.status}`);
  const data = await res.json();
  const items: any[] = Array.isArray(data) ? data : data?.items ?? [];

  return items
    .map((item): TokenInfo | null => {
      const t = item?.token;
      if (!t?.address) return null;
      const isNft = t.type === "ERC-721" || t.type === "ERC-1155";
      return {
        address: t.address as Address,
        name: t.name || "Unknown Token",
        symbol: t.symbol || "???",
        type: isNft ? "NFT" : "ERC-20",
        decimals: isNft ? 0 : Number(t.decimals ?? 18),
        iconUrl: t.icon_url ?? null,
      };
    })
    .filter((t): t is TokenInfo => t !== null);
};

const ICON_FALLBACK =
  "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='30' height='30'><circle cx='15' cy='15' r='15' fill='%23241a33'/><text y='55%25' x='50%25' text-anchor='middle' dominant-baseline='middle' font-size='14' fill='white'>?</text></svg>";

// ============= Styles =============
const pageStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700;800&family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap');

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
  @keyframes auroraDrift {
    0%   { transform: translateX(-50%) rotate(0deg); }
    100% { transform: translateX(-50%) rotate(360deg); }
  }
  @keyframes scanSweep {
    0%   { top: -8%; opacity: 0; }
    12%  { opacity: 1; }
    88%  { opacity: 1; }
    100% { top: 108%; opacity: 0; }
  }
  @keyframes completePulse {
    0%, 100% { transform: scale(1); }
    50%      { transform: scale(1.06); }
  }
  @keyframes countUp {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`;

// ============= Chain Selector =============
const ChainSelector = ({
  selectedChainId,
  onSelect,
  disabled,
}: {
  selectedChainId: number;
  onSelect: (id: number) => void;
  disabled?: boolean;
}) => (
  <HStack spacing={2} justify="center" flexWrap="wrap">
    {REVOKE_CHAINS.map((c) => {
      const isActive = c.id === selectedChainId;
      return (
        <Button
          key={c.id}
          onClick={() => onSelect(c.id)}
          isDisabled={disabled}
          variant="unstyled"
          display="flex"
          alignItems="center"
          gap={2}
          px={3.5}
          h="38px"
          borderRadius="full"
          bg={isActive ? `${c.color}1c` : "rgba(255,255,255,0.03)"}
          border="1px solid"
          borderColor={isActive ? `${c.color}70` : "rgba(255,255,255,0.08)"}
          boxShadow={isActive ? `0 0 18px ${c.glow}` : "none"}
          _hover={{ borderColor: `${c.color}55`, bg: `${c.color}12` }}
          transition="all 0.2s"
        >
          <Image src={c.iconUrl} alt={c.name} boxSize="18px" borderRadius="full" fallbackSrc={ICON_FALLBACK} />
          <Text fontSize="xs" fontWeight="700" color={isActive ? "white" : "gray.400"} fontFamily="'Space Grotesk', sans-serif">
            {c.name}
          </Text>
        </Button>
      );
    })}
  </HStack>
);

// ============= Compact stat chip (mirrors the site's other pages for visual consistency) =============
const StatChip = ({ label, value, icon, iconUrl, color, isLoading }: { label: string; value: string; icon: string; iconUrl?: string; color: string; isLoading?: boolean }) => (
  <Box
    bg="rgba(255,255,255,0.02)"
    backdropFilter="blur(20px)"
    borderRadius="xl"
    p={{ base: 3.5, md: 4 }}
    border="1px solid rgba(255,255,255,0.07)"
    position="relative"
    overflow="hidden"
    h="full"
  >
    <Box position="absolute" top={0} left={0} right={0} h="1px" bg={`linear-gradient(90deg, transparent, ${color}80, transparent)`} />
    <HStack spacing={3} align="center">
      <Flex align="center" justify="center" w={{ base: "34px", md: "38px" }} h={{ base: "34px", md: "38px" }} bg={`${color}12`} border={`1px solid ${color}28`} borderRadius="lg" flexShrink={0} fontSize={{ base: "15px", md: "17px" }} overflow="hidden">
        {iconUrl ? <Image src={iconUrl} alt={value} boxSize={{ base: "22px", md: "26px" }} borderRadius="full" fallbackSrc={ICON_FALLBACK} /> : icon}
      </Flex>
      <Box flex="1" minW="0">
        <Text fontSize="9px" color="gray.500" textTransform="uppercase" letterSpacing="0.16em" fontFamily="'Space Mono', monospace" fontWeight="700" mb={0.5}>
          {label}
        </Text>
        {isLoading ? (
          <Skeleton height="18px" width="46px" borderRadius="md" startColor="rgba(255,255,255,0.04)" endColor="rgba(255,255,255,0.16)" />
        ) : (
          <Text fontSize={{ base: "md", md: "lg" }} fontWeight="800" color="white" fontFamily="'Space Mono', monospace" letterSpacing="-0.01em" lineHeight="1.1" style={{ animation: "countUp 0.5s ease-out forwards" }}>
            {value}
          </Text>
        )}
      </Box>
    </HStack>
  </Box>
);

// ============= Spender label =============
const SpenderLabel = ({ address, knownSpenders, explorerAddressUrl }: { address: string; knownSpenders: Record<string, string>; explorerAddressUrl: string }) => {
  const known = knownSpenders[normalizeAddr(address)];
  return (
    <HStack spacing={2}>
      {known ? (
        <Badge bg="rgba(74,222,128,0.12)" color="#4ade80" fontSize="9px" px={2} py={0.5} borderRadius="full" border="1px solid rgba(74,222,128,0.25)" fontFamily="'Space Mono', monospace">
          ✓ {known}
        </Badge>
      ) : (
        <Text fontSize="xs" color="gray.300" fontFamily="'Space Mono', monospace">
          {truncateAddr(address)}
        </Text>
      )}
      <Link href={`${explorerAddressUrl}${address}`} isExternal aria-label="View spender on explorer">
        <ExternalLinkIcon color="gray.500" boxSize={2.5} _hover={{ color: "white" }} />
      </Link>
    </HStack>
  );
};

// ============= Approval Row =============
const ApprovalRowItem = ({
  row,
  isSelected,
  onToggleSelect,
  onRevoke,
  isRevoking,
  knownSpenders,
  explorerAddressUrl,
  explorerTokenUrl,
}: {
  row: ApprovalRow;
  isSelected: boolean;
  onToggleSelect: () => void;
  onRevoke: () => void;
  isRevoking: boolean;
  knownSpenders: Record<string, string>;
  explorerAddressUrl: string;
  explorerTokenUrl: string;
}) => {
  const formattedAllowance = useMemo(() => {
    if (row.isNft) return row.isApprovedForAll ? "All tokens" : "—";
    if (row.allowanceRaw === undefined) return "—";
    if (row.isUnlimited) return "Unlimited";
    const value = Number(row.allowanceRaw) / 10 ** row.token.decimals;
    return value.toLocaleString(undefined, { maximumFractionDigits: 6 });
  }, [row]);

  return (
    <Flex
      align="center"
      justify="space-between"
      gap={3}
      p={3.5}
      bg="rgba(255,255,255,0.02)"
      border="1px solid"
      borderColor={row.isUnlimited ? "rgba(239,68,68,0.25)" : "rgba(255,255,255,0.06)"}
      borderRadius="14px"
      _hover={{ borderColor: row.isUnlimited ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.14)" }}
      transition="all 0.2s"
      flexWrap="wrap"
      position="relative"
      overflow="hidden"
    >
      {row.isUnlimited && <Box position="absolute" top={0} left={0} bottom={0} w="3px" bg="linear-gradient(180deg, #ef4444, #f97316)" />}
      <HStack spacing={3} flex="1" minW="220px">
        <Checkbox isChecked={isSelected} onChange={onToggleSelect} colorScheme="red" />
        <Image src={row.token.iconUrl || undefined} alt={row.token.symbol} boxSize="30px" borderRadius="full" fallbackSrc={ICON_FALLBACK} />
        <Box minW="0">
          <HStack spacing={1.5}>
            <Text fontSize="sm" fontWeight="700" color="white" fontFamily="'Space Grotesk', sans-serif" noOfLines={1}>
              {row.token.symbol}
            </Text>
            <Badge fontSize="8px" px={1.5} borderRadius="full" bg="rgba(255,255,255,0.06)" color="gray.400" fontFamily="'Space Mono', monospace">
              {row.token.type}
            </Badge>
          </HStack>
          <Link href={`${explorerTokenUrl}${row.token.address}`} isExternal fontSize="10px" color="gray.500" _hover={{ color: "gray.300" }}>
            {truncateAddr(row.token.address)}
          </Link>
        </Box>
      </HStack>

      <VStack spacing={0} align="start" minW="90px">
        <Text fontSize="9px" color="gray.600" textTransform="uppercase" letterSpacing="0.1em" fontFamily="'Space Mono', monospace">
          Spender
        </Text>
        <SpenderLabel address={row.spender} knownSpenders={knownSpenders} explorerAddressUrl={explorerAddressUrl} />
      </VStack>

      <VStack spacing={0} align="start" minW="90px">
        <Text fontSize="9px" color="gray.600" textTransform="uppercase" letterSpacing="0.1em" fontFamily="'Space Mono', monospace">
          Allowance
        </Text>
        <HStack spacing={1.5}>
          {row.isUnlimited && <WarningTwoIcon color="#f87171" boxSize={3} />}
          <Text fontSize="xs" fontWeight="700" color={row.isUnlimited ? "#f87171" : "gray.200"} fontFamily="'Space Mono', monospace">
            {formattedAllowance}
          </Text>
        </HStack>
      </VStack>

      <Button
        size="sm"
        onClick={onRevoke}
        isLoading={isRevoking}
        loadingText="Revoking…"
        bg="rgba(239,68,68,0.12)"
        color="#f87171"
        border="1px solid rgba(239,68,68,0.3)"
        borderRadius="lg"
        fontWeight="700"
        fontSize="xs"
        _hover={{ bg: "rgba(239,68,68,0.2)", borderColor: "rgba(239,68,68,0.5)" }}
        fontFamily="'Space Grotesk', sans-serif"
      >
        Revoke
      </Button>
    </Flex>
  );
};

// ============= Footer =============
const Footer = () => {
  const currentYear = new Date().getFullYear();
  return (
    <Box pt={10} pb={6} position="relative">
      <Box h="1px" mb={8} bg="linear-gradient(90deg, transparent, rgba(239,68,68,0.2), rgba(168,85,247,0.2), transparent)" />
      <VStack spacing={4}>
        <HStack spacing={2} justify="center" flexWrap="wrap">
          {REVOKE_CHAINS.map((c) => (
            <Box key={c.id} px={3} py={1} borderRadius="full" bg={`${c.color}10`} border={`1px solid ${c.color}25`}>
              <Text fontSize="10px" fontWeight="700" color={c.color} fontFamily="'Space Mono', monospace" letterSpacing="0.06em">
                {c.name}
              </Text>
            </Box>
          ))}
        </HStack>
        <VStack spacing={1}>
          <Text fontSize="9px" color="gray.500" fontFamily="'Space Mono', monospace" letterSpacing="0.12em" textAlign="center">
            © {currentYear} · Agent Protocol · Approval Manager
          </Text>
          <Text fontSize="9px" color="gray.600" fontFamily="'Space Mono', monospace" letterSpacing="0.08em">
            Reads directly from the chain — no backend, no custody of your funds, ever.
          </Text>
        </VStack>
      </VStack>
    </Box>
  );
};

// ============= Main Page =============
export default function Revoke() {
  useFixScroll();

  const { address, isConnected } = useAccount();
  const walletChainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const toast = useToast();
  const navigate = useNavigate();

  // ===== Donations =====
  const { isOpen: isDonateOpen, onOpen: onDonateOpen, onClose: onDonateClose } = useDisclosure();
  const [donateChainId, setDonateChainId] = useState<number>(DEFAULT_CHAIN_ID);
  const [donateAmount, setDonateAmount] = useState("0.01");
  const [donateMessage, setDonateMessage] = useState("");
  const [isDonating, setIsDonating] = useState(false);

  const [selectedChainId, setSelectedChainId] = useState<number>(DEFAULT_CHAIN_ID);
  const chainConfig = CHAIN_MAP.get(selectedChainId) ?? REVOKE_CHAINS[0];
  const defaultPublicClient = usePublicClient({ chainId: selectedChainId });
  const donatePublicClient = usePublicClient({ chainId: donateChainId });
  const knownSpenders = KNOWN_SPENDERS_BY_CHAIN[selectedChainId] ?? {};

  // In-memory only, on purpose — never persisted, so it's automatically gone on refresh.
  const [customRpcUrls, setCustomRpcUrls] = useState<Record<number, string>>({});
  const [customRpcInput, setCustomRpcInput] = useState("");
  const [showRpcSettings, setShowRpcSettings] = useState(false);

  // Uses the user's own RPC for this chain if they've set one — otherwise the default
  // shared public RPC. Only ever affects reads (scanning/verification); the wallet's own
  // connection is always used for signing/sending the actual revoke transaction.
  const publicClient = useMemo(() => {
    const customUrl = customRpcUrls[selectedChainId];
    if (customUrl) {
      try {
        return buildCustomClient(chainConfig.chainObj, customUrl);
      } catch (err) {
        console.warn("Invalid custom RPC URL, falling back to the default:", err);
      }
    }
    return defaultPublicClient;
  }, [customRpcUrls, selectedChainId, chainConfig, defaultPublicClient]);

  const hasCustomRpc = Boolean(customRpcUrls[selectedChainId]);

  const saveCustomRpcForChain = () => {
    const url = customRpcInput.trim();
    if (!/^https?:\/\/.+/.test(url)) {
      toast({ title: "Invalid RPC URL", description: "Must start with http:// or https://", status: "warning", duration: 3000, isClosable: true, position: "top-right" });
      return;
    }
    setCustomRpcUrls((prev) => ({ ...prev, [selectedChainId]: url }));
    setCustomRpcInput("");
    toast({ title: `Custom RPC set for ${chainConfig.name}`, description: "Used for this session only — you'll need to paste it again after a refresh.", status: "success", duration: 4000, isClosable: true, position: "top-right" });
  };

  const clearCustomRpcForChain = () => {
    setCustomRpcUrls((prev) => {
      const next = { ...prev };
      delete next[selectedChainId];
      return next;
    });
  };

  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [isLoadingTokens, setIsLoadingTokens] = useState(false);
  const [tokensError, setTokensError] = useState<string | null>(null);
  const [manualTokenInput, setManualTokenInput] = useState("");
  const [showManualCheck, setShowManualCheck] = useState(false);
  const [manualTokens, setManualTokens] = useState<Address[]>([]);

  const [scanDepth, setScanDepth] = useState<ScanDepth>("90d");
  const [isScanning, setIsScanning] = useState(false);
  const [scanPhase, setScanPhase] = useState("");
  const [candidates, setCandidates] = useState<ApprovalCandidate[]>([]);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanWarnings, setScanWarnings] = useState<string[]>([]);
  const [lastScanTimestamp, setLastScanTimestamp] = useState<number | null>(null);

  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [revokingKey, setRevokingKey] = useState<string | null>(null);

  // ===== Switching chains resets scan state and loads that chain's cache, if any =====
  const handleSelectChain = (chainId: number) => {
    if (chainId === selectedChainId) return;
    setSelectedChainId(chainId);
    setCandidates([]);
    setTokens([]);
    setTokensError(null);
    setManualTokens([]);
    setSelectedKeys(new Set());
    setScanError(null);
    setLastScanTimestamp(null);

    if (address) {
      const cached = loadScanCache(chainId, address);
      if (cached) {
        setCandidates(cached.candidates);
        setLastScanTimestamp(cached.timestamp);
      }
    }
  };

  // Load cached scan for the current chain as soon as the wallet connects
  useEffect(() => {
    if (!address || !isConnected) return;
    const cached = loadScanCache(selectedChainId, address);
    if (cached) {
      setCandidates(cached.candidates);
      setLastScanTimestamp(cached.timestamp);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, isConnected]);

  // ===== Optional token-list preview (Blockscout only, non-blocking) =====
  const loadTokens = useCallback(async () => {
    if (!address || !chainConfig.blockscoutBase) return;
    setIsLoadingTokens(true);
    setTokensError(null);
    try {
      const result = await fetchTokenBalances(chainConfig.blockscoutBase, address);
      setTokens(result);
    } catch (err) {
      console.warn("Could not load token list from Blockscout:", err);
      setTokensError("unavailable");
      setTokens([]);
    } finally {
      setIsLoadingTokens(false);
    }
  }, [address, chainConfig.blockscoutBase]);

  useEffect(() => {
    if (address && isConnected) loadTokens();
  }, [address, isConnected, loadTokens]);

  const addManualToken = () => {
    const addr = manualTokenInput.trim();
    if (!/^0x[a-fA-F0-9]{40}$/.test(addr)) {
      toast({ title: "Invalid address", status: "warning", duration: 3000, isClosable: true, position: "top-right" });
      return;
    }
    if (manualTokens.some((a) => normalizeAddr(a) === normalizeAddr(addr))) {
      toast({ title: "Already added", status: "info", duration: 2500, isClosable: true, position: "top-right" });
      return;
    }
    setManualTokens((prev) => [...prev, addr as Address]);
    setManualTokenInput("");
    toast({ title: "Token added", description: "It'll be included on your next scan.", status: "success", duration: 3000, isClosable: true, position: "top-right" });
  };

  // ===== Step 1: scan for approvals on the selected chain =====
  const handleScan = useCallback(async () => {
    if (!address || !publicClient) return;
    const client = publicClient;

    setIsScanning(true);
    setScanError(null);
    setScanWarnings([]);
    setCandidates([]);
    setSelectedKeys(new Set());
    setScanPhase(`Searching approval history on ${chainConfig.name}…`);

    try {
      const latestBlock = await client.getBlockNumber();
      const depthOption = SCAN_DEPTH_OPTIONS.find((o) => o.value === scanDepth);
      const fromBlock =
        depthOption?.days != null
          ? (() => {
              const back = BigInt(depthOption.days * BLOCKS_PER_DAY);
              return latestBlock > back ? latestBlock - back : 0n;
            })()
          : 0n;

      const progressFor = (label: string) => (label2: string) => setScanPhase(`${label}: ${label2}`);

      let erc20Pairs: { address: string; spender: string }[] = [];
      let nftPairs: { address: string; spender: string }[] = [];
      let usedFastPathForErc20 = false;
      let usedFastPathForNft = false;

      if (chainConfig.blockscoutBase) {
        const [erc20Fast, nftFast] = await Promise.all([
          fetchLogsFromBlockscout(chainConfig.blockscoutBase, ERC20_APPROVAL_TOPIC0, address, 0n, latestBlock),
          fetchLogsFromBlockscout(chainConfig.blockscoutBase, APPROVAL_FOR_ALL_TOPIC0, address, 0n, latestBlock),
        ]);
        if (erc20Fast !== null) {
          erc20Pairs = erc20Fast;
          usedFastPathForErc20 = true;
        }
        if (nftFast !== null) {
          nftPairs = nftFast;
          usedFastPathForNft = true;
        }
      }

      const scanWarnings: string[] = [];
      // Remembers the RPC's real per-request block-range limit once any call in this scan
      // discovers it (e.g. Alchemy's 10-block cap on Optimism) — passed to every subsequent
      // RPC call below so they start there directly instead of re-learning it via another
      // round of failed requests each.
      let learnedChunkSize: bigint | undefined;

      if (!usedFastPathForErc20) {
        setScanPhase(`Scanning ERC-20 approvals on ${chainConfig.name} via RPC (slower)…`);
        try {
          const { logs, truncated, chunkSize } = await getLogsChunked(client, { event: ERC20_APPROVAL_EVENT, args: { owner: address }, fromBlock, toBlock: latestBlock }, progressFor("ERC-20 RPC scan"), learnedChunkSize);
          learnedChunkSize = chunkSize;
          erc20Pairs = logs.map((log: any) => ({ address: log.address as string, spender: log?.args?.spender as string })).filter((p) => !!p.spender);
          if (truncated) {
            scanWarnings.push(`ERC-20 scan on ${chainConfig.name}: this RPC's free tier only allows very short block ranges, so only recent activity was scanned — older approvals may be missing.`);
          }
        } catch (err) {
          if (err instanceof ArchiveAccessRequiredError) {
            scanWarnings.push(`ERC-20 scan on ${chainConfig.name} is limited: this chain's RPC requires a paid plan for historical data.`);
          } else {
            console.warn(`ERC-20 RPC scan failed on ${chainConfig.name}:`, err);
            scanWarnings.push(`ERC-20 scan on ${chainConfig.name} hit an RPC error — results may be incomplete.`);
          }
        }
      }

      if (!usedFastPathForNft) {
        setScanPhase(`Scanning NFT approvals on ${chainConfig.name} via RPC (slower)…`);
        try {
          const { logs, truncated, chunkSize } = await getLogsChunked(client, { event: APPROVAL_FOR_ALL_EVENT, args: { owner: address }, fromBlock, toBlock: latestBlock }, progressFor("NFT RPC scan"), learnedChunkSize);
          learnedChunkSize = chunkSize;
          nftPairs = logs.map((log: any) => ({ address: log.address as string, spender: log?.args?.operator as string })).filter((p) => !!p.spender);
          if (truncated) {
            scanWarnings.push(`NFT scan on ${chainConfig.name}: this RPC's free tier only allows very short block ranges, so only recent activity was scanned — older approvals may be missing.`);
          }
        } catch (err) {
          if (err instanceof ArchiveAccessRequiredError) {
            scanWarnings.push(`NFT scan on ${chainConfig.name} is limited: this chain's RPC requires a paid plan for historical data.`);
          } else {
            console.warn(`NFT RPC scan failed on ${chainConfig.name}:`, err);
            scanWarnings.push(`NFT scan on ${chainConfig.name} hit an RPC error — results may be incomplete.`);
          }
        }
      }

      if (manualTokens.length > 0) setScanPhase("Checking manually added tokens…");
      const manualResults = await Promise.all(
        manualTokens.map(async (tokenAddr) => {
          // Prefer the fast, scoped Blockscout search (cheap — it's just one contract)
          // over RPC, for the same reason the broad scan does: it's far more reliable on
          // busy/rate-limited chains.
          if (chainConfig.blockscoutBase) {
            const [erc20Fast, nftFast] = await Promise.all([
              fetchLogsFromBlockscout(chainConfig.blockscoutBase, ERC20_APPROVAL_TOPIC0, address, 0n, latestBlock, tokenAddr),
              fetchLogsFromBlockscout(chainConfig.blockscoutBase, APPROVAL_FOR_ALL_TOPIC0, address, 0n, latestBlock, tokenAddr),
            ]);
            if (erc20Fast !== null && nftFast !== null) {
              return { erc20: erc20Fast, nft: nftFast };
            }
          }
          try {
            const [erc20Result, nftResult] = await Promise.all([
              getLogsChunked(client, { address: tokenAddr, event: ERC20_APPROVAL_EVENT, args: { owner: address }, fromBlock: 0n, toBlock: latestBlock }, undefined, learnedChunkSize),
              getLogsChunked(client, { address: tokenAddr, event: APPROVAL_FOR_ALL_EVENT, args: { owner: address }, fromBlock: 0n, toBlock: latestBlock }, undefined, learnedChunkSize),
            ]);
            return {
              erc20: erc20Result.logs.map((log: any) => ({ address: log.address as string, spender: log?.args?.spender as string })),
              nft: nftResult.logs.map((log: any) => ({ address: log.address as string, spender: log?.args?.operator as string })),
            };
          } catch (err) {
            const reason = err instanceof ArchiveAccessRequiredError ? "this chain's RPC requires a paid plan for historical data" : "an RPC error";
            scanWarnings.push(`Manual check for ${truncateAddr(tokenAddr)} on ${chainConfig.name} failed (${reason}).`);
            return { erc20: [], nft: [] };
          }
        })
      );

      const allErc20Pairs = [...erc20Pairs, ...manualResults.flatMap((r) => r.erc20)];
      const allNftPairs = [...nftPairs, ...manualResults.flatMap((r) => r.nft)];

      if (DEBUG) {
        console.log(
          `[${chainConfig.name}] Approval scan: ERC-20 via ${usedFastPathForErc20 ? "Blockscout" : "RPC"} (${allErc20Pairs.length} entries), ` +
            `NFT via ${usedFastPathForNft ? "Blockscout" : "RPC"} (${allNftPairs.length} entries)`
        );
      }

      const erc20Map = new Map<string, Set<string>>();
      for (const pair of allErc20Pairs) {
        if (!pair.address || !pair.spender) continue;
        const tokenAddr = normalizeAddr(pair.address);
        if (!erc20Map.has(tokenAddr)) erc20Map.set(tokenAddr, new Set());
        erc20Map.get(tokenAddr)!.add(normalizeAddr(pair.spender));
      }
      const nftMap = new Map<string, Set<string>>();
      for (const pair of allNftPairs) {
        if (!pair.address || !pair.spender) continue;
        const tokenAddr = normalizeAddr(pair.address);
        if (!nftMap.has(tokenAddr)) nftMap.set(tokenAddr, new Set());
        nftMap.get(tokenAddr)!.add(normalizeAddr(pair.spender));
      }

      if (erc20Map.size === 0 && nftMap.size === 0) {
        setCandidates([]);
        setScanWarnings(scanWarnings);
        setLastScanTimestamp(Date.now());
        saveScanCache(selectedChainId, address, []);
        setScanPhase("");
        return;
      }

      setScanPhase("Resolving token info…");
      const erc20TokenAddrs = Array.from(erc20Map.keys());
      const nftTokenAddrs = Array.from(nftMap.keys());
      const metaContracts: any[] = [
        ...erc20TokenAddrs.flatMap((addr) => [
          { address: addr as Address, abi: ERC20_ABI, functionName: "symbol" },
          { address: addr as Address, abi: ERC20_ABI, functionName: "name" },
          { address: addr as Address, abi: ERC20_ABI, functionName: "decimals" },
        ]),
        ...nftTokenAddrs.flatMap((addr) => [
          { address: addr as Address, abi: NFT_ABI, functionName: "symbol" },
          { address: addr as Address, abi: NFT_ABI, functionName: "name" },
        ]),
      ];

      let metaResults: any[] = [];
      try {
        metaResults = await multicallChunked(client, metaContracts);
      } catch (err) {
        console.warn("Token metadata multicall failed, falling back to generic labels:", err);
        metaResults = metaContracts.map(() => ({ status: "failure" as const }));
      }

      const tokenInfoMap = new Map<string, TokenInfo>();
      let cursor = 0;
      for (const addr of erc20TokenAddrs) {
        const symbolRes = metaResults[cursor++];
        const nameRes = metaResults[cursor++];
        const decimalsRes = metaResults[cursor++];
        tokenInfoMap.set(addr, {
          address: addr as Address,
          symbol: symbolRes?.status === "success" ? (symbolRes.result as string) : truncateAddr(addr),
          name: nameRes?.status === "success" ? (nameRes.result as string) : "Unknown Token",
          decimals: decimalsRes?.status === "success" ? Number(decimalsRes.result) : 18,
          type: "ERC-20",
        });
      }
      for (const addr of nftTokenAddrs) {
        const symbolRes = metaResults[cursor++];
        const nameRes = metaResults[cursor++];
        tokenInfoMap.set(addr, {
          address: addr as Address,
          symbol: symbolRes?.status === "success" ? (symbolRes.result as string) : truncateAddr(addr),
          name: nameRes?.status === "success" ? (nameRes.result as string) : "NFT Collection",
          decimals: 0,
          type: "NFT",
        });
      }

      const found: ApprovalCandidate[] = [];
      for (const [tokenAddr, spenders] of erc20Map) {
        const token = tokenInfoMap.get(tokenAddr);
        if (!token) continue;
        for (const spender of spenders) found.push({ key: `erc20-${tokenAddr}-${spender}`, token, spender: spender as Address });
      }
      for (const [tokenAddr, operators] of nftMap) {
        const token = tokenInfoMap.get(tokenAddr);
        if (!token) continue;
        for (const operator of operators) found.push({ key: `nft-${tokenAddr}-${operator}`, token, spender: operator as Address });
      }

      setCandidates(found);
      setScanWarnings(scanWarnings);
      const now = Date.now();
      setLastScanTimestamp(now);
      saveScanCache(selectedChainId, address, found);
      setScanPhase("");
    } catch (err) {
      console.error("Approval scan failed:", err);
      setScanError(`Something went wrong while scanning for approvals: ${(err as any)?.shortMessage || (err as any)?.message || "please try again."}`);
      setScanPhase("");
    } finally {
      setIsScanning(false);
    }
  }, [address, publicClient, scanDepth, manualTokens, chainConfig, selectedChainId]);

  // ===== Step 2: verify CURRENT state for every candidate via multicall =====
  const [activeApprovals, setActiveApprovals] = useState<ApprovalRow[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [failedVerificationCount, setFailedVerificationCount] = useState(0);

  const verifyApprovals = useCallback(async () => {
    if (!publicClient || !address || candidates.length === 0) {
      setActiveApprovals([]);
      setFailedVerificationCount(0);
      return;
    }
    setIsVerifying(true);
    try {
      const contracts: any[] = candidates.map((c) =>
        c.token.type === "ERC-20"
          ? { address: c.token.address, abi: ERC20_ABI, functionName: "allowance", args: [address, c.spender] }
          : { address: c.token.address, abi: NFT_ABI, functionName: "isApprovedForAll", args: [address, c.spender] }
      );

      const results = await multicallChunked(publicClient, contracts);

      const rows: ApprovalRow[] = [];
      let failedCount = 0;
      candidates.forEach((c, i) => {
        const result = results[i];
        if (result?.status !== "success") {
          failedCount += 1;
          return;
        }
        const isNft = c.token.type !== "ERC-20";
        if (isNft) {
          if (!(result.result as boolean)) return;
          rows.push({ ...c, isNft: true, isApprovedForAll: true, isUnlimited: false });
        } else {
          const allowanceRaw = result.result as bigint;
          if (allowanceRaw <= 0n) return;
          rows.push({ ...c, isNft: false, allowanceRaw, isUnlimited: allowanceRaw >= UNLIMITED_THRESHOLD });
        }
      });
      rows.sort((a, b) => Number(b.isUnlimited) - Number(a.isUnlimited));
      if (DEBUG) {
        console.log(`Verification: ${candidates.length} pairs checked, ${failedCount} calls failed, ${rows.length} came back with a nonzero/active approval.`);
      }
      setFailedVerificationCount(failedCount);
      setActiveApprovals(rows);
    } catch (err) {
      console.error("Verification multicall failed:", err);
      setScanError("Found candidate approvals, but couldn't verify their current state. Please try scanning again.");
      setActiveApprovals([]);
    } finally {
      setIsVerifying(false);
    }
  }, [candidates, address, publicClient]);

  useEffect(() => {
    verifyApprovals();
  }, [verifyApprovals]);

  const unlimitedCount = activeApprovals.filter((r) => r.isUnlimited).length;

  // ===== Revoke — auto-switches the wallet's network if it isn't already on the chain
  // being revoked on, since writing a transaction (unlike reading) requires it. =====
  const ensureWalletOnChain = async (targetChainId: number = selectedChainId): Promise<boolean> => {
    if (walletChainId === targetChainId) return true;
    try {
      await switchChainAsync({ chainId: targetChainId });
      return true;
    } catch {
      const targetName = CHAIN_MAP.get(targetChainId)?.name ?? "the selected chain";
      toast({ title: "Network switch needed", description: `Please switch your wallet to ${targetName} to continue.`, status: "warning", duration: 5000, isClosable: true, position: "top-right" });
      return false;
    }
  };

  const revokeOne = async (row: ApprovalRow) => {
    if (!publicClient) return;
    const onChain = await ensureWalletOnChain();
    if (!onChain) return;

    setRevokingKey(row.key);
    try {
      const hash = row.isNft
        ? await writeContractAsync({ address: row.token.address, abi: NFT_ABI, functionName: "setApprovalForAll", args: [row.spender, false], chainId: selectedChainId })
        : await writeContractAsync({ address: row.token.address, abi: ERC20_ABI, functionName: "approve", args: [row.spender, 0n], chainId: selectedChainId });

      toast({ title: "Revoke sent", description: "Waiting for confirmation…", status: "info", duration: 4000, isClosable: true, position: "top-right" });
      await publicClient.waitForTransactionReceipt({ hash });
      toast({ title: "Approval revoked ✅", description: `${row.token.symbol} → ${truncateAddr(row.spender)}`, status: "success", duration: 4000, isClosable: true, position: "top-right" });
      await verifyApprovals();
    } catch (err: any) {
      const rejected = err?.message?.includes("rejected") || err?.shortMessage?.includes("rejected");
      toast({
        title: rejected ? "Cancelled" : "Revoke failed",
        description: rejected ? "You cancelled the transaction" : err?.shortMessage || "Please try again",
        status: rejected ? "warning" : "error",
        duration: 5000,
        isClosable: true,
        position: "top-right",
      });
    } finally {
      setRevokingKey(null);
    }
  };

  const revokeSelected = async () => {
    const rows = activeApprovals.filter((r) => selectedKeys.has(r.key));
    for (const row of rows) {
      // eslint-disable-next-line no-await-in-loop
      await revokeOne(row);
    }
    setSelectedKeys(new Set());
  };

  // ===== Donate =====
  const donateChainConfig = CHAIN_MAP.get(donateChainId) ?? REVOKE_CHAINS[0];

  const handleDonate = async () => {
    const amount = parseFloat(donateAmount);
    if (!amount || amount <= 0) {
      toast({ title: "Enter an amount", status: "warning", duration: 3000, isClosable: true, position: "top-right" });
      return;
    }
    if (!donatePublicClient) return;

    const onChain = await ensureWalletOnChain(donateChainId);
    if (!onChain) return;

    setIsDonating(true);
    try {
      const hash = await writeContractAsync({
        address: DONATION_CONTRACTS[donateChainId],
        abi: DONATION_ABI,
        functionName: "donate",
        args: [donateMessage],
        value: parseEther(donateAmount),
        chainId: donateChainId,
      });
      toast({ title: "Donation sent 💜", description: "Waiting for confirmation…", status: "info", duration: 4000, isClosable: true, position: "top-right" });
      await donatePublicClient.waitForTransactionReceipt({ hash });
      toast({
        title: "Thank you! 🙏",
        description: `Your ${donateAmount} ETH donation on ${donateChainConfig.name} was confirmed.`,
        status: "success",
        duration: 6000,
        isClosable: true,
        position: "top-right",
      });
      setDonateMessage("");
      onDonateClose();
    } catch (err: any) {
      const rejected = err?.message?.includes("rejected") || err?.shortMessage?.includes("rejected");
      toast({
        title: rejected ? "Cancelled" : "Donation failed",
        description: rejected ? "You cancelled the transaction" : err?.shortMessage || "Please try again",
        status: rejected ? "warning" : "error",
        duration: 5000,
        isClosable: true,
        position: "top-right",
      });
    } finally {
      setIsDonating(false);
    }
  };

  const toggleSelect = (key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedKeys((prev) => (prev.size === activeApprovals.length ? new Set() : new Set(activeApprovals.map((r) => r.key))));
  };

  return (
    <>
      <style>{pageStyles}</style>

      <Box minH="100vh" bgGradient="linear(180deg, #0a0407 0%, #030309 45%, #050308 100%)" position="relative" fontFamily="'Space Grotesk', sans-serif" overflowX="hidden">
        {/* Background */}
        <Box position="fixed" top="-8%" left="50%" w="1000px" h="580px" pointerEvents="none" zIndex={0}
          bg="conic-gradient(from 180deg at 50% 50%, rgba(239,68,68,0.22), rgba(249,115,22,0.16), rgba(168,85,247,0.16), rgba(239,68,68,0.22))"
          filter="blur(100px)" opacity={0.75} style={{ animation: "auroraDrift 26s linear infinite" }} />
        <Box position="fixed" bottom="-12%" right="-10%" w="700px" h="700px" borderRadius="full" bg="radial-gradient(circle, rgba(168,85,247,0.09) 0%, transparent 65%)" filter="blur(110px)" style={{ animation: "orbFloat 30s ease-in-out infinite 8s" }} zIndex={0} pointerEvents="none" />
        <Box position="fixed" top={0} left={0} right={0} bottom={0} zIndex={0} pointerEvents="none" opacity={0.02} bgImage="radial-gradient(rgba(255,255,255,0.9) 1px, transparent 1px)" bgSize="32px 32px" />
        <Box position="fixed" inset={0} zIndex={0} pointerEvents="none" bg="radial-gradient(ellipse at 50% 25%, transparent 45%, rgba(0,0,0,0.55) 100%)" />

        <Container maxW="1180px" position="relative" zIndex={1} px={{ base: 3, md: 6, lg: 8 }} py={{ base: 3, md: 5 }}>
          {/* Header */}
          <Flex justify="space-between" align="center" mb={{ base: 3, md: 4 }} direction={{ base: "column", md: "row" }} gap={{ base: 3, md: 0 }}>
            <HStack spacing={4}>
              <Button onClick={() => navigate("/")} variant="ghost" size={{ base: "sm", md: "md" }} leftIcon={<ChevronLeftIcon />}
                color="gray.300" _hover={{ color: "white", bg: "rgba(239,68,68,0.1)", borderColor: "rgba(239,68,68,0.4)" }}
                borderRadius="xl" border="1px solid rgba(239,68,68,0.28)" fontFamily="'Space Grotesk', sans-serif" fontWeight="500">
                Back
              </Button>
              <Box h="36px" w="1px" bg="rgba(255,255,255,0.05)" display={{ base: "none", md: "block" }} />
              <HStack spacing={2.5}>
                <Box w="7px" h="7px" borderRadius="full" bg="#f87171" boxShadow="0 0 8px rgba(248,113,113,0.8)" style={{ animation: "pulseGlow 2.5s ease-in-out infinite" }} />
                <Text fontSize={{ base: "sm", md: "md" }} fontWeight="700" color="white" fontFamily="'Space Grotesk', sans-serif">
                  Approval Guard
                </Text>
                <Badge bg="rgba(239,68,68,0.1)" color="#f87171" fontSize="9px" px={2} py={0.5} borderRadius="full" border="1px solid rgba(239,68,68,0.25)" fontFamily="'Space Mono', monospace">
                  MULTI-CHAIN
                </Badge>
              </HStack>
            </HStack>
            <HStack spacing={2.5} display={{ base: "none", md: "flex" }} align="center">
              <Button
                onClick={onDonateOpen}
                h="40px"
                px={5}
                bgGradient="linear(135deg, #a855f7, #d946ef)"
                color="white"
                borderRadius="lg"
                fontWeight="700"
                fontSize="sm"
                _hover={{ transform: "translateY(-2px)", boxShadow: "0 8px 20px rgba(168,85,247,0.4)" }}
                transition="all 0.2s"
              >
                💜 Donate
              </Button>
              <ConnectButton chainStatus="full" accountStatus="full" showBalance={false} />
            </HStack>
          </Flex>
          <HStack display={{ base: "flex", md: "none" }} justifyContent="center" spacing={2.5} mb={3} align="center">
            <Button
              onClick={onDonateOpen}
              h="40px"
              px={5}
              bgGradient="linear(135deg, #a855f7, #d946ef)"
              color="white"
              borderRadius="lg"
              fontWeight="700"
              fontSize="sm"
            >
              💜 Donate
            </Button>
            <ConnectButton chainStatus="full" accountStatus="full" showBalance={false} />
          </HStack>

          {/* Hero — expanded a bit for context, still tight on vertical space */}
          <MotionBox initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <VStack spacing={3} textAlign="center" maxW="680px" mx="auto" mb={{ base: 4, md: 5 }}>
            <Badge bg="rgba(239,68,68,0.14)" color="#fca5a5" fontSize="10px" px={3} py={1} borderRadius="full" border="1px solid rgba(239,68,68,0.3)" fontFamily="'Space Mono', monospace" letterSpacing="0.08em">
              🛡 WALLET DRAIN PROTECTION · APPROVAL AUDIT
            </Badge>
            <Heading fontSize={{ base: "2xl", md: "4xl" }} fontWeight="800" letterSpacing="-0.02em" lineHeight="1.15"
              bgGradient="linear(120deg, #fff1f0 0%, #fca5a5 35%, #d8b4fe 70%, #fff1f0 100%)" backgroundSize="220% auto"
              bgClip="text" fontFamily="'Space Grotesk', sans-serif" style={{ animation: "shimmerBorder 7s linear infinite" }}>
              Find and revoke risky token approvals
            </Heading>
            <Text fontSize={{ base: "sm", md: "md" }} color="gray.300" fontFamily="'Space Grotesk', sans-serif" maxW="560px" lineHeight="1.65">
              Every time you approve a contract, that permission stays live until you revoke
              it — even for apps you stopped using months ago. Scan your wallet across 5
              chains, see exactly what's unlimited, and shut it down in one signed transaction.
            </Text>
            <HStack spacing={{ base: 3, md: 5 }} pt={0.5} flexWrap="wrap" justify="center">
              {[
                { icon: "⛓", label: "5 chains supported" },
                { icon: "🔒", label: "No custody, ever" },
                { icon: "⚡", label: "Read-only until you click revoke" },
              ].map((f) => (
                <HStack key={f.label} spacing={1.5}>
                  <Text fontSize="xs">{f.icon}</Text>
                  <Text fontSize="11px" color="gray.400" fontFamily="'Space Mono', monospace">
                    {f.label}
                  </Text>
                </HStack>
              ))}
            </HStack>
          </VStack>
          </MotionBox>

          {/* Chain selector */}
          <Box mb={{ base: 4, md: 5 }}>
            <ChainSelector selectedChainId={selectedChainId} onSelect={handleSelectChain} disabled={isScanning} />
          </Box>

          {/* Stat strip */}
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={{ base: 2, md: 3 }} mb={{ base: 4, md: 5 }}>
            <StatChip label="Chain" value={chainConfig.name} icon="⛓" iconUrl={chainConfig.iconUrl} color={chainConfig.color} />
            <StatChip label="Active Approvals" value={isVerifying ? "…" : activeApprovals.length.toString()} icon="🔓" color="#f97316" isLoading={isVerifying && candidates.length > 0} />
            <StatChip label="Unlimited" value={isVerifying ? "…" : unlimitedCount.toString()} icon="⚠️" color="#ef4444" isLoading={isVerifying && candidates.length > 0} />
            <StatChip label="Pairs Checked" value={candidates.length.toString()} icon="🔍" color="#a855f7" />
          </SimpleGrid>

          {/* Scan controls */}
          <Box bg="rgba(4,4,14,0.85)" backdropFilter="blur(20px)" borderRadius="2xl" border="1px solid rgba(255,255,255,0.08)" p={{ base: 4, md: 5 }} mb={6} position="relative" overflow="hidden">
            <Box position="absolute" top={0} left={0} right={0} h="1px" bgGradient="linear(90deg, transparent, rgba(239,68,68,0.5), transparent)" />
            {isScanning && (
              <Box position="absolute" left={0} right={0} h="60px" pointerEvents="none" bg="linear-gradient(180deg, transparent, rgba(239,68,68,0.08), transparent)" style={{ animation: "scanSweep 2.2s linear infinite" }} />
            )}

            {chainConfig.id === 10 && !hasCustomRpc && (
              <Box bg="rgba(251,191,36,0.08)" border="1px solid rgba(251,191,36,0.25)" borderRadius="lg" p={2.5} mb={4} position="relative">
                <Text fontSize="xs" color="#fde68a" fontFamily="'Space Grotesk', sans-serif" lineHeight="1.5">
                  ⚠ Optimism's public indexer blocks this dev preview, and free RPCs cap
                  historical queries very tightly here — coverage is limited to very recent
                  activity by default.{" "}
                  <Text as="span" color="white" fontWeight="700" cursor="pointer" onClick={() => setShowRpcSettings(true)}>
                    Add your own RPC for better coverage →
                  </Text>
                </Text>
              </Box>
            )}

            <Flex justify="space-between" align="center" wrap="wrap" gap={3} mb={isScanning ? 4 : 0} position="relative">
              <HStack spacing={2}>
                <Text fontSize="xs" color="gray.500" fontFamily="'Space Grotesk', sans-serif" fontWeight="600">
                  Scan depth:
                </Text>
                <Box title="Only used when the fast indexed search is unavailable and scanning falls back to RPC — which is why it defaults to a shorter window for speed.">
                  <InfoIcon color="gray.600" boxSize={2.5} />
                </Box>
                <Menu>
                  <MenuButton as={Button} size="sm" rightIcon={<ChevronDownIcon />} bg="rgba(255,255,255,0.04)" border="1px solid rgba(255,255,255,0.1)" color="gray.200" fontSize="xs" fontFamily="'Space Mono', monospace" _hover={{ bg: "rgba(255,255,255,0.08)" }}>
                    {SCAN_DEPTH_OPTIONS.find((o) => o.value === scanDepth)?.label}
                  </MenuButton>
                  <MenuList bg="#0a0a16" borderColor="rgba(255,255,255,0.1)">
                    {SCAN_DEPTH_OPTIONS.map((opt) => (
                      <MenuItem key={opt.value} onClick={() => setScanDepth(opt.value)} bg="transparent" color="gray.200" fontSize="xs" fontFamily="'Space Mono', monospace" _hover={{ bg: "rgba(255,255,255,0.06)" }}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </MenuList>
                </Menu>
              </HStack>

              <VStack spacing={1} align="end">
                <Button onClick={handleScan} isDisabled={!isConnected || isScanning} isLoading={isScanning} loadingText="Scanning…"
                  bgGradient="linear(135deg, #ef4444, #dc2626)" color="white" borderRadius="lg" fontWeight="700" fontSize="sm" px={6}
                  _hover={{ transform: "translateY(-2px)", boxShadow: "0 8px 24px rgba(239,68,68,0.35)" }} transition="all 0.2s">
                  🔍 Scan {chainConfig.name}
                </Button>
                {!isScanning && lastScanTimestamp && (
                  <Text fontSize="9px" color="gray.600" fontFamily="'Space Mono', monospace">
                    Last scanned {formatTimeAgo(lastScanTimestamp)}
                  </Text>
                )}
              </VStack>
            </Flex>

            {isScanning && (
              <Box position="relative">
                <Progress size="xs" borderRadius="full" bg="rgba(255,255,255,0.06)" isIndeterminate sx={{ "& > div": { bgGradient: "linear(90deg, #ef4444, #f97316)" } }} />
                <Text fontSize="10px" color="gray.500" fontFamily="'Space Mono', monospace" mt={1.5}>
                  {scanPhase || "Scanning…"}
                </Text>
              </Box>
            )}

            {!isConnected ? (
              <Text fontSize="xs" color="gray.500" fontFamily="'Space Grotesk', sans-serif" mt={3}>
                Connect your wallet, pick a chain above, then hit "Scan" — no network switch needed just to look.
              </Text>
            ) : isLoadingTokens ? (
              <HStack spacing={2} mt={3}>
                <Spinner size="xs" color="#f87171" />
                <Text fontSize="xs" color="gray.500" fontFamily="'Space Grotesk', sans-serif">
                  Loading your token history (optional, for reference)…
                </Text>
              </HStack>
            ) : tokensError ? (
              <Text fontSize="xs" color="gray.400" fontFamily="'Space Grotesk', sans-serif" mt={3}>
                (Optional token-list preview unavailable — doesn't affect scanning, which reads on-chain data directly.)
              </Text>
            ) : tokens.length > 0 ? (
              <Text fontSize="xs" color="gray.500" fontFamily="'Space Grotesk', sans-serif" mt={3}>
                {tokens.length} token{tokens.length !== 1 ? "s" : ""} seen in your wallet history on {chainConfig.name} — for reference only.
              </Text>
            ) : null}

            <Box mt={4} pt={4} borderTop="1px solid rgba(255,255,255,0.06)">
              <HStack as="button" onClick={() => setShowRpcSettings((v) => !v)} spacing={1.5} color="gray.500" _hover={{ color: "gray.300" }} fontSize="10px" fontFamily="'Space Mono', monospace" textTransform="uppercase" letterSpacing="0.1em">
                <ChevronDownIcon boxSize={3} transform={showRpcSettings ? "rotate(180deg)" : "none"} transition="transform 0.2s" />
                <Text>Use your own RPC for {chainConfig.name}</Text>
                {hasCustomRpc && (
                  <Badge bg="rgba(74,222,128,0.12)" color="#4ade80" fontSize="9px" px={1.5} borderRadius="full" border="1px solid rgba(74,222,128,0.25)">
                    ● active
                  </Badge>
                )}
              </HStack>
              {showRpcSettings && (
                <Box mt={3}>
                  <Text fontSize="xs" color="gray.300" fontFamily="'Space Grotesk', sans-serif" mb={2} lineHeight="1.6">
                    Getting rate-limited or archive-access errors? A free personal endpoint from{" "}
                    <Link href="https://www.alchemy.com/" isExternal color="#fbbf24" fontWeight="600" _hover={{ color: "white" }}>
                      Alchemy
                    </Link>{" "}
                    or{" "}
                    <Link href="https://www.infura.io/" isExternal color="#fbbf24" fontWeight="600" _hover={{ color: "white" }}>
                      Infura
                    </Link>{" "}
                    scans {chainConfig.name} much faster. Used only from your browser for reading —
                    never for signing — and{" "}
                    <Text as="span" color="white" fontWeight="700">
                      never saved: it's cleared the moment you refresh this page.
                    </Text>
                  </Text>
                  {hasCustomRpc ? (
                    <HStack spacing={2}>
                      <Badge bg="rgba(255,255,255,0.05)" color="gray.300" fontSize="10px" px={2} py={1} borderRadius="full" fontFamily="'Space Mono', monospace" maxW="320px" noOfLines={1}>
                        {customRpcUrls[selectedChainId]}
                      </Badge>
                      <Button size="xs" onClick={clearCustomRpcForChain} variant="ghost" color="gray.500" _hover={{ color: "#f87171" }}>
                        Remove
                      </Button>
                    </HStack>
                  ) : (
                    <InputGroup size="sm" maxW="460px">
                      <Input
                        placeholder={`https://... RPC URL for ${chainConfig.name}`}
                        value={customRpcInput}
                        onChange={(e) => setCustomRpcInput(e.target.value)}
                        bg="rgba(255,255,255,0.03)"
                        border="1px solid rgba(255,255,255,0.1)"
                        color="gray.200"
                        fontFamily="'Space Mono', monospace"
                        fontSize="xs"
                        _placeholder={{ color: "gray.600" }}
                      />
                      <InputRightElement w="auto" pr={1}>
                        <Button size="xs" onClick={saveCustomRpcForChain} bg="rgba(239,68,68,0.15)" color="#fca5a5" _hover={{ bg: "rgba(239,68,68,0.25)" }}>
                          Save
                        </Button>
                      </InputRightElement>
                    </InputGroup>
                  )}
                </Box>
              )}
            </Box>

            <Box mt={4} pt={4} borderTop="1px solid rgba(255,255,255,0.06)">
              <HStack as="button" onClick={() => setShowManualCheck((v) => !v)} spacing={1.5} color="gray.500" _hover={{ color: "gray.300" }} fontSize="10px" fontFamily="'Space Mono', monospace" textTransform="uppercase" letterSpacing="0.1em">
                <ChevronDownIcon boxSize={3} transform={showManualCheck ? "rotate(180deg)" : "none"} transition="transform 0.2s" />
                <Text>Advanced: check a specific token manually</Text>
                {manualTokens.length > 0 && (
                  <Badge bg="rgba(255,255,255,0.08)" color="gray.400" fontSize="9px" px={1.5} borderRadius="full">
                    {manualTokens.length}
                  </Badge>
                )}
              </HStack>
              {showManualCheck && (
                <Box mt={3}>
                  <Text fontSize="10px" color="gray.400" fontFamily="'Space Grotesk', sans-serif" mb={2}>
                    The broad scan above already covers every token on {chainConfig.name} — this just adds a full-history check for one you want to be extra sure about.
                  </Text>
                  <InputGroup size="sm" maxW="420px">
                    <Input placeholder="0x… token contract address" value={manualTokenInput} onChange={(e) => setManualTokenInput(e.target.value)}
                      bg="rgba(255,255,255,0.03)" border="1px solid rgba(255,255,255,0.1)" color="gray.200" fontFamily="'Space Mono', monospace" fontSize="xs" _placeholder={{ color: "gray.600" }} />
                    <InputRightElement w="auto" pr={1}>
                      <Button size="xs" onClick={addManualToken} bg="rgba(239,68,68,0.15)" color="#fca5a5" _hover={{ bg: "rgba(239,68,68,0.25)" }}>
                        Add
                      </Button>
                    </InputRightElement>
                  </InputGroup>
                  {manualTokens.length > 0 && (
                    <HStack spacing={2} mt={2} flexWrap="wrap">
                      {manualTokens.map((addr) => (
                        <Badge key={addr} bg="rgba(255,255,255,0.05)" color="gray.300" fontSize="10px" px={2} py={1} borderRadius="full" fontFamily="'Space Mono', monospace" display="flex" alignItems="center" gap={1.5}>
                          {truncateAddr(addr)}
                          <Box as="button" onClick={() => setManualTokens((prev) => prev.filter((a) => a !== addr))} color="gray.500" _hover={{ color: "#f87171" }} fontSize="11px" lineHeight={1} aria-label="Remove">
                            ✕
                          </Box>
                        </Badge>
                      ))}
                    </HStack>
                  )}
                </Box>
              )}
            </Box>
          </Box>

          {/* Results */}
          {scanError && (
            <Box bg="rgba(239,68,68,0.06)" border="1px solid rgba(239,68,68,0.2)" borderRadius="xl" p={4} mb={5}>
              <Text fontSize="sm" color="#f87171" fontFamily="'Space Grotesk', sans-serif">
                {scanError}
              </Text>
            </Box>
          )}

          {scanWarnings.length > 0 && (
            <Box bg="rgba(251,191,36,0.06)" border="1px solid rgba(251,191,36,0.2)" borderRadius="xl" p={4} mb={5}>
              <VStack align="start" spacing={2}>
                {scanWarnings.map((w, i) => (
                  <Text key={i} fontSize="xs" color="#fbbf24" fontFamily="'Space Grotesk', sans-serif">
                    ⚠ {w}
                  </Text>
                ))}
                {scanWarnings.some((w) => /rpc|rate|paid plan/i.test(w)) && !hasCustomRpc && (
                  <Button
                    size="xs"
                    onClick={() => setShowRpcSettings(true)}
                    bg="rgba(251,191,36,0.12)"
                    color="#fbbf24"
                    border="1px solid rgba(251,191,36,0.3)"
                    borderRadius="full"
                    fontWeight="700"
                    _hover={{ bg: "rgba(251,191,36,0.2)" }}
                  >
                    Use your own RPC →
                  </Button>
                )}
              </VStack>
            </Box>
          )}

          {candidates.length > 0 && (
            <Box>
              <Flex justify="space-between" align="center" mb={4} wrap="wrap" gap={3}>
                <HStack spacing={3} wrap="wrap">
                  {!isVerifying && activeApprovals.length > 0 && (
                    <Checkbox
                      isChecked={selectedKeys.size > 0 && selectedKeys.size === activeApprovals.length}
                      isIndeterminate={selectedKeys.size > 0 && selectedKeys.size < activeApprovals.length}
                      onChange={toggleSelectAll}
                      colorScheme="red"
                      aria-label="Select all approvals"
                    />
                  )}
                  <Heading size="sm" color="white" fontFamily="'Space Grotesk', sans-serif">
                    {isVerifying ? "Verifying…" : `${activeApprovals.length} active approval${activeApprovals.length !== 1 ? "s" : ""} on ${chainConfig.name}`}
                  </Heading>
                  {unlimitedCount > 0 && (
                    <Badge bg="rgba(239,68,68,0.12)" color="#f87171" fontSize="10px" px={2.5} py={1} borderRadius="full" border="1px solid rgba(239,68,68,0.3)" fontFamily="'Space Mono', monospace">
                      ⚠ {unlimitedCount} unlimited
                    </Badge>
                  )}
                  {!isVerifying && failedVerificationCount > 0 && (
                    <Badge bg="rgba(251,191,36,0.1)" color="#fbbf24" fontSize="10px" px={2.5} py={1} borderRadius="full" border="1px solid rgba(251,191,36,0.25)" fontFamily="'Space Mono', monospace"
                      title="Usually non-standard token contracts that don't implement allowance() as expected.">
                      ⚠ {failedVerificationCount} couldn't be verified
                    </Badge>
                  )}
                </HStack>
                {selectedKeys.size > 0 && (
                  <Button size="sm" onClick={revokeSelected} isLoading={revokingKey !== null} bg="rgba(239,68,68,0.15)" color="#fca5a5" border="1px solid rgba(239,68,68,0.35)" borderRadius="lg" fontWeight="700" fontSize="xs" _hover={{ bg: "rgba(239,68,68,0.25)" }}>
                    Revoke Selected ({selectedKeys.size})
                  </Button>
                )}
              </Flex>

              {isVerifying ? (
                <VStack spacing={2.5} align="stretch">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} height="64px" borderRadius="14px" startColor="rgba(255,255,255,0.03)" endColor="rgba(255,255,255,0.08)" />
                  ))}
                </VStack>
              ) : activeApprovals.length === 0 ? (
                <Box textAlign="center" py={14} bg="rgba(4,4,14,0.5)" borderRadius="2xl" border="1px solid rgba(255,255,255,0.05)">
                  <CheckCircleIcon color="#4ade80" boxSize={8} mb={3} />
                  <Text fontSize="md" color="white" fontWeight="700" fontFamily="'Space Grotesk', sans-serif">
                    No active approvals found on {chainConfig.name} 🎉
                  </Text>
                  <Text fontSize="sm" color="gray.500" fontFamily="'Space Grotesk', sans-serif" mt={1}>
                    Your wallet looks clean for the scanned period.
                  </Text>
                </Box>
              ) : (
                <VStack spacing={2.5} align="stretch">
                  {activeApprovals.map((row) => (
                    <ApprovalRowItem
                      key={row.key}
                      row={row}
                      isSelected={selectedKeys.has(row.key)}
                      onToggleSelect={() => toggleSelect(row.key)}
                      onRevoke={() => revokeOne(row)}
                      isRevoking={revokingKey === row.key}
                      knownSpenders={knownSpenders}
                      explorerAddressUrl={chainConfig.explorerAddressUrl}
                      explorerTokenUrl={chainConfig.explorerTokenUrl}
                    />
                  ))}
                </VStack>
              )}
            </Box>
          )}

          {/* Security explainer */}
          <Box mt={10} bg="rgba(4,4,14,0.85)" backdropFilter="blur(20px)" borderRadius="2xl" border="1px solid rgba(239,68,68,0.15)" p={{ base: 5, md: 6 }} position="relative" overflow="hidden">
            <Box position="absolute" top={0} left={0} right={0} h="2px" bgGradient="linear(90deg, #ef4444, #f97316, #a855f7, #ef4444)" backgroundSize="300% 100%" style={{ animation: "shimmerBorder 5s infinite" }} />
            <HStack spacing={3} mb={4}>
              <Flex w="30px" h="30px" align="center" justify="center" bg="rgba(239,68,68,0.1)" border="1px solid rgba(239,68,68,0.2)" borderRadius="lg">
                <InfoIcon color="#f87171" boxSize={3.5} />
              </Flex>
              <Box>
                <Heading size="sm" color="white" fontWeight="700" fontFamily="'Space Grotesk', sans-serif">
                  How this works — and why it's safe to use
                </Heading>
                <Text fontSize="xs" color="gray.500" fontFamily="'Space Grotesk', sans-serif">
                  No backend, no custody, no signed messages beyond the revoke transaction itself
                </Text>
              </Box>
            </HStack>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
              {[
                { title: "1. Discover", desc: "We search on-chain Approval events for your wallet on the selected chain — nothing is guessed, nothing needs an upfront token list.", color: "#f87171" },
                { title: "2. Verify", desc: "Every finding is double-checked against the token's live contract state via multicall — never just historical logs, which can be stale.", color: "#f97316" },
                { title: "3. Revoke", desc: "One click sets the allowance to zero (or disables the operator) — a normal transaction you review and sign yourself, in your own wallet.", color: "#a855f7" },
              ].map((s) => (
                <Box key={s.title} p={4} bg="rgba(255,255,255,0.02)" borderRadius="xl" border="1px solid rgba(255,255,255,0.05)">
                  <Text fontSize="xs" fontWeight="700" color={s.color} fontFamily="'Space Mono', monospace" mb={1}>
                    {s.title}
                  </Text>
                  <Text fontSize="xs" color="gray.400" lineHeight="1.6" fontFamily="'Space Grotesk', sans-serif">
                    {s.desc}
                  </Text>
                </Box>
              ))}
            </SimpleGrid>
          </Box>

          <Footer />
        </Container>

        {/* Donation modal */}
        <Modal isOpen={isDonateOpen} onClose={onDonateClose} isCentered size="md">
          <ModalOverlay bg="rgba(0,0,0,0.7)" backdropFilter="blur(4px)" />
          <ModalContent bg="#0a0710" border="1px solid rgba(168,85,247,0.25)" borderRadius="2xl" mx={4} position="relative" overflow="hidden">
            <Box position="absolute" top={0} left={0} right={0} h="2px" bgGradient="linear(90deg, #a855f7, #d946ef, #a855f7)" backgroundSize="200% 100%" style={{ animation: "shimmerBorder 5s infinite" }} />
            <ModalHeader fontFamily="'Space Grotesk', sans-serif" color="white">
              <HStack spacing={2}>
                <Text fontSize="lg">💜</Text>
                <Text>Support this project</Text>
              </HStack>
              <Text fontSize="xs" color="gray.400" fontWeight="400" mt={1}>
                Optional — pick a chain, choose an amount, done. Funds go straight to the project treasury, never held in the contract.
              </Text>
            </ModalHeader>
            <ModalCloseButton color="gray.400" />
            <ModalBody>
              <VStack spacing={4} align="stretch">
                <Box>
                  <Text fontSize="xs" color="gray.400" fontFamily="'Space Grotesk', sans-serif" fontWeight="600" mb={2}>
                    Donate on
                  </Text>
                  <HStack spacing={2} flexWrap="wrap">
                    {REVOKE_CHAINS.map((c) => {
                      const isActive = c.id === donateChainId;
                      return (
                        <Button
                          key={c.id}
                          onClick={() => setDonateChainId(c.id)}
                          size="sm"
                          variant="unstyled"
                          display="flex"
                          alignItems="center"
                          gap={1.5}
                          px={3}
                          h="32px"
                          borderRadius="full"
                          bg={isActive ? `${c.color}20` : "rgba(255,255,255,0.03)"}
                          border="1px solid"
                          borderColor={isActive ? `${c.color}70` : "rgba(255,255,255,0.08)"}
                          _hover={{ borderColor: `${c.color}50` }}
                        >
                          <Image src={c.iconUrl} alt={c.name} boxSize="16px" borderRadius="full" fallbackSrc={ICON_FALLBACK} />
                          <Text fontSize="xs" fontWeight="700" color={isActive ? "white" : "gray.400"} fontFamily="'Space Grotesk', sans-serif">
                            {c.name}
                          </Text>
                        </Button>
                      );
                    })}
                  </HStack>
                </Box>

                <Box>
                  <Text fontSize="xs" color="gray.400" fontFamily="'Space Grotesk', sans-serif" fontWeight="600" mb={2}>
                    Amount (ETH)
                  </Text>
                  <HStack spacing={2} mb={2} flexWrap="wrap">
                    {["0.0001", "0.0005", "0.001", "0.005", "0.01"].map((preset) => (
                      <Button
                        key={preset}
                        size="xs"
                        onClick={() => setDonateAmount(preset)}
                        bg={donateAmount === preset ? "rgba(168,85,247,0.25)" : "rgba(255,255,255,0.04)"}
                        color={donateAmount === preset ? "white" : "gray.400"}
                        border="1px solid"
                        borderColor={donateAmount === preset ? "rgba(168,85,247,0.5)" : "rgba(255,255,255,0.08)"}
                        borderRadius="full"
                        fontFamily="'Space Mono', monospace"
                        _hover={{ bg: "rgba(168,85,247,0.18)" }}
                      >
                        {preset}
                      </Button>
                    ))}
                  </HStack>
                  <InputGroup>
                    <Input
                      type="number"
                      min="0"
                      step="0.0001"
                      value={donateAmount}
                      onChange={(e) => setDonateAmount(e.target.value)}
                      bg="rgba(255,255,255,0.04)"
                      border="1px solid rgba(255,255,255,0.12)"
                      color="white"
                      fontFamily="'Space Mono', monospace"
                      _focus={{ borderColor: "#a855f7" }}
                    />
                    <InputRightElement w="auto" pr={3}>
                      <Text fontSize="xs" color="gray.500" fontFamily="'Space Mono', monospace">
                        ETH
                      </Text>
                    </InputRightElement>
                  </InputGroup>
                </Box>

                <Box>
                  <Text fontSize="xs" color="gray.400" fontFamily="'Space Grotesk', sans-serif" fontWeight="600" mb={2}>
                    Message (optional)
                  </Text>
                  <Textarea
                    value={donateMessage}
                    onChange={(e) => setDonateMessage(e.target.value.slice(0, 140))}
                    placeholder="gm! keep building 🚀"
                    bg="rgba(255,255,255,0.04)"
                    border="1px solid rgba(255,255,255,0.12)"
                    color="white"
                    fontSize="sm"
                    rows={2}
                    resize="none"
                    _focus={{ borderColor: "#a855f7" }}
                  />
                  <Text fontSize="10px" color="gray.600" fontFamily="'Space Mono', monospace" textAlign="right" mt={1}>
                    {donateMessage.length}/140
                  </Text>
                </Box>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button
                onClick={handleDonate}
                isDisabled={!isConnected || isDonating}
                isLoading={isDonating}
                loadingText="Sending…"
                w="full"
                bgGradient="linear(135deg, #a855f7, #d946ef)"
                color="white"
                borderRadius="lg"
                fontWeight="700"
                _hover={{ transform: "translateY(-1px)", boxShadow: "0 8px 20px rgba(168,85,247,0.4)" }}
                transition="all 0.2s"
              >
                {isConnected ? `Donate ${donateAmount || "0"} ETH on ${donateChainConfig.name}` : "Connect wallet to donate"}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Box>
    </>
  );
}

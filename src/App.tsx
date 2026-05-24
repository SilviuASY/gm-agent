import {
  Box,
  Button,
  Center,
  Container,
  Flex,
  Grid,
  GridItem,
  Heading,
  HStack,
  Text,
  VStack,
  Badge,
  SimpleGrid,
  Tooltip,
  Skeleton,
  Progress,
} from "@chakra-ui/react";

import { keyframes } from "@emotion/react";
import { ConnectButton } from "@rainbow-me/rainbowkit";

import {
  useAccount,
  useChainId,
  useSwitchChain,
  useReadContract,
  useWriteContract,
  usePublicClient,
} from "wagmi";

import { useEffect, useState, useMemo, useRef } from "react";
import confetti from "canvas-confetti";
import { useNavigate } from "react-router-dom";

import {
  soneiumChain as soneium,
  inkChain as ink,
  optimismChain as optimism,
  baseChain as base,
  unichainChain as unichain,
} from "./wagmi";

import TransactionModal from "./components/TransactionModal";

// ================= CONTRACT ADDRESSES =================
const CONTRACTS = {
  soneium: {
    identityRegistry: "0x29c4632A1710BC58cE8D9d46Ec227fc569f58bF1" as const,
    dailyGM: "0xb19922c27C86cc08dc4f0f3Cb4e76c30494c22dc" as const,
    chainId: 1868,
  },
  ink: {
    identityRegistry: "0xd7a368Fd63207A4519BF6636fd6b1246A63C1eF3" as const,
    dailyGM: "0x7dFb097b47e2D52ef9864d7a1d2A92B135B94515" as const,
    chainId: 57073,
  },
  optimism: {
    identityRegistry: "0xbff60bfbb9c327619e1d955ae2f9c31bc719db8b" as const,
    dailyGM: "0xd18acf5e068527a2e47be761b4eab2e9e2f1b01c" as const,
    chainId: 10,
  },
  base: {
    identityRegistry: "0x7a5e06310e9f77d4f302b858a88906f74c22bf78" as const,
    dailyGM: "0x92d2b6cfc723d485b9f58484296e32963a472710" as const,
    chainId: 8453,
  },
  unichain: {
    identityRegistry: "0x81729754038058742b8fcc5792e6bd8612b504c1" as const,
    dailyGM: "0xfde59299612a1cb07e0e6b5346e2f4ca031b42e0" as const,
    chainId: 130,
  },
} as const;

const FIXED_AGENT_URI = "ipfs://bafkreif4dxsg7gm3j62rtypslhjrpwu3gdmjwtft5qp2xxy7yx7s24nzvu";
const COOLDOWN_SECONDS = 86400;

// ================= ABIs =================
const IDENTITY_REGISTRY_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "sender",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "ERC721IncorrectOwner",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "operator",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "ERC721InsufficientApproval",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "approver",
        "type": "address"
      }
    ],
    "name": "ERC721InvalidApprover",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "operator",
        "type": "address"
      }
    ],
    "name": "ERC721InvalidOperator",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "ERC721InvalidOwner",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "receiver",
        "type": "address"
      }
    ],
    "name": "ERC721InvalidReceiver",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "sender",
        "type": "address"
      }
    ],
    "name": "ERC721InvalidSender",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "ERC721NonexistentToken",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidInitialization",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "NotInitializing",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "OwnableInvalidOwner",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "OwnableUnauthorizedAccount",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "approved",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "Approval",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "operator",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "approved",
        "type": "bool"
      }
    ],
    "name": "ApprovalForAll",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "_fromTokenId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "_toTokenId",
        "type": "uint256"
      }
    ],
    "name": "BatchMetadataUpdate",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "fee",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "treasury",
        "type": "address"
      }
    ],
    "name": "ConfigSet",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [],
    "name": "EIP712DomainChanged",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint64",
        "name": "version",
        "type": "uint64"
      }
    ],
    "name": "Initialized",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "agentId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "string",
        "name": "indexedMetadataKey",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "metadataKey",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "bytes",
        "name": "metadataValue",
        "type": "bytes"
      }
    ],
    "name": "MetadataSet",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "_tokenId",
        "type": "uint256"
      }
    ],
    "name": "MetadataUpdate",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "previousOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "Paused",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "agentId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "agentURI",
        "type": "string"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "Registered",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "Transfer",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "agentId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "newURI",
        "type": "string"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "updatedBy",
        "type": "address"
      }
    ],
    "name": "URIUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "Unpaused",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "approve",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "balanceOf",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "eip712Domain",
    "outputs": [
      {
        "internalType": "bytes1",
        "name": "fields",
        "type": "bytes1"
      },
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "version",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "chainId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "verifyingContract",
        "type": "address"
      },
      {
        "internalType": "bytes32",
        "name": "salt",
        "type": "bytes32"
      },
      {
        "internalType": "uint256[]",
        "name": "extensions",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "wallet",
        "type": "address"
      }
    ],
    "name": "getAgentId",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "agentId",
        "type": "uint256"
      }
    ],
    "name": "getAgentWallet",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "getApproved",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getConfig",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "fee",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "treasury",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "agentId",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "metadataKey",
        "type": "string"
      }
    ],
    "name": "getMetadata",
    "outputs": [
      {
        "internalType": "bytes",
        "name": "",
        "type": "bytes"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getVersion",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "initialize",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "wallet",
        "type": "address"
      }
    ],
    "name": "isAgent",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "operator",
        "type": "address"
      }
    ],
    "name": "isApprovedForAll",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "name",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "ownerOf",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "pause",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "paused",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "register",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "agentURI",
        "type": "string"
      },
      {
        "components": [
          {
            "internalType": "string",
            "name": "metadataKey",
            "type": "string"
          },
          {
            "internalType": "bytes",
            "name": "metadataValue",
            "type": "bytes"
          }
        ],
        "internalType": "struct IdentityRegistry.MetadataEntry[]",
        "name": "metadata",
        "type": "tuple[]"
      }
    ],
    "name": "register",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "agentURI",
        "type": "string"
      }
    ],
    "name": "register",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "renounceOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "safeTransferFrom",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      },
      {
        "internalType": "bytes",
        "name": "data",
        "type": "bytes"
      }
    ],
    "name": "safeTransferFrom",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "agentId",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "newURI",
        "type": "string"
      }
    ],
    "name": "setAgentURI",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "agentId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "newWallet",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "deadline",
        "type": "uint256"
      },
      {
        "internalType": "bytes",
        "name": "signature",
        "type": "bytes"
      }
    ],
    "name": "setAgentWallet",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "operator",
        "type": "address"
      },
      {
        "internalType": "bool",
        "name": "approved",
        "type": "bool"
      }
    ],
    "name": "setApprovalForAll",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "fee",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "treasury",
        "type": "address"
      }
    ],
    "name": "setConfig",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "agentId",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "metadataKey",
        "type": "string"
      },
      {
        "internalType": "bytes",
        "name": "metadataValue",
        "type": "bytes"
      }
    ],
    "name": "setMetadata",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes4",
        "name": "interfaceId",
        "type": "bytes4"
      }
    ],
    "name": "supportsInterface",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "tokenURI",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "transferFrom",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "unpause",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "agentId",
        "type": "uint256"
      }
    ],
    "name": "unsetAgentWallet",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

const DAILY_AGENT_GM_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_identityRegistry",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "recipient",
        "type": "address"
      }
    ],
    "name": "AgentRecipientRequired",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "DailyLimitActive",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "EnforcedPause",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ExpectedPause",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "IncorrectGMFee",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidIdentityRegistry",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "OwnableInvalidOwner",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "OwnableUnauthorizedAccount",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ReentrancyGuardReentrantCall",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "SelfRecipient",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "TreasuryNotConfigured",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "treasury",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "gmFee",
        "type": "uint256"
      }
    ],
    "name": "ConfigUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "recipient",
        "type": "address"
      }
    ],
    "name": "GM",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "oldRegistry",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newRegistry",
        "type": "address"
      }
    ],
    "name": "IdentityRegistryUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "previousOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "Paused",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "newPulseCards",
        "type": "address"
      }
    ],
    "name": "PulseCardsUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "Unpaused",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "currentStreak",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "gm",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "gmFee",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "recipient",
        "type": "address"
      }
    ],
    "name": "gmTo",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "identityRegistry",
    "outputs": [
      {
        "internalType": "contract IIdentityRegistry",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "isAgent",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "isPulseCardsHolder",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "lastGM",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "lastGM",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "pause",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "paused",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "pulseCards",
    "outputs": [
      {
        "internalType": "contract IERC721",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "renounceOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_treasury",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "_gmFee",
        "type": "uint256"
      }
    ],
    "name": "setConfig",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newRegistry",
        "type": "address"
      }
    ],
    "name": "setIdentityRegistry",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_pulseCards",
        "type": "address"
      }
    ],
    "name": "setPulseCards",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalGM",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "treasury",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "unpause",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

// ================= ENHANCED ANIMATIONS =================
const float = keyframes`
  0% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(2deg); }
  100% { transform: translateY(0px) rotate(0deg); }
`;

const floatSlow = keyframes`
  0% { transform: translateY(0px) translateX(0px); }
  33% { transform: translateY(-15px) translateX(10px); }
  66% { transform: translateY(10px) translateX(-10px); }
  100% { transform: translateY(0px) translateX(0px); }
`;

const pulseGlow = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.6); opacity: 0.8; }
  50% { box-shadow: 0 0 0 25px rgba(139, 92, 246, 0); opacity: 1; }
  100% { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0); opacity: 0.8; }
`;

const pulseGreen = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.6); }
  70% { box-shadow: 0 0 0 20px rgba(74, 222, 128, 0); }
  100% { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0); }
`;

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const glowPulse = keyframes`
  0% { filter: brightness(1); }
  50% { filter: brightness(1.2); }
  100% { filter: brightness(1); }
`;

const slideUp = keyframes`
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
`;

const slideInLeft = keyframes`
  from { opacity: 0; transform: translateX(-30px); }
  to { opacity: 1; transform: translateX(0); }
`;

const slideInRight = keyframes`
  from { opacity: 0; transform: translateX(30px); }
  to { opacity: 1; transform: translateX(0); }
`;

const rotateBorder = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

// Helper to get chain key from chainId
const getChainKeyFromId = (chainId: number): keyof typeof CONTRACTS | null => {
  for (const [key, config] of Object.entries(CONTRACTS)) {
    if (config.chainId === chainId) {
      return key as keyof typeof CONTRACTS;
    }
  }
  return null;
};

// Helper to get chain config from chainId
const getChainConfigFromId = (chainId: number) => {
  switch (chainId) {
    case 1868: return soneium;
    case 57073: return ink;
    case 10: return optimism;
    case 8453: return base;
    case 130: return unichain;
    default: return soneium;
  }
};

// Helper to get URL parameter
const getUrlParam = (param: string): string | null => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
};

// Helper to clean URL (remove chainId parameter without page reload)
const cleanUrl = () => {
  const url = new URL(window.location.href);
  url.searchParams.delete('chainId');
  window.history.replaceState({}, '', url.toString());
};

export default function App() {
  const { address, isConnected, status: accountStatus } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: switching } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const navigate = useNavigate();

  // Track if initial chain from URL has been applied
  const hasAppliedInitialChain = useRef(false);
  const hasCleanedUrl = useRef(false);
  const isSwitchingRef = useRef(false);
  
  // State for selected chain (can be changed by user via Wagmi selector)
  const [selectedChainKey, setSelectedChainKey] = useState<keyof typeof CONTRACTS>("soneium");

  // Store the requested chain ID from URL
  const requestedChainIdRef = useRef<number | null>(null);

  // INITIAL LOAD: Read chainId from URL parameter
  useEffect(() => {
    if (hasAppliedInitialChain.current) return;
    
    const urlChainIdParam = getUrlParam("chainId");
    
    if (urlChainIdParam) {
      const parsedChainId = parseInt(urlChainIdParam, 10);
      if (!isNaN(parsedChainId)) {
        const chainKey = getChainKeyFromId(parsedChainId);
        if (chainKey && CONTRACTS[chainKey]) {
          requestedChainIdRef.current = parsedChainId;
          // Set the selected chain key immediately for UI display
          setSelectedChainKey(chainKey);
          hasAppliedInitialChain.current = true;
        }
      }
    }
  }, []);

  // Handle chain switching when wallet is ready and we have a requested chain
  useEffect(() => {
    // Don't proceed if no requested chain or already switching
    if (!requestedChainIdRef.current || isSwitchingRef.current) return;
    
    const requestedChainId = requestedChainIdRef.current;
    
    // If wallet is connected and the current chain is not the requested one, switch
    if (isConnected && accountStatus === "connected" && chainId !== requestedChainId) {
      isSwitchingRef.current = true;
      const targetChain = getChainConfigFromId(requestedChainId);
      switchChain?.({ chainId: targetChain.id }, {
        onSuccess: () => {
          isSwitchingRef.current = false;
        },
        onError: () => {
          isSwitchingRef.current = false;
        }
      });
    }
  }, [isConnected, accountStatus, chainId, switchChain]);

  // Clean URL after initial chain switch is complete or if no switch was needed
  useEffect(() => {
    // Wait for either:
    // 1. No requested chain (nothing to clean)
    // 2. Already cleaned
    // 3. Wallet is connected and chain matches requested OR no switch needed
    if (hasCleanedUrl.current) return;
    
    if (!requestedChainIdRef.current) {
      // No chain requested, nothing to clean
      hasCleanedUrl.current = true;
      return;
    }
    
    const requestedChainId = requestedChainIdRef.current;
    
    // If wallet is not connected, we can still clean the URL after a short delay
    if (!isConnected) {
      const timer = setTimeout(() => {
        if (!hasCleanedUrl.current) {
          hasCleanedUrl.current = true;
          cleanUrl();
          requestedChainIdRef.current = null;
        }
      }, 500);
      return () => clearTimeout(timer);
    }
    
    // Wallet is connected, check if we're on the right chain
    if (chainId === requestedChainId) {
      if (!hasCleanedUrl.current) {
        hasCleanedUrl.current = true;
        cleanUrl();
        requestedChainIdRef.current = null;
      }
    } else if (!isSwitchingRef.current && chainId !== requestedChainId) {
      const timer = setTimeout(() => {
        if (!hasCleanedUrl.current) {
          hasCleanedUrl.current = true;
          cleanUrl();
          requestedChainIdRef.current = null;
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [chainId, isConnected, accountStatus]);

  // 🔄 SYNCRONIZE: Update selectedChainKey when chainId changes from wallet
  useEffect(() => {
    if (chainId) {
      const currentChain = getChainKeyFromId(chainId);
      if (currentChain && currentChain !== selectedChainKey) {
        console.log(`🔄 Chain changed to: ${currentChain} (ID: ${chainId})`);
        setSelectedChainKey(currentChain);
      }
    }
  }, [chainId]);

  // Update selected chain when user changes network via Wagmi (after initial load)
  useEffect(() => {
    if (!hasAppliedInitialChain.current) return;
    
    if (chainId) {
      const currentChain = getChainKeyFromId(chainId);
      if (currentChain && currentChain !== selectedChainKey) {
        setSelectedChainKey(currentChain);
      }
    }
  }, [chainId, selectedChainKey]);

  // === Target Chain ===
  const targetChain = useMemo(() => {
    switch (selectedChainKey) {
      case "ink": return ink;
      case "optimism": return optimism;
      case "base": return base;
      case "unichain": return unichain;
      default: return soneium;
    }
  }, [selectedChainKey]);

  const targetChainId = targetChain.id;
  const currentChainName = targetChain.name || "Soneium";

  const isCorrectChain = chainId === targetChainId;

  const { identityRegistry: currentIdentityRegistry, dailyGM: currentDailyGM } = CONTRACTS[selectedChainKey];

  const safeAddress = address ?? undefined;
  const enabled = !!safeAddress && isConnected && isCorrectChain;

  const [isTxPending, setIsTxPending] = useState(false);
  const [hoverEffect, setHoverEffect] = useState<string | null>(null);

  // ================= READ CONTRACTS =================
  const { data: isRegistered = false, refetch: refetchRegistered, isLoading: loadingRegistered } = useReadContract({
    address: currentIdentityRegistry,
    abi: IDENTITY_REGISTRY_ABI,
    functionName: "isAgent",
    args: safeAddress ? [safeAddress] : undefined,
    query: { enabled },
  });

  const { data: agentId = 0n, refetch: refetchAgentId } = useReadContract({
    address: currentIdentityRegistry,
    abi: IDENTITY_REGISTRY_ABI,
    functionName: "getAgentId",
    args: safeAddress ? [safeAddress] : undefined,
    query: { enabled },
  });

  const { data: lastGMTime = 0n, refetch: refetchLastGM } = useReadContract({
    address: currentDailyGM,
    abi: DAILY_AGENT_GM_ABI,
    functionName: "lastGM",
    args: safeAddress ? [safeAddress] : undefined,
    query: { enabled: enabled && isRegistered },
  });

  const { data: totalAgents = 0n, refetch: refetchTotalAgents } = useReadContract({
    address: currentIdentityRegistry,
    abi: IDENTITY_REGISTRY_ABI,
    functionName: "totalSupply",
    query: { enabled: isCorrectChain },
  });

  const { data: totalGM = 0n, refetch: refetchTotalGM } = useReadContract({
    address: currentDailyGM,
    abi: DAILY_AGENT_GM_ABI,
    functionName: "totalGM",
    query: { enabled: isCorrectChain },
  });

  const { data: userStreak = 0n } = useReadContract({
    address: currentDailyGM,
    abi: DAILY_AGENT_GM_ABI,
    functionName: "currentStreak",
    args: safeAddress ? [safeAddress] : undefined,
    query: { enabled: enabled && isRegistered },
  });

  const { data: registerConfig } = useReadContract({
    address: currentIdentityRegistry,
    abi: IDENTITY_REGISTRY_ABI,
    functionName: "getConfig",
    query: { enabled: isCorrectChain },
  });

  const registrationFee = registerConfig ? (registerConfig as [bigint, `0x${string}`])[0] : 0n;

  const { data: gmFeeAmount = 0n } = useReadContract({
    address: currentDailyGM,
    abi: DAILY_AGENT_GM_ABI,
    functionName: "gmFee",
    query: { enabled: isCorrectChain && isRegistered },
  });

  // ================= TIMER =================
  const [timeLeft, setTimeLeft] = useState("–");
  const [cooldownReady, setCooldownReady] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);

  useEffect(() => {
    if (!enabled || !isRegistered) {
      setTimeLeft("–");
      setCooldownReady(false);
      setProgressPercent(0);
      return;
    }

    const updateTimer = () => {
      const now = Math.floor(Date.now() / 1000);
      const lastGM = Number(lastGMTime);
      const diff = lastGM + COOLDOWN_SECONDS - now;
      
      const elapsed = now - lastGM;
      const progress = Math.min(100, Math.max(0, (elapsed / COOLDOWN_SECONDS) * 100));
      setProgressPercent(progress);

      if (diff <= 0) {
        setCooldownReady(true);
        setTimeLeft("Ready!");
      } else {
        setCooldownReady(false);
        const h = Math.floor(diff / 3600);
        const m = Math.floor((diff % 3600) / 60);
        const s = diff % 60;
        
        if (h > 0) {
          setTimeLeft(`${h}h ${m}m ${s}s`);
        } else if (m > 0) {
          setTimeLeft(`${m}m ${s}s`);
        } else {
          setTimeLeft(`${s}s`);
        }
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [lastGMTime, enabled, isRegistered]);

  const canSendGM = isRegistered && cooldownReady;

// ================= TRANSACTION =================
const [txOpen, setTxOpen] = useState(false);
const [txStatus, setTxStatus] = useState<"idle" | "wallet" | "pending" | "success" | "rejected" | "failed">("idle");
const [txTitle, setTxTitle] = useState("");
const [txDesc, setTxDesc] = useState("");

const handleAction = async (type: "register" | "gm") => {
  if (isTxPending) return;

  setIsTxPending(true);
  setTxOpen(true);
  setTxStatus("wallet");
  setTxTitle(type === "register" ? "⚡ Confirm Registration" : "💬 Confirm GM");
  setTxDesc(type === "register" ? `Registering as ERC-8004 Agent on ${currentChainName}...` : `Sending daily GM on ${currentChainName}...`);

  try {
    let hash: `0x${string}`;

    if (type === "register") {
      hash = await writeContractAsync({
        address: currentIdentityRegistry,
        abi: IDENTITY_REGISTRY_ABI,
        functionName: "register",
        args: [FIXED_AGENT_URI],
        value: registrationFee > 0 ? registrationFee : undefined,
      });
    } else {
      hash = await writeContractAsync({
        address: currentDailyGM,
        abi: DAILY_AGENT_GM_ABI,
        functionName: "gm",
        value: gmFeeAmount > 0 ? gmFeeAmount : undefined,
      });
    }

    setTxStatus("pending");
    setTxTitle("Transaction Sent");
    setTxDesc("Waiting for confirmation...");

    const receipt = await publicClient!.waitForTransactionReceipt({ hash });

    if (receipt.status === "success") {
      setTxStatus("success");
      setTxTitle(type === "register" ? "🎉 Registration Complete!" : "✅ GM Sent Successfully!");
      setTxDesc(type === "register" ? "You are now a registered ERC-8004 Agent!" : "Your daily on-chain activity has been recorded.");

      confetti({
        particleCount: type === "register" ? 300 : 180,
        spread: 100,
        origin: { y: 0.6 },
        startVelocity: 25,
        colors: ['#8b5cf6', '#ec4899', '#3b82f6', '#22c55e']
      });

      await Promise.all([refetchRegistered(), refetchAgentId(), refetchLastGM(), refetchTotalAgents(), refetchTotalGM()]);
    } else {
      throw new Error("Transaction reverted on chain");
    }
  } catch (err: any) {
    console.error("Transaction error:", err);
    const rejected = err?.message?.includes("rejected") || 
                    err?.shortMessage?.includes("rejected") ||
                    err?.code === 4001;
    
    if (rejected) {
      setTxStatus("rejected");
      setTxTitle("Transaction Cancelled");
      setTxDesc("You cancelled the transaction in your wallet.");
    } else {
      setTxStatus("failed");
      setTxTitle("Transaction Failed");
      setTxDesc(err?.message || "Something went wrong. Please try again.");
    }
  } finally {
    setIsTxPending(false);
  }
};

  // ================= BUTTON LOGIC =================
  let mainButtonLabel = "🔌 Connect Wallet";
  let mainActionType: "register" | "gm" | null = null;
  let isMainDisabled = true;
  let buttonGradient = "linear(135deg, #8b5cf6, #ec4899)";

  if (isConnected) {
    if (!isCorrectChain) {
      mainButtonLabel = `🔄 Switch to ${currentChainName}`;
      isMainDisabled = false;
      buttonGradient = "linear(135deg, #3b82f6, #8b5cf6)";
    } else if (!isRegistered) {
      mainButtonLabel = "🎟️ Register as Agent";
      mainActionType = "register";
      isMainDisabled = false;
      buttonGradient = "linear(135deg, #8b5cf6, #a855f7)";
    } else if (canSendGM) {
      mainButtonLabel = "✉️ Send GM Now";
      mainActionType = "gm";
      isMainDisabled = false;
      buttonGradient = "linear(135deg, #22c55e, #16a34a)";
    } else {
      mainButtonLabel = "⏳ Cooldown Active";
      isMainDisabled = true;
      buttonGradient = "linear(135deg, #475569, #334155)";
    }
  }

  return (
    <Box
      minH="100vh"
      position="relative"
      bg="radial-gradient(ellipse at 20% 30%, #0a0a1a 0%, #05050f 100%)"
      overflowX="hidden"
    >
      {/* Enhanced Animated Background Orbs */}
      <Box
        position="fixed"
        top="5%"
        left="-5%"
        w="600px"
        h="600px"
        borderRadius="full"
        bg="radial-gradient(circle, rgba(139,92,246,0.25) 0%, rgba(139,92,246,0.05) 70%)"
        filter="blur(100px)"
        animation={`${floatSlow} 25s ease-in-out infinite`}
        zIndex={0}
        pointerEvents="none"
      />
      <Box
        position="fixed"
        bottom="0%"
        right="-5%"
        w="700px"
        h="700px"
        borderRadius="full"
        bg="radial-gradient(circle, rgba(236,72,153,0.2) 0%, rgba(236,72,153,0.05) 70%)"
        filter="blur(120px)"
        animation={`${float} 30s ease-in-out infinite`}
        zIndex={0}
        pointerEvents="none"
      />
      <Box
        position="fixed"
        top="40%"
        left="30%"
        w="400px"
        h="400px"
        borderRadius="full"
        bg="radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(59,130,246,0) 70%)"
        filter="blur(80px)"
        animation={`${floatSlow} 20s ease-in-out infinite reverse`}
        zIndex={0}
        pointerEvents="none"
      />

      {/* Animated Grid Pattern Overlay */}
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        opacity={0.03}
        pointerEvents="none"
        zIndex={0}
        bgImage="url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCI+PHBhdGggZD0iTTMwIDMwIG0tMjkgMCBhIDI5IDI5IDAgMSAwIDU4IDAgYSAyOSAyOSAwIDEgMC01OCAwIiBzdHJva2U9IiM4YjVjZjYiIGZpbGw9Im5vbmUiIG9wYWNpdHk9IjAuMSIvPjwvc3ZnPg==')"
        bgRepeat="repeat"
      />

      <Container maxW="1400px" position="relative" zIndex={1} px={{ base: 4, md: 6, lg: 8 }} py={{ base: 6, md: 8 }}>
        {/* ENHANCED HEADER */}
        <Flex justify="space-between" align="center" mb={{ base: 8, md: 12 }} direction={{ base: "column", md: "row" }} gap={{ base: 4, md: 0 }}>
          <VStack align={{ base: "center", md: "start" }} spacing={2} animation={`${slideInLeft} 0.6s ease-out`}>
            <HStack spacing={3}>
              <Box
                w="10px"
                h="10px"
                borderRadius="full"
                bgGradient="linear(135deg, #22c55e, #4ade80)"
                animation={`${pulseGreen} 2s ease-in-out infinite`}
              />
              <Heading
                fontSize={{ base: "2xl", md: "3xl", lg: "4xl" }}
                fontWeight="800"
                bgGradient="linear(135deg, #c084fc 0%, #ec4899 40%, #3b82f6 100%)"
                bgClip="text"
                letterSpacing="tight"
                _hover={{ filter: "brightness(1.1)" }}
                transition="filter 0.3s"
              >
                Agent GM Protocol
              </Heading>
            </HStack>
            <HStack spacing={2}>
              <Box as="span" fontSize="10px" color="#4ade80">●</Box>
              <Text color="gray.400" fontSize="sm" letterSpacing="wider" fontFamily="mono">
                ERC-8004 • On-Chain Activity Proof
              </Text>
            </HStack>
          </VStack>

          <HStack spacing={4} animation={`${slideInRight} 0.6s ease-out`}>
            {/* Activity Reputation Button */}
            <Button
              onClick={() => navigate("/activity-reputation")}
              bgGradient="linear(135deg, #8b5cf6, #ec4899)"
              color="white"
              size="md"
              borderRadius="full"
              px={6}
              fontWeight="600"
              letterSpacing="wider"
              fontSize="sm"
              boxShadow="0 0 15px rgba(139,92,246,0.4)"
              _hover={{
                transform: "translateY(-2px)",
                boxShadow: "0 0 25px rgba(139,92,246,0.6)",
              }}
              transition="all 0.3s ease"
              leftIcon={<Box as="span">🏆</Box>}
            >
              Activity Reputation
            </Button>
            
            <Box transform={{ base: "scale(0.95)", md: "scale(1)" }} transition="transform 0.3s" _hover={{ transform: "scale(1.02)" }}>
              <ConnectButton 
                chainStatus="full"
                accountStatus="full"
                showBalance={false}
              />
            </Box>
          </HStack>
        </Flex>

        {/* ENHANCED HERO SECTION */}
        <VStack spacing={6} textAlign="center" mb={16} animation={`${slideUp} 0.8s ease-out`}>
          <Badge
            bgGradient="linear(135deg, #8b5cf6, #ec4899)"
            px={5}
            py={2.5}
            rounded="full"
            color="white"
            fontSize="sm"
            fontWeight="600"
            letterSpacing="wider"
            boxShadow="0 0 20px rgba(139,92,246,0.5)"
            animation={`${glowPulse} 3s ease-in-out infinite`}
          >
            🌟 {currentChainName} Mainnet Active
          </Badge>
          <Heading
            fontSize={{ base: "4xl", md: "6xl", lg: "7xl" }}
            fontWeight="800"
            bgGradient="linear(135deg, #ffffff 0%, #c084fc 40%, #a855f7 100%)"
            bgClip="text"
            lineHeight="1.1"
            maxW="900px"
            mx="auto"
            letterSpacing="-0.02em"
          >
            Prove Your Daily<br />On-Chain Activity
          </Heading>
          <Text fontSize={{ base: "lg", md: "xl" }} color="gray.400" maxW="600px" mx="auto" lineHeight="1.6">
            Register once as an ERC-8004 Agent and send GM daily to build your verifiable on-chain reputation
          </Text>
        </VStack>

        {/* ENHANCED Main Card Grid */}
        <Grid
          templateColumns={{ base: "1fr", lg: "1.2fr 0.8fr" }}
          gap={{ base: 6, lg: 8 }}
          alignItems="start"
        >
          {/* Enhanced Status Card */}
          <GridItem animation={`${slideInLeft} 0.7s ease-out 0.1s both`}>
            <Box
              bg="rgba(10, 10, 20, 0.7)"
              backdropFilter="blur(20px)"
              borderRadius="3xl"
              border="1px solid"
              borderColor="rgba(139, 92, 246, 0.3)"
              overflow="hidden"
              transition="all 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
              _hover={{
                borderColor: "rgba(139, 92, 246, 0.8)",
                transform: "translateY(-4px)",
                boxShadow: "0 20px 40px rgba(0,0,0,0.3), 0 0 30px rgba(139,92,246,0.2)"
              }}
            >
              <Box
                h="4px"
                bgGradient="linear(90deg, #8b5cf6, #ec4899, #3b82f6, #8b5cf6)"
                backgroundSize="300% 100%"
                animation={`${shimmer} 4s ease infinite`}
              />
              <VStack p={{ base: 6, md: 8 }} spacing={6} align="stretch">
                <HStack justify="space-between">
                  <Text color="gray.400" fontWeight="600" letterSpacing="wider" fontSize="sm">
                    AGENT STATUS
                  </Text>
                  <Tooltip label={isRegistered ? "Soulbound NFT Minted" : "Not yet registered"} hasArrow>
                    <Badge
                      bg={isRegistered ? "linear-gradient(135deg, rgba(34,197,94,0.2), rgba(34,197,94,0.1))" : "linear-gradient(135deg, rgba(139,92,246,0.2), rgba(139,92,246,0.1))"}
                      color={isRegistered ? "#4ade80" : "#a855f7"}
                      px={3}
                      py={1.5}
                      rounded="full"
                      fontSize="xs"
                      fontWeight="600"
                      borderWidth="1px"
                      borderColor={isRegistered ? "#4ade80" : "#a855f7"}
                      boxShadow={isRegistered ? "0 0 10px rgba(74,222,128,0.3)" : "none"}
                    >
                      {isRegistered ? "✓ REGISTERED" : "⚡ PENDING"}
                    </Badge>
                  </Tooltip>
                </HStack>

                <VStack spacing={5}>
                  <Box
                    position="relative"
                    w="130px"
                    h="130px"
                  >
                    {/* Rotating border ring for registered agents */}
                    {isRegistered && (
                      <Box
                        position="absolute"
                        top="-3px"
                        left="-3px"
                        right="-3px"
                        bottom="-3px"
                        borderRadius="full"
                        bgGradient="linear(135deg, #8b5cf6, #ec4899, #3b82f6)"
                        animation={`${rotateBorder} 4s linear infinite`}
                        opacity={0.6}
                      />
                    )}
                    <Box
                      w="130px"
                      h="130px"
                      borderRadius="full"
                      bgGradient="linear(135deg, rgba(139,92,246,0.2), rgba(236,72,153,0.2))"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      fontSize="64px"
                      backdropFilter="blur(10px)"
                      border="2px solid rgba(139,92,246,0.4)"
                      transition="all 0.3s"
                      _hover={{ transform: "scale(1.05)" }}
                    >
                      {loadingRegistered ? "⏳" : isRegistered ? "🧬" : "🚀"}
                    </Box>
                  </Box>
                  
                  {isRegistered ? (
                    <VStack spacing={2}>
                      <Heading size="lg" color="white" fontFamily="mono">
                        Agent #{Number(agentId).toString()}
                      </Heading>
                      <Badge variant="outline" colorScheme="purple" px={2} py={1} fontSize="xs">
                        🔒 Soulbound NFT
                      </Badge>
                    </VStack>
                  ) : (
                    <Text fontSize="xl" fontWeight="600" color="gray.300" textAlign="center">
                      Not Registered Yet
                    </Text>
                  )}
                </VStack>

                {/* Enhanced Stats Grid */}
                <SimpleGrid columns={2} spacing={4} pt={4}>
                  <Box
                    bg="linear-gradient(135deg, rgba(139,92,246,0.15), rgba(139,92,246,0.05))"
                    rounded="2xl"
                    p={4}
                    transition="all 0.3s"
                    _hover={{ transform: "translateY(-2px)", bg: "rgba(139,92,246,0.2)" }}
                  >
                    <Text color="gray.400" fontSize="xs" textTransform="uppercase" letterSpacing="wider">
                      Standard
                    </Text>
                    <Text color="white" fontWeight="bold" fontSize="lg" fontFamily="mono">
                      ERC-8004
                    </Text>
                  </Box>
                  <Box
                    bg="linear-gradient(135deg, rgba(139,92,246,0.15), rgba(139,92,246,0.05))"
                    rounded="2xl"
                    p={4}
                    transition="all 0.3s"
                    _hover={{ transform: "translateY(-2px)", bg: "rgba(139,92,246,0.2)" }}
                  >
                    <Text color="gray.400" fontSize="xs" textTransform="uppercase" letterSpacing="wider">
                      Type
                    </Text>
                    <Text color="white" fontWeight="bold" fontSize="lg" fontFamily="mono">
                      Soulbound
                    </Text>
                  </Box>
                  <Box
                    bg="linear-gradient(135deg, rgba(139,92,246,0.15), rgba(139,92,246,0.05))"
                    rounded="2xl"
                    p={4}
                    transition="all 0.3s"
                    _hover={{ transform: "translateY(-2px)", bg: "rgba(139,92,246,0.2)" }}
                  >
                    <Text color="gray.400" fontSize="xs" textTransform="uppercase" letterSpacing="wider">
                      Network
                    </Text>
                    <HStack spacing={1}>
                      <Box w="8px" h="8px" borderRadius="full" bg="#22c55e" animation={`${pulseGlow} 2s ease-in-out infinite`} />
                      <Text color="white" fontWeight="bold" fontSize="lg" fontFamily="mono">
                        {currentChainName}
                      </Text>
                    </HStack>
                  </Box>
                  <Box
                    bg="linear-gradient(135deg, rgba(139,92,246,0.15), rgba(139,92,246,0.05))"
                    rounded="2xl"
                    p={4}
                    transition="all 0.3s"
                    _hover={{ transform: "translateY(-2px)", bg: "rgba(139,92,246,0.2)" }}
                  >
                    <Text color="gray.400" fontSize="xs" textTransform="uppercase" letterSpacing="wider">
                      Cooldown
                    </Text>
                    <Text color="white" fontWeight="bold" fontSize="lg" fontFamily="mono">
                      24 Hours
                    </Text>
                  </Box>
                </SimpleGrid>
              </VStack>
            </Box>
          </GridItem>

          {/* Enhanced Action Card */}
          <GridItem animation={`${slideInRight} 0.7s ease-out 0.1s both`}>
            <Box
              bg="rgba(10, 10, 20, 0.7)"
              backdropFilter="blur(20px)"
              borderRadius="3xl"
              border="1px solid"
              borderColor={isRegistered && canSendGM ? "rgba(34, 197, 94, 0.5)" : "rgba(139, 92, 246, 0.3)"}
              overflow="hidden"
              transition="all 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
              _hover={{
                transform: "translateY(-4px)",
                borderColor: isRegistered && canSendGM ? "rgba(34, 197, 94, 0.8)" : "rgba(139, 92, 246, 0.8)",
                boxShadow: isRegistered && canSendGM ? "0 0 30px rgba(34,197,94,0.2)" : "0 0 30px rgba(139,92,246,0.2)"
              }}
            >
              {isRegistered && canSendGM && (
                <Box
                  h="4px"
                  bgGradient="linear(90deg, #22c55e, #4ade80, #22c55e)"
                  backgroundSize="200% 100%"
                  animation={`${shimmer} 2s ease infinite`}
                />
              )}
              <VStack p={{ base: 6, md: 8 }} spacing={6} align="stretch">
                <Text color="gray.400" fontWeight="600" letterSpacing="wider" textAlign="center" fontSize="sm">
                  DAILY INTERACTION
                </Text>

                <VStack spacing={6}>
                  <Box
                    position="relative"
                    w={{ base: "180px", md: "200px" }}
                    h={{ base: "180px", md: "200px" }}
                  >
                    {isRegistered && !canSendGM && (
                      <Box
                        position="absolute"
                        top="-2px"
                        left="-2px"
                        right="-2px"
                        bottom="-2px"
                        borderRadius="full"
                        bg="conic-gradient(from 0deg, #8b5cf6, #ec4899, #3b82f6, #8b5cf6)"
                        animation={`${rotateBorder} 6s linear infinite`}
                        opacity={0.4}
                      />
                    )}
                    <Box
                      w="100%"
                      h="100%"
                      borderRadius="full"
                      bg={isRegistered && canSendGM
                        ? "linear-gradient(135deg, rgba(34,197,94,0.3), rgba(34,197,94,0.1))"
                        : "linear-gradient(135deg, rgba(139,92,246,0.3), rgba(236,72,153,0.2))"
                      }
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      fontSize={{ base: "80px", md: "96px" }}
                      backdropFilter="blur(10px)"
                      border="2px solid"
                      borderColor={isRegistered && canSendGM ? "#22c55e" : "rgba(139,92,246,0.4)"}
                      transition="all 0.3s"
                      _hover={{ transform: "scale(1.02)" }}
                    >
                      {isRegistered ? (canSendGM ? "📨" : "⏳") : "🔒"}
                    </Box>
                  </Box>

                  {isRegistered && (
                    <VStack spacing={3} w="full">
                      {canSendGM ? (
                        <>
                          <HStack spacing={2}>
                            <Box w="8px" h="8px" borderRadius="full" bg="#22c55e" animation={`${pulseGreen} 1.5s ease-in-out infinite`} />
                            <Heading size="md" color="#4ade80">Ready to Send GM</Heading>
                          </HStack>
                          <Text color="gray.400" fontSize="sm">Daily cooldown has expired</Text>
                        </>
                      ) : (
                        <>
                          <Heading size="md" bgGradient="linear(135deg, #c084fc, #ec4899)" bgClip="text">
                            Cooldown Active
                          </Heading>
                          <VStack spacing={1} w="full">
                            <Text color="gray.400" fontSize="sm">Next GM available in</Text>
                            <Text
                              fontSize="3xl"
                              fontWeight="bold"
                              fontFamily="mono"
                              bgGradient={progressPercent > 75 ? "linear(135deg, #c084fc, #ec4899)" : "linear(135deg, #8b5cf6, #a855f7)"}
                              bgClip="text"
                              letterSpacing="2px"
                            >
                              {timeLeft}
                            </Text>
                            <Progress
                              value={progressPercent}
                              size="sm"
                              w="full"
                              borderRadius="full"
                              bg="rgba(139,92,246,0.2)"
                              sx={{
                                "& > div": {
                                  bgGradient: "linear(90deg, #8b5cf6, #ec4899)",
                                  borderRadius: "full",
                                }
                              }}
                            />
                            <Text fontSize="xs" color="gray.500">{Math.floor(progressPercent)}% completed</Text>
                          </VStack>
                        </>
                      )}
                    </VStack>
                  )}

                  {!isRegistered && !loadingRegistered && (
                    <Text color="gray.400" fontSize="sm" textAlign="center">
                      Register as an Agent to start your daily streak
                    </Text>
                  )}

                  {loadingRegistered && (
                    <Skeleton height="40px" w="full" borderRadius="lg" startColor="rgba(139,92,246,0.2)" endColor="rgba(139,92,246,0.1)" />
                  )}

                  <Button
                    size="lg"
                    w="full"
                    h="60px"
                    fontSize="lg"
                    fontWeight="bold"
                    borderRadius="full"
                    isLoading={isTxPending || switching}
                    isDisabled={isMainDisabled}
                    onClick={() => {
                      if (!isCorrectChain) {
                        switchChain?.({ chainId: targetChainId });
                      } else if (mainActionType) {
                        handleAction(mainActionType);
                      }
                    }}
                    bgGradient={buttonGradient}
                    color="white"
                    boxShadow={canSendGM 
                      ? "0 0 25px rgba(34, 197, 94, 0.6), 0 0 50px rgba(34, 197, 94, 0.3)" 
                      : "0 0 25px rgba(139, 92, 246, 0.6), 0 0 50px rgba(139, 92, 246, 0.3)"
                    }
                    _hover={{ 
                      transform: "translateY(-3px)", 
                      boxShadow: canSendGM 
                        ? "0 0 40px rgba(34, 197, 94, 0.9), 0 0 80px rgba(34, 197, 94, 0.5)" 
                        : "0 0 40px rgba(139, 92, 246, 0.9), 0 0 80px rgba(139, 92, 246, 0.5)"
                    }}
                    transition="all 0.35s cubic-bezier(0.4, 0, 0.2, 1)"
                    _active={{ transform: "translateY(0px)" }}
                  >
                    {mainButtonLabel}
                  </Button>
                </VStack>
              </VStack>
            </Box>
          </GridItem>
        </Grid>

        {/* Enhanced How It Works Section */}
        <Box mt={20} animation={`${slideUp} 0.7s ease-out 0.2s both`}>
          <VStack spacing={10}>
            <VStack spacing={3}>
              <Badge variant="outline" colorScheme="purple" px={3} py={1} fontSize="xs" letterSpacing="wider">
                PROTOCOL GUIDE
              </Badge>
              <Heading
                fontSize={{ base: "2xl", md: "3xl" }}
                bgGradient="linear(135deg, #c084fc, #ec4899)"
                bgClip="text"
                textAlign="center"
              >
                How It Works
              </Heading>
            </VStack>

            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} w="full">
              {[
                {
                  step: "01",
                  title: "Connect & Register",
                  desc: "Connect your wallet and register as an ERC-8004 Agent with a single transaction",
                  icon: "🔗",
                  color: "#8b5cf6",
                  gradient: "linear(135deg, rgba(139,92,246,0.2), rgba(139,92,246,0.05))",
                },
                {
                  step: "02",
                  title: "Get Your Badge",
                  desc: "Receive your permanent Soulbound Agent NFT - your on-chain identity",
                  icon: "🎖️",
                  color: "#ec4899",
                  gradient: "linear(135deg, rgba(236,72,153,0.2), rgba(236,72,153,0.05))",
                },
                {
                  step: "03",
                  title: "Daily GM",
                  desc: "Send GM once every 24 hours to prove consistent on-chain activity",
                  icon: "💬",
                  color: "#3b82f6",
                  gradient: "linear(135deg, rgba(59,130,246,0.2), rgba(59,130,246,0.05))",
                },
                {
                  step: "04",
                  title: "Build Reputation",
                  desc: "Your streak is recorded on-chain for future rewards & integrations",
                  icon: "📈",
                  color: "#22c55e",
                  gradient: "linear(135deg, rgba(34,197,94,0.2), rgba(34,197,94,0.05))",
                },
              ].map((item, idx) => (
                <Tooltip key={idx} label={`Step ${item.step}`} hasArrow>
                  <Box
                    bg={item.gradient}
                    backdropFilter="blur(10px)"
                    borderRadius="2xl"
                    p={6}
                    border="1px solid"
                    borderColor={`rgba(${parseInt(item.color.slice(1, 3), 16)}, ${parseInt(item.color.slice(3, 5), 16)}, ${parseInt(item.color.slice(5, 7), 16)}, 0.2)`}
                    transition="all 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
                    _hover={{
                      transform: "translateY(-8px)",
                      borderColor: item.color,
                      boxShadow: `0 10px 30px ${item.color}20`,
                    }}
                    onMouseEnter={() => setHoverEffect(`step-${idx}`)}
                    onMouseLeave={() => setHoverEffect(null)}
                  >
                    <HStack spacing={3} mb={4}>
                      <Box
                        fontSize="40px"
                        transition="transform 0.3s"
                        transform={hoverEffect === `step-${idx}` ? "scale(1.1)" : "scale(1)"}
                      >
                        {item.icon}
                      </Box>
                      <Text
                        fontSize="12px"
                        fontWeight="bold"
                        color={item.color}
                        letterSpacing="wider"
                        fontFamily="mono"
                      >
                        STEP {item.step}
                      </Text>
                    </HStack>
                    <Heading size="sm" mb={2} color="white" fontWeight="600">
                      {item.title}
                    </Heading>
                    <Text fontSize="sm" color="gray.400" lineHeight="1.5">
                      {item.desc}
                    </Text>
                  </Box>
                </Tooltip>
              ))}
            </SimpleGrid>
          </VStack>
        </Box>

        {/* Enhanced Stats Section */}
        <Box mt={16} mb={8} animation={`${slideUp} 0.7s ease-out 0.3s both`}>
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
            {[
              { label: "Total Agents", value: Number(totalAgents).toLocaleString(), change: `on ${currentChainName}`, icon: "👥", color: "#8b5cf6" },
              { label: "Total GM Sent", value: Number(totalGM).toLocaleString(), change: "all time", icon: "💬", color: "#ec4899" },
              { label: "Active Streak", value: `${Number(userStreak)}d`, change: "your streak", icon: "🔥", color: "#f59e0b" },
              { label: "Network", value: currentChainName, change: "Mainnet", icon: "⛓️", color: "#3b82f6" },
            ].map((stat, idx) => (
              <Box
                key={idx}
                bg="linear-gradient(135deg, rgba(15, 15, 30, 0.6), rgba(10, 10, 20, 0.4))"
                backdropFilter="blur(10px)"
                borderRadius="xl"
                p={5}
                textAlign="center"
                transition="all 0.3s"
                _hover={{
                  bg: `linear-gradient(135deg, ${stat.color}10, rgba(10, 10, 20, 0.4))`,
                  transform: "translateY(-2px)",
                  borderColor: stat.color,
                }}
                border="1px solid"
                borderColor={`${stat.color}20`}
              >
                <Text fontSize="28px" mb={1}>{stat.icon}</Text>
                <Text fontSize="xs" color="gray.400" textTransform="uppercase" letterSpacing="wider" fontWeight="500">
                  {stat.label}
                </Text>
                <Text fontSize="2xl" fontWeight="bold" color="white" fontFamily="mono" mt={1}>
                  {stat.value}
                </Text>
                <Text fontSize="xs" color={stat.color} fontWeight="500">
                  {stat.change}
                </Text>
              </Box>
            ))}
          </SimpleGrid>
        </Box>

        {/* Footer */}
        <Center pt={12} pb={6}>
          <VStack spacing={2}>
            <Text color="gray.600" fontSize="sm" fontFamily="mono">
              © 2026 • Agent GM Protocol • ERC-8004 Standard
            </Text>
            <HStack spacing={4} opacity={0.5}>
              <Box w="2px" h="2px" borderRadius="full" bg="gray.600" />
              <Text fontSize="10px" color="gray.600">Soulbound NFT Standard</Text>
              <Box w="2px" h="2px" borderRadius="full" bg="gray.600" />
              <Text fontSize="10px" color="gray.600">24h Cooldown</Text>
            </HStack>
          </VStack>
        </Center>
      </Container>

      <TransactionModal
        isOpen={txOpen}
        status={txStatus}
        title={txTitle}
        description={txDesc}
        onClose={() => {
          setTxOpen(false);
          setTimeout(() => {
            if (txStatus === "success" || txStatus === "rejected" || txStatus === "failed") {
              setTxStatus("idle");
              setTxTitle("");
              setTxDesc("");
            }
          }, 300);
        }}
      />
    </Box>
  );
}
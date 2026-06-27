var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// netlify/functions/api.ts
var api_exports = {};
__export(api_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(api_exports);
var import_express = __toESM(require("express"), 1);
var import_serverless_http = __toESM(require("serverless-http"), 1);
var import_cors = __toESM(require("cors"), 1);
var import_ethers = require("ethers");

var app = (0, import_express.default)();
app.use((0, import_cors.default)({
  origin: true,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));
app.use(import_express.default.json());

var BADGE_CONTRACT = "0xE6D5A673306A5cB2646b0727f9363e13FAC60c72";

// ============ AGENT ACADEMY QUESTIONS ============
const QUEST_QUESTIONS = {
  1: {
    name: "What is Soneium?",
    questions: [
      { question: "Soneium is a Layer 2 solution built on Ethereum?", answer: true },
      { question: "Soneium uses OP Stack for its infrastructure?", answer: true },
      { question: "Soneium was launched in 2025?", answer: false },
      { question: "Soneium supports EVM-compatible smart contracts?", answer: true },
      { question: "Soneium is only available on mainnet?", answer: false },
    ]
  },
  2: {
    name: "How to use DEX",
    questions: [
      { question: "DEX stands for Decentralized Exchange?", answer: true },
      { question: "Soneium DEX uses automated market makers (AMM)?", answer: true },
      { question: "You need KYC to use a DEX on Soneium?", answer: false },
      { question: "DEXs on Soneium support token swaps?", answer: true },
      { question: "Soneium DEX has lower fees than Ethereum mainnet?", answer: true },
    ]
  },
  3: {
    name: "Deploy on Soneium",
    questions: [
      { question: "You need SOLIDITY to deploy on Soneium?", answer: true },
      { question: "Deployments on Soneium cost gas fees?", answer: true },
      { question: "Soneium does not support ERC-721 tokens?", answer: false },
      { question: "You can deploy contracts using Hardhat on Soneium?", answer: true },
      { question: "Soneium uses the same address format as Ethereum?", answer: true },
    ]
  },
  4: {
    name: "Agent Protocol",
    questions: [
      { question: "ERC-8004 is the Agent GM Protocol standard?", answer: true },
      { question: "Agents must send GM daily to build reputation?", answer: true },
      { question: "Agent NFTs can be transferred to any wallet?", answer: false },
      { question: "GM cooldown period is 24 hours?", answer: true },
      { question: "Reputation points can be earned through partner actions?", answer: true },
    ]
  }
};

// ============ ENDPOINTS ============

// Health check
app.get("/api/", (req, res) => {
  res.send("<h1>✅ Signature API ONLINE by SilviuASY</h1><p>CORS enabled for Signature</p>");
});

// Generate mint signature for reputation badge
app.post("/api/generate-mint-signature", async (req, res) => {
  const { userAddress, score, nonce } = req.body;
  
  if (!userAddress?.startsWith("0x") || typeof score !== "number" || nonce === void 0) {
    return res.status(400).json({ error: "Invalid parameters" });
  }

  const signerPk = process.env.SIGNER_PRIVATE_KEY;
  if (!signerPk) {
    return res.status(500).json({ error: "Missing SIGNER_PRIVATE_KEY in environment variables" });
  }

  try {
    const deadline = Math.floor(Date.now() / 1000) + 3600;
    const wallet = new import_ethers.ethers.Wallet(signerPk);
    const rawMessageHash = import_ethers.ethers.solidityPackedKeccak256(
      ["address", "uint256", "uint256", "uint256", "address"],
      [userAddress, BigInt(score), BigInt(nonce), BigInt(deadline), BADGE_CONTRACT]
    );
    const signature = await wallet.signMessage(import_ethers.ethers.getBytes(rawMessageHash));
    console.log(`✅ Signature generated for ${userAddress} with deadline: ${deadline}`);
    return res.status(200).json({ signature, deadline });
  } catch (error) {
    console.error("❌ Error generating signature:", error);
    return res.status(500).json({ error: "Error generating signature" });
  }
});

// Get all quests
app.get("/api/agent-quests", async (req, res) => {
  try {
    const quests = Object.keys(QUEST_QUESTIONS).map(key => ({
      id: parseInt(key),
      name: QUEST_QUESTIONS[key].name,
      totalQuestions: QUEST_QUESTIONS[key].questions.length
    }));
    
    return res.status(200).json({ quests });
  } catch (error) {
    console.error("❌ Error fetching quests:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Get specific quest questions
app.get("/api/agent-quest/:questId", async (req, res) => {
  try {
    const questId = parseInt(req.params.questId);
    
    if (!QUEST_QUESTIONS[questId]) {
      return res.status(404).json({ error: "Quest not found" });
    }

    const quest = QUEST_QUESTIONS[questId];
    const questions = quest.questions.map(q => ({
      question: q.question
    }));

    return res.status(200).json({
      questId: questId,
      name: quest.name,
      questions: questions,
      totalQuestions: questions.length
    });
  } catch (error) {
    console.error("❌ Error fetching quest:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Verify quiz answers and generate signature
app.post("/api/verify-quiz-answers", async (req, res) => {
  try {
    const { questId, userAddress, answers } = req.body;
    
    if (!questId || !QUEST_QUESTIONS[questId]) {
      return res.status(400).json({ error: "Invalid quest ID" });
    }

    if (!userAddress || !userAddress.startsWith("0x")) {
      return res.status(400).json({ error: "Invalid user address" });
    }

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ error: "Invalid answers" });
    }

    const questQuestions = QUEST_QUESTIONS[questId].questions;

    if (answers.length !== questQuestions.length) {
      return res.status(400).json({ 
        error: `Expected ${questQuestions.length} answers, got ${answers.length}` 
      });
    }

    // Check all answers
    let allCorrect = true;
    let wrongIndexes = [];

    for (let i = 0; i < questQuestions.length; i++) {
      if (answers[i] !== questQuestions[i].answer) {
        allCorrect = false;
        wrongIndexes.push(i);
      }
    }

    if (!allCorrect) {
      return res.status(400).json({
        error: "Incorrect answers",
        wrongIndexes: wrongIndexes,
        correct: false
      });
    }

    const signerPk = process.env.SIGNER_PRIVATE_KEY;
    if (!signerPk) {
      return res.status(500).json({ error: "Missing SIGNER_PRIVATE_KEY" });
    }

    const wallet = new import_ethers.ethers.Wallet(signerPk);
    const chainId = req.headers['x-chain-id'] || 1868;
    
    // 1. Creează hash-ul mesajului (la fel ca în contract)
    const messageHash = import_ethers.ethers.solidityPackedKeccak256(
      ["uint256", "address", "uint256"],
      [questId, userAddress, chainId]
    );
    
    // 2. Aplică prefixul Ethereum Signed Message (la fel ca în contract)
    const messageHashBytes = import_ethers.ethers.getBytes(messageHash);
    const ethSignedMessageHash = import_ethers.ethers.hashMessage(messageHashBytes);
    
    // 3. Semnează hash-ul cu prefix
    const signature = await wallet.signMessage(messageHashBytes);
    
    console.log(`✅ Quiz verified for ${userAddress} - Quest ${questId}`);
    console.log(`📝 Message hash: ${messageHash}`);
    console.log(`📝 ETH signed hash: ${ethSignedMessageHash}`);
    console.log(`📝 Signature: ${signature}`);
    
    return res.status(200).json({
      success: true,
      signature: signature,
      message: "All answers correct!"
    });

  } catch (error) {
    console.error("❌ Error verifying answers:", error);
    return res.status(500).json({ error: "Error verifying answers" });
  }
});

var handler = (0, import_serverless_http.default)(app);

0 && (module.exports = {
  handler
});

// netlify/functions/api.js
import express from "express";
import serverless from "serverless-http";
import cors from "cors";
import { ethers } from "ethers";

const app = express();
app.use(
  cors({
    origin: true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.use(express.json());

const BADGE_CONTRACT = "0x8002f1e37caEe0D739C298D31D7E1090c22264B0";

const GM_CONTRACT = "0x92030EB87e27ED80351f346dea4B14Ac61a1f57C";
const DEPLOY_CONTRACT = "0x539040c447A4a0D61C396b74308efe959A2eD86a";
const VOTE_CONTRACT = "0xd01c919c63856a9732a6A0BAfc63eb2494e4a19F";
const CHECKIN_CONTRACT = "0x72c89BA5def57c642582E536d351483b9D85CA8C";
const AGENT_GM_CONTRACT = "0xb19922c27C86cc08dc4f0f3Cb4e76c30494c22dc";
const AGENT_GATEWAY_CONTRACT = "0x2356e0c4475d8BfE1c9Fe004715a2808AB0eB72E";


const gmABI = ["function balanceOf(address owner) view returns (uint256)"];
const voteABI = ["function getUserVotes(address user) view returns (uint256)"];
const checkInABI = ["function getUserCheckIns(address user) view returns (uint256)"];
const deployABI = ["function getUserDeploymentCount(address user) view returns (uint256)"];
const agentGMABI = ["function totalUserGM(address user) view returns (uint256)"];
const agentGatewayABI = [
  "function getUserActionCount(address user, uint256 actionId) view returns (uint256)",
  "function getUserTotalActions(address user) view returns (uint256)",
];
const badgeReadABI = [
  "function minReputationScore() view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function getNonce(address user) view returns (uint256)",
];

const provider = new ethers.JsonRpcProvider(process.env.SONEIUM_RPC_URL);

async function getOnChainScore(address) {
  const gm = new ethers.Contract(GM_CONTRACT, gmABI, provider);
  const vote = new ethers.Contract(VOTE_CONTRACT, voteABI, provider);
  const checkIn = new ethers.Contract(CHECKIN_CONTRACT, checkInABI, provider);
  const deploy = new ethers.Contract(DEPLOY_CONTRACT, deployABI, provider);
  const agentGm = new ethers.Contract(AGENT_GM_CONTRACT, agentGMABI, provider);
  const gateway = new ethers.Contract(AGENT_GATEWAY_CONTRACT, agentGatewayABI, provider);

  const [gmCount, voteCount, checkInCount, deployCount, agentGmCount] = await Promise.all([
    gm.balanceOf(address),
    vote.getUserVotes(address),
    checkIn.getUserCheckIns(address),
    deploy.getUserDeploymentCount(address),
    agentGm.totalUserGM(address),
  ]);

  const userPartnerTotal = Number(await gateway.getUserTotalActions(address));

  return (
    Number(gmCount) +
    Number(voteCount) +
    Number(checkInCount) +
    Number(deployCount) +
    Number(agentGmCount) +
    userPartnerTotal
  );
}

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
    ],
  },
  2: {
    name: "How to use DEX",
    questions: [
      { question: "DEX stands for Decentralized Exchange?", answer: true },
      { question: "Soneium DEX uses automated market makers (AMM)?", answer: true },
      { question: "You need KYC to use a DEX on Soneium?", answer: false },
      { question: "DEXs on Soneium support token swaps?", answer: true },
      { question: "Soneium DEX has lower fees than Ethereum mainnet?", answer: true },
    ],
  },
  3: {
    name: "Deploy on Soneium",
    questions: [
      { question: "You need SOLIDITY to deploy on Soneium?", answer: true },
      { question: "Deployments on Soneium cost gas fees?", answer: true },
      { question: "Soneium does not support ERC-721 tokens?", answer: false },
      { question: "You can deploy contracts using Hardhat on Soneium?", answer: true },
      { question: "Soneium uses the same address format as Ethereum?", answer: true },
    ],
  },
  4: {
    name: "Agent Protocol",
    questions: [
      { question: "ERC-8004 is the Agent GM Protocol standard?", answer: true },
      { question: "Agents must send GM daily to build reputation?", answer: true },
      { question: "Agent NFTs can be transferred to any wallet?", answer: false },
      { question: "GM cooldown period is 24 hours?", answer: true },
      { question: "Reputation points can be earned through partner actions?", answer: true },
    ],
  },
};

// ============ ENDPOINTS ============

// Health check
app.get("/api/", (req, res) => {
  res.send("<h1>✅ Signature API ONLINE by SilviuASY</h1><p>CORS enabled for Signature</p>");
});


app.post("/api/generate-mint-signature", async (req, res) => {
  const { userAddress, nonce } = req.body;

  if (!userAddress?.startsWith("0x") || nonce === undefined) {
    return res.status(400).json({ error: "Invalid parameters" });
  }

  const signerPk = process.env.SIGNER_PRIVATE_KEY;
  if (!signerPk) {
    return res.status(500).json({ error: "Missing SIGNER_PRIVATE_KEY in environment variables" });
  }

  try {
    const addressLower = userAddress.toLowerCase();


    const realScore = await getOnChainScore(addressLower);

    const badge = new ethers.Contract(BADGE_CONTRACT, badgeReadABI, provider);
    const [minReputationScoreData, currentBadgeBalance] = await Promise.all([
      badge.minReputationScore(),
      badge.balanceOf(userAddress),
    ]);
    const minReputationScore = Number(minReputationScoreData);

    if (Number(currentBadgeBalance) > 0) {
      return res.status(400).json({ error: "Badge already minted for this address" });
    }

    if (realScore < minReputationScore) {
      return res.status(400).json({
        error: `Insufficient score. Required: ${minReputationScore}, current: ${realScore}`,
      });
    }

    const deadline = Math.floor(Date.now() / 1000) + 3600;
    const wallet = new ethers.Wallet(signerPk);
    const rawMessageHash = ethers.solidityPackedKeccak256(
      ["address", "uint256", "uint256", "uint256", "address"],
      [userAddress, BigInt(realScore), BigInt(nonce), BigInt(deadline), BADGE_CONTRACT]
    );
    const signature = await wallet.signMessage(ethers.getBytes(rawMessageHash));

    console.log(`✅ Signature generated for ${userAddress} — real on-chain score: ${realScore}, deadline: ${deadline}`);

    return res.status(200).json({ signature, deadline, score: realScore });
  } catch (error) {
    console.error("❌ Error generating signature:", error);
    return res.status(500).json({ error: "Error generating signature" });
  }
});


app.get("/api/agent-quests", async (req, res) => {
  try {
    const quests = Object.keys(QUEST_QUESTIONS).map((key) => ({
      id: parseInt(key),
      name: QUEST_QUESTIONS[key].name,
      totalQuestions: QUEST_QUESTIONS[key].questions.length,
    }));

    return res.status(200).json({ quests });
  } catch (error) {
    console.error("❌ Error fetching quests:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/agent-quest/:questId", async (req, res) => {
  try {
    const questId = parseInt(req.params.questId);

    if (!QUEST_QUESTIONS[questId]) {
      return res.status(404).json({ error: "Quest not found" });
    }

    const quest = QUEST_QUESTIONS[questId];
    const questions = quest.questions.map((q) => ({ question: q.question }));

    return res.status(200).json({
      questId: questId,
      name: quest.name,
      questions: questions,
      totalQuestions: questions.length,
    });
  } catch (error) {
    console.error("❌ Error fetching quest:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});


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
        error: `Expected ${questQuestions.length} answers, got ${answers.length}`,
      });
    }

    let allCorrect = true;
    const wrongIndexes = [];

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
        correct: false,
      });
    }

    const signerPk = process.env.SIGNER_PRIVATE_KEY;
    if (!signerPk) {
      return res.status(500).json({ error: "Missing SIGNER_PRIVATE_KEY" });
    }

    const wallet = new ethers.Wallet(signerPk);
    const chainId = req.headers["x-chain-id"] || 1868;
    const deadline = Math.floor(Date.now() / 1000) + 3600;

    const messageHash = ethers.solidityPackedKeccak256(
      ["uint256", "address", "uint256", "uint256"],
      [questId, userAddress, chainId, deadline]
    );

    const messageHashBytes = ethers.getBytes(messageHash);
    const signature = await wallet.signMessage(messageHashBytes);

    console.log(`✅ Quiz verified for ${userAddress} - Quest ${questId}`);
    console.log(`⏰ Deadline: ${new Date(deadline * 1000).toISOString()}`);

    return res.status(200).json({
      success: true,
      signature: signature,
      deadline: deadline,
      message: "All answers correct!",
    });
  } catch (error) {
    console.error("❌ Error verifying answers:", error);
    return res.status(500).json({ error: "Error verifying answers" });
  }
});

export const handler = serverless(app);

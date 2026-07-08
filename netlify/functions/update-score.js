import { createClient } from '@libsql/client';
import { ethers } from 'ethers';

// ============ CONFIG ============
// Turso DB
const turso = createClient({
  url: process.env.TURSO_DB_URL,
  authToken: process.env.TURSO_DB_TOKEN,
});

const provider = new ethers.JsonRpcProvider(process.env.SONEIUM_RPC_URL);

const GM_CONTRACT = "0x92030EB87e27ED80351f346dea4B14Ac61a1f57C";
const DEPLOY_CONTRACT = "0x539040c447A4a0D61C396b74308efe959A2eD86a";
const VOTE_CONTRACT = "0xd01c919c63856a9732a6A0BAfc63eb2494e4a19F";
const CHECKIN_CONTRACT = "0x72c89BA5def57c642582E536d351483b9D85CA8C";
const AGENT_CONTRACT = "0x29c4632A1710BC58cE8D9d46Ec227fc569f58bF1";
const AGENT_GM_CONTRACT = "0xb19922c27C86cc08dc4f0f3Cb4e76c30494c22dc";
const AGENT_GATEWAY_CONTRACT = "0x2356e0c4475d8BfE1c9Fe004715a2808AB0eB72E";

const SONEIUM_CHAIN_ID = 1868;

const gmABI = [
  "function balanceOf(address owner) view returns (uint256)",
];
const voteABI = [
  "function getUserVotes(address user) view returns (uint256)",
];
const checkInABI = [
  "function getUserCheckIns(address user) view returns (uint256)",
];
const deployABI = [
  "function getUserDeploymentCount(address user) view returns (uint256)",
];
const agentGMABI = [
  "function totalUserGM(address user) view returns (uint256)",
];
const agentGatewayABI = [
  "function getUserActionCount(address user, uint256 actionId) view returns (uint256)",
  "function getUserTotalActions(address user) view returns (uint256)",
];


function getUserBadge(score) {
  if (score >= 1000) return "LEGEND";
  if (score >= 500) return "ELITE";
  if (score >= 250) return "ACTIVE";
  if (score >= 100) return "RISING";
  if (score >= 50) return "BEGINNER";
  return "NEW";
}

// ============ CITIRE ON-CHAIN ============
async function getOnChainScore(address) {
  const gm = new ethers.Contract(GM_CONTRACT, gmABI, provider);
  const vote = new ethers.Contract(VOTE_CONTRACT, voteABI, provider);
  const checkIn = new ethers.Contract(CHECKIN_CONTRACT, checkInABI, provider);
  const deploy = new ethers.Contract(DEPLOY_CONTRACT, deployABI, provider);
  const agentGm = new ethers.Contract(AGENT_GM_CONTRACT, agentGMABI, provider);

  const [gmCount, voteCount, checkInCount, deployCount, agentGmCount] = await Promise.all([
    gm.balanceOf(address),
    vote.getUserVotes(address),
    checkIn.getUserCheckIns(address),
    deploy.getUserDeploymentCount(address),
    agentGm.totalUserGM(address),
  ]);


  const gateway = new ethers.Contract(AGENT_GATEWAY_CONTRACT, agentGatewayABI, provider);
  const userPartnerTotal = Number(await gateway.getUserTotalActions(address));

  const total =
    Number(gmCount) +
    Number(voteCount) +
    Number(checkInCount) +
    Number(deployCount) +
    Number(agentGmCount) +
    userPartnerTotal;

  return total;
}

// ============ HANDLER ============
export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    await turso.execute(`
      CREATE TABLE IF NOT EXISTS leaderboard (
        address TEXT PRIMARY KEY,
        total_score INTEGER DEFAULT 0,
        badge TEXT DEFAULT 'NEW',
        last_updated INTEGER DEFAULT 0
      )
    `);

    const { address } = JSON.parse(event.body || '{}');

    if (!address || typeof address !== "string" || !address.startsWith("0x") || address.length !== 42) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing or invalid address" }),
      };
    }

    const addressLower = address.toLowerCase();

    const newScore = await getOnChainScore(addressLower);
    const newBadge = getUserBadge(newScore);

    await turso.execute({
      sql: `
        INSERT INTO leaderboard (address, total_score, badge, last_updated)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(address) DO UPDATE SET
          total_score = ?,
          badge = ?,
          last_updated = ?
      `,
      args: [addressLower, newScore, newBadge, Date.now(), newScore, newBadge, Date.now()],
    });

    console.log(`✅ Score recalculat on-chain pentru ${addressLower}: ${newScore}`);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        success: true,
        address: addressLower,
        new_score: newScore,
        badge: newBadge,
      }),
    };
  } catch (error) {
    console.error("❌ Update error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to update score" }),
    };
  }
};

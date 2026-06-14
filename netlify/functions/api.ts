import express from 'express';
import serverless from 'serverless-http';
import cors from 'cors';
import { ethers } from 'ethers';

const app = express();

app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

const BADGE_CONTRACT = '0x39b5aFe768F033672866546C9b07815727648532';

// Test route
app.get('/api/', (req, res) => {
  res.send('<h1>✅ Signature API ONLINE by SilviuASY</h1><p>CORS enabled for Signature</p>');
});

app.post('/api/generate-mint-signature', async (req, res) => {
  const { userAddress, score, nonce } = req.body;

  if (!userAddress?.startsWith('0x') || typeof score !== 'number' || nonce === undefined) {
    return res.status(400).json({ error: 'Invalid parameters' });
  }

  const signerPk = process.env.SIGNER_PRIVATE_KEY;
  if (!signerPk) {
    return res.status(500).json({ error: 'Missing SIGNER_PRIVATE_KEY in environment variables' });
  }

  try {
    const wallet = new ethers.Wallet(signerPk);

    const rawMessageHash = ethers.solidityPackedKeccak256(
      ['address', 'uint256', 'uint256', 'address'],
      [userAddress, BigInt(score), BigInt(nonce), BADGE_CONTRACT]
    );

    const signature = await wallet.signMessage(ethers.getBytes(rawMessageHash));

    console.log(`✅ Signature generated for ${userAddress}`);
    return res.status(200).json({ signature });
  } catch (error) {
    console.error("❌ Error generating signature:", error);
    return res.status(500).json({ error: 'Error generating signature' });
  }
});

// Export pentru Netlify Functions
export const handler = serverless(app);

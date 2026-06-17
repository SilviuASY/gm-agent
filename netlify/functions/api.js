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
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
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

var BADGE_CONTRACT = "0x8002f1e37caEe0D739C298D31D7E1090c22264B0";

app.get("/api/", (req, res) => {
  res.send("<h1>\u2705 Signature API ONLINE by SilviuASY</h1><p>CORS enabled for Signature</p>");
});

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
    // Calculate deadline (expires in 1 hour from now)
    const deadline = Math.floor(Date.now() / 1000) + 3600; // Unix timestamp
    
    const wallet = new import_ethers.ethers.Wallet(signerPk);
    
    // Include deadline in the hash (5 parameters now)
    const rawMessageHash = import_ethers.ethers.solidityPackedKeccak256(
      ["address", "uint256", "uint256", "uint256", "address"],
      [userAddress, BigInt(score), BigInt(nonce), BigInt(deadline), BADGE_CONTRACT]
    );
    
    const signature = await wallet.signMessage(import_ethers.ethers.getBytes(rawMessageHash));
    
    console.log(`✅ Signature generated for ${userAddress} with deadline: ${deadline} (expires in 1 hour)`);
    
    // Return both signature and deadline to the frontend
    return res.status(200).json({ 
      signature,
      deadline
    });
    
  } catch (error) {
    console.error("❌ Error generating signature:", error);
    return res.status(500).json({ error: "Error generating signature" });
  }
});

var handler = (0, import_serverless_http.default)(app);

// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});

const { Keypair } = require('@solana/web3.js');
const bs58 = require('bs58');

const secretKey = Uint8Array.from([130,187,180,227,52,242,149,111,247,120,243,11,152,49,181,82,63,53,120,22,149,255,172,23,95,157,108,146,85,211,192,104,29,36,152,185,80,72,184,46,103,203,57,150,198,222,118,183,185,154,228,222,163,185,176,62,245,173,121,38,94,97,160,241]

); // Replace 'x' with actual values

// Create the Keypair
const keypair = Keypair.fromSecretKey(secretKey);

// Convert the full secret key to Base58
const privateKeyBase58 = bs58.encode(keypair.secretKey);

console.log(privateKeyBase58);

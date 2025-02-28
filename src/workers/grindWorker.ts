import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';

self.onmessage = (e: MessageEvent) => {
  const { letters, position } = e.data;
  let attempts = 0;
  let found = false;
  let keypair: Keypair;
  
  // Send progress updates every 100ms
  const progressInterval = setInterval(() => {
    self.postMessage({
      type: 'progress',
      attempts
    });
  }, 100);
  
  while (!found) {
    attempts++;
    keypair = Keypair.generate();
    const pubkeyString = keypair.publicKey.toBase58();
    
    if (position === "start" && pubkeyString.toLowerCase().startsWith(letters.toLowerCase())) {
      found = true;
    } else if (position === "end" && pubkeyString.toLowerCase().endsWith(letters.toLowerCase())) {
      found = true;
    }
    
    if (found) {
      clearInterval(progressInterval);
      self.postMessage({
        type: 'result',
        data: {
          publicKey: pubkeyString,
          secretKey: bs58.encode(keypair.secretKey),
        },
        attempts
      });
    }
  }
}; 
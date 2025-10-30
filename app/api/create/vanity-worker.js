/**
 * Worker thread for parallel vanity address generation
 * Runs on a separate CPU core to speed up keypair generation
 */

const { parentPort, workerData } = require('worker_threads');
const { Keypair } = require('@solana/web3.js');

if (!parentPort) {
  throw new Error('This script must be run as a worker thread');
}

const { suffix, suffixLower, caseInsensitive, maxAttempts } = workerData;

let attempts = 0;

// Generate keypairs until we find a match or hit max attempts
while (attempts < maxAttempts) {
  attempts++;
  
  const keypair = Keypair.generate();
  const publicKey = keypair.publicKey.toString();
  
  // Check exact match first
  if (publicKey.endsWith(suffix)) {
    parentPort.postMessage({
      found: true,
      keypair: Array.from(keypair.secretKey),
      publicKey,
      attempts,
      exactMatch: true
    });
    process.exit(0);
  }
  
  // Check case-insensitive match if enabled
  if (caseInsensitive && publicKey.toLowerCase().endsWith(suffixLower)) {
    parentPort.postMessage({
      found: true,
      keypair: Array.from(keypair.secretKey),
      publicKey,
      attempts,
      exactMatch: false
    });
    process.exit(0);
  }
  
  // Report progress every 5000 attempts
  if (attempts % 5000 === 0) {
    parentPort.postMessage({
      found: false,
      attempts
    });
  }
}

// Max attempts reached without finding a match
parentPort.postMessage({
  found: false,
  attempts,
  completed: true
});


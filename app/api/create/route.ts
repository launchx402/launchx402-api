import { NextRequest, NextResponse } from 'next/server';
import { X402PaymentHandler } from '@payai/x402-solana/server';
import { Keypair, Connection } from '@solana/web3.js';
import bs58 from 'bs58';
import { Worker } from 'worker_threads';
import * as os from 'os';
import * as path from 'path';

// USDC Mint Addresses
const USDC_MINT_DEVNET = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';
const USDC_MINT_MAINNET = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

// Determine network and USDC mint based on environment
const NETWORK = process.env.NEXT_PUBLIC_NETWORK || 'solana-devnet';
const IS_MAINNET = NETWORK === 'solana';
const USDC_MINT = IS_MAINNET ? USDC_MINT_MAINNET : USDC_MINT_DEVNET;

// Initialize X402 Payment Handler
const x402 = new X402PaymentHandler({
  network: NETWORK as 'solana' | 'solana-devnet',
  treasuryAddress: process.env.TREASURY_WALLET_ADDRESS || '',
  facilitatorUrl: process.env.FACILITATOR_URL || 'https://facilitator.payai.network',
  rpcUrl: IS_MAINNET 
    ? process.env.NEXT_PUBLIC_SOLANA_RPC_MAINNET 
    : process.env.NEXT_PUBLIC_SOLANA_RPC_DEVNET,
});

// Base URL for resources - ensure it has a protocol
let BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
if (!BASE_URL.startsWith('http://') && !BASE_URL.startsWith('https://')) {
  BASE_URL = `https://${BASE_URL}`;
}

// PumpPortal API Key
const PUMP_PORTAL_API_KEY = process.env.PUMP_PORTAL_API_KEY || '';

// Vanity address suffix (default: empty = disabled)
const VANITY_SUFFIX = process.env.VANITY_SUFFIX || '';

// Enable multi-threaded vanity generation (default: true)
const USE_WORKERS = process.env.VANITY_USE_WORKERS !== 'false';

// Function to generate vanity keypair using worker threads (multi-core)
async function generateVanityKeypairWithWorkers(suffix: string, maxAttempts: number = 1000000): Promise<Keypair> {
  const suffixLower = suffix.toLowerCase();
  const caseInsensitive = suffix !== suffixLower;
  
  // Determine number of workers (use CPU cores, max 8)
  const numCores = os.cpus().length;
  const numWorkers = Math.min(numCores, 8);
  const attemptsPerWorker = Math.ceil(maxAttempts / numWorkers);
  
  console.log(`Spawning ${numWorkers} workers for parallel vanity search...`);
  const startTime = Date.now();
  
  return new Promise((resolve, reject) => {
    const workers: Worker[] = [];
    let completed = 0;
    let totalAttempts = 0;
    let found = false;
    
    // Create workers
    for (let i = 0; i < numWorkers; i++) {
      const workerPath = path.join(process.cwd(), 'app', 'api', 'create', 'vanity-worker.js');
      
      const worker = new Worker(workerPath, {
        workerData: {
          suffix,
          suffixLower,
          caseInsensitive,
          maxAttempts: attemptsPerWorker
        }
      });
      
      workers.push(worker);
      
      worker.on('message', (msg) => {
        if (found) return; // Already found a match
        
        if (msg.found) {
          found = true;
          totalAttempts += msg.attempts;
          
          // Terminate all workers
          workers.forEach(w => w.terminate());
          
          // Reconstruct keypair from secret key
          const keypair = Keypair.fromSecretKey(new Uint8Array(msg.keypair));
          
          const duration = ((Date.now() - startTime) / 1000).toFixed(2);
          const rate = Math.round(totalAttempts / (Date.now() - startTime) * 1000);
          
          if (msg.exactMatch) {
            console.log(`Found vanity address after ${totalAttempts.toLocaleString()} attempts in ${duration}s (${rate.toLocaleString()}/s)!`);
          } else {
            console.log(`Found case-variant vanity address after ${totalAttempts.toLocaleString()} attempts in ${duration}s (${rate.toLocaleString()}/s)!`);
          }
          console.log(`Public Key: ${msg.publicKey}`);
          
          resolve(keypair);
        } else if (msg.completed) {
          completed++;
          totalAttempts += msg.attempts;
          
          if (completed === numWorkers) {
            // All workers finished without finding a match
            workers.forEach(w => w.terminate());
            
            console.warn(`Could not find vanity address ending in "${suffix}" after ${totalAttempts.toLocaleString()} attempts. Using random keypair.`);
            resolve(Keypair.generate());
          }
        } else {
          // Progress update
          totalAttempts += 5000; // Approximate based on progress reports
        }
      });
      
      worker.on('error', (error) => {
        console.error('Worker error:', error);
        workers.forEach(w => w.terminate());
        reject(error);
      });
      
      worker.on('exit', (code) => {
        if (code !== 0 && !found) {
          console.error(`Worker stopped with exit code ${code}`);
        }
      });
    }
  });
}

// Function to generate vanity keypair ending in specified suffix (single-threaded fallback)
function generateVanityKeypair(suffix: string, maxAttempts: number = 300000): Keypair {
  if (!suffix) {
    // If no suffix specified, just return random keypair
    return Keypair.generate();
  }

  // Validate suffix contains only Base58 characters
  // Base58 alphabet: 123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz
  // NOTE: Excludes 0, O, I, l to avoid confusion
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
  if (!base58Regex.test(suffix)) {
    console.error(`Invalid vanity suffix "${suffix}": Must only contain Base58 characters (excludes 0, O, I, l)`);
    console.error(`Valid characters: 123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz`);
    console.warn(`Using random keypair instead.`);
    return Keypair.generate();
  }

  console.log(`Searching for keypair ending in "${suffix}"...`);
  let attempts = 0;
  const startTime = Date.now();
  
  // Pre-compute lowercase suffix for case-insensitive matching (doubles success rate)
  const suffixLower = suffix.toLowerCase();
  const caseInsensitive = suffix !== suffixLower;
  
  // Batch size for generating multiple keypairs at once (reduces overhead)
  const batchSize = 100;
  
  while (attempts < maxAttempts) {
    // Generate a batch of keypairs (10-20% faster than one-by-one)
    const batch: Array<{ keypair: Keypair; publicKey: string }> = [];
    const remaining = maxAttempts - attempts;
    const currentBatchSize = Math.min(batchSize, remaining);
    
    for (let i = 0; i < currentBatchSize; i++) {
      const keypair = Keypair.generate();
      batch.push({
        keypair,
        publicKey: keypair.publicKey.toString()
      });
    }
    
    attempts += currentBatchSize;
    
    // Check all keypairs in the batch
    for (const { keypair, publicKey } of batch) {
      // Check exact match first (faster)
      if (publicKey.endsWith(suffix)) {
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        const rate = Math.round(attempts / (Date.now() - startTime) * 1000);
        console.log(`Found vanity address after ${attempts.toLocaleString()} attempts in ${duration}s (${rate.toLocaleString()}/s)!`);
        console.log(`Public Key: ${publicKey}`);
        return keypair;
      }
      
      // If case-insensitive, also check lowercase version (improves success rate)
      if (caseInsensitive && publicKey.toLowerCase().endsWith(suffixLower)) {
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        const rate = Math.round(attempts / (Date.now() - startTime) * 1000);
        console.log(`Found case-variant vanity address after ${attempts.toLocaleString()} attempts in ${duration}s (${rate.toLocaleString()}/s)!`);
        console.log(`Public Key: ${publicKey} (matches "${suffix}" case-insensitively)`);
        return keypair;
      }
    }
    
    // Log progress every 10000 attempts
    if (attempts % 10000 === 0 || attempts === maxAttempts) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const rate = Math.round(attempts / (Date.now() - startTime) * 1000);
      console.log(`Checked ${attempts.toLocaleString()} keypairs in ${elapsed}s (${rate.toLocaleString()}/s)...`);
    }
  }
  
  // Max attempts reached, fall back to random keypair
  console.warn(`Could not find vanity address ending in "${suffix}" after ${maxAttempts} attempts. Using random keypair.`);
  return Keypair.generate();
}

// Main vanity generation function (chooses between workers and single-threaded)
async function generateVanityKeypairAsync(suffix: string, maxAttempts: number = 1000000): Promise<Keypair> {
  if (!suffix) {
    return Keypair.generate();
  }

  // Validate suffix contains only Base58 characters
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
  if (!base58Regex.test(suffix)) {
    console.error(`Invalid vanity suffix "${suffix}": Must only contain Base58 characters (excludes 0, O, I, l)`);
    console.error(`Valid characters: 123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz`);
    console.warn(`Using random keypair instead.`);
    return Keypair.generate();
  }

  // Use workers if enabled and suffix is 3+ characters (worth the overhead)
  if (USE_WORKERS && suffix.length >= 3) {
    try {
      return await generateVanityKeypairWithWorkers(suffix, maxAttempts);
    } catch (error) {
      console.error('Worker-based generation failed, falling back to single-threaded:', error);
      // Use lower limit for single-threaded fallback
      return generateVanityKeypair(suffix, 300000);
    }
  } else {
    // Use single-threaded for short suffixes or if workers disabled
    // Use lower limit since single-threaded is slower
    const singleThreadedMax = Math.min(maxAttempts, 300000);
    return generateVanityKeypair(suffix, singleThreadedMax);
  }
}

// CORS headers helper
const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-PAYMENT, Authorization, access-control-expose-headers',
  'Access-Control-Expose-Headers': 'X-PAYMENT, WWW-Authenticate, X-Payment-Required',
};

export async function POST(req: NextRequest) {
  try {
    // 1. Extract payment header
    const paymentHeader = x402.extractPayment(req.headers);
    
    // 2. Create payment requirements - $1.00 USDC for token creation
    const paymentRequirements = await x402.createPaymentRequirements({
      price: {
        amount: "1000000",  // $1.00 USDC (in micro-units, as string)
        asset: {
          address: USDC_MINT,
          decimals: 6
        }
      },
      network: NETWORK as 'solana' | 'solana-devnet',
      config: {
        description: 'Launch Pump.fun Token - LaunchX402',
        resource: `${BASE_URL}/api/create` as `${string}://${string}`,
        mimeType: 'application/json',
        maxTimeoutSeconds: 600, // 10 minutes for token creation
        outputSchema: {
          input: {
            type: 'http',
            method: 'POST',
            bodyType: 'json',
            bodyFields: {
              imageUrl: {
                type: 'string',
                required: true,
                description: 'Token image URL (must be publicly accessible)'
              },
              name: {
                type: 'string',
                required: true,
                description: 'Token name'
              },
              symbol: {
                type: 'string',
                required: true,
                description: 'Token symbol'
              },
              description: {
                type: 'string',
                required: true,
                description: 'Token description'
              },
              twitter: {
                type: 'string',
                required: false,
                description: 'Twitter URL'
              },
              telegram: {
                type: 'string',
                required: false,
                description: 'Telegram URL'
              },
              website: {
                type: 'string',
                required: false,
                description: 'Website URL'
              },
              slippage: {
                type: 'number',
                required: false,
                description: 'Slippage tolerance (default: 10)'
              },
              priorityFee: {
                type: 'number',
                required: false,
                description: 'Priority fee in SOL (default: 0.0005)'
              }
            }
          },
          output: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              signature: { type: 'string' },
              mint: { type: 'string' },
              metadataUri: { type: 'string' },
              message: { type: 'string' }
            }
          }
        }
      }
    });
    
    if (!paymentHeader) {
      // Return 402 with payment requirements
      const response = x402.create402Response(paymentRequirements);
      return NextResponse.json(response.body, { 
        status: response.status,
        headers: corsHeaders
      });
    }

    // 3. Verify payment
    const verified = await x402.verifyPayment(paymentHeader, paymentRequirements);
    if (!verified) {
      return NextResponse.json(
        { error: 'Invalid payment', success: false }, 
        { status: 402, headers: corsHeaders }
      );
    }

    // 4. Process token creation
    const body = await req.json();
    
    // Extract request data
    const {
      imageUrl,
      name,
      symbol,
      description,
      twitter = '',
      telegram = '',
      website = '',
      slippage = 10,
      priorityFee = 0.0005
    } = body;

    // Fixed initial buy amount
    const amount = 0.02; // Locked to 0.02 SOL

    // Validate required fields
    if (!imageUrl || !name || !symbol || !description) {
      return NextResponse.json(
        { 
          error: 'Missing required fields', 
          success: false,
          required: ['imageUrl', 'name', 'symbol', 'description']
        }, 
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate image URL
    try {
      new URL(imageUrl);
    } catch {
      return NextResponse.json(
        { error: 'Invalid image URL', success: false }, 
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate API key
    if (!PUMP_PORTAL_API_KEY) {
      console.error('PUMP_PORTAL_API_KEY not configured');
      return NextResponse.json(
        { error: 'Service configuration error', success: false }, 
        { status: 500, headers: corsHeaders }
      );
    }

    // Generate a vanity keypair for token mint (ending in configured suffix)
    const mintKeypair = await generateVanityKeypairAsync(VANITY_SUFFIX);

    // Fetch the image from the URL
    console.log('Fetching image from URL:', imageUrl);
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch image from URL', success: false }, 
        { status: 400, headers: corsHeaders }
      );
    }
    const imageBlob = await imageResponse.blob();

    // Create IPFS metadata storage
    const metadataFormData = new FormData();
    metadataFormData.append('file', imageBlob, 'token-image.png');
    metadataFormData.append('name', name);
    metadataFormData.append('symbol', symbol);
    metadataFormData.append('description', description);
    if (twitter) metadataFormData.append('twitter', twitter);
    if (telegram) metadataFormData.append('telegram', telegram);
    if (website) metadataFormData.append('website', website);
    metadataFormData.append('showName', 'true');

    console.log('Creating IPFS metadata...');
    const metadataResponse = await fetch('https://pump.fun/api/ipfs', {
      method: 'POST',
      body: metadataFormData,
    });

    if (!metadataResponse.ok) {
      const errorText = await metadataResponse.text();
      console.error('IPFS metadata creation failed:', errorText);
      return NextResponse.json(
        { 
          error: 'Failed to create token metadata', 
          success: false,
          details: errorText
        }, 
        { status: 500, headers: corsHeaders }
      );
    }

    const metadataResponseJSON = await metadataResponse.json();
    console.log('Metadata created:', metadataResponseJSON);

    // Send the create transaction to PumpPortal
    console.log('Sending create transaction to PumpPortal...');
    const createResponse = await fetch(`https://pumpportal.fun/api/trade?api-key=${PUMP_PORTAL_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'create',
        tokenMetadata: {
          name: metadataResponseJSON.metadata.name,
          symbol: metadataResponseJSON.metadata.symbol,
          uri: metadataResponseJSON.metadataUri
        },
        mint: bs58.encode(mintKeypair.secretKey),
        denominatedInSol: 'true',
        amount: amount,
        slippage: slippage,
        priorityFee: priorityFee,
        pool: 'pump'
      })
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('Token creation failed:', errorText);
      return NextResponse.json(
        { 
          error: 'Token creation failed', 
          success: false,
          details: errorText
        }, 
        { status: 500, headers: corsHeaders }
      );
    }

    const createData = await createResponse.json();
    console.log('PumpPortal response:', createData);

    // Verify the transaction actually succeeded on-chain
    if (createData.signature) {
      console.log('Verifying transaction on-chain:', createData.signature);
      
      try {
        // Connect to Solana RPC
        const rpcUrl = IS_MAINNET 
          ? process.env.NEXT_PUBLIC_SOLANA_RPC_MAINNET || 'https://api.mainnet-beta.solana.com'
          : process.env.NEXT_PUBLIC_SOLANA_RPC_DEVNET || 'https://api.devnet.solana.com';
        
        const connection = new Connection(rpcUrl, 'confirmed');
        
        // Wait a moment for transaction to propagate
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Get transaction details
        const txDetails = await connection.getTransaction(createData.signature, {
          maxSupportedTransactionVersion: 0,
          commitment: 'confirmed'
        });

        if (!txDetails) {
          console.error('Transaction not found on-chain:', createData.signature);
          return NextResponse.json(
            { 
              error: 'Transaction verification failed', 
              success: false,
              message: 'Transaction not found on Solana network. Please try again.',
              signature: createData.signature
            }, 
            { status: 500, headers: corsHeaders }
          );
        }

        // Check if transaction succeeded
        if (txDetails.meta?.err) {
          console.error('Transaction failed on-chain:', txDetails.meta.err);
          
          // Provide helpful error message
          let errorMessage = 'Token creation transaction failed on-chain.';
          const errString = JSON.stringify(txDetails.meta.err);
          
          if (errString.includes('insufficient')) {
            errorMessage = 'Insufficient funds in wallet to cover transaction. Please add SOL to your PumpPortal wallet and try again.';
          } else if (errString.includes('slippage')) {
            errorMessage = 'Transaction failed due to slippage. Try increasing slippage tolerance.';
          }
          
          return NextResponse.json(
            { 
              error: 'Transaction failed', 
              success: false,
              message: errorMessage,
              signature: createData.signature,
              solscanUrl: `https://solscan.io/tx/${createData.signature}`,
              details: txDetails.meta.err
            }, 
            { status: 500, headers: corsHeaders }
          );
        }

        console.log('Transaction verified successfully on-chain!');
      } catch (verifyError) {
        console.error('Error verifying transaction:', verifyError);
        // Continue anyway, as PumpPortal returned success
        console.warn('Could not verify transaction, but PumpPortal reported success. Proceeding...');
      }
    }

    // 5. Settle payment (only after transaction verified)
    await x402.settlePayment(paymentHeader, paymentRequirements);

    // 6. Return success response
    const result = {
      success: true,
      signature: createData.signature,
      mint: mintKeypair.publicKey.toBase58(),
      metadataUri: metadataResponseJSON.metadataUri,
      message: 'Token launched successfully on Pump.fun',
      solscanUrl: `https://solscan.io/tx/${createData.signature}`,
      tokenDetails: {
        name,
        symbol,
        description,
        initialBuy: '0.02 SOL'
      }
    };

    return NextResponse.json(result, {
      headers: corsHeaders
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500, headers: corsHeaders }
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      ...corsHeaders,
      'Access-Control-Max-Age': '86400',
    },
  });
}


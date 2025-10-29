import { NextRequest, NextResponse } from 'next/server';
import { X402PaymentHandler } from '@payai/x402-solana/server';
import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';

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
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, X-PAYMENT',
        }
      });
    }

    // 3. Verify payment
    const verified = await x402.verifyPayment(paymentHeader, paymentRequirements);
    if (!verified) {
      return NextResponse.json(
        { error: 'Invalid payment', success: false }, 
        { status: 402 }
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
        { status: 400 }
      );
    }

    // Validate image URL
    try {
      new URL(imageUrl);
    } catch {
      return NextResponse.json(
        { error: 'Invalid image URL', success: false }, 
        { status: 400 }
      );
    }

    // Validate API key
    if (!PUMP_PORTAL_API_KEY) {
      console.error('PUMP_PORTAL_API_KEY not configured');
      return NextResponse.json(
        { error: 'Service configuration error', success: false }, 
        { status: 500 }
      );
    }

    // Generate a random keypair for token mint
    const mintKeypair = Keypair.generate();

    // Fetch the image from the URL
    console.log('Fetching image from URL:', imageUrl);
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch image from URL', success: false }, 
        { status: 400 }
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
        { status: 500 }
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
        { status: 500 }
      );
    }

    const createData = await createResponse.json();
    console.log('Token created successfully:', createData);

    // 5. Settle payment
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
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-PAYMENT',
      }
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-PAYMENT',
    },
  });
}


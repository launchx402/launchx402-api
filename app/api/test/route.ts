import { NextRequest, NextResponse } from 'next/server';
import { X402PaymentHandler } from '@payai/x402-solana/server';

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
// Add https:// if protocol is missing and not localhost
if (!BASE_URL.startsWith('http://') && !BASE_URL.startsWith('https://')) {
  BASE_URL = `https://${BASE_URL}`;
}

export async function GET(req: NextRequest) {
  try {
    // 1. Extract payment header
    const paymentHeader = x402.extractPayment(req.headers);
    
    // 2. Create payment requirements using x402 RouteConfig format
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
        description: 'Test API Request - x402scan Demo',
        resource: `${BASE_URL}/api/test` as `${string}://${string}`,
        mimeType: 'application/json',
        maxTimeoutSeconds: 300,
        outputSchema: {
          input: {
            type: 'http',
            method: 'GET',
            queryParams: {
              message: {
                type: 'string',
                required: false,
                description: 'Optional message to include in response'
              }
            }
          },
          output: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              timestamp: { type: 'number' },
              network: { type: 'string' },
              paid: { type: 'boolean' }
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
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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

    // 4. Process business logic
    const { searchParams } = new URL(req.url);
    const customMessage = searchParams.get('message');

    const result = {
      success: true,
      message: customMessage || 'Payment verified! Welcome to x402 API testing.',
      timestamp: Date.now(),
      network: NETWORK,
      paid: true,
      info: {
        service: 'x402scan Test API',
        description: 'This is a demo endpoint for testing x402 payment protocol on Solana',
        cost: '$1.00 USDC',
        provider: 'Launch x402'
      }
    };

    // 5. Settle payment
    await x402.settlePayment(paymentHeader, paymentRequirements);

    // 6. Return response
    return NextResponse.json(result, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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

export async function POST(req: NextRequest) {
  try {
    // 1. Extract payment header
    const paymentHeader = x402.extractPayment(req.headers);
    
    // 2. Create payment requirements using x402 RouteConfig format
    const paymentRequirements = await x402.createPaymentRequirements({
      price: {
        amount: "2500000",  // $2.50 USDC (in micro-units, as string)
        asset: {
          address: USDC_MINT,
          decimals: 6
        }
      },
      network: NETWORK as 'solana' | 'solana-devnet',
      config: {
        description: 'Test API POST Request - x402scan Demo',
        resource: `${BASE_URL}/api/test` as `${string}://${string}`,
        mimeType: 'application/json',
        maxTimeoutSeconds: 300,
        outputSchema: {
          input: {
            type: 'http',
            method: 'POST',
            bodyType: 'json',
            bodyFields: {
              action: {
                type: 'string',
                required: true,
                description: 'Action to perform',
                enum: ['echo', 'process', 'analyze']
              },
              data: {
                type: 'string',
                required: false,
                description: 'Data to process'
              },
              options: {
                type: 'object',
                required: false,
                description: 'Additional options',
                properties: {
                  verbose: {
                    type: 'boolean',
                    description: 'Return verbose output'
                  },
                  format: {
                    type: 'string',
                    enum: ['json', 'text'],
                    description: 'Output format'
                  }
                }
              }
            }
          },
          output: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              action: { type: 'string' },
              result: { type: 'any' },
              timestamp: { type: 'number' },
              network: { type: 'string' },
              paid: { type: 'boolean' }
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
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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

    // 4. Process business logic
    const body = await req.json();
    const { action = 'echo', data = '', options = {} } = body;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let result: Record<string, any>;
    switch (action) {
      case 'echo':
        result = {
          success: true,
          action,
          result: data || 'No data provided',
          echo: data,
          timestamp: Date.now(),
          network: NETWORK,
          paid: true
        };
        break;
      
      case 'process':
        result = {
          success: true,
          action,
          result: `Processed: ${data}`,
          processed: {
            original: data,
            length: data.length,
            uppercase: data.toUpperCase(),
            reversed: data.split('').reverse().join('')
          },
          timestamp: Date.now(),
          network: NETWORK,
          paid: true
        };
        break;
      
      case 'analyze':
        result = {
          success: true,
          action,
          result: 'Analysis complete',
          analysis: {
            input: data,
            type: typeof data,
            length: data.length || 0,
            isEmpty: !data || data.length === 0,
            words: data.split(' ').length
          },
          timestamp: Date.now(),
          network: NETWORK,
          paid: true
        };
        break;
      
      default:
        result = {
          success: false,
          action,
          result: 'Unknown action',
          error: `Action '${action}' is not supported`,
          timestamp: Date.now(),
          network: NETWORK,
          paid: true
        };
    }

    // Add verbose info if requested
    if (options.verbose) {
      result.info = {
        service: 'x402scan Test API',
        description: 'This is a demo endpoint for testing x402 payment protocol on Solana',
        cost: '$2.50 USDC',
        provider: 'Launch x402',
        options: options
      };
    }

    // 5. Settle payment
    await x402.settlePayment(paymentHeader, paymentRequirements);

    // 6. Return response
    return NextResponse.json(result, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-PAYMENT',
    },
  });
}


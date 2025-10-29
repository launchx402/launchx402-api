/**
 * Example Client Implementation for LaunchX402 Token Creation API
 * 
 * This file demonstrates how to use the token creation endpoint
 * with the @payai/x402-solana client package.
 */

import { createX402Client } from '@payai/x402-solana/client';
import type { 
  TokenCreationRequest, 
  TokenCreationResponse,
  TokenCreationError,
  X402Response 
} from './types';

/**
 * Example 1: Basic Token Creation with Payment
 * 
 * This shows the simplest way to create a token.
 */
export async function createToken(
  wallet: any,
  config: TokenCreationRequest,
  apiUrl: string = 'https://api.launchx402.fun/api/create'
): Promise<TokenCreationResponse> {
  // Create x402 client
  const client = createX402Client({
    wallet,
    network: 'solana-devnet',
    maxPaymentAmount: BigInt(1_000_000), // 1 USDC max
  });

  try {
    // Make paid request
    const response = await client.fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Token creation failed');
    }

    console.log('Token created successfully!');
    console.log('Mint Address:', result.mint);
    console.log('Transaction:', result.signature);
    console.log('View on Solscan:', result.solscanUrl);

    return result;
  } catch (error) {
    console.error('Error creating token:', error);
    throw error;
  }
}

/**
 * Example 2: Create Token Without Payment (Get 402 Response)
 * 
 * This demonstrates getting payment requirements without paying.
 */
export async function getPaymentRequirements(
  config: TokenCreationRequest,
  apiUrl: string = 'https://api.launchx402.fun/api/create'
): Promise<X402Response> {
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });

    const data = await response.json();

    if (response.status === 402) {
      console.log('Payment Required:');
      console.log('Amount:', parseFloat(data.accepts[0].maxAmountRequired) / 1_000_000, 'USDC');
      console.log('Treasury:', data.accepts[0].payTo);
      console.log('Network:', data.accepts[0].network);
      return data;
    }

    throw new Error('Expected 402 response but got ' + response.status);
  } catch (error) {
    console.error('Error getting payment requirements:', error);
    throw error;
  }
}

/**
 * Example 3: Create Token with Full Configuration
 * 
 * Shows all available options including social links and custom settings.
 */
export async function createTokenWithOptions(wallet: any) {
  const config: TokenCreationRequest = {
    imageUrl: 'https://i.imgur.com/example.png',
    name: 'My Awesome Token',
    symbol: 'MAT',
    description: 'The most amazing token on Solana with full social integration',
    twitter: 'https://x.com/mytoken',
    telegram: 'https://t.me/mytoken',
    website: 'https://mytoken.com',
    slippage: 10,
    priorityFee: 0.001,
  };

  return await createToken(wallet, config);
}

/**
 * Example 4: Batch Token Creation
 * 
 * Create multiple tokens sequentially.
 */
export async function createMultipleTokens(
  wallet: any,
  tokens: TokenCreationRequest[]
): Promise<TokenCreationResponse[]> {
  const client = createX402Client({
    wallet,
    network: 'solana-devnet',
    maxPaymentAmount: BigInt(10_000_000), // 10 USDC max for batch
  });

  const results: TokenCreationResponse[] = [];

  for (const tokenConfig of tokens) {
    try {
      console.log(`Creating token: ${tokenConfig.name}...`);
      
      const response = await client.fetch('https://api.launchx402.fun/api/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tokenConfig),
      });

      const result = await response.json();
      
      if (result.success) {
        console.log(`✅ ${tokenConfig.name} created: ${result.mint}`);
        results.push(result);
      } else {
        console.error(`❌ ${tokenConfig.name} failed: ${result.error}`);
      }

      // Wait a bit between creations
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`Error creating ${tokenConfig.name}:`, error);
    }
  }

  return results;
}

/**
 * Example 5: Create Token with Error Handling
 * 
 * Demonstrates proper error handling for various failure scenarios.
 */
export async function createTokenWithErrorHandling(
  wallet: any,
  config: TokenCreationRequest
): Promise<TokenCreationResponse | TokenCreationError> {
  const client = createX402Client({
    wallet,
    network: 'solana-devnet',
    maxPaymentAmount: BigInt(1_000_000),
  });

  try {
    const response = await client.fetch('https://api.launchx402.fun/api/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });

    const result = await response.json();

    if (!result.success) {
      // Handle specific error cases
      if (result.error === 'Missing required fields') {
        console.error('Validation error. Required fields:', result.required);
      } else if (result.error === 'Failed to fetch image from URL') {
        console.error('Image URL is not accessible:', config.imageUrl);
      } else if (result.error === 'Invalid payment') {
        console.error('Payment verification failed. Check your wallet balance.');
      } else {
        console.error('Unknown error:', result.error);
      }
      
      return result;
    }

    return result;
  } catch (error) {
    console.error('Network or client error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Example 6: React Component Usage
 * 
 * Shows how to integrate with React and wallet adapters.
 */
/*
import { useWallet } from '@solana/wallet-adapter-react';

export function TokenCreator() {
  const { wallet } = useWallet();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TokenCreationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCreateToken = async () => {
    if (!wallet?.adapter) {
      setError('Please connect your wallet');
      return;
    }

    setLoading(true);
    setError(null);

    const config: TokenCreationRequest = {
      imageUrl: 'https://i.imgur.com/example.png',
      name: 'My Token',
      symbol: 'MTK',
      description: 'An amazing token',
    };

    try {
      const response = await createToken(wallet.adapter, config);
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create token');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={handleCreateToken} disabled={loading || !wallet}>
        {loading ? 'Creating Token...' : 'Launch Token ($0.10 USDC)'}
      </button>
      
      {error && <div className="error">{error}</div>}
      
      {result && (
        <div className="success">
          <h3>Token Created!</h3>
          <p>Name: {result.tokenDetails.name}</p>
          <p>Symbol: {result.tokenDetails.symbol}</p>
          <p>Mint: {result.mint}</p>
          <a href={result.solscanUrl} target="_blank">View on Solscan</a>
        </div>
      )}
    </div>
  );
}
*/

/**
 * Example 7: Simple Quick Launch
 * 
 * Minimal example for quick token creation.
 */
export async function quickLaunch(wallet: any, imageUrl: string, name: string, symbol: string) {
  const client = createX402Client({
    wallet,
    network: 'solana-devnet',
    maxPaymentAmount: BigInt(1_000_000),
  });

  const response = await client.fetch('https://api.launchx402.fun/api/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      imageUrl,
      name,
      symbol,
      description: `${name} - Launched via LaunchX402`,
    }),
  });

  return await response.json();
}

/**
 * Example 8: Verify Token Created
 * 
 * Check if a token was successfully created by verifying the transaction.
 */
export async function verifyTokenCreation(
  signature: string,
  network: 'devnet' | 'mainnet-beta' = 'devnet'
): Promise<boolean> {
  try {
    const url = `https://api.${network}.solana.com`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getTransaction',
        params: [signature, { encoding: 'json' }],
      }),
    });

    const data = await response.json();
    
    if (data.result && data.result.meta && data.result.meta.err === null) {
      console.log('✅ Transaction confirmed on blockchain');
      return true;
    }

    console.log('❌ Transaction not found or failed');
    return false;
  } catch (error) {
    console.error('Error verifying transaction:', error);
    return false;
  }
}

/**
 * Example 9: Cost Calculator
 * 
 * Calculate total cost before creating token.
 */
export function calculateTotalCost(initialBuyAmountSOL: number = 0.02): {
  apiFeUSDC: number;
  initialBuySOL: number;
  gasFeeSOL: number;
  totalUSDC: number;
  totalSOL: number;
} {
  return {
    apiFeUSDC: 0.10,
    initialBuySOL: initialBuyAmountSOL,
    gasFeeSOL: 0.0005,
    totalUSDC: 0.10,
    totalSOL: initialBuyAmountSOL + 0.0005,
  };
}

/**
 * Usage Examples:
 * 
 * // Basic usage
 * const result = await createToken(wallet, {
 *   imageUrl: 'https://i.imgur.com/example.png',
 *   name: 'My Token',
 *   symbol: 'MTK',
 *   description: 'An amazing token'
 * });
 * 
 * // Check payment requirements first
 * const requirements = await getPaymentRequirements({
 *   imageUrl: 'https://i.imgur.com/example.png',
 *   name: 'My Token',
 *   symbol: 'MTK',
 *   description: 'An amazing token'
 * });
 * 
 * // Quick launch
 * const token = await quickLaunch(
 *   wallet, 
 *   'https://i.imgur.com/example.png',
 *   'My Token',
 *   'MTK'
 * );
 */


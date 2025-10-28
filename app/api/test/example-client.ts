/**
 * Example Client Implementation for Testing the x402 API
 * 
 * This file demonstrates how to use the x402 Test API endpoint
 * with the @payai/x402-solana client package.
 */

import { createX402Client } from '@payai/x402-solana/client';
// import { useSolanaWallets } from '@privy-io/react-auth/solana';

/**
 * Example: Basic GET Request
 * 
 * This example shows how to make a simple GET request
 * to the test API endpoint.
 */
export async function exampleGetRequest(wallet: any) {
  // Create x402 client
  const client = createX402Client({
    wallet,
    network: 'solana-devnet',
    maxPaymentAmount: BigInt(10_000_000), // Optional: max 10 USDC
  });

  try {
    // Make a paid GET request
    const response = await client.fetch('http://localhost:3000/api/test?message=Hello%20from%20x402', {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('GET Request Result:', result);
    return result;
  } catch (error) {
    console.error('Error making GET request:', error);
    throw error;
  }
}

/**
 * Example: POST Request with Echo Action
 * 
 * This example shows how to make a POST request
 * with the "echo" action.
 */
export async function exampleEchoRequest(wallet: any, data: string) {
  const client = createX402Client({
    wallet,
    network: 'solana-devnet',
    maxPaymentAmount: BigInt(10_000_000),
  });

  try {
    const response = await client.fetch('http://localhost:3000/api/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'echo',
        data: data,
        options: {
          verbose: true,
          format: 'json'
        }
      }),
    });

    const result = await response.json();
    console.log('Echo Request Result:', result);
    return result;
  } catch (error) {
    console.error('Error making echo request:', error);
    throw error;
  }
}

/**
 * Example: POST Request with Process Action
 * 
 * This example shows how to make a POST request
 * with the "process" action to transform text.
 */
export async function exampleProcessRequest(wallet: any, text: string) {
  const client = createX402Client({
    wallet,
    network: 'solana-devnet',
    maxPaymentAmount: BigInt(10_000_000),
  });

  try {
    const response = await client.fetch('http://localhost:3000/api/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'process',
        data: text,
        options: {
          verbose: true
        }
      }),
    });

    const result = await response.json();
    console.log('Process Request Result:', result);
    console.log('Original:', result.processed.original);
    console.log('Uppercase:', result.processed.uppercase);
    console.log('Reversed:', result.processed.reversed);
    return result;
  } catch (error) {
    console.error('Error making process request:', error);
    throw error;
  }
}

/**
 * Example: POST Request with Analyze Action
 * 
 * This example shows how to make a POST request
 * with the "analyze" action to get text statistics.
 */
export async function exampleAnalyzeRequest(wallet: any, text: string) {
  const client = createX402Client({
    wallet,
    network: 'solana-devnet',
    maxPaymentAmount: BigInt(10_000_000),
  });

  try {
    const response = await client.fetch('http://localhost:3000/api/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'analyze',
        data: text,
        options: {
          verbose: false
        }
      }),
    });

    const result = await response.json();
    console.log('Analyze Request Result:', result);
    console.log('Analysis:', result.analysis);
    return result;
  } catch (error) {
    console.error('Error making analyze request:', error);
    throw error;
  }
}

/**
 * Example: React Component Usage
 * 
 * This example shows how to use the x402 client
 * in a React component with Privy.
 */
/*
import { useSolanaWallets } from '@privy-io/react-auth/solana';

export function TestAPIComponent() {
  const { wallets } = useSolanaWallets();
  const wallet = wallets[0];
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleTestRequest = async () => {
    if (!wallet) {
      setError('No wallet connected');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await exampleGetRequest(wallet);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button 
        onClick={handleTestRequest}
        disabled={loading || !wallet}
      >
        {loading ? 'Processing...' : 'Test x402 API'}
      </button>

      {error && <div>Error: {error}</div>}
      {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
}
*/

/**
 * Example: Testing without Client (curl equivalent)
 * 
 * This demonstrates what happens when you make a request
 * without the x402 client - you'll receive a 402 response
 * with payment requirements.
 */
export async function exampleWithoutPayment() {
  try {
    const response = await fetch('http://localhost:3000/api/test');
    const data = await response.json();
    
    if (response.status === 402) {
      console.log('Payment Required! Details:');
      console.log('Version:', data.x402Version);
      console.log('Accepts:', data.accepts);
      console.log('Payment Requirements:', JSON.stringify(data, null, 2));
    }
    
    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

/**
 * Example: Batch Multiple Requests
 * 
 * This example shows how to make multiple paid requests
 * efficiently.
 */
export async function exampleBatchRequests(wallet: any) {
  const client = createX402Client({
    wallet,
    network: 'solana-devnet',
    maxPaymentAmount: BigInt(50_000_000), // Higher limit for batch
  });

  try {
    // Make multiple requests in parallel
    const [getResult, echoResult, processResult] = await Promise.all([
      client.fetch('http://localhost:3000/api/test?message=Batch%20GET').then(r => r.json()),
      
      client.fetch('http://localhost:3000/api/test', {
        method: 'POST',
        body: JSON.stringify({ action: 'echo', data: 'Batch echo' })
      }).then(r => r.json()),
      
      client.fetch('http://localhost:3000/api/test', {
        method: 'POST',
        body: JSON.stringify({ action: 'process', data: 'Batch process' })
      }).then(r => r.json()),
    ]);

    console.log('Batch Results:', {
      get: getResult,
      echo: echoResult,
      process: processResult
    });

    return { getResult, echoResult, processResult };
  } catch (error) {
    console.error('Error in batch requests:', error);
    throw error;
  }
}

/**
 * Example: Error Handling
 * 
 * This example shows proper error handling for x402 requests.
 */
export async function exampleWithErrorHandling(wallet: any) {
  const client = createX402Client({
    wallet,
    network: 'solana-devnet',
    maxPaymentAmount: BigInt(10_000_000),
  });

  try {
    const response = await client.fetch('http://localhost:3000/api/test', {
      method: 'POST',
      body: JSON.stringify({
        action: 'invalid_action', // This will trigger an error response
        data: 'test'
      })
    });

    const result = await response.json();

    // Check if the API returned an error (even with 200 status)
    if (!result.success) {
      console.error('API Error:', result.error || result.result);
      return { error: result.error || result.result };
    }

    return result;
  } catch (error) {
    // Handle network errors, payment failures, etc.
    if (error instanceof Error) {
      if (error.message.includes('402')) {
        console.error('Payment failed or insufficient funds');
      } else if (error.message.includes('network')) {
        console.error('Network error:', error.message);
      } else {
        console.error('Unknown error:', error.message);
      }
    }
    throw error;
  }
}


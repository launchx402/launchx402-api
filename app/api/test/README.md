# x402 Test API Endpoint

This is a test API endpoint for demonstrating and testing the x402 payment protocol on Solana. It's designed to be listed on x402scan for public testing.

## Overview

The endpoint provides two methods (GET and POST) that require payment via the x402 protocol before returning results. This demonstrates how to build pay-per-use APIs using Solana and USDC.

## Endpoints

### GET `/api/test`

**Cost:** $1.00 USDC

A simple GET endpoint that returns a success message with optional custom message via query parameter.

**Query Parameters:**
- `message` (optional): Custom message to include in the response

**Example Response:**
```json
{
  "success": true,
  "message": "Payment verified! Welcome to x402 API testing.",
  "timestamp": 1698765432000,
  "network": "solana-devnet",
  "paid": true,
  "info": {
    "service": "x402scan Test API",
    "description": "This is a demo endpoint for testing x402 payment protocol on Solana",
    "cost": "$1.00 USDC",
    "provider": "Launch x402"
  }
}
```

### POST `/api/test`

**Cost:** $2.50 USDC

A more advanced POST endpoint that performs various actions on provided data.

**Request Body:**
```json
{
  "action": "echo" | "process" | "analyze",
  "data": "string (optional)",
  "options": {
    "verbose": boolean,
    "format": "json" | "text"
  }
}
```

**Actions:**
- `echo`: Returns the data as-is
- `process`: Processes the data (uppercase, reverse, etc.)
- `analyze`: Analyzes the data and returns statistics

**Example Response:**
```json
{
  "success": true,
  "action": "process",
  "result": "Processed: hello world",
  "processed": {
    "original": "hello world",
    "length": 11,
    "uppercase": "HELLO WORLD",
    "reversed": "dlrow olleh"
  },
  "timestamp": 1698765432000,
  "network": "solana-devnet",
  "paid": true
}
```

## Setup

1. Install dependencies:
```bash
npm install @payai/x402-solana
```

2. Copy `.env.example` to `.env.local` and fill in the values:
```bash
cp .env.example .env.local
```

3. Required environment variables:
   - `TREASURY_WALLET_ADDRESS`: Your Solana wallet address where payments will be sent
   - `NEXT_PUBLIC_BASE_URL`: Your application's base URL
   - `NEXT_PUBLIC_NETWORK`: Either `solana` (mainnet) or `solana-devnet`

4. Start the development server:
```bash
npm run dev
```

## Testing Locally

### Without x402 Client (Will receive 402 response)

```bash
# GET request
curl http://localhost:3000/api/test

# POST request
curl -X POST http://localhost:3000/api/test \
  -H "Content-Type: application/json" \
  -d '{"action":"echo","data":"test"}'
```

This will return a 402 Payment Required response with payment requirements.

### With x402 Client

Use the `@payai/x402-solana/client` package to make paid requests:

```typescript
import { createX402Client } from '@payai/x402-solana/client';

const client = createX402Client({
  wallet,
  network: 'solana-devnet',
  maxPaymentAmount: BigInt(10_000_000), // 10 USDC max
});

// Make paid GET request
const response = await client.fetch('http://localhost:3000/api/test?message=hello');
const result = await response.json();

// Make paid POST request
const postResponse = await client.fetch('http://localhost:3000/api/test', {
  method: 'POST',
  body: JSON.stringify({
    action: 'process',
    data: 'hello world',
    options: { verbose: true }
  })
});
const postResult = await postResponse.json();
```

## x402scan Integration

This endpoint follows the x402scan validation schema, which includes:

- **Proper schema definition**: Both input and output schemas are defined
- **Network support**: Works on both Solana devnet and mainnet
- **CORS enabled**: Allows cross-origin requests for web-based testing
- **Detailed descriptions**: Clear descriptions of what the endpoint does
- **Type safety**: Full TypeScript support with proper types

## Network Support

The API supports both Solana networks:

- **Devnet**: Uses USDC devnet mint `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`
- **Mainnet**: Uses USDC mainnet mint `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`

The network is automatically selected based on the `NEXT_PUBLIC_NETWORK` environment variable.

## Payment Flow

1. Client makes request without payment header
2. Server returns 402 with payment requirements
3. Client signs and submits payment transaction
4. Client retries request with payment header
5. Server verifies payment with facilitator
6. Server processes request and returns result
7. Server settles payment with facilitator

## Error Handling

The API returns appropriate HTTP status codes:

- `200`: Success
- `402`: Payment required or invalid payment
- `500`: Internal server error

## Security Considerations

- Payment verification is done through the x402 facilitator
- All payments are settled after successful request processing
- CORS is enabled for testing but should be restricted in production
- Treasury wallet address should be kept secure and monitored

## Additional Resources

- [x402-solana Documentation](https://www.npmjs.com/package/@payai/x402-solana)
- [x402scan](https://x402scan.com)
- [Solana Documentation](https://docs.solana.com)
- [USDC on Solana](https://www.circle.com/en/usdc-multichain/solana)


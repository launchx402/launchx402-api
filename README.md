# LaunchX402 API

> Launch Pump.fun tokens with crypto payments via the x402 protocol

LaunchX402 is a production-ready API that enables anyone to create and launch tokens on Pump.fun using USDC payments through the x402 payment protocol. Pay $1.00 USDC per token launch (initial buy included!).

🔗 **Live API:** [api.launchx402.fun](https://api.launchx402.fun)

## Features

- ✅ **Pay-per-use** - $1.00 USDC per token creation (initial buy included)
- ✅ **Instant launches** - Tokens deployed to Pump.fun in seconds
- ✅ **x402 protocol** - Decentralized, trustless payments
- ✅ **Zero setup** - No API keys or accounts needed (for consumers)
- ✅ **Multi-network** - Supports Solana devnet and mainnet
- ✅ **Type-safe** - Full TypeScript support
- ✅ **Well documented** - Complete examples and guides

## Quick Start

### For API Consumers

Install the x402 client:

```bash
npm install @payai/x402-solana
```

Create a token:

```typescript
import { createX402Client } from '@payai/x402-solana/client';

const client = createX402Client({
  wallet: yourSolanaWallet,
  network: 'solana-devnet',
  maxPaymentAmount: BigInt(1_000_000),
});

const response = await client.fetch('https://api.launchx402.fun/api/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    imageUrl: 'https://i.imgur.com/yourimage.png',
    name: 'My Token',
    symbol: 'MTK',
    description: 'An amazing token on Solana'
  })
});

const result = await response.json();
console.log('Token created!', result.mint);
console.log('Transaction:', result.solscanUrl);
```

## API Reference

### Endpoint

```
POST https://api.launchx402.fun/api/create
```

### Cost

- **Total Cost:** $1.00 USDC (via x402 protocol)
  - Includes initial buy (0.02 SOL) - we cover this!
  - Includes gas fees (~0.0005 SOL) - we cover this too!
- **You Pay:** Just $1.00 USDC, nothing else!

### Request Body

```typescript
{
  imageUrl: string;      // Publicly accessible image URL
  name: string;          // Token name
  symbol: string;        // Token symbol (ticker)
  description: string;   // Token description
  twitter?: string;      // Twitter/X URL (optional)
  telegram?: string;     // Telegram URL (optional)
  website?: string;      // Website URL (optional)
  slippage?: number;     // Default: 10
  priorityFee?: number;  // Default: 0.0005
}
```

### Success Response

```typescript
{
  success: true,
  signature: "5wJ8...",           // Solana transaction signature
  mint: "8Xy9ZK...",              // Token mint address
  metadataUri: "https://...",     // IPFS metadata URI
  message: "Token launched successfully on Pump.fun",
  solscanUrl: "https://solscan.io/tx/...",
  tokenDetails: {
    name: "My Token",
    symbol: "MTK",
    description: "An amazing token on Solana",
    initialBuy: "0.02 SOL"
  }
}
```

### Error Response

```typescript
{
  success: false,
  error: "Error message",
  details?: "Additional error information"
}
```

## How It Works

```
┌─────────────┐
│   Client    │
│  (You/App)  │
└──────┬──────┘
       │ 1. POST /api/create
       │    (without payment)
       ▼
┌─────────────────┐
│  LaunchX402 API │
└──────┬──────────┘
       │ 2. Returns 402
       │    Payment Required
       │    ($0.10 USDC)
       ▼
┌─────────────┐
│ x402 Client │
│ (Auto pays) │
└──────┬──────┘
       │ 3. Signs payment
       │    Retries request
       ▼
┌─────────────────┐
│  LaunchX402 API │
├─────────────────┤
│ 4. Verifies pay │
│ 5. Fetches image│
│ 6. Uploads IPFS │
│ 7. Calls Pump   │
└──────┬──────────┘
       │ 8. Returns result
       ▼
┌─────────────┐
│   Client    │
│ (Token info)│
└─────────────┘
```

## Examples

### Basic Token Launch

```typescript
import { createToken } from './app/api/create/example-client';

const result = await createToken(wallet, {
  imageUrl: 'https://i.imgur.com/example.png',
  name: 'My Awesome Token',
  symbol: 'MAT',
  description: 'The most amazing token on Solana'
});

console.log('Mint:', result.mint);
```

### With Social Links

```typescript
const result = await createToken(wallet, {
  imageUrl: 'https://i.imgur.com/example.png',
  name: 'Social Token',
  symbol: 'SOCIAL',
  description: 'Token with full social integration',
  twitter: 'https://x.com/mytoken',
  telegram: 'https://t.me/mytoken',
  website: 'https://mytoken.com'
});
```

### Check Payment Requirements (No Payment)

```typescript
const requirements = await fetch('https://api.launchx402.fun/api/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    imageUrl: 'https://i.imgur.com/example.png',
    name: 'Test',
    symbol: 'TEST',
    description: 'Test token'
  })
});

// Returns 402 with payment details
const payment = await requirements.json();
console.log('Cost: $1.00 USDC (includes everything!)');
```

More examples: [`app/api/create/example-client.ts`](./app/api/create/example-client.ts)

## Documentation

- **[API Documentation](./app/api/create/README.md)** - Complete API reference
- **[Type Definitions](./app/api/create/types.ts)** - TypeScript types
- **[Client Examples](./app/api/create/example-client.ts)** - Usage examples
- **[x402 Protocol](https://www.npmjs.com/package/@payai/x402-solana)** - Payment protocol docs

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript 5
- **Blockchain:** Solana (devnet/mainnet)
- **Payment:** x402 protocol with USDC
- **Token Launch:** PumpPortal API
- **Storage:** IPFS (via Pump.fun)
- **Hosting:** Railway (recommended)

## Architecture

```
launchx402-api/
├── app/
│   ├── api/
│   │   ├── create/              # Token creation endpoint
│   │   │   ├── route.ts         # Main API handler
│   │   │   ├── types.ts         # TypeScript types
│   │   │   ├── example-client.ts # Usage examples
│   │   │   └── README.md        # API documentation
│   │   └── test/                # Legacy test endpoint
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Landing page
├── .env.example                 # Environment template
├── package.json                 # Dependencies
└── README.md                    # This file
```

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_NETWORK` | `solana` or `solana-devnet` | Yes |
| `TREASURY_WALLET_ADDRESS` | Your Solana wallet for receiving payments | Yes |
| `PUMP_PORTAL_API_KEY` | API key from [pumpportal.fun](https://pumpportal.fun) | Yes |
| `FACILITATOR_URL` | x402 facilitator URL | Yes |
| `NEXT_PUBLIC_BASE_URL` | Your API's base URL | Yes |
| `VANITY_SUFFIX` | Vanity address suffix for token mints (optional, must use Base58 chars only: excludes 0, O, I, l) | No |
| `NEXT_PUBLIC_SOLANA_RPC_DEVNET` | Custom RPC endpoint (optional) | No |
| `NEXT_PUBLIC_SOLANA_RPC_MAINNET` | Custom RPC endpoint (optional) | No |

### Networks

The API supports both Solana networks:

- **Devnet** (testing)
  - USDC Mint: `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`
  - Use for development and testing

- **Mainnet** (production)
  - USDC Mint: `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`
  - Use for real token launches

## Security

- ✅ All payments verified through x402 facilitator
- ✅ Payment settled only after successful token creation
- ✅ Environment variables for sensitive data
- ✅ CORS configured for cross-origin requests
- ✅ Rate limiting recommended for production
- ✅ Input validation on all endpoints

## Resources

### Links

- **Live API:** [api.launchx402.fun](https://api.launchx402.fun)
- **x402 Protocol:** [npmjs.com/package/@payai/x402-solana](https://www.npmjs.com/package/@payai/x402-solana)
- **x402scan:** [x402scan.com](https://x402scan.com)
- **PumpPortal:** [pumpportal.fun](https://pumpportal.fun)
- **Pump.fun:** [pump.fun](https://pump.fun)

### Community

- **GitHub:** [github.com/yourusername/launchx402-api](https://github.com/yourusername/launchx402-api)
- **Issues:** [github.com/yourusername/launchx402-api/issues](https://github.com/yourusername/launchx402-api/issues)

## FAQ

**Q: How much does it cost to use the API?**  
A: Just $1.00 USDC per token launch. We cover the initial buy (0.02 SOL) and gas fees!

**Q: Do I need an API key?**  
A: No! The API uses the x402 protocol for payments. Just pay with USDC.

**Q: What networks are supported?**  
A: Solana devnet (testing) and mainnet (production).

**Q: Where do tokens get deployed?**  
A: All tokens are deployed to [Pump.fun](https://pump.fun).

**Q: Do I need SOL in my wallet?**  
A: No! We cover the initial buy and gas fees. You only need $1.00 USDC.

**Q: How do I get devnet USDC for testing?**  
A: Use a devnet USDC faucet or contact the team.


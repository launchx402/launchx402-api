# LaunchX402 Token Creation API

Launch Pump.fun tokens instantly using the x402 payment protocol.

## Endpoint

**POST** `/api/create`

**Cost:** $1.00 USDC (includes initial buy + gas fees!)

## Description

This endpoint allows you to create and launch new tokens on Pump.fun using the PumpPortal API. Payment is handled via the x402 protocol using USDC on Solana.

## Request Format

**Content-Type:** `application/json`

**Initial Buy:** 0.02 SOL (fixed amount for all launches)

### Required Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `imageUrl` | String | Publicly accessible image URL |
| `name` | String | Token name |
| `symbol` | String | Token symbol/ticker |
| `description` | String | Token description |

### Optional Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `twitter` | String | - | Twitter/X profile URL |
| `telegram` | String | - | Telegram group/channel URL |
| `website` | String | - | Website URL |
| `slippage` | Number | 10 | Slippage tolerance (percentage) |
| `priorityFee` | Number | 0.0005 | Priority fee in SOL |

## Example Request

### Using cURL (without x402 client)

```bash
curl -X POST https://api.launchx402.fun/api/create \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://example.com/token-logo.png",
    "name": "My Awesome Token",
    "symbol": "MAT",
    "description": "The most amazing token on Solana",
    "twitter": "https://x.com/mytoken",
    "website": "https://mytoken.com"
  }'
```

**First Response (402 Payment Required):**
```json
{
  "x402Version": 1,
  "accepts": [{
    "scheme": "exact",
    "network": "solana-devnet",
    "maxAmountRequired": "5000000",
    "resource": "https://api.launchx402.fun/api/create",
    "description": "Launch Pump.fun Token - LaunchX402",
    ...
  }],
  "error": "Payment required"
}
```

### Using x402 Client (JavaScript/TypeScript)

```typescript
import { createX402Client } from '@payai/x402-solana/client';

const client = createX402Client({
  wallet: yourSolanaWallet,
  network: 'solana-devnet',
  maxPaymentAmount: BigInt(10_000_000), // 10 USDC max
});

// Prepare request body
const requestBody = {
  imageUrl: 'https://example.com/token-logo.png',
  name: 'My Awesome Token',
  symbol: 'MAT',
  description: 'The most amazing token on Solana',
  twitter: 'https://x.com/mytoken',
  website: 'https://mytoken.com'
};

// Make paid request
const response = await client.fetch('https://api.launchx402.fun/api/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(requestBody)
});

const result = await response.json();
console.log('Token created:', result);
```

## Success Response

**Status Code:** 200

```json
{
  "success": true,
  "signature": "5wJ8...", 
  "mint": "8Xy9ZK...",
  "metadataUri": "https://cf-ipfs.com/ipfs/...",
  "message": "Token launched successfully on Pump.fun",
  "solscanUrl": "https://solscan.io/tx/5wJ8...",
  "tokenDetails": {
    "name": "My Awesome Token",
    "symbol": "MAT",
    "description": "The most amazing token on Solana",
    "initialBuy": "1 SOL"
  }
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | Boolean | Whether the operation succeeded |
| `signature` | String | Solana transaction signature |
| `mint` | String | Token mint address (public key) |
| `metadataUri` | String | IPFS URI for token metadata |
| `solscanUrl` | String | Direct link to transaction on Solscan |
| `tokenDetails` | Object | Summary of token parameters |

## Error Responses

### 400 Bad Request

Missing required fields:
```json
{
  "error": "Missing required fields",
  "success": false,
  "required": ["imageUrl", "name", "symbol", "description"]
}
```

Invalid image URL:
```json
{
  "error": "Invalid image URL",
  "success": false
}
```

Failed to fetch image:
```json
{
  "error": "Failed to fetch image from URL",
  "success": false
}
```

### 402 Payment Required

Invalid or missing payment:
```json
{
  "error": "Invalid payment",
  "success": false
}
```

### 500 Internal Server Error

Token creation failed:
```json
{
  "error": "Token creation failed",
  "success": false,
  "details": "Error details from PumpPortal"
}
```

## Payment Flow

1. **Initial Request** - Client sends POST request without payment
2. **402 Response** - Server returns payment requirements
3. **Payment** - Client creates and signs USDC payment transaction
4. **Retry Request** - Client sends same request with `X-PAYMENT` header
5. **Verification** - Server verifies payment with x402 facilitator
6. **Token Creation** - Server creates token metadata on IPFS
7. **Token Launch** - Server submits token creation transaction via PumpPortal
8. **Payment Settlement** - Server settles payment with facilitator
9. **Success Response** - Server returns transaction details

## Configuration

### Environment Variables

Required environment variables for this endpoint:

```env
# Network Configuration
NEXT_PUBLIC_NETWORK=solana-devnet

# Treasury (where USDC payments go)
TREASURY_WALLET_ADDRESS=your_solana_wallet_address

# x402 Protocol
FACILITATOR_URL=https://facilitator.payai.network

# Application
NEXT_PUBLIC_BASE_URL=https://api.launchx402.fun

# PumpPortal API Key (REQUIRED)
PUMP_PORTAL_API_KEY=your_pumpportal_api_key
```

### Getting a PumpPortal API Key

1. Visit [pumpportal.fun](https://pumpportal.fun)
2. Sign up or log in
3. Navigate to API settings
4. Generate an API key
5. Add to your `.env.local` or Railway environment variables

## Technical Details

### Token Creation Process

1. **Image Fetch**
   - Image fetched from provided URL
   - URL must be publicly accessible

2. **IPFS Metadata Upload**
   - Image and metadata uploaded to Pump.fun IPFS
   - Returns metadata URI for token

3. **Mint Keypair Generation**
   - Random Solana keypair generated for token mint
   - Private key encoded with bs58

4. **PumpPortal Transaction**
   - Create transaction submitted to PumpPortal
   - Includes initial SOL buy amount
   - Configurable slippage and priority fee

5. **Transaction Execution**
   - PumpPortal executes token creation on-chain
   - Returns transaction signature

### Network Support

- **Devnet**: Testing with devnet USDC
- **Mainnet**: Production with real USDC

Switch networks via `NEXT_PUBLIC_NETWORK` environment variable.

## Rate Limits

Currently no rate limits enforced. Each request requires a new USDC payment.

## Best Practices

1. **Image URL Requirements**
   - Must be publicly accessible (no authentication required)
   - Use HTTPS URLs when possible
   - Recommended: Square images (512x512px or 1024x1024px)
   - PNG or JPG format
   - Host on reliable services (Imgur, Cloudinary, IPFS, etc.)

2. **Initial Buy Amount**
   - Fixed at 0.02 SOL for all launches
   - Provides basic initial liquidity
   - Plus gas fees (~0.0005 SOL)

3. **Slippage Settings**
   - Default 10% usually sufficient
   - Increase if transaction fails
   - Higher slippage = higher risk

4. **Error Handling**
   - Always check `success` field
   - Log transaction signatures for tracking
   - Implement retry logic for network issues

## Security

- All payments verified through x402 facilitator
- Payment settled only after successful token creation
- API key stored securely in environment variables
- CORS enabled for web applications

## Support

For issues or questions:
- Check transaction on [Solscan](https://solscan.io)
- Verify PumpPortal API key is valid
- Review Railway/deployment logs
- Ensure sufficient SOL for initial buy

## Resources

- [x402 Protocol](https://www.npmjs.com/package/@payai/x402-solana)
- [PumpPortal Documentation](https://pumpportal.fun)
- [Pump.fun](https://pump.fun)
- [Solscan Explorer](https://solscan.io)


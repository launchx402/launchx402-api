/**
 * TypeScript Types for LaunchX402 Token Creation API
 */

// ===== Request Types =====

export interface TokenCreationRequest {
  /** Publicly accessible image URL */
  imageUrl: string;
  /** Token name */
  name: string;
  /** Token symbol/ticker */
  symbol: string;
  /** Token description */
  description: string;
  /** Twitter/X profile URL (optional) */
  twitter?: string;
  /** Telegram group/channel URL (optional) */
  telegram?: string;
  /** Website URL (optional) */
  website?: string;
  /** Slippage tolerance percentage (default: 10) */
  slippage?: number;
  /** Priority fee in SOL (default: 0.0005) */
  priorityFee?: number;
}

// ===== Response Types =====

export interface TokenCreationResponse {
  /** Whether the token was created successfully */
  success: boolean;
  /** Solana transaction signature */
  signature: string;
  /** Token mint address (public key) */
  mint: string;
  /** IPFS URI for token metadata */
  metadataUri: string;
  /** Success message */
  message: string;
  /** Direct link to transaction on Solscan */
  solscanUrl: string;
  /** Summary of token details */
  tokenDetails: {
    name: string;
    symbol: string;
    description: string;
    initialBuy: string;
  };
}

export interface TokenCreationError {
  /** Error indicator */
  success: false;
  /** Error message */
  error: string;
  /** Additional error details (optional) */
  details?: string;
  /** Required fields if validation failed (optional) */
  required?: string[];
}

// ===== x402 Payment Types =====

export interface X402Response {
  x402Version: number;
  error?: string;
  accepts?: X402Accept[];
  payer?: string;
}

export interface X402Accept {
  scheme: 'exact';
  network: 'solana' | 'solana-devnet';
  maxAmountRequired: string;
  resource: string;
  description: string;
  mimeType: string;
  payTo: string;
  maxTimeoutSeconds: number;
  asset: string;
  outputSchema?: X402OutputSchema;
  extra?: Record<string, any>;
}

export interface X402OutputSchema {
  input: {
    type: 'http';
    method: 'GET' | 'POST';
    bodyType?: 'json' | 'form-data' | 'multipart-form-data' | 'text' | 'binary';
    queryParams?: Record<string, X402FieldDef>;
    bodyFields?: Record<string, X402FieldDef>;
    headerFields?: Record<string, X402FieldDef>;
  };
  output?: Record<string, any>;
}

export interface X402FieldDef {
  type?: string;
  required?: boolean | string[];
  description?: string;
  enum?: string[];
  properties?: Record<string, X402FieldDef>;
}

// ===== Helper Types =====

export type TokenCreationResult = TokenCreationResponse | TokenCreationError;

export interface TokenLaunchConfig {
  /** API endpoint URL */
  apiUrl: string;
  /** Solana network */
  network: 'solana' | 'solana-devnet';
  /** Maximum payment amount in USDC (micro-units) */
  maxPaymentAmount?: bigint;
}


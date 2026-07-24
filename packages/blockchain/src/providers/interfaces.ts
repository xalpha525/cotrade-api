import type { ChainId } from '@copytrading/db';

export interface WalletSubscription {
  address: string;
  chainId: ChainId;
  subscribedAt: Date;
}

export interface RawBlockEvent {
  chainId: ChainId;
  blockNumber: bigint;
  hash: string;
  timestamp: Date;
  transactions: RawTransactionEvent[];
}

export interface RawTransactionEvent {
  chainId: ChainId;
  txHash: string;
  blockNumber: bigint;
  walletAddress: string;
  programId?: string | undefined;
  logs?: string[];
  rawPayload: Record<string, unknown>;
  observedAt: Date;
}

export interface TokenBalance {
  mintAddress: string;
  symbol: string;
  decimals: number;
  rawAmount: string;   // on-chain raw amount (lamports / wei)
  uiAmount: number;    // human-readable (rawAmount / 10^decimals)
}

export interface IBlockchainProvider {
  readonly chainId: ChainId;
  readonly isConnected: boolean;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  subscribeWallet(
    address: string,
    onTransaction: (tx: RawTransactionEvent) => Promise<void>
  ): Promise<void>;
  unsubscribeWallet(address: string): Promise<void>;
  /** Returns native balance in smallest unit (lamports for SOL, wei for ETH) */
  getNativeBalance(address: string): Promise<string>;
  /** Returns all SPL/ERC-20 token balances for the wallet */
  getTokenBalances(address: string): Promise<TokenBalance[]>;
  healthCheck(): Promise<{ isHealthy: boolean; latencyMs: number; error?: string }>;
}

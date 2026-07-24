export type ChainId = 'solana-mainnet' | 'robinhood-mainnet';

export type OrderSide = 'BUY' | 'SELL';
export type OrderStatus = 'PENDING' | 'SUBMITTED' | 'CONFIRMED' | 'FAILED' | 'CANCELLED';

export interface MasterTrader {
  id: string;
  name: string;
  walletAddress: string;
  chainId: ChainId;
  totalFollowers: number;
  winRate: number;
  roiPercentage: number;
  createdAt: string;
}

export interface FollowerConfig {
  id: string;
  userId: string;
  masterTraderId: string;
  maxCopyAllocationUsd: number;
  maxSlippageBps: number;
  isPaused: boolean;
  createdAt: string;
}

export interface Trade {
  id: string;
  masterTraderId: string;
  chainId: ChainId;
  txHash: string;
  tokenInAddress: string;
  tokenOutAddress: string;
  amountIn: string;
  amountOut: string;
  timestamp: string;
}

export interface Order {
  id: string;
  tradeId: string;
  followerUserId: string;
  chainId: ChainId;
  side: OrderSide;
  tokenAddress: string;
  amount: string;
  status: OrderStatus;
  txHash?: string;
  executionPriceUsd?: number;
  errorMessage?: string;
  createdAt: string;
}

export interface Position {
  id: string;
  userId: string;
  chainId: ChainId;
  tokenAddress: string;
  tokenSymbol: string;
  quantity: string;
  averageEntryPriceUsd: number;
  currentPriceUsd: number;
  unrealizedPnlUsd: number;
  updatedAt: string;
}

import type { ChainId } from '@copytrading/db';

export interface EvaluatedStrategyContext {
  followerId: string;
  followerUserId: string;
  traderId: string;
  traderWalletAddress: string;
  destinationWalletId: string;
  destinationWalletAddress: string;
  chainId: ChainId;
  tokenInAddress: string;
  tokenOutAddress: string;
  tokenSymbol: string;
  traderTradeSide: 'BUY' | 'SELL' | 'PARTIAL_SELL';
  traderAmountInRaw: string;
  traderAmountUsd: number;
  // Strategy config parameters
  maxSlippageBps: number;
  fixedAmountUsd?: number | null;
  percentageAllocation?: number | null;
  multiplier?: number | null;
  maxBuyUsd?: number | null;
  minBuyUsd?: number | null;
  maxPositionSizeUsd?: number | null;
  maxDailySpendUsd?: number | null;
  maxOpenPositions?: number | null;
  maxExposureUsd?: number | null;
  copyAllBuys: boolean;
  onlyVerifiedTokens: boolean;
  minLiquidityUsd?: number | null;
  maxMarketCapUsd?: number | null;
  minHolders?: number | null;
  maxBuyTaxPercent?: number | null;
  maxSellTaxPercent?: number | null;
  sellExecutionMode: 'MIRROR_TRADER' | 'TAKE_PROFIT' | 'STOP_LOSS' | 'HOLD_FOREVER';
  takeProfitPercentage?: number | null;
  stopLossPercentage?: number | null;
  trailingStopPercent?: number | null;
  mirrorPartialSells: boolean;
  dailyLossLimitUsd?: number | null;
  pauseAfterLosses?: number | null;
  maxDrawdownPercent?: number | null;
  blacklistTokens: string[];
  whitelistTokens: string[];
  emergencyStop: boolean;
}

export interface CalculatedPositionSize {
  tradeAmountUsd: number;
  tokenAmountRaw: string;
  tokenPriceUsd: number;
  sizingMode: 'FIXED_DOLLAR' | 'PERCENTAGE' | 'MULTIPLIER';
}

export interface RiskValidationResult {
  eligible: boolean;
  rejectionReason?: string;
  riskScore?: number;
}

export interface BuiltTradePayload {
  chainId: ChainId;
  routerAddress: string;
  inputMint: string;
  outputMint: string;
  amountInRaw: string;
  expectedAmountOutRaw: string;
  slippageBps: number;
  swapTransactionData: string; // Base64 for Solana / Hex string for EVM
  quoteData?: Record<string, unknown>;
}

export interface BroadcastResult {
  success: boolean;
  txHash?: string;
  broadcastTimeMs: number;
  error?: string;
}

export interface ConfirmationResult {
  confirmed: boolean;
  blockNumber?: bigint;
  feeUsd?: number;
  confirmationTimeMs: number;
  error?: string;
}

export interface CompleteExecutionRecord {
  executionId: string;
  followerId: string;
  followerUserId: string;
  traderId: string;
  traderWallet: string;
  destinationWalletId: string;
  sourceTxHash: string;
  destinationTxHash?: string;
  chainId: ChainId;
  tokenAddress: string;
  tokenSymbol: string;
  action: 'BUY' | 'SELL' | 'PARTIAL_SELL';
  amount: number;
  usdValue: number;
  executionLatencyMs: number;
  retryCount: number;
  status: 'PENDING' | 'EXECUTING' | 'SUCCESS' | 'FAILED' | 'SKIPPED';
  failureReason?: string | undefined;
  timestamp: Date;
}

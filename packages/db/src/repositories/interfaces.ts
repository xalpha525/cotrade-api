import type {
  User,
  UserProfile,
  Trader,
  Follower,
  Trade,
  TradeExecution,
  Position,
  Notification,
  TradeSignal,
  ObservedTrade,
  TrackedWallet,
  WalletStats,
  Token,
  TokenPrice,
  PriceHistory,
  DEX,
  LiquidityPool,
  StrategyVersion,
  UserRole,
  ChainId,
  TraderStatus,
  FollowerStatus,
  ExecutionStatus,
  NotificationType,
  SignalStatus,
  PriceInterval
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import type { PaginatedResult, PaginationOptions } from '../helpers/pagination.js';

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByPrivyId(privyId: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(data: { privyId: string; email?: string; role?: UserRole }): Promise<User>;
  updateRole(id: string, role: UserRole): Promise<User>;
  softDelete(id: string): Promise<User>;
  findProfile(userId: string): Promise<UserProfile | null>;
}

export interface ITraderRepository {
  findById(id: string): Promise<Trader | null>;
  findByWalletAddress(walletAddress: string): Promise<Trader | null>;
  findMany(options?: PaginationOptions & { chainId?: ChainId; status?: TraderStatus }): Promise<PaginatedResult<Trader>>;
  create(data: { displayName: string; bio?: string; walletAddress: string; chainId: ChainId }): Promise<Trader>;
  updateStats(id: string, stats: { winRate?: Decimal; totalRoiPercentage?: Decimal; followerCount?: number }): Promise<Trader>;
}

export interface IFollowerRepository {
  findById(id: string): Promise<Follower | null>;
  findByUserAndTrader(userId: string, traderId: string): Promise<Follower | null>;
  findManyByUserId(userId: string): Promise<Follower[]>;
  findManyByTraderId(traderId: string): Promise<Follower[]>;
  create(data: { userId: string; traderId: string; maxAllocationUsd: Decimal }): Promise<Follower>;
  updateStatus(id: string, status: FollowerStatus): Promise<Follower>;
}

export interface IStrategyRepository {
  createVersion(data: {
    followerId: string;
    versionNumber: number;
    maxSlippageBps?: number;
    fixedAmountUsd?: Decimal;
    percentageAllocation?: Decimal;
    stopLossPercentage?: Decimal;
    takeProfitPercentage?: Decimal;
  }): Promise<StrategyVersion>;
  findLatestVersion(followerId: string): Promise<StrategyVersion | null>;
  findVersion(followerId: string, versionNumber: number): Promise<StrategyVersion | null>;
}

export interface ISignalRepository {
  findById(id: string): Promise<TradeSignal | null>;
  findByTxHash(txHash: string, chainId: ChainId): Promise<TradeSignal | null>;
  createSignal(data: {
    chainId: ChainId;
    txHash: string;
    blockNumber: bigint;
    walletAddress: string;
    tokenInAddress: string;
    tokenOutAddress: string;
    amountIn: Decimal;
    amountOut: Decimal;
    rawJson: Record<string, unknown>;
  }): Promise<TradeSignal>;
  updateStatus(id: string, status: SignalStatus): Promise<TradeSignal>;
  createObservedTrade(data: {
    signalId: string;
    traderId: string;
    side: 'BUY' | 'SELL';
    tokenInAddress: string;
    tokenOutAddress: string;
    amountIn: Decimal;
    amountOut: Decimal;
    amountUsd: Decimal;
  }): Promise<ObservedTrade>;
}

export interface ITradeRepository {
  findById(id: string): Promise<Trade | null>;
  findByTxHash(txHash: string): Promise<Trade | null>;
  findManyByTraderId(traderId: string, options?: PaginationOptions): Promise<PaginatedResult<Trade>>;
  create(data: {
    traderId: string;
    chainId: ChainId;
    txHash: string;
    tokenInAddress: string;
    tokenOutAddress: string;
    amountIn: Decimal;
    amountOut: Decimal;
  }): Promise<Trade>;
  createExecution(data: {
    tradeId: string;
    followerUserId: string;
    followerId: string;
    strategyVersionId?: string;
    status: ExecutionStatus;
    txHash?: string;
    amountExecuted?: Decimal;
    executionPriceUsd?: Decimal;
    executionTimeMs?: number;
    errorMessage?: string;
  }): Promise<TradeExecution>;
}

export interface IPositionRepository {
  findById(id: string): Promise<Position | null>;
  findByUserAndToken(userId: string, chainId: ChainId, tokenAddress: string): Promise<Position | null>;
  findManyByUserId(userId: string): Promise<Position[]>;
  upsertPosition(data: {
    userId: string;
    chainId: ChainId;
    tokenAddress: string;
    tokenSymbol: string;
    quantity: Decimal;
    averageEntryPriceUsd: Decimal;
    currentPriceUsd: Decimal;
    unrealizedPnlUsd: Decimal;
  }): Promise<Position>;
}

export interface ITokenRepository {
  findByAddress(address: string, chainId: ChainId): Promise<Token | null>;
  upsertToken(data: {
    address: string;
    chainId: ChainId;
    symbol: string;
    name: string;
    decimals: number;
  }): Promise<Token>;
  addPrice(tokenId: string, priceUsd: Decimal, priceNative: Decimal): Promise<TokenPrice>;
  addPriceCandle(data: {
    tokenId: string;
    interval: PriceInterval;
    openUsd: Decimal;
    highUsd: Decimal;
    lowUsd: Decimal;
    closeUsd: Decimal;
    volumeUsd: Decimal;
    timestamp: Date;
  }): Promise<PriceHistory>;
}

export interface IDexRepository {
  findByName(name: string, chainId: ChainId): Promise<DEX | null>;
  upsertPool(data: {
    dexId: string;
    poolAddress: string;
    token0Address: string;
    token1Address: string;
    feeTierBps: number;
  }): Promise<LiquidityPool>;
}

export interface ITrackedWalletRepository {
  findByAddress(address: string): Promise<TrackedWallet | null>;
  upsertTrackedWallet(data: {
    address: string;
    chainId: ChainId;
    ensName?: string;
    source?: string;
  }): Promise<TrackedWallet>;
  updateStats(trackedWalletId: string, stats: Partial<WalletStats>): Promise<WalletStats>;
}

export interface INotificationRepository {
  findManyByUserId(userId: string, options?: PaginationOptions): Promise<PaginatedResult<Notification>>;
  create(data: { userId: string; title: string; message: string; type?: NotificationType }): Promise<Notification>;
  markAsRead(id: string): Promise<Notification>;
  markAllAsRead(userId: string): Promise<number>;
}

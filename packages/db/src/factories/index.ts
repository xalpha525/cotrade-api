import { Decimal } from '@prisma/client/runtime/library';
import type { ChainId, SignalStatus, TradeSide, UserRole } from '@prisma/client';

export interface UserFactoryInput {
  privyId?: string;
  email?: string;
  role?: UserRole;
}

export function buildUserFactory(overrides: UserFactoryInput = {}) {
  const id = `usr_${Math.random().toString(36).slice(2, 10)}`;
  return {
    id,
    privyId: overrides.privyId ?? `privy_${id}`,
    email: overrides.email ?? `${id}@test.copytrading.io`,
    role: overrides.role ?? ('FOLLOWER' as UserRole),
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

export interface SignalFactoryInput {
  chainId?: ChainId;
  txHash?: string;
  walletAddress?: string;
  status?: SignalStatus;
}

export function buildTradeSignalFactory(overrides: SignalFactoryInput = {}) {
  return {
    id: `sig_${Math.random().toString(36).slice(2, 10)}`,
    chainId: overrides.chainId ?? ('SOLANA_MAINNET' as ChainId),
    txHash: overrides.txHash ?? `0x${Math.random().toString(16).slice(2)}`,
    blockNumber: BigInt(Math.floor(Math.random() * 10000000)),
    walletAddress: overrides.walletAddress ?? '7XwSg4R9z5Y8aB2cD1eF3gH4jK5lM6nO7pQ8rS9tU0vW',
    tokenInAddress: 'So11111111111111111111111111111111111111112',
    tokenOutAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    amountIn: new Decimal('1.5'),
    amountOut: new Decimal('225.50'),
    status: overrides.status ?? ('RECEIVED' as SignalStatus),
    rawJson: {},
    observedAt: new Date()
  };
}

export interface TradeFactoryInput {
  traderId?: string;
  chainId?: ChainId;
  side?: TradeSide;
}

export function buildTradeFactory(overrides: TradeFactoryInput = {}) {
  return {
    id: `trd_${Math.random().toString(36).slice(2, 10)}`,
    traderId: overrides.traderId ?? `trd_${Math.random().toString(36).slice(2, 8)}`,
    chainId: overrides.chainId ?? ('SOLANA_MAINNET' as ChainId),
    txHash: `0x${Math.random().toString(16).slice(2)}`,
    tokenInAddress: 'So11111111111111111111111111111111111111112',
    tokenOutAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    amountIn: new Decimal('1.0'),
    amountOut: new Decimal('150.00'),
    timestamp: new Date()
  };
}

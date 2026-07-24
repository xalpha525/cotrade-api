// Event Contracts & Schema
export * from './contracts/domain-event.contract.js';

// Transport Abstraction & Adapters
export * from './transport/interfaces.js';
export * from './transport/transport-factory.js';
export * from './transport/adapters/in-memory.transport.js';
export * from './transport/adapters/redis-stream.transport.js';
export * from './transport/adapters/kafka.transport.js';
export * from './transport/adapters/nats.transport.js';

// Registry & SerDe
export * from './registry/event-registry.js';
export * from './tests/transport.test.js';

// Core Domain Event Contracts
export interface BaseDomainEvent {
  eventId: string;
  eventType: string;
  correlationId?: string;
  timestamp: number;
}
export interface MasterTradeDetectedEvent extends BaseDomainEvent {
  eventType: 'MASTER_TRADE_DETECTED';
  masterWallet: string;
  txHash: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  amountOut: string;
}

export interface WalletCreatedEvent extends BaseDomainEvent {
  eventType: 'WALLET_CREATED';
  walletId: string;
  userId?: string;
  address: string;
  chainId: string;
  ownerType: 'USER_PRIVY' | 'USER_EXTERNAL' | 'MASTER_TRADER';
}

export interface WalletUpdatedEvent extends BaseDomainEvent {
  eventType: 'WALLET_UPDATED';
  walletId: string;
  address: string;
  chainId: string;
  isPrimary?: boolean;
}

export interface WalletBalanceUpdatedEvent extends BaseDomainEvent {
  eventType: 'WALLET_BALANCE_UPDATED';
  walletId: string;
  userId?: string;
  address: string;
  chainId: string;
  balanceUsd: number;
  tokens: Array<{
    mint: string;
    symbol: string;
    decimals: number;
    amount: string;
    valueUsd: number;
  }>;
}

export interface TransactionDetectedEvent extends BaseDomainEvent {
  eventType: 'TRANSACTION_DETECTED';
  walletId: string;
  address: string;
  txHash: string;
  chainId: string;
  type: 'BUY' | 'SELL' | 'TRANSFER';
  rawPayload?: unknown;
}

export interface TradeOpenedEvent extends BaseDomainEvent {
  eventType: 'TRADE_OPENED';
  positionId: string;
  walletId: string;
  userId?: string;
  tokenAddress: string;
  tokenSymbol: string;
  quantity: string;
  entryPriceUsd: number;
}

export interface TradeClosedEvent extends BaseDomainEvent {
  eventType: 'TRADE_CLOSED';
  positionId: string;
  walletId: string;
  userId?: string;
  tokenAddress: string;
  quantity: string;
  exitPriceUsd: number;
  realizedPnLUsd: number;
  roiPercent: number;
  holdDurationSeconds: number;
}

export interface PositionUpdatedEvent extends BaseDomainEvent {
  eventType: 'POSITION_UPDATED';
  positionId: string;
  walletId: string;
  userId?: string;
  tokenAddress: string;
  status: 'OPEN' | 'PARTIALLY_CLOSED' | 'CLOSED';
  remainingQuantity: string;
  averageEntryPriceUsd: number;
  unrealizedPnLUsd: number;
}

export interface PortfolioUpdatedEvent extends BaseDomainEvent {
  eventType: 'PORTFOLIO_UPDATED';
  userId: string;
  totalValueUsd: number;
  cashBalanceUsd: number;
  positionValueUsd: number;
}

export interface StatisticsUpdatedEvent extends BaseDomainEvent {
  eventType: 'STATISTICS_UPDATED';
  walletAddress: string;
  totalTrades: number;
  winRate: number;
  maxDrawdownPercent: number;
  currentPortfolioValue: number;
}

export class InMemoryEventBus {
  private handlers = new Map<string, Array<(event: any) => Promise<void>>>();

  async publish<T extends BaseDomainEvent>(event: T): Promise<void> {
    const list = this.handlers.get(event.eventType) ?? [];
    for (const h of list) {
      await h(event);
    }
  }

  subscribe<T extends BaseDomainEvent>(
    eventType: string,
    handler: (event: T) => Promise<void>
  ): void {
    const list = this.handlers.get(eventType) ?? [];
    list.push(handler as any);
    this.handlers.set(eventType, list);
  }
}

export const eventBus = new InMemoryEventBus();

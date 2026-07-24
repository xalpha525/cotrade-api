import type { ChainId, Follower, StrategyVersion, TradeExecution, TradeSignal } from '@copytrading/db';

export type ExecutionState =
  | 'CREATED'
  | 'VALIDATING'
  | 'PREPARING'
  | 'READY'
  | 'WAITING_FOR_QUOTE'
  | 'WAITING_FOR_SIMULATION'
  | 'WAITING_FOR_SIGNATURE'
  | 'READY_TO_BROADCAST'
  | 'BROADCAST_PENDING'
  | 'CONFIRMATION_PENDING'
  | 'CONFIRMED'
  | 'FAILED'
  | 'CANCELLED'
  | 'EXPIRED';

export interface ExecutionContext {
  executionId: string;
  batchId?: string;
  correlationId: string;
  requestId: string;
  chainId: ChainId;
  state: ExecutionState;
  tradeExecution?: TradeExecution;
  tradeSignal?: TradeSignal;
  follower?: Follower;
  strategyVersion?: StrategyVersion;
  walletAddress?: string;
  quoteData?: Record<string, unknown>;
  simulationResult?: Record<string, unknown>;
  baseFee?: string;
  priorityFee?: string;
  nonce?: number;
  signedPayload?: string;
  retryCount: number;
  startTime: number;
  endTime?: number;
  failureReason?: string;
  metadata: Record<string, unknown>;
}

export interface IStageHandler {
  readonly stageName: string;
  execute(ctx: ExecutionContext): Promise<ExecutionContext>;
}

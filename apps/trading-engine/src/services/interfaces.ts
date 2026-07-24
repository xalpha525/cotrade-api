import type { ChainId, Follower, StrategyVersion, TradeSignal } from '@copytrading/db';
import { Decimal } from '@copytrading/db';

export interface RiskEvaluationResult {
  passed: boolean;
  failedRuleName?: string;
  reason?: string;
}

export interface IRiskRule {
  readonly ruleName: string;
  evaluate(
    signal: TradeSignal,
    follower: Follower,
    strategy: StrategyVersion
  ): Promise<RiskEvaluationResult>;
}

export interface PositionSizingResult {
  amountUsd: Decimal;
  tokenAmount: Decimal;
}

export interface ExecutionPlan {
  followerId: string;
  userId: string;
  traderId: string;
  strategyVersionId: string;
  chainId: ChainId;
  tokenInAddress: string;
  tokenOutAddress: string;
  amountExecuted: Decimal;
  maxSlippageBps: number;
}

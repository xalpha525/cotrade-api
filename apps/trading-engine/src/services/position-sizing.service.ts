import { Decimal, type Follower, type StrategyVersion, type TradeSignal } from '@copytrading/db';
import type { PositionSizingResult } from './interfaces.js';

export class PositionSizingService {
  calculatePositionSize(
    signal: TradeSignal,
    follower: Follower,
    strategy: StrategyVersion
  ): PositionSizingResult {
    let amountUsd = new Decimal('100.00');

    if (strategy.fixedAmountUsd) {
      amountUsd = strategy.fixedAmountUsd;
    } else if (strategy.percentageAllocation) {
      const percentage = strategy.percentageAllocation.div(new Decimal('100.0'));
      amountUsd = follower.maxAllocationUsd.mul(percentage);
    } else if (signal.amountUsd) {
      amountUsd = signal.amountUsd;
    }

    // Cap at follower.maxAllocationUsd
    if (amountUsd.gt(follower.maxAllocationUsd)) {
      amountUsd = follower.maxAllocationUsd;
    }

    const tokenAmount = signal.amountOut;

    return {
      amountUsd,
      tokenAmount
    };
  }
}

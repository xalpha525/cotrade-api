import type { StrategyVersion, TradeSignal } from '@copytrading/db';
import { logger } from '@copytrading/logger';

export class SlippageValidator {
  validateSlippage(signal: TradeSignal, strategy: StrategyVersion): boolean {
    const maxSlippageBps = strategy.maxSlippageBps ?? 100;
    if (maxSlippageBps > 1000) {
      logger.warn({ txHash: signal.txHash, maxSlippageBps }, 'Slippage validation failed');
      return false;
    }
    return true;
  }
}

export class LiquidityValidator {
  validateLiquidity(signal: TradeSignal): boolean {
    if (signal.amountUsd && signal.amountUsd.gt(1_000_000)) {
      logger.warn({ txHash: signal.txHash }, 'Liquidity check: Single trade size exceeds liquidity limit');
      return false;
    }
    return true;
  }
}

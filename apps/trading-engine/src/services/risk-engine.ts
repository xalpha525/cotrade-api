import type { Follower, StrategyVersion, TradeSignal } from '@copytrading/db';
import { logger } from '@copytrading/logger';
import type { IRiskRule, RiskEvaluationResult } from './interfaces.js';

export class MaxSlippageRule implements IRiskRule {
  readonly ruleName = 'MAX_SLIPPAGE_RULE';

  async evaluate(
    _signal: TradeSignal,
    _follower: Follower,
    strategy: StrategyVersion
  ): Promise<RiskEvaluationResult> {
    if (strategy.maxSlippageBps > 500) {
      return {
        passed: false,
        failedRuleName: this.ruleName,
        reason: `Strategy max slippage (${strategy.maxSlippageBps} bps) exceeds platform safety limit of 500 bps.`
      };
    }
    return { passed: true };
  }
}

export class TokenBlacklistRule implements IRiskRule {
  readonly ruleName = 'TOKEN_BLACKLIST_RULE';
  private readonly blacklistedAddresses = new Set([
    '0x0000000000000000000000000000000000000000',
    'DEAD_TOKEN_ADDRESS'
  ]);

  async evaluate(signal: TradeSignal): Promise<RiskEvaluationResult> {
    if (
      this.blacklistedAddresses.has(signal.tokenInAddress) ||
      this.blacklistedAddresses.has(signal.tokenOutAddress)
    ) {
      return {
        passed: false,
        failedRuleName: this.ruleName,
        reason: 'Token in or token out is present in the platform blacklist.'
      };
    }
    return { passed: true };
  }
}

export class RiskEngine {
  private rules: IRiskRule[] = [];

  constructor() {
    this.registerRule(new MaxSlippageRule());
    this.registerRule(new TokenBlacklistRule());
  }

  registerRule(rule: IRiskRule): void {
    this.rules.push(rule);
  }

  async evaluateRisk(
    signal: TradeSignal,
    follower: Follower,
    strategy: StrategyVersion
  ): Promise<RiskEvaluationResult> {
    for (const rule of this.rules) {
      const res = await rule.evaluate(signal, follower, strategy);
      if (!res.passed) {
        logger.warn(
          { followerId: follower.id, rule: rule.ruleName, reason: res.reason },
          'RiskEngine check rejected trade execution'
        );
        return res;
      }
    }
    return { passed: true };
  }
}

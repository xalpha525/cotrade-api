import { logger } from '@copytrading/logger';
import type { EvaluatedStrategyContext, CalculatedPositionSize, RiskValidationResult } from './interfaces.js';

export class RiskValidator {
  /**
   * Evaluates all strategy risk rules and circuit breakers.
   */
  async validateRisk(
    ctx: EvaluatedStrategyContext,
    size: CalculatedPositionSize,
    walletBalanceUsd: number
  ): Promise<RiskValidationResult> {
    // 1. Emergency Stop Circuit Breaker
    if (ctx.emergencyStop) {
      logger.warn({ followerId: ctx.followerId }, 'RiskValidator: Rejected — Emergency Stop active');
      return { eligible: false, rejectionReason: 'EMERGENCY_STOP_ACTIVE', riskScore: 10 };
    }

    // 2. Token Blacklist Check
    if (ctx.blacklistTokens && ctx.blacklistTokens.includes(ctx.tokenOutAddress)) {
      logger.warn({ followerId: ctx.followerId, token: ctx.tokenOutAddress }, 'RiskValidator: Rejected — Token blacklisted');
      return { eligible: false, rejectionReason: 'TOKEN_BLACKLISTED', riskScore: 8 };
    }

    // 3. Token Whitelist Check (if whitelist is configured and non-empty)
    if (ctx.whitelistTokens && ctx.whitelistTokens.length > 0 && !ctx.whitelistTokens.includes(ctx.tokenOutAddress)) {
      logger.warn({ followerId: ctx.followerId, token: ctx.tokenOutAddress }, 'RiskValidator: Rejected — Token not in whitelist');
      return { eligible: false, rejectionReason: 'TOKEN_NOT_WHITELISTED', riskScore: 7 };
    }

    // 4. Insufficient Balance Check
    if (size.tradeAmountUsd > walletBalanceUsd) {
      logger.warn(
        { followerId: ctx.followerId, requiredUsd: size.tradeAmountUsd, availableUsd: walletBalanceUsd },
        'RiskValidator: Rejected — Insufficient wallet balance'
      );
      return { eligible: false, rejectionReason: 'INSUFFICIENT_BALANCE', riskScore: 5 };
    }

    // 5. Slippage Check (Max allowable 5000 bps = 50%)
    if (ctx.maxSlippageBps > 5000) {
      logger.warn({ followerId: ctx.followerId, slippageBps: ctx.maxSlippageBps }, 'RiskValidator: Rejected — Slippage exceeds max safety limit');
      return { eligible: false, rejectionReason: 'SLIPPAGE_EXCEEDED', riskScore: 6 };
    }

    // 6. Minimum Buy Threshold
    if (ctx.minBuyUsd && size.tradeAmountUsd < ctx.minBuyUsd) {
      return { eligible: false, rejectionReason: 'BELOW_MIN_BUY_THRESHOLD', riskScore: 3 };
    }

    // 7. Maximum Buy Threshold
    if (ctx.maxBuyUsd && size.tradeAmountUsd > ctx.maxBuyUsd) {
      return { eligible: false, rejectionReason: 'EXCEEDS_MAX_BUY_THRESHOLD', riskScore: 4 };
    }

    logger.info({ followerId: ctx.followerId, tradeAmountUsd: size.tradeAmountUsd }, 'RiskValidator: Risk validation PASSED');
    return { eligible: true, riskScore: 1 };
  }
}

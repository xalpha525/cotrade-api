import { logger } from '@copytrading/logger';
import type { EvaluatedStrategyContext, CalculatedPositionSize } from './interfaces.js';

export class PositionSizeCalculator {
  /**
   * Calculates trade amount in USD and raw token units based on strategy options.
   */
  calculatePositionSize(
    ctx: EvaluatedStrategyContext,
    tokenPriceUsd: number
  ): CalculatedPositionSize {
    let tradeAmountUsd = 0;
    let mode: 'FIXED_DOLLAR' | 'PERCENTAGE' | 'MULTIPLIER' = 'FIXED_DOLLAR';

    // 1. Sizing Mode Logic
    if (ctx.fixedAmountUsd && ctx.fixedAmountUsd > 0) {
      tradeAmountUsd = ctx.fixedAmountUsd;
      mode = 'FIXED_DOLLAR';
    } else if (ctx.percentageAllocation && ctx.percentageAllocation > 0) {
      tradeAmountUsd = (ctx.traderAmountUsd * ctx.percentageAllocation) / 100;
      mode = 'PERCENTAGE';
    } else if (ctx.multiplier && ctx.multiplier > 0) {
      tradeAmountUsd = ctx.traderAmountUsd * ctx.multiplier;
      mode = 'MULTIPLIER';
    } else {
      tradeAmountUsd = 250; // Standard baseline allocation
      mode = 'FIXED_DOLLAR';
    }

    // 2. Apply Boundary Clamps
    if (ctx.minBuyUsd && tradeAmountUsd < ctx.minBuyUsd) {
      logger.debug({ tradeAmountUsd, minBuyUsd: ctx.minBuyUsd }, 'PositionSizeCalculator: Clamping trade amount to minBuyUsd');
      tradeAmountUsd = ctx.minBuyUsd;
    }

    if (ctx.maxBuyUsd && tradeAmountUsd > ctx.maxBuyUsd) {
      logger.debug({ tradeAmountUsd, maxBuyUsd: ctx.maxBuyUsd }, 'PositionSizeCalculator: Clamping trade amount to maxBuyUsd');
      tradeAmountUsd = ctx.maxBuyUsd;
    }

    if (ctx.maxPositionSizeUsd && tradeAmountUsd > ctx.maxPositionSizeUsd) {
      tradeAmountUsd = ctx.maxPositionSizeUsd;
    }

    // 3. Convert USD amount to raw token units (smallest unit: lamports for SOL / wei for ETH)
    const decimals = ctx.chainId === 'SOLANA_MAINNET' ? 9 : 18;
    const uiTokenAmount = tokenPriceUsd > 0 ? tradeAmountUsd / tokenPriceUsd : 0;
    const tokenAmountRaw = BigInt(Math.floor(uiTokenAmount * Math.pow(10, decimals))).toString();

    logger.info(
      { followerId: ctx.followerId, tradeAmountUsd, tokenAmountRaw, mode },
      'PositionSizeCalculator: Calculated trade position size'
    );

    return {
      tradeAmountUsd: Math.round(tradeAmountUsd * 100) / 100,
      tokenAmountRaw,
      tokenPriceUsd,
      sizingMode: mode,
    };
  }
}

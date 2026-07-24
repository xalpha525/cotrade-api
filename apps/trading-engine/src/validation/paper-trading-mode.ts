import { Decimal } from '@copytrading/db';
import { logger } from '@copytrading/logger';

export class PaperTradingEngine {
  async executePaperTrade(
    followerUserId: string,
    tokenInAddress: string,
    tokenOutAddress: string,
    amountInUsd: string
  ): Promise<{ paperTradeId: string; executedPriceUsd: string; simulatedGasFeeUsd: string }> {
    logger.info({ followerUserId, tokenInAddress, tokenOutAddress, amountInUsd }, 'PaperTradingEngine executing paper trade simulation');

    const paperTradeId = `paper_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const executedPriceUsd = new Decimal(amountInUsd).mul(new Decimal('1.0002')).toString();

    return {
      paperTradeId,
      executedPriceUsd,
      simulatedGasFeeUsd: '0.04'
    };
  }
}

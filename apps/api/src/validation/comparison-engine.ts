import { logger } from '@copytrading/logger';

export class TradeComparisonEngine {
  compareTrades(masterPriceUsd: string, followerPriceUsd: string): { slippageBps: number; matchAccuracyPercent: number } {
    const m = parseFloat(masterPriceUsd);
    const f = parseFloat(followerPriceUsd);
    const diff = Math.abs(f - m);
    const slippageBps = Math.round((diff / m) * 10000);
    const matchAccuracyPercent = Math.max(0, 100 - (diff / m) * 100);

    logger.info({ masterPriceUsd, followerPriceUsd, slippageBps, matchAccuracyPercent }, 'TradeComparisonEngine evaluated price correlation');
    return { slippageBps, matchAccuracyPercent };
  }
}

export class PortfolioComparisonEngine {
  comparePortfolios(expectedTotalUsd: string, actualTotalUsd: string): { trackingErrorPercent: number } {
    const e = parseFloat(expectedTotalUsd);
    const a = parseFloat(actualTotalUsd);
    const trackingErrorPercent = Math.abs((a - e) / e) * 100;

    logger.info({ expectedTotalUsd, actualTotalUsd, trackingErrorPercent }, 'PortfolioComparisonEngine evaluated tracking error');
    return { trackingErrorPercent };
  }
}

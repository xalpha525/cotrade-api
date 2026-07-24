import { prisma } from '@copytrading/db';
import { logger } from '@copytrading/logger';

export interface IncrementalTradeStatsUpdate {
  walletAddress: string;
  realizedPnLUsd: number;
  isWin: boolean;
  holdDurationSeconds: number;
  portfolioValueUsd: number;
}

export class StatisticsEngine {
  async updateStatsOnTrade(update: IncrementalTradeStatsUpdate): Promise<void> {
    logger.info({ walletAddress: update.walletAddress, pnl: update.realizedPnLUsd }, 'Updating Incremental Trader Statistics');

    const existing = await prisma.traderStatistics.findUnique({
      where: { walletAddress: update.walletAddress }
    });

    const totalTrades = (existing?.totalTrades ?? 0) + 1;
    const winningTrades = (existing?.winningTrades ?? 0) + (update.isWin ? 1 : 0);
    const losingTrades = (existing?.losingTrades ?? 0) + (update.isWin ? 0 : 1);
    const winRate = (winningTrades / totalTrades) * 100;

    const currentAvgWin = existing?.averageWinUsd ?? 0;
    const currentAvgLoss = existing?.averageLossUsd ?? 0;

    const newAvgWin = update.isWin
      ? (currentAvgWin * (winningTrades - 1) + update.realizedPnLUsd) / winningTrades
      : currentAvgWin;

    const newAvgLoss = !update.isWin
      ? (currentAvgLoss * (losingTrades - 1) + Math.abs(update.realizedPnLUsd)) / losingTrades
      : currentAvgLoss;

    const biggestWin = Math.max(existing?.biggestWinUsd ?? 0, update.isWin ? update.realizedPnLUsd : 0);
    const biggestLoss = Math.max(existing?.biggestLossUsd ?? 0, !update.isWin ? Math.abs(update.realizedPnLUsd) : 0);

    const peakPortfolio = Math.max(existing?.peakPortfolioValue ?? update.portfolioValueUsd, update.portfolioValueUsd);
    const drawdown = peakPortfolio > 0 ? ((peakPortfolio - update.portfolioValueUsd) / peakPortfolio) * 100 : 0;
    const maxDrawdown = Math.max(existing?.maxDrawdownPercent ?? 0, drawdown);

    const currentHoldSec = existing?.averageHoldDurationSec ?? 0;
    const newAvgHoldSec = Math.floor((currentHoldSec * (totalTrades - 1) + update.holdDurationSeconds) / totalTrades);

    await prisma.traderStatistics.upsert({
      where: { walletAddress: update.walletAddress },
      create: {
        walletAddress: update.walletAddress,
        totalTrades,
        winningTrades,
        losingTrades,
        winRate,
        averageWinUsd: newAvgWin,
        averageLossUsd: newAvgLoss,
        biggestWinUsd: biggestWin,
        biggestLossUsd: biggestLoss,
        currentPortfolioValue: update.portfolioValueUsd,
        peakPortfolioValue: peakPortfolio,
        maxDrawdownPercent: maxDrawdown,
        averageHoldDurationSec: newAvgHoldSec,
      },
      update: {
        totalTrades,
        winningTrades,
        losingTrades,
        winRate,
        averageWinUsd: newAvgWin,
        averageLossUsd: newAvgLoss,
        biggestWinUsd: biggestWin,
        biggestLossUsd: biggestLoss,
        currentPortfolioValue: update.portfolioValueUsd,
        peakPortfolioValue: peakPortfolio,
        maxDrawdownPercent: maxDrawdown,
        averageHoldDurationSec: newAvgHoldSec,
      },
    });
  }
}

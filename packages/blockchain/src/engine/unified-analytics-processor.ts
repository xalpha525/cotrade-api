import { prisma, type ChainId } from '@copytrading/db';
import { logger } from '@copytrading/logger';
import { PositionEngine, type ProcessedPositionResult } from './position-engine.js';
import { StatisticsEngine } from './stats-engine.js';

export interface UnifiedTradeInput {
  walletAddress: string;
  walletId?: string | undefined;
  userId?: string | undefined;
  chainId: ChainId;
  tokenAddress: string;
  tokenSymbol: string;
  side: 'BUY' | 'SELL';
  amount: number;
  priceUsd: number;
  timestamp: number;
}

export class UnifiedTradeAnalyticsProcessor {
  private positionEngine = new PositionEngine();
  private statsEngine = new StatisticsEngine();

  async processTrade(trade: UnifiedTradeInput): Promise<ProcessedPositionResult> {
    logger.info(
      { walletAddress: trade.walletAddress, token: trade.tokenSymbol, side: trade.side, amount: trade.amount },
      'UnifiedTradeAnalyticsProcessor: Processing trade through position & statistics pipeline'
    );

    // 1. Ensure Wallet ID exists for DB linkage
    let walletId = trade.walletId;
    if (!walletId) {
      const existingWallet = await prisma.wallet.findFirst({
        where: { address: trade.walletAddress },
      });

      if (existingWallet) {
        walletId = existingWallet.id;
      } else {
        // Link to existing trader or fallback to system user
        const trader = await prisma.trader.findUnique({
          where: { walletAddress: trade.walletAddress },
        });

        const createdWallet = await prisma.wallet.create({
          data: {
            userId: trade.userId ?? trader?.id ?? 'system_trader',
            address: trade.walletAddress,
            chainId: trade.chainId,
            isPrimary: false,
          },
        });
        walletId = createdWallet.id;
      }
    }

    // 2. Process position (FIFO lot matching, entry/exit avg, realized PnL, hold duration)
    const positionResult = await this.positionEngine.processTrade({
      walletId,
      userId: trade.userId,
      address: trade.walletAddress,
      chainId: trade.chainId,
      tokenAddress: trade.tokenAddress,
      tokenSymbol: trade.tokenSymbol,
      side: trade.side,
      amount: trade.amount,
      priceUsd: trade.priceUsd,
      timestamp: trade.timestamp,
    });

    // 3. Update Statistics (total trades, win rate, wins/losses, avg win/loss, drawdown, hold duration)
    const portfolioValueUsd = trade.amount * trade.priceUsd;
    await this.statsEngine.updateStatsOnTrade({
      walletAddress: trade.walletAddress,
      realizedPnLUsd: positionResult.realizedPnLUsd,
      isWin: positionResult.realizedPnLUsd >= 0,
      holdDurationSeconds: positionResult.holdDurationSeconds ?? 0,
      portfolioValueUsd: portfolioValueUsd > 0 ? portfolioValueUsd : 100,
    });

    // 4. Update Trader model winRate if trader exists
    const stats = await prisma.traderStatistics.findUnique({
      where: { walletAddress: trade.walletAddress },
    });

    if (stats) {
      await prisma.trader.updateMany({
        where: { walletAddress: trade.walletAddress },
        data: {
          winRate: stats.winRate,
        },
      }).catch(() => {});
    }

    logger.info(
      { walletAddress: trade.walletAddress, status: positionResult.status, realizedPnLUsd: positionResult.realizedPnLUsd },
      'UnifiedTradeAnalyticsProcessor: Successfully updated positions and statistics'
    );

    return positionResult;
  }
}

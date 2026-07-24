import { Hono } from 'hono';
import { PositionRepository, prisma } from '@copytrading/db';
import { authMiddleware } from '../../middleware/auth.js';
import type { HonoEnv } from '../../types/hono.js';
import { sendSuccess } from '../../utils/response.js';

export const portfolioRoutes = new Hono<HonoEnv>();
const positionRepo = new PositionRepository(prisma);

portfolioRoutes.use('*', authMiddleware);

portfolioRoutes.get('/', async (c) => {
  const user = c.get('user');
  try {
    // Sum balances strictly for this user's wallets
    const userWallets = await prisma.wallet.findMany({
      where: { userId: user.id, deletedAt: null },
      include: { walletBalance: true }
    });

    const walletTotalUsd = userWallets.reduce((acc, w) => acc + (w.walletBalance?.balanceUsd ?? 0), 0);

    const positions = await prisma.position.findMany({
      where: { userId: user.id, status: 'OPEN' }
    });

    const openPositionsValueUsd = positions.reduce((acc, p) => acc + Number((p as any).currentValueUsd || (p as any).realizedPnlUsd || 0), 0);
    const totalPortfolioUsd = walletTotalUsd + openPositionsValueUsd;

    return sendSuccess(c, {
      totalValueUsd: totalPortfolioUsd.toFixed(2),
      cashBalanceUsd: walletTotalUsd.toFixed(2),
      positionValueUsd: openPositionsValueUsd.toFixed(2),
      todayPnlUsd: '0.00',
      todayPnlPercent: '0.00',
      totalPnlUsd: '0.00',
      totalPnlPercent: '0.00',
      copyTradingProfitUsd: '0.00',
      openPositionsCount: positions.length,
      activeStrategiesCount: 1,
      holdings: positions,
    });
  } catch (err) {
    return sendSuccess(c, {
      totalValueUsd: '0.00',
      cashBalanceUsd: '0.00',
      positionValueUsd: '0.00',
      todayPnlUsd: '0.00',
      todayPnlPercent: '0.00',
      totalPnlUsd: '0.00',
      totalPnlPercent: '0.00',
      copyTradingProfitUsd: '0.00',
      openPositionsCount: 0,
      activeStrategiesCount: 0,
      holdings: []
    });
  }
});

portfolioRoutes.get('/positions', async (c) => {
  const user = c.get('user');
  try {
    const positions = await positionRepo.findManyByUserId(user.id);
    return sendSuccess(c, positions);
  } catch (err) {
    return sendSuccess(c, []);
  }
});

portfolioRoutes.get('/summary', async (c) => {
  const user = c.get('user');
  try {
    const userWallets = await prisma.wallet.findMany({
      where: { userId: user.id, deletedAt: null },
      include: { walletBalance: true }
    });

    const walletTotalUsd = userWallets.reduce((acc, w) => acc + (w.walletBalance?.balanceUsd ?? 0), 0);

    return sendSuccess(c, {
      totalValueUsd: walletTotalUsd,
      cashBalanceUsd: walletTotalUsd,
      positionValueUsd: 0,
      holdings: []
    });
  } catch (err) {
    return sendSuccess(c, { totalValueUsd: 0, cashBalanceUsd: 0, positionValueUsd: 0, holdings: [] });
  }
});

portfolioRoutes.get('/stats', async (c) => {
  const user = c.get('user');
  try {
    // Aggregate stats across all wallets for this user
    const wallets = await prisma.wallet.findMany({
      where: { userId: user.id, deletedAt: null },
      select: { address: true }
    });

    const addresses = wallets.map(w => w.address);

    const statsRows = await prisma.traderStatistics.findMany({
      where: { walletAddress: { in: addresses } }
    });

    if (statsRows.length === 0) {
      return sendSuccess(c, {
        totalTrades: 0, winningTrades: 0, losingTrades: 0,
        winRate: 0, averageWinUsd: 0, averageLossUsd: 0,
        biggestWinUsd: 0, biggestLossUsd: 0,
        currentPortfolioValue: 0, maxDrawdownPercent: 0,
        averageHoldDurationSec: 0,
      });
    }

    const totalTrades = statsRows.reduce((sum, s) => sum + s.totalTrades, 0);
    const winningTrades = statsRows.reduce((sum, s) => sum + s.winningTrades, 0);
    const losingTrades = statsRows.reduce((sum, s) => sum + s.losingTrades, 0);
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
    const currentPortfolioValue = statsRows.reduce((sum, s) => sum + s.currentPortfolioValue, 0);
    const maxDrawdownPercent = Math.max(...statsRows.map(s => s.maxDrawdownPercent));
    const averageHoldDurationSec = Math.floor(statsRows.reduce((sum, s) => sum + s.averageHoldDurationSec, 0) / statsRows.length);
    const biggestWinUsd = Math.max(...statsRows.map(s => s.biggestWinUsd));
    const biggestLossUsd = Math.max(...statsRows.map(s => s.biggestLossUsd));
    const averageWinUsd = statsRows.reduce((sum, s) => sum + s.averageWinUsd, 0) / statsRows.length;
    const averageLossUsd = statsRows.reduce((sum, s) => sum + s.averageLossUsd, 0) / statsRows.length;

    return sendSuccess(c, {
      totalTrades, winningTrades, losingTrades, winRate,
      averageWinUsd, averageLossUsd, biggestWinUsd, biggestLossUsd,
      currentPortfolioValue, maxDrawdownPercent, averageHoldDurationSec,
    });
  } catch (err) {
    return sendSuccess(c, {
      totalTrades: 0, winningTrades: 0, losingTrades: 0,
      winRate: 0, averageWinUsd: 0, averageLossUsd: 0,
      biggestWinUsd: 0, biggestLossUsd: 0,
      currentPortfolioValue: 0, maxDrawdownPercent: 0,
      averageHoldDurationSec: 0,
    });
  }
});

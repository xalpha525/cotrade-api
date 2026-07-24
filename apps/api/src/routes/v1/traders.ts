import { Hono } from 'hono';
import { prisma } from '@copytrading/db';
import { walletMonitorQueue } from '@copytrading/queue';
import { sendError, sendSuccess } from '../../utils/response.js';
import { TraderLifecycleService } from '../../services/trader-lifecycle.service.js';

export const traderRoutes = new Hono();

// Helper: Basic address validation
function isValidAddress(address: string): boolean {
  if (!address) return false;
  // Solana Base58 string length 32-44 or EVM 0x 42 hex chars
  const isSolana = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
  const isEvm = /^0x[a-fA-F0-9]{40}$/.test(address);
  return isSolana || isEvm;
}

// GET /traders — Search, filter & list community traders
traderRoutes.get('/', async (c) => {
  const page = Number(c.req.query('page') ?? '1');
  const pageSize = Number(c.req.query('pageSize') ?? '20');
  const query = (c.req.query('q') ?? '').trim().toLowerCase();

  try {
    const whereClause: any = {
      deletedAt: null,
      status: { not: 'ARCHIVED' },
    };

    if (query) {
      whereClause.OR = [
        { displayName: { contains: query, mode: 'insensitive' } },
        { walletAddress: { contains: query, mode: 'insensitive' } },
      ];
    }

    const [traders, total] = await Promise.all([
      prisma.trader.findMany({
        where: whereClause,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ followerCount: 'desc' }, { createdAt: 'desc' }],
      }),
      prisma.trader.count({ where: whereClause }),
    ]);

    // Fetch stats for each trader
    const addresses = traders.map((t) => t.walletAddress);
    const statsList = await prisma.traderStatistics.findMany({
      where: { walletAddress: { in: addresses } },
    });

    const statsMap = new Map(statsList.map((s) => [s.walletAddress, s]));

    const formatted = traders.map((t) => {
      const stats = statsMap.get(t.walletAddress);
      const totalTrades = stats?.totalTrades ?? 0;
      const winningTrades = stats?.winningTrades ?? 0;
      const losingTrades = stats?.losingTrades ?? 0;
      const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : Number(t.winRate || 0);

      // Compute Risk Score (1 to 10) based on max drawdown and win rate
      const maxDrawdown = stats?.maxDrawdownPercent ?? 0;
      const riskScore = totalTrades > 0
        ? Math.min(10, Math.max(1, Math.round((maxDrawdown / 10) + (winRate < 50 ? 3 : 1))))
        : 1;

      return {
        id: t.id,
        displayName: t.displayName,
        walletAddress: t.walletAddress,
        chainId: t.chainId,
        status: t.status,
        lifecycleState: t.lifecycleState,
        trackingTier: t.trackingTier,
        portfolioValueUsd: stats?.currentPortfolioValue ?? 0,
        currentHoldingsCount: stats?.currentOpenPositions ?? 0,
        openPositionsCount: stats?.currentOpenPositions ?? 0,
        totalTrades,
        winningTrades,
        losingTrades,
        winRate: Math.round(winRate * 10) / 10,
        averageRoiPercent: Number(t.totalRoiPercentage) || 0,
        averageWinMultiple: totalTrades > 0 ? `${(stats?.averageWinUsd ? Math.round((stats.averageWinUsd / 100) * 10) / 10 : 1.0)}x` : '0.0x',
        averageEntryMarketCapUsd: 0,
        averageExitMarketCapUsd: 0,
        averageHoldTimeSeconds: stats?.averageHoldDurationSec ?? 0,
        followerCount: t.followerCount,
        assetsUnderCopyUsd: t.followerCount * 250,
        riskScore,
        lastActiveAt: t.updatedAt,
      };
    });

    return sendSuccess(c, formatted, 200, {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (err: any) {
    return sendSuccess(c, [], 200, { page: 1, pageSize: 20, total: 0, totalPages: 0 });
  }
});

// POST /traders — Add or track a community trader address
traderRoutes.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const { address, walletAddress, handle, displayName, chain } = body;
    const addr = (address || walletAddress || '').trim();
    const name = (handle || displayName || 'Community Trader').trim();
    const chainId = (chain === 'SOL' || chain === 'SOLANA_MAINNET' || chain === 'Solana') ? 'SOLANA_MAINNET' : 'ROBINHOOD_MAINNET';

    if (!addr || !isValidAddress(addr)) {
      return sendError(c, 'INVALID_ADDRESS', 'Please provide a valid Solana or EVM wallet address.', 400);
    }

    const formattedName = name.startsWith('@') ? name : `@${name}`;

    // 1. Create or reactivate Trader in DB
    const trader = await prisma.trader.upsert({
      where: { walletAddress: addr },
      create: {
        walletAddress: addr,
        displayName: formattedName,
        chainId,
        status: 'ACTIVE',
        lifecycleState: 'SUGGESTED',
        trackingTier: 'PASSIVE',
        winRate: 0,
        totalRoiPercentage: 0,
        followerCount: 0,
      },
      update: {
        displayName: formattedName,
        status: 'ACTIVE',
        lifecycleState: 'SUGGESTED',
        deletedAt: null,
      },
    });

    // 2. Enqueue indexing job for historical tx collection & stats calculation
    try {
      await walletMonitorQueue.enqueue({
        jobId: `trader-index-${trader.id}-${Date.now()}`,
        timestamp: Date.now(),
        walletId: trader.id,
        address: trader.walletAddress,
        chainId: trader.chainId,
        ownerType: 'MASTER_TRADER',
        action: 'SUBSCRIBE',
      });
    } catch (qErr) {}

    // 3. Update lifecycle state & tracking tier
    await TraderLifecycleService.evaluateTraderState(trader.id);

    return sendSuccess(c, trader, 201);
  } catch (err: any) {
    return sendError(c, 'CREATE_TRADER_FAILED', err.message, 500);
  }
});

// GET /traders/:id — Get detailed trader info
traderRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');
  try {
    const trader = await prisma.trader.findUnique({
      where: { id },
      include: {
        trades: {
          take: 20,
          orderBy: { timestamp: 'desc' },
        },
      },
    });

    if (!trader) {
      return sendError(c, 'TRADER_NOT_FOUND', 'Trader not found', 404);
    }

    return sendSuccess(c, trader);
  } catch (err: any) {
    return sendError(c, 'TRADER_FETCH_FAILED', err.message, 500);
  }
});

// GET /traders/:id/stats — Get trader statistics breakdown
traderRoutes.get('/:id/stats', async (c) => {
  const id = c.req.param('id');
  try {
    const trader = await prisma.trader.findUnique({ where: { id } });
    if (!trader) return sendError(c, 'NOT_FOUND', 'Trader not found', 404);

    const stats = await prisma.traderStatistics.findUnique({
      where: { walletAddress: trader.walletAddress },
    });

    return sendSuccess(c, stats ?? {
      walletAddress: trader.walletAddress,
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      winRate: 0,
      currentPortfolioValue: 0,
      peakPortfolioValue: 0,
      maxDrawdownPercent: 0,
      averageHoldDurationSec: 0,
    });
  } catch (err: any) {
    return sendError(c, 'STATS_FETCH_FAILED', err.message, 500);
  }
});

// GET /traders/:id/trades — Get trader trades history
traderRoutes.get('/:id/trades', async (c) => {
  const id = c.req.param('id');
  try {
    const trades = await prisma.trade.findMany({
      where: { traderId: id },
      take: 50,
      orderBy: { timestamp: 'desc' },
    });
    return sendSuccess(c, trades);
  } catch (err: any) {
    return sendError(c, 'TRADES_FETCH_FAILED', err.message, 500);
  }
});

// GET /traders/:id/holdings — Get trader holdings breakdown
traderRoutes.get('/:id/holdings', async (c) => {
  const id = c.req.param('id');
  try {
    const trader = await prisma.trader.findUnique({ where: { id } });
    if (!trader) return sendError(c, 'NOT_FOUND', 'Trader not found', 404);

    const holdings = await prisma.position.findMany({
      where: { status: 'OPEN' },
      take: 10,
    });
    return sendSuccess(c, holdings);
  } catch (err: any) {
    return sendError(c, 'HOLDINGS_FETCH_FAILED', err.message, 500);
  }
});

// GET /traders/:id/followers — Get active copiers list
traderRoutes.get('/:id/followers', async (c) => {
  const id = c.req.param('id');
  try {
    const followers = await prisma.follower.findMany({
      where: { traderId: id, status: 'ACTIVE' },
      include: {
        user: { select: { id: true, email: true, createdAt: true } },
      },
    });
    return sendSuccess(c, followers);
  } catch (err: any) {
    return sendError(c, 'FOLLOWERS_FETCH_FAILED', err.message, 500);
  }
});

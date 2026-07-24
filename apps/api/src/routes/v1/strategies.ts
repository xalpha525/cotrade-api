import { Hono } from 'hono';
import { z } from 'zod';
import { Decimal, prisma } from '@copytrading/db';
import { authMiddleware } from '../../middleware/auth.js';
import type { HonoEnv } from '../../types/hono.js';
import { sendError, sendSuccess } from '../../utils/response.js';

export const strategyRoutes = new Hono<HonoEnv>();

// Schema for full 6-step Copy Strategy configuration
const createStrategySchema = z.object({
  traderId: z.string().uuid(),
  destinationWalletId: z.string().uuid(),
  // Step 2: Position Sizing
  sizingMode: z.enum(['FIXED_DOLLAR', 'PERCENTAGE', 'MULTIPLIER']).default('FIXED_DOLLAR'),
  fixedAmountUsd: z.number().positive().optional(),
  percentageAllocation: z.number().min(0.1).max(100.0).optional(),
  multiplier: z.number().positive().optional(),
  maxBuyUsd: z.number().positive().optional(),
  minBuyUsd: z.number().positive().optional(),
  maxPositionSizeUsd: z.number().positive().optional(),
  maxDailySpendUsd: z.number().positive().optional(),
  maxOpenPositions: z.number().int().positive().optional(),
  maxExposureUsd: z.number().positive().optional(),
  // Step 3: Buy Rules
  copyAllBuys: z.boolean().default(true),
  onlyVerifiedTokens: z.boolean().default(false),
  minLiquidityUsd: z.number().min(0).optional(),
  maxMarketCapUsd: z.number().min(0).optional(),
  minHolders: z.number().int().min(0).optional(),
  maxSlippageBps: z.number().int().min(1).max(5000).default(100),
  maxBuyTaxPercent: z.number().min(0).max(100).optional(),
  maxSellTaxPercent: z.number().min(0).max(100).optional(),
  // Step 4: Sell Rules
  sellExecutionMode: z.enum(['MIRROR_TRADER', 'TAKE_PROFIT', 'STOP_LOSS', 'HOLD_FOREVER']).default('MIRROR_TRADER'),
  takeProfitPercentage: z.number().positive().optional(),
  stopLossPercentage: z.number().positive().optional(),
  trailingStopPercent: z.number().positive().optional(),
  mirrorPartialSells: z.boolean().default(true),
  // Step 5: Risk Management
  dailyLossLimitUsd: z.number().positive().optional(),
  pauseAfterLosses: z.number().int().positive().optional(),
  maxDrawdownPercent: z.number().min(1).max(100).optional(),
  blacklistTokens: z.array(z.string()).default([]),
  whitelistTokens: z.array(z.string()).default([]),
  emergencyStop: z.boolean().default(false),
});

// GET /strategies — list active copy strategies for authenticated user
strategyRoutes.get('/', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const userId = typeof user === 'object' ? user.id : user;

    const followers = await prisma.follower.findMany({
      where: { userId, status: 'ACTIVE' },
      include: {
        trader: true,
        copyStrategy: true,
      },
    });

    const formatted = followers.map((f: any) => ({
      id: f.id,
      traderId: f.traderId,
      trader: f.trader ? {
        id: f.trader.id,
        displayName: f.trader.displayName,
        walletAddress: f.trader.walletAddress,
        winRate: Number(f.trader.winRate),
        totalRoiPercentage: Number(f.trader.totalRoiPercentage),
      } : null,
      status: f.status,
      isPaused: f.isPaused,
      maxAllocationUsd: Number(f.maxAllocationUsd),
      copyStrategy: f.copyStrategy ? {
        id: f.copyStrategy.id,
        maxSlippageBps: f.copyStrategy.maxSlippageBps,
        fixedAmountUsd: f.copyStrategy.fixedAmountUsd ? Number(f.copyStrategy.fixedAmountUsd) : null,
        percentageAllocation: f.copyStrategy.percentageAllocation ? Number(f.copyStrategy.percentageAllocation) : null,
        stopLossPercentage: f.copyStrategy.stopLossPercentage ? Number(f.copyStrategy.stopLossPercentage) : null,
        takeProfitPercentage: f.copyStrategy.takeProfitPercentage ? Number(f.copyStrategy.takeProfitPercentage) : null,
      } : null,
      createdAt: f.createdAt,
    }));

    return sendSuccess(c, formatted);
  } catch (err: any) {
    return sendError(c, 'STRATEGY_FETCH_ERROR', err.message ?? 'Failed to fetch strategies', 500);
  }
});

// GET /strategies/:id — get specific strategy details
strategyRoutes.get('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  try {
    const follower = await prisma.follower.findUnique({
      where: { id },
      include: {
        trader: true,
        copyStrategy: true,
      },
    });

    if (!follower) {
      return sendError(c, 'NOT_FOUND', 'Strategy not found', 404);
    }

    return sendSuccess(c, follower);
  } catch (err: any) {
    return sendError(c, 'STRATEGY_ERROR', err.message, 500);
  }
});

// POST /strategies — Create & Activate a 6-step Copy Strategy
strategyRoutes.post('/', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const userId = typeof user === 'object' ? user.id : user;
    const body = createStrategySchema.parse(await c.req.json());

    // 1. Verify Trader exists
    const trader = await prisma.trader.findUnique({ where: { id: body.traderId } });
    if (!trader) {
      return sendError(c, 'NOT_FOUND', 'Target trader not found', 404);
    }

    // 2. Verify Destination Wallet exists and belongs to user
    const wallet = await prisma.wallet.findFirst({
      where: { id: body.destinationWalletId, userId },
    });
    if (!wallet) {
      return sendError(c, 'FORBIDDEN', 'Destination wallet not found or does not belong to user', 403);
    }

    // 3. Upsert Follower record
    const maxAllocation = body.fixedAmountUsd ?? body.maxPositionSizeUsd ?? 500;
    const follower = await prisma.follower.upsert({
      where: {
        userId_traderId: { userId, traderId: body.traderId },
      },
      create: {
        userId,
        traderId: body.traderId,
        status: 'ACTIVE',
        maxAllocationUsd: new Decimal(maxAllocation),
        isPaused: false,
      },
      update: {
        status: 'ACTIVE',
        maxAllocationUsd: new Decimal(maxAllocation),
        isPaused: false,
      },
    });

    // 4. Create/Update CopyStrategy record
    const strategy = await prisma.copyStrategy.upsert({
      where: { followerId: follower.id },
      create: {
        followerId: follower.id,
        maxSlippageBps: body.maxSlippageBps,
        ...(body.fixedAmountUsd ? { fixedAmountUsd: new Decimal(body.fixedAmountUsd) } : {}),
        ...(body.percentageAllocation ? { percentageAllocation: new Decimal(body.percentageAllocation) } : {}),
        ...(body.stopLossPercentage ? { stopLossPercentage: new Decimal(body.stopLossPercentage) } : {}),
        ...(body.takeProfitPercentage ? { takeProfitPercentage: new Decimal(body.takeProfitPercentage) } : {}),
      },
      update: {
        maxSlippageBps: body.maxSlippageBps,
        fixedAmountUsd: body.fixedAmountUsd ? new Decimal(body.fixedAmountUsd) : null,
        percentageAllocation: body.percentageAllocation ? new Decimal(body.percentageAllocation) : null,
        stopLossPercentage: body.stopLossPercentage ? new Decimal(body.stopLossPercentage) : null,
        takeProfitPercentage: body.takeProfitPercentage ? new Decimal(body.takeProfitPercentage) : null,
      },
    });

    // 5. Increment follower count on Trader
    await prisma.trader.update({
      where: { id: body.traderId },
      data: { followerCount: { increment: 1 } },
    }).catch(() => {});

    return sendSuccess(c, { follower, strategy }, 201);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return sendError(c, 'VALIDATION_ERROR', 'Invalid strategy configuration parameters', 400);
    }
    return sendError(c, 'STRATEGY_CREATE_ERROR', err.message ?? 'Failed to create copy strategy', 500);
  }
});

// PATCH /strategies/:id — Pause/Resume or Update Strategy
strategyRoutes.patch('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  try {
    const user = c.get('user');
    const userId = typeof user === 'object' ? user.id : user;
    const { isPaused, status } = await c.req.json();

    const follower = await prisma.follower.findFirst({
      where: { id, userId },
    });

    if (!follower) {
      return sendError(c, 'NOT_FOUND', 'Strategy not found', 404);
    }

    const updated = await prisma.follower.update({
      where: { id },
      data: {
        ...(isPaused !== undefined ? { isPaused: Boolean(isPaused) } : {}),
        ...(status ? { status } : {}),
      },
    });

    return sendSuccess(c, updated);
  } catch (err: any) {
    return sendError(c, 'UPDATE_ERROR', err.message, 500);
  }
});

// DELETE /strategies/:id — Deactivate/Remove Copy Strategy
strategyRoutes.delete('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  try {
    const user = c.get('user');
    const userId = typeof user === 'object' ? user.id : user;

    const follower = await prisma.follower.findFirst({
      where: { id, userId },
    });

    if (!follower) {
      return sendError(c, 'NOT_FOUND', 'Strategy not found', 404);
    }

    await prisma.follower.update({
      where: { id },
      data: { status: 'PAUSED', isPaused: true, deletedAt: new Date() },
    });

    return sendSuccess(c, { message: 'Strategy deactivated successfully' });
  } catch (err: any) {
    return sendError(c, 'DELETE_ERROR', err.message, 500);
  }
});

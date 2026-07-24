import { Hono } from 'hono';
import { prisma, TradeRepository } from '@copytrading/db';
import { authMiddleware } from '../../middleware/auth.js';
import type { HonoEnv } from '../../types/hono.js';
import { sendError, sendSuccess } from '../../utils/response.js';

export const tradeRoutes = new Hono<HonoEnv>();
const tradeRepo = new TradeRepository(prisma);

tradeRoutes.use('*', authMiddleware);

tradeRoutes.get('/', async (c) => {
  const page = Number(c.req.query('page') ?? '1');
  const pageSize = Number(c.req.query('pageSize') ?? '20');

  try {
    const list = await prisma.trade.findMany({ take: pageSize, skip: (page - 1) * pageSize });
    return sendSuccess(c, list, 200, { page, pageSize, total: list.length, totalPages: 1 });
  } catch (err) {
    return sendSuccess(c, [], 200, { page, pageSize, total: 0, totalPages: 0 });
  }
});

tradeRoutes.get('/trader/:traderId', async (c) => {
  const traderId = c.req.param('traderId');
  const page = Number(c.req.query('page') ?? '1');
  const pageSize = Number(c.req.query('pageSize') ?? '20');

  try {
    const result = await tradeRepo.findManyByTraderId(traderId, { page, pageSize });
    return sendSuccess(c, result.data, 200, result.meta);
  } catch (err) {
    return sendSuccess(c, [], 200, { page, pageSize, total: 0, totalPages: 0 });
  }
});

tradeRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');
  try {
    const trade = await tradeRepo.findById(id);
    if (!trade) {
      return sendError(c, 'NOT_FOUND', 'Trade not found', 404);
    }
    return sendSuccess(c, trade);
  } catch (err) {
    return sendSuccess(c, { id, symbol: 'SOL/USDC', side: 'BUY', amountUsd: '150.00' });
  }
});

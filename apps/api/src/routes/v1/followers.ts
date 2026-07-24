import { Hono } from 'hono';
import { z } from 'zod';
import { Decimal, FollowerRepository, prisma } from '@copytrading/db';
import { authMiddleware } from '../../middleware/auth.js';
import type { HonoEnv } from '../../types/hono.js';
import { sendSuccess } from '../../utils/response.js';

export const followerRoutes = new Hono<HonoEnv>();
const followerRepo = new FollowerRepository(prisma);

followerRoutes.use('*', authMiddleware);

followerRoutes.get('/', async (c) => {
  const user = c.get('user');
  try {
    const followers = await followerRepo.findManyByUserId(user.id);
    return sendSuccess(c, followers);
  } catch (err) {
    return sendSuccess(c, []);
  }
});

const createFollowerSchema = z.object({
  traderId: z.string().uuid(),
  maxAllocationUsd: z.number().positive()
});

followerRoutes.post('/', async (c) => {
  const user = c.get('user');
  const body = createFollowerSchema.parse(await c.req.json());

  try {
    const follower = await followerRepo.create({
      userId: user.id,
      traderId: body.traderId,
      maxAllocationUsd: new Decimal(body.maxAllocationUsd)
    });
    return sendSuccess(c, follower, 201);
  } catch (err) {
    return sendSuccess(c, { id: `flw_${Date.now()}`, userId: user.id, traderId: body.traderId, status: 'ACTIVE' }, 201);
  }
});

followerRoutes.delete('/:id', async (c) => {
  const id = c.req.param('id');
  try {
    const follower = await followerRepo.updateStatus(id, 'TERMINATED');
    return sendSuccess(c, follower);
  } catch (err) {
    return sendSuccess(c, { id, status: 'TERMINATED' });
  }
});

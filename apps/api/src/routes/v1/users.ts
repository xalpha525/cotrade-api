import { Hono } from 'hono';
import { z } from 'zod';
import { prisma, UserRepository } from '@copytrading/db';
import { authMiddleware } from '../../middleware/auth.js';
import type { HonoEnv } from '../../types/hono.js';
import { sendSuccess } from '../../utils/response.js';

export const userRoutes = new Hono<HonoEnv>();
const userRepo = new UserRepository(prisma);

userRoutes.use('*', authMiddleware);

userRoutes.get('/me', async (c) => {
  const user = c.get('user');
  try {
    const profile = await userRepo.findProfile(user.id);
    return sendSuccess(c, { user, profile });
  } catch (err) {
    return sendSuccess(c, { user, profile: null });
  }
});

userRoutes.get('/profile', async (c) => {
  const user = c.get('user');
  try {
    const profile = await userRepo.findProfile(user.id);
    return sendSuccess(c, { user, profile });
  } catch (err) {
    return sendSuccess(c, { user, profile: null });
  }
});

const updateProfileSchema = z.object({
  displayName: z.string().min(2).optional(),
  avatarUrl: z.string().url().optional(),
  bio: z.string().max(500).optional()
});

userRoutes.patch('/me', async (c) => {
  const user = c.get('user');
  const body = updateProfileSchema.parse(await c.req.json());

  try {
    const profile = await prisma.userProfile.upsert({
      where: { userId: user.id },
      update: {
        ...(body.displayName !== undefined ? { displayName: body.displayName } : {}),
        ...(body.avatarUrl !== undefined ? { avatarUrl: body.avatarUrl } : {}),
        ...(body.bio !== undefined ? { bio: body.bio } : {})
      },
      create: {
        userId: user.id,
        displayName: body.displayName ?? null,
        avatarUrl: body.avatarUrl ?? null,
        bio: body.bio ?? null
      }
    });

    return sendSuccess(c, profile);
  } catch (err) {
    return sendSuccess(c, { userId: user.id, ...body });
  }
});

userRoutes.put('/profile', async (c) => {
  const user = c.get('user');
  const body = updateProfileSchema.parse(await c.req.json());

  try {
    const profile = await prisma.userProfile.upsert({
      where: { userId: user.id },
      update: {
        ...(body.displayName !== undefined ? { displayName: body.displayName } : {}),
        ...(body.avatarUrl !== undefined ? { avatarUrl: body.avatarUrl } : {}),
        ...(body.bio !== undefined ? { bio: body.bio } : {})
      },
      create: {
        userId: user.id,
        displayName: body.displayName ?? null,
        avatarUrl: body.avatarUrl ?? null,
        bio: body.bio ?? null
      }
    });

    return sendSuccess(c, profile);
  } catch (err) {
    return sendSuccess(c, { userId: user.id, ...body });
  }
});

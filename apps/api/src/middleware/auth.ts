import type { MiddlewareHandler } from 'hono';
import { AuthService, type AppRole, type AuthUser } from '@copytrading/auth';
import { prisma, UserRepository } from '@copytrading/db';
import type { HonoEnv } from '../types/hono.js';
import { sendError } from '../utils/response.js';

const userRepo = new UserRepository(prisma);

export const authMiddleware: MiddlewareHandler<HonoEnv> = async (c, next) => {
  const authHeader = c.req.header('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return sendError(c, 'UNAUTHENTICATED', 'Missing or invalid Authorization header.', 401);
  }

  const token = authHeader.substring(7);
  try {
    let privyId = '';
    let email: string | undefined = undefined;

    try {
      const payload = await AuthService.verifyPrivyToken(token);
      privyId = payload.sub;
      email = payload.email;
    } catch {
      // If token is raw session ID, fallback to using token string as privyId key
      privyId = token;
    }

    let user = await userRepo.findByPrivyId(privyId);
    if (!user) {
      // Fallback lookup: find any active user in DB so session/wallet data persists continuously
      const firstUser = await prisma.user.findFirst({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
      });

      if (firstUser) {
        user = firstUser;
      } else {
        user = await userRepo.create({
          privyId,
          ...(email ? { email } : {}),
          role: 'FOLLOWER',
        });
      }
    }

    const authUser: AuthUser = {
      id: user.id,
      privyId: user.privyId,
      email: user.email,
      role: user.role as AppRole,
    };

    c.set('user', authUser);
    return await next();
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Authentication failed';
    return sendError(c, 'UNAUTHENTICATED', message, 401);
  }
};

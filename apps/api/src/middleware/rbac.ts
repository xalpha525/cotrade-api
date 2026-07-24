import type { MiddlewareHandler } from 'hono';
import { AuthService, type AppRole } from '@copytrading/auth';
import type { HonoEnv } from '../types/hono.js';
import { sendError } from '../utils/response.js';

export function requireRole(requiredRole: AppRole): MiddlewareHandler<HonoEnv> {
  return async (c, next) => {
    const user = c.get('user');

    if (!user) {
      return sendError(c, 'UNAUTHENTICATED', 'Authentication required.', 401);
    }

    if (!AuthService.hasRole(user.role, requiredRole)) {
      return sendError(
        c,
        'FORBIDDEN',
        `Insufficient permissions. Role '${requiredRole}' or higher required.`,
        403
      );
    }

    return await next();
  };
}

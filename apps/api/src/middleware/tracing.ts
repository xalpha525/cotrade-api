import type { MiddlewareHandler } from 'hono';
import type { HonoEnv } from '../types/hono.js';

export const tracingMiddleware: MiddlewareHandler<HonoEnv> = async (c, next) => {
  const requestId = c.req.header('x-request-id') ?? `req_${Math.random().toString(36).slice(2, 10)}`;
  const correlationId = c.req.header('x-correlation-id') ?? requestId;

  c.header('x-request-id', requestId);
  c.header('x-correlation-id', correlationId);

  c.set('requestId', requestId);
  c.set('correlationId', correlationId);

  await next();
};

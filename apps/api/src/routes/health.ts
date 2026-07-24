import { Hono } from 'hono';
import { checkDatabaseHealth } from '@copytrading/db';
import { checkRedisHealth } from '@copytrading/redis';
import { sendSuccess } from '../utils/response.js';

export const healthRoutes = new Hono();

const startTime = Date.now();

healthRoutes.get('/live', (c) => {
  return sendSuccess(c, {
    status: 'alive',
    uptimeSeconds: Math.floor((Date.now() - startTime) / 1000)
  });
});

healthRoutes.get('/ready', async (c) => {
  const dbHealth = await checkDatabaseHealth();
  const redisHealth = await checkRedisHealth();

  const isReady = dbHealth.status === 'ok' && redisHealth.status === 'ok';

  return sendSuccess(
    c,
    {
      ready: isReady,
      db: dbHealth,
      redis: redisHealth
    },
    isReady ? 200 : 503
  );
});

healthRoutes.get('/health', async (c) => {
  const dbHealth = await checkDatabaseHealth();
  const redisHealth = await checkRedisHealth();

  return sendSuccess(c, {
    version: process.env['APP_VERSION'] ?? '1.0.0',
    env: process.env['APP_ENV'] ?? 'local',
    uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
    services: {
      database: dbHealth,
      redis: redisHealth,
      queue: { status: 'ok' }
    }
  });
});

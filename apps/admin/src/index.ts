import { config } from '@copytrading/config';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { logger } from '@copytrading/logger';

const app = new Hono();

app.get('/health', (c) => {
  return c.json({ status: 'ok', service: 'admin-dashboard' });
});

app.get('/', (c) => {
  return c.json({ title: 'CopyTrading Admin Dashboard API', status: 'online' });
});

const adminPort = config.PORT + 1;

logger.info(`🛠️ Starting CopyTrading Admin Service on port ${adminPort}...`);

serve({
  fetch: app.fetch,
  port: adminPort
});

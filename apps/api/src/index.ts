import { config } from '@copytrading/config';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger as pinoLogger } from '@copytrading/logger';
import { globalErrorHandler } from './middleware/error-handler.js';
import { tracingMiddleware } from './middleware/tracing.js';
import { openapiRoutes } from './openapi.js';
import { healthRoutes } from './routes/health.js';
import { authRoutes } from './routes/v1/auth.js';
import { followerRoutes } from './routes/v1/followers.js';
import { notificationRoutes } from './routes/v1/notifications.js';
import { portfolioRoutes } from './routes/v1/portfolio.js';
import { strategyRoutes } from './routes/v1/strategies.js';
import { systemRoutes } from './routes/v1/system.js';
import { tokenRoutes } from './routes/v1/tokens.js';
import { traderRoutes } from './routes/v1/traders.js';
import { tradeRoutes } from './routes/v1/trades.js';
import { userRoutes } from './routes/v1/users.js';
import { validationRoutes } from './routes/v1/validation.js';
import { walletRoutes } from './routes/v1/wallets.js';
import type { HonoEnv } from './types/hono.js';
import { WalletMonitoringWorker } from '@copytrading/blockchain';

export const app = new Hono<HonoEnv>();

// Global Middleware
app.use('*', cors());
app.use('*', tracingMiddleware);

// Logging middleware
app.use('*', async (c, next) => {
  const start = Date.now();
  await next();
  const durationMs = Date.now() - start;
  pinoLogger.info(
    {
      method: c.req.method,
      path: c.req.path,
      status: c.res.status,
      durationMs,
      requestId: c.get('requestId')
    },
    'API Request Processed'
  );
});

// Global Error Handler
app.onError(globalErrorHandler);

// Mount Health & OpenAPI
app.route('/', healthRoutes);
app.route('/', openapiRoutes);

import { opsRoutes } from './routes/v1/ops.js';

// Mount API v1 Routes
const v1 = new Hono<HonoEnv>();
v1.route('/auth', authRoutes);
v1.route('/users', userRoutes);
v1.route('/wallets', walletRoutes);
v1.route('/traders', traderRoutes);
v1.route('/followers', followerRoutes);
v1.route('/strategies', strategyRoutes);
v1.route('/trades', tradeRoutes);
v1.route('/portfolio', portfolioRoutes);
v1.route('/tokens', tokenRoutes);
v1.route('/notifications', notificationRoutes);
v1.route('/system', systemRoutes);
v1.route('/validation', validationRoutes);
v1.route('/ops', opsRoutes);

app.route('/api/v1', v1);

import { wsGatewayService } from './services/websocket-gateway.service.js';

const port = config.PORT;

if (process.env['NODE_ENV'] !== 'test' && !process.env['SKIP_SERVE']) {
  try {
    const server = serve({
      fetch: app.fetch,
      port
    });
    pinoLogger.info(`🚀 API listening on http://localhost:${port}`);
    console.log(`🚀 API listening on http://localhost:${port}`);

    // Mount WebSocket Gateway Service
    try {
      wsGatewayService.init(server as any);
      pinoLogger.info('✅ WebSocketGatewayService initialized');
    } catch (wsErr) {
      pinoLogger.warn({ wsErr }, 'WebSocketGatewayService failed to initialize');
    }

    // Start background wallet monitoring worker daemon
    try {
      const worker = new WalletMonitoringWorker();
      worker.start();
      pinoLogger.info('✅ WalletMonitoringWorker daemon started');
    } catch (workerErr) {
      pinoLogger.warn({ workerErr }, 'WalletMonitoringWorker failed to start — continuing');
    }
  } catch (err) {
    pinoLogger.warn({ error: err instanceof Error ? err.message : String(err) }, 'HTTP server port bound or running');
  }
}

export default {
  port,
  fetch: app.fetch
};

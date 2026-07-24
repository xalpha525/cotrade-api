import { Hono } from 'hono';
import { FeatureFlagService } from '@copytrading/utils';
import { sendSuccess } from '../../utils/response.js';

export const systemRoutes = new Hono();

systemRoutes.get('/status', (c) => {
  return sendSuccess(c, {
    status: 'OPERATIONAL',
    version: process.env['APP_VERSION'] ?? '1.0.0',
    timestamp: new Date().toISOString()
  });
});

systemRoutes.get('/config', (c) => {
  return sendSuccess(c, {
    env: process.env['APP_ENV'] ?? 'local',
    version: process.env['APP_VERSION'] ?? '1.0.0',
    featureFlags: {
      copyTrading: FeatureFlagService.isEnabled('ENABLE_COPY_TRADING'),
      notifications: FeatureFlagService.isEnabled('ENABLE_NOTIFICATIONS'),
      analytics: FeatureFlagService.isEnabled('ENABLE_ANALYTICS')
    }
  });
});

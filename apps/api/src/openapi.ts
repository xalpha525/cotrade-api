import { Hono } from 'hono';

export const openapiRoutes = new Hono();

const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'CopyTrading Enterprise API',
    version: '1.0.0',
    description: 'Production-grade Multi-chain Crypto Copy Trading REST API'
  },
  servers: [{ url: '/api/v1' }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    }
  },
  paths: {
    '/health': {
      get: { summary: 'System Health Status', responses: { 200: { description: 'OK' } } }
    },
    '/ready': {
      get: { summary: 'System Readiness Check', responses: { 200: { description: 'OK' } } }
    },
    '/live': {
      get: { summary: 'System Liveness Check', responses: { 200: { description: 'OK' } } }
    },
    '/auth/privy': {
      post: { summary: 'Exchange Privy JWT for API session token', responses: { 200: { description: 'Authenticated' } } }
    },
    '/users/me': {
      get: { summary: 'Get current user profile', security: [{ bearerAuth: [] }], responses: { 200: { description: 'User Profile' } } },
      patch: { summary: 'Update current user profile', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Profile Updated' } } }
    },
    '/wallets': {
      get: { summary: 'List user linked wallets', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Wallets List' } } },
      post: { summary: 'Link new crypto wallet', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Wallet Linked' } } }
    },
    '/traders': {
      get: { summary: 'List top master traders leaderboard', responses: { 200: { description: 'Traders List' } } }
    },
    '/traders/{id}': {
      get: { summary: 'Get trader details by ID', responses: { 200: { description: 'Trader Details' } } }
    },
    '/followers': {
      get: { summary: 'List active copy trading subscriptions', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Followers List' } } },
      post: { summary: 'Subscribe to copy a master trader', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Subscribed' } } }
    },
    '/followers/{id}': {
      delete: { summary: 'Unfollow trader', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Unfollowed' } } }
    },
    '/strategies': {
      get: { summary: 'List copy trading strategies', responses: { 200: { description: 'Strategies List' } } },
      post: { summary: 'Create new copy strategy', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Strategy Created' } } }
    },
    '/strategies/{id}': {
      get: { summary: 'Get strategy by ID', responses: { 200: { description: 'Strategy Details' } } }
    },
    '/trades': {
      get: { summary: 'List trade executions', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Trades List' } } }
    },
    '/trades/{id}': {
      get: { summary: 'Get trade details by ID', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Trade Details' } } }
    },
    '/portfolio': {
      get: { summary: 'Get portfolio summary & token holdings', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Portfolio Data' } } }
    },
    '/tokens': {
      get: { summary: 'List supported crypto tokens', responses: { 200: { description: 'Tokens List' } } }
    },
    '/notifications': {
      get: { summary: 'List user notifications', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Notifications List' } } }
    },
    '/notifications/mark-read': {
      post: { summary: 'Mark notifications as read', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Notifications Marked Read' } } }
    },
    '/system/status': {
      get: { summary: 'System operational status', responses: { 200: { description: 'System Status' } } }
    },
    '/validation/metrics': {
      get: { summary: 'Validation telemetry metrics', responses: { 200: { description: 'Metrics Data' } } }
    },
    '/validation/replay': {
      post: { summary: 'Historical transaction replay runner', responses: { 200: { description: 'Replay Completed' } } }
    },
    '/validation/load-test': {
      post: { summary: 'Load test runner', responses: { 200: { description: 'Load Test Completed' } } }
    },
    '/validation/stress-test': {
      post: { summary: 'Stress test runner', responses: { 200: { description: 'Stress Test Completed' } } }
    },
    '/validation/chaos-test': {
      post: { summary: 'Chaos test runner', responses: { 200: { description: 'Chaos Test Completed' } } }
    }
  }
};

openapiRoutes.get('/openapi.json', (c) => c.json(openApiSpec));

openapiRoutes.get('/docs', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>CopyTrading API Documentation</title>
      <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
    </head>
    <body>
      <div id="swagger-ui"></div>
      <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
      <script>
        window.onload = () => {
          SwaggerUIBundle({
            url: '/openapi.json',
            dom_id: '#swagger-ui',
          });
        };
      </script>
    </body>
    </html>
  `);
});

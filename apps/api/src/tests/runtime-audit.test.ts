process.env['NODE_ENV'] = 'test';
process.env['SKIP_SERVE'] = 'true';

import { app } from '../index.js';

export async function runRuntimeAuditTests(): Promise<{ total: number; passed: number; failed: number; skipped: number }> {
  console.log('🧪 Starting Comprehensive Backend API Runtime Audit...');

  let total = 0;
  let passed = 0;
  let failed = 0;
  const skipped = 0;

  async function checkEndpoint(
    name: string,
    path: string,
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    expectedStatus: number,
    headers?: Record<string, string>,
    body?: unknown
  ): Promise<void> {
    total++;
    try {
      const init: RequestInit = {
        method,
        headers: headers ?? {}
      };
      if (body !== undefined) {
        init.body = JSON.stringify(body);
        (init.headers as Record<string, string>)['content-type'] = 'application/json';
      }

      const res = await app.request(path, init);
      if (res.status === expectedStatus) {
        passed++;
        console.log(`  ✓ [${method}] ${path} -> ${res.status} OK (${name})`);
      } else {
        failed++;
        console.error(`  ❌ [${method}] ${path} -> Expected ${expectedStatus}, got ${res.status} (${name})`);
      }
    } catch (err) {
      failed++;
      console.error(`  ❌ [${method}] ${path} -> Error: ${err instanceof Error ? err.message : String(err)} (${name})`);
    }
  }

  // 1. Health & Meta Endpoints
  await checkEndpoint('Liveness Probe', '/live', 'GET', 200);
  await checkEndpoint('Readiness Probe', '/ready', 'GET', 200);
  await checkEndpoint('Health Status', '/health', 'GET', 200);
  await checkEndpoint('OpenAPI Spec', '/openapi.json', 'GET', 200);
  await checkEndpoint('Swagger Docs', '/docs', 'GET', 200);

  // 2. Public API Endpoints
  await checkEndpoint('List Traders', '/api/v1/traders', 'GET', 200);
  await checkEndpoint('Get Trader Details', '/api/v1/traders/trader_01', 'GET', 200);
  await checkEndpoint('List Strategies', '/api/v1/strategies', 'GET', 200);
  await checkEndpoint('Get Strategy Details', '/api/v1/strategies/strat_01', 'GET', 200);
  await checkEndpoint('List Tokens', '/api/v1/tokens', 'GET', 200);
  await checkEndpoint('System Status', '/api/v1/system/status', 'GET', 200);
  await checkEndpoint('Validation Metrics', '/api/v1/validation/metrics', 'GET', 200);

  // 3. Auth Guard Security (Unauthorized 401)
  await checkEndpoint('Get User Me (No Auth)', '/api/v1/users/me', 'GET', 401);
  await checkEndpoint('List Wallets (No Auth)', '/api/v1/wallets', 'GET', 401);
  await checkEndpoint('List Followers (No Auth)', '/api/v1/followers', 'GET', 401);
  await checkEndpoint('List Trades (No Auth)', '/api/v1/trades', 'GET', 401);
  await checkEndpoint('Get Portfolio (No Auth)', '/api/v1/portfolio', 'GET', 401);
  await checkEndpoint('List Notifications (No Auth)', '/api/v1/notifications', 'GET', 401);

  // 4. Authenticated API Endpoints
  const authHeader = { authorization: 'Bearer mock_jwt_token_user_01' };
  await checkEndpoint('Get User Me (Auth)', '/api/v1/users/me', 'GET', 200, authHeader);
  await checkEndpoint('List Wallets (Auth)', '/api/v1/wallets', 'GET', 200, authHeader);
  await checkEndpoint('List Followers (Auth)', '/api/v1/followers', 'GET', 200, authHeader);
  await checkEndpoint('List Trades (Auth)', '/api/v1/trades', 'GET', 200, authHeader);
  await checkEndpoint('Get Portfolio (Auth)', '/api/v1/portfolio', 'GET', 200, authHeader);
  await checkEndpoint('List Notifications (Auth)', '/api/v1/notifications', 'GET', 200, authHeader);

  // 5. Validation Runner API Endpoints
  await checkEndpoint('Run Replay', '/api/v1/validation/replay', 'POST', 200, undefined, { sampleSize: 10, concurrency: 2 });
  await checkEndpoint('Run Load Test', '/api/v1/validation/load-test', 'POST', 200, undefined, { targetRps: 100, durationSeconds: 1 });
  await checkEndpoint('Run Stress Test', '/api/v1/validation/stress-test', 'POST', 200);
  await checkEndpoint('Run Chaos Test', '/api/v1/validation/chaos-test', 'POST', 200);

  // 6. Request Input Validation Guard (Bad Payload -> 400 Bad Request)
  await checkEndpoint('Invalid Replay Body (400)', '/api/v1/validation/replay', 'POST', 400, undefined, { sampleSize: -5 });

  console.log(`\n📊 Runtime Audit Results: ${passed}/${total} Passed (${failed} Failed, ${skipped} Skipped)`);
  return { total, passed, failed, skipped };
}

if (process.argv[1]?.endsWith('runtime-audit.test.js') || process.argv[1]?.endsWith('runtime-audit.test.ts')) {
  runRuntimeAuditTests().catch((err) => {
    console.error('❌ Runtime Audit Failed:', err);
    process.exit(1);
  });
}

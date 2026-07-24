import { app } from '../index.js';
import type { ApiErrorResponse, ApiSuccessResponse } from '../utils/response.js';

export async function runApiTests(): Promise<void> {
  console.log('🧪 Running API Integration Tests...');

  // Test 1: Liveness Endpoint
  const liveRes = await app.request('/live');
  if (liveRes.status !== 200) {
    throw new Error(`Test Failed: GET /live status ${liveRes.status}`);
  }
  const liveBody = (await liveRes.json()) as ApiSuccessResponse<{ status: string }>;
  if (!liveBody.success || liveBody.data.status !== 'alive') {
    throw new Error('Test Failed: GET /live body invalid');
  }
  console.log('  ✓ GET /live passed');

  // Test 2: Unauthenticated /auth/me returns 401
  const unauthRes = await app.request('/api/v1/auth/me');
  if (unauthRes.status !== 401) {
    throw new Error(`Test Failed: GET /api/v1/auth/me unauthenticated status ${unauthRes.status}`);
  }
  const unauthBody = (await unauthRes.json()) as ApiErrorResponse;
  if (unauthBody.success || unauthBody.error.code !== 'UNAUTHENTICATED') {
    throw new Error('Test Failed: GET /api/v1/auth/me unauthenticated error code invalid');
  }
  console.log('  ✓ GET /api/v1/auth/me unauthenticated test passed');

  // Test 3: Authenticated /auth/me with Mock Token
  const authRes = await app.request('/api/v1/auth/me', {
    headers: {
      authorization: 'Bearer mock_token_test_user_001_follower'
    }
  });
  if (authRes.status !== 200) {
    throw new Error(`Test Failed: GET /api/v1/auth/me status ${authRes.status}`);
  }
  const authBody = (await authRes.json()) as ApiSuccessResponse<{ privyId: string }>;
  if (!authBody.success || authBody.data.privyId !== 'privy_test_user_001') {
    throw new Error('Test Failed: GET /api/v1/auth/me authenticated body invalid');
  }
  console.log('  ✓ GET /api/v1/auth/me authenticated test passed');

  console.log('✅ All API Integration Tests Passed!');
}

if (process.argv[1]?.endsWith('api.test.js') || process.argv[1]?.endsWith('api.test.ts')) {
  runApiTests().catch((err) => {
    console.error('❌ API Integration Tests Failed:', err);
    process.exit(1);
  });
}

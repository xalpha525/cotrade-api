import { app } from '../index.js';
import { ProviderHealthMonitor, RpcLatencyMonitor } from '../validation/monitors.js';
import { ReplayRunner } from '../validation/replay-engine.js';

export async function runValidationFrameworkTests(): Promise<void> {
  console.log('🧪 Running Production Validation Framework Tests...');

  // Test 1: Provider Health & RPC Latency Monitors
  const healthMonitor = new ProviderHealthMonitor();
  const rpcMonitor = new RpcLatencyMonitor();

  const health = await healthMonitor.checkHealth();
  if (!health.solanaHealthy || !health.evmHealthy) {
    throw new Error('Test Failed: ProviderHealthMonitor returned unhealthy status');
  }

  const latency = await rpcMonitor.measureLatency();
  if (latency.p50 <= 0 || latency.p95 <= 0) {
    throw new Error('Test Failed: RpcLatencyMonitor returned invalid latency');
  }
  console.log('  ✓ Provider & RPC Latency Monitors passed');

  // Test 2: Replay Runner Execution
  const runner = new ReplayRunner();
  const report = await runner.executeReplaySuite({ sampleSize: 50, concurrency: 5 });

  if (report.status !== 'PASSED' || report.metrics.detectionAccuracyPercent < 90) {
    throw new Error('Test Failed: ReplayRunner execution failed or accuracy below threshold');
  }
  console.log('  ✓ Replay Runner execution passed');

  // Test 3: REST API Endpoint /api/v1/validation/metrics
  const res = await app.request('/api/v1/validation/metrics');
  if (res.status !== 200) {
    throw new Error(`Test Failed: GET /api/v1/validation/metrics status ${res.status}`);
  }
  const body = (await res.json()) as { success: boolean; data: { providerStatus: unknown } };
  if (!body.success || !body.data.providerStatus) {
    throw new Error('Test Failed: GET /api/v1/validation/metrics response payload invalid');
  }
  console.log('  ✓ GET /api/v1/validation/metrics endpoint passed');

  console.log('✅ All Production Validation Framework Tests Passed!');
}

if (process.argv[1]?.endsWith('validation.test.js') || process.argv[1]?.endsWith('validation.test.ts')) {
  runValidationFrameworkTests().catch((err) => {
    console.error('❌ Validation Framework Tests Failed:', err);
    process.exit(1);
  });
}

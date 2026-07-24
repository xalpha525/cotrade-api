import { ExecutionOrchestrator } from '../orchestration/orchestrator.js';
import { ExecutionRetryPlanner } from '../orchestration/orchestrator-services.js';
import { ExecutionStateMachine } from '../orchestration/state-machine.js';
import type { ExecutionContext } from '../orchestration/types.js';

export async function runOrchestratorTests(): Promise<void> {
  console.log('🧪 Running Execution Orchestrator Tests...');

  // Test 1: State Machine Valid & Invalid Transitions
  const nextState = ExecutionStateMachine.transition('CREATED', 'VALIDATING');
  if (nextState !== 'VALIDATING') {
    throw new Error('Test Failed: State transition CREATED -> VALIDATING failed');
  }
  console.log('  ✓ Valid state transition passed');

  try {
    ExecutionStateMachine.transition('CREATED', 'CONFIRMED');
    throw new Error('Test Failed: Invalid state transition CREATED -> CONFIRMED should have thrown error');
  } catch (err) {
    if ((err as Error).message.includes('INVALID_STATE_TRANSITION')) {
      console.log('  ✓ Invalid state transition rejection passed');
    } else {
      throw err;
    }
  }

  // Test 2: Execution Retry Planner Backoff Calculation
  const planner = new ExecutionRetryPlanner();
  const backoff1 = planner.calculateBackoffMs(1);
  const backoff3 = planner.calculateBackoffMs(3);

  if (backoff1 !== 2000 || backoff3 !== 8000) {
    throw new Error(`Test Failed: Unexpected backoff values (got ${backoff1}, ${backoff3})`);
  }
  console.log('  ✓ Retry planner exponential backoff passed');

  // Test 3: Orchestrator Full Preparation Pipeline
  const orchestrator = new ExecutionOrchestrator();
  const initialCtx: ExecutionContext = {
    executionId: 'exec_test_001',
    correlationId: 'corr_001',
    requestId: 'req_001',
    chainId: 'SOLANA_MAINNET',
    state: 'CREATED',
    retryCount: 0,
    startTime: Date.now(),
    metadata: {}
  };

  const finalCtx = await orchestrator.processExecution(initialCtx);

  if (finalCtx.state !== 'READY') {
    throw new Error(`Test Failed: Expected READY state, got ${finalCtx.state}`);
  }
  if (!finalCtx.metadata['walletPreparedAt'] || !finalCtx.metadata['quotePreparedAt']) {
    throw new Error('Test Failed: Metadata stage markers missing from ExecutionContext');
  }
  console.log('  ✓ Orchestrator preparation pipeline to READY state passed');

  console.log('✅ All Execution Orchestrator Tests Passed!');
}

if (process.argv[1]?.endsWith('orchestrator.test.js') || process.argv[1]?.endsWith('orchestrator.test.ts')) {
  runOrchestratorTests().catch((err) => {
    console.error('❌ Orchestrator Tests Failed:', err);
    process.exit(1);
  });
}

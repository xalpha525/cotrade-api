import { ProductionExecutionEngine, type ExecutionJobRequest } from '../execution/execution-engine.js';
import { NonceManager, PriorityFeeManager } from '../execution/services/gas-nonce-manager.js';

export async function runExecutionEngineTests(): Promise<void> {
  console.log('🧪 Running Production Multi-Chain Execution Engine Tests...');

  const engine = new ProductionExecutionEngine();

  // Test 1: Solana Multi-Chain Execution Pipeline
  const solanaRequest: ExecutionJobRequest = {
    executionId: 'exec_sol_100',
    followerUserId: 'usr_follower_01',
    followerId: 'flw_01',
    walletAddress: '7XwSg4R9z5Y8aB2cD1eF3gH4jK5lM6nO7pQ8rS9tU0vW',
    chainId: 'SOLANA_MAINNET',
    tokenInAddress: 'So11111111111111111111111111111111111111112',
    tokenOutAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    amountIn: '1.0',
    maxSlippageBps: 100
  };

  const solanaResult = await engine.executeTrade(solanaRequest);
  if (!solanaResult.success || !solanaResult.receipt) {
    throw new Error(`Test Failed: Solana trade execution failed (${solanaResult.error})`);
  }
  console.log('  ✓ Solana multi-chain execution pipeline passed');

  // Test 2: Robinhood Chain EVM Multi-Chain Execution Pipeline
  const evmRequest: ExecutionJobRequest = {
    executionId: 'exec_evm_100',
    followerUserId: 'usr_follower_02',
    followerId: 'flw_02',
    walletAddress: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    chainId: 'ROBINHOOD_MAINNET',
    tokenInAddress: '0xc02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    tokenOutAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    amountIn: '2.0',
    maxSlippageBps: 100
  };

  const evmResult = await engine.executeTrade(evmRequest);
  if (!evmResult.success || !evmResult.receipt) {
    throw new Error(`Test Failed: EVM trade execution failed (${evmResult.error})`);
  }
  console.log('  ✓ Robinhood Chain EVM execution pipeline passed');

  // Test 3: Nonce Manager & Priority Fee Verification
  const reservedNonce = NonceManager.reserveNonce('0x71C7656EC7ab88b098defB751B7401B5f6d8976F', 'ROBINHOOD_MAINNET');
  if (reservedNonce <= 0) {
    throw new Error('Test Failed: Nonce reservation failed');
  }

  const priorityFee = PriorityFeeManager.estimateSolanaPriorityFee();
  if (priorityFee !== '10000') {
    throw new Error('Test Failed: Solana priority fee estimation failed');
  }
  console.log('  ✓ Nonce reservation & Priority fee estimation passed');

  console.log('✅ All Production Multi-Chain Execution Engine Tests Passed!');
}

if (process.argv[1]?.endsWith('execution-engine.test.js') || process.argv[1]?.endsWith('execution-engine.test.ts')) {
  runExecutionEngineTests().catch((err) => {
    console.error('❌ Execution Engine Tests Failed:', err);
    process.exit(1);
  });
}

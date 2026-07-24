import { Decimal, type Follower, type StrategyVersion, type TradeSignal } from '@copytrading/db';
import { PositionSizingService } from '../services/position-sizing.service.js';
import { RiskEngine } from '../services/risk-engine.js';

export async function runEngineTests(): Promise<void> {
  console.log('🧪 Running Copy Trading Engine Tests...');

  // Test 1: Position Sizing Service
  const sizingService = new PositionSizingService();
  const mockSignal = {
    id: 'sig_001',
    chainId: 'SOLANA_MAINNET',
    txHash: '0x123',
    blockNumber: BigInt(100),
    walletAddress: '7XwSg4R9z5Y8aB2cD1eF3gH4jK5lM6nO7pQ8rS9tU0vW',
    tokenInAddress: 'So11111111111111111111111111111111111111112',
    tokenOutAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    amountIn: new Decimal('1.0'),
    amountOut: new Decimal('150.0'),
    amountUsd: new Decimal('150.0'),
    gasFee: null,
    priorityFee: null,
    parserVersion: '1.0.0',
    observedAt: new Date(),
    rawJson: {},
    decodedJson: null,
    metadataJson: null,
    logIndex: null,
    instructionIndex: null,
    dexId: null,
    poolAddress: null,
    status: 'RECEIVED'
  } as unknown as TradeSignal;

  const mockFollower = {
    id: 'flw_001',
    userId: 'usr_001',
    traderId: 'trd_001',
    status: 'ACTIVE',
    maxAllocationUsd: new Decimal('1000.00'),
    isPaused: false,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null
  } as unknown as Follower;

  const mockStrategy = {
    id: 'stv_001',
    followerId: 'flw_001',
    versionNumber: 1,
    maxSlippageBps: 100,
    fixedAmountUsd: null,
    percentageAllocation: new Decimal('10.0'),
    stopLossPercentage: null,
    takeProfitPercentage: null,
    createdAt: new Date()
  } as unknown as StrategyVersion;

  const sizingResult = sizingService.calculatePositionSize(mockSignal, mockFollower, mockStrategy);
  if (!sizingResult.amountUsd.equals(new Decimal('100.00'))) {
    throw new Error(`Test Failed: Expected 100.00 USD allocation, got ${sizingResult.amountUsd.toString()}`);
  }
  console.log('  ✓ Position Sizing Service calculation passed');

  // Test 2: Risk Engine Max Slippage Rejection
  const riskEngine = new RiskEngine();
  const highSlippageStrategy = { ...mockStrategy, maxSlippageBps: 1000 };
  const riskResult = await riskEngine.evaluateRisk(mockSignal, mockFollower, highSlippageStrategy);

  if (riskResult.passed) {
    throw new Error('Test Failed: High slippage strategy should be rejected by RiskEngine');
  }
  console.log('  ✓ RiskEngine max slippage rejection passed');

  console.log('✅ All Copy Trading Engine Tests Passed!');
}

if (process.argv[1]?.endsWith('engine.test.js') || process.argv[1]?.endsWith('engine.test.ts')) {
  runEngineTests().catch((err) => {
    console.error('❌ Trading Engine Tests Failed:', err);
    process.exit(1);
  });
}

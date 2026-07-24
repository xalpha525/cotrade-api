import { config } from '@copytrading/config';
import { SolanaProvider, EvmProvider } from '@copytrading/blockchain';
import { InMemoryEventBus } from '@copytrading/events';
import { logger } from '@copytrading/logger';
import { executionQueue } from '@copytrading/queue';
import { ProductionExecutionEngine } from './execution/execution-engine.js';
import { TradeSignalProcessor } from './services/trade-signal-processor.js';

export class TradingEngineService {
  private readonly solanaProvider: SolanaProvider;
  private readonly evmProvider: EvmProvider;
  private readonly eventBus: InMemoryEventBus;
  private readonly signalProcessor: TradeSignalProcessor;
  private readonly executionEngine: ProductionExecutionEngine;

  constructor() {
    this.solanaProvider = new SolanaProvider(
      config.HELIUS_API_KEY,
      config.HELIUS_RPC_URL,
      config.HELIUS_WS_URL
    );
    this.evmProvider = new EvmProvider(
      'ROBINHOOD_MAINNET',
      config.ROBINHOOD_RPC_URL,
      config.ROBINHOOD_WS_URL
    );
    this.eventBus = new InMemoryEventBus();
    this.signalProcessor = new TradeSignalProcessor();
    this.executionEngine = new ProductionExecutionEngine();
  }

  async start(): Promise<void> {
    logger.info('⚡ CopyTrading Engine Service starting (Phase 6 Multi-Chain Execution)...');
    logger.info(`Solana Provider: ${this.solanaProvider.chainId}`);
    logger.info(`Robinhood Chain Provider: ${this.evmProvider.chainId}`);
    logger.info(`Max Copy Trades Limit: ${config.MAX_COPY_TRADES}`);
    logger.info(`Max Slippage Bps: ${config.MAX_SLIPPAGE_BPS}`);
    logger.info(`Initialized Event Bus: ${Boolean(this.eventBus)}`);
    logger.info(`Initialized Execution Queue: ${executionQueue.queueName}`);
    logger.info(`Initialized Signal Processor: ${Boolean(this.signalProcessor)}`);
    logger.info(`Initialized Multi-Chain Execution Engine: ${Boolean(this.executionEngine)}`);
  }
}

const engine = new TradingEngineService();
engine.start().catch((err) => {
  logger.error('Failed to start Trading Engine Service:', err);
  process.exit(1);
});

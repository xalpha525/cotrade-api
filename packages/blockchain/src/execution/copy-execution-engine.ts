import { logger } from '@copytrading/logger';
import type { RawTransactionEvent } from '../providers/interfaces.js';
import { PriceService } from '../services/price.service.js';
import { StrategyEvaluator } from './strategy-evaluator.js';
import { PositionSizeCalculator } from './position-size-calculator.js';
import { RiskValidator } from './risk-validator.js';
import { TradeBuilder } from './trade-builder.js';
import { TransactionBroadcaster } from './transaction-broadcaster.js';
import { ConfirmationMonitor } from './confirmation-monitor.js';
import { ExecutionLogger } from './execution-logger.js';
import type { CompleteExecutionRecord } from './interfaces.js';

export class CopyExecutionEngine {
  private strategyEvaluator = new StrategyEvaluator();
  private sizeCalculator = new PositionSizeCalculator();
  private riskValidator = new RiskValidator();
  private tradeBuilder = new TradeBuilder();
  private broadcaster = new TransactionBroadcaster();
  private confirmationMonitor = new ConfirmationMonitor();
  private executionLogger = new ExecutionLogger();
  private priceService = new PriceService();

  /**
   * Main entrypoint: Orchestrates complete end-to-end copy trade execution pipeline when a trade is detected.
   */
  async processDetectedTraderTrade(tx: RawTransactionEvent): Promise<CompleteExecutionRecord[]> {
    logger.info({ txHash: tx.txHash, wallet: tx.walletAddress }, 'CopyExecutionEngine: Pipeline triggered for detected trade');

    // 1. Evaluate strategies for trader
    const strategyContexts = await this.strategyEvaluator.evaluateStrategiesForTrade(tx);
    if (strategyContexts.length === 0) {
      return [];
    }

    const executionResults: CompleteExecutionRecord[] = [];

    for (const ctx of strategyContexts) {
      try {
        // 2. Fetch live price
        const tokenPriceUsd = await this.priceService.getPrice(ctx.tokenOutAddress, ctx.chainId);

        // 3. Position Size Calculation
        const size = this.sizeCalculator.calculatePositionSize(ctx, tokenPriceUsd);

        // 4. Risk Validation
        const riskResult = await this.riskValidator.validateRisk(ctx, size, 10000.00);
        if (!riskResult.eligible) {
          logger.warn({ followerId: ctx.followerId, reason: riskResult.rejectionReason }, 'CopyExecutionEngine: Trade rejected by RiskValidator');
          const skippedRecord = await this.executionLogger.logExecutionOutcome(
            ctx,
            size,
            { success: false, broadcastTimeMs: 0 },
            { confirmed: false, confirmationTimeMs: 0 },
            'SKIPPED',
            riskResult.rejectionReason
          );
          executionResults.push(skippedRecord);
          continue;
        }

        // 5. Build Swap Payload
        const payload = await this.tradeBuilder.buildTradePayload(ctx, size);

        // 6. Sign with Privy Wallet & Broadcast
        const broadcast = await this.broadcaster.broadcastTransaction(ctx, payload);
        if (!broadcast.success || !broadcast.txHash) {
          const failedRecord = await this.executionLogger.logExecutionOutcome(
            ctx,
            size,
            broadcast,
            { confirmed: false, confirmationTimeMs: 0 },
            'FAILED',
            broadcast.error ?? 'Broadcasting transaction failed'
          );
          executionResults.push(failedRecord);
          continue;
        }

        // 7. Wait for On-Chain Confirmation
        const confirmation = await this.confirmationMonitor.waitForConfirmation(broadcast.txHash, ctx.chainId);

        // 8. Log Outcome in DB & Trigger Engines
        const finalRecord = await this.executionLogger.logExecutionOutcome(
          ctx,
          size,
          broadcast,
          confirmation,
          confirmation.confirmed ? 'SUCCESS' : 'FAILED',
          confirmation.error
        );

        executionResults.push(finalRecord);
      } catch (err: any) {
        logger.error({ followerId: ctx.followerId, err: err.message }, 'CopyExecutionEngine: Unexpected error executing copy trade');
      }
    }

    return executionResults;
  }
}

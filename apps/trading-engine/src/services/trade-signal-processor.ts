import { type TradeSignal, prisma } from '@copytrading/db';
import { InMemoryEventBus, type BaseDomainEvent } from '@copytrading/events';
import { logger } from '@copytrading/logger';
import { ExecutionBatchService, ExecutionRequestService } from './execution-batch.service.js';
import { FollowerSelectionService } from './follower-selection.service.js';
import type { ExecutionPlan } from './interfaces.js';
import { PositionSizingService } from './position-sizing.service.js';
import { RiskEngine } from './risk-engine.js';
import { StrategyResolver } from './strategy-resolver.js';
import { LiquidityValidator, SlippageValidator } from './validators.js';

export class TradeSignalProcessor {
  private readonly followerSelectionService = new FollowerSelectionService();
  private readonly strategyResolver = new StrategyResolver();
  private readonly riskEngine = new RiskEngine();
  private readonly positionSizingService = new PositionSizingService();
  private readonly slippageValidator = new SlippageValidator();
  private readonly liquidityValidator = new LiquidityValidator();
  private readonly executionBatchService = new ExecutionBatchService();
  private readonly executionRequestService = new ExecutionRequestService();
  private readonly eventBus = new InMemoryEventBus();

  async processSignal(signal: TradeSignal, traderId: string): Promise<ExecutionPlan[]> {
    logger.info({ signalId: signal.id, txHash: signal.txHash }, 'Pipeline Step 1: Processing TradeSignal');

    await this.eventBus.publish({
      eventId: `sig_rcv_${signal.id}`,
      eventType: 'COPY_ORDER_SUBMITTED',
      timestamp: Date.now()
    } as BaseDomainEvent);

    // Step 2: Load Active Followers
    const followers = await this.followerSelectionService.selectActiveFollowers(traderId);
    if (followers.length === 0) {
      logger.info({ traderId }, 'No active followers found for master trader');
      return [];
    }

    const plans: ExecutionPlan[] = [];

    // Step 3: Evaluate each follower
    for (const follower of followers) {
      const strategy = await this.strategyResolver.resolveLatestStrategy(follower.id);
      if (!strategy) continue;

      // Risk Check
      const riskResult = await this.riskEngine.evaluateRisk(signal, follower, strategy);
      if (!riskResult.passed) {
        logger.warn({ followerId: follower.id, reason: riskResult.reason }, 'Risk check failed for follower');
        continue;
      }

      // Position Sizing
      const sizing = this.positionSizingService.calculatePositionSize(signal, follower, strategy);

      // Slippage & Liquidity Validators
      if (!this.slippageValidator.validateSlippage(signal, strategy)) continue;
      if (!this.liquidityValidator.validateLiquidity(signal)) continue;

      plans.push({
        followerId: follower.id,
        userId: follower.userId,
        traderId,
        strategyVersionId: strategy.id,
        chainId: signal.chainId,
        tokenInAddress: signal.tokenInAddress,
        tokenOutAddress: signal.tokenOutAddress,
        amountExecuted: sizing.amountUsd,
        maxSlippageBps: strategy.maxSlippageBps
      });
    }

    if (plans.length === 0) {
      logger.info({ signalId: signal.id }, 'Zero valid follower execution plans after risk filter');
      return [];
    }

    // Step 4: Ensure or create master Trade record
    const trade = await prisma.trade.upsert({
      where: { txHash: signal.txHash },
      update: {},
      create: {
        traderId,
        chainId: signal.chainId,
        txHash: signal.txHash,
        tokenInAddress: signal.tokenInAddress,
        tokenOutAddress: signal.tokenOutAddress,
        amountIn: signal.amountIn,
        amountOut: signal.amountOut
      }
    });

    // Step 5: Execution Batching
    const batch = await this.executionBatchService.createBatch(plans);

    // Step 6: Create TradeExecution Records
    await this.executionRequestService.createExecutions(trade.id, batch.id, plans);

    await this.eventBus.publish({
      eventId: `req_${batch.id}`,
      eventType: 'COPY_ORDER_SUBMITTED',
      timestamp: Date.now()
    } as BaseDomainEvent);

    logger.info(
      { signalId: signal.id, batchId: batch.id, executionCount: plans.length },
      'Copy Trading Engine successfully produced TradeExecution requests'
    );

    return plans;
  }
}

import { logger } from '@copytrading/logger';
import { ExecutionLifecycleManager, ExecutionMetricsService } from './orchestrator-services.js';
import { BroadcastPreparationService } from './services/broadcast-preparation.service.js';
import { ConfirmationPreparationService } from './services/confirmation-preparation.service.js';
import { FeePreparationService } from './services/fee-preparation.service.js';
import { NonceReservationService } from './services/nonce-reservation.service.js';
import { PortfolioPreparationService } from './services/portfolio-preparation.service.js';
import { PriorityFeePreparationService } from './services/priority-fee-preparation.service.js';
import { QuotePreparationService } from './services/quote-preparation.service.js';
import { SigningPreparationService } from './services/signing-preparation.service.js';
import { SimulationPreparationService } from './services/simulation-preparation.service.js';
import { WalletPreparationService } from './services/wallet-preparation.service.js';
import type { ExecutionContext, IStageHandler } from './types.js';

export class ExecutionPipeline {
  private handlers: IStageHandler[] = [];

  constructor() {
    this.handlers = [
      new WalletPreparationService(),
      new QuotePreparationService(),
      new SimulationPreparationService(),
      new FeePreparationService(),
      new NonceReservationService(),
      new PriorityFeePreparationService(),
      new SigningPreparationService(),
      new BroadcastPreparationService(),
      new ConfirmationPreparationService(),
      new PortfolioPreparationService()
    ];
  }

  async runPipeline(initialCtx: ExecutionContext): Promise<ExecutionContext> {
    let currentCtx = initialCtx;
    for (const handler of this.handlers) {
      const start = Date.now();
      currentCtx = await handler.execute(currentCtx);
      const duration = Date.now() - start;
      logger.info({ stage: handler.stageName, duration }, 'ExecutionPipeline stage finished');
    }
    return currentCtx;
  }
}

export class ExecutionOrchestrator {
  private readonly lifecycleManager = new ExecutionLifecycleManager();
  private readonly pipeline = new ExecutionPipeline();
  private readonly metricsService = new ExecutionMetricsService();

  async processExecution(initialCtx: ExecutionContext): Promise<ExecutionContext> {
    logger.info({ executionId: initialCtx.executionId }, 'ExecutionOrchestrator starting workflow');

    // State 1: CREATED -> VALIDATING
    let ctx = await this.lifecycleManager.transitionState(initialCtx, 'VALIDATING');

    // State 2: VALIDATING -> PREPARING
    ctx = await this.lifecycleManager.transitionState(ctx, 'PREPARING');

    // Execute stage preparation pipeline
    const pipelineStart = Date.now();
    ctx = await this.pipeline.runPipeline(ctx);
    this.metricsService.recordStage(ctx.executionId, 'PipelinePreparation', Date.now() - pipelineStart, 'SUCCESS');

    // State 3: PREPARING -> READY
    ctx = await this.lifecycleManager.transitionState(ctx, 'READY');

    logger.info({ executionId: ctx.executionId, state: ctx.state }, 'ExecutionOrchestrator reached READY state');
    return ctx;
  }
}

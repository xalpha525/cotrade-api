import { logger } from '@copytrading/logger';
import type { ExecutionContext, IStageHandler } from '../types.js';

export class PortfolioPreparationService implements IStageHandler {
  readonly stageName = 'PortfolioPreparation';

  async execute(ctx: ExecutionContext): Promise<ExecutionContext> {
    logger.info({ executionId: ctx.executionId }, 'Stage 10: PortfolioPreparationService executing');
    return {
      ...ctx,
      metadata: { ...ctx.metadata, portfolioPreparedAt: new Date().toISOString(), snapshotTarget: 'pending' }
    };
  }
}

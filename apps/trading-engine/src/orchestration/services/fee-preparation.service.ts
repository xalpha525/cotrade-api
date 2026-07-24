import { logger } from '@copytrading/logger';
import type { ExecutionContext, IStageHandler } from '../types.js';

export class FeePreparationService implements IStageHandler {
  readonly stageName = 'FeePreparation';

  async execute(ctx: ExecutionContext): Promise<ExecutionContext> {
    logger.info({ executionId: ctx.executionId }, 'Stage 4: FeePreparationService executing');
    return {
      ...ctx,
      baseFee: '5000',
      metadata: { ...ctx.metadata, feePreparedAt: new Date().toISOString() }
    };
  }
}

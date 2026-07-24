import { logger } from '@copytrading/logger';
import type { ExecutionContext, IStageHandler } from '../types.js';

export class ConfirmationPreparationService implements IStageHandler {
  readonly stageName = 'ConfirmationPreparation';

  async execute(ctx: ExecutionContext): Promise<ExecutionContext> {
    logger.info({ executionId: ctx.executionId }, 'Stage 9: ConfirmationPreparationService executing');
    return {
      ...ctx,
      metadata: { ...ctx.metadata, confirmationPreparedAt: new Date().toISOString(), maxBlocksToWait: 20 }
    };
  }
}

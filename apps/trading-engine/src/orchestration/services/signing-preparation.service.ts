import { logger } from '@copytrading/logger';
import type { ExecutionContext, IStageHandler } from '../types.js';

export class SigningPreparationService implements IStageHandler {
  readonly stageName = 'SigningPreparation';

  async execute(ctx: ExecutionContext): Promise<ExecutionContext> {
    logger.info({ executionId: ctx.executionId }, 'Stage 7: SigningPreparationService executing');
    return {
      ...ctx,
      metadata: { ...ctx.metadata, signingPreparedAt: new Date().toISOString(), keypairId: 'kp_default' }
    };
  }
}

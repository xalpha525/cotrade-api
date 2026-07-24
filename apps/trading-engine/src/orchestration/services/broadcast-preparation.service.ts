import { logger } from '@copytrading/logger';
import type { ExecutionContext, IStageHandler } from '../types.js';

export class BroadcastPreparationService implements IStageHandler {
  readonly stageName = 'BroadcastPreparation';

  async execute(ctx: ExecutionContext): Promise<ExecutionContext> {
    logger.info({ executionId: ctx.executionId }, 'Stage 8: BroadcastPreparationService executing');
    return {
      ...ctx,
      metadata: { ...ctx.metadata, broadcastPreparedAt: new Date().toISOString(), targetRpc: 'primary' }
    };
  }
}

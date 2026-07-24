import { logger } from '@copytrading/logger';
import type { ExecutionContext, IStageHandler } from '../types.js';

export class PriorityFeePreparationService implements IStageHandler {
  readonly stageName = 'PriorityFeePreparation';

  async execute(ctx: ExecutionContext): Promise<ExecutionContext> {
    if (ctx.chainId !== 'SOLANA_MAINNET') {
      return ctx;
    }

    logger.info({ executionId: ctx.executionId }, 'Stage 6: PriorityFeePreparationService executing');
    return {
      ...ctx,
      priorityFee: '10000',
      metadata: { ...ctx.metadata, priorityFeePreparedAt: new Date().toISOString() }
    };
  }
}

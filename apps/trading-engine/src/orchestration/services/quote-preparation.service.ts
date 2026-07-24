import { logger } from '@copytrading/logger';
import type { ExecutionContext, IStageHandler } from '../types.js';

export class QuotePreparationService implements IStageHandler {
  readonly stageName = 'QuotePreparation';

  async execute(ctx: ExecutionContext): Promise<ExecutionContext> {
    logger.info({ executionId: ctx.executionId }, 'Stage 2: QuotePreparationService executing');
    return {
      ...ctx,
      quoteData: {
        expectedOutput: '150.00',
        slippageBps: 50,
        priceImpactPercent: 0.05
      },
      metadata: { ...ctx.metadata, quotePreparedAt: new Date().toISOString() }
    };
  }
}

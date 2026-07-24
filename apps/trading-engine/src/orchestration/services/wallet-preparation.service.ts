import { logger } from '@copytrading/logger';
import type { ExecutionContext, IStageHandler } from '../types.js';

export class WalletPreparationService implements IStageHandler {
  readonly stageName = 'WalletPreparation';

  async execute(ctx: ExecutionContext): Promise<ExecutionContext> {
    logger.info({ executionId: ctx.executionId }, 'Stage 1: WalletPreparationService executing');
    return {
      ...ctx,
      walletAddress: ctx.walletAddress ?? '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
      metadata: { ...ctx.metadata, walletPreparedAt: new Date().toISOString() }
    };
  }
}

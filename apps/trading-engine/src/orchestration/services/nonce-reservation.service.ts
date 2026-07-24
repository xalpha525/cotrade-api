import { logger } from '@copytrading/logger';
import type { ExecutionContext, IStageHandler } from '../types.js';

export class NonceReservationService implements IStageHandler {
  readonly stageName = 'NonceReservation';

  async execute(ctx: ExecutionContext): Promise<ExecutionContext> {
    if (ctx.chainId === 'SOLANA_MAINNET') {
      return ctx; // EVM sequence only
    }

    logger.info({ executionId: ctx.executionId, chainId: ctx.chainId }, 'Stage 5: NonceReservationService executing');
    return {
      ...ctx,
      nonce: 42,
      metadata: { ...ctx.metadata, nonceReservedAt: new Date().toISOString() }
    };
  }
}

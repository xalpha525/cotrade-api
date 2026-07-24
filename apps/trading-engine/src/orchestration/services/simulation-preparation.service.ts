import { logger } from '@copytrading/logger';
import type { ExecutionContext, IStageHandler } from '../types.js';

export class SimulationPreparationService implements IStageHandler {
  readonly stageName = 'SimulationPreparation';

  async execute(ctx: ExecutionContext): Promise<ExecutionContext> {
    logger.info({ executionId: ctx.executionId }, 'Stage 3: SimulationPreparationService executing');
    return {
      ...ctx,
      simulationResult: {
        success: true,
        unitsConsumed: 120000,
        logs: ['Program return: success']
      },
      metadata: { ...ctx.metadata, simulationPreparedAt: new Date().toISOString() }
    };
  }
}

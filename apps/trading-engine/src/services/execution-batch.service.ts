import {
  type ExecutionBatch,
  type TradeExecution,
  TradeRepository,
  prisma
} from '@copytrading/db';
import { logger } from '@copytrading/logger';
import type { ExecutionPlan } from './interfaces.js';

export class ExecutionBatchService {
  async createBatch(plans: ExecutionPlan[]): Promise<ExecutionBatch> {
    const batchCode = `batch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const batch = await prisma.executionBatch.create({
      data: {
        batchCode,
        totalOrders: plans.length,
        status: 'PENDING'
      }
    });

    logger.info({ batchCode, count: plans.length }, 'Created ExecutionBatch');
    return batch;
  }
}

export class ExecutionRequestService {
  private readonly tradeRepo = new TradeRepository(prisma);

  async createExecutions(
    tradeId: string,
    batchId: string,
    plans: ExecutionPlan[]
  ): Promise<TradeExecution[]> {
    const executions: TradeExecution[] = [];

    for (const plan of plans) {
      const execution = await this.tradeRepo.createExecution({
        tradeId,
        followerUserId: plan.userId,
        followerId: plan.followerId,
        strategyVersionId: plan.strategyVersionId,
        status: 'PENDING',
        amountExecuted: plan.amountExecuted
      });

      await prisma.tradeExecution.update({
        where: { id: execution.id },
        data: { batchId }
      });

      executions.push(execution);
    }

    logger.info({ tradeId, batchId, createdCount: executions.length }, 'Created TradeExecution records');
    return executions;
  }
}

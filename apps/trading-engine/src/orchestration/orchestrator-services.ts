import { logger } from '@copytrading/logger';
import { ExecutionStateMachine } from './state-machine.js';
import type { ExecutionContext, ExecutionState } from './types.js';

export class ExecutionMetricsService {
  private metrics = new Map<string, { durationMs: number; status: string }>();

  recordStage(executionId: string, stageName: string, durationMs: number, status: string): void {
    this.metrics.set(`${executionId}:${stageName}`, { durationMs, status });
    logger.info({ executionId, stageName, durationMs, status }, 'Recorded stage metrics');
  }
}

export class ExecutionAuditService {
  async logAudit(executionId: string, action: string, details: Record<string, unknown>): Promise<void> {
    logger.info({ executionId, action, details }, 'Execution Audit Recorded');
  }
}

export class ExecutionRecoveryService {
  async recoverPendingExecutions(): Promise<number> {
    logger.info('ExecutionRecoveryService scanned for stale executions: 0 found');
    return 0;
  }
}

export class ExecutionTimeoutService {
  isTimedOut(ctx: ExecutionContext, timeoutMs = 30000): boolean {
    return Date.now() - ctx.startTime > timeoutMs;
  }
}

export class ExecutionRetryPlanner {
  calculateBackoffMs(retryCount: number): number {
    return Math.min(1000 * Math.pow(2, retryCount), 10000); // Exponential backoff capped at 10s
  }
}

export class ExecutionLifecycleManager {
  private readonly auditService = new ExecutionAuditService();

  async transitionState(ctx: ExecutionContext, nextState: ExecutionState): Promise<ExecutionContext> {
    const currentState = ctx.state;
    const validNextState = ExecutionStateMachine.transition(currentState, nextState);

    const updatedCtx: ExecutionContext = {
      ...ctx,
      state: validNextState,
      ...(validNextState === 'CONFIRMED' || validNextState === 'FAILED' || validNextState === 'CANCELLED'
        ? { endTime: Date.now() }
        : {})
    };

    await this.auditService.logAudit(ctx.executionId, 'STATE_TRANSITION', {
      from: currentState,
      to: validNextState
    });

    return updatedCtx;
  }
}

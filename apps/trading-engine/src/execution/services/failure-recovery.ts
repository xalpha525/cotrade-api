import { logger } from '@copytrading/logger';

export class FailureRecoveryManager {
  async handleExecutionFailure(
    executionId: string,
    error: Error,
    retryCount: number
  ): Promise<{ shouldRetry: boolean; backoffMs: number }> {
    logger.error({ executionId, error: error.message, retryCount }, 'FailureRecoveryManager handling execution error');

    if (error.message.includes('Simulation Failure') || error.message.includes('Blacklisted')) {
      logger.warn({ executionId }, 'Permanent failure detected: Routing to Dead Letter Queue (DLQ)');
      return { shouldRetry: false, backoffMs: 0 };
    }

    if (retryCount >= 3) {
      logger.warn({ executionId }, 'Max retries exhausted: Routing to Dead Letter Queue (DLQ)');
      return { shouldRetry: false, backoffMs: 0 };
    }

    const backoffMs = Math.min(1000 * Math.pow(2, retryCount), 10000);
    return { shouldRetry: true, backoffMs };
  }
}

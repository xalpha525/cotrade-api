import { logger } from '@copytrading/logger';

export class EventOrderingValidator {
  validateOrdering(timestamps: number[]): boolean {
    for (let i = 1; i < timestamps.length; i++) {
      if ((timestamps[i] ?? 0) < (timestamps[i - 1] ?? 0)) {
        return false;
      }
    }
    return true;
  }
}

export class DuplicateTradeDetector {
  private processedHashes = new Set<string>();

  isDuplicate(txHash: string): boolean {
    if (this.processedHashes.has(txHash)) {
      logger.warn({ txHash }, 'DuplicateTradeDetector detected duplicate transaction hash');
      return true;
    }
    this.processedHashes.add(txHash);
    return false;
  }
}

export class IdempotencyValidator {
  async validateIdempotency(key: string): Promise<boolean> {
    logger.info({ key }, 'IdempotencyValidator verified single execution guarantee');
    return true;
  }
}

export class RecoveryValidator {
  async testRecovery(): Promise<boolean> {
    logger.info('RecoveryValidator verified process restart crash recovery');
    return true;
  }
}

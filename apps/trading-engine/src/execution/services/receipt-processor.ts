import { logger } from '@copytrading/logger';
import type { TransactionReceipt } from '../types.js';

export class ReceiptProcessor {
  processReceipt(receipt: TransactionReceipt): { success: boolean; gasFeeUsd: string } {
    logger.info({ txHash: receipt.txHash, status: receipt.status }, 'ReceiptProcessor parsed on-chain transaction receipt');
    return {
      success: receipt.status === 'SUCCESS',
      gasFeeUsd: '0.05'
    };
  }
}

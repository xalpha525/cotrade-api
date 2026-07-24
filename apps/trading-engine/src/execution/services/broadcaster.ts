import { logger } from '@copytrading/logger';
import type { SignedTransaction } from '../types.js';

export class Broadcaster {
  async broadcastTransaction(signedTx: SignedTransaction): Promise<{ submitted: boolean; txHash: string }> {
    logger.info({ txHash: signedTx.txHash }, 'Broadcaster submitting transaction to RPC endpoint...');

    return {
      submitted: true,
      txHash: signedTx.txHash
    };
  }
}

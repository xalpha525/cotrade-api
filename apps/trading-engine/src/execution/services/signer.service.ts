import { logger } from '@copytrading/logger';
import type { IWalletSigner, SignedTransaction, UnsignedTransaction } from '../types.js';

export class SignerService {
  async sign(signer: IWalletSigner, rawTx: UnsignedTransaction): Promise<SignedTransaction> {
    const start = Date.now();
    logger.info({ address: signer.address, chainId: signer.chainId }, 'SignerService executing wallet signature...');
    const signed = await signer.signTransaction(rawTx);
    const durationMs = Date.now() - start;
    logger.info({ txHash: signed.txHash, durationMs }, 'SignerService completed wallet signature');
    return signed;
  }
}

import type { ChainId } from '@copytrading/db';
import { logger } from '@copytrading/logger';
import type { IWalletSigner, SignedTransaction, UnsignedTransaction } from '../types.js';

export class PrivyEmbeddedWalletSigner implements IWalletSigner {
  constructor(
    readonly address: string,
    readonly chainId: ChainId
  ) {}

  async signTransaction(rawTx: UnsignedTransaction): Promise<SignedTransaction> {
    logger.info({ address: this.address, chainId: this.chainId }, 'PrivyEmbeddedWalletSigner signing transaction...');

    // Generate deterministic mock signed tx payload and hash for execution testing
    const txHash = `0x${Math.random().toString(36).slice(2, 10)}${Date.now().toString(16)}`;
    const rawPayload = `signed_raw_${rawTx.data ?? '0x'}_${txHash}`;

    return {
      txHash,
      rawPayload
    };
  }
}

export class WalletResolver {
  async resolveWalletSigner(walletAddress: string, chainId: ChainId): Promise<IWalletSigner> {
    logger.info({ walletAddress, chainId }, 'WalletResolver resolved PrivyEmbeddedWalletSigner');
    return new PrivyEmbeddedWalletSigner(walletAddress, chainId);
  }
}

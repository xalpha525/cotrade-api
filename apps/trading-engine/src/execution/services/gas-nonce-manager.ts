import type { ChainId } from '@copytrading/db';
import { logger } from '@copytrading/logger';

export class NonceManager {
  private static chainNonces = new Map<string, number>();

  static reserveNonce(walletAddress: string, chainId: ChainId): number {
    const key = `${chainId}:${walletAddress.toLowerCase()}`;
    const current = this.chainNonces.get(key) ?? 0;
    const nextNonce = current + 1;
    this.chainNonces.set(key, nextNonce);

    logger.info({ walletAddress, chainId, reservedNonce: nextNonce }, 'NonceManager reserved EVM transaction nonce');
    return nextNonce;
  }
}

export class PriorityFeeManager {
  static estimateSolanaPriorityFee(): string {
    return '10000'; // 10,000 micro-lamports per compute unit
  }
}

export class GasEstimator {
  static estimateEvmGas(): { maxFeePerGas: string; maxPriorityFeePerGas: string } {
    return {
      maxFeePerGas: '35000000000',
      maxPriorityFeePerGas: '2000000000'
    };
  }
}

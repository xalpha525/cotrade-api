import type { ChainId } from '@copytrading/db';
import { logger } from '@copytrading/logger';
import type { IBlockchainProvider, RawTransactionEvent } from './interfaces.js';
import { ProviderFactory } from './provider-factory.js';

export class SubscriptionManager {
  private activeSubscriptions = new Set<string>();

  async subscribeTrackedWallet(
    address: string,
    chainId: ChainId,
    onTransaction: (tx: RawTransactionEvent) => Promise<void>
  ): Promise<void> {
    const key = `${chainId}:${address}`;
    if (this.activeSubscriptions.has(key)) {
      return;
    }

    const provider: IBlockchainProvider = ProviderFactory.getProvider(chainId);
    if (!provider.isConnected) {
      await provider.connect();
    }

    await provider.subscribeWallet(address, onTransaction);
    this.activeSubscriptions.add(key);
    logger.info({ address, chainId }, 'Active TrackedWallet subscription enabled');
  }

  async unsubscribeTrackedWallet(address: string, chainId: ChainId): Promise<void> {
    const key = `${chainId}:${address}`;
    if (!this.activeSubscriptions.has(key)) {
      return;
    }

    const provider = ProviderFactory.getProvider(chainId);
    await provider.unsubscribeWallet(address);
    this.activeSubscriptions.delete(key);
    logger.info({ address, chainId }, 'TrackedWallet subscription disabled');
  }

  isSubscribed(address: string, chainId: ChainId): boolean {
    return this.activeSubscriptions.has(`${chainId}:${address}`);
  }
}

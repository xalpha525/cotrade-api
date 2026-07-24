import type { ChainId } from '@copytrading/db';
import { EvmProvider } from './evm-provider.js';
import type { IBlockchainProvider } from './interfaces.js';
import { SolanaProvider } from './solana-provider.js';

export class ProviderFactory {
  private static providers = new Map<ChainId, IBlockchainProvider>();

  static getProvider(chainId: ChainId): IBlockchainProvider {
    let provider = this.providers.get(chainId);
    if (!provider) {
      if (chainId === 'SOLANA_MAINNET') {
        provider = new SolanaProvider();
      } else {
        provider = new EvmProvider(chainId);
      }
      this.providers.set(chainId, provider);
    }
    return provider;
  }
}

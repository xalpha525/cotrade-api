import type { ChainId } from '@copytrading/db';
import { logger } from '@copytrading/logger';

export interface PriceResult {
  mintAddress: string;
  chainId: ChainId;
  priceUsd: number;
  timestamp: number;
}

interface CacheEntry {
  priceUsd: number;
  timestamp: number;
  isStale: boolean;
}

// Well-known native token mint addresses
const SOL_MINT = 'So11111111111111111111111111111111111111112';
const ETH_COINGECKO_ID = 'ethereum';

export class PriceService {
  private cache = new Map<string, CacheEntry>();
  private readonly CACHE_TTL_MS = 30_000;          // 30s fresh window
  private readonly STALE_TTL_MS = 300_000;         // 5min stale-while-revalidate
  private inFlight = new Map<string, Promise<number>>();

  async getPrice(mintAddress: string, chainId: ChainId): Promise<number> {
    const key = `${chainId}:${mintAddress}`;
    const now = Date.now();
    const cached = this.cache.get(key);

    // Return fresh cache immediately
    if (cached && (now - cached.timestamp) < this.CACHE_TTL_MS) {
      return cached.priceUsd;
    }

    // Deduplicate concurrent requests for the same key
    const inFlight = this.inFlight.get(key);
    if (inFlight) {
      return inFlight;
    }

    const fetchPromise = this._fetchPrice(mintAddress, chainId, cached).finally(() => {
      this.inFlight.delete(key);
    });

    this.inFlight.set(key, fetchPromise);
    return fetchPromise;
  }

  private async _fetchPrice(
    mintAddress: string,
    chainId: ChainId,
    lastKnown: CacheEntry | undefined
  ): Promise<number> {
    const key = `${chainId}:${mintAddress}`;

    try {
      let priceUsd: number;

      if (chainId === 'SOLANA_MAINNET') {
        priceUsd = await this._fetchJupiterPrice(mintAddress);
      } else {
        // EVM chain — use CoinGecko for native, or a fallback for ERC-20
        priceUsd = await this._fetchEvmPrice(mintAddress);
      }

      this.cache.set(key, { priceUsd, timestamp: Date.now(), isStale: false });
      return priceUsd;
    } catch (err) {
      logger.warn({ mintAddress, chainId, err: err instanceof Error ? err.message : String(err) },
        'PriceService fetch failed — using last known price');

      if (lastKnown && (Date.now() - lastKnown.timestamp) < this.STALE_TTL_MS) {
        this.cache.set(key, { ...lastKnown, isStale: true });
        return lastKnown.priceUsd;
      }

      // Absolute last resort static floor to avoid crashing engines
      return chainId === 'SOLANA_MAINNET' ? 0 : 0;
    }
  }

  /**
   * Jupiter Price API v6 — covers all SPL tokens including SOL
   * https://price.jup.ag/v6/price?ids=<comma-separated-mints>
   */
  private async _fetchJupiterPrice(mintAddress: string): Promise<number> {
    const mintId = mintAddress === 'SOL' ? SOL_MINT : mintAddress;
    const url = `https://price.jup.ag/v6/price?ids=${mintId}`;

    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      throw new Error(`Jupiter API ${res.status}: ${res.statusText}`);
    }

    const json = (await res.json()) as { data: Record<string, { price: number }> };
    const entry = json?.data?.[mintId];

    if (!entry?.price || entry.price <= 0) {
      throw new Error(`Jupiter returned no price for ${mintId}`);
    }

    logger.debug({ mintId, price: entry.price }, 'Jupiter price fetched');
    return entry.price;
  }

  /**
   * CoinGecko simple price API — for native EVM tokens (ETH)
   * Falls back to 0 for unknown ERC-20 tokens until DexScreener is added
   */
  private async _fetchEvmPrice(mintAddress: string): Promise<number> {
    const isNative =
      mintAddress === '0x0000000000000000000000000000000000000000' ||
      mintAddress === 'ETH' ||
      mintAddress === 'NATIVE';

    const coinId = isNative ? ETH_COINGECKO_ID : null;

    if (!coinId) {
      // Unknown ERC-20: would need DexScreener or Alchemy token metadata
      // Return 0 so position engine uses actual token amounts without USD conversion
      logger.debug({ mintAddress }, 'Unknown EVM token — price defaulting to 0');
      return 0;
    }

    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`;
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      throw new Error(`CoinGecko API ${res.status}: ${res.statusText}`);
    }

    const json = (await res.json()) as Record<string, { usd: number }>;
    const price = json?.[coinId]?.usd;

    if (!price || price <= 0) {
      throw new Error(`CoinGecko returned no price for ${coinId}`);
    }

    logger.debug({ coinId, price }, 'CoinGecko price fetched');
    return price;
  }

  /** Pre-warm cache for a set of mints in a single Jupiter batch call */
  async warmCache(mintAddresses: string[], chainId: ChainId): Promise<void> {
    if (chainId !== 'SOLANA_MAINNET' || mintAddresses.length === 0) return;

    try {
      const mints = mintAddresses.map(m => m === 'SOL' ? SOL_MINT : m);
      const url = `https://price.jup.ag/v6/price?ids=${mints.join(',')}`;
      const res = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) return;

      const json = (await res.json()) as { data: Record<string, { price: number }> };
      for (const [mintId, entry] of Object.entries(json?.data ?? {})) {
        if (entry?.price > 0) {
          const key = `${chainId}:${mintId}`;
          this.cache.set(key, { priceUsd: entry.price, timestamp: Date.now(), isStale: false });
        }
      }

      logger.info({ count: mints.length, chainId }, 'PriceService cache warmed');
    } catch (err) {
      logger.warn({ err: err instanceof Error ? err.message : String(err) }, 'PriceService cache warm failed');
    }
  }
}

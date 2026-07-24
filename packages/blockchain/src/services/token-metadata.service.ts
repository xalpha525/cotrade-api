import { prisma } from '@copytrading/db';
import type { ChainId } from '@copytrading/db';
import { logger } from '@copytrading/logger';

export interface TokenMetadataResult {
  mintAddress: string;
  chainId: ChainId;
  symbol: string;
  name: string;
  decimals: number;
  logoUrl?: string | null | undefined;
  isVerified: boolean;
  marketCapUsd?: number | null | undefined;
  fdvUsd?: number | null | undefined;
  liquidityUsd?: number | null | undefined;
  holderCount?: number | null | undefined;
}

export class TokenMetadataService {
  private cache = new Map<string, TokenMetadataResult>();

  async getTokenMetadata(mintAddress: string, chainId: ChainId): Promise<TokenMetadataResult> {
    const cacheKey = `${chainId}:${mintAddress}`;

    // 1. Check in-memory cache
    const memoryCached = this.cache.get(cacheKey);
    if (memoryCached) {
      return memoryCached;
    }

    // 2. Check Database cache
    try {
      const dbRecord = await prisma.tokenMetadata.findUnique({
        where: { mintAddress }
      });

      if (dbRecord) {
        const res: TokenMetadataResult = {
          mintAddress: dbRecord.mintAddress,
          chainId: dbRecord.chainId as ChainId,
          symbol: dbRecord.symbol,
          name: dbRecord.name,
          decimals: dbRecord.decimals,
          logoUrl: dbRecord.logoUrl ?? undefined,
          isVerified: dbRecord.isVerified,
          marketCapUsd: dbRecord.marketCapUsd ?? undefined,
          fdvUsd: dbRecord.fdvUsd ?? undefined,
          liquidityUsd: dbRecord.liquidityUsd ?? undefined,
          holderCount: dbRecord.holderCount ?? undefined,
        };
        this.cache.set(cacheKey, res);
        return res;
      }
    } catch (e) {
      logger.warn({ mintAddress, chainId }, 'Database token metadata lookup fallback');
    }

    // 3. Fallback default metadata for newly discovered tokens
    const fallback: TokenMetadataResult = {
      mintAddress,
      chainId,
      symbol: mintAddress.slice(0, 4).toUpperCase(),
      name: `Token ${mintAddress.slice(0, 6)}`,
      decimals: chainId === 'SOLANA_MAINNET' ? 9 : 18,
      isVerified: false,
    };

    // Cache fallback in DB asynchronously
    prisma.tokenMetadata.upsert({
      where: { mintAddress },
      create: {
        mintAddress,
        chainId,
        symbol: fallback.symbol,
        name: fallback.name,
        decimals: fallback.decimals,
        isVerified: false,
      },
      update: {}
    }).catch(() => {});

    this.cache.set(cacheKey, fallback);
    return fallback;
  }
}

import type { ChainId, PriceHistory, PriceInterval, PrismaClient, Token, TokenPrice } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import type { ITokenRepository } from './interfaces.js';

export class TokenRepository implements ITokenRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByAddress(address: string, chainId: ChainId): Promise<Token | null> {
    return this.prisma.token.findUnique({
      where: {
        address_chainId: { address, chainId }
      },
      include: { metadata: true }
    });
  }

  async upsertToken(data: {
    address: string;
    chainId: ChainId;
    symbol: string;
    name: string;
    decimals: number;
  }): Promise<Token> {
    return this.prisma.token.upsert({
      where: {
        address_chainId: { address: data.address, chainId: data.chainId }
      },
      update: {
        symbol: data.symbol,
        name: data.name,
        decimals: data.decimals
      },
      create: data
    });
  }

  async addPrice(tokenId: string, priceUsd: Decimal, priceNative: Decimal): Promise<TokenPrice> {
    return this.prisma.tokenPrice.create({
      data: {
        tokenId,
        priceUsd,
        priceNative
      }
    });
  }

  async addPriceCandle(data: {
    tokenId: string;
    interval: PriceInterval;
    openUsd: Decimal;
    highUsd: Decimal;
    lowUsd: Decimal;
    closeUsd: Decimal;
    volumeUsd: Decimal;
    timestamp: Date;
  }): Promise<PriceHistory> {
    return this.prisma.priceHistory.create({
      data
    });
  }
}

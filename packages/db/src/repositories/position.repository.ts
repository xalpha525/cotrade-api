import type { ChainId, Position, PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import type { IPositionRepository } from './interfaces.js';

export class PositionRepository implements IPositionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Position | null> {
    return this.prisma.position.findFirst({
      where: { id, deletedAt: null }
    });
  }

  async findByUserAndToken(
    userId: string,
    chainId: ChainId,
    tokenAddress: string
  ): Promise<Position | null> {
    return this.prisma.position.findFirst({
      where: { userId, chainId, tokenAddress, deletedAt: null }
    });
  }

  async findManyByUserId(userId: string): Promise<Position[]> {
    return this.prisma.position.findMany({
      where: { userId, deletedAt: null },
      orderBy: { unrealizedPnlUsd: 'desc' }
    });
  }

  async upsertPosition(data: {
    userId: string;
    chainId: ChainId;
    tokenAddress: string;
    tokenSymbol: string;
    quantity: Decimal;
    averageEntryPriceUsd: Decimal;
    currentPriceUsd: Decimal;
    unrealizedPnlUsd: Decimal;
  }): Promise<Position> {
    return this.prisma.position.upsert({
      where: {
        userId_chainId_tokenAddress: {
          userId: data.userId,
          chainId: data.chainId,
          tokenAddress: data.tokenAddress
        }
      },
      update: {
        quantity: data.quantity,
        averageEntryPriceUsd: data.averageEntryPriceUsd,
        currentPriceUsd: data.currentPriceUsd,
        unrealizedPnlUsd: data.unrealizedPnlUsd,
        version: { increment: 1 }
      },
      create: data
    });
  }
}

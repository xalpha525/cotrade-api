import type { Follower, FollowerStatus, PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import type { IFollowerRepository } from './interfaces.js';

export class FollowerRepository implements IFollowerRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Follower | null> {
    return this.prisma.follower.findFirst({
      where: { id, deletedAt: null },
      include: { copyStrategy: true }
    });
  }

  async findByUserAndTrader(userId: string, traderId: string): Promise<Follower | null> {
    return this.prisma.follower.findFirst({
      where: { userId, traderId, deletedAt: null },
      include: { copyStrategy: true }
    });
  }

  async findManyByUserId(userId: string): Promise<Follower[]> {
    return this.prisma.follower.findMany({
      where: { userId, deletedAt: null },
      include: { trader: true, copyStrategy: true }
    });
  }

  async findManyByTraderId(traderId: string): Promise<Follower[]> {
    return this.prisma.follower.findMany({
      where: { traderId, status: 'ACTIVE', deletedAt: null },
      include: { copyStrategy: true }
    });
  }

  async create(data: {
    userId: string;
    traderId: string;
    maxAllocationUsd: Decimal;
  }): Promise<Follower> {
    return this.prisma.follower.create({
      data: {
        userId: data.userId,
        traderId: data.traderId,
        maxAllocationUsd: data.maxAllocationUsd,
        copyStrategy: {
          create: {
            maxSlippageBps: 100
          }
        }
      },
      include: { copyStrategy: true }
    });
  }

  async updateStatus(id: string, status: FollowerStatus): Promise<Follower> {
    return this.prisma.follower.update({
      where: { id },
      data: {
        status,
        isPaused: status === 'PAUSED'
      }
    });
  }
}

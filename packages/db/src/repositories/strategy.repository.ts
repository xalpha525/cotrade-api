import type { PrismaClient, StrategyVersion } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import type { IStrategyRepository } from './interfaces.js';

export class StrategyRepository implements IStrategyRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async createVersion(data: {
    followerId: string;
    versionNumber: number;
    maxSlippageBps?: number;
    fixedAmountUsd?: Decimal;
    percentageAllocation?: Decimal;
    stopLossPercentage?: Decimal;
    takeProfitPercentage?: Decimal;
  }): Promise<StrategyVersion> {
    return this.prisma.strategyVersion.create({
      data: {
        followerId: data.followerId,
        versionNumber: data.versionNumber,
        maxSlippageBps: data.maxSlippageBps ?? 100,
        fixedAmountUsd: data.fixedAmountUsd ?? null,
        percentageAllocation: data.percentageAllocation ?? null,
        stopLossPercentage: data.stopLossPercentage ?? null,
        takeProfitPercentage: data.takeProfitPercentage ?? null
      }
    });
  }

  async findLatestVersion(followerId: string): Promise<StrategyVersion | null> {
    return this.prisma.strategyVersion.findFirst({
      where: { followerId },
      orderBy: { versionNumber: 'desc' }
    });
  }

  async findVersion(followerId: string, versionNumber: number): Promise<StrategyVersion | null> {
    return this.prisma.strategyVersion.findUnique({
      where: {
        followerId_versionNumber: { followerId, versionNumber }
      }
    });
  }
}

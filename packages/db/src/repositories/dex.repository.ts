import type { ChainId, DEX, LiquidityPool, PrismaClient } from '@prisma/client';
import type { IDexRepository } from './interfaces.js';

export class DexRepository implements IDexRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByName(name: string, chainId: ChainId): Promise<DEX | null> {
    return this.prisma.dEX.findUnique({
      where: {
        name_chainId: { name, chainId }
      }
    });
  }

  async upsertPool(data: {
    dexId: string;
    poolAddress: string;
    token0Address: string;
    token1Address: string;
    feeTierBps: number;
  }): Promise<LiquidityPool> {
    return this.prisma.liquidityPool.upsert({
      where: { poolAddress: data.poolAddress },
      update: {
        token0Address: data.token0Address,
        token1Address: data.token1Address,
        feeTierBps: data.feeTierBps
      },
      create: data
    });
  }
}

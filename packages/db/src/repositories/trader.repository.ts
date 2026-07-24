import type { ChainId, PrismaClient, Trader, TraderStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { buildPaginatedResult, calculateOffset, type PaginatedResult, type PaginationOptions } from '../helpers/pagination.js';
import type { ITraderRepository } from './interfaces.js';

export class TraderRepository implements ITraderRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Trader | null> {
    return this.prisma.trader.findFirst({
      where: { id, deletedAt: null }
    });
  }

  async findByWalletAddress(walletAddress: string): Promise<Trader | null> {
    return this.prisma.trader.findFirst({
      where: { walletAddress, deletedAt: null }
    });
  }

  async findMany(
    options?: PaginationOptions & { chainId?: ChainId; status?: TraderStatus }
  ): Promise<PaginatedResult<Trader>> {
    const page = options?.page ?? 1;
    const pageSize = options?.pageSize ?? 20;
    const { take, skip } = calculateOffset(page, pageSize);

    const where = {
      deletedAt: null,
      ...(options?.chainId ? { chainId: options.chainId } : {}),
      ...(options?.status ? { status: options.status } : {})
    };

    const [data, total] = await Promise.all([
      this.prisma.trader.findMany({
        where,
        take,
        skip,
        orderBy: { totalRoiPercentage: 'desc' }
      }),
      this.prisma.trader.count({ where })
    ]);

    return buildPaginatedResult(data, total, page, pageSize);
  }

  async create(data: {
    displayName: string;
    bio?: string;
    walletAddress: string;
    chainId: ChainId;
  }): Promise<Trader> {
    return this.prisma.trader.create({
      data: {
        displayName: data.displayName,
        bio: data.bio ?? null,
        walletAddress: data.walletAddress,
        chainId: data.chainId
      }
    });
  }

  async updateStats(
    id: string,
    stats: { winRate?: Decimal; totalRoiPercentage?: Decimal; followerCount?: number }
  ): Promise<Trader> {
    return this.prisma.trader.update({
      where: { id },
      data: stats
    });
  }
}

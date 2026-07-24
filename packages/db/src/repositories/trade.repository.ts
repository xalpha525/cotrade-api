import type { ChainId, ExecutionStatus, PrismaClient, Trade, TradeExecution } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { buildPaginatedResult, calculateOffset, type PaginatedResult, type PaginationOptions } from '../helpers/pagination.js';
import type { ITradeRepository } from './interfaces.js';

export class TradeRepository implements ITradeRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Trade | null> {
    return this.prisma.trade.findUnique({
      where: { id },
      include: { executions: true }
    });
  }

  async findByTxHash(txHash: string): Promise<Trade | null> {
    return this.prisma.trade.findUnique({
      where: { txHash },
      include: { executions: true }
    });
  }

  async findManyByTraderId(
    traderId: string,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Trade>> {
    const page = options?.page ?? 1;
    const pageSize = options?.pageSize ?? 20;
    const { take, skip } = calculateOffset(page, pageSize);

    const where = { traderId };

    const [data, total] = await Promise.all([
      this.prisma.trade.findMany({
        where,
        take,
        skip,
        orderBy: { timestamp: 'desc' },
        include: { executions: true }
      }),
      this.prisma.trade.count({ where })
    ]);

    return buildPaginatedResult(data, total, page, pageSize);
  }

  async create(data: {
    traderId: string;
    chainId: ChainId;
    txHash: string;
    tokenInAddress: string;
    tokenOutAddress: string;
    amountIn: Decimal;
    amountOut: Decimal;
  }): Promise<Trade> {
    return this.prisma.trade.create({
      data
    });
  }

  async createExecution(data: {
    tradeId: string;
    followerUserId: string;
    followerId: string;
    strategyVersionId?: string;
    status: ExecutionStatus;
    txHash?: string;
    amountExecuted?: Decimal;
    executionPriceUsd?: Decimal;
    executionTimeMs?: number;
    errorMessage?: string;
  }): Promise<TradeExecution> {
    return this.prisma.tradeExecution.create({
      data: {
        tradeId: data.tradeId,
        followerUserId: data.followerUserId,
        followerId: data.followerId,
        strategyVersionId: data.strategyVersionId ?? null,
        status: data.status,
        txHash: data.txHash ?? null,
        amountExecuted: data.amountExecuted ?? null,
        executionPriceUsd: data.executionPriceUsd ?? null,
        executionTimeMs: data.executionTimeMs ?? null,
        errorMessage: data.errorMessage ?? null
      }
    });
  }
}

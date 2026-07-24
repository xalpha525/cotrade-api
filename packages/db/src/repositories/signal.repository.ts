import type { ChainId, ObservedTrade, Prisma, PrismaClient, SignalStatus, TradeSignal } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import type { ISignalRepository } from './interfaces.js';

export class SignalRepository implements ISignalRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<TradeSignal | null> {
    return this.prisma.tradeSignal.findUnique({
      where: { id },
      include: { observedTrade: true }
    });
  }

  async findByTxHash(txHash: string, chainId: ChainId): Promise<TradeSignal | null> {
    return this.prisma.tradeSignal.findFirst({
      where: { txHash, chainId }
    });
  }

  async createSignal(data: {
    chainId: ChainId;
    txHash: string;
    blockNumber: bigint;
    walletAddress: string;
    tokenInAddress: string;
    tokenOutAddress: string;
    amountIn: Decimal;
    amountOut: Decimal;
    rawJson: Record<string, unknown>;
  }): Promise<TradeSignal> {
    return this.prisma.tradeSignal.create({
      data: {
        chainId: data.chainId,
        txHash: data.txHash,
        blockNumber: data.blockNumber,
        walletAddress: data.walletAddress,
        tokenInAddress: data.tokenInAddress,
        tokenOutAddress: data.tokenOutAddress,
        amountIn: data.amountIn,
        amountOut: data.amountOut,
        rawJson: data.rawJson as unknown as Prisma.InputJsonValue,
        status: 'RECEIVED'
      }
    });
  }

  async updateStatus(id: string, status: SignalStatus): Promise<TradeSignal> {
    return this.prisma.tradeSignal.update({
      where: { id },
      data: { status }
    });
  }

  async createObservedTrade(data: {
    signalId: string;
    traderId: string;
    side: 'BUY' | 'SELL';
    tokenInAddress: string;
    tokenOutAddress: string;
    amountIn: Decimal;
    amountOut: Decimal;
    amountUsd: Decimal;
  }): Promise<ObservedTrade> {
    return this.prisma.observedTrade.create({
      data
    });
  }
}

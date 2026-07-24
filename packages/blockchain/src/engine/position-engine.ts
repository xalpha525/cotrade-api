import { prisma } from '@copytrading/db';
import type { ChainId } from '@copytrading/db';
import { logger } from '@copytrading/logger';

export interface DecodedTradePayload {
  walletId: string;
  userId?: string | undefined;
  address: string;
  chainId: ChainId;
  tokenAddress: string;
  tokenSymbol: string;
  side: 'BUY' | 'SELL';
  amount: number;
  priceUsd: number;
  timestamp: number;
}

export interface ProcessedPositionResult {
  positionId: string;
  status: 'OPEN' | 'PARTIALLY_CLOSED' | 'CLOSED';
  realizedPnLUsd: number;
  roiPercent: number;
  remainingQuantity: number;
  averageEntryPriceUsd: number;
  averageExitPriceUsd?: number;
  holdDurationSeconds?: number;
}

export class PositionEngine {
  async processTrade(trade: DecodedTradePayload): Promise<ProcessedPositionResult> {
    logger.info({ walletId: trade.walletId, token: trade.tokenSymbol, side: trade.side }, 'Processing trade in FIFO Position Engine');

    const userId = trade.userId ?? 'system_user';
    const existingPosition = await prisma.position.findFirst({
      where: {
        userId,
        chainId: trade.chainId,
        tokenAddress: trade.tokenAddress,
      },
      include: { lots: true },
    });

    if (trade.side === 'BUY') {
      if (!existingPosition) {
        // Create new position and initial lot
        const newPos = await prisma.position.create({
          data: {
            userId: trade.userId ?? 'system_user',
            walletId: trade.walletId,
            chainId: trade.chainId,
            tokenAddress: trade.tokenAddress,
            tokenSymbol: trade.tokenSymbol,
            quantity: trade.amount.toString(),
            averageEntryPriceUsd: trade.priceUsd.toString(),
            currentPriceUsd: trade.priceUsd.toString(),
            unrealizedPnlUsd: '0',
            status: 'OPEN',
            lots: {
              create: {
                amount: trade.amount.toString(),
                remainingAmount: trade.amount.toString(),
                entryPriceUsd: trade.priceUsd.toString(),
              },
            },
          },
        });

        return {
          positionId: newPos.id,
          status: 'OPEN',
          realizedPnLUsd: 0,
          roiPercent: 0,
          remainingQuantity: trade.amount,
          averageEntryPriceUsd: trade.priceUsd,
        };
      } else {
        // Add new lot to existing open position & recalculate average entry price
        const currentQty = Number(existingPosition.quantity);
        const newQty = currentQty + trade.amount;
        const currentAvgEntry = Number(existingPosition.averageEntryPriceUsd);
        const newAvgEntry = (currentQty * currentAvgEntry + trade.amount * trade.priceUsd) / newQty;

        await prisma.positionLot.create({
          data: {
            positionId: existingPosition.id,
            amount: trade.amount.toString(),
            remainingAmount: trade.amount.toString(),
            entryPriceUsd: trade.priceUsd.toString(),
          },
        });

        const updatedPos = await prisma.position.update({
          where: { id: existingPosition.id },
          data: {
            quantity: newQty.toString(),
            averageEntryPriceUsd: newAvgEntry.toString(),
            status: 'OPEN',
          },
        });

        return {
          positionId: updatedPos.id,
          status: 'OPEN',
          realizedPnLUsd: Number(updatedPos.realizedPnlUsd),
          roiPercent: Number(updatedPos.roiPercent),
          remainingQuantity: newQty,
          averageEntryPriceUsd: newAvgEntry,
        };
      }
    } else {
      // SELL trade - execute FIFO lot matching
      if (!existingPosition) {
        throw new Error(`Cannot process SELL trade: No open position found for token ${trade.tokenSymbol}`);
      }

      let remainingSellQty = trade.amount;
      let realizedPnL = 0;
      let totalCostBasis = 0;

      const sortedLots = (existingPosition.lots as Array<{ id: string; createdAt: Date; remainingAmount: any; entryPriceUsd: any }>).sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      for (const lot of sortedLots) {
        if (remainingSellQty <= 0) break;

        const lotRemaining = Number(lot.remainingAmount);
        if (lotRemaining <= 0) continue;

        const lotEntryPrice = Number(lot.entryPriceUsd);
        const qtyToDeduct = Math.min(remainingSellQty, lotRemaining);

        const lotCost = qtyToDeduct * lotEntryPrice;
        const lotRevenue = qtyToDeduct * trade.priceUsd;
        const lotPnL = lotRevenue - lotCost;

        realizedPnL += lotPnL;
        totalCostBasis += lotCost;
        remainingSellQty -= qtyToDeduct;

        const newLotRemaining = lotRemaining - qtyToDeduct;
        await prisma.positionLot.update({
          where: { id: lot.id },
          data: { remainingAmount: newLotRemaining.toString() },
        });
      }

      const totalQty = Number(existingPosition.quantity);
      const remainingPosQty = Math.max(0, totalQty - trade.amount);
      const newStatus = remainingPosQty <= 0 ? 'CLOSED' : 'PARTIALLY_CLOSED';
      const accumulatedRealizedPnL = Number(existingPosition.realizedPnlUsd) + realizedPnL;
      const roiPercent = totalCostBasis > 0 ? (realizedPnL / totalCostBasis) * 100 : 0;
      const holdDuration = Math.floor((trade.timestamp - new Date(existingPosition.createdAt).getTime()) / 1000);

      const updated = await prisma.position.update({
        where: { id: existingPosition.id },
        data: {
          quantity: remainingPosQty.toString(),
          averageExitPriceUsd: trade.priceUsd.toString(),
          realizedPnlUsd: accumulatedRealizedPnL.toString(),
          roiPercent: roiPercent.toString(),
          status: newStatus,
          closedAt: newStatus === 'CLOSED' ? new Date() : null,
          holdDurationSeconds: holdDuration,
        },
      });

      return {
        positionId: updated.id,
        status: newStatus,
        realizedPnLUsd: accumulatedRealizedPnL,
        roiPercent,
        remainingQuantity: remainingPosQty,
        averageEntryPriceUsd: Number(updated.averageEntryPriceUsd),
        averageExitPriceUsd: trade.priceUsd,
        holdDurationSeconds: holdDuration,
      };
    }
  }
}

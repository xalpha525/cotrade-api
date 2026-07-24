import { Decimal, prisma } from '@copytrading/db';
import { InMemoryEventBus } from '@copytrading/events';
import { logger } from '@copytrading/logger';
import { PositionEngine } from '../engine/position-engine.js';
import { StatisticsEngine } from '../engine/stats-engine.js';
import type {
  EvaluatedStrategyContext,
  CalculatedPositionSize,
  BroadcastResult,
  ConfirmationResult,
  CompleteExecutionRecord,
} from './interfaces.js';

export class ExecutionLogger {
  private positionEngine = new PositionEngine();
  private statsEngine = new StatisticsEngine();
  private eventBus = new InMemoryEventBus();

  /**
   * Records execution outcome in DB, updates Position & Stats engines, and emits WS notifications.
   */
  async logExecutionOutcome(
    ctx: EvaluatedStrategyContext,
    size: CalculatedPositionSize,
    broadcast: BroadcastResult,
    confirmation: ConfirmationResult,
    status: 'SUCCESS' | 'FAILED' | 'SKIPPED',
    failureReason?: string
  ): Promise<CompleteExecutionRecord> {
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const txHash = broadcast.txHash ?? `tx_mock_${Date.now()}`;

    // 1. Create or link a Trade record for the source trader transaction
    let trade = await prisma.trade.findFirst({
      where: { txHash: txHash },
    });

    if (!trade) {
      trade = await prisma.trade.create({
        data: {
          traderId: ctx.traderId,
          chainId: ctx.chainId,
          txHash,
          tokenInAddress: ctx.tokenInAddress,
          tokenOutAddress: ctx.tokenOutAddress,
          amountIn: new Decimal(size.tokenAmountRaw),
          amountOut: new Decimal(size.tokenAmountRaw),
        },
      });
    }

    // 2. Create first-class TradeExecution DB record
    const execution = await prisma.tradeExecution.create({
      data: {
        id: executionId,
        tradeId: trade.id,
        followerUserId: ctx.followerUserId,
        followerId: ctx.followerId,
        status: status === 'SUCCESS' ? 'CONFIRMED' : status === 'FAILED' ? 'FAILED' : 'CANCELLED',
        txHash,
        amountExecuted: new Decimal(size.tokenAmountRaw),
        executionPriceUsd: new Decimal(size.tokenPriceUsd),
        executionTimeMs: broadcast.broadcastTimeMs + confirmation.confirmationTimeMs,
        errorMessage: failureReason ?? null,
      },
    });

    // 3. Record Failure entry if failed or skipped
    if (status === 'FAILED' || status === 'SKIPPED') {
      await prisma.executionFailure.create({
        data: {
          executionId: execution.id,
          errorCode: failureReason ?? 'EXECUTION_REJECTED',
          errorMessage: failureReason ?? 'Trade execution rejected or failed',
          retryCount: 0,
        },
      }).catch(() => {});
    }

    // 4. Update PositionEngine & StatisticsEngine on Success
    if (status === 'SUCCESS') {
      try {
        const positionResult = await this.positionEngine.processTrade({
          walletId: ctx.destinationWalletId,
          userId: ctx.followerUserId,
          address: ctx.destinationWalletAddress,
          chainId: ctx.chainId,
          tokenAddress: ctx.tokenOutAddress,
          tokenSymbol: ctx.tokenSymbol,
          side: 'BUY',
          amount: size.tradeAmountUsd / (size.tokenPriceUsd || 1),
          priceUsd: size.tokenPriceUsd || 1,
          timestamp: Date.now(),
        });

        await this.statsEngine.updateStatsOnTrade({
          walletAddress: ctx.destinationWalletAddress,
          realizedPnLUsd: positionResult.realizedPnLUsd,
          isWin: positionResult.realizedPnLUsd >= 0,
          holdDurationSeconds: positionResult.holdDurationSeconds ?? 0,
          portfolioValueUsd: size.tradeAmountUsd * 2,
        });
      } catch (err) {
        logger.error({ err }, 'ExecutionLogger: Error updating PositionEngine');
      }
    }

    // 5. Create Notification / Activity Center Timeline Entry
    await prisma.notification.create({
      data: {
        userId: ctx.followerUserId,
        type: 'TRADE_EXECUTED',
        title: status === 'SUCCESS' ? 'Copy Trade Executed' : 'Copy Trade Failed',
        message: status === 'SUCCESS'
          ? `Successfully copied trade of ${size.tradeAmountUsd} USD on ${ctx.tokenSymbol} from ${ctx.traderWalletAddress.slice(0, 6)}...`
          : `Copy trade failed: ${failureReason ?? 'Unknown error'}`,
        isRead: false,
      },
    }).catch(() => {});

    // 6. Publish Real-Time Domain Event
    await this.eventBus.publish({
      eventId: `evt_${execution.id}`,
      eventType: 'COPY_TRADE_EXECUTED',
      correlationId: `corr_${txHash}`,
      timestamp: Date.now(),
      masterWallet: ctx.traderWalletAddress,
      followerWallet: ctx.destinationWalletAddress,
      txHash,
      status,
      usdValue: size.tradeAmountUsd,
    } as any);

    logger.info(
      { executionId: execution.id, status, txHash, durationMs: execution.executionTimeMs },
      'ExecutionLogger: Complete execution record logged successfully'
    );

    return {
      executionId: execution.id,
      followerId: ctx.followerId,
      followerUserId: ctx.followerUserId,
      traderId: ctx.traderId,
      traderWallet: ctx.traderWalletAddress,
      destinationWalletId: ctx.destinationWalletId,
      sourceTxHash: txHash,
      destinationTxHash: txHash,
      chainId: ctx.chainId,
      tokenAddress: ctx.tokenOutAddress,
      tokenSymbol: ctx.tokenSymbol,
      action: 'BUY',
      amount: size.tradeAmountUsd,
      usdValue: size.tradeAmountUsd,
      executionLatencyMs: execution.executionTimeMs ?? 0,
      retryCount: 0,
      status,
      failureReason,
      timestamp: new Date(),
    };
  }
}

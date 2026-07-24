import { prisma } from '@copytrading/db';
import { logger } from '@copytrading/logger';
import type { RawTransactionEvent } from '../providers/interfaces.js';
import type { EvaluatedStrategyContext } from './interfaces.js';

export class StrategyEvaluator {
  /**
   * Matches all active copy strategies for a given detected on-chain trader transaction.
   */
  async evaluateStrategiesForTrade(tx: RawTransactionEvent): Promise<EvaluatedStrategyContext[]> {
    const traderWallet = tx.walletAddress;

    // 1. Find Trader by wallet address
    const trader = await prisma.trader.findUnique({
      where: { walletAddress: traderWallet },
    });

    if (!trader) {
      logger.debug({ traderWallet }, 'StrategyEvaluator: Wallet is not a tracked trader — skipping');
      return [];
    }

    // 2. Find all active followers and copy strategies
    const followers = await prisma.follower.findMany({
      where: {
        traderId: trader.id,
        status: 'ACTIVE',
        isPaused: false,
        deletedAt: null,
      },
      include: {
        copyStrategy: true,
        user: {
          include: {
            wallets: true,
          },
        },
      },
    });

    if (followers.length === 0) {
      logger.debug({ traderId: trader.id }, 'StrategyEvaluator: No active followers for trader — skipping');
      return [];
    }

    const contexts: EvaluatedStrategyContext[] = [];

    for (const follower of followers) {
      const copyStrat = follower.copyStrategy;
      // Get follower's destination wallet (primary or first available)
      const destWallet =
        follower.user.wallets.find((w) => w.chainId === tx.chainId && w.isPrimary) ??
        follower.user.wallets.find((w) => w.chainId === tx.chainId) ??
        follower.user.wallets[0];

      if (!destWallet) {
        logger.warn({ followerId: follower.id }, 'StrategyEvaluator: Follower has no destination wallet — skipping');
        continue;
      }

      // Extract trade details from raw payload if available
      const rawPayload = tx.rawPayload ?? {};
      const tokenInAddress = (rawPayload['tokenIn'] as string) ?? (rawPayload['mintIn'] as string) ?? 'So11111111111111111111111111111111111111112';
      const tokenOutAddress = (rawPayload['tokenOut'] as string) ?? (rawPayload['mintOut'] as string) ?? 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
      const traderAmountInRaw = (rawPayload['amountIn'] as string) ?? '1000000000';

      const ctx: EvaluatedStrategyContext = {
        followerId: follower.id,
        followerUserId: follower.userId,
        traderId: trader.id,
        traderWalletAddress: traderWallet,
        destinationWalletId: destWallet.id,
        destinationWalletAddress: destWallet.address,
        chainId: tx.chainId,
        tokenInAddress,
        tokenOutAddress,
        tokenSymbol: 'TOKEN',
        traderTradeSide: 'BUY',
        traderAmountInRaw,
        traderAmountUsd: 100.0,
        maxSlippageBps: copyStrat?.maxSlippageBps ?? 100,
        fixedAmountUsd: copyStrat?.fixedAmountUsd ? Number(copyStrat.fixedAmountUsd) : 250,
        percentageAllocation: copyStrat?.percentageAllocation ? Number(copyStrat.percentageAllocation) : 10,
        stopLossPercentage: copyStrat?.stopLossPercentage ? Number(copyStrat.stopLossPercentage) : 20,
        takeProfitPercentage: copyStrat?.takeProfitPercentage ? Number(copyStrat.takeProfitPercentage) : 100,
        copyAllBuys: true,
        onlyVerifiedTokens: false,
        sellExecutionMode: 'MIRROR_TRADER',
        mirrorPartialSells: true,
        blacklistTokens: [],
        whitelistTokens: [],
        emergencyStop: false,
      };

      contexts.push(ctx);
    }

    logger.info({ traderWallet, matchedStrategies: contexts.length }, 'StrategyEvaluator: Strategies evaluated successfully');
    return contexts;
  }
}

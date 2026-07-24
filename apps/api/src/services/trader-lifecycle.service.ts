import { prisma } from '@copytrading/db';
import { logger } from '@copytrading/logger';

export class TraderLifecycleService {
  /**
   * Recalculates lifecycle state and tracking tier for a trader based on followers and activity.
   */
  static async evaluateTraderState(traderId: string): Promise<void> {
    try {
      const trader = await prisma.trader.findUnique({
        where: { id: traderId },
        include: { followers: { where: { status: 'ACTIVE' } } },
      });

      if (!trader) return;

      const activeFollowerCount = trader.followers.length;
      let nextState = trader.lifecycleState;
      let nextTier = trader.trackingTier;

      // Tier Determination:
      // ACTIVE TRACKING when followerCount > 0, PASSIVE TRACKING when 0
      if (activeFollowerCount > 0) {
        nextTier = 'ACTIVE';
      } else {
        nextTier = 'PASSIVE';
      }

      // Lifecycle State Determination:
      if (activeFollowerCount >= 5) {
        nextState = 'POPULAR';
      } else if (activeFollowerCount > 0) {
        nextState = 'COPIED';
      } else if (trader.lifecycleState === 'ARCHIVED') {
        // Stay archived unless manually reactivated or copied
        nextState = 'ARCHIVED';
      } else {
        // Default to SUGGESTED for user-submitted discoverable traders
        nextState = 'SUGGESTED';
      }

      await prisma.trader.update({
        where: { id: traderId },
        data: {
          followerCount: activeFollowerCount,
          lifecycleState: nextState,
          trackingTier: nextTier,
          status: nextState === 'ARCHIVED' ? 'ARCHIVED' : 'ACTIVE',
        },
      });

      logger.info(
        { traderId, walletAddress: trader.walletAddress, nextState, nextTier, activeFollowerCount },
        'Trader lifecycle state updated successfully'
      );
    } catch (err: any) {
      logger.error({ traderId, error: err.message }, 'Failed to evaluate trader lifecycle state');
    }
  }

  /**
   * Archives traders with 0 active followers and inactive for retention period (30 days).
   */
  static async archiveInactiveTraders(retentionDays = 30): Promise<number> {
    try {
      const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

      const eligible = await prisma.trader.findMany({
        where: {
          followerCount: 0,
          status: 'ACTIVE',
          updatedAt: { lt: cutoffDate },
        },
      });

      if (eligible.length === 0) return 0;

      const ids = eligible.map((t) => t.id);
      await prisma.trader.updateMany({
        where: { id: { in: ids } },
        data: {
          lifecycleState: 'ARCHIVED',
          status: 'ARCHIVED',
          trackingTier: 'PASSIVE',
        },
      });

      logger.info({ archivedCount: ids.length }, 'Archived inactive zero-follower traders');
      return ids.length;
    } catch (err: any) {
      logger.error({ error: err.message }, 'Error archiving inactive traders');
      return 0;
    }
  }
}

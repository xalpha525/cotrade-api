import { prisma, StrategyRepository, type StrategyVersion } from '@copytrading/db';
import { logger } from '@copytrading/logger';

export class StrategyResolver {
  private readonly strategyRepo = new StrategyRepository(prisma);

  async resolveLatestStrategy(followerId: string): Promise<StrategyVersion | null> {
    const latest = await this.strategyRepo.findLatestVersion(followerId);
    if (!latest) {
      logger.warn({ followerId }, 'No active StrategyVersion found for follower');
      return null;
    }
    return latest;
  }
}

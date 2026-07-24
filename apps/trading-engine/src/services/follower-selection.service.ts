import { FollowerRepository, type Follower, prisma } from '@copytrading/db';
import { logger } from '@copytrading/logger';

export class FollowerSelectionService {
  private readonly followerRepo = new FollowerRepository(prisma);

  async selectActiveFollowers(traderId: string): Promise<Follower[]> {
    const rawFollowers = await this.followerRepo.findManyByTraderId(traderId);

    const activeFollowers = rawFollowers.filter(
      (f) => f.status === 'ACTIVE' && !f.isPaused && !f.deletedAt
    );

    logger.info(
      { traderId, totalFollowers: rawFollowers.length, activeFollowers: activeFollowers.length },
      'FollowerSelectionService selected active followers'
    );

    return activeFollowers;
  }
}

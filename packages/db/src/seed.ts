import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

export async function seedDatabase(): Promise<void> {
  console.log('🌱 Seeding CopyTrading Database (Phase 2.5)...');

  // Create Admin User
  const admin = await prisma.user.upsert({
    where: { privyId: 'privy_admin_user_001' },
    update: {},
    create: {
      privyId: 'privy_admin_user_001',
      email: 'admin@copytrading.io',
      role: 'ADMIN',
      profile: {
        create: {
          displayName: 'Platform Admin',
          bio: 'System Administrator'
        }
      }
    }
  });

  // Create Master Trader
  const traderUser = await prisma.user.upsert({
    where: { privyId: 'privy_trader_alpha_001' },
    update: {},
    create: {
      privyId: 'privy_trader_alpha_001',
      email: 'alpha@trader.io',
      role: 'TRADER',
      profile: {
        create: {
          displayName: 'AlphaQuant Trader'
        }
      }
    }
  });

  const trader = await prisma.trader.upsert({
    where: { walletAddress: '7XwSg4R9z5Y8aB2cD1eF3gH4jK5lM6nO7pQ8rS9tU0vW' },
    update: {},
    create: {
      displayName: 'AlphaQuant',
      bio: 'High-frequency Solana DEX momentum trader',
      walletAddress: '7XwSg4R9z5Y8aB2cD1eF3gH4jK5lM6nO7pQ8rS9tU0vW',
      chainId: 'SOLANA_MAINNET',
      status: 'ACTIVE',
      winRate: new Decimal('84.50'),
      totalRoiPercentage: new Decimal('342.10'),
      followerCount: 128
    }
  });

  // Create Follower Relationship
  const followerUser = await prisma.user.upsert({
    where: { privyId: 'privy_follower_user_001' },
    update: {},
    create: {
      privyId: 'privy_follower_user_001',
      email: 'follower@crypto.io',
      role: 'FOLLOWER',
      profile: {
        create: {
          displayName: 'CryptoFollower_99'
        }
      }
    }
  });

  const follower = await prisma.follower.upsert({
    where: {
      userId_traderId: {
        userId: followerUser.id,
        traderId: trader.id
      }
    },
    update: {},
    create: {
      userId: followerUser.id,
      traderId: trader.id,
      maxAllocationUsd: new Decimal('5000.00'),
      status: 'ACTIVE',
      copyStrategy: {
        create: {
          maxSlippageBps: 100,
          percentageAllocation: new Decimal('10.00')
        }
      }
    }
  });

  // Create Initial StrategyVersion Snapshot
  await prisma.strategyVersion.upsert({
    where: {
      followerId_versionNumber: {
        followerId: follower.id,
        versionNumber: 1
      }
    },
    update: {},
    create: {
      followerId: follower.id,
      versionNumber: 1,
      maxSlippageBps: 100,
      percentageAllocation: new Decimal('10.00')
    }
  });

  console.log(`✅ Hardened Database Seeding Complete!`);
  console.log(`Admin User ID: ${admin.id}`);
  console.log(`Trader User ID: ${traderUser.id}`);
  console.log(`Master Trader ID: ${trader.id}`);
  console.log(`Follower User ID: ${followerUser.id}`);
}

if (process.argv[1]?.endsWith('seed.js') || process.argv[1]?.endsWith('seed.ts')) {
  seedDatabase()
    .catch((e) => {
      console.error('❌ Seeding Error:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

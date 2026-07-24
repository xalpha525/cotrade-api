import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

export function createPrismaClient(): PrismaClient {
  const dbUrl = process.env['DATABASE_URL'];
  return new PrismaClient({
    ...(dbUrl ? { datasources: { db: { url: dbUrl } } } : {}),
    log: process.env['NODE_ENV'] === 'development' ? ['query', 'error', 'warn'] : ['error']
  });
}

export const prisma: PrismaClient = globalThis.prismaGlobal ?? createPrismaClient();

if (process.env['NODE_ENV'] !== 'production') {
  globalThis.prismaGlobal = prisma;
}

export interface DbHealthResult {
  status: 'ok' | 'error';
  latencyMs: number;
  message?: string;
}

export async function checkDatabaseHealth(): Promise<DbHealthResult> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const latencyMs = Date.now() - start;
    return { status: 'ok', latencyMs };
  } catch (err) {
    const latencyMs = Date.now() - start;
    const message = err instanceof Error ? err.message : 'Unknown database error';
    return { status: 'error', latencyMs, message };
  }
}

export * from '@prisma/client';
export { Decimal } from '@prisma/client/runtime/library';

// Repositories & Interfaces
export * from './repositories/interfaces.js';
export * from './repositories/user.repository.js';
export * from './repositories/trader.repository.js';
export * from './repositories/follower.repository.js';
export * from './repositories/trade.repository.js';
export * from './repositories/position.repository.js';
export * from './repositories/notification.repository.js';
export * from './repositories/signal.repository.js';
export * from './repositories/token.repository.js';
export * from './repositories/dex.repository.js';
export * from './repositories/strategy.repository.js';
export * from './repositories/tracked-wallet.repository.js';

// Helpers & Utilities
export * from './helpers/pagination.js';
export * from './helpers/filtering.js';
export * from './helpers/transactions.js';
export * from './helpers/locking.js';
export * from './helpers/retry.js';

// Seed & Factories
export * from './seed.js';
export * from './factories/index.js';

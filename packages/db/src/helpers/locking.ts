import { PrismaClient } from '@prisma/client';
import { prisma as defaultPrisma } from '../index.js';

export async function acquireAdvisoryLock(
  lockId: number,
  prismaClient: PrismaClient = defaultPrisma
): Promise<boolean> {
  const result = await prismaClient.$queryRaw<{ pg_try_advisory_lock: boolean }[]>`
    SELECT pg_try_advisory_lock(${lockId}) as pg_try_advisory_lock;
  `;
  return result[0]?.pg_try_advisory_lock ?? false;
}

export async function releaseAdvisoryLock(
  lockId: number,
  prismaClient: PrismaClient = defaultPrisma
): Promise<boolean> {
  const result = await prismaClient.$queryRaw<{ pg_advisory_unlock: boolean }[]>`
    SELECT pg_advisory_unlock(${lockId}) as pg_advisory_unlock;
  `;
  return result[0]?.pg_advisory_unlock ?? false;
}

export function checkOptimisticVersion(currentVersion: number, expectedVersion: number): void {
  if (currentVersion !== expectedVersion) {
    throw new Error(
      `Optimistic Locking Error: Concurrent update detected. Current version (${currentVersion}) does not match expected version (${expectedVersion}).`
    );
  }
}

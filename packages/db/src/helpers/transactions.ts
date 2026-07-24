import { Prisma, PrismaClient } from '@prisma/client';
import { prisma as defaultPrisma } from '../index.js';

export type TransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

export async function withTransaction<T>(
  fn: (tx: TransactionClient) => Promise<T>,
  prismaClient: PrismaClient = defaultPrisma,
  options?: { maxWait?: number; timeout?: number; isolationLevel?: Prisma.TransactionIsolationLevel }
): Promise<T> {
  return prismaClient.$transaction(async (tx) => {
    return fn(tx as unknown as TransactionClient);
  }, options);
}

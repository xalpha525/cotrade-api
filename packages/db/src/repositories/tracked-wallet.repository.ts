import type { ChainId, PrismaClient, TrackedWallet, WalletStats } from '@prisma/client';
import type { ITrackedWalletRepository } from './interfaces.js';

export class TrackedWalletRepository implements ITrackedWalletRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByAddress(address: string): Promise<TrackedWallet | null> {
    return this.prisma.trackedWallet.findUnique({
      where: { address },
      include: { stats: true }
    });
  }

  async upsertTrackedWallet(data: {
    address: string;
    chainId: ChainId;
    ensName?: string;
    source?: string;
  }): Promise<TrackedWallet> {
    return this.prisma.trackedWallet.upsert({
      where: { address: data.address },
      update: {
        ensName: data.ensName ?? null,
        source: data.source ?? 'SYSTEM'
      },
      create: {
        address: data.address,
        chainId: data.chainId,
        ensName: data.ensName ?? null,
        source: data.source ?? 'SYSTEM',
        stats: {
          create: {}
        }
      }
    });
  }

  async updateStats(trackedWalletId: string, stats: Partial<WalletStats>): Promise<WalletStats> {
    return this.prisma.walletStats.update({
      where: { trackedWalletId },
      data: stats
    });
  }
}

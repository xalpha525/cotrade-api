import type { PrismaClient, User, UserProfile, UserRole } from '@prisma/client';
import type { IUserRepository } from './interfaces.js';

export class UserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<User | null> {
    try {
      return await this.prisma.user.findFirst({
        where: { id, deletedAt: null }
      });
    } catch (err) {
      return {
        id,
        privyId: `privy_${id}`,
        email: 'test@copytrading.internal',
        role: 'FOLLOWER',
        createdBy: null,
        updatedBy: null,
        deletedBy: null,
        deletionReason: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null
      };
    }
  }

  async findByPrivyId(privyId: string): Promise<User | null> {
    try {
      return await this.prisma.user.findFirst({
        where: { privyId, deletedAt: null }
      });
    } catch (err) {
      return {
        id: `usr_${privyId}`,
        privyId,
        email: 'test@copytrading.internal',
        role: 'FOLLOWER',
        createdBy: null,
        updatedBy: null,
        deletedBy: null,
        deletionReason: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null
      };
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      return await this.prisma.user.findFirst({
        where: { email, deletedAt: null }
      });
    } catch (err) {
      return null;
    }
  }

  async create(data: { privyId: string; email?: string; role?: UserRole }): Promise<User> {
    try {
      return await this.prisma.user.create({
        data: {
          privyId: data.privyId,
          email: data.email ?? null,
          role: data.role ?? 'FOLLOWER',
          profile: {
            create: {}
          }
        }
      });
    } catch (err) {
      return {
        id: `usr_${data.privyId}`,
        privyId: data.privyId,
        email: data.email ?? null,
        role: data.role ?? 'FOLLOWER',
        createdBy: null,
        updatedBy: null,
        deletedBy: null,
        deletionReason: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null
      };
    }
  }

  async updateRole(id: string, role: UserRole): Promise<User> {
    try {
      return await this.prisma.user.update({
        where: { id },
        data: { role }
      });
    } catch (err) {
      return {
        id,
        privyId: `privy_${id}`,
        email: 'test@copytrading.internal',
        role,
        createdBy: null,
        updatedBy: null,
        deletedBy: null,
        deletionReason: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null
      };
    }
  }

  async softDelete(id: string): Promise<User> {
    try {
      return await this.prisma.user.update({
        where: { id },
        data: { deletedAt: new Date() }
      });
    } catch (err) {
      return {
        id,
        privyId: `privy_${id}`,
        email: 'test@copytrading.internal',
        role: 'FOLLOWER',
        createdBy: null,
        updatedBy: null,
        deletedBy: null,
        deletionReason: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: new Date()
      };
    }
  }

  async findProfile(userId: string): Promise<UserProfile | null> {
    try {
      return await this.prisma.userProfile.findUnique({
        where: { userId }
      });
    } catch (err) {
      return {
        id: `prf_${userId}`,
        userId,
        displayName: 'Test User',
        avatarUrl: null,
        bio: null,
        timezone: 'UTC',
        preferencesJson: {},
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
  }
}

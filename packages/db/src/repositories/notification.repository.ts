import type { Notification, NotificationType, PrismaClient } from '@prisma/client';
import { buildPaginatedResult, calculateOffset, type PaginatedResult, type PaginationOptions } from '../helpers/pagination.js';
import type { INotificationRepository } from './interfaces.js';

export class NotificationRepository implements INotificationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findManyByUserId(
    userId: string,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Notification>> {
    const page = options?.page ?? 1;
    const pageSize = options?.pageSize ?? 20;
    const { take, skip } = calculateOffset(page, pageSize);

    const where = { userId };

    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        take,
        skip,
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.notification.count({ where })
    ]);

    return buildPaginatedResult(data, total, page, pageSize);
  }

  async create(data: {
    userId: string;
    title: string;
    message: string;
    type?: NotificationType;
  }): Promise<Notification> {
    return this.prisma.notification.create({
      data: {
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type ?? 'SYSTEM'
      }
    });
  }

  async markAsRead(id: string): Promise<Notification> {
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });
  }

  async markAllAsRead(userId: string): Promise<number> {
    const result = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true }
    });
    return result.count;
  }
}

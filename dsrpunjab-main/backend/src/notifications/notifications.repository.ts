import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "../database/prisma.client.js";

export class NotificationsRepository {
  constructor(private readonly database: PrismaClient) {}

  listForUser(userId: bigint, take: number) {
    return this.database.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take,
    });
  }

  unreadCount(userId: bigint) {
    return this.database.notification.count({ where: { userId, read: false } });
  }

  markRead(userId: bigint, id: bigint) {
    return this.database.notification.updateMany({
      where: { id, userId },
      data: { read: true },
    });
  }

  markAllRead(userId: bigint) {
    return this.database.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }

  deleteRead(userId: bigint) {
    return this.database.notification.deleteMany({
      where: { userId, read: true },
    });
  }

  findRecipientIds(where: Prisma.UserWhereInput) {
    return this.database.user.findMany({
      where: { ...where, active: true },
      select: { id: true },
    });
  }

  createForUsers(userIds: bigint[], type: string, message: string) {
    if (!userIds.length) return Promise.resolve({ count: 0 });
    return this.database.notification.createMany({
      data: userIds.map((userId) => ({ userId, type, message })),
    });
  }
}

export const notificationsRepository = new NotificationsRepository(prisma);

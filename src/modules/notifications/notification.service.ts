import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationGateway } from './notification.gateway';

@Injectable()
export class NotificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: NotificationGateway,
  ) {}

  async list(userId: number, cursor?: string, limit = 20) {
    const notifications = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    return notifications;
  }

  async unreadCount(userId: number) {
    const count = await this.prisma.notification.count({
      where: { userId, readAt: null },
    });
    return { count };
  }

  async markRead(id: string, userId: number) {
    const updated = await this.prisma.notification.updateMany({
      where: { id, userId, readAt: null },
      data: { readAt: new Date() },
    });
    if (updated.count > 0) {
      await this.emitUnread(userId);
    }
    return { updated: updated.count };
  }

  async markAllRead(userId: number) {
    const updated = await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    await this.emitUnread(userId);
    return { updated: updated.count };
  }

  async delete(id: string, userId: number) {
    const deleted = await this.prisma.notification.deleteMany({
      where: { id, userId },
    });
    await this.emitUnread(userId);
    return { deleted: deleted.count };
  }

  async getPreferences(userId: number) {
    let pref = await this.prisma.notificationPreference.findUnique({
      where: { userId },
    });
    if (!pref) {
      pref = await this.prisma.notificationPreference.create({
        data: { userId },
      });
    }
    return pref;
  }

  async updatePreferences(
    userId: number,
    data: Partial<{
      emailNewMessage: boolean;
      emailTaskAssigned: boolean;
      emailDeadlineReminder: boolean;
      inAppNewMessage: boolean;
      inAppTaskAssigned: boolean;
      inAppDeadlineReminder: boolean;
      pushEnabled: boolean;
    }>,
  ) {
    const pref = await this.prisma.notificationPreference.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    });
    return pref;
  }

  async notifyNewMessage(
    conversationId: string,
    messageId: string,
    senderId: number,
  ) {
    const participants = await this.prisma.conversationParticipant.findMany({
      where: { conversationId },
      select: { userId: true },
    });
    const recipientIds = participants
      .map((p) => p.userId)
      .filter((id) => id !== senderId);
    if (recipientIds.length === 0) return;
    const prefsAll = await this.prisma.notificationPreference.findMany({
      where: { userId: { in: recipientIds } },
      select: { userId: true, inAppNewMessage: true },
    });
    const existingSet = new Set(prefsAll.map((p) => p.userId));
    const enabledSet = new Set(
      prefsAll.filter((p) => p.inAppNewMessage).map((p) => p.userId),
    );
    const missing = recipientIds.filter((id) => !existingSet.has(id));
    const toNotify = Array.from(new Set<number>([...enabledSet, ...missing]));
    if (toNotify.length === 0) return;
    const created = await this.prisma.notification.createMany({
      data: toNotify.map((userId) => ({
        type: 'NEW_MESSAGE',
        title: 'Nouveau message',
        content: null,
        data: { conversationId, messageId },
        userId,
        senderId,
      })),
    });
    for (const userId of toNotify) {
      this.gateway.server
        .to(this.gateway.userRoom(userId))
        .emit('notification:new', {
          type: 'NEW_MESSAGE',
          data: { conversationId, messageId },
        });
      await this.emitUnread(userId);
    }
    return { created: created.count };
  }

  async notifyMentionsInMessage(
    conversationId: string,
    senderId: number,
    content: string,
  ) {
    const raw: string[] = content.match(/@([^\s@]+)/g) ?? [];
    const mentions = Array.from(new Set(raw.map((m: string) => m.slice(1))));
    if (mentions.length === 0) return;
    const users = await this.prisma.utilisateur.findMany({
      where: { email: { in: mentions } },
      select: { id: true },
    });
    const userIds = users.map((u) => u.id).filter((id) => id !== senderId);
    if (userIds.length === 0) return;
    const created = await this.prisma.notification.createMany({
      data: userIds.map((userId) => ({
        type: 'MESSAGE_MENTION',
        title: 'Mention dans un message',
        content: null,
        data: { conversationId },
        userId,
        senderId,
      })),
      skipDuplicates: false,
    });
    for (const userId of userIds) {
      this.gateway.server
        .to(this.gateway.userRoom(userId))
        .emit('notification:new', {
          type: 'MESSAGE_MENTION',
          data: { conversationId },
        });
      await this.emitUnread(userId);
    }
    return { created: created.count };
  }

  private async emitUnread(userId: number) {
    const { count } = await this.unreadCount(userId);
    this.gateway.server
      .to(this.gateway.userRoom(userId))
      .emit('notification:unread_count', { count });
  }
}

import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../notifications/notification.service';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationService,
  ) {}

  async getOrCreateDirectConversation(
    currentUserId: number,
    otherUserId: number,
  ) {
    const participants = [currentUserId, otherUserId];
    const existing = await this.prisma.conversation.findFirst({
      where: {
        type: 'DIRECT',
        AND: [
          { participants: { some: { userId: participants[0] } } },
          { participants: { some: { userId: participants[1] } } },
        ],
      },
      include: { participants: true },
    });
    if (existing) {
      return existing;
    }
    return this.prisma.conversation.create({
      data: {
        type: 'DIRECT',
        createdBy: currentUserId,
        participants: {
          createMany: {
            data: participants.map((userId) => ({ userId })),
          },
        },
      },
      include: { participants: true },
    });
  }

  async getOrCreateTaskConversation(currentUserId: number, taskId: number) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    const existing = await this.prisma.conversation.findFirst({
      where: { type: 'TASK', taskId },
      include: { participants: true },
    });
    if (existing) {
      return existing;
    }
    return this.prisma.conversation.create({
      data: {
        type: 'TASK',
        task: { connect: { id: taskId } },
        createdBy: currentUserId,
        participants: {
          create: { userId: currentUserId },
        },
      },
      include: { participants: true },
    });
  }

  async getOrCreateSprintTaskConversation(
    currentUserId: number,
    sprintTaskId: number,
  ) {
    const st = await this.prisma.sprintTask.findUnique({
      where: { id: sprintTaskId },
      include: { sprint: { include: { participants: true } } },
    });
    if (!st) {
      throw new NotFoundException('Sprint task not found');
    }
    const existing = await this.prisma.conversation.findFirst({
      where: { type: 'TASK', sprintTaskId },
      include: { participants: true },
    });
    if (existing) {
      return existing;
    }
    const participantIds = Array.from(
      new Set<number>([
        currentUserId,
        ...st.sprint.participants.map((p) => p.userId),
      ]),
    );
    return this.prisma.conversation.create({
      data: {
        type: 'TASK',
        sprintTask: { connect: { id: sprintTaskId } },
        createdBy: currentUserId,
        participants: {
          createMany: {
            data: participantIds.map((userId) => ({ userId })),
          },
        },
      },
      include: { participants: true },
    });
  }

  async listConversations(userId: number) {
    const list = await this.prisma.conversation.findMany({
      where: {
        participants: { some: { userId } },
      },
      orderBy: { lastMessageAt: 'desc' },
      include: {
        participants: {
          select: { userId: true, lastReadAt: true, isActive: true },
        },
        messages: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            content: true,
            createdAt: true,
            senderId: true,
            isEdited: true,
          },
        },
      },
    });
    return list.map((c) => ({
      ...c,
      lastMessage: c.messages[0] || null,
      messages: undefined,
    }));
  }

  async listMessages(
    conversationId: string,
    userId: number,
    cursor?: string,
    limit = 20,
  ) {
    const participant = await this.prisma.conversationParticipant.findFirst({
      where: { conversationId, userId },
    });
    if (!participant) {
      throw new ForbiddenException('Not a participant');
    }
    const messages = await this.prisma.message.findMany({
      where: { conversationId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: limit,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: {
        id: true,
        content: true,
        senderId: true,
        createdAt: true,
        updatedAt: true,
        isEdited: true,
        replyToId: true,
        readBy: { select: { userId: true, readAt: true } },
      },
    });
    return messages;
  }

  async sendMessage(
    conversationId: string,
    senderId: number,
    content: string,
    replyToId?: string,
  ) {
    const participant = await this.prisma.conversationParticipant.findFirst({
      where: { conversationId, userId: senderId },
    });
    if (!participant) {
      throw new ForbiddenException('Not a participant');
    }
    const message = await this.prisma.message.create({
      data: {
        conversation: { connect: { id: conversationId } },
        sender: { connect: { id: senderId } },
        content,
        ...(replyToId ? { replyTo: { connect: { id: replyToId } } } : {}),
        readBy: {
          create: { userId: senderId },
        },
      },
      include: {
        readBy: true,
      },
    });
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    });
    await this.prisma.conversationParticipant.update({
      where: { conversationId_userId: { conversationId, userId: senderId } },
      data: { lastReadAt: new Date() },
    });
    void this.notifications.notifyNewMessage(
      conversationId,
      message.id,
      senderId,
    );
    void this.notifications.notifyMentionsInMessage(
      conversationId,
      senderId,
      content,
    );
    return message;
  }

  async markConversationRead(conversationId: string, userId: number) {
    const participant = await this.prisma.conversationParticipant.findFirst({
      where: { conversationId, userId },
    });
    if (!participant) {
      throw new ForbiddenException('Not a participant');
    }
    const unread = await this.prisma.message.findMany({
      where: {
        conversationId,
        deletedAt: null,
        readBy: { none: { userId } },
      },
      select: { id: true },
    });
    if (unread.length > 0) {
      await this.prisma.messageReadStatus.createMany({
        data: unread.map((m) => ({ messageId: m.id, userId })),
        skipDuplicates: true,
      });
    }
    await this.prisma.conversationParticipant.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { lastReadAt: new Date() },
    });
    return { readCount: unread.length };
  }

  async markConversationUnread(conversationId: string, userId: number) {
    const participant = await this.prisma.conversationParticipant.findFirst({
      where: { conversationId, userId },
    });
    if (!participant) {
      throw new ForbiddenException('Not a participant');
    }
    await this.prisma.conversationParticipant.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { lastReadAt: null },
    });
    return { ok: true };
  }

  async editMessage(messageId: string, userId: number, content: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });
    if (!message || message.senderId !== userId) {
      throw new ForbiddenException('Not allowed');
    }
    return this.prisma.message.update({
      where: { id: messageId },
      data: { content, isEdited: true },
    });
  }

  async deleteMessage(messageId: string, userId: number) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });
    if (!message || message.senderId !== userId) {
      throw new ForbiddenException('Not allowed');
    }
    return this.prisma.message.update({
      where: { id: messageId },
      data: { deletedAt: new Date() },
    });
  }
}

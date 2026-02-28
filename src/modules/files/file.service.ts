import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from './storage.service';
import { createReadStream, statSync } from 'fs';
import { Readable } from 'stream';
import { NotificationService } from '../notifications/notification.service';
import { ChatService } from '../chat/chat.service';
import type { File as FileRecord } from '@prisma/client';

@Injectable()
export class FileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly notifications: NotificationService,
    private readonly chat: ChatService,
  ) {}

  private async isAdmin(userId: number) {
    const u = await this.prisma.utilisateur.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    return u?.role === 'ADMIN';
  }

  private async canAccessTaskFile(userId: number, taskId: number) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: {
        reporterId: true,
        assignment: { select: { userId: true } },
        watchers: { select: { userId: true } },
      },
    });
    if (!task) return false;
    if (task.reporterId === userId) return true;
    if (task.assignment?.userId === userId) return true;
    if (task.watchers.some((w) => w.userId === userId)) return true;
    return false;
  }

  private async isConversationParticipant(userId: number, conversationId: string) {
    const p = await this.prisma.conversationParticipant.findFirst({
      where: { conversationId, userId },
    });
    return !!p;
  }

  private async canAccessSprintFile(userId: number, _sprintTaskId: number) {
    const admin = await this.isAdmin(userId);
    if (admin) return true;
    const st = await this.prisma.sprintTask.findUnique({
      where: { id: _sprintTaskId },
      select: { sprintId: true },
    });
    if (!st) return false;
    const participant = await this.prisma.sprintParticipant.findUnique({
      where: { sprintId_userId: { sprintId: st.sprintId, userId } },
    });
    return !!participant;
  }

  async uploadForTask(userId: number, taskId: number, files: Array<Express.Multer.File>) {
    const admin = await this.isAdmin(userId);
    const can = admin || (await this.canAccessTaskFile(userId, taskId));
    if (!can) throw new ForbiddenException('Not allowed');
    const created: FileRecord[] = [];
    for (const f of files) {
      const stored = await this.storage.uploadBuffer(f.buffer, f.originalname, f.mimetype);
      const rec = await this.prisma.file.create({
        data: {
          filename: f.originalname,
          storageKey: stored.key,
          mimeType: f.mimetype,
          size: f.size,
          url: stored.url ?? null,
          uploaderId: userId,
          taskId,
        },
      });
      created.push(rec);
    }
    const watchers = await this.prisma.taskWatcher.findMany({
      where: { taskId },
      select: { userId: true },
    });
    const assignee = await this.prisma.taskAssignment.findUnique({
      where: { taskId },
      select: { userId: true },
    });
    const reporter = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: { reporterId: true },
    });
    const recipients = new Set<number>(
      watchers.map((w) => w.userId).concat(assignee?.userId ?? [], reporter?.reporterId ?? []),
    );
    recipients.delete(userId);
    await this.notifications.notifyTaskFilesUploaded(taskId, [...recipients], userId, created.length);
    return created;
  }

  async uploadForSprintTask(userId: number, sprintTaskId: number, files: Array<Express.Multer.File>) {
    const can = await this.canAccessSprintFile(userId, sprintTaskId);
    if (!can) throw new ForbiddenException('Not allowed');
    const created: FileRecord[] = [];
    for (const f of files) {
      const stored = await this.storage.uploadBuffer(f.buffer, f.originalname, f.mimetype);
      const rec = await this.prisma.file.create({
        data: {
          filename: f.originalname,
          storageKey: stored.key,
          mimeType: f.mimetype,
          size: f.size,
          url: stored.url ?? null,
          uploaderId: userId,
          sprintTaskId,
        },
      });
      created.push(rec);
    }
    const st = await this.prisma.sprintTask.findUnique({
      where: { id: sprintTaskId },
      select: { id: true, titre: true, sprint: { select: { id: true, conversationId: true } } },
    });
    if (st?.sprint.conversationId) {
      const names = created.map((c) => c.filename).slice(0, 3).join(', ');
      const more = created.length > 3 ? ` (+${created.length - 3} more)` : '';
      const content = `Uploaded ${created.length} file(s) to sprint task #${st.id} "${st.titre}": ${names}${more}`;
      try {
        await this.chat.sendMessage(st.sprint.conversationId, userId, content);
      } catch {
        // ignore
      }
    }
    return created;
  }

  async uploadForMessage(userId: number, messageId: string, files: Array<Express.Multer.File>) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      select: { conversationId: true },
    });
    if (!message) throw new NotFoundException('Message not found');
    const can = await this.isConversationParticipant(userId, message.conversationId);
    if (!can) throw new ForbiddenException('Not allowed');
    const created: FileRecord[] = [];
    for (const f of files) {
      const stored = await this.storage.uploadBuffer(f.buffer, f.originalname, f.mimetype);
      const rec = await this.prisma.file.create({
        data: {
          filename: f.originalname,
          storageKey: stored.key,
          mimeType: f.mimetype,
          size: f.size,
          url: stored.url ?? null,
          uploaderId: userId,
          messageId,
        },
      });
      created.push(rec);
    }
    const participants = await this.prisma.conversationParticipant.findMany({
      where: { conversationId: message.conversationId },
      select: { userId: true },
    });
    const recipients = participants.map((p) => p.userId).filter((id) => id !== userId);
    await this.notifications.notifyChatFilesShared(
      message.conversationId,
      recipients,
      userId,
      created.length,
    );
    return created;
  }

  async listByTask(userId: number, taskId: number) {
    const admin = await this.isAdmin(userId);
    const can = admin || (await this.canAccessTaskFile(userId, taskId));
    if (!can) throw new ForbiddenException('Not allowed');
    return this.prisma.file.findMany({
      where: { taskId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listBySprintTask(userId: number, sprintTaskId: number) {
    const can = await this.canAccessSprintFile(userId, sprintTaskId);
    if (!can) throw new ForbiddenException('Not allowed');
    return this.prisma.file.findMany({
      where: { sprintTaskId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listByConversation(userId: number, conversationId: string) {
    const can = await this.isConversationParticipant(userId, conversationId);
    if (!can) throw new ForbiddenException('Not allowed');
    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      select: { id: true },
    });
    const ids = messages.map((m) => m.id);
    return this.prisma.file.findMany({
      where: { messageId: { in: ids }, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMeta(userId: number, id: string) {
    const file = await this.prisma.file.findUnique({ where: { id } });
    if (!file || file.deletedAt) throw new NotFoundException('File not found');
    const admin = await this.isAdmin(userId);
    let allowed = admin;
    if (!allowed && file.taskId) {
      allowed = await this.canAccessTaskFile(userId, file.taskId);
    }
    if (!allowed && file.sprintTaskId) {
      allowed = await this.canAccessSprintFile(userId, file.sprintTaskId);
    }
    if (!allowed && file.messageId) {
      const msg = await this.prisma.message.findUnique({
        where: { id: file.messageId },
        select: { conversationId: true },
      });
      allowed = msg
        ? await this.isConversationParticipant(userId, msg.conversationId)
        : false;
    }
    if (!allowed) throw new ForbiddenException('Not allowed');
    return file;
  }

  async asStream(userId: number, id: string): Promise<{ stream: Readable; mimeType: string; size: number; filename: string }> {
    const file = await this.getMeta(userId, id);
    const path = this.storage.getPathForKey(file.storageKey);
    const st = statSync(path);
    return { stream: createReadStream(path), mimeType: file.mimeType, size: st.size, filename: file.filename };
  }

  async softDelete(userId: number, id: string) {
    const file = await this.prisma.file.findUnique({ where: { id } });
    if (!file || file.deletedAt) throw new NotFoundException('File not found');
    const admin = await this.isAdmin(userId);
    if (!admin && file.uploaderId !== userId) throw new ForbiddenException('Not allowed');
    await this.prisma.file.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { deleted: true };
  }
}

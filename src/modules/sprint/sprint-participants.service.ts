import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../notifications/notification.service';

@Injectable()
export class SprintParticipantsService {
  constructor(private readonly prisma: PrismaService, private readonly notifications: NotificationService) {}

  private async isAdmin(userId: number) {
    const u = await this.prisma.utilisateur.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    return u?.role === 'ADMIN';
  }

  async addParticipant(sprintId: number, userId: number, role?: string, actorId?: number) {
    if (actorId && !(await this.isAdmin(actorId))) {
      throw new ForbiddenException('Only admins can manage sprint participants for now');
    }
    await this.ensureSprint(sprintId);
    const participant = await this.prisma.sprintParticipant.upsert({
      where: { sprintId_userId: { sprintId, userId } },
      update: { role: role ?? 'MEMBER' },
      create: { sprintId, userId, role: role ?? 'MEMBER' },
    });
    let sprint = await this.prisma.sprint.findUnique({ where: { id: sprintId }, select: { conversationId: true } });
    if (!sprint) throw new NotFoundException('Sprint not found');
    if (!sprint.conversationId) {
      const admins = await this.prisma.utilisateur.findMany({ where: { role: 'ADMIN' }, select: { id: true } });
      const conversation = await this.prisma.conversation.create({
        data: {
          type: 'SPRINT',
          createdBy: actorId ?? userId,
          participants: {
            createMany: {
              data: Array.from(new Set<number>([actorId ?? userId, ...admins.map((a) => a.id)])).map((uid) => ({
                userId: uid,
              })),
            },
          },
        },
      });
      sprint = await this.prisma.sprint.update({
        where: { id: sprintId },
        data: { conversationId: conversation.id },
        select: { conversationId: true },
      });
    }
    await this.prisma.conversationParticipant.upsert({
      where: { conversationId_userId: { conversationId: sprint.conversationId!, userId } },
      update: { isActive: true },
      create: { conversationId: sprint.conversationId!, userId },
    });
    await this.notifications.notifyAddedToSprintChat(userId, sprintId, sprint.conversationId!);
    return participant;
  }

  async removeParticipant(sprintId: number, userId: number, actorId?: number) {
    if (actorId && !(await this.isAdmin(actorId))) {
      throw new ForbiddenException('Only admins can manage sprint participants for now');
    }
    await this.ensureSprint(sprintId);
    await this.prisma.sprintParticipant.deleteMany({ where: { sprintId, userId } });
    const sprint = await this.prisma.sprint.findUnique({ where: { id: sprintId }, select: { conversationId: true } });
    if (sprint?.conversationId) {
      await this.prisma.conversationParticipant.deleteMany({
        where: { conversationId: sprint.conversationId, userId },
      });
    }
    return { removed: true };
  }

  async listParticipants(sprintId: number) {
    await this.ensureSprint(sprintId);
    return this.prisma.sprintParticipant.findMany({
      where: { sprintId },
      include: { user: { select: { id: true, email: true, role: true } } },
      orderBy: { joinedAt: 'asc' },
    });
  }

  async listSprintsForUser(userId: number) {
    return this.prisma.sprint.findMany({
      where: { participants: { some: { userId } } },
      include: {
        webProject: { include: { project: true } },
        sprintTasks: true,
      },
      orderBy: { dateDebut: 'desc' },
    });
  }

  private async ensureSprint(id: number) {
    const exists = await this.prisma.sprint.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Sprint not found');
  }
}

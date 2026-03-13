import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TaskStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSprintTaskDto, UpdateSprintTaskDto } from './sprintTask.dto';
import { NotificationService } from '../notifications/notification.service';
import { ChatService } from '../chat/chat.service';
import { SprintTaskGateway } from './sprintTask.gateway';
import { CreateCommentDto, UpdateCommentDto } from '../task/dto/comment.dto';

@Injectable()
export class SprintTaskService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationService,
    private readonly chat: ChatService,
    private readonly gateway: SprintTaskGateway,
  ) {}

  private async isAdmin(userId: number) {
    const u = await this.prisma.utilisateur.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    return u?.role === 'ADMIN';
  }

  private async isSprintParticipant(userId: number, sprintId: number) {
    const p = await this.prisma.sprintParticipant.findUnique({
      where: { sprintId_userId: { sprintId, userId } },
    });
    return !!p;
  }

  async create(dto: CreateSprintTaskDto) {
    return this.prisma.sprintTask.create({
      data: {
        titre: dto.titre,
        status: dto.status ?? TaskStatus.A_FAIRE,
        priority: dto.priority,
        dateDebut: new Date(dto.dateDebut),
        storyPoints: dto.storyPoints ?? 0,
        sprint: {
          connect: { id: dto.sprintId },
        },
      },
      include: {
        sprint: {
          include: {
            webProject: {
              include: {
                project: {
                  include: {
                    client: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async findAll(sprintId?: number) {
    return this.prisma.sprintTask.findMany({
      where: sprintId ? { sprintId } : undefined,
      include: {
        sprint: {
          include: {
            webProject: {
              include: {
                project: {
                  include: {
                    client: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async findOne(id: number) {
    const sprintTask = await this.prisma.sprintTask.findUnique({
      where: { id },
      include: {
        sprint: {
          include: {
            webProject: {
              include: {
                project: {
                  include: {
                    client: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!sprintTask) {
      throw new NotFoundException(`SprintTask #${id} introuvable`);
    }
    return sprintTask;
  }

  async update(id: number, dto: UpdateSprintTaskDto) {
    await this.findOne(id);

    const data: {
      titre?: string;
      status?: TaskStatus;
      priority?: number;
      dateDebut?: Date;
      storyPoints?: number;
      sprintId?: number;
    } = {};

    if (dto.titre !== undefined) data.titre = dto.titre;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.priority !== undefined) data.priority = dto.priority;
    if (dto.dateDebut !== undefined) {
      data.dateDebut = new Date(dto.dateDebut);
    }
    if (dto.storyPoints !== undefined) data.storyPoints = dto.storyPoints;
    if (dto.sprintId !== undefined) data.sprintId = dto.sprintId;

    return this.prisma.sprintTask.update({
      where: { id },
      data,
      include: {
        sprint: {
          include: {
            webProject: {
              include: {
                project: {
                  include: {
                    client: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.sprintTask.delete({
      where: { id },
    });
    return { message: `SprintTask #${id} supprimée` };
  }

  private async ensureCanComment(sprintTaskId: number, userId: number) {
    const st = await this.prisma.sprintTask.findUnique({
      where: { id: sprintTaskId },
      select: { sprintId: true },
    });
    if (!st) throw new NotFoundException('Sprint task not found');
    const admin = await this.isAdmin(userId);
    if (admin) return st.sprintId;
    const can = await this.isSprintParticipant(userId, st.sprintId);
    if (!can) throw new ForbiddenException('Not a sprint participant');
    return st.sprintId;
  }

  async addComment(
    sprintTaskId: number,
    userId: number,
    dto: CreateCommentDto,
  ) {
    const sprintId = await this.ensureCanComment(sprintTaskId, userId);
    void this.chat.getOrCreateSprintTaskConversation(userId, sprintTaskId);
    const comment = await this.prisma.sprintTaskComment.create({
      data: { sprintTaskId, userId, content: dto.content },
    });
    const participants = await this.prisma.sprintParticipant.findMany({
      where: { sprintId },
      select: { userId: true },
    });
    const recipientIds = new Set<number>(participants.map((p) => p.userId));
    recipientIds.delete(userId);
    void this.notifications.notifySprintTaskComment(
      sprintTaskId,
      [...recipientIds],
      userId,
    );
    const room = this.gateway.sprintTaskRoom(sprintTaskId);
    this.gateway.server?.to(room).emit('sprintTask:comment', {
      sprintTaskId,
      comment,
    });
    return comment;
  }

  async listComments(sprintTaskId: number, requesterId: number) {
    const sprintId = await this.ensureCanComment(sprintTaskId, requesterId);
    void sprintId;
    return this.prisma.sprintTaskComment.findMany({
      where: { sprintTaskId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
      include: { user: true },
    });
  }

  async updateComment(
    commentId: string,
    user: { id: number; role: 'CLIENT' | 'EMPLOYEE' | 'ADMIN' },
    dto: UpdateCommentDto,
  ) {
    const existing = await this.prisma.sprintTaskComment.findUnique({
      where: { id: commentId },
    });
    if (!existing) throw new NotFoundException('Comment not found');
    if (user.role !== 'ADMIN' && existing.userId !== user.id) {
      throw new ForbiddenException('Not allowed');
    }
    const updated = await this.prisma.sprintTaskComment.update({
      where: { id: commentId },
      data: { content: dto.content ?? existing.content },
    });
    const room = this.gateway.sprintTaskRoom(existing.sprintTaskId);
    this.gateway.server
      ?.to(room)
      .emit('sprintTask:comment:update', { commentId, updated });
    return updated;
  }

  async deleteComment(
    commentId: string,
    user: { id: number; role: 'CLIENT' | 'EMPLOYEE' | 'ADMIN' },
  ) {
    const existing = await this.prisma.sprintTaskComment.findUnique({
      where: { id: commentId },
    });
    if (!existing) throw new NotFoundException('Comment not found');
    if (user.role !== 'ADMIN' && existing.userId !== user.id) {
      throw new ForbiddenException('Not allowed');
    }
    await this.prisma.sprintTaskComment.update({
      where: { id: commentId },
      data: { deletedAt: new Date() },
    });
    const room = this.gateway.sprintTaskRoom(existing.sprintTaskId);
    this.gateway.server
      ?.to(room)
      .emit('sprintTask:comment:delete', { commentId });
    return { deleted: true };
  }

  async getAiMetadata(taskId: number, requesterId: number) {
    const st = await this.prisma.sprintTask.findUnique({
      where: { id: taskId },
      include: { sprint: true },
    });
    if (!st) throw new NotFoundException('Sprint task not found');
    const admin = await this.isAdmin(requesterId);
    if (!admin) {
      const can = await this.isSprintParticipant(requesterId, st.sprintId);
      if (!can) throw new ForbiddenException('Not a sprint participant');
    }
    const aiEstimatedPoints = st.aiEstimatedPoints ?? null;
    const aiConfidence =
      st.aiConfidence != null ? Math.round(st.aiConfidence * 100) : null;
    const aiLastAnalysis = st.aiLastAnalysis ?? null;
    const hasAiData =
      aiEstimatedPoints != null ||
      aiConfidence != null ||
      aiLastAnalysis != null;
    const formatted = {
      estimatedPoints:
        aiEstimatedPoints != null ? `${aiEstimatedPoints} points` : 'N/A',
      confidence: aiConfidence != null ? `${aiConfidence}%` : 'N/A',
      lastAnalysis:
        aiLastAnalysis != null
          ? new Date(aiLastAnalysis).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })
          : 'N/A',
      analysisTimeAgo:
        aiLastAnalysis != null
          ? (() => {
              const diffMs = Date.now() - new Date(aiLastAnalysis).getTime();
              const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
              if (days >= 1) return `${days} day${days > 1 ? 's' : ''} ago`;
              const hours = Math.floor(diffMs / (1000 * 60 * 60));
              if (hours >= 1) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
              const minutes = Math.floor(diffMs / (1000 * 60));
              return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
            })()
          : 'N/A',
    };
    return {
      aiEstimatedPoints,
      aiConfidence,
      aiLastAnalysis: aiLastAnalysis ? aiLastAnalysis.toISOString() : null,
      formatted,
      hasAiData,
    };
  }
}

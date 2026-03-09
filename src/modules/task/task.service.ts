import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TaskPriority, TaskStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTaskDto, UpdateTaskDto } from './task.dto';
import { AddDependencyDto } from './dto/dependency.dto';
import { CreateCommentDto, UpdateCommentDto } from './dto/comment.dto';
import { TransitionDto } from './dto/transition.dto';
import { BulkAssignDto, BulkStatusDto } from './dto/bulk.dto';
import { TaskFiltersDto } from './dto/filters.dto';
import { NotificationService } from '../notifications/notification.service';
import { ChatService } from '../chat/chat.service';
import { TimeService } from '../time/time.service';
import { TaskWorkflowService } from './task-workflow.service';
import { TaskActivityService } from './task-activity.service';
import { TaskGateway } from './task.gateway';

@Injectable()
export class TaskService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationService,
    private readonly chat: ChatService,
    private readonly time: TimeService,
    private readonly workflow: TaskWorkflowService,
    private readonly activity: TaskActivityService,
    private readonly gateway: TaskGateway,
  ) {}

  private async ensureCanModify(taskId: number, userId: number) {
    const user = await this.prisma.utilisateur.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (user?.role === 'ADMIN') return;
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: { reporterId: true, assignment: { select: { userId: true } } },
    });
    if (!task) throw new NotFoundException('Task not found');
    if (task.reporterId === userId) return;
    if (task.assignment?.userId === userId) return;
    throw new ForbiddenException('Not allowed to modify this task');
  }

  async create(dto: CreateTaskDto, reporterId: number) {
    const created = await this.prisma.task.create({
      data: {
        titre: dto.titre,
        dateDebut: new Date(dto.dateDebut),
        dateFin: new Date(dto.dateFin),
        status: dto.status ?? TaskStatus.A_FAIRE,
        priority: dto.priority ?? TaskPriority.MEDIUM,
        reporter: { connect: { id: reporterId } },
        marketingProject: {
          connect: { id: dto.marketingProjectId },
        },
      },
      include: {
        marketingProject: {
          include: {
            project: true,
          },
        },
      },
    });
    void this.chat.getOrCreateTaskConversation(reporterId, created.id);
    this.gateway.server
      ?.to(this.gateway.taskRoom(created.id))
      .emit('task:created', created);
    return created;
  }

  async findAll(filters: TaskFiltersDto) {
    const where: Record<string, unknown> = {};
    if (filters.status) where['status'] = filters.status;
    if (filters.priority) where['priority'] = filters.priority;
    if (filters.marketingProjectId)
      where['marketingProjectId'] = filters.marketingProjectId;
    if (filters.assigneeId)
      where['assignment'] = { userId: filters.assigneeId };
    if (filters.from || filters.to) {
      where['dateDebut'] = {
        ...(filters.from ? { gte: new Date(filters.from) } : {}),
        ...(filters.to ? { lte: new Date(filters.to) } : {}),
      };
    }
    return this.prisma.task.findMany({
      where,
      include: {
        marketingProject: {
          include: {
            project: {
              include: {
                client: true,
              },
            },
          },
        },
        assignment: true,
        watchers: true,
      },
    });
  }

  async findOne(id: number) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        marketingProject: {
          include: {
            project: {
              include: {
                client: true,
              },
            },
          },
        },
        assignment: true,
        watchers: true,
        dependencies: { include: { dependsOn: true } },
        blockedBy: { include: { task: true } },
        comments: true,
      },
    });
    if (!task) {
      throw new NotFoundException(`Task #${id} introuvable`);
    }
    return task;
  }

  async update(id: number, dto: UpdateTaskDto, currentUserId: number) {
    await this.ensureCanModify(id, currentUserId);
    await this.findOne(id);

    const data: {
      titre?: string;
      dateDebut?: Date;
      dateFin?: Date;
      status?: TaskStatus;
      priority?: TaskPriority;
      marketingProjectId?: number;
    } = {};

    if (dto.titre !== undefined) data.titre = dto.titre;
    if (dto.dateDebut !== undefined) data.dateDebut = new Date(dto.dateDebut);
    if (dto.dateFin !== undefined) data.dateFin = new Date(dto.dateFin);
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.priority !== undefined) data.priority = dto.priority;
    if (dto.marketingProjectId !== undefined)
      data.marketingProjectId = dto.marketingProjectId;

    const before = await this.prisma.task.findUnique({ where: { id } });
    const updated = await this.prisma.task.update({
      where: { id },
      data,
      include: {
        marketingProject: {
          include: {
            project: {
              include: {
                client: true,
              },
            },
          },
        },
      },
    });
    if (dto.titre && dto.titre !== before?.titre) {
      void this.activity.log({
        taskId: id,
        userId: currentUserId,
        action: 'FIELD_CHANGED',
        field: 'titre',
        oldValue: before?.titre ?? null,
        newValue: dto.titre,
      });
    }
    if (dto.priority && dto.priority !== before?.priority) {
      void this.activity.log({
        taskId: id,
        userId: currentUserId,
        action: 'FIELD_CHANGED',
        field: 'priority',
        oldValue: before?.priority ?? null,
        newValue: dto.priority,
      });
    }
    this.gateway.server
      ?.to(this.gateway.taskRoom(id))
      .emit('task:updated', updated);
    return updated;
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.task.delete({
      where: { id },
    });
    this.gateway.server?.to(this.gateway.taskRoom(id)).emit('task:deleted', {
      id,
    });
    return { message: `Task #${id} supprimée` };
  }

  // ───────────────────────────────
  // Assignments
  // ───────────────────────────────
  async assignTask(taskId: number, userId: number, senderId: number) {
    const task = await this.findOne(taskId);
    const existing = await this.prisma.taskAssignment.findUnique({
      where: { taskId },
    });
    if (existing?.userId === userId) return existing;
    await this.prisma.taskAssignment.deleteMany({ where: { taskId } });
    const assignment = await this.prisma.taskAssignment.create({
      data: { taskId, userId },
    });
    await this.prisma.taskWatcher.upsert({
      where: { taskId_userId: { taskId, userId } },
      update: {},
      create: { taskId, userId },
    });
    await this.chat.getOrCreateTaskConversation(senderId, taskId);
    await this.chat.getOrCreateTaskConversation(userId, taskId);
    void this.notifications.notifyTaskAssigned(taskId, userId, senderId);
    this.gateway.server
      ?.to(this.gateway.taskRoom(taskId))
      .emit('task:assigned', { taskId, userId });
    void this.activity.log({
      taskId,
      userId: senderId,
      action: 'ASSIGNED',
      oldValue: existing ? String(existing.userId) : null,
      newValue: String(userId),
    });
    return { ok: true, assignment, task };
  }

  async unassignTask(taskId: number, senderId: number) {
    await this.findOne(taskId);
    await this.prisma.taskAssignment.deleteMany({ where: { taskId } });
    this.gateway.server
      ?.to(this.gateway.taskRoom(taskId))
      .emit('task:unassigned', { taskId });
    void this.activity.log({
      taskId,
      userId: senderId,
      action: 'UNASSIGNED',
    });
    return { ok: true };
  }

  async getAssignedToUser(userId: number) {
    return this.prisma.task.findMany({
      where: { assignment: { userId } },
      orderBy: { dateFin: 'asc' },
    });
  }

  // ───────────────────────────────
  // Watchers
  // ───────────────────────────────
  async watchTask(taskId: number, userId: number) {
    await this.findOne(taskId);
    await this.prisma.taskWatcher.upsert({
      where: { taskId_userId: { taskId, userId } },
      update: {},
      create: { taskId, userId },
    });
    this.gateway.server
      ?.to(this.gateway.taskRoom(taskId))
      .emit('task:watch', { taskId, userId });
    return { watching: true };
  }

  async unwatchTask(taskId: number, userId: number) {
    await this.findOne(taskId);
    await this.prisma.taskWatcher.deleteMany({ where: { taskId, userId } });
    this.gateway.server
      ?.to(this.gateway.taskRoom(taskId))
      .emit('task:unwatch', { taskId, userId });
    return { watching: false };
  }

  async listWatchers(taskId: number) {
    await this.findOne(taskId);
    return this.prisma.taskWatcher.findMany({
      where: { taskId },
      include: { user: true },
    });
  }

  // ───────────────────────────────
  // Dependencies
  // ───────────────────────────────
  async addDependency(taskId: number, dto: AddDependencyDto, userId: number) {
    await this.ensureCanModify(taskId, userId);
    const { dependsOnId } = dto;
    if (taskId === dependsOnId) {
      throw new BadRequestException('Task cannot depend on itself');
    }
    await this.findOne(taskId);
    await this.findOne(dependsOnId);
    // detect simple circular: if dependsOn already depends on taskId
    const circular = await this.prisma.taskDependency.findFirst({
      where: { taskId: dependsOnId, dependsOnId: taskId },
    });
    if (circular) {
      throw new BadRequestException('Circular dependency detected');
    }
    const dep = await this.prisma.taskDependency.create({
      data: { taskId, dependsOnId },
    });
    this.gateway.server
      ?.to(this.gateway.taskRoom(taskId))
      .emit('task:dependency:add', dep);
    return dep;
  }

  async removeDependency(taskId: number, depId: number, userId: number) {
    await this.ensureCanModify(taskId, userId);
    const res = await this.prisma.taskDependency.deleteMany({
      where: { taskId, dependsOnId: depId },
    });
    this.gateway.server
      ?.to(this.gateway.taskRoom(taskId))
      .emit('task:dependency:remove', { taskId, depId });
    return { ok: true, removed: res.count };
  }

  async listDependencies(taskId: number) {
    return this.prisma.taskDependency.findMany({
      where: { taskId },
      include: { dependsOn: true },
    });
  }

  async listBlockedBy(taskId: number) {
    // Tasks that are blocking this task ("is blocked by")
    return this.prisma.taskDependency.findMany({
      where: { taskId },
      include: { dependsOn: true },
    });
  }

  // ───────────────────────────────
  // Comments
  // ───────────────────────────────
  async addComment(taskId: number, userId: number, dto: CreateCommentDto) {
    await this.findOne(taskId);
    const comment = await this.prisma.taskComment.create({
      data: { taskId, userId, content: dto.content },
    });
    const watchers = await this.prisma.taskWatcher.findMany({
      where: { taskId },
      select: { userId: true },
    });
    const assignee = await this.prisma.taskAssignment.findUnique({
      where: { taskId },
      select: { userId: true },
    });
    const recipients = new Set<number>(
      watchers.map((w) => w.userId).concat(assignee?.userId ?? []),
    );
    recipients.delete(userId);
    void this.notifications.notifyTaskComment(taskId, [...recipients], userId);
    void this.activity.log({
      taskId,
      userId,
      action: 'COMMENT_ADDED',
      newValue: dto.content,
    });
    this.gateway.server
      ?.to(this.gateway.taskRoom(taskId))
      .emit('task:comment', { taskId, comment });
    return comment;
  }

  async listComments(taskId: number) {
    return this.prisma.taskComment.findMany({
      where: { taskId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
      include: { user: true },
    });
  }

  async updateComment(
    commentId: string,
    user: { id: number; role: 'CLIENT' | 'EMPLOYEE' | 'ADMIN' },
    dto: UpdateCommentDto,
  ) {
    const existing = await this.prisma.taskComment.findUnique({
      where: { id: commentId },
    });
    if (!existing) throw new NotFoundException('Comment not found');
    if (user.role !== 'ADMIN' && existing.userId !== user.id) {
      throw new ForbiddenException('Not allowed');
    }
    const updated = await this.prisma.taskComment.update({
      where: { id: commentId },
      data: { content: dto.content ?? existing.content },
    });
    void this.activity.log({
      taskId: existing.taskId,
      userId: user.id,
      action: 'COMMENT_UPDATED',
    });
    return updated;
  }

  async deleteComment(
    commentId: string,
    user: { id: number; role: 'CLIENT' | 'EMPLOYEE' | 'ADMIN' },
  ) {
    const existing = await this.prisma.taskComment.findUnique({
      where: { id: commentId },
    });
    if (!existing) throw new NotFoundException('Comment not found');
    if (user.role !== 'ADMIN' && existing.userId !== user.id) {
      throw new ForbiddenException('Not allowed');
    }
    await this.prisma.taskComment.update({
      where: { id: commentId },
      data: { deletedAt: new Date() },
    });
    void this.activity.log({
      taskId: existing.taskId,
      userId: user.id,
      action: 'COMMENT_DELETED',
    });
    return { deleted: true };
  }

  // ───────────────────────────────
  // Workflow
  // ───────────────────────────────
  async availableTransitions(taskId: number) {
    const t = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: { status: true },
    });
    if (!t) throw new NotFoundException('Task not found');
    return this.workflow.allowedTransitions(t.status);
  }

  async transition(taskId: number, userId: number, dto: TransitionDto) {
    await this.ensureCanModify(taskId, userId);
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        dependencies: { include: { dependsOn: true } },
        watchers: true,
        assignment: true,
      },
    });
    if (!task) throw new NotFoundException('Task not found');
    this.workflow.assertTransition(task.status, dto.to);
    if (dto.to === TaskStatus.EN_COURS) {
      const incompleteDeps = task.dependencies.filter(
        (d) => d.dependsOn.status !== TaskStatus.TERMINE,
      );
      if (incompleteDeps.length > 0) {
        throw new BadRequestException(
          'All dependencies must be completed before starting',
        );
      }
    }
    const updated = await this.prisma.task.update({
      where: { id: taskId },
      data: { status: dto.to },
    });
    this.gateway.server
      ?.to(this.gateway.taskRoom(taskId))
      .emit('task:status', { taskId, from: task.status, to: dto.to });
    if (dto.to === TaskStatus.TERMINE) {
      void this.time.stopTimersForTask(taskId);
      // notify tasks that were blocked by this one
      const blocked = await this.prisma.taskDependency.findMany({
        where: { dependsOnId: taskId },
        include: { task: true },
      });
      const recipients = new Set<number>();
      for (const b of blocked) {
        const a = await this.prisma.taskAssignment.findUnique({
          where: { taskId: b.taskId },
          select: { userId: true },
        });
        if (a?.userId) recipients.add(a.userId);
      }
      if (recipients.size > 0) {
        void this.notifications.notifyTaskStatusChanged({
          taskId,
          from: String(task.status),
          to: String(dto.to),
          recipients: [...recipients],
          senderId: userId,
        });
      }
    }
    const watcherIds = task.watchers.map((w) => w.userId);
    const assigneeId = task.assignment?.userId;
    const recipients = new Set<number>(watcherIds.concat(assigneeId ?? []));
    recipients.delete(userId);
    void this.notifications.notifyTaskStatusChanged({
      taskId,
      from: String(task.status),
      to: String(dto.to),
      recipients: [...recipients],
      senderId: userId,
    });
    void this.activity.log({
      taskId,
      userId,
      action: 'STATUS_CHANGED',
      field: 'status',
      oldValue: task.status,
      newValue: dto.to,
    });
    return updated;
  }

  // ───────────────────────────────
  // Bulk
  // ───────────────────────────────
  async bulkAssign(dto: BulkAssignDto, senderId: number) {
    let count = 0;
    for (const taskId of dto.taskIds) {
      await this.assignTask(taskId, dto.userId, senderId);
      count++;
    }
    return { count };
  }

  async bulkStatus(dto: BulkStatusDto, senderId: number) {
    let count = 0;
    for (const taskId of dto.taskIds) {
      await this.transition(taskId, senderId, { to: dto.status });
      count++;
    }
    return { count };
  }

  async getActivity(taskId: number) {
    return this.prisma.taskActivity.findMany({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
    });
  }
}

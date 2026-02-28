import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationGateway } from '../notifications/notification.gateway';
import { Prisma } from '@prisma/client';

@Injectable()
export class TimeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  async getActiveTimer(userId: number) {
    return this.prisma.activeTimer.findUnique({ where: { userId } });
  }

  async startTimer(userId: number, taskId: number) {
    if (taskId) {
      const user = await this.prisma.utilisateur.findUnique({
        where: { id: userId },
        select: { role: true },
      });
      const isAdmin = user?.role === 'ADMIN';
      if (!isAdmin) {
        const assigned = await this.prisma.taskAssignment.findFirst({
          where: { taskId, userId },
        });
        if (!assigned) {
          throw new ForbiddenException('Not allowed to track time on this task');
        }
      }
    }
    const existing = await this.prisma.activeTimer.findUnique({
      where: { userId },
    });
    if (existing) {
      await this.stopTimer(userId); // auto-stop existing before starting new
    }
    await this.prisma.activeTimer.create({
      data: {
        userId,
        taskId,
        startTime: new Date(),
        lastPausedAt: null,
        totalPaused: 0,
      },
    });
    this.emitTimerState();
    return { started: true };
  }

  async pauseTimer(userId: number) {
    const timer = await this.prisma.activeTimer.findUnique({
      where: { userId },
    });
    if (!timer) throw new NotFoundException('No active timer');
    if (timer.lastPausedAt) return { paused: true }; // already paused
    await this.prisma.activeTimer.update({
      where: { userId },
      data: { lastPausedAt: new Date() },
    });
    this.emitTimerState();
    return { paused: true };
  }

  async resumeTimer(userId: number) {
    const timer = await this.prisma.activeTimer.findUnique({
      where: { userId },
    });
    if (!timer) throw new NotFoundException('No active timer');
    if (!timer.lastPausedAt) return { resumed: true }; // already running
    const pausedDelta = Math.max(
      0,
      Math.floor((Date.now() - new Date(timer.lastPausedAt).getTime()) / 1000),
    );
    await this.prisma.activeTimer.update({
      where: { userId },
      data: {
        lastPausedAt: null,
        totalPaused: timer.totalPaused + pausedDelta,
      },
    });
    this.emitTimerState();
    return { resumed: true };
  }

  async stopTimer(userId: number) {
    const timer = await this.prisma.activeTimer.findUnique({
      where: { userId },
    });
    if (!timer) throw new NotFoundException('No active timer');
    const now = new Date();
    let totalPaused = timer.totalPaused;
    if (timer.lastPausedAt) {
      totalPaused += Math.max(
        0,
        Math.floor(
          (now.getTime() - new Date(timer.lastPausedAt).getTime()) / 1000,
        ),
      );
    }
    const duration = Math.max(
      0,
      Math.floor((now.getTime() - new Date(timer.startTime).getTime()) / 1000) -
        totalPaused,
    );
    const entry = await this.prisma.timeEntry.create({
      data: {
        userId,
        taskId: timer.taskId,
        description: null,
        startTime: timer.startTime,
        endTime: now,
        duration,
        billable: true,
        billableRate: null,
      },
    });
    await this.prisma.activeTimer.delete({ where: { userId } });
    await this.upsertSummary(
      userId,
      entry.startTime,
      entry.taskId ?? null,
      duration,
    );
    this.notificationGateway.server
      .to(this.notificationGateway.userRoom(userId))
      .emit('notification:new', {
        type: 'SYSTEM',
        data: { kind: 'TIME_LOGGED', entryId: entry.id, seconds: duration },
      });
    this.emitTimerState();
    return entry;
  }

  async addManualEntry(
    userId: number,
    data: {
      taskId?: number;
      description?: string;
      startTime: Date;
      endTime: Date;
      billable?: boolean;
      billableRate?: number | null;
    },
  ) {
    if (data.taskId) {
      const user = await this.prisma.utilisateur.findUnique({
        where: { id: userId },
        select: { role: true },
      });
      const isAdmin = user?.role === 'ADMIN';
      if (!isAdmin) {
        const assigned = await this.prisma.taskAssignment.findFirst({
          where: { taskId: data.taskId, userId },
        });
        if (!assigned) {
          throw new ForbiddenException('Not allowed to track time on this task');
        }
      }
    }
    const { startTime, endTime } = data;
    const duration = Math.max(
      0,
      Math.floor((endTime.getTime() - startTime.getTime()) / 1000),
    );
    const entry = await this.prisma.timeEntry.create({
      data: {
        userId,
        taskId: data.taskId ?? null,
        description: data.description ?? null,
        startTime,
        endTime,
        duration,
        billable: data.billable ?? true,
        billableRate: data.billableRate ?? null,
      },
    });
    await this.upsertSummary(userId, startTime, data.taskId ?? null, duration);
    return entry;
  }

  async listEntries(params: {
    requesterId: number;
    requesterRole: 'CLIENT' | 'EMPLOYER' | 'ADMIN';
    userId?: number;
    taskId?: number;
    marketingProjectId?: number;
    from?: Date;
    to?: Date;
  }) {
    const {
      requesterId,
      requesterRole,
      userId,
      taskId,
      marketingProjectId,
      from,
      to,
    } = params;
    if (requesterRole !== 'ADMIN' && requesterId !== (userId ?? requesterId)) {
      throw new ForbiddenException('Not allowed');
    }
    return this.prisma.timeEntry.findMany({
      where: {
        userId: userId ?? requesterId,
        ...(taskId ? { taskId } : {}),
        ...(marketingProjectId ? { task: { marketingProjectId } } : {}),
        ...(from || to
          ? {
              startTime: {
                ...(from ? { gte: from } : {}),
                ...(to ? { lte: to } : {}),
              },
            }
          : {}),
      },
      orderBy: { startTime: 'desc' },
    });
  }

  async updateEntry(
    entryId: string,
    user: { id: number; role: 'CLIENT' | 'EMPLOYER' | 'ADMIN' },
    data: Partial<{
      description: string;
      startTime: Date;
      endTime: Date;
      billable: boolean;
      billableRate: number | null;
    }>,
  ) {
    const existing = await this.prisma.timeEntry.findUnique({
      where: { id: entryId },
    });
    if (!existing) throw new NotFoundException('Entry not found');
    if (user.role !== 'ADMIN' && existing.userId !== user.id)
      throw new ForbiddenException('Not allowed');
    const updated = await this.prisma.timeEntry.update({
      where: { id: entryId },
      data,
    });
    if (updated.startTime && updated.endTime) {
      const duration = Math.max(
        0,
        Math.floor(
          (new Date(updated.endTime).getTime() -
            new Date(updated.startTime).getTime()) /
            1000,
        ),
      );
      await this.prisma.timeEntry.update({
        where: { id: entryId },
        data: { duration },
      });
      await this.upsertSummary(
        updated.userId,
        updated.startTime,
        updated.taskId ?? null,
        duration,
        true,
      );
    }
    return updated;
  }

  async deleteEntry(
    entryId: string,
    user: { id: number; role: 'CLIENT' | 'EMPLOYER' | 'ADMIN' },
  ) {
    const existing = await this.prisma.timeEntry.findUnique({
      where: { id: entryId },
    });
    if (!existing) throw new NotFoundException('Entry not found');
    if (user.role !== 'ADMIN' && existing.userId !== user.id)
      throw new ForbiddenException('Not allowed');
    await this.prisma.timeEntry.delete({ where: { id: entryId } });
    // Summary recompute can be added later
    return { deleted: true };
  }

  async reportTotals(params: {
    userId?: number;
    marketingProjectId?: number;
    from?: Date;
    to?: Date;
  }) {
    const { userId, marketingProjectId, from, to } = params;
    const entries = await this.prisma.timeEntry.findMany({
      where: {
        ...(userId ? { userId } : {}),
        ...(marketingProjectId ? { task: { marketingProjectId } } : {}),
        ...(from || to
          ? {
              startTime: {
                ...(from ? { gte: from } : {}),
                ...(to ? { lte: to } : {}),
              },
            }
          : {}),
      },
      select: { duration: true, taskId: true },
    });
    const total = entries.reduce((acc, e) => acc + (e.duration ?? 0), 0);
    const byTask: Record<string, number> = {};
    for (const e of entries) {
      const key = String(e.taskId ?? 'no-task');
      byTask[key] = (byTask[key] ?? 0) + (e.duration ?? 0);
    }
    return { totalSeconds: total, byTask };
  }

  private async upsertSummary(
    userId: number,
    when: Date,
    taskId: number | null,
    seconds: number,
    replace = false,
  ) {
    const dateOnly = new Date(
      Date.UTC(when.getUTCFullYear(), when.getUTCMonth(), when.getUTCDate()),
    );
    const existing = await this.prisma.timeSummary.findUnique({
      where: { userId_date: { userId, date: dateOnly } },
    });
    if (!existing) {
      const tb: Record<string, number> =
        taskId !== null ? { [String(taskId)]: seconds } : {};
      await this.prisma.timeSummary.create({
        data: {
          userId,
          date: dateOnly,
          totalSeconds: seconds,
          taskBreakdown: tb as unknown as Prisma.InputJsonValue,
        },
      });
    } else {
      const raw = (existing.taskBreakdown ?? {}) as Prisma.JsonObject | null;
      const tb: Record<string, number> = {};
      if (raw) {
        for (const [k, v] of Object.entries(raw)) {
          if (typeof v === 'number') tb[k] = v;
        }
      }
      if (taskId !== null) {
        const key = String(taskId);
        const current = tb[key] ?? 0;
        tb[key] = replace ? seconds : current + seconds;
      }
      await this.prisma.timeSummary.update({
        where: { id: existing.id },
        data: {
          totalSeconds: replace ? seconds : existing.totalSeconds + seconds,
          taskBreakdown: tb as unknown as Prisma.InputJsonValue,
        },
      });
    }
  }

  emitTimerState(): void {
    return;
  }

  async stopTimersForTask(taskId: number) {
    const timers = await this.prisma.activeTimer.findMany({
      where: { taskId },
    });
    for (const t of timers) {
      try {
        await this.stopTimer(t.userId);
      } catch {
        // ignore failures to stop
      }
    }
  }
}

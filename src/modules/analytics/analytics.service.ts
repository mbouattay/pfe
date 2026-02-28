import { Injectable } from '@nestjs/common';
import { Prisma, TaskPriority, TaskStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

type Period = 'today' | 'week' | 'month' | 'custom';

function rangeFor(period: Period, from?: string, to?: string) {
  const now = new Date();
  let start: Date;
  let end: Date;
  if (period === 'today') {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  } else if (period === 'week') {
    const day = now.getDay();
    const diff = (day + 6) % 7;
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff);
    end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  } else if (period === 'month') {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  } else {
    start = from ? new Date(from) : new Date(now.getFullYear(), now.getMonth(), 1);
    end = to ? new Date(to) : now;
  }
  return { start, end };
}

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async dashboardSummary(params: {
    period: Period;
    fromDate?: string;
    toDate?: string;
  }) {
    const { start, end } = rangeFor(params.period, params.fromDate, params.toDate);

    const tasksTotal = await this.prisma.task.count({
      where: { dateDebut: { gte: start, lt: end } },
    });
    const tasksCompleted = await this.prisma.task.count({
      where: { status: TaskStatus.TERMINE, dateDebut: { gte: start, lt: end } },
    });
    const tasksPending = tasksTotal - tasksCompleted;
    const now = new Date();
    const overdueList = await this.prisma.task.findMany({
      where: { status: { not: TaskStatus.TERMINE }, dateFin: { lt: now } },
      select: {
        id: true,
        titre: true,
        dateFin: true,
        priority: true,
        assignment: { select: { userId: true } },
      },
      orderBy: { dateFin: 'asc' },
      take: 20,
    });
    const overdueCount = await this.prisma.task.count({
      where: { status: { not: TaskStatus.TERMINE }, dateFin: { lt: now } },
    });

    const byStatus = await this.prisma.task.groupBy({
      by: ['status'],
      _count: { _all: true },
    });
    const byPriority = await this.prisma.task.groupBy({
      by: ['priority'],
      _count: { _all: true },
    });

    const completedActivities = await this.prisma.taskActivity.findMany({
      where: {
        action: 'STATUS_CHANGED',
        field: 'status',
        newValue: String(TaskStatus.TERMINE),
        createdAt: { gte: start, lt: end },
      },
      select: { taskId: true, createdAt: true },
    });
    const taskStarts = await this.prisma.task.findMany({
      where: { id: { in: [...new Set(completedActivities.map((a) => a.taskId))] } },
      select: { id: true, dateDebut: true },
    });
    const startMap = new Map(taskStarts.map((t) => [t.id, t.dateDebut]));
    const durations: number[] = [];
    for (const a of completedActivities) {
      const s = startMap.get(a.taskId);
      if (s) {
        const d = Math.max(0, Math.floor((a.createdAt.getTime() - s.getTime()) / 1000));
        durations.push(d);
      }
    }
    const avgSeconds =
      durations.length > 0
        ? Math.floor(durations.reduce((acc, v) => acc + v, 0) / durations.length)
        : 0;

    const timeToday = await this.sumTimeRange(
      new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()),
      new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 1),
    );
    const beginningOfWeek = (() => {
      const d = new Date();
      const w = (d.getDay() + 6) % 7;
      return new Date(d.getFullYear(), d.getMonth(), d.getDate() - w);
    })();
    const timeWeek = await this.sumTimeRange(beginningOfWeek, new Date());
    const timeMonth = await this.sumTimeRange(
      new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      new Date(),
    );

    const activeMarketingProjects = await this.prisma.marketingProject.findMany({
      where: { tasks: { some: { status: { not: TaskStatus.TERMINE } } } },
      select: { projectId: true },
    });
    const activeWebProjects = await this.prisma.webProject.findMany({
      where: { sprints: { some: { sprintTasks: { some: { status: { not: TaskStatus.TERMINE } } } } } },
      select: { projectId: true },
    });
    const activeProjectIds = new Set<number>([
      ...activeMarketingProjects.map((p) => p.projectId),
      ...activeWebProjects.map((p) => p.projectId),
    ]);

    const teamMembers = await this.prisma.utilisateur.count({
      where: { role: { in: ['EMPLOYER', 'ADMIN'] } },
    });

    const recentTasks = await this.prisma.task.findMany({
      orderBy: { dateDebut: 'desc' },
      take: 5,
      select: { id: true, titre: true, status: true, priority: true, dateDebut: true },
    });
    const recentComments = await this.prisma.taskComment.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, taskId: true, userId: true, createdAt: true },
    });
    const recentFiles = await this.prisma.file.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, filename: true, mimeType: true, size: true, createdAt: true, taskId: true, messageId: true },
    });

    const assignedCounts = await this.prisma.taskAssignment.groupBy({
      by: ['userId'],
      _count: { _all: true },
    });

    return {
      period: params.period,
      from: start.toISOString(),
      to: end.toISOString(),
      tasks: {
        total: tasksTotal,
        completed: tasksCompleted,
        pending: tasksPending,
        overdue: { count: overdueCount, list: overdueList },
        byStatus: byStatus.map((g) => ({ status: g.status, count: g._count._all })),
        byPriority: byPriority.map((g) => ({ priority: g.priority as TaskPriority, count: g._count._all })),
        completionRate: tasksTotal > 0 ? Math.round((tasksCompleted / tasksTotal) * 100) : 0,
        avgCompletionSeconds: avgSeconds,
      },
      time: {
        todaySeconds: timeToday,
        weekSeconds: timeWeek,
        monthSeconds: timeMonth,
      },
      organization: {
        activeProjects: activeProjectIds.size,
        teamMembers,
      },
      recent: {
        tasks: recentTasks,
        comments: recentComments,
        files: recentFiles,
      },
      assignments: assignedCounts.map((g) => ({ userId: g.userId, tasks: g._count._all })),
    };
  }

  private async sumTimeRange(from: Date, to: Date) {
    const entries = await this.prisma.timeEntry.findMany({
      where: { startTime: { gte: from, lt: to } },
      select: { duration: true },
    });
    return entries.reduce((acc, e) => acc + (e.duration ?? 0), 0);
  }
}


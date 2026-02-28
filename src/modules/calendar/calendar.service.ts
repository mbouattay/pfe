import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TaskPriority, TaskStatus } from '@prisma/client';

type TaskType = 'marketing' | 'web' | 'all';

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  allDay: boolean;
  type: 'task' | 'sprintTask';
  taskType: 'marketing' | 'web';
  status: TaskStatus;
  priority: TaskPriority | null;
  assigneeId?: number;
  assigneeName?: string;
  projectId: number;
  projectName: string;
  description?: string | null;
  overdue: boolean;
  color: string;
  url: string;
}

function colorForPriority(p?: TaskPriority | null): string {
  switch (p) {
    case 'LOW':
      return '#6c757d';
    case 'MEDIUM':
      return '#0d6efd';
    case 'HIGH':
      return '#fd7e14';
    case 'URGENT':
      return '#dc3545';
    default:
      return '#0d6efd';
  }
}

@Injectable()
export class CalendarService {
  constructor(private readonly prisma: PrismaService) {}

  private async isAdmin(userId?: number) {
    if (!userId) return false;
    const u = await this.prisma.utilisateur.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    return u?.role === 'ADMIN';
  }

  private parseDate(d: string | undefined, name: string): Date {
    if (!d) throw new BadRequestException(`${name} is required`);
    const dt = new Date(d);
    if (isNaN(dt.getTime())) throw new BadRequestException(`${name} invalid`);
    return dt;
  }

  async getEvents(params: {
    startDate: string;
    endDate: string;
    projectId?: string;
    assigneeId?: number;
    status?: TaskStatus;
    priority?: TaskPriority;
    type?: TaskType;
  }, viewerId?: number): Promise<{ events: CalendarEvent[]; meta: { total: number; startDate: string; endDate: string } }> {
    const start = this.parseDate(params.startDate, 'startDate');
    const end = this.parseDate(params.endDate, 'endDate');
    const type: TaskType = params.type ?? 'all';
    const events: CalendarEvent[] = [];
    const now = new Date();
    const admin = await this.isAdmin(viewerId);

    if (type === 'all' || type === 'marketing') {
      const whereTask: any = {
        dateDebut: { lte: end },
        dateFin: { gte: start },
      };
      if (params.status) whereTask.status = params.status;
      if (params.priority) whereTask.priority = params.priority;
      if (params.projectId) {
        const pid = Number(params.projectId);
        if (!isNaN(pid)) {
          whereTask.marketingProject = { projectId: pid };
        }
      }
      if (params.assigneeId) {
        whereTask.assignment = { userId: params.assigneeId };
      }
      const tasks = await this.prisma.task.findMany({
        where: whereTask,
        include: {
          marketingProject: { include: { project: true } },
          assignment: { include: { user: true } },
        },
      });
      for (const t of tasks) {
        const assigneeName =
          t.assignment?.user?.email ?? (t.assignment?.userId ? `#${t.assignment.userId}` : undefined);
        events.push({
          id: `task:${t.id}`,
          title: t.titre,
          start: t.dateDebut.toISOString(),
          end: t.dateFin?.toISOString(),
          allDay: true,
          type: 'task',
          taskType: 'marketing',
          status: t.status,
          priority: t.priority,
          assigneeId: t.assignment?.userId ?? undefined,
          assigneeName,
          projectId: t.marketingProject.project.id,
          projectName: t.marketingProject.project.titre,
          description: null,
          overdue: t.status !== 'TERMINE' && t.dateFin < now,
          color: colorForPriority(t.priority),
          url: `/tasks/${t.id}`,
        });
      }
    }

    if (type === 'all' || type === 'web') {
      const whereSprintTask: any = {
        dateDebut: { gte: start, lte: end },
      };
      if (params.status) whereSprintTask.status = params.status;
      if (params.projectId) {
        const pid = Number(params.projectId);
        if (!isNaN(pid)) {
          whereSprintTask.sprint = { webProject: { projectId: pid } };
        }
      }
      if (!admin && viewerId) {
        whereSprintTask.sprint = {
          ...(whereSprintTask.sprint ?? {}),
          participants: { some: { userId: viewerId } },
        };
      }
      const stasks = await this.prisma.sprintTask.findMany({
        where: whereSprintTask,
        include: {
          sprint: { include: { webProject: { include: { project: true } } } },
        },
      });
      for (const st of stasks) {
        events.push({
          id: `sprintTask:${st.id}`,
          title: st.titre,
          start: st.dateDebut.toISOString(),
          end: undefined,
          allDay: true,
          type: 'sprintTask',
          taskType: 'web',
          status: st.status,
          priority: null,
          projectId: st.sprint.webProject.project.id,
          projectName: st.sprint.webProject.project.titre,
          description: null,
          overdue: st.status !== 'TERMINE' && st.dateDebut < now,
          color: colorForPriority(null),
          url: `/sprint-tasks/${st.id}`,
        });
      }
    }

    return { events, meta: { total: events.length, startDate: start.toISOString(), endDate: end.toISOString() } };
  }

  async getUpcoming(days = 7, includeOverdue = true, viewerId?: number) {
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const inNDays = new Date(now.getFullYear(), now.getMonth(), now.getDate() + days);
    const admin = await this.isAdmin(viewerId);

    const rangeTasks = await this.prisma.task.findMany({
      where: { dateFin: { gte: includeOverdue ? undefined : now, lte: inNDays } },
      include: {
        marketingProject: { include: { project: true } },
        assignment: { include: { user: true } },
      },
    });
    const sprintWhere: any = { dateDebut: { lte: inNDays } };
    if (!admin && viewerId) {
      sprintWhere.sprint = { participants: { some: { userId: viewerId } } };
    }
    const sprintRange = await this.prisma.sprintTask.findMany({
      where: sprintWhere,
      include: { sprint: { include: { webProject: { include: { project: true } } } } },
    });

    const toEvent = (t: any): CalendarEvent => ({
      id: `task:${t.id}`,
      title: t.titre,
      start: t.dateDebut.toISOString(),
      end: t.dateFin?.toISOString(),
      allDay: true,
      type: 'task',
      taskType: 'marketing',
      status: t.status,
      priority: t.priority,
      assigneeId: t.assignment?.userId ?? undefined,
      assigneeName: t.assignment?.user?.email,
      projectId: t.marketingProject.project.id,
      projectName: t.marketingProject.project.titre,
      description: null,
      overdue: t.status !== 'TERMINE' && t.dateFin < now,
      color: colorForPriority(t.priority),
      url: `/tasks/${t.id}`,
    });
    const toEventST = (st: any): CalendarEvent => ({
      id: `sprintTask:${st.id}`,
      title: st.titre,
      start: st.dateDebut.toISOString(),
      allDay: true,
      type: 'sprintTask',
      taskType: 'web',
      status: st.status,
      priority: null,
      projectId: st.sprint.webProject.project.id,
      projectName: st.sprint.webProject.project.titre,
      description: null,
      overdue: st.status !== 'TERMINE' && st.dateDebut < now,
      color: colorForPriority(null),
      url: `/sprint-tasks/${st.id}`,
    });

    const eventsTasks = rangeTasks.map(toEvent);
    const eventsST = sprintRange.map(toEventST);
    const all = [...eventsTasks, ...eventsST];

    const isSameDay = (d: Date, ref: Date) =>
      d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth() && d.getDate() === ref.getDate();

    const today = all.filter((e) => isSameDay(new Date(e.end ?? e.start), now));
    const tmr = all.filter((e) => isSameDay(new Date(e.end ?? e.start), tomorrow));
    const thisWeek = all.filter((e) => {
      const dt = new Date(e.end ?? e.start);
      return dt >= now && dt < inNDays;
    });
    const nextWeekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7);
    const nextWeekEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 14);
    const nextWeek = all.filter((e) => {
      const dt = new Date(e.end ?? e.start);
      return dt >= nextWeekStart && dt < nextWeekEnd;
    });
    const overdue = includeOverdue ? all.filter((e) => e.overdue) : [];
    const noDeadline = eventsTasks.filter((e) => !e.end);

    return { today, tomorrow: tmr, thisWeek, nextWeek, overdue, noDeadline };
  }

  async getDay(date: string, viewerId?: number) {
    const d = this.parseDate(date, 'date');
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
    return this.getEvents({
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      type: 'all',
    }, viewerId);
  }

  async exportIcs(fromDate?: string, toDate?: string, viewerId?: number) {
    const now = new Date();
    const from = fromDate ? new Date(fromDate) : new Date(now.getFullYear(), now.getMonth(), 1);
    const to = toDate ? new Date(toDate) : new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const data = await this.getEvents({
      startDate: from.toISOString(),
      endDate: to.toISOString(),
      type: 'all',
    }, viewerId);
    const toYMD = (d: Date) =>
      `${d.getFullYear().toString().padStart(4, '0')}${(d.getMonth() + 1).toString().padStart(2, '0')}${d
        .getDate()
        .toString()
        .padStart(2, '0')}`;
    const lines: string[] = [];
    lines.push('BEGIN:VCALENDAR');
    lines.push('VERSION:2.0');
    lines.push('PRODID:-//Duality//Calendar//EN');
    for (const e of data.events) {
      const s = new Date(e.start);
      const eend = e.end ? new Date(e.end) : s;
      lines.push('BEGIN:VEVENT');
      lines.push(`UID:${e.id}@duality`);
      lines.push(`SUMMARY:${e.title.replace(/\n/g, ' ')}`);
      lines.push(`DTSTART;VALUE=DATE:${toYMD(s)}`);
      lines.push(`DTEND;VALUE=DATE:${toYMD(new Date(eend.getFullYear(), eend.getMonth(), eend.getDate() + 1))}`);
      lines.push(`DESCRIPTION:${(e.description ?? '').toString().replace(/\n/g, ' ')}`);
      lines.push('END:VEVENT');
    }
    lines.push('END:VCALENDAR');
    return lines.join('\r\n');
  }

  async getFilters() {
    const marketingProjects = await this.prisma.project.findMany({
      where: { marketingProject: { isNot: null } },
      select: { id: true, titre: true },
      orderBy: { titre: 'asc' },
    });
    const webProjects = await this.prisma.project.findMany({
      where: { webProject: { isNot: null } },
      select: { id: true, titre: true },
      orderBy: { titre: 'asc' },
    });
    const assignees = await this.prisma.taskAssignment.findMany({
      select: { userId: true, user: { select: { email: true } } },
      distinct: ['userId'],
      orderBy: { userId: 'asc' },
    });
    return {
      projects: [
        ...marketingProjects.map((p) => ({ id: p.id, name: p.titre, type: 'marketing' as const })),
        ...webProjects.map((p) => ({ id: p.id, name: p.titre, type: 'web' as const })),
      ],
      assignees: assignees.map((a) => ({ id: a.userId, name: a.user?.email ?? `#${a.userId}` })),
      statuses: Object.values(TaskStatus),
      priorities: Object.values(TaskPriority),
    };
  }

  async rescheduleTask(taskId: number, newDate: string) {
    const date = this.parseDate(newDate, 'newDate');
    const existing = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!existing) throw new NotFoundException('Task not found');
    const updated = await this.prisma.task.update({
      where: { id: taskId },
      data: { dateFin: date },
      select: { id: true, titre: true, dateDebut: true, dateFin: true, status: true, priority: true },
    });
    return updated;
  }

  async rescheduleSprintTask(sprintTaskId: number, newDate: string) {
    const date = this.parseDate(newDate, 'newDate');
    const existing = await this.prisma.sprintTask.findUnique({ where: { id: sprintTaskId } });
    if (!existing) throw new NotFoundException('Sprint task not found');
    const updated = await this.prisma.sprintTask.update({
      where: { id: sprintTaskId },
      data: { dateDebut: date },
      select: { id: true, titre: true, dateDebut: true, status: true },
    });
    return updated;
  }
}

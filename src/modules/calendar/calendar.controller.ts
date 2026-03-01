import {
  BadRequestException,
  Controller,
  Get,
  Header,
  Param,
  Patch,
  Query,
  Body,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { TaskPriority, TaskStatus } from '@prisma/client';

@Controller('calendar')
export class CalendarController {
  constructor(private readonly calendar: CalendarService) {}

  @Get('events')
  async events(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('projectId') projectId?: string,
    @Query('assigneeId') assigneeId?: string,
    @Query('status') status?: TaskStatus,
    @Query('priority') priority?: TaskPriority,
    @Query('type') type?: 'marketing' | 'web' | 'all',
    @Req() req?: { user?: { sub?: number } },
  ) {
    const aid = assigneeId ? Number(assigneeId) : undefined;
    return this.calendar.getEvents(
      {
        startDate,
        endDate,
        projectId,
        assigneeId: aid,
        status,
        priority,
        type,
      },
      req?.user?.sub,
    );
  }

  @Get('upcoming')
  async upcoming(
    @Query('days') days?: string,
    @Query('includeOverdue') includeOverdue?: string,
    @Req() req?: { user?: { id?: number; sub?: number } },
  ) {
    const d = days ? Number(days) : 7;
    const inc = includeOverdue !== 'false';
    return this.calendar.getUpcoming(d, inc, req?.user?.sub);
  }

  @Get('day/:date')
  async day(
    @Param('date') date: string,
    @Req() req: { user?: { sub?: number } },
  ) {
    return this.calendar.getDay(date, req.user?.sub);
  }

  @Get('export/ics')
  @Header('Content-Type', 'text/calendar; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="calendar.ics"')
  async exportIcs(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Req() req?: { user?: { sub?: number } },
  ) {
    return this.calendar.exportIcs(fromDate, toDate, req?.user?.sub);
  }

  @Get('filters')
  async filters() {
    return this.calendar.getFilters();
  }

  @Patch('tasks/:id/reschedule')
  async rescheduleTask(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { newDate?: string },
  ) {
    if (!body?.newDate) throw new BadRequestException('newDate is required');
    return this.calendar.rescheduleTask(id, body.newDate);
  }

  @Patch('sprint-tasks/:id/reschedule')
  async rescheduleSprintTask(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { newDate?: string },
  ) {
    if (!body?.newDate) throw new BadRequestException('newDate is required');
    return this.calendar.rescheduleSprintTask(id, body.newDate);
  }
}

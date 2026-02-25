import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { TimeService } from './time.service';
import {
  ManualEntryDto,
  QueryEntriesDto,
  StartTimerDto,
  UpdateEntryDto,
} from './dto/time.dto';

type AuthedReq = {
  user: { id: number; role: 'CLIENT' | 'EMPLOYER' | 'ADMIN' };
};

@Controller('time')
export class TimeController {
  constructor(private readonly time: TimeService) {}

  @Get('active')
  active(@Req() req: AuthedReq) {
    return this.time.getActiveTimer(req.user.id);
  }

  @Post('start')
  start(@Req() req: AuthedReq, @Body() dto: StartTimerDto) {
    return this.time.startTimer(req.user.id, dto.taskId);
  }

  @Post('pause')
  pause(@Req() req: AuthedReq) {
    return this.time.pauseTimer(req.user.id);
  }

  @Post('resume')
  resume(@Req() req: AuthedReq) {
    return this.time.resumeTimer(req.user.id);
  }

  @Post('stop')
  stop(@Req() req: AuthedReq) {
    return this.time.stopTimer(req.user.id);
  }

  @Post('manual')
  manual(@Req() req: AuthedReq, @Body() dto: ManualEntryDto) {
    return this.time.addManualEntry(req.user.id, {
      taskId: dto.taskId,
      description: dto.description,
      startTime: new Date(dto.startTime),
      endTime: new Date(dto.endTime),
      billable: dto.billable,
      billableRate: dto.billableRate ?? null,
    });
  }

  @Get('entries')
  entries(@Req() req: AuthedReq, @Query() q: QueryEntriesDto) {
    return this.time.listEntries({
      requesterId: req.user.id,
      requesterRole: req.user.role,
      userId: q.userId,
      taskId: q.taskId,
      marketingProjectId: q.marketingProjectId,
      from: q.from ? new Date(q.from) : undefined,
      to: q.to ? new Date(q.to) : undefined,
    });
  }

  @Patch('entries/:id')
  update(
    @Req() req: AuthedReq,
    @Param('id') id: string,
    @Body() dto: UpdateEntryDto,
  ) {
    return this.time.updateEntry(id, req.user, {
      description: dto.description,
      startTime: dto.startTime ? new Date(dto.startTime) : undefined,
      endTime: dto.endTime ? new Date(dto.endTime) : undefined,
      billable: dto.billable,
      billableRate: dto.billableRate,
    });
  }

  @Delete('entries/:id')
  remove(@Req() req: AuthedReq, @Param('id') id: string) {
    return this.time.deleteEntry(id, req.user);
  }

  @Get('reports/summary')
  summary(
    @Query('userId') userId?: string,
    @Query('marketingProjectId') marketingProjectId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.time.reportTotals({
      userId: userId ? Number(userId) : undefined,
      marketingProjectId: marketingProjectId
        ? Number(marketingProjectId)
        : undefined,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }
}

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
} from '@nestjs/common';
import { SprintParticipantsService } from './sprint-participants.service';

@Controller('sprints')
export class SprintParticipantsController {
  constructor(private readonly service: SprintParticipantsService) {}

  @Post(':sprintId/participants/:userId')
  add(
    @Param('sprintId', ParseIntPipe) sprintId: number,
    @Param('userId', ParseIntPipe) userId: number,
    @Body() body: { role?: string },
    @Req() req: { user?: { sub?: number } },
  ) {
    return this.service.addParticipant(
      sprintId,
      userId,
      body?.role,
      req.user?.sub,
    );
  }

  @Delete(':sprintId/participants/:userId')
  remove(
    @Param('sprintId', ParseIntPipe) sprintId: number,
    @Param('userId', ParseIntPipe) userId: number,
    @Req() req: { user?: { sub?: number } },
  ) {
    return this.service.removeParticipant(sprintId, userId, req.user?.sub);
  }

  @Get(':sprintId/participants')
  list(@Param('sprintId', ParseIntPipe) sprintId: number) {
    return this.service.listParticipants(sprintId);
  }

  @Get('participants/user/:userId')
  listForUser(@Param('userId', ParseIntPipe) userId: number) {
    return this.service.listSprintsForUser(userId);
  }
}

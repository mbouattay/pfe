import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { SprintTaskService } from './sprintTask.service';
import { CreateSprintTaskDto, UpdateSprintTaskDto } from './sprintTask.dto';

@Controller('sprint-tasks')
export class SprintTaskController {
  constructor(private readonly sprintTaskService: SprintTaskService) {}

  @Post()
  create(@Body() dto: CreateSprintTaskDto) {
    return this.sprintTaskService.create(dto);
  }

  @Get()
  findAll() {
    return this.sprintTaskService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.sprintTaskService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSprintTaskDto,
  ) {
    return this.sprintTaskService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.sprintTaskService.remove(id);
  }

  // Comments
  @Post(':id/comments')
  addComment(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: { user: { id?: number; sub?: number } },
    @Body() dto: import('../task/dto/comment.dto').CreateCommentDto,
  ) {
    const uid = req.user.id ?? req.user.sub!;
    return this.sprintTaskService.addComment(id, uid, dto);
  }

  @Get(':id/comments')
  listComments(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: { user: { id?: number; sub?: number } },
  ) {
    const uid = req.user.id ?? req.user.sub!;
    return this.sprintTaskService.listComments(id, uid);
  }

  @Patch('comments/:id')
  updateComment(
    @Param('id') commentId: string,
    @Req() req: { user: { id: number; role: 'CLIENT' | 'EMPLOYER' | 'ADMIN' } },
    @Body() dto: import('../task/dto/comment.dto').UpdateCommentDto,
  ) {
    return this.sprintTaskService.updateComment(commentId, req.user, dto);
  }

  @Delete('comments/:id')
  deleteComment(
    @Param('id') commentId: string,
    @Req() req: { user: { id: number; role: 'CLIENT' | 'EMPLOYER' | 'ADMIN' } },
  ) {
    return this.sprintTaskService.deleteComment(commentId, req.user);
  }

  @Get(':id/ai-metadata')
  aiMetadata(
    @Req() req: { user?: { id?: number; sub?: number } },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.sprintTaskService.getAiMetadata(
      id,
      req.user?.sub ?? req.user?.id,
    );
  }
}

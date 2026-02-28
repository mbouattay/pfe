import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { TaskService } from './task.service';
import { CreateTaskDto, UpdateTaskDto } from './task.dto';
import { TaskFiltersDto } from './dto/filters.dto';
import { AddDependencyDto } from './dto/dependency.dto';
import { CreateCommentDto, UpdateCommentDto } from './dto/comment.dto';
import { TransitionDto } from './dto/transition.dto';
import { BulkAssignDto, BulkStatusDto } from './dto/bulk.dto';

@Controller('tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateTaskDto) {
    return this.taskService.create(dto, req.user.sub);
  }

  @Get()
  findAll(@Query() filters: TaskFiltersDto) {
    return this.taskService.findAll(filters);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.taskService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.taskService.update(id, dto, req.user.sub);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.taskService.remove(id);
  }

  // Assignments
  @Post(':id/assign/:userId')
  assign(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
    @Req() req: any,
  ) {
    return this.taskService.assignTask(id, userId, req.user.sub);
  }

  @Delete(':id/assign')
  unassign(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.taskService.unassignTask(id, req.user.sub);
  }

  @Get('assigned/me')
  assignedMe(@Req() req: any) {
    return this.taskService.getAssignedToUser(req.user.sub);
  }

  // Watchers
  @Post(':id/watch')
  watch(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.taskService.watchTask(id, req.user.sub);
  }

  @Delete(':id/unwatch')
  unwatch(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.taskService.unwatchTask(id, req.user.sub);
  }

  @Get(':id/watchers')
  watchers(@Param('id', ParseIntPipe) id: number) {
    return this.taskService.listWatchers(id);
  }

  // Dependencies
  @Post(':id/dependencies')
  addDep(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
    @Body() dto: AddDependencyDto,
  ) {
    return this.taskService.addDependency(id, dto, req.user.sub);
  }

  @Delete(':id/dependencies/:depId')
  removeDep(
    @Param('id', ParseIntPipe) id: number,
    @Param('depId', ParseIntPipe) depId: number,
    @Req() req: any,
  ) {
    return this.taskService.removeDependency(id, depId, req.user.sub);
  }

  @Get(':id/dependencies')
  listDeps(@Param('id', ParseIntPipe) id: number) {
    return this.taskService.listDependencies(id);
  }

  @Get(':id/blocked-by')
  blockedBy(@Param('id', ParseIntPipe) id: number) {
    return this.taskService.listBlockedBy(id);
  }

  // Comments
  @Post(':id/comments')
  addComment(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
    @Body() dto: CreateCommentDto,
  ) {
    return this.taskService.addComment(id, req.user.sub, dto);
  }

  @Get(':id/comments')
  listComments(@Param('id', ParseIntPipe) id: number) {
    return this.taskService.listComments(id);
  }

  @Patch('comments/:id')
  updateComment(
    @Param('id') commentId: string,
    @Req() req: any,
    @Body() dto: UpdateCommentDto,
  ) {
    return this.taskService.updateComment(commentId, req.user, dto);
  }

  @Delete('comments/:id')
  deleteComment(@Param('id') commentId: string, @Req() req: any) {
    return this.taskService.deleteComment(commentId, req.user);
  }

  // Workflow
  @Get(':id/available-transitions')
  available(@Param('id', ParseIntPipe) id: number) {
    return this.taskService.availableTransitions(id);
  }

  @Post(':id/transition')
  transition(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
    @Body() dto: TransitionDto,
  ) {
    return this.taskService.transition(id, req.user.sub, dto);
  }

  // Activity
  @Get(':id/activity')
  activity(@Param('id', ParseIntPipe) id: number) {
    return this.taskService.getActivity(id);
  }

  // Bulk operations
  @Post('bulk/assign')
  bulkAssign(@Req() req: any, @Body() dto: BulkAssignDto) {
    return this.taskService.bulkAssign(dto, req.user.sub);
  }

  @Post('bulk/status')
  bulkStatus(@Req() req: any, @Body() dto: BulkStatusDto) {
    return this.taskService.bulkStatus(dto, req.user.sub);
  }
}

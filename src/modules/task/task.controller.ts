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

type AuthedReq = { user: { id?: number; sub?: number } };

@Controller('tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  create(@Req() req: AuthedReq, @Body() dto: CreateTaskDto) {
    const uid = req.user.id ?? req.user.sub!;
    return this.taskService.create(dto, uid);
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
    @Req() req: AuthedReq,
    @Body() dto: UpdateTaskDto,
  ) {
    const uid = req.user.id ?? req.user.sub!;
    return this.taskService.update(id, dto, uid);
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
    @Req() req: AuthedReq,
  ) {
    const uid = req.user.id ?? req.user.sub!;
    return this.taskService.assignTask(id, userId, uid);
  }

  @Delete(':id/assign')
  unassign(@Param('id', ParseIntPipe) id: number, @Req() req: AuthedReq) {
    const uid = req.user.id ?? req.user.sub!;
    return this.taskService.unassignTask(id, uid);
  }

  @Get('assigned/me')
  assignedMe(@Req() req: AuthedReq) {
    const uid = req.user.id ?? req.user.sub!;
    return this.taskService.getAssignedToUser(uid);
  }

  // Watchers
  @Post(':id/watch')
  watch(@Param('id', ParseIntPipe) id: number, @Req() req: AuthedReq) {
    const uid = req.user.id ?? req.user.sub!;
    return this.taskService.watchTask(id, uid);
  }

  @Delete(':id/unwatch')
  unwatch(@Param('id', ParseIntPipe) id: number, @Req() req: AuthedReq) {
    const uid = req.user.id ?? req.user.sub!;
    return this.taskService.unwatchTask(id, uid);
  }

  @Get(':id/watchers')
  watchers(@Param('id', ParseIntPipe) id: number) {
    return this.taskService.listWatchers(id);
  }

  // Dependencies
  @Post(':id/dependencies')
  addDep(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthedReq,
    @Body() dto: AddDependencyDto,
  ) {
    const uid = req.user.id ?? req.user.sub!;
    return this.taskService.addDependency(id, dto, uid);
  }

  @Delete(':id/dependencies/:depId')
  removeDep(
    @Param('id', ParseIntPipe) id: number,
    @Param('depId', ParseIntPipe) depId: number,
    @Req() req: AuthedReq,
  ) {
    const uid = req.user.id ?? req.user.sub!;
    return this.taskService.removeDependency(id, depId, uid);
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
    @Req() req: AuthedReq,
    @Body() dto: CreateCommentDto,
  ) {
    const uid = req.user.id ?? req.user.sub!;
    return this.taskService.addComment(id, uid, dto);
  }

  @Get(':id/comments')
  listComments(@Param('id', ParseIntPipe) id: number) {
    return this.taskService.listComments(id);
  }

  @Patch('comments/:id')
  updateComment(
    @Param('id') commentId: string,
    @Req() req: { user: { id: number; role: 'CLIENT' | 'EMPLOYEE' | 'ADMIN' } },
    @Body() dto: UpdateCommentDto,
  ) {
    return this.taskService.updateComment(commentId, req.user, dto);
  }

  @Delete('comments/:id')
  deleteComment(
    @Param('id') commentId: string,
    @Req() req: { user: { id: number; role: 'CLIENT' | 'EMPLOYEE' | 'ADMIN' } },
  ) {
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
    @Req() req: AuthedReq,
    @Body() dto: TransitionDto,
  ) {
    const uid = req.user.id ?? req.user.sub!;
    return this.taskService.transition(id, uid, dto);
  }

  // Activity
  @Get(':id/activity')
  activity(@Param('id', ParseIntPipe) id: number) {
    return this.taskService.getActivity(id);
  }

  // Bulk operations
  @Post('bulk/assign')
  bulkAssign(@Req() req: AuthedReq, @Body() dto: BulkAssignDto) {
    const uid = req.user.id ?? req.user.sub!;
    return this.taskService.bulkAssign(dto, uid);
  }

  @Post('bulk/status')
  bulkStatus(@Req() req: AuthedReq, @Body() dto: BulkStatusDto) {
    const uid = req.user.id ?? req.user.sub!;
    return this.taskService.bulkStatus(dto, uid);
  }
}

import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  ParseIntPipe,
  Post,
  Req,
  Res,
  UploadedFiles,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { FileService } from './file.service';

const DEFAULT_MAX_SIZE = Number(process.env.MAX_FILE_SIZE_BYTES || 10 * 1024 * 1024);
const DEFAULT_TYPES = (process.env.ALLOWED_MIME_TYPES || 'image/,application/pdf,application/msword,application/vnd.openxmlformats-officedocument,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain').split(',');

@Controller('files')
export class FileController {
  constructor(private readonly files: FileService) {}

  @Post('upload/task/:taskId')
  @UseInterceptors(FilesInterceptor('files'))
  async uploadTask(
    @Req() req: any,
    @Param('taskId', ParseIntPipe) taskId: number,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    this.validateFiles(files);
    return this.files.uploadForTask(req.user.sub, taskId, files);
  }

  @Get('task/:taskId')
  async listTask(@Req() req: any, @Param('taskId', ParseIntPipe) taskId: number) {
    return this.files.listByTask(req.user.sub, taskId);
  }

  @Post('upload/sprint-task/:sprintTaskId')
  @UseInterceptors(FilesInterceptor('files'))
  async uploadSprintTask(
    @Req() req: any,
    @Param('sprintTaskId', ParseIntPipe) sprintTaskId: number,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    this.validateFiles(files);
    return this.files.uploadForSprintTask(req.user.sub, sprintTaskId, files);
  }

  @Get('sprint-task/:sprintTaskId')
  async listSprintTask(
    @Req() req: any,
    @Param('sprintTaskId', ParseIntPipe) sprintTaskId: number,
  ) {
    return this.files.listBySprintTask(req.user.sub, sprintTaskId);
  }

  @Post('upload/message/:messageId')
  @UseInterceptors(FilesInterceptor('files'))
  async uploadMessage(
    @Req() req: any,
    @Param('messageId') messageId: string,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    this.validateFiles(files);
    return this.files.uploadForMessage(req.user.sub, messageId, files);
  }

  @Get('conversation/:conversationId')
  async listConversation(@Req() req: any, @Param('conversationId') conversationId: string) {
    return this.files.listByConversation(req.user.sub, conversationId);
  }

  @Get(':id')
  async meta(@Req() req: any, @Param('id') id: string) {
    return this.files.getMeta(req.user.sub, id);
  }

  @Get(':id/download')
  async download(@Req() req: any, @Param('id') id: string, @Res() res: Response) {
    const file = await this.files.asStream(req.user.sub, id);
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Length', String(file.size));
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.filename)}"`);
    file.stream.pipe(res);
  }

  @Get(':id/preview')
  @Header('Cache-Control', 'private, max-age=3600')
  async preview(@Req() req: any, @Param('id') id: string, @Res() res: Response) {
    const file = await this.files.asStream(req.user.sub, id);
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Length', String(file.size));
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.filename)}"`);
    file.stream.pipe(res);
  }

  @Delete(':id')
  async remove(@Req() req: any, @Param('id') id: string) {
    return this.files.softDelete(req.user.sub, id);
  }

  private validateFiles(files: Array<Express.Multer.File>) {
    for (const f of files) {
      if (f.size > DEFAULT_MAX_SIZE) {
        throw new BadRequestException('File too large');
      }
      if (!DEFAULT_TYPES.some((t) => t.endsWith('/') ? f.mimetype.startsWith(t) : f.mimetype === t)) {
        throw new BadRequestException('Unsupported file type');
      }
    }
  }
}

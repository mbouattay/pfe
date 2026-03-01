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

const DEFAULT_MAX_SIZE = Number(
  process.env.MAX_FILE_SIZE_BYTES || 10 * 1024 * 1024,
);
const DEFAULT_TYPES = (
  process.env.ALLOWED_MIME_TYPES ||
  'image/,application/pdf,application/msword,application/vnd.openxmlformats-officedocument,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain'
).split(',');

@Controller('files')
export class FileController {
  constructor(private readonly files: FileService) {}

  @Post('upload/task/:taskId')
  @UseInterceptors(FilesInterceptor('files'))
  async uploadTask(
    @Req() req: { user: { id?: number; sub?: number } },
    @Param('taskId', ParseIntPipe) taskId: number,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    this.validateFiles(files);
    const uid = req.user.id ?? req.user.sub!;
    return this.files.uploadForTask(uid, taskId, files);
  }

  @Get('task/:taskId')
  async listTask(
    @Req() req: { user: { id?: number; sub?: number } },
    @Param('taskId', ParseIntPipe) taskId: number,
  ) {
    const uid = req.user.id ?? req.user.sub!;
    return this.files.listByTask(uid, taskId);
  }

  @Post('upload/sprint-task/:sprintTaskId')
  @UseInterceptors(FilesInterceptor('files'))
  async uploadSprintTask(
    @Req() req: { user: { id?: number; sub?: number } },
    @Param('sprintTaskId', ParseIntPipe) sprintTaskId: number,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    this.validateFiles(files);
    const uid = req.user.id ?? req.user.sub!;
    return this.files.uploadForSprintTask(uid, sprintTaskId, files);
  }

  @Get('sprint-task/:sprintTaskId')
  async listSprintTask(
    @Req() req: { user: { id?: number; sub?: number } },
    @Param('sprintTaskId', ParseIntPipe) sprintTaskId: number,
  ) {
    const uid = req.user.id ?? req.user.sub!;
    return this.files.listBySprintTask(uid, sprintTaskId);
  }

  @Post('upload/message/:messageId')
  @UseInterceptors(FilesInterceptor('files'))
  async uploadMessage(
    @Req() req: { user: { id?: number; sub?: number } },
    @Param('messageId') messageId: string,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    this.validateFiles(files);
    const uid = req.user.id ?? req.user.sub!;
    return this.files.uploadForMessage(uid, messageId, files);
  }

  @Get('conversation/:conversationId')
  async listConversation(
    @Req() req: { user: { id?: number; sub?: number } },
    @Param('conversationId') conversationId: string,
  ) {
    const uid = req.user.id ?? req.user.sub!;
    return this.files.listByConversation(uid, conversationId);
  }

  @Get(':id')
  async meta(
    @Req() req: { user: { id?: number; sub?: number } },
    @Param('id') id: string,
  ) {
    const uid = req.user.id ?? req.user.sub!;
    return this.files.getMeta(uid, id);
  }

  @Get(':id/download')
  async download(
    @Req() req: { user: { id?: number; sub?: number } },
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const uid = req.user.id ?? req.user.sub!;
    const file = await this.files.asStream(uid, id);
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Length', String(file.size));
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(file.filename)}"`,
    );
    file.stream.pipe(res);
  }

  @Get(':id/preview')
  @Header('Cache-Control', 'private, max-age=3600')
  async preview(
    @Req() req: { user: { id?: number; sub?: number } },
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const uid = req.user.id ?? req.user.sub!;
    const file = await this.files.asStream(uid, id);
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Length', String(file.size));
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(file.filename)}"`,
    );
    file.stream.pipe(res);
  }

  @Delete(':id')
  async remove(
    @Req() req: { user: { id?: number; sub?: number } },
    @Param('id') id: string,
  ) {
    const uid = req.user.id ?? req.user.sub!;
    return this.files.softDelete(uid, id);
  }

  private validateFiles(files: Array<Express.Multer.File>) {
    for (const f of files) {
      if (f.size > DEFAULT_MAX_SIZE) {
        throw new BadRequestException('File too large');
      }
      if (
        !DEFAULT_TYPES.some((t) =>
          t.endsWith('/') ? f.mimetype.startsWith(t) : f.mimetype === t,
        )
      ) {
        throw new BadRequestException('Unsupported file type');
      }
    }
  }
}

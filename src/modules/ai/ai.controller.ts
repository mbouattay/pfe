import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  FileTypeValidator,
  MaxFileSizeValidator,
  ParseFilePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { AiService } from './ai.service';
import { Public } from 'src/common/decorators/public.decorator';

const PDF_MIME = 'application/pdf';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('generate-sprints')
  @Public()
  @UseInterceptors(FileInterceptor('file'))
  async generateSprints(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_FILE_SIZE }),
          new FileTypeValidator({ fileType: PDF_MIME }),
        ],
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
    @Body('projectId', new ParseIntPipe()) projectId: number,
  ) {
    if (!file?.buffer) {
      throw new BadRequestException('File is required');
    }
    return this.aiService.generateSprintsFromPdf(file.buffer, projectId);
  }
}

import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
  Param,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  FileTypeValidator,
  MaxFileSizeValidator,
  ParseFilePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { AiService } from './ai.service';
import type {
  AiSubtasksResponse,
  AiImplementationResponse,
  AiEstimateResult,
  AiRecommendationsResponse,
  AiAcceptanceResponse,
  AiQaResponse,
} from './ai.service';
import type { Sprint, SprintTask } from '@prisma/client';
import {
  AiTextContextDto,
  AiQaDto,
  AiEstimateDto,
  AiShareDto,
  AiAccuracyQueryDto,
  AiDetailedAnalyticsQueryDto,
} from './ai.task.dto';

const PDF_MIME = 'application/pdf';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('generate-sprints')
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
  ): Promise<{
    created: number;
    sprintIds: number[];
    sprints: (Sprint & { sprintTasks: SprintTask[] })[];
  }> {
    if (!file?.buffer) {
      throw new BadRequestException('File is required');
    }
    return this.aiService.generateSprintsFromPdf(file.buffer, projectId);
  }

  @Post('sprint-tasks/:id/subtasks')
  subtasks(
    @Body() body: AiTextContextDto,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<AiSubtasksResponse> {
    return this.aiService.generateSubtasksForSprintTask(id, body.description);
  }

  @Post('sprint-tasks/:id/implementation')
  implementation(
    @Body() body: AiTextContextDto,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<AiImplementationResponse> {
    return this.aiService.generateImplementationSteps(id, body.description);
  }

  @Post('sprint-tasks/:id/estimate')
  estimate(
    @Body() body: AiEstimateDto,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<AiEstimateResult> {
    return this.aiService.estimateEffortForSprintTask(id, body.description);
  }

  @Post('sprint-tasks/:id/recommendations')
  recommendations(
    @Body() body: AiTextContextDto,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<AiRecommendationsResponse> {
    return this.aiService.technicalRecommendationsForSprintTask(
      id,
      body.description,
    );
  }

  @Post('sprint-tasks/:id/acceptance')
  acceptance(
    @Body() body: AiTextContextDto,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<AiAcceptanceResponse> {
    return this.aiService.generateAcceptanceCriteria(id, body.description);
  }

  @Post('sprint-tasks/:id/similar')
  similar(
    @Param('id', ParseIntPipe) id: number,
  ): ReturnType<AiService['findSimilarTasks']> {
    return this.aiService.findSimilarTasks(id);
  }

  @Post('sprint-tasks/:id/qa')
  qa(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: AiQaDto,
  ): Promise<AiQaResponse> {
    return this.aiService.qaForSprintTask(id, body.question);
  }

  @Post('sprint-tasks/:id/share')
  share(
    @Req() req: unknown,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: AiShareDto,
  ): Promise<{ shared: boolean; messageId: string | number }> {
    const user = (req as { user?: { id?: number; sub?: number } }).user;
    const userId = user?.sub ?? user?.id;
    return this.aiService.shareToSprintChat(
      id,
      userId as number,
      body.type,
      body.content,
    );
  }

  @Get('analytics/accuracy')
  accuracy(
    @Query() q: AiAccuracyQueryDto,
  ): ReturnType<AiService['analyticsAiAccuracy']> {
    return this.aiService.analyticsAiAccuracy(q.from, q.to, q.bySprint ?? true);
  }

  @Get('analytics/detailed')
  detailed(
    @Query() q: AiDetailedAnalyticsQueryDto,
  ): ReturnType<AiService['analyticsDetailed']> {
    return this.aiService.analyticsDetailed(q.from, q.to, q.sprintId);
  }
}

import { Module } from '@nestjs/common';
import { SprintTaskController } from './sprintTask.controller';
import { SprintTaskService } from './sprintTask.service';

@Module({
  controllers: [SprintTaskController],
  providers: [SprintTaskService],
  exports: [SprintTaskService],
})
export class SprintTaskModule {}

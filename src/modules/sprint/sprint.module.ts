import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { NotificationModule } from '../notifications/notification.module';
import { SprintController } from './sprint.controller';
import { SprintService } from './sprint.service';
import { SprintParticipantsService } from './sprint-participants.service';
import { SprintParticipantsController } from './sprint-participants.controller';

@Module({
  imports: [PrismaModule, NotificationModule],
  controllers: [SprintController, SprintParticipantsController],
  providers: [SprintService, SprintParticipantsService],
  exports: [SprintService, SprintParticipantsService],
})
export class SprintModule {}

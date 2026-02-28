import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import { TaskWorkflowService } from './task-workflow.service';
import { TaskActivityService } from './task-activity.service';
import { TaskGateway } from './task.gateway';
import { NotificationModule } from '../notifications/notification.module';
import { ChatModule } from '../chat/chat.module';
import { TimeModule } from '../time/time.module';

@Module({
  imports: [
    NotificationModule,
    ChatModule,
    TimeModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret:
          configService.get<string>('JWT_SECRET') ||
          'your-secret-key-change-in-production',
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [TaskController],
  providers: [TaskService, TaskWorkflowService, TaskActivityService, TaskGateway],
  exports: [TaskService],
})
export class TaskModule {}

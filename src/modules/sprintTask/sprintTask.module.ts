import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NotificationModule } from '../notifications/notification.module';
import { ChatModule } from '../chat/chat.module';
import { SprintTaskController } from './sprintTask.controller';
import { SprintTaskService } from './sprintTask.service';
import { SprintTaskGateway } from './sprintTask.gateway';

@Module({
  imports: [
    NotificationModule,
    ChatModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret:
          config.get<string>('JWT_SECRET') ||
          'your-secret-key-change-in-production',
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [SprintTaskController],
  providers: [SprintTaskService, SprintTaskGateway],
  exports: [SprintTaskService],
})
export class SprintTaskModule {}

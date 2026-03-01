import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClientModule } from './modules/clients/client.module';
import { GradeModule } from './modules/grades/grade.module';
import { EmployerModule } from './modules/employeur/employeur.module';
import { AuthModule } from './modules/auth/auth.module';
import { AdministrateurModule } from './modules/administrateur/administrateur.module';
import { WebProjectModule } from './modules/webProject/webProject.module';
import { MarketingProjectModule } from './modules/marketingProject/marketingProject.module';
import { TaskModule } from './modules/task/task.module';
import { SprintModule } from './modules/sprint/sprint.module';
import { SprintTaskModule } from './modules/sprintTask/sprintTask.module';
import { AiModule } from './modules/ai/ai.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { MailModule } from './common/mail/mail.module';
import { ChatModule } from './modules/chat/chat.module';
import { NotificationModule } from './modules/notifications/notification.module';
import { TimeModule } from './modules/time/time.module';
import { FileModule } from './modules/files/file.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { CalendarModule } from './modules/calendar/calendar.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MailModule,
    PrismaModule,
    AuthModule,
    ClientModule,
    GradeModule,
    EmployerModule,
    AdministrateurModule,
    WebProjectModule,
    MarketingProjectModule,
    ChatModule,
    NotificationModule,
    TimeModule,
    TaskModule,
    SprintModule,
    SprintTaskModule,
    AiModule,
    FileModule,
    AnalyticsModule,
    CalendarModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}

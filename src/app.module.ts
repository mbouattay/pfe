import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClientModule } from './modules/clients/client.module';
import { GradeModule } from './modules/grades/grade.module';
import { EmployerModule } from './modules/employers/employer.module';
import { AuthModule } from './modules/auth/auth.module';
import { AdministrateurModule } from './modules/administrateur/administrateur.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { MailModule } from './common/mail/mail.module';

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

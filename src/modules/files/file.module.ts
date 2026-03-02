import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { FileService } from './file.service';
import { FileController } from './file.controller';
import { StorageService } from './storage.service';
import { NotificationModule } from '../notifications/notification.module';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [PrismaModule, NotificationModule, ChatModule],
  providers: [FileService, StorageService],
  controllers: [FileController],
  exports: [FileService],
})
export class FileModule {}

import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { CalendarService } from './calendar.service';
import { CalendarController } from './calendar.controller';

@Module({
  imports: [PrismaModule],
  providers: [CalendarService],
  controllers: [CalendarController],
})
export class CalendarModule {}


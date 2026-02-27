import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Req,
  Patch,
  Body,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationPaginationDto } from './dto/pagination.dto';
import { UpdateNotificationPreferencesDto } from './dto/update-preferences.dto';

type AuthedReq = { user: { id: number } };

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notifications: NotificationService) {}

  @Get()
  list(@Req() req: AuthedReq, @Query() q: NotificationPaginationDto) {
    return this.notifications.list(req.user.id, q.cursor, q.limit ?? 20);
  }

  @Get('unread-count')
  unreadCount(@Req() req: AuthedReq) {
    return this.notifications.unreadCount(req.user.id);
  }

  @Post(':id/read')
  markRead(@Req() req: AuthedReq, @Param('id') id: string) {
    return this.notifications.markRead(id, req.user.id);
  }

  @Post('mark-all-read')
  markAllRead(@Req() req: AuthedReq) {
    return this.notifications.markAllRead(req.user.id);
  }

  @Delete(':id')
  delete(@Req() req: AuthedReq, @Param('id') id: string) {
    return this.notifications.delete(id, req.user.id);
  }

  @Get('preferences')
  getPreferences(@Req() req: AuthedReq) {
    return this.notifications.getPreferences(req.user.id);
  }

  @Patch('preferences')
  updatePreferences(
    @Req() req: AuthedReq,
    @Body() dto: UpdateNotificationPreferencesDto,
  ) {
    return this.notifications.updatePreferences(req.user.id, dto);
  }
}

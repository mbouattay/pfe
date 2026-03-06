import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { CreateDirectDto } from './dto/create-direct.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { EditMessageDto } from './dto/edit-message.dto';
import { PaginationDto } from './dto/pagination.dto';

type AuthedReq = { user: { id: number } };

@Controller('chat')
export class ChatController {
  constructor(
    private readonly chat: ChatService,
    private readonly chatGateway: ChatGateway,
  ) {}

  @Get('conversations')
  listConversations(@Req() req: AuthedReq) {
    return this.chat.listConversations(req.user.id);
  }

  @Post('direct')
  getOrCreateDirect(@Req() req: AuthedReq, @Body() dto: CreateDirectDto) {
    return this.chat.getOrCreateDirectConversation(req.user.id, dto.userId);
  }

  @Post('task/:taskId')
  getOrCreateTask(@Req() req: AuthedReq, @Param('taskId') taskId: string) {
    return this.chat.getOrCreateTaskConversation(req.user.id, Number(taskId));
  }

  @Post('sprint-task/:sprintTaskId')
  getOrCreateSprintTask(
    @Req() req: AuthedReq,
    @Param('sprintTaskId') sprintTaskId: string,
  ) {
    return this.chat.getOrCreateSprintTaskConversation(
      req.user.id,
      Number(sprintTaskId),
    );
  }

  @Get('conversations/:id/messages')
  listMessages(
    @Req() req: AuthedReq,
    @Param('id') id: string,
    @Query() q: PaginationDto,
  ) {
    return this.chat.listMessages(id, req.user.id, q.cursor, q.limit ?? 20);
  }

  @Post('conversations/:id/messages')
  async send(
    @Req() req: AuthedReq,
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
  ) {
    const message = await this.chat.sendMessage(
      id,
      req.user.id,
      dto.content,
      dto.replyToId,
    );
    this.chatGateway.emitNewMessage(id, message);
    return message;
  }

  @Post('conversations/:id/read')
  markRead(@Req() req: AuthedReq, @Param('id') id: string) {
    return this.chat.markConversationRead(id, req.user.id);
  }

  @Post('conversations/:id/unread')
  markUnread(@Req() req: AuthedReq, @Param('id') id: string) {
    return this.chat.markConversationUnread(id, req.user.id);
  }

  @Patch('messages/:id')
  edit(
    @Req() req: AuthedReq,
    @Param('id') id: string,
    @Body() dto: EditMessageDto,
  ) {
    return this.chat.editMessage(id, req.user.id, dto.content);
  }

  @Delete('messages/:id')
  del(@Req() req: AuthedReq, @Param('id') id: string) {
    return this.chat.deleteMessage(id, req.user.id);
  }
}

import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';

interface AuthedSocket extends Socket {
  data: { userId?: number };
}
@WebSocketGateway({
  namespace: '/chat',
  cors: { origin: '*' },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;
  private onlineUsers = new Map<number, Set<string>>();

  constructor(
    private readonly jwt: JwtService,
    private readonly chat: ChatService,
  ) {}

  handleConnection(client: AuthedSocket) {
    const token = this.extractToken(client);
    if (!token) {
      client.disconnect();
      return;
    }
    let decoded: unknown;
    try {
      decoded = this.jwt.verify(token) as unknown;
    } catch {
      client.disconnect();
      return;
    }
    if (
      !decoded ||
      typeof decoded !== 'object' ||
      decoded === null ||
      !('sub' in decoded) ||
      typeof (decoded as Record<string, unknown>).sub !== 'number'
    ) {
      client.disconnect();
      return;
    }
    client.data.userId = (decoded as Record<string, unknown>).sub as number;
    const userId = client.data.userId as number;
    if (!this.onlineUsers.has(userId)) {
      this.onlineUsers.set(userId, new Set());
    }
    this.onlineUsers.get(userId)!.add(client.id);
    this.server.emit('presence:update', { userId, online: true });
  }

  handleDisconnect(client: AuthedSocket) {
    const userId = client.data?.userId as number | undefined;
    if (userId) {
      const sockets = this.onlineUsers.get(userId);
      if (sockets) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.onlineUsers.delete(userId);
          this.server.emit('presence:update', { userId, online: false });
        }
      }
    }
  }

  async onJoin(client: AuthedSocket, conversationId: string) {
    const userId = client.data.userId as number;
    try {
      await this.chat.listMessages(conversationId, userId, undefined, 1);
      await client.join(this.room(conversationId));
      client.emit('joined', { conversationId });
    } catch {
      client.emit('error', { message: 'join_failed' });
    }
  }

  async onSend(
    client: AuthedSocket,
    payload: { conversationId: string; content: string; replyToId?: string },
  ) {
    const userId = client.data.userId as number;
    const msg = await this.chat.sendMessage(
      payload.conversationId,
      userId,
      payload.content,
      payload.replyToId,
    );
    this.server.to(this.room(payload.conversationId)).emit('message:new', msg);
  }

  onTypingStart(client: AuthedSocket, conversationId: string) {
    const userId = client.data.userId as number;
    client
      .to(this.room(conversationId))
      .emit('typing:start', { userId, conversationId });
  }

  onTypingStop(client: AuthedSocket, conversationId: string) {
    const userId = client.data.userId as number;
    client
      .to(this.room(conversationId))
      .emit('typing:stop', { userId, conversationId });
  }

  async onRead(client: AuthedSocket, conversationId: string) {
    const userId = client.data.userId as number;
    const res = await this.chat.markConversationRead(conversationId, userId);
    this.server
      .to(this.room(conversationId))
      .emit('message:read', { userId, ...res });
  }

  emitNewMessage(conversationId: string, message: any) {
    this.server.to(this.room(conversationId)).emit('message:new', message);
  }

  bindEvents(server: Server) {
    server.on('connection', (socket: AuthedSocket) => {
      socket.on('join', (conversationId: string) =>
        this.onJoin(socket, conversationId),
      );
      socket.on(
        'message:send',
        (p: { conversationId: string; content: string; replyToId?: string }) =>
          this.onSend(socket, p),
      );
      socket.on('typing:start', (cid: string) =>
        this.onTypingStart(socket, cid),
      );
      socket.on('typing:stop', (cid: string) => this.onTypingStop(socket, cid));
      socket.on('message:read', (cid: string) => this.onRead(socket, cid));
      socket.on('presence:get', () => {
        const onlineIds = Array.from(this.onlineUsers.keys());
        socket.emit('presence:list', onlineIds);
      });
    });
  }

  afterInit(server: Server) {
    this.bindEvents(server);
  }

  private extractToken(client: Socket): string | undefined {
    const h = client.handshake.headers.authorization;
    if (typeof h === 'string' && h.startsWith('Bearer ')) return h.substring(7);
    const auth = client.handshake.auth as Record<string, unknown> | undefined;
    const query = client.handshake.query as Record<string, unknown> | undefined;
    const fromAuth =
      auth && typeof auth['token'] === 'string' ? auth['token'] : undefined;
    const fromQuery =
      query && typeof query['token'] === 'string' ? query['token'] : undefined;
    return fromAuth ?? fromQuery;
  }

  private room(conversationId: string) {
    return `conversation:${conversationId}`;
  }
}

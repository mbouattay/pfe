import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';

interface AuthedSocket extends Socket {
  data: { userId?: number };
}

@WebSocketGateway({ namespace: '/tasks', cors: { origin: '*' } })
export class TaskGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly jwt: JwtService) {}

  handleConnection(client: AuthedSocket) {
    const token = this.extractToken(client);
    if (!token) return client.disconnect(true);
    try {
      const payload = this.jwt.verify<{ sub: number }>(token);
      const uid = payload.sub;
      client.data.userId = uid;
      client.join(this.userRoom(uid));
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect(_client: AuthedSocket) {
    void _client;
  }

  userRoom(userId: number) {
    return `user:${userId}`;
  }

  taskRoom(taskId: number) {
    return `task:${taskId}`;
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

  @SubscribeMessage('watch')
  handleWatch(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() data: { taskId: number },
  ) {
    if (!client.data.userId) return;
    const room = this.taskRoom(Number(data.taskId));
    client.join(room);
    client.emit('watch:ok', { room });
  }

  @SubscribeMessage('unwatch')
  handleUnwatch(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() data: { taskId: number },
  ) {
    if (!client.data.userId) return;
    const room = this.taskRoom(Number(data.taskId));
    client.leave(room);
    client.emit('unwatch:ok', { room });
  }
}

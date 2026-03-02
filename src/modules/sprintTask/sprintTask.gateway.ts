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

@WebSocketGateway({ namespace: '/sprint-tasks', cors: { origin: '*' } })
export class SprintTaskGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
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
      void client.join(this.userRoom(uid));
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect(_client: AuthedSocket) {
    void _client;
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

  userRoom(userId: number) {
    return `user:${userId}`;
  }

  sprintTaskRoom(sprintTaskId: number) {
    return `sprintTask:${sprintTaskId}`;
  }

  @SubscribeMessage('watch')
  handleWatch(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() data: { sprintTaskId: number },
  ) {
    if (!client.data.userId) return;
    const room = this.sprintTaskRoom(Number(data.sprintTaskId));
    void client.join(room);
    void client.emit('watch:ok', { room });
  }

  @SubscribeMessage('unwatch')
  handleUnwatch(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() data: { sprintTaskId: number },
  ) {
    if (!client.data.userId) return;
    const room = this.sprintTaskRoom(Number(data.sprintTaskId));
    void client.leave(room);
    void client.emit('unwatch:ok', { room });
  }
}

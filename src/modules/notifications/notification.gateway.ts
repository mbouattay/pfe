import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';

interface AuthedSocket extends Socket {
  data: { userId?: number };
}

@WebSocketGateway({
  namespace: '/notifications',
  cors: { origin: '*' },
})
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(private readonly jwt: JwtService) {}

  async handleConnection(client: AuthedSocket) {
    const token = this.extractToken(client);
    if (!token) {
      client.disconnect(true);
      return;
    }
    try {
      const payload = this.jwt.verify<{ sub: number }>(token);
      const uid = payload.sub;
      client.data.userId = uid;
      await client.join(this.userRoom(uid));
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
}

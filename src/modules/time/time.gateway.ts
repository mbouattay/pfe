import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { TimeService } from './time.service';

interface AuthedSocket extends Socket {
  data: { userId?: number };
}

@WebSocketGateway({ namespace: '/time', cors: { origin: '*' } })
export class TimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private intervals = new Map<number, NodeJS.Timeout>();
  private connections = new Map<number, number>(); // userId -> count

  constructor(
    private readonly jwt: JwtService,
    private readonly time: TimeService,
  ) {}

  async handleConnection(client: AuthedSocket) {
    const token = this.extractToken(client);
    if (!token) return client.disconnect(true);
    try {
      const payload = this.jwt.verify<{ sub: number }>(token);
      const uid = payload.sub;
      client.data.userId = uid;
      await client.join(this.userRoom(uid));
      await this.emitState(uid);
      const count = (this.connections.get(uid) ?? 0) + 1;
      this.connections.set(uid, count);
      if (!this.intervals.has(uid)) {
        const t = setInterval(() => {
          void this.emitState(uid);
        }, 60000); // auto-save tick each minute
        this.intervals.set(uid, t);
      }
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect(client: AuthedSocket) {
    const uid = client.data.userId;
    if (!uid) return;
    const count = (this.connections.get(uid) ?? 1) - 1;
    if (count <= 0) {
      this.connections.delete(uid);
      const t = this.intervals.get(uid);
      if (t) {
        clearInterval(t);
        this.intervals.delete(uid);
      }
    } else {
      this.connections.set(uid, count);
    }
  }

  private async emitState(userId: number) {
    const timer = await this.time.getActiveTimer(userId);
    this.server.to(this.userRoom(userId)).emit('timer:state', timer);
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

  private userRoom(userId: number) {
    return `user:${userId}`;
  }
}

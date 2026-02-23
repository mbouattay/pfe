import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';

export interface JwtPayload {
  sub: number;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.utilisateur.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        role: true,
        avatar: true,
        telephone: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Utilisateur introuvable');
    }

    return user;
  }
}

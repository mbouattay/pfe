import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './auth.dto';
import { verifyPassword } from '../../common/utils/password.util';
import { JwtPayload } from '../../common/strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { email: dto.email },
    });

    if (!utilisateur) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    const isPasswordValid = await verifyPassword(
      dto.password,
      utilisateur.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    const payload: JwtPayload = {
      sub: utilisateur.id,
      email: utilisateur.email,
      role: utilisateur.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: utilisateur.id,
        email: utilisateur.email,
        role: utilisateur.role,
        avatar: utilisateur.avatar,
        telephone: utilisateur.telephone,
      },
    };
  }

  async validateUser(userId: number) {
    return this.prisma.utilisateur.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        avatar: true,
        telephone: true,
      },
    });
  }
}

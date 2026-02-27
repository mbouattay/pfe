import { PrismaService } from '../../prisma/prisma.service';
import { Injectable, ConflictException } from '@nestjs/common';
import { CreateAdministrateurDto } from './administrateur.dto';
import { hashPassword } from '../../common/utils/password.util';
import { Role } from '../../common/enums/role.enum';

// selection shape can be reintroduced when read endpoints are added

@Injectable()
export class AdministrateurService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAdministrateurDto) {
    const exists = await this.prisma.utilisateur.findUnique({
      where: { email: dto.email },
    });
    if (exists) {
      throw new ConflictException('Email déjà utilisé');
    }

    const hashed = await hashPassword(dto.password);

    return this.prisma.utilisateur.create({
      data: {
        email: dto.email,
        password: hashed,
        role: Role.ADMIN,
        avatar: dto.avatar,
        telephone: dto.telephone,
        administrateur: {
          create: {},
        },
      },
      select: {
        id: true,
        email: true,
        role: true,
        avatar: true,
        telephone: true,
        createdAt: true,
        administrateur: {
          select: {
            id: true,
            utilisateurId: true,
          },
        },
      },
    });
  }
}

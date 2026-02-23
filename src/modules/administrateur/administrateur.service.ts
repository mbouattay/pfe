import { PrismaService } from '../../prisma/prisma.service';
import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { CreateAdministrateurDto, UpdateAdministrateurDto } from './administrateur.dto';
import { hashPassword } from '../../common/utils/password.util';
import { Role } from '../../common/enums/role.enum';

const administrateurSelect = {
  id: true,
  utilisateurId: true,
  utilisateur: {
    select: {
      id: true,
      email: true,
      role: true,
      avatar: true,
      telephone: true,
      createdAt: true,
    },
  },
  _count: { select: { projects: true } },
};

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

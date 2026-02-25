import { PrismaService } from '../../prisma/prisma.service';
import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { CreateClientDto, UpdateClientDto } from './client.dto';
import { hashPassword } from '../../common/utils/password.util';
import { Role } from '../../common/enums/role.enum';
import { MailService } from '../../common/mail/mail.service';

@Injectable()
export class ClientService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  async findAll() {
    return this.prisma.client.findMany({
      select: {
        id: true,
        nomSociete: true,
        localisation: true,
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
      },
    });
  }

  async findOne(id: number) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      select: {
        id: true,
        nomSociete: true,
        localisation: true,
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
      },
    });
    if (!client) {
      throw new NotFoundException(`Client #${id} introuvable`);
    }
    return client;
  }

  async create(dto: CreateClientDto) {
    const exists = await this.prisma.utilisateur.findUnique({
      where: { email: dto.email },
    });

    if (exists) {
      throw new ConflictException('Email déjà utilisé');
    }

    const hashed = await hashPassword(dto.password);

    const newClient = await this.prisma.utilisateur.create({
      data: {
        email: dto.email,
        password: hashed,
        role: Role.CLIENT,
        avatar: dto.avatar,
        telephone: dto.telephone,
        client: {
          create: {
            nomSociete: dto.nomSociete,
            localisation: dto.localisation,
          },
        },
      },
      select: {
        id: true,
        email: true,
        role: true,
        avatar: true,
        telephone: true,
        createdAt: true,
        client: {
          select: {
            id: true,
            nomSociete: true,
            localisation: true,
          },
        },
      },
    });

    // Envoi de l'email de bienvenue avec les identifiants
    await this.mailService.sendWelcomeEmail({
      to: dto.email,
      email: dto.email,
      password: dto.password, // mot de passe en clair (avant hashage)
      name: dto.nomSociete,
      role: 'Client',
    });

    return newClient;
  }

  async update(id: number, dto: UpdateClientDto) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: { utilisateur: true },
    });
    if (!client) {
      throw new NotFoundException(`Client #${id} introuvable`);
    }

    if (dto.email && dto.email !== client.utilisateur.email) {
      const exists = await this.prisma.utilisateur.findUnique({
        where: { email: dto.email },
      });
      if (exists) {
        throw new ConflictException('Email déjà utilisé');
      }
    }

    const utilisateurData: {
      email?: string;
      password?: string;
      avatar?: string;
      telephone?: string;
    } = {};
    if (dto.email !== undefined) utilisateurData.email = dto.email;
    if (dto.password)
      utilisateurData.password = await hashPassword(dto.password);
    if (dto.avatar !== undefined) utilisateurData.avatar = dto.avatar;
    if (dto.telephone !== undefined) utilisateurData.telephone = dto.telephone;

    const clientData: { nomSociete?: string; localisation?: string } = {};
    if (dto.nomSociete !== undefined) clientData.nomSociete = dto.nomSociete;
    if (dto.localisation !== undefined)
      clientData.localisation = dto.localisation;

    const hasClientUpdates = Object.keys(clientData).length > 0;
    const hasUtilisateurUpdates = Object.keys(utilisateurData).length > 0;
    if (!hasClientUpdates && !hasUtilisateurUpdates) {
      return this.findOne(id);
    }

    await this.prisma.client.update({
      where: { id },
      data: {
        ...(hasClientUpdates && clientData),
        ...(hasUtilisateurUpdates && {
          utilisateur: { update: utilisateurData },
        }),
      },
    });

    return this.findOne(id);
  }

  async remove(id: number) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: { utilisateur: true },
    });
    if (!client) {
      throw new NotFoundException(`Client #${id} introuvable`);
    }
    await this.prisma.utilisateur.delete({
      where: { id: client.utilisateurId },
    });
    return { message: `Client #${id} supprimé` };
  }
}

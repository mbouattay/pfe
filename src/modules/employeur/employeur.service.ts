import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateEmployerDto, UpdateEmployerDto } from './employeur.dto';
import { hashPassword } from '../../common/utils/password.util';
import { Role } from '../../common/enums/role.enum';
import { MailService } from '../../common/mail/mail.service';

const employerSelect = {
  id: true,
  nom: true,
  prenom: true,
  gradeId: true,
  grade: { select: { id: true, nom: true } },
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
};

@Injectable()
export class EmployerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  async findAll() {
    return this.prisma.employer.findMany({
      orderBy: { nom: 'asc' },
      select: employerSelect,
    });
  }

  async findOne(id: number) {
    const employer = await this.prisma.employer.findUnique({
      where: { id },
      select: employerSelect,
    });
    if (!employer) {
      throw new NotFoundException(`Employé #${id} introuvable`);
    }
    return employer;
  }

  async create(dto: CreateEmployerDto) {
    const exists = await this.prisma.utilisateur.findUnique({
      where: { email: dto.email },
    });
    if (exists) {
      throw new ConflictException('Email déjà utilisé');
    }

    const grade = await this.prisma.grade.findUnique({
      where: { id: dto.gradeId },
    });
    if (!grade) {
      throw new BadRequestException(`Grade #${dto.gradeId} introuvable`);
    }

    const hashed = await hashPassword(dto.password);

    const newEmployer = await this.prisma.utilisateur.create({
      data: {
        email: dto.email,
        password: hashed,
        role: Role.EMPLOYER,
        avatar: dto.avatar,
        telephone: dto.telephone,
        employer: {
          create: {
            nom: dto.nom,
            prenom: dto.prenom,
            gradeId: dto.gradeId,
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
        employer: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            gradeId: true,
            grade: { select: { id: true, nom: true } },
          },
        },
      },
    });

    // Envoi de l'email de bienvenue avec les identifiants
    await this.mailService.sendWelcomeEmail({
      to: dto.email,
      email: dto.email,
      password: dto.password, // mot de passe en clair (avant hashage)
      name: `${dto.prenom} ${dto.nom}`,
      role: 'Employé',
    });

    return newEmployer;
  }

  async update(id: number, dto: UpdateEmployerDto) {
    const employer = await this.prisma.employer.findUnique({
      where: { id },
      include: { utilisateur: true },
    });
    if (!employer) {
      throw new NotFoundException(`Employé #${id} introuvable`);
    }

    if (dto.email && dto.email !== employer.utilisateur.email) {
      const exists = await this.prisma.utilisateur.findUnique({
        where: { email: dto.email },
      });
      if (exists) {
        throw new ConflictException('Email déjà utilisé');
      }
    }

    if (dto.gradeId !== undefined) {
      const grade = await this.prisma.grade.findUnique({
        where: { id: dto.gradeId },
      });
      if (!grade) {
        throw new BadRequestException(`Grade #${dto.gradeId} introuvable`);
      }
    }

    const utilisateurData: {
      email?: string;
      password?: string;
      avatar?: string;
      telephone?: string;
    } = {};
    if (dto.email !== undefined) utilisateurData.email = dto.email;
    if (dto.password) {
      utilisateurData.password = await hashPassword(dto.password);
    }
    if (dto.avatar !== undefined) utilisateurData.avatar = dto.avatar;
    if (dto.telephone !== undefined) utilisateurData.telephone = dto.telephone;

    const employerData: {
      nom?: string;
      prenom?: string;
      gradeId?: number;
    } = {};
    if (dto.nom !== undefined) employerData.nom = dto.nom;
    if (dto.prenom !== undefined) employerData.prenom = dto.prenom;
    if (dto.gradeId !== undefined) employerData.gradeId = dto.gradeId;

    const hasUtilisateurUpdates = Object.keys(utilisateurData).length > 0;
    const hasEmployerUpdates = Object.keys(employerData).length > 0;
    if (!hasUtilisateurUpdates && !hasEmployerUpdates) {
      return this.findOne(id);
    }

    const data: Prisma.EmployerUpdateInput = {};
    if (hasEmployerUpdates) {
      if (employerData.nom !== undefined) data.nom = employerData.nom;
      if (employerData.prenom !== undefined) data.prenom = employerData.prenom;
      if (employerData.gradeId !== undefined) {
        data.grade = { connect: { id: employerData.gradeId } };
      }
    }
    if (hasUtilisateurUpdates) {
      data.utilisateur = { update: utilisateurData };
    }

    await this.prisma.employer.update({
      where: { id },
      data,
    });

    return this.findOne(id);
  }

  async remove(id: number) {
    const employer = await this.prisma.employer.findUnique({
      where: { id },
      include: { utilisateur: true },
    });
    if (!employer) {
      throw new NotFoundException(`Employé #${id} introuvable`);
    }
    await this.prisma.utilisateur.delete({
      where: { id: employer.utilisateurId },
    });
    return { message: `Employé #${id} supprimé` };
  }
}

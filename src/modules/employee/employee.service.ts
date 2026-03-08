import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateEmployeeDto, UpdateEmployeeDto } from './employee.dto';
import { hashPassword } from '../../common/utils/password.util';
import { Role } from '../../common/enums/role.enum';
import { MailService } from '../../common/mail/mail.service';

const employeeSelect = {
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
export class EmployeeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  async findAll() {
    return this.prisma.employee.findMany({
      orderBy: { nom: 'asc' },
      select: employeeSelect,
    });
  }

  async findOne(id: number) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      select: employeeSelect,
    });
    if (!employee) {
      throw new NotFoundException(`Employé #${id} introuvable`);
    }
    return employee;
  }

  async create(dto: CreateEmployeeDto) {
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

    const newEmployee = await this.prisma.utilisateur.create({
      data: {
        email: dto.email,
        password: hashed,
        role: Role.EMPLOYEE,
        avatar: dto.avatar,
        telephone: dto.telephone,
        employee: {
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
        employee: {
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

    await this.mailService.sendWelcomeEmail({
      to: dto.email,
      email: dto.email,
      password: dto.password,
      name: `${dto.prenom} ${dto.nom}`,
      role: 'Employé',
    });

    return newEmployee;
  }

  async update(id: number, dto: UpdateEmployeeDto) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: { utilisateur: true },
    });
    if (!employee) {
      throw new NotFoundException(`Employé #${id} introuvable`);
    }

    if (dto.email && dto.email !== employee.utilisateur.email) {
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

    const employeeData: {
      nom?: string;
      prenom?: string;
      gradeId?: number;
    } = {};
    if (dto.nom !== undefined) employeeData.nom = dto.nom;
    if (dto.prenom !== undefined) employeeData.prenom = dto.prenom;
    if (dto.gradeId !== undefined) employeeData.gradeId = dto.gradeId;

    const hasUtilisateurUpdates = Object.keys(utilisateurData).length > 0;
    const hasEmployeeUpdates = Object.keys(employeeData).length > 0;
    if (!hasUtilisateurUpdates && !hasEmployeeUpdates) {
      return this.findOne(id);
    }

    const data: Prisma.EmployeeUpdateInput = {};
    if (hasEmployeeUpdates) {
      if (employeeData.nom !== undefined) data.nom = employeeData.nom;
      if (employeeData.prenom !== undefined) data.prenom = employeeData.prenom;
      if (employeeData.gradeId !== undefined) {
        data.grade = { connect: { id: employeeData.gradeId } };
      }
    }
    if (hasUtilisateurUpdates) {
      data.utilisateur = { update: utilisateurData };
    }

    await this.prisma.employee.update({
      where: { id },
      data,
    });

    return this.findOne(id);
  }

  async remove(id: number) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: { utilisateur: true },
    });
    if (!employee) {
      throw new NotFoundException(`Employé #${id} introuvable`);
    }
    await this.prisma.utilisateur.delete({
      where: { id: employee.utilisateurId },
    });
    return { message: `Employé #${id} supprimé` };
  }
}

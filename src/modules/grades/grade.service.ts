import { PrismaService } from '../../prisma/prisma.service';
import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { CreateGradeDto, UpdateGradeDto } from './grade.dto';

@Injectable()
export class GradeService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.grade.findMany({
      orderBy: { nom: 'asc' },
      select: {
        id: true,
        nom: true,
        _count: { select: { employers: true } },
      },
    });
  }

  async findOne(id: number) {
    const grade = await this.prisma.grade.findUnique({
      where: { id },
      select: {
        id: true,
        nom: true,
        _count: { select: { employers: true } },
        employers: {
          select: {
            id: true,
            nom: true,
            prenom: true,
          },
        },
      },
    });
    if (!grade) {
      throw new NotFoundException(`Grade #${id} introuvable`);
    }
    return grade;
  }

  async create(dto: CreateGradeDto) {
    const exists = await this.prisma.grade.findUnique({
      where: { nom: dto.nom.trim() },
    });
    if (exists) {
      throw new ConflictException(`Un grade avec le nom "${dto.nom}" existe déjà`);
    }
    return this.prisma.grade.create({
      data: { nom: dto.nom.trim() },
    });
  }

  async update(id: number, dto: UpdateGradeDto) {
    const grade = await this.prisma.grade.findUnique({ where: { id } });
    if (!grade) {
      throw new NotFoundException(`Grade #${id} introuvable`);
    }
    const newNom = dto.nom?.trim();
    if (newNom && newNom !== grade.nom) {
      const exists = await this.prisma.grade.findUnique({
        where: { nom: newNom },
      });
      if (exists) {
        throw new ConflictException(
          `Un grade avec le nom "${newNom}" existe déjà`,
        );
      }
    }
    if (!newNom) {
      return this.findOne(id);
    }
    return this.prisma.grade.update({
      where: { id },
      data: { nom: newNom },
    });
  }

  async remove(id: number) {
    const grade = await this.prisma.grade.findUnique({
      where: { id },
      include: { _count: { select: { employers: true } } },
    });
    if (!grade) {
      throw new NotFoundException(`Grade #${id} introuvable`);
    }
    if (grade._count.employers > 0) {
      throw new ConflictException(
        `Impossible de supprimer ce grade : ${grade._count.employers} employé(s) y sont rattaché(s).`,
      );
    }
    await this.prisma.grade.delete({ where: { id } });
    return { message: `Grade #${id} supprimé` };
  }
}

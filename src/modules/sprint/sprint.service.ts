import { Injectable, NotFoundException } from '@nestjs/common';
import { SprintStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSprintDto, UpdateSprintDto } from './sprint.dto';

@Injectable()
export class SprintService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSprintDto) {
    return this.prisma.sprint.create({
      data: {
        nom: dto.nom,
        status: dto.status ?? SprintStatus.PLANIFIE,
        goal: dto.goal,
        dateDebut: new Date(dto.dateDebut),
        dateFin: new Date(dto.dateFin),
        totalStoryPoints: dto.totalStoryPoints ?? 0,
        webProject: {
          connect: { id: dto.webProjectId },
        },
      },
      include: {
        webProject: {
          include: {
            project: {
              include: {
                client: true,
              },
            },
          },
        },
        sprintTasks: true,
      },
    });
  }

  async findAll() {
    return this.prisma.sprint.findMany({
      include: {
        webProject: {
          include: {
            project: {
              include: {
                client: true,
              },
            },
          },
        },
        sprintTasks: true,
      },
    });
  }

  async findOne(id: number) {
    const sprint = await this.prisma.sprint.findUnique({
      where: { id },
      include: {
        webProject: {
          include: {
            project: {
              include: {
                client: true,
              },
            },
          },
        },
        sprintTasks: true,
      },
    });
    if (!sprint) {
      throw new NotFoundException(`Sprint #${id} introuvable`);
    }
    return sprint;
  }

  async update(id: number, dto: UpdateSprintDto) {
    await this.findOne(id);

    const data: {
      nom?: string;
      status?: SprintStatus;
      goal?: string;
      dateDebut?: Date;
      dateFin?: Date;
      totalStoryPoints?: number;
      webProjectId?: number;
    } = {};

    if (dto.nom !== undefined) data.nom = dto.nom;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.goal !== undefined) data.goal = dto.goal;
    if (dto.dateDebut !== undefined) data.dateDebut = new Date(dto.dateDebut);
    if (dto.dateFin !== undefined) data.dateFin = new Date(dto.dateFin);
    if (dto.totalStoryPoints !== undefined)
      data.totalStoryPoints = dto.totalStoryPoints;
    if (dto.webProjectId !== undefined) data.webProjectId = dto.webProjectId;

    return this.prisma.sprint.update({
      where: { id },
      data,
      include: {
        webProject: {
          include: {
            project: {
              include: {
                client: true,
              },
            },
          },
        },
        sprintTasks: true,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.sprint.delete({
      where: { id },
    });
    return { message: `Sprint #${id} supprimé` };
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { TaskStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTaskDto, UpdateTaskDto } from './task.dto';

@Injectable()
export class TaskService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTaskDto) {
    return this.prisma.task.create({
      data: {
        titre: dto.titre,
        dateDebut: new Date(dto.dateDebut),
        dateFin: new Date(dto.dateFin),
        status: dto.status ?? TaskStatus.A_FAIRE,
        marketingProject: {
          connect: { id: dto.marketingProjectId },
        },
      },
      include: {
        marketingProject: {
          include: {
            project: true,
          },
        },
      },
    });
  }

  async findAll() {
    return this.prisma.task.findMany({
      include: {
        marketingProject: {
          include: {
            project: {
              include: {
                client: true,
              },
            },
          },
        },
      },
    });
  }

  async findOne(id: number) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        marketingProject: {
          include: {
            project: {
              include: {
                client: true,
              },
            },
          },
        },
      },
    });
    if (!task) {
      throw new NotFoundException(`Task #${id} introuvable`);
    }
    return task;
  }

  async update(id: number, dto: UpdateTaskDto) {
    await this.findOne(id);

    const data: {
      titre?: string;
      dateDebut?: Date;
      dateFin?: Date;
      status?: TaskStatus;
      marketingProjectId?: number;
    } = {};

    if (dto.titre !== undefined) data.titre = dto.titre;
    if (dto.dateDebut !== undefined) data.dateDebut = new Date(dto.dateDebut);
    if (dto.dateFin !== undefined) data.dateFin = new Date(dto.dateFin);
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.marketingProjectId !== undefined)
      data.marketingProjectId = dto.marketingProjectId;

    return this.prisma.task.update({
      where: { id },
      data,
      include: {
        marketingProject: {
          include: {
            project: {
              include: {
                client: true,
              },
            },
          },
        },
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.task.delete({
      where: { id },
    });
    return { message: `Task #${id} supprimée` };
  }
}

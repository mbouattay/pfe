import { Injectable, NotFoundException } from '@nestjs/common';
import { TaskStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateSprintTaskDto,
  UpdateSprintTaskDto,
} from './sprintTask.dto';

@Injectable()
export class SprintTaskService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSprintTaskDto) {
    return this.prisma.sprintTask.create({
      data: {
        titre: dto.titre,
        status: dto.status ?? TaskStatus.A_FAIRE,
        priority: dto.priority,
        dateDebut: new Date(dto.dateDebut),
        storyPoints: dto.storyPoints ?? 0,
        sprint: {
          connect: { id: dto.sprintId },
        },
      },
      include: {
        sprint: {
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
          },
        },
      },
    });
  }

  async findAll() {
    return this.prisma.sprintTask.findMany({
      include: {
        sprint: {
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
          },
        },
      },
    });
  }

  async findOne(id: number) {
    const sprintTask = await this.prisma.sprintTask.findUnique({
      where: { id },
      include: {
        sprint: {
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
          },
        },
      },
    });
    if (!sprintTask) {
      throw new NotFoundException(`SprintTask #${id} introuvable`);
    }
    return sprintTask;
  }

  async update(id: number, dto: UpdateSprintTaskDto) {
    await this.findOne(id);

    const data: {
      titre?: string;
      status?: TaskStatus;
      priority?: number;
      dateDebut?: Date;
      storyPoints?: number;
      sprintId?: number;
    } = {};

    if (dto.titre !== undefined) data.titre = dto.titre;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.priority !== undefined) data.priority = dto.priority;
    if (dto.dateDebut !== undefined) {
      data.dateDebut = new Date(dto.dateDebut);
    }
    if (dto.storyPoints !== undefined) data.storyPoints = dto.storyPoints;
    if (dto.sprintId !== undefined) data.sprintId = dto.sprintId;

    return this.prisma.sprintTask.update({
      where: { id },
      data,
      include: {
        sprint: {
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
          },
        },
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.sprintTask.delete({
      where: { id },
    });
    return { message: `SprintTask #${id} supprimée` };
  }
}

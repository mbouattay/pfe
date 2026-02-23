import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateMarketingProjectDto,
  UpdateMarketingProjectDto,
} from './marketingProject.dto';

@Injectable()
export class MarketingProjectService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateMarketingProjectDto) {
    const marketingProject = await this.prisma.marketingProject.create({
      data: {
        project: {
          create: {
            titre: dto.titre,
            description: dto.description,
            dateDebut: new Date(dto.dateDebut),
            dateFin: new Date(dto.dateFin),
            client: {
              connect: { id: dto.clientId },
            },
          },
        },
      },
      include: {
        project: true,
      },
    });

    return marketingProject;
  }

  async findAll() {
    return this.prisma.marketingProject.findMany({
      include: {
        project: {
          include: {
            client: true,
          },
        },
        tasks: true,
      },
    });
  }

  async update(id: number, dto: UpdateMarketingProjectDto) {
    const marketingProject = await this.prisma.marketingProject.findUnique({
      where: { id },
      select: { projectId: true },
    });

    if (!marketingProject) {
      throw new NotFoundException(`MarketingProject #${id} introuvable`);
    }

    const projectData: {
      titre?: string;
      description?: string;
      dateDebut?: Date;
      dateFin?: Date;
      client?: { connect: { id: number } };
    } = {};

    if (dto.titre !== undefined) projectData.titre = dto.titre;
    if (dto.description !== undefined)
      projectData.description = dto.description;
    if (dto.dateDebut !== undefined) {
      projectData.dateDebut = new Date(dto.dateDebut);
    }
    if (dto.dateFin !== undefined) {
      projectData.dateFin = new Date(dto.dateFin);
    }
    if (dto.clientId !== undefined) {
      projectData.client = { connect: { id: dto.clientId } };
    }

    await this.prisma.project.update({
      where: { id: marketingProject.projectId },
      data: projectData,
    });

    return this.prisma.marketingProject.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            client: true,
          },
        },
        tasks: true,
      },
    });
  }

  async remove(id: number) {
    const marketingProject = await this.prisma.marketingProject.findUnique({
      where: { id },
      select: { projectId: true },
    });

    if (!marketingProject) {
      throw new NotFoundException(`MarketingProject #${id} introuvable`);
    }

    await this.prisma.project.delete({
      where: { id: marketingProject.projectId },
    });

    return { message: `MarketingProject #${id} supprimé` };
  }
}

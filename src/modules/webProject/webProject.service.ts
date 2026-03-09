import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateWebProjectDto, UpdateWebProjectDto } from './webProject.dto';

@Injectable()
export class WebProjectService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateWebProjectDto) {
    const webProject = await this.prisma.webProject.create({
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

    return webProject;
  }

  async findAll() {
    return this.prisma.webProject.findMany({
      include: {
        project: {
          include: {
            client: true,
          },
        },
        sprints: true,
      },
    });
  }

  async findMyProjects(userId: number) {
    const sprintParticipants = await this.prisma.sprintParticipant.findMany({
      where: {
        userId,
      },
      select: {
        sprintId: true,
      },
    });

    const sprintIds = sprintParticipants.map((p) => p.sprintId);

    const sprints = await this.prisma.sprint.findMany({
      where: {
        id: {
          in: sprintIds,
        },
      },
      select: {
        webProjectId: true,
      },
    });

    const webProjectIds = sprints.map((s) => s.webProjectId);

    return this.prisma.webProject.findMany({
      where: {
        id: {
          in: webProjectIds,
        },
      },
      include: {
        project: {
          include: {
            client: true,
          },
        },
        sprints: {
          select: {
            id: true,
            nom: true,
            status: true,
            dateDebut: true,
            dateFin: true,
            goal: true,
            totalStoryPoints: true,
          },
        },
      },
    });
  }

  async findOne(id: number) {
    const webProject = await this.prisma.webProject.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            client: true,
          },
        },
        sprints: {
          select: {
            id: true,
            nom: true,
            status: true,
            dateDebut: true,
            dateFin: true,
            goal: true,
            totalStoryPoints: true,
          },
        },
      },
    });
    if (!webProject) {
      throw new NotFoundException(`WebProject #${id} not found`);
    }
    return webProject;
  }

  async update(id: number, dto: UpdateWebProjectDto) {
    const webProject = await this.prisma.webProject.findUnique({
      where: { id },
      select: { projectId: true },
    });

    if (!webProject) {
      throw new NotFoundException(`WebProject #${id} introuvable`);
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
      where: { id: webProject.projectId },
      data: projectData,
    });

    return this.prisma.webProject.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            client: true,
          },
        },
        sprints: true,
      },
    });
  }

  async remove(id: number) {
    const webProject = await this.prisma.webProject.findUnique({
      where: { id },
      select: { projectId: true },
    });

    if (!webProject) {
      throw new NotFoundException(`WebProject #${id} introuvable`);
    }

    await this.prisma.project.delete({
      where: { id: webProject.projectId },
    });

    return { message: `WebProject #${id} supprimé` };
  }
}

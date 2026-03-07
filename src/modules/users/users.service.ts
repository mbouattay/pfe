import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

type TeamUser = {
  id: number;
  email: string;
  role: 'CLIENT' | 'EMPLOYER' | 'ADMIN';
  nom?: string;
  prenom?: string;
  nomSociete?: string;
  avatar?: string | null;
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyTeam(userId: number): Promise<TeamUser[]> {
    const assignedProjects = await this.prisma.taskAssignment.findMany({
      where: { userId },
      select: {
        task: {
          select: { marketingProject: { select: { projectId: true } } },
        },
      },
    });
    const reporterProjects = await this.prisma.task.findMany({
      where: { reporterId: userId },
      select: { marketingProject: { select: { projectId: true } } },
    });
    const sprintProjects = await this.prisma.sprintParticipant.findMany({
      where: { userId },
      select: {
        sprint: {
          select: {
            webProject: { select: { project: { select: { id: true } } } },
          },
        },
      },
    });

    const projectIds = new Set<number>();
    for (const a of assignedProjects) {
      const id = a.task.marketingProject.projectId;
      if (id !== null && id !== undefined) projectIds.add(id);
    }
    for (const t of reporterProjects) {
      const id = t.marketingProject.projectId;
      if (id !== null && id !== undefined) projectIds.add(id);
    }
    for (const sp of sprintProjects) {
      const id = sp.sprint.webProject.project.id;
      projectIds.add(id);
    }
    const pidArr = [...projectIds];
    if (pidArr.length === 0) {
      const admins = await this.prisma.utilisateur.findMany({
        where: { role: 'ADMIN' },
        select: {
          id: true,
          email: true,
          role: true,
          avatar: true,
          employer: { select: { nom: true, prenom: true } },
          client: { select: { nomSociete: true } },
        },
      });
      return admins
        .filter((u) => u.id !== userId)
        .map((u) => ({
          id: u.id,
          email: u.email,
          role: u.role,
          nom: u.employer?.nom,
          prenom: u.employer?.prenom,
          nomSociete: u.client?.nomSociete,
          avatar: u.avatar,
        }));
    }

    const assignees = await this.prisma.taskAssignment.findMany({
      where: { task: { marketingProject: { projectId: { in: pidArr } } } },
      select: { userId: true },
    });
    const participants = await this.prisma.sprintParticipant.findMany({
      where: {
        sprint: { webProject: { project: { id: { in: pidArr } } } },
      },
      select: { userId: true },
    });
    const clientUsers = await this.prisma.project.findMany({
      where: { id: { in: pidArr } },
      select: { client: { select: { utilisateurId: true } } },
    });
    const admins = await this.prisma.utilisateur.findMany({
      where: { role: 'ADMIN' },
      select: { id: true },
    });

    const userIds = new Set<number>();
    for (const a of assignees) userIds.add(a.userId);
    for (const p of participants) userIds.add(p.userId);
    for (const c of clientUsers) userIds.add(c.client.utilisateurId);
    for (const a of admins) userIds.add(a.id);
    userIds.delete(userId);
    const idArr = [...userIds];
    if (idArr.length === 0) return [];

    const users = await this.prisma.utilisateur.findMany({
      where: { id: { in: idArr } },
      select: {
        id: true,
        email: true,
        role: true,
        avatar: true,
        employer: { select: { nom: true, prenom: true } },
        client: { select: { nomSociete: true } },
      },
    });
    return users.map((u) => ({
      id: u.id,
      email: u.email,
      role: u.role,
      nom: u.employer?.nom,
      prenom: u.employer?.prenom,
      nomSociete: u.client?.nomSociete,
      avatar: u.avatar,
    }));
  }
}


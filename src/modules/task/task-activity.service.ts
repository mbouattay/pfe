import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TaskActivityService {
  constructor(private readonly prisma: PrismaService) {}

  async log(params: {
    taskId: number;
    userId: number;
    action: string;
    field?: string | null;
    oldValue?: string | null;
    newValue?: string | null;
  }) {
    const { taskId, userId, action, field, oldValue, newValue } = params;
    return this.prisma.taskActivity.create({
      data: {
        taskId,
        userId,
        action,
        field: field ?? null,
        oldValue: oldValue ?? null,
        newValue: newValue ?? null,
      },
    });
  }
}

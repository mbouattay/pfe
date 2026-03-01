import { Injectable, BadRequestException } from '@nestjs/common';
import { TaskStatus } from '@prisma/client';

const ALLOWED: Record<TaskStatus, TaskStatus[]> = {
  A_FAIRE: [TaskStatus.EN_COURS, TaskStatus.BLOQUE],
  EN_COURS: [TaskStatus.EN_REVUE, TaskStatus.BLOQUE, TaskStatus.TERMINE],
  EN_REVUE: [TaskStatus.TERMINE, TaskStatus.EN_COURS],
  TERMINE: [],
  BLOQUE: [TaskStatus.A_FAIRE, TaskStatus.EN_COURS],
};

@Injectable()
export class TaskWorkflowService {
  allowedTransitions(from: TaskStatus): TaskStatus[] {
    return ALLOWED[from] ?? [];
  }

  assertTransition(from: TaskStatus, to: TaskStatus): void {
    if (!this.allowedTransitions(from).includes(to)) {
      throw new BadRequestException(
        `Transition non autorisée: ${from} -> ${to}`,
      );
    }
  }
}

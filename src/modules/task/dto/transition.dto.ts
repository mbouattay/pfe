import { IsEnum } from 'class-validator';
import { TaskStatus } from '@prisma/client';

export class TransitionDto {
  @IsEnum(TaskStatus)
  to!: TaskStatus;
}


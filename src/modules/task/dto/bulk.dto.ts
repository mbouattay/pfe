import { IsArray, ArrayNotEmpty, IsInt, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { TaskStatus } from '@prisma/client';

export class BulkAssignDto {
  @IsArray()
  @ArrayNotEmpty()
  @Type(() => Number)
  taskIds!: number[];

  @IsInt()
  @Type(() => Number)
  userId!: number;
}

export class BulkStatusDto {
  @IsArray()
  @ArrayNotEmpty()
  @Type(() => Number)
  taskIds!: number[];

  @IsEnum(TaskStatus)
  status!: TaskStatus;
}

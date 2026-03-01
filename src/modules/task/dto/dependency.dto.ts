import { IsInt, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class AddDependencyDto {
  @IsInt()
  @IsNotEmpty()
  @Type(() => Number)
  dependsOnId!: number;
}

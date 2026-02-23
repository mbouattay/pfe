import { Module } from '@nestjs/common';
import { EmployerController } from './employeur.controller';
import { EmployerService } from './employeur.service';

@Module({
  controllers: [EmployerController],
  providers: [EmployerService],
  exports: [EmployerService],
})
export class EmployerModule { }

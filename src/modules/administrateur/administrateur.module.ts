import { Module } from '@nestjs/common';
import { AdministrateurController } from './administrateur.controller';
import { AdministrateurService } from './administrateur.service';

@Module({
  controllers: [AdministrateurController],
  providers: [AdministrateurService],
  exports: [AdministrateurService],
})
export class AdministrateurModule {}

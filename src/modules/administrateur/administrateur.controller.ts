import { Body, Controller, Post } from '@nestjs/common';
import { AdministrateurService } from './administrateur.service';
import { CreateAdministrateurDto } from './administrateur.dto';

@Controller('administrateurs')
export class AdministrateurController {
  constructor(private readonly administrateurService: AdministrateurService) {}

  @Post()
  create(@Body() dto: CreateAdministrateurDto) {
    return this.administrateurService.create(dto);
  }
}

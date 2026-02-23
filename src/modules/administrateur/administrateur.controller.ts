import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { AdministrateurService } from './administrateur.service';
import {
  CreateAdministrateurDto,
  UpdateAdministrateurDto,
} from './administrateur.dto';
import { Public } from 'src/common/decorators/public.decorator';

@Controller('administrateurs')
export class AdministrateurController {
  constructor(private readonly administrateurService: AdministrateurService) {}

  @Post()
  @Public()
  create(@Body() dto: CreateAdministrateurDto) {
    return this.administrateurService.create(dto);
  }


}

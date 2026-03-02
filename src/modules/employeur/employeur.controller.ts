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
import { EmployerService } from './employeur.service';
import { CreateEmployerDto, UpdateEmployerDto } from './employeur.dto';

@Controller('employers')
export class EmployerController {
  constructor(private readonly employerService: EmployerService) {}

  @Post()
  create(@Body() dto: CreateEmployerDto) {
    return this.employerService.create(dto);
  }

  @Get()
  findAll() {
    return this.employerService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.employerService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEmployerDto,
  ) {
    return this.employerService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.employerService.remove(id);
  }
}

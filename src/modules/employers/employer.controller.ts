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
import { EmployerService } from './employer.service';
import { CreateEmployerDto, UpdateEmployerDto } from './employer.dto';
import { Public } from 'src/common/decorators/public.decorator';

@Controller('employers')
export class EmployerController {
  constructor(private readonly employerService: EmployerService) {}

  @Post()
  @Public()
  create(@Body() dto: CreateEmployerDto) {
    return this.employerService.create(dto);
  }

  @Get()
    @Public()
  findAll() {
    return this.employerService.findAll();
  }

  @Get(':id')
    @Public()
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.employerService.findOne(id);
  }

  @Patch(':id')
    @Public()
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEmployerDto,
  ) {
    return this.employerService.update(id, dto);
  }

  @Delete(':id')
    @Public()
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.employerService.remove(id);
  }
}

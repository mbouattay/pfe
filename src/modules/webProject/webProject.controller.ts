import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Patch,
} from '@nestjs/common';
import { WebProjectService } from './webProject.service';
import { CreateWebProjectDto, UpdateWebProjectDto } from './webProject.dto';
import { ForbiddenException } from '@nestjs/common';
import { Req } from '@nestjs/common';

@Controller('web-projects')
export class WebProjectController {
  constructor(private readonly webProjectService: WebProjectService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateWebProjectDto) {
    if (req.user?.role !== 'ADMIN') throw new ForbiddenException('Admin only');
    return this.webProjectService.create(dto);
  }

  @Get()
  findAll() {
    return this.webProjectService.findAll();
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
    @Body() dto: UpdateWebProjectDto,
  ) {
    if (req.user?.role !== 'ADMIN') throw new ForbiddenException('Admin only');
    return this.webProjectService.update(id, dto);
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    if (req.user?.role !== 'ADMIN') throw new ForbiddenException('Admin only');
    return this.webProjectService.remove(id);
  }
}

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
import { ForbiddenException, Req } from '@nestjs/common';

@Controller('web-projects')
export class WebProjectController {
  constructor(private readonly webProjectService: WebProjectService) {}

  @Post()
  create(
    @Req() req: { user: { role?: 'CLIENT' | 'EMPLOYEE' | 'ADMIN' } },
    @Body() dto: CreateWebProjectDto,
  ) {
    if (req.user?.role !== 'ADMIN') throw new ForbiddenException('Admin only');
    return this.webProjectService.create(dto);
  }

  @Get()
  findAll() {
    return this.webProjectService.findAll();
  }

  @Get('my-projects')
  findMyProjects(
    @Req()
    req: {
      user: { id: number; role?: 'CLIENT' | 'EMPLOYEE' | 'ADMIN' };
    },
  ) {
    if (req.user?.role === 'ADMIN') {
      return this.webProjectService.findAll();
    }
    return this.webProjectService.findMyProjects(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.webProjectService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: { user: { role?: 'CLIENT' | 'EMPLOYEE' | 'ADMIN' } },
    @Body() dto: UpdateWebProjectDto,
  ) {
    if (req.user?.role !== 'ADMIN') throw new ForbiddenException('Admin only');
    return this.webProjectService.update(id, dto);
  }

  @Delete(':id')
  remove(
    @Req() req: { user: { role?: 'CLIENT' | 'EMPLOYEE' | 'ADMIN' } },
    @Param('id', ParseIntPipe) id: number,
  ) {
    if (req.user?.role !== 'ADMIN') throw new ForbiddenException('Admin only');
    return this.webProjectService.remove(id);
  }
}

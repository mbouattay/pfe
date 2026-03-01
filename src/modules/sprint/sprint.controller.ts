import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { SprintService } from './sprint.service';
import { CreateSprintDto, UpdateSprintDto } from './sprint.dto';
import { ForbiddenException } from '@nestjs/common';

@Controller('sprints')
export class SprintController {
  constructor(private readonly sprintService: SprintService) {}

  @Post()
  create(
    @Body() dto: CreateSprintDto,
    @Req()
    req: {
      user: {
        role?: 'CLIENT' | 'EMPLOYER' | 'ADMIN';
        id?: number;
        sub?: number;
      };
    },
  ) {
    if (req.user?.role !== 'ADMIN') throw new ForbiddenException('Admin only');
    const userId = req.user?.sub ?? req.user?.id;
    if (userId === undefined)
      throw new ForbiddenException('User not identified');
    return this.sprintService.create(dto, userId);
  }

  @Get()
  findAll() {
    return this.sprintService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.sprintService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: { user: { role?: 'CLIENT' | 'EMPLOYER' | 'ADMIN' } },
    @Body() dto: UpdateSprintDto,
  ) {
    if (req.user?.role !== 'ADMIN') throw new ForbiddenException('Admin only');
    return this.sprintService.update(id, dto);
  }

  @Delete(':id')
  remove(
    @Req() req: { user: { role?: 'CLIENT' | 'EMPLOYER' | 'ADMIN' } },
    @Param('id', ParseIntPipe) id: number,
  ) {
    if (req.user?.role !== 'ADMIN') throw new ForbiddenException('Admin only');
    return this.sprintService.remove(id);
  }
}

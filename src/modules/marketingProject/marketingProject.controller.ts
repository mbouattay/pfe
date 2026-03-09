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
import { MarketingProjectService } from './marketingProject.service';
import {
  CreateMarketingProjectDto,
  UpdateMarketingProjectDto,
} from './marketingProject.dto';
import { ForbiddenException, Req } from '@nestjs/common';

@Controller('marketing-projects')
export class MarketingProjectController {
  constructor(
    private readonly marketingProjectService: MarketingProjectService,
  ) {}

  @Post()
  create(
    @Req() req: { user: { role?: 'CLIENT' | 'EMPLOYEE' | 'ADMIN' } },
    @Body() dto: CreateMarketingProjectDto,
  ) {
    if (req.user?.role !== 'ADMIN') throw new ForbiddenException('Admin only');
    return this.marketingProjectService.create(dto);
  }

  @Get()
  findAll() {
    return this.marketingProjectService.findAll();
  }

  @Get('my-projects')
  findMyProjects(
    @Req()
    req: {
      user: { id: number; role?: 'CLIENT' | 'EMPLOYEE' | 'ADMIN' };
    },
  ) {
    if (req.user?.role === 'ADMIN') {
      return this.marketingProjectService.findAll();
    }
    return this.marketingProjectService.findMyProjects(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.marketingProjectService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: { user: { role?: 'CLIENT' | 'EMPLOYEE' | 'ADMIN' } },
    @Body() dto: UpdateMarketingProjectDto,
  ) {
    if (req.user?.role !== 'ADMIN') throw new ForbiddenException('Admin only');
    return this.marketingProjectService.update(id, dto);
  }

  @Delete(':id')
  remove(
    @Req() req: { user: { role?: 'CLIENT' | 'EMPLOYEE' | 'ADMIN' } },
    @Param('id', ParseIntPipe) id: number,
  ) {
    if (req.user?.role !== 'ADMIN') throw new ForbiddenException('Admin only');
    return this.marketingProjectService.remove(id);
  }
}

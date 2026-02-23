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
import { Public } from 'src/common/decorators/public.decorator';

@Controller('marketing-projects')
export class MarketingProjectController {
  constructor(
    private readonly marketingProjectService: MarketingProjectService,
  ) {}

  @Post()
  @Public()
  create(@Body() dto: CreateMarketingProjectDto) {
    return this.marketingProjectService.create(dto);
  }

  @Get()
  @Public()
  findAll() {
    return this.marketingProjectService.findAll();
  }

  @Patch(':id')
  @Public()
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMarketingProjectDto,
  ) {
    return this.marketingProjectService.update(id, dto);
  }

  @Delete(':id')
  @Public()
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.marketingProjectService.remove(id);
  }
}

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
import { SprintService } from './sprint.service';
import { CreateSprintDto, UpdateSprintDto } from './sprint.dto';
import { Public } from 'src/common/decorators/public.decorator';

@Controller('sprints')
export class SprintController {
  constructor(private readonly sprintService: SprintService) {}

  @Post()
  @Public()
  create(@Body() dto: CreateSprintDto) {
    return this.sprintService.create(dto);
  }

  @Get()
  @Public()
  findAll() {
    return this.sprintService.findAll();
  }

  @Get(':id')
  @Public()
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.sprintService.findOne(id);
  }

  @Patch(':id')
  @Public()
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSprintDto,
  ) {
    return this.sprintService.update(id, dto);
  }

  @Delete(':id')
  @Public()
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.sprintService.remove(id);
  }
}

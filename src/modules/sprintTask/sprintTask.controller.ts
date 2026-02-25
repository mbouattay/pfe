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
import { SprintTaskService } from './sprintTask.service';
import {
  CreateSprintTaskDto,
  UpdateSprintTaskDto,
} from './sprintTask.dto';
import { Public } from 'src/common/decorators/public.decorator';

@Controller('sprint-tasks')
export class SprintTaskController {
  constructor(private readonly sprintTaskService: SprintTaskService) {}

  @Post()
  @Public()
  create(@Body() dto: CreateSprintTaskDto) {
    return this.sprintTaskService.create(dto);
  }

  @Get()
  @Public()
  findAll() {
    return this.sprintTaskService.findAll();
  }

  @Get(':id')
  @Public()
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.sprintTaskService.findOne(id);
  }

  @Patch(':id')
  @Public()
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSprintTaskDto,
  ) {
    return this.sprintTaskService.update(id, dto);
  }

  @Delete(':id')
  @Public()
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.sprintTaskService.remove(id);
  }
}

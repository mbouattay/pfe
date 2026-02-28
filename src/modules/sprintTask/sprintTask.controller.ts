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

@Controller('sprint-tasks')
export class SprintTaskController {
  constructor(private readonly sprintTaskService: SprintTaskService) {}

  @Post()
  create(@Body() dto: CreateSprintTaskDto) {
    return this.sprintTaskService.create(dto);
  }

  @Get()
  findAll() {
    return this.sprintTaskService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.sprintTaskService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSprintTaskDto,
  ) {
    return this.sprintTaskService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.sprintTaskService.remove(id);
  }
}

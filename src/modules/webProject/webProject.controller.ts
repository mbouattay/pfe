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
import { Public } from 'src/common/decorators/public.decorator';

@Controller('web-projects')
export class WebProjectController {
  constructor(private readonly webProjectService: WebProjectService) {}

  @Post()
  @Public()
  create(@Body() dto: CreateWebProjectDto) {
    return this.webProjectService.create(dto);
  }

  @Get()
  @Public()
  findAll() {
    return this.webProjectService.findAll();
  }

  @Patch(':id')
  @Public()
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateWebProjectDto,
  ) {
    return this.webProjectService.update(id, dto);
  }

  @Delete(':id')
  @Public()
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.webProjectService.remove(id);
  }
}

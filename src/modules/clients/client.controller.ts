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
import { ClientService } from './client.service';
import { CreateClientDto, UpdateClientDto } from './client.dto';
import { Public } from 'src/common/decorators/public.decorator';

@Controller('clients')
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Post()
  @Public()
  create(@Body() dto: CreateClientDto) {
    return this.clientService.create(dto);
  }

  @Get()
  @Public()
  findAll() {
    return this.clientService.findAll();
  }

  @Get(':id')
   @Public()
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.clientService.findOne(id);
  }

  @Patch(':id')
   @Public()
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateClientDto,
  ) {
    return this.clientService.update(id, dto);
  }

  @Delete(':id')
   @Public()
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.clientService.remove(id);
  }
}

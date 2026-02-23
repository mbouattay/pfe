import { Module } from '@nestjs/common';
import { WebProjectController } from './webProject.controller';
import { WebProjectService } from './webProject.service';

@Module({
  controllers: [WebProjectController],
  providers: [WebProjectService],
  exports: [WebProjectService],
})
export class WebProjectModule {}

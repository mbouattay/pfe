import { Module } from '@nestjs/common';
import { MarketingProjectController } from './marketingProject.controller';
import { MarketingProjectService } from './marketingProject.service';

@Module({
  controllers: [MarketingProjectController],
  providers: [MarketingProjectService],
  exports: [MarketingProjectService],
})
export class MarketingProjectModule {}

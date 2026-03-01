import { Controller, Get, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get('dashboard/summary')
  async summary(
    @Query('period') period: 'today' | 'week' | 'month' | 'custom' = 'month',
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.analytics.dashboardSummary({ period, fromDate, toDate });
  }
}

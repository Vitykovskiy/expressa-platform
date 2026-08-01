import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { ObservabilityMetrics } from '../observability/observability-metrics.service';

@Controller('health')
export class HealthController {
  constructor(
    private readonly database: DatabaseService,
    private readonly metrics: ObservabilityMetrics,
  ) {}

  @Get('live')
  getLiveness(): { status: 'ok' } {
    return { status: 'ok' };
  }

  @Get('ready')
  async getReadiness(): Promise<{ status: 'ok' }> {
    try {
      await this.database.connectionPool.query('SELECT 1');
      return { status: 'ok' };
    } catch {
      this.metrics.recordReadinessFailure();
      throw new ServiceUnavailableException();
    }
  }
}

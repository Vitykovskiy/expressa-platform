import { Module } from '@nestjs/common';
import { ObservabilityLogger } from './observability-logger.service';
import { ObservabilityMetrics } from './observability-metrics.service';
import { RequestObservabilityMiddleware } from './request-observability.middleware';

@Module({
  providers: [
    ObservabilityLogger,
    ObservabilityMetrics,
    RequestObservabilityMiddleware,
  ],
  exports: [
    ObservabilityLogger,
    ObservabilityMetrics,
    RequestObservabilityMiddleware,
  ],
})
export class ObservabilityModule {}

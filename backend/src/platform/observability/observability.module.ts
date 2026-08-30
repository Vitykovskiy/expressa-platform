import { Controller, Get, Header, Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module";
import { DatabaseService } from "../database/database.service";
import { ObservabilityLogger } from "./observability-logger.service";
import { ObservabilityMetrics } from "./observability-metrics.service";
import { RequestObservabilityMiddleware } from "./request-observability.middleware";

@Controller("metrics")
export class MetricsController {
  constructor(
    private readonly database: DatabaseService,
    private readonly metrics: ObservabilityMetrics,
  ) {}

  @Get()
  @Header("Content-Type", "text/plain; version=0.0.4; charset=utf-8")
  async getMetrics(): Promise<string> {
    try {
      await this.database.connectionPool.query("SELECT 1");
      this.metrics.recordBackendReadiness(true);
    } catch {
      this.metrics.recordBackendReadiness(false);
    }

    return this.metrics.prometheus();
  }
}

@Module({
  imports: [DatabaseModule],
  controllers: [MetricsController],
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

import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module";
import { HealthController } from "./health.controller";
import { ObservabilityModule } from "../observability/observability.module";

@Module({
  imports: [DatabaseModule, ObservabilityModule],
  controllers: [HealthController],
})
export class HealthModule {}

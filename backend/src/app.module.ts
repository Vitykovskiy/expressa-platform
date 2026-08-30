import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { CatalogModule } from "./catalog/catalog.module";
import { OrdersModule } from "./orders/orders.module";
import { validateEnvironment } from "./platform/config/environment";
import { AuthModule } from "./auth/auth.module";
import { DatabaseModule } from "./platform/database/database.module";
import { HealthModule } from "./platform/health/health.module";
import { ObservabilityModule } from "./platform/observability/observability.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnvironment,
    }),
    AuthModule,
    CatalogModule,
    OrdersModule,
    DatabaseModule,
    HealthModule,
    ObservabilityModule,
  ],
})
export class AppModule {}

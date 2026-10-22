import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { DatabaseModule } from "../platform/database/database.module";
import { DatabaseService } from "../platform/database/database.service";
import { PostgresOperatingSettingsRepository } from "./adapters/postgres-operating-settings.repository";
import { ManageOperatingSettingsUseCase } from "./application/manage-operating-settings.use-case";
import { OperatingSettingsController } from "./transport/operating-settings.controller";

@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [OperatingSettingsController],
  providers: [
    {
      provide: ManageOperatingSettingsUseCase,
      inject: [DatabaseService],
      useFactory: (database: DatabaseService) =>
        new ManageOperatingSettingsUseCase(
          new PostgresOperatingSettingsRepository(
            () => database.connectionPool,
          ),
        ),
    },
  ],
})
export class ServiceSettingsModule {}

import { EmployeesController } from "./transport/employees.controller";
import { CustomersController } from "./transport/customers.controller";
import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { DatabaseModule } from "../platform/database/database.module";
import { DatabaseService } from "../platform/database/database.service";
import { PostgresStaffUsersRepository } from "./adapters/postgres-staff-users.repository";
import { ManageStaffUsersUseCase } from "./application/manage-staff-users.use-case";
import { StaffUsersController } from "./transport/staff-users.controller";

@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [StaffUsersController, EmployeesController, CustomersController],
  providers: [
    {
      provide: ManageStaffUsersUseCase,
      inject: [DatabaseService],
      useFactory: (database: DatabaseService) => {
        const repository = new PostgresStaffUsersRepository(
          () => database.connectionPool,
        );
        return new ManageStaffUsersUseCase(repository, repository);
      },
    },
  ],
})
export class StaffUsersModule {}

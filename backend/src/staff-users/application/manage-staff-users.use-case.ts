import {
  assertAccessChange,
  requireStaffUser,
  StaffUserError,
  isAccountRoleNoop,
} from "../domain/staff-user.policy";
import type {
  StaffUser,
  StaffUserFilter,
  Employee,
  EmployeeFilter,
  Customer,
} from "../domain/staff-user.types";
import type {
  ChangeStaffUserBlockCommand,
  ChangeStaffUserRoleCommand,
  CreateStaffUserCommand,
  EnrollEmployeeCommand,
  ChangeEmployeeRoleCommand,
  ChangeEmployeeAccessCommand,
  StaffUsersReader,
  StaffUsersTransaction,
  StaffUsersUnitOfWork,
  UserCommandContext,
} from "./staff-users.repository.types";

export class ManageStaffUsersUseCase {
  constructor(
    private readonly reader: StaffUsersReader,
    private readonly unitOfWork: StaffUsersUnitOfWork,
  ) {}

  list(filter: StaffUserFilter): Promise<StaffUser[]> {
    return this.reader.list(filter);
  }

  listEmployees(filter: EmployeeFilter): Promise<Employee[]> {
    return this.reader.listEmployees(filter);
  }

  listCustomers(search?: string): Promise<Customer[]> {
    return this.reader.listCustomers(search);
  }

  create(command: CreateStaffUserCommand): Promise<StaffUser> {
    return this.unitOfWork.run(async (repository) => {
      await repository.authorizeCommand(command, {
        phoneE164: command.phoneE164,
      });
      const after = await repository.create(command);
      await repository.writeAudit({
        ...command,
        action: "USER_CREATED",
        before: null,
        after,
      });
      return after;
    });
  }

  enrollEmployee(command: EnrollEmployeeCommand): Promise<Employee> {
    return this.unitOfWork.run(async (repository) => {
      await repository.authorizeCommand(command, {
        phoneE164: command.phoneE164,
        createAccount: true,
      });
      const { before, after } = await repository.enrollEmployee(command);
      await repository.revokeAccess(after.id, "staff");
      await repository.writeAudit({
        ...command,
        action: "EMPLOYEE_ENROLLED",
        before,
        after,
      });
      return this.requireEmployee(await repository.findEmployee(after.id));
    });
  }

  changeRole(command: ChangeStaffUserRoleCommand): Promise<StaffUser> {
    return this.unitOfWork.run(async (repository) => {
      const before = await this.lockTarget(repository, command);
      if (isAccountRoleNoop(before, command.role)) {
        return before;
      }
      assertAccessChange(
        before,
        command.actorId,
        command.role,
        before.blocked,
        await repository.countActiveAdministrators(),
      );
      const after = await repository.changeRole(
        before.id,
        command.role,
        command.actorId,
      );
      // Только customer-регистрация не отзывает независимые denied staff-сессии.
      const employeeChanged =
        before.employee?.role !== after.employee?.role ||
        before.employee?.accessEnabled !== after.employee?.accessEnabled;
      if (employeeChanged) {
        await repository.revokeAccess(before.id, "staff");
      }
      await repository.writeAudit({
        ...command,
        action: "USER_ROLE_CHANGED",
        before,
        after,
      });
      return after;
    });
  }

  changeEmployeeRole(command: ChangeEmployeeRoleCommand): Promise<Employee> {
    return this.unitOfWork.run(async (repository) => {
      const before = await this.lockTarget(repository, command);
      const employee = this.requireEmployee(
        await repository.findEmployee(before.id),
      );
      if (employee.role === command.role) {
        return employee;
      }
      assertAccessChange(
        before,
        command.actorId,
        command.role,
        before.blocked || !employee.accessEnabled,
        await repository.countActiveAdministrators(),
      );
      const after = await repository.changeRole(
        before.id,
        command.role,
        command.actorId,
      );
      await repository.revokeAccess(before.id, "staff");
      await repository.writeAudit({
        ...command,
        action: "EMPLOYEE_ROLE_CHANGED",
        before,
        after,
      });
      return this.requireEmployee(await repository.findEmployee(before.id));
    });
  }

  changeEmployeeAccess(
    command: ChangeEmployeeAccessCommand,
  ): Promise<Employee> {
    return this.unitOfWork.run(async (repository) => {
      const before = await this.lockTarget(repository, command);
      const employee = this.requireEmployee(
        await repository.findEmployee(before.id),
      );
      if (command.enabled && before.blocked) {
        throw new StaffUserError("USER_ACCESS_CONFLICT");
      }
      if (employee.accessEnabled === command.enabled) {
        return employee;
      }
      assertAccessChange(
        before,
        command.actorId,
        employee.role,
        before.blocked || !command.enabled,
        await repository.countActiveAdministrators(),
      );
      const after = await repository.changeEmployeeAccess(
        before.id,
        command.enabled,
        command.actorId,
      );
      await repository.revokeAccess(before.id, "staff");
      await repository.writeAudit({
        ...command,
        action: command.enabled
          ? "EMPLOYEE_ACCESS_ENABLED"
          : "EMPLOYEE_ACCESS_DISABLED",
        before,
        after,
      });
      return this.requireEmployee(await repository.findEmployee(before.id));
    });
  }

  changeBlocked(command: ChangeStaffUserBlockCommand): Promise<StaffUser> {
    return this.unitOfWork.run(async (repository) => {
      const before = await this.lockTarget(repository, command);
      if (before.blocked === command.blocked) {
        return before;
      }
      assertAccessChange(
        before,
        command.actorId,
        before.employee?.role ?? "customer",
        command.blocked || before.employee?.accessEnabled !== true,
        await repository.countActiveAdministrators(),
      );
      const after = await repository.changeBlocked(
        before.id,
        command.blocked,
        command.actorId,
      );
      if (command.blocked) {
        await repository.revokeAccess(before.id);
      }
      await repository.writeAudit({
        ...command,
        action: command.blocked ? "USER_BLOCKED" : "USER_UNBLOCKED",
        before,
        after,
      });
      return after;
    });
  }

  private async lockTarget(
    repository: StaffUsersTransaction,
    command: UserCommandContext & { userId: string },
  ): Promise<StaffUser> {
    await repository.authorizeCommand(command, { userId: command.userId });
    return requireStaffUser(await repository.findById(command.userId));
  }

  private requireEmployee(employee: Employee | null): Employee {
    if (employee === null) {
      throw new StaffUserError("USER_NOT_FOUND");
    }
    return employee;
  }
}

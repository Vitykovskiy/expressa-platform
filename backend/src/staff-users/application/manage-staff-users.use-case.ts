import {
  assertAccessChange,
  assertActiveAdministrator,
  requireStaffUser,
} from "../domain/staff-user.policy";
import type { StaffUser, StaffUserFilter } from "../domain/staff-user.types";
import type {
  ChangeStaffUserBlockCommand,
  ChangeStaffUserRoleCommand,
  CreateStaffUserCommand,
  StaffUsersReader,
  StaffUsersUnitOfWork,
} from "./staff-users.repository.types";

export class ManageStaffUsersUseCase {
  constructor(
    private readonly reader: StaffUsersReader,
    private readonly unitOfWork: StaffUsersUnitOfWork,
  ) {}

  list(filter: StaffUserFilter): Promise<StaffUser[]> {
    return this.reader.list(filter);
  }

  create(command: CreateStaffUserCommand): Promise<StaffUser> {
    return this.unitOfWork.run(async (repository) => {
      assertActiveAdministrator(await repository.findById(command.actorId));
      const user = await repository.create(command);
      await repository.writeAudit({
        ...command,
        action: "USER_CREATED",
        before: null,
        after: user,
      });
      return user;
    });
  }

  changeRole(command: ChangeStaffUserRoleCommand): Promise<StaffUser> {
    return this.unitOfWork.run(async (repository) => {
      assertActiveAdministrator(await repository.findById(command.actorId));
      const before = requireStaffUser(
        await repository.findById(command.userId),
      );
      assertAccessChange(
        before,
        command.actorId,
        command.role,
        before.blocked,
        await repository.countActiveAdministrators(),
      );
      if (before.role === command.role) {
        return before;
      }

      const after = await repository.changeRole(before.id, command.role);
      await repository.revokeAccess(before.id);
      await repository.writeAudit({
        ...command,
        action: "USER_ROLE_CHANGED",
        before,
        after,
      });
      return after;
    });
  }

  changeBlocked(command: ChangeStaffUserBlockCommand): Promise<StaffUser> {
    return this.unitOfWork.run(async (repository) => {
      assertActiveAdministrator(await repository.findById(command.actorId));
      const before = requireStaffUser(
        await repository.findById(command.userId),
      );
      assertAccessChange(
        before,
        command.actorId,
        before.role,
        command.blocked,
        await repository.countActiveAdministrators(),
      );
      if (before.blocked === command.blocked) {
        return before;
      }

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
}

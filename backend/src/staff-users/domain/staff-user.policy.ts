import type { UserRole } from "../../auth/domain/auth.types";
import type { StaffUser, StaffUserErrorCode } from "./staff-user.types";

export class StaffUserError extends Error {
  constructor(readonly code: StaffUserErrorCode) {
    super(code);
  }
}

export function assertActiveAdministrator(user: StaffUser | null): void {
  if (
    user === null ||
    user.blocked ||
    user.employee?.role !== "administrator" ||
    !user.employee.accessEnabled
  ) {
    throw new StaffUserError("USER_ACCESS_DENIED");
  }
}

export function requireStaffUser(user: StaffUser | null): StaffUser {
  if (user === null) {
    throw new StaffUserError("USER_NOT_FOUND");
  }
  return user;
}

export function assertAccessChange(
  user: StaffUser,
  actorId: string,
  nextRole: UserRole,
  nextBlocked: boolean,
  activeAdministratorCount: number,
): void {
  const removesAdministrator = nextBlocked || nextRole !== "administrator";
  if (user.id === actorId && removesAdministrator) {
    throw new StaffUserError("USER_ACCESS_CONFLICT");
  }
  if (
    user.employee?.role === "administrator" &&
    user.employee.accessEnabled &&
    !user.blocked &&
    removesAdministrator &&
    activeAdministratorCount <= 1
  ) {
    throw new StaffUserError("USER_ACCESS_CONFLICT");
  }
}

/** Опубликованная account-команда — no-op только при уже достигнутом состоянии участий. */
export function isAccountRoleNoop(user: StaffUser, role: UserRole): boolean {
  if (role === "customer") {
    return (
      (user.employee === null || !user.employee.accessEnabled) &&
      (user.name === null || user.customer !== null)
    );
  }
  return user.employee?.role === role;
}

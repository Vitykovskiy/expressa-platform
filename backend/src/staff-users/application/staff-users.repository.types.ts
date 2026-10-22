import type { UserRole } from "../../auth/domain/auth.types";
import type {
  StaffUser,
  StaffUserDetails,
  StaffUserFilter,
} from "../domain/staff-user.types";

export type UserCommandContext = { actorId: string; requestId: string };
export type CreateStaffUserCommand = UserCommandContext & StaffUserDetails;
export type ChangeStaffUserRoleCommand = UserCommandContext & {
  userId: string;
  role: UserRole;
};
export type ChangeStaffUserBlockCommand = UserCommandContext & {
  userId: string;
  blocked: boolean;
};
export type StaffUserAudit = UserCommandContext & {
  action:
    "USER_CREATED" | "USER_ROLE_CHANGED" | "USER_BLOCKED" | "USER_UNBLOCKED";
  before: StaffUser | null;
  after: StaffUser;
};

export type OperationsUserCreation = { created: boolean; user: StaffUser };

export interface StaffUsersReader {
  list(filter: StaffUserFilter): Promise<StaffUser[]>;
}

export interface StaffUsersTransaction {
  findById(id: string): Promise<StaffUser | null>;
  findOrCreateForOperations(
    phoneE164: string,
    role: UserRole,
  ): Promise<OperationsUserCreation>;
  countActiveAdministrators(): Promise<number>;
  create(details: StaffUserDetails): Promise<StaffUser>;
  changeRole(userId: string, role: UserRole): Promise<StaffUser>;
  changeBlocked(
    userId: string,
    blocked: boolean,
    actorId: string,
  ): Promise<StaffUser>;
  revokeAccess(userId: string): Promise<void>;
  writeAudit(event: StaffUserAudit): Promise<void>;
}

export interface StaffUsersUnitOfWork {
  run<Result>(
    operation: (repository: StaffUsersTransaction) => Promise<Result>,
  ): Promise<Result>;
}

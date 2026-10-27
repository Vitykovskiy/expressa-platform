import type { StaffRole, UserRole } from "../../auth/domain/auth.types";
import type {
  StaffUser,
  StaffUserDetails,
  StaffUserFilter,
  Employee,
  EmployeeDetails,
  EmployeeFilter,
  Customer,
} from "../domain/staff-user.types";

export type UserCommandTarget = {
  userId?: string;
  phoneE164?: string;
  createAccount?: boolean;
};
export type UserCommandContext = {
  actorId: string;
  sessionId: string;
  requestId: string;
};
export type CreateStaffUserCommand = UserCommandContext & StaffUserDetails;
export type EnrollEmployeeCommand = UserCommandContext & EmployeeDetails;
export type ChangeStaffUserRoleCommand = UserCommandContext & {
  userId: string;
  role: UserRole;
};
export type ChangeEmployeeRoleCommand = UserCommandContext & {
  userId: string;
  role: StaffRole;
};
export type ChangeEmployeeAccessCommand = UserCommandContext & {
  userId: string;
  enabled: boolean;
};
export type ChangeStaffUserBlockCommand = UserCommandContext & {
  userId: string;
  blocked: boolean;
};
export type StaffUserAudit = {
  actorId: string;
  requestId: string;
  action:
    | "USER_CREATED"
    | "USER_ROLE_CHANGED"
    | "USER_BLOCKED"
    | "USER_UNBLOCKED"
    | "EMPLOYEE_ENROLLED"
    | "EMPLOYEE_ROLE_CHANGED"
    | "EMPLOYEE_ACCESS_DISABLED"
    | "EMPLOYEE_ACCESS_ENABLED";
  before: StaffUser | null;
  after: StaffUser;
};
export type OperationsUserCreation = { created: boolean; user: StaffUser };
export interface StaffUsersReader {
  list(filter: StaffUserFilter): Promise<StaffUser[]>;
  listEmployees(filter: EmployeeFilter): Promise<Employee[]>;
  listCustomers(search?: string): Promise<Customer[]>;
}

export interface StaffUsersTransaction {
  authorizeCommand(
    context: UserCommandContext,
    target: UserCommandTarget,
  ): Promise<void>;
  findById(id: string): Promise<StaffUser | null>;
  findOrCreateForOperations(
    phoneE164: string,
    role: UserRole,
  ): Promise<OperationsUserCreation>;
  countActiveAdministrators(): Promise<number>;
  create(details: StaffUserDetails): Promise<StaffUser>;
  enrollEmployee(
    details: EmployeeDetails,
  ): Promise<{ before: StaffUser; after: StaffUser }>;
  findEmployee(userId: string): Promise<Employee | null>;
  changeRole(
    userId: string,
    role: UserRole,
    actorId: string,
  ): Promise<StaffUser>;
  changeEmployeeAccess(
    userId: string,
    enabled: boolean,
    actorId: string,
  ): Promise<StaffUser>;
  changeBlocked(
    userId: string,
    blocked: boolean,
    actorId: string,
  ): Promise<StaffUser>;
  revokeAccess(userId: string, context?: "staff"): Promise<void>;
  writeAudit(event: StaffUserAudit): Promise<void>;
}

export interface StaffUsersUnitOfWork {
  run<Result>(
    operation: (repository: StaffUsersTransaction) => Promise<Result>,
  ): Promise<Result>;
}

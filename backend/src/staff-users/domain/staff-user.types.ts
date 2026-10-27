import type {
  CustomerMembership,
  EmployeeMembership,
  StaffRole,
  UserRole,
} from "../../auth/domain/auth.types";

/** Представление аккаунта; совместимый role строится только в transport. */
export type StaffUser = {
  id: string;
  name: string | null;
  phoneE164: string;
  customer: CustomerMembership | null;
  employee: EmployeeMembership | null;
  blocked: boolean;
  createdAt: Date;
  updatedAt: Date;
};
export type Employee = {
  id: string;
  name: string | null;
  phoneE164: string;
  role: StaffRole;
  accessEnabled: boolean;
  accountBlocked: boolean;
  createdAt: Date;
  updatedAt: Date;
};
export type Customer = {
  id: string;
  name: string;
  phoneE164: string;
  registeredAt: Date;
};
export type StaffUserDetails = {
  name: string;
  phoneE164: string;
  role: UserRole;
};
export type EmployeeDetails = Omit<StaffUserDetails, "role"> & {
  role: StaffRole;
};
export type StaffUserFilter = {
  search?: string;
  role?: UserRole;
  blocked?: boolean;
};
export type EmployeeFilter = {
  search?: string;
  role?: StaffRole;
  blocked?: boolean;
};
export type StaffUserErrorCode =
  | "USER_NOT_FOUND"
  | "USER_PHONE_CONFLICT"
  | "USER_NAME_CONFLICT"
  | "USER_ACCESS_CONFLICT"
  | "USER_ACCESS_DENIED"
  | "USER_SESSION_INVALID";

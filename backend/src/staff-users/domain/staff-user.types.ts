import type { UserRole } from "../../auth/domain/auth.types";

export type StaffUser = {
  id: string;
  name: string | null;
  phoneE164: string;
  role: UserRole;
  blocked: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type StaffUserDetails = {
  name: string;
  phoneE164: string;
  role: UserRole;
};

export type StaffUserFilter = {
  search?: string;
  role?: UserRole;
  blocked?: boolean;
};

export type StaffUserErrorCode =
  | "USER_NOT_FOUND"
  | "USER_PHONE_CONFLICT"
  | "USER_ACCESS_CONFLICT"
  | "USER_ACCESS_DENIED";

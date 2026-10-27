import type { rolePolicies, userRoles } from "./auth.constants";

export type UserRole = (typeof userRoles)[number];

export type RolePolicy = (typeof rolePolicies)[number];

export type OtpChallenge = {
  expiresAt: Date;
  consumedAt: Date | null;
  sentAt: Date;
  attempts: number;
};

export type AuthContext = "customer" | "staff";
export type StaffRole = "barista" | "administrator";
export type CustomerMembership = { registeredAt: Date };
export type EmployeeMembership = { role: StaffRole; accessEnabled: boolean };
export type AuthIdentity = {
  context: AuthContext;
  customer: CustomerMembership | null;
  employee: EmployeeMembership | null;
};

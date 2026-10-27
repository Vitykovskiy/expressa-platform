import { HttpException, HttpStatus } from "@nestjs/common";
import type { StaffRole, UserRole } from "../../auth/domain/auth.types";
import type {
  StaffUserDetails,
  StaffUserFilter,
  EmployeeDetails,
  EmployeeFilter,
} from "../domain/staff-user.types";
import {
  userIdPattern,
  userPhonePattern,
} from "./staff-users.validation.constants";

export function invalidUserField(path: string): HttpException {
  return new HttpException(
    {
      code: "VALIDATION_ERROR",
      message: "Invalid user request.",
      details: { fields: [{ path, reason: "Invalid value" }] },
    },
    HttpStatus.BAD_REQUEST,
  );
}

export function parseUserId(value: unknown): string {
  if (typeof value !== "string" || !userIdPattern.test(value)) {
    throw invalidUserField("userId");
  }
  return value;
}

export function parseUserRole(value: unknown): UserRole {
  if (!(
    value === "customer" ||
    value === "barista" ||
    value === "administrator"
  )) {
    throw invalidUserField("role");
  }
  return value;
}

export function parseCreateUser(body: unknown): StaffUserDetails {
  const record = parseUserBody(body, ["name", "phoneE164", "role"]);
  const { name, phoneE164 } = record;
  if (typeof name !== "string" || name.trim() === "") {
    throw invalidUserField("name");
  }
  if (typeof phoneE164 !== "string" || !userPhonePattern.test(phoneE164)) {
    throw invalidUserField("phoneE164");
  }
  return { name: name.trim(), phoneE164, role: parseUserRole(record.role) };
}

export function parseUserBody(
  body: unknown,
  keys: readonly string[],
): Record<string, unknown> {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw invalidUserField("body");
  }
  const record: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body)) {
    if (!keys.includes(key)) {
      throw invalidUserField(key);
    }
    record[key] = value;
  }
  return record;
}

export function parseUsersQuery(query: unknown): StaffUserFilter {
  if (typeof query !== "object" || query === null || Array.isArray(query)) {
    throw invalidUserField("query");
  }
  const filter: StaffUserFilter = {};
  for (const [key, value] of Object.entries(query)) {
    if (typeof value !== "string") {
      throw invalidUserField(key);
    }
    if (key === "search") {
      filter.search = value;
    } else if (key === "role") {
      filter.role = parseUserRole(value);
    } else if (key === "blocked" && (value === "true" || value === "false")) {
      filter.blocked = value === "true";
    } else {
      throw invalidUserField(key);
    }
  }
  return filter;
}

export function parseStaffRole(value: unknown): StaffRole {
  if (value !== "barista" && value !== "administrator") {
    throw invalidUserField("role");
  }
  return value;
}

export function parseEnrollEmployee(body: unknown): EmployeeDetails {
  const details = parseCreateUser(body);
  return { ...details, role: parseStaffRole(details.role) };
}

export function parseEmployeesQuery(query: unknown): EmployeeFilter {
  const filter = parseUsersQuery(query);
  const { role, ...rest } = filter;
  return role === undefined ? rest : { ...rest, role: parseStaffRole(role) };
}

export function parseCustomersQuery(query: unknown): { search?: string } {
  if (typeof query !== "object" || query === null || Array.isArray(query)) {
    throw invalidUserField("query");
  }
  const filter: { search?: string } = {};
  for (const [key, value] of Object.entries(query)) {
    if (key !== "search" || typeof value !== "string") {
      throw invalidUserField(key);
    }
    filter.search = value;
  }
  return filter;
}

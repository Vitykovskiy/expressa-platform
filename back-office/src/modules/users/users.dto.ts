import {
  USER_ID_PATTERN,
  USER_PHONE_PATTERN,
  USER_TIMESTAMP_PATTERN,
} from "./users.constants";
import type { StaffUserDto } from "./users.types";

function isUserTimestamp(value: unknown): value is string {
  if (
    typeof value !== "string" ||
    !USER_TIMESTAMP_PATTERN.test(value) ||
    !Number.isFinite(Date.parse(value))
  ) {
    return false;
  }

  const calendarDate = value.slice(0, 10);

  // Date.parse допускает нормализацию несуществующего дня месяца.
  return (
    new Date(`${calendarDate}T00:00:00Z`).toISOString().slice(0, 10) ===
    calendarDate
  );
}

export function parseStaffUser(value: unknown): StaffUserDto | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  if (
    !("id" in value) ||
    typeof value.id !== "string" ||
    !USER_ID_PATTERN.test(value.id)
  ) {
    return null;
  }

  if (
    !("name" in value) ||
    !(
      value.name === null ||
      (typeof value.name === "string" && value.name.trim() !== "")
    )
  ) {
    return null;
  }

  if (
    !("phoneE164" in value) ||
    typeof value.phoneE164 !== "string" ||
    !USER_PHONE_PATTERN.test(value.phoneE164)
  ) {
    return null;
  }

  if (
    !("role" in value) ||
    !(
      value.role === "customer" ||
      value.role === "barista" ||
      value.role === "administrator"
    )
  ) {
    return null;
  }

  if (!("blocked" in value) || typeof value.blocked !== "boolean") {
    return null;
  }

  if (
    !("createdAt" in value) ||
    !isUserTimestamp(value.createdAt) ||
    !("updatedAt" in value) ||
    !isUserTimestamp(value.updatedAt)
  ) {
    return null;
  }

  return {
    id: value.id,
    name: value.name,
    phoneE164: value.phoneE164,
    role: value.role,
    blocked: value.blocked,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}

export function parseStaffUsers(
  value: unknown,
): readonly StaffUserDto[] | null {
  if (
    typeof value !== "object" ||
    value === null ||
    !("users" in value) ||
    !Array.isArray(value.users)
  ) {
    return null;
  }

  const users: StaffUserDto[] = [];
  const ids = new Set<string>();

  for (const row of value.users) {
    const user = parseStaffUser(row);

    if (user === null || ids.has(user.id)) {
      return null;
    }

    ids.add(user.id);
    users.push(user);
  }

  return users;
}

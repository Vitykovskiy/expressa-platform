import type { AuthContext, AuthIdentity } from "../domain/auth.types";
import type { DatabaseRow } from "./postgres-auth.repository.types";

export function readAuthContext(value: unknown): AuthContext {
  if (value !== "customer" && value !== "staff") {
    throw new Error("Invalid stored authentication context.");
  }
  return value;
}

export function readAccountMemberships(
  row: DatabaseRow,
  context: AuthContext,
): AuthIdentity {
  const registeredAt = row.registered_at;
  const role = row.employee_role;
  const disabledAt = row.access_disabled_at;
  if (
    registeredAt !== null &&
    (!(registeredAt instanceof Date) || Number.isNaN(registeredAt.getTime()))
  ) {
    throw new Error("Invalid customer membership timestamp.");
  }
  if (role !== null && role !== "barista" && role !== "administrator") {
    throw new Error("Invalid employee membership role.");
  }
  if (
    disabledAt !== null &&
    (!(disabledAt instanceof Date) || Number.isNaN(disabledAt.getTime()))
  ) {
    throw new Error("Invalid employee access timestamp.");
  }
  if (role === null && disabledAt !== null) {
    throw new Error("Employee access without membership.");
  }
  return {
    context,
    customer: registeredAt === null ? null : { registeredAt },
    employee:
      role === null ? null : { role, accessEnabled: disabledAt === null },
  };
}

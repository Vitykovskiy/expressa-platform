import {
  USER_ID_PATTERN,
  USER_PHONE_PATTERN,
  USER_TIMESTAMP_PATTERN,
} from "./users.constants";
import type { EmployeeDto, CustomerDto } from "./users.types";

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

export function parseEmployee(value: unknown): EmployeeDto | null {
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
    !(value.role === "barista" || value.role === "administrator")
  ) {
    return null;
  }

  if (
    !("accessEnabled" in value) ||
    typeof value.accessEnabled !== "boolean" ||
    !("accountBlocked" in value) ||
    typeof value.accountBlocked !== "boolean"
  ) {
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
    accessEnabled: value.accessEnabled,
    accountBlocked: value.accountBlocked,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}

export function parseEmployees(value: unknown): readonly EmployeeDto[] | null {
  if (
    typeof value !== "object" ||
    value === null ||
    !("employees" in value) ||
    !Array.isArray(value.employees)
  ) {
    return null;
  }

  const employees: EmployeeDto[] = [];
  const ids = new Set<string>();

  for (const row of value.employees) {
    const employee = parseEmployee(row);

    if (employee === null || ids.has(employee.id)) {
      return null;
    }

    ids.add(employee.id);
    employees.push(employee);
  }

  return employees;
}

export function parseCustomers(value: unknown): readonly CustomerDto[] | null {
  if (
    typeof value !== "object" ||
    value === null ||
    !("customers" in value) ||
    !Array.isArray(value.customers)
  ) {
    return null;
  }

  const customers: CustomerDto[] = [];
  const ids = new Set<string>();

  for (const row of value.customers) {
    if (
      typeof row !== "object" ||
      row === null ||
      Array.isArray(row) ||
      !("id" in row) ||
      typeof row.id !== "string" ||
      !USER_ID_PATTERN.test(row.id) ||
      !("name" in row) ||
      typeof row.name !== "string" ||
      row.name.trim() === "" ||
      !("phoneE164" in row) ||
      typeof row.phoneE164 !== "string" ||
      !USER_PHONE_PATTERN.test(row.phoneE164) ||
      !("registeredAt" in row) ||
      !isUserTimestamp(row.registeredAt) ||
      ids.has(row.id)
    ) {
      return null;
    }

    ids.add(row.id);
    customers.push({
      id: row.id,
      name: row.name,
      phoneE164: row.phoneE164,
      registeredAt: row.registeredAt,
    });
  }

  return customers;
}

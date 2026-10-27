import { requestApi } from "../../shared/api/request";
import { parseApiHttpError } from "../../shared/api/http-error";
import type { ApiResult } from "../../shared/api/request.types";
import {
  EMPLOYEES_ENDPOINT,
  CUSTOMERS_ENDPOINT,
  USER_COMMAND_ERRORS,
} from "./users.constants";
import { parseEmployee, parseEmployees, parseCustomers } from "./users.dto";
import { mapEmployee, mapCustomer } from "./users.mapper";
import type {
  EmployeeDto,
  EmployeesQuery,
  EmployeeCommand,
  EmployeeCommandOutcome,
  EmployeeCommandRequest,
  EmployeesReadOutcome,
  CustomersReadOutcome,
} from "./users.types";

function isSessionDenied(result: ApiResult) {
  return "status" in result && (result.status === 401 || result.status === 403);
}

export async function readEmployees(
  accessToken: string,
  query: EmployeesQuery,
  signal: AbortSignal,
): Promise<EmployeesReadOutcome> {
  const parameters = new URLSearchParams();

  if (query.search !== "") {
    parameters.set("search", query.search);
  }

  if (query.role !== undefined) {
    parameters.set("role", query.role);
  }

  if (query.blocked !== undefined) {
    parameters.set("blocked", String(query.blocked));
  }

  const suffix = parameters.size === 0 ? "" : `?${parameters.toString()}`;
  const result = await requestApi(`${EMPLOYEES_ENDPOINT}${suffix}`, {
    method: "GET",
    accessToken,
    signal,
  });

  if (isSessionDenied(result)) {
    return { kind: "session-expired" };
  }

  if (result.kind === "aborted") {
    return { kind: "cancelled" };
  }

  if (result.kind !== "http" || result.status !== 200) {
    return { kind: "failed" };
  }

  const employees = parseEmployees(result.body);

  if (employees === null) {
    return { kind: "failed" };
  }

  return { kind: "loaded", employees: employees.map(mapEmployee) };
}

export async function readCustomers(
  accessToken: string,
  search: string,
  signal: AbortSignal,
): Promise<CustomersReadOutcome> {
  const parameters = new URLSearchParams();

  if (search !== "") {
    parameters.set("search", search);
  }

  const suffix = parameters.size === 0 ? "" : `?${parameters.toString()}`;
  const result = await requestApi(`${CUSTOMERS_ENDPOINT}${suffix}`, {
    method: "GET",
    accessToken,
    signal,
  });

  if (isSessionDenied(result)) {
    return { kind: "session-expired" };
  }

  if (result.kind === "aborted") {
    return { kind: "cancelled" };
  }

  if (result.kind !== "http" || result.status !== 200) {
    return { kind: "failed" };
  }

  const customers = parseCustomers(result.body);

  return customers === null
    ? { kind: "failed" }
    : { kind: "loaded", customers: customers.map(mapCustomer) };
}

export async function sendEmployeeCommand(
  accessToken: string,
  command: EmployeeCommand,
  signal: AbortSignal,
): Promise<EmployeeCommandOutcome> {
  const request = buildEmployeeCommandRequest(command);
  const result = await requestApi(request.path, {
    method: request.method,
    accessToken,
    signal,
    body: request.body,
  });

  if (isSessionDenied(result)) {
    return { kind: "session-expired" };
  }

  if (result.kind !== "http") {
    return { kind: "unknown" };
  }

  const user = parseEmployee(result.body);

  // Подтверждение требует ответа на исходную команду, одного HTTP-статуса мало.
  if (
    result.status === request.expectedStatus &&
    user !== null &&
    matchesCommand(user, command)
  ) {
    return { kind: "confirmed" };
  }

  const error = parseApiHttpError(result.body);
  const rejection =
    error === null ? undefined : USER_COMMAND_ERRORS[error.code];

  if (rejection !== undefined && rejection.status === result.status) {
    return { kind: "rejected", message: rejection.message };
  }

  return { kind: "unknown" };
}

function buildEmployeeCommandRequest(
  command: EmployeeCommand,
): EmployeeCommandRequest {
  if (command.kind === "create") {
    return {
      path: EMPLOYEES_ENDPOINT,
      method: "POST",
      body: {
        name: command.name,
        phoneE164: command.phoneE164,
        role: command.role,
      },
      expectedStatus: 201,
    };
  }

  const path = `${EMPLOYEES_ENDPOINT}/${encodeURIComponent(command.id)}/${command.kind}`;

  if (command.kind === "role") {
    return {
      path,
      method: "PATCH",
      body: { role: command.role },
      expectedStatus: 200,
    };
  }

  return {
    path,
    method: "PATCH",
    body: { enabled: command.enabled },
    expectedStatus: 200,
  };
}

function matchesCommand(user: EmployeeDto, command: EmployeeCommand) {
  if (command.kind === "create") {
    return (
      user.name === command.name &&
      user.phoneE164 === command.phoneE164 &&
      user.role === command.role &&
      user.accessEnabled &&
      !user.accountBlocked
    );
  }

  if (user.id !== command.id) {
    return false;
  }

  if (command.kind === "role") {
    return user.role === command.role;
  }

  // Глобальная блокировка не снимается рабочей командой enabled=true.
  return (
    user.accessEnabled === command.enabled &&
    (!command.enabled || !user.accountBlocked)
  );
}

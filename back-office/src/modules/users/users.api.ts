import { requestApi } from "../../shared/api/request";
import { parseApiHttpError } from "../../shared/api/http-error";
import type { ApiResult } from "../../shared/api/request.types";
import { USERS_ENDPOINT, USER_COMMAND_ERRORS } from "./users.constants";
import { parseStaffUser, parseStaffUsers } from "./users.dto";
import { mapStaffUser } from "./users.mapper";
import type {
  StaffUserDto,
  StaffUsersQuery,
  UserCommand,
  UserCommandOutcome,
  UserCommandRequest,
  UsersReadOutcome,
} from "./users.types";

function isSessionDenied(result: ApiResult) {
  return "status" in result && (result.status === 401 || result.status === 403);
}

export async function readStaffUsers(
  accessToken: string,
  query: StaffUsersQuery,
  signal: AbortSignal,
): Promise<UsersReadOutcome> {
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
  const result = await requestApi(`${USERS_ENDPOINT}${suffix}`, {
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

  const users = parseStaffUsers(result.body);

  if (users === null) {
    return { kind: "failed" };
  }

  return { kind: "loaded", users: users.map(mapStaffUser) };
}

export async function sendUserCommand(
  accessToken: string,
  command: UserCommand,
  signal: AbortSignal,
): Promise<UserCommandOutcome> {
  const request = buildUserCommandRequest(command);
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

  const user = parseStaffUser(result.body);

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

function buildUserCommandRequest(command: UserCommand): UserCommandRequest {
  if (command.kind === "create") {
    return {
      path: USERS_ENDPOINT,
      method: "POST",
      body: {
        name: command.name,
        phoneE164: command.phoneE164,
        role: command.role,
      },
      expectedStatus: 201,
    };
  }

  const path = `${USERS_ENDPOINT}/${encodeURIComponent(command.id)}/${command.kind}`;

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
    body: { blocked: command.blocked },
    expectedStatus: 200,
  };
}

function matchesCommand(user: StaffUserDto, command: UserCommand) {
  if (command.kind === "create") {
    return (
      user.name === command.name &&
      user.phoneE164 === command.phoneE164 &&
      user.role === command.role &&
      !user.blocked
    );
  }

  if (user.id !== command.id) {
    return false;
  }

  if (command.kind === "role") {
    return user.role === command.role;
  }

  return user.blocked === command.blocked;
}

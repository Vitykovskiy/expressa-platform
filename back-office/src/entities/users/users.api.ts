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
  UsersReadOutcome,
} from "./users.types";

function denied(result: ApiResult) {
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

  if (denied(result)) {
    return { kind: "session-expired" };
  }

  if (result.kind === "aborted") {
    return { kind: "cancelled" };
  }

  if (result.kind !== "http" || result.status !== 200) {
    return { kind: "failed" };
  }

  const users = parseStaffUsers(result.body);

  return users === null
    ? { kind: "failed" }
    : { kind: "loaded", users: users.map(mapStaffUser) };
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

  return (
    user.id === command.id &&
    (command.kind === "role"
      ? user.role === command.role
      : user.blocked === command.blocked)
  );
}

export async function sendUserCommand(
  accessToken: string,
  command: UserCommand,
  signal: AbortSignal,
): Promise<UserCommandOutcome> {
  const path =
    command.kind === "create"
      ? USERS_ENDPOINT
      : `${USERS_ENDPOINT}/${encodeURIComponent(command.id)}/${command.kind}`;
  const body =
    command.kind === "create"
      ? { name: command.name, phoneE164: command.phoneE164, role: command.role }
      : command.kind === "role"
        ? { role: command.role }
        : { blocked: command.blocked };
  const result = await requestApi(path, {
    method: command.kind === "create" ? "POST" : "PATCH",
    accessToken,
    signal,
    body,
  });

  if (denied(result)) {
    return { kind: "session-expired" };
  }

  if (result.kind !== "http") {
    return { kind: "unknown" };
  }

  const expectedStatus = command.kind === "create" ? 201 : 200;
  const user = parseStaffUser(result.body);

  if (
    result.status === expectedStatus &&
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

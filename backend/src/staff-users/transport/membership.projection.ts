import { HttpException, HttpStatus } from "@nestjs/common";
import { StaffUserError } from "../domain/staff-user.policy";
import type { Employee, StaffUser } from "../domain/staff-user.types";
import type { StaffUserDto } from "./staff-users.dto";
import type { EmployeeDto } from "./membership.dto";

export function toAccountDto(user: StaffUser): StaffUserDto {
  return {
    ...user,
    customer:
      user.customer === null
        ? null
        : { registeredAt: user.customer.registeredAt.toISOString() },
    role: user.employee?.accessEnabled ? user.employee.role : "customer",
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export function toEmployeeDto(employee: Employee): EmployeeDto {
  return {
    ...employee,
    createdAt: employee.createdAt.toISOString(),
    updatedAt: employee.updatedAt.toISOString(),
  };
}

export async function executeIdentityCommand<Result>(
  command: () => Promise<Result>,
): Promise<Result> {
  try {
    return await command();
  } catch (error) {
    if (!(error instanceof StaffUserError)) {
      throw error;
    }
    let status = HttpStatus.CONFLICT;
    let code: string = error.code;
    switch (error.code) {
      case "USER_NOT_FOUND":
        status = HttpStatus.NOT_FOUND;
        break;
      case "USER_ACCESS_DENIED":
        status = HttpStatus.FORBIDDEN;
        code = "ACCESS_DENIED";
        break;
      case "USER_SESSION_INVALID":
        status = HttpStatus.UNAUTHORIZED;
        code = "UNAUTHORIZED";
        break;
    }
    throw new HttpException(
      {
        code,
        message: error.message,
        details: null,
      },
      status,
    );
  }
}

export function parseCommandRequestId(request: {
  requestId?: unknown;
}): string {
  if (
    typeof request.requestId !== "string" ||
    request.requestId.trim() === ""
  ) {
    throw new Error("Missing request identifier.");
  }
  return request.requestId;
}

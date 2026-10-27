import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { CurrentAuth } from "../../auth/transport/current-auth.decorator";
import type { CurrentAuth as CurrentAuthData } from "../../auth/transport/current-auth.decorator.types";
import { Roles } from "../../auth/transport/roles.decorator";
import { RolesGuard } from "../../auth/transport/roles.guard";
import { SessionGuard } from "../../auth/transport/session.guard";
import { ApiHttpErrorDto } from "../../platform/observability/http-error.dto";
import { ManageStaffUsersUseCase } from "../application/manage-staff-users.use-case";
import {
  EmployeeDto,
  EmployeesResponseDto,
  EnrollEmployeeDto,
  ChangeEmployeeRoleDto,
  ChangeEmployeeAccessDto,
} from "./membership.dto";
import {
  parseEmployeesQuery,
  parseEnrollEmployee,
  parseStaffRole,
  parseUserBody,
  parseUserId,
  invalidUserField,
} from "./staff-users.validation";
import {
  executeIdentityCommand,
  toEmployeeDto,
  parseCommandRequestId,
} from "./membership.projection";
import type { StaffUsersRequestContext } from "./staff-users.controller.types";

@ApiTags("backoffice-employees")
@Controller("api/v3/backoffice/employees")
@UseGuards(SessionGuard, RolesGuard)
@Roles("Administrator")
@ApiBearerAuth()
@ApiResponse({ status: 400, type: ApiHttpErrorDto })
@ApiResponse({ status: 401, type: ApiHttpErrorDto })
@ApiResponse({ status: 403, type: ApiHttpErrorDto })
@ApiResponse({ status: 500, type: ApiHttpErrorDto })
export class EmployeesController {
  constructor(private readonly users: ManageStaffUsersUseCase) {}

  @Get()
  @ApiOperation({
    summary: "Список сотрудников",
    description:
      "Administrator; literal name/phone search. Strict single-value query. Ordered by name NULLS LAST, phoneE164, id.",
  })
  @ApiQuery({ name: "search", type: String, required: false })
  @ApiQuery({
    name: "role",
    enum: ["barista", "administrator"],
    required: false,
  })
  @ApiQuery({
    name: "blocked",
    type: Boolean,
    required: false,
    description:
      "Effective unavailable access: work disabled OR account globally blocked.",
  })
  @ApiResponse({ status: 200, type: EmployeesResponseDto })
  async list(@Query() query: unknown): Promise<EmployeesResponseDto> {
    return {
      employees: (
        await this.users.listEmployees(parseEmployeesQuery(query))
      ).map(toEmployeeDto),
    };
  }
  @Post()
  @ApiOperation({
    summary: "Добавить сотрудника",
    description:
      "Reuse same phone/account/customer history; canonical-name conflicts are explicit. Existing employee membership is a phone conflict, including disabled staff. Revokes prior denied staff sessions.",
  })
  @ApiResponse({ status: 201, type: EmployeeDto })
  @ApiResponse({
    status: 409,
    type: ApiHttpErrorDto,
    description:
      "USER_PHONE_CONFLICT | USER_NAME_CONFLICT | USER_ACCESS_CONFLICT",
  })
  async enroll(
    @Body() body: EnrollEmployeeDto,
    @CurrentAuth() auth: CurrentAuthData,
    @Req() request: StaffUsersRequestContext,
  ): Promise<EmployeeDto> {
    const details = parseEnrollEmployee(body);
    return executeIdentityCommand(async () =>
      toEmployeeDto(
        await this.users.enrollEmployee({
          ...details,
          actorId: auth.userId,
          sessionId: auth.sessionId,
          requestId: parseCommandRequestId(request),
        }),
      ),
    );
  }
  @Patch(":userId/role")
  @ApiParam({ name: "userId", format: "uuid" })
  @ApiOperation({
    summary: "Изменить рабочую роль",
    description:
      "Preserves membership access/customer data; real change atomically revokes staff sessions/push only. Self/last-admin protections apply; equal role is no-op.",
  })
  @ApiResponse({ status: 200, type: EmployeeDto })
  @ApiResponse({
    status: 404,
    type: ApiHttpErrorDto,
    description: "USER_NOT_FOUND",
  })
  @ApiResponse({
    status: 409,
    type: ApiHttpErrorDto,
    description: "USER_ACCESS_CONFLICT",
  })
  async changeRole(
    @Param("userId") userId: string,
    @Body() body: ChangeEmployeeRoleDto,
    @CurrentAuth() auth: CurrentAuthData,
    @Req() request: StaffUsersRequestContext,
  ): Promise<EmployeeDto> {
    const role = parseStaffRole(parseUserBody(body, ["role"]).role);
    return executeIdentityCommand(async () =>
      toEmployeeDto(
        await this.users.changeEmployeeRole({
          userId: parseUserId(userId),
          role,
          actorId: auth.userId,
          sessionId: auth.sessionId,
          requestId: parseCommandRequestId(request),
        }),
      ),
    );
  }
  @Patch(":userId/access")
  @ApiParam({ name: "userId", format: "uuid" })
  @ApiOperation({
    summary: "Изменить рабочий доступ",
    description:
      "Employment end retains employee role/customer history. Both transitions revoke staff sessions/push; re-enable never revives tokens. Global block prevents enable; this command does not globally block/unblock an account. Equal state is no-op.",
  })
  @ApiResponse({ status: 200, type: EmployeeDto })
  @ApiResponse({
    status: 404,
    type: ApiHttpErrorDto,
    description: "USER_NOT_FOUND",
  })
  @ApiResponse({
    status: 409,
    type: ApiHttpErrorDto,
    description: "USER_ACCESS_CONFLICT",
  })
  async changeAccess(
    @Param("userId") userId: string,
    @Body() body: ChangeEmployeeAccessDto,
    @CurrentAuth() auth: CurrentAuthData,
    @Req() request: StaffUsersRequestContext,
  ): Promise<EmployeeDto> {
    const { enabled } = parseUserBody(body, ["enabled"]);
    if (typeof enabled !== "boolean") {
      throw invalidUserField("enabled");
    }
    return executeIdentityCommand(async () =>
      toEmployeeDto(
        await this.users.changeEmployeeAccess({
          userId: parseUserId(userId),
          enabled,
          actorId: auth.userId,
          sessionId: auth.sessionId,
          requestId: parseCommandRequestId(request),
        }),
      ),
    );
  }
}

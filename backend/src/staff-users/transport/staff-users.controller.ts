import { toAccountDto, executeIdentityCommand } from "./membership.projection";
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
import { userRoles } from "../../auth/domain/auth.constants";
import {
  ApiHttpErrorDto,
  ApiValidationErrorDto,
} from "../../platform/observability/http-error.dto";
import { ManageStaffUsersUseCase } from "../application/manage-staff-users.use-case";
import type { StaffUser } from "../domain/staff-user.types";
import {
  ChangeStaffUserBlockDto,
  ChangeStaffUserRoleDto,
  CreateStaffUserDto,
  StaffUserDto,
  StaffUsersResponseDto,
} from "./staff-users.dto";
import type { StaffUsersRequestContext } from "./staff-users.controller.types";
import {
  invalidUserField,
  parseCreateUser,
  parseUserBody,
  parseUserId,
  parseUserRole,
  parseUsersQuery,
} from "./staff-users.validation";

@ApiTags("backoffice-users")
@Controller("api/v3/backoffice/users")
@UseGuards(SessionGuard, RolesGuard)
@Roles("Administrator")
@ApiBearerAuth()
@ApiResponse({ status: 400, type: ApiValidationErrorDto })
@ApiResponse({ status: 401, type: ApiHttpErrorDto })
@ApiResponse({ status: 403, type: ApiHttpErrorDto })
@ApiResponse({ status: 500, type: ApiHttpErrorDto })
export class StaffUsersController {
  constructor(private readonly users: ManageStaffUsersUseCase) {}

  @Get()
  @ApiOperation({
    summary: "Список аккаунтов",
    description:
      "Published account projection: enabled employee role, otherwise customer; blocked is GLOBAL account block. Customer and employee memberships are independent required fields. New UI uses explicit employees/customers resources.",
  })
  @ApiQuery({
    name: "search",
    type: String,
    required: false,
    description: "Literal name or phone substring",
  })
  @ApiQuery({ name: "role", enum: userRoles, required: false })
  @ApiQuery({ name: "blocked", type: Boolean, required: false })
  @ApiResponse({ status: 200, type: StaffUsersResponseDto })
  async list(@Query() query: unknown): Promise<StaffUsersResponseDto> {
    const users = await this.users.list(parseUsersQuery(query));
    return { users: users.map((user) => this.toStaffUserDto(user)) };
  }

  @Post()
  @ApiOperation({ summary: "Создать пользователя" })
  @ApiResponse({ status: 201, type: StaffUserDto })
  @ApiResponse({
    status: 409,
    type: ApiHttpErrorDto,
    description: "USER_PHONE_CONFLICT",
  })
  async create(
    @Body() body: CreateStaffUserDto,
    @CurrentAuth() auth: CurrentAuthData,
    @Req() request: StaffUsersRequestContext,
  ): Promise<StaffUserDto> {
    const details = parseCreateUser(body);
    return this.executeUserCommand(() =>
      this.users.create({
        ...details,
        actorId: auth.userId,
        sessionId: auth.sessionId,
        requestId: this.parseRequestId(request),
      }),
    );
  }

  @Patch(":userId/role")
  @ApiParam({ name: "userId", format: "uuid" })
  @ApiOperation({
    summary: "Изменить участие аккаунта",
    description:
      "Staff role attaches/changes employee without re-enabling disabled access or deleting customer membership. customer disables work access and enrolls customer only with an existing canonical name. No-op uses resulting stored memberships. Work changes revoke staff sessions/push only.",
  })
  @ApiResponse({ status: 200, type: StaffUserDto })
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
    @Body() body: ChangeStaffUserRoleDto,
    @CurrentAuth() auth: CurrentAuthData,
    @Req() request: StaffUsersRequestContext,
  ): Promise<StaffUserDto> {
    const role = parseUserRole(parseUserBody(body, ["role"]).role);
    return this.executeUserCommand(() =>
      this.users.changeRole({
        userId: parseUserId(userId),
        role,
        actorId: auth.userId,
        sessionId: auth.sessionId,
        requestId: this.parseRequestId(request),
      }),
    );
  }

  @Patch(":userId/block")
  @ApiParam({ name: "userId", format: "uuid" })
  @ApiOperation({
    summary: "Глобальная блокировка аккаунта",
    description:
      "Block revokes ALL session and push contexts. Unblock restores eligibility only. Employee work-access actions use /employees/{userId}/access.",
  })
  @ApiResponse({ status: 200, type: StaffUserDto })
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
  async changeBlocked(
    @Param("userId") userId: string,
    @Body() body: ChangeStaffUserBlockDto,
    @CurrentAuth() auth: CurrentAuthData,
    @Req() request: StaffUsersRequestContext,
  ): Promise<StaffUserDto> {
    const { blocked } = parseUserBody(body, ["blocked"]);
    if (typeof blocked !== "boolean") {
      throw invalidUserField("blocked");
    }
    return this.executeUserCommand(() =>
      this.users.changeBlocked({
        userId: parseUserId(userId),
        blocked,
        actorId: auth.userId,
        sessionId: auth.sessionId,
        requestId: this.parseRequestId(request),
      }),
    );
  }

  private parseRequestId(request: StaffUsersRequestContext): string {
    if (
      typeof request.requestId !== "string" ||
      request.requestId.trim() === ""
    ) {
      throw new Error("Missing request identifier");
    }
    return request.requestId;
  }

  private toStaffUserDto(user: StaffUser): StaffUserDto {
    return toAccountDto(user);
  }

  private async executeUserCommand(
    command: () => Promise<StaffUser>,
  ): Promise<StaffUserDto> {
    return executeIdentityCommand(async () => toAccountDto(await command()));
  }
}

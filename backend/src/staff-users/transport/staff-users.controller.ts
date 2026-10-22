import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
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
import { StaffUserError } from "../domain/staff-user.policy";
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
  @ApiOperation({ summary: "Список пользователей" })
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
        requestId: this.parseRequestId(request),
      }),
    );
  }

  @Patch(":userId/role")
  @ApiParam({ name: "userId", format: "uuid" })
  @ApiOperation({ summary: "Изменить роль пользователя" })
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
        requestId: this.parseRequestId(request),
      }),
    );
  }

  @Patch(":userId/block")
  @ApiParam({ name: "userId", format: "uuid" })
  @ApiOperation({ summary: "Заблокировать или разблокировать пользователя" })
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
    return {
      ...user,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  private async executeUserCommand(
    command: () => Promise<StaffUser>,
  ): Promise<StaffUserDto> {
    try {
      return this.toStaffUserDto(await command());
    } catch (error) {
      if (!(error instanceof StaffUserError)) {
        throw error;
      }
      let status = HttpStatus.CONFLICT;
      if (error.code === "USER_NOT_FOUND") {
        status = HttpStatus.NOT_FOUND;
      }
      if (error.code === "USER_ACCESS_DENIED") {
        status = HttpStatus.FORBIDDEN;
      }
      throw new HttpException(
        { code: error.code, message: error.message, details: null },
        status,
      );
    }
  }
}

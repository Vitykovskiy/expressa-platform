import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiParam,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { CurrentAuth } from "../../auth/transport/current-auth.decorator";
import type { CurrentAuth as CurrentAuthData } from "../../auth/transport/current-auth.decorator.types";
import { Roles } from "../../auth/transport/roles.decorator";
import { RolesGuard } from "../../auth/transport/roles.guard";
import { SessionGuard } from "../../auth/transport/session.guard";
import {
  ApiHttpErrorDto,
  ApiValidationErrorDto,
} from "../../platform/observability/http-error.dto";
import { ManageModifiersUseCase } from "../application/manage-modifiers.use-case";
import { ModifierAdminError } from "../domain/modifier-admin.policy";
import { maximumModifierInteger } from "../domain/modifier-admin.policy.constants";
import type {
  AdminModifierGroup,
  AdminModifierOption,
} from "../domain/modifier-admin.policy.types";
import {
  catalogModifiersApiTag,
  catalogModifiersControllerPath,
  modifierErrorResponses,
} from "./catalog-modifiers.controller.constants";
import {
  CreateModifierGroupDto,
  CreateModifierOptionDto,
  ModifierGroupResponseDto,
  ModifierOptionResponseDto,
  ReorderModifierOptionsDto,
  UpdateModifierGroupDto,
  UpdateModifierOptionDto,
} from "./catalog-modifiers.controller.dto";
import type {
  ModifierGroupDto,
  ModifierOptionDto,
  ModifierRequestContext,
} from "./catalog-modifiers.controller.dto.types";
import { validationError } from "./catalog-validation-error";

@ApiTags(catalogModifiersApiTag)
@Controller(catalogModifiersControllerPath)
@UseGuards(SessionGuard, RolesGuard)
@Roles("Administrator")
@ApiBearerAuth()
@ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ApiHttpErrorDto })
@ApiResponse({ status: HttpStatus.FORBIDDEN, type: ApiHttpErrorDto })
@ApiResponse({
  status: HttpStatus.INTERNAL_SERVER_ERROR,
  type: ApiHttpErrorDto,
})
export class CatalogModifiersController {
  constructor(private readonly manageModifiers: ManageModifiersUseCase) {}
  @Post()
  @ApiOperation({ summary: "Создать группу добавок" })
  @ApiResponse({ status: 201, type: ModifierGroupResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiValidationErrorDto })
  async createGroup(
    @Body() body: CreateModifierGroupDto,
    @CurrentAuth() auth: CurrentAuthData,
    @Req() request: ModifierRequestContext,
  ): Promise<ModifierGroupResponseDto> {
    assertGroup(body);
    return executeGroup(() =>
      this.manageModifiers.createGroup({
        ...body,
        actorId: auth.userId,
        requestId: requestId(request),
      }),
    );
  }
  @Patch(":groupId")
  @ApiParam({ name: "groupId", format: "uuid" })
  @ApiOperation({ summary: "Изменить группу добавок" })
  @ApiResponse({ status: 200, type: ModifierGroupResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiValidationErrorDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ApiHttpErrorDto })
  @ApiResponse({ status: HttpStatus.CONFLICT, type: ApiHttpErrorDto })
  async updateGroup(
    @Param("groupId") groupId: string,
    @Body() body: UpdateModifierGroupDto,
    @CurrentAuth() auth: CurrentAuthData,
    @Req() request: ModifierRequestContext,
  ): Promise<ModifierGroupResponseDto> {
    assertUuid(groupId, "groupId");
    assertGroup(body);
    return executeGroup(() =>
      this.manageModifiers.updateGroup({
        ...body,
        groupId,
        actorId: auth.userId,
        requestId: requestId(request),
      }),
    );
  }
  @Delete(":groupId")
  @ApiParam({ name: "groupId", format: "uuid" })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Архивировать группу добавок" })
  @ApiResponse({ status: 204 })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiValidationErrorDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ApiHttpErrorDto })
  @ApiResponse({ status: HttpStatus.CONFLICT, type: ApiHttpErrorDto })
  async archiveGroup(
    @Param("groupId") groupId: string,
    @CurrentAuth() auth: CurrentAuthData,
    @Req() request: ModifierRequestContext,
  ): Promise<void> {
    assertUuid(groupId, "groupId");
    await executeVoid(() =>
      this.manageModifiers.archiveGroup({
        groupId,
        actorId: auth.userId,
        requestId: requestId(request),
      }),
    );
  }
  @Post(":groupId/options")
  @ApiParam({ name: "groupId", format: "uuid" })
  @ApiOperation({ summary: "Создать вариант добавки" })
  @ApiResponse({ status: 201, type: ModifierOptionResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiValidationErrorDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ApiHttpErrorDto })
  @ApiResponse({ status: HttpStatus.CONFLICT, type: ApiHttpErrorDto })
  async createOption(
    @Param("groupId") groupId: string,
    @Body() body: CreateModifierOptionDto,
    @CurrentAuth() auth: CurrentAuthData,
    @Req() request: ModifierRequestContext,
  ): Promise<ModifierOptionResponseDto> {
    assertUuid(groupId, "groupId");
    assertOption(body);
    return executeOption(() =>
      this.manageModifiers.createOption({
        ...body,
        groupId,
        actorId: auth.userId,
        requestId: requestId(request),
      }),
    );
  }
  @Patch("options/:optionId")
  @ApiParam({ name: "optionId", format: "uuid" })
  @ApiOperation({ summary: "Изменить вариант добавки" })
  @ApiResponse({ status: 200, type: ModifierOptionResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiValidationErrorDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ApiHttpErrorDto })
  @ApiResponse({ status: HttpStatus.CONFLICT, type: ApiHttpErrorDto })
  async updateOption(
    @Param("optionId") optionId: string,
    @Body() body: UpdateModifierOptionDto,
    @CurrentAuth() auth: CurrentAuthData,
    @Req() request: ModifierRequestContext,
  ): Promise<ModifierOptionResponseDto> {
    assertUuid(optionId, "optionId");
    assertOption(body);
    return executeOption(() =>
      this.manageModifiers.updateOption({
        ...body,
        optionId,
        actorId: auth.userId,
        requestId: requestId(request),
      }),
    );
  }
  @Post(":groupId/options/reorder")
  @ApiParam({ name: "groupId", format: "uuid" })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Переупорядочить все варианты добавок группы" })
  @ApiResponse({ status: 200, type: ModifierOptionResponseDto, isArray: true })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiValidationErrorDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ApiHttpErrorDto })
  @ApiResponse({ status: HttpStatus.CONFLICT, type: ApiHttpErrorDto })
  async reorderOptions(
    @Param("groupId") groupId: string,
    @Body() body: ReorderModifierOptionsDto,
    @CurrentAuth() auth: CurrentAuthData,
    @Req() request: ModifierRequestContext,
  ): Promise<ModifierOptionResponseDto[]> {
    assertUuid(groupId, "groupId");
    if (
      !Array.isArray(body?.optionIds) ||
      body.optionIds.some((id) => !isUuid(id))
    )
      throw validationError([
        { path: "optionIds", reason: "Must be an array of UUIDs" },
      ]);
    return executeOptions(() =>
      this.manageModifiers.reorderOptions({
        groupId,
        optionIds: body.optionIds,
        actorId: auth.userId,
        requestId: requestId(request),
      }),
    );
  }
  @Delete("options/:optionId")
  @ApiParam({ name: "optionId", format: "uuid" })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Архивировать вариант добавки" })
  @ApiResponse({ status: 204 })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiValidationErrorDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ApiHttpErrorDto })
  @ApiResponse({ status: HttpStatus.CONFLICT, type: ApiHttpErrorDto })
  async archiveOption(
    @Param("optionId") optionId: string,
    @CurrentAuth() auth: CurrentAuthData,
    @Req() request: ModifierRequestContext,
  ): Promise<void> {
    assertUuid(optionId, "optionId");
    await executeVoid(() =>
      this.manageModifiers.archiveOption({
        optionId,
        actorId: auth.userId,
        requestId: requestId(request),
      }),
    );
  }
}
function assertGroup(value: CreateModifierGroupDto): void {
  if (typeof value?.name !== "string" || value.name.trim() === "")
    throw validationError([
      { path: "name", reason: "Must be a non-empty string" },
    ]);
  if (value.selectionType !== "single" && value.selectionType !== "multiple")
    throw validationError([
      { path: "selectionType", reason: "Must be single or multiple" },
    ]);
  if (!nonNegativeInt32(value.minSelect))
    throw validationError([
      { path: "minSelect", reason: "Must be a non-negative int32" },
    ]);
  if (
    !nonNegativeInt32(value.maxSelect) ||
    value.maxSelect < value.minSelect ||
    (value.selectionType === "single" && value.maxSelect !== 1)
  )
    throw validationError([
      { path: "maxSelect", reason: "Must match selection type and minimum" },
    ]);
  if (typeof value.isActive !== "boolean")
    throw validationError([{ path: "isActive", reason: "Must be a boolean" }]);
  if (!Array.isArray(value.options))
    throw validationError([{ path: "options", reason: "Must be an array" }]);
  value.options.forEach((option, index) =>
    assertAggregateOption(option, index),
  );
}
function assertAggregateOption(
  value: { id?: unknown } & CreateModifierOptionDto,
  index: number,
): void {
  try {
    assertOption(value);
  } catch (error) {
    if (error instanceof HttpException) {
      const response = error.getResponse() as {
        details?: { fields?: { path: string; reason: string }[] };
      };
      const field = response.details?.fields?.[0];
      throw validationError([
        {
          path: `options.${index}.${field?.path ?? "value"}`,
          reason: field?.reason ?? "Invalid option",
        },
      ]);
    }
    throw error;
  }
  if (value.id !== undefined && !isUuid(value.id))
    throw validationError([
      { path: `options.${index}.id`, reason: "Must be a UUID" },
    ]);
}
function assertOption(value: CreateModifierOptionDto): void {
  if (typeof value?.name !== "string" || value.name.trim() === "")
    throw validationError([
      { path: "name", reason: "Must be a non-empty string" },
    ]);
  if (!nonNegativeInt32(value.priceDelta))
    throw validationError([
      { path: "priceDelta", reason: "Must be a non-negative int32" },
    ]);
  if (!nonNegativeInt32(value.sortOrder))
    throw validationError([
      { path: "sortOrder", reason: "Must be a non-negative int32" },
    ]);
  if (typeof value.isDefault !== "boolean")
    throw validationError([{ path: "isDefault", reason: "Must be a boolean" }]);
  if (typeof value.isAvailable !== "boolean")
    throw validationError([
      { path: "isAvailable", reason: "Must be a boolean" },
    ]);
}
function int32(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= -maximumModifierInteger &&
    value <= maximumModifierInteger
  );
}
function nonNegativeInt32(value: unknown): value is number {
  return int32(value) && value >= 0;
}
function assertUuid(value: unknown, path: string): asserts value is string {
  if (!isUuid(value))
    throw validationError([{ path, reason: "Must be a UUID" }]);
}
function isUuid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}
function requestId(request: ModifierRequestContext): string {
  if (typeof request.requestId !== "string" || request.requestId === "")
    throw validationError([{ path: "requestId", reason: "Must be present" }]);
  return request.requestId;
}
async function executeGroup(
  command: () => Promise<AdminModifierGroup>,
): Promise<ModifierGroupDto> {
  try {
    return toGroupDto(await command());
  } catch (error) {
    throwModifierError(error);
  }
}
async function executeOption(
  command: () => Promise<AdminModifierOption>,
): Promise<ModifierOptionDto> {
  try {
    return toOptionDto(await command());
  } catch (error) {
    throwModifierError(error);
  }
}
async function executeOptions(
  command: () => Promise<AdminModifierOption[]>,
): Promise<ModifierOptionDto[]> {
  try {
    return (await command()).map(toOptionDto);
  } catch (error) {
    throwModifierError(error);
  }
}
async function executeVoid(command: () => Promise<void>): Promise<void> {
  try {
    await command();
  } catch (error) {
    throwModifierError(error);
  }
}
function toGroupDto(group: AdminModifierGroup): ModifierGroupDto {
  return {
    id: group.id,
    name: group.name,
    selectionType: group.selectionType,
    minSelect: group.minSelect,
    maxSelect: group.maxSelect,
    isActive: group.isActive,
    options: group.options.map(toOptionDto),
  };
}
function toOptionDto(option: AdminModifierOption): ModifierOptionDto {
  return {
    id: option.id,
    groupId: option.groupId,
    name: option.name,
    priceDelta: option.priceDelta,
    sortOrder: option.sortOrder,
    isDefault: option.isDefault,
    isAvailable: option.isAvailable,
  };
}
function throwModifierError(error: unknown): never {
  if (!(error instanceof ModifierAdminError)) throw error;
  if (error.code === "MODIFIER_INVALID") throw validationError(error.fields);
  const response =
    error.code === "MODIFIER_GROUP_NOT_FOUND"
      ? modifierErrorResponses.groupNotFound
      : error.code === "MODIFIER_GROUP_ARCHIVED"
        ? modifierErrorResponses.groupArchived
        : error.code === "MODIFIER_OPTION_NOT_FOUND"
          ? modifierErrorResponses.optionNotFound
          : error.code === "MODIFIER_OPTION_ARCHIVED"
            ? modifierErrorResponses.optionArchived
            : modifierErrorResponses.reorderInvalid;
  const status = error.code.endsWith("_NOT_FOUND")
    ? HttpStatus.NOT_FOUND
    : HttpStatus.CONFLICT;
  throw new HttpException(response, status);
}

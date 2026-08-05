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
import { ManageCategoriesUseCase } from "../application/manage-categories.use-case";
import { CategoryAdminError } from "../domain/category-admin.policy";
import { maximumCategorySortOrder } from "../domain/category-admin.policy.constants";
import type { AdminCategory } from "../domain/category-admin.policy.types";
import {
  catalogCategoriesApiTag,
  catalogCategoriesControllerPath,
  categoryErrorResponses,
} from "./catalog-categories.controller.constants";
import { validationError } from "./catalog-validation-error";
import {
  CategoryResponseDto,
  CreateCategoryDto,
  ReorderCategoriesDto,
  UpdateCategoryDto,
} from "./catalog-categories.controller.dto";
import type {
  CategoryDto,
  CategoryRequestContext,
} from "./catalog-categories.controller.dto.types";

@ApiTags(catalogCategoriesApiTag)
@Controller(catalogCategoriesControllerPath)
@UseGuards(SessionGuard, RolesGuard)
@Roles("Administrator")
@ApiBearerAuth()
@ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ApiHttpErrorDto })
@ApiResponse({ status: HttpStatus.FORBIDDEN, type: ApiHttpErrorDto })
@ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, type: ApiHttpErrorDto })
export class CatalogCategoriesController {
  constructor(private readonly manageCategories: ManageCategoriesUseCase) {}

  @Post()
  @ApiOperation({ summary: "Создать категорию" })
  @ApiResponse({ status: 201, type: CategoryResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiValidationErrorDto })
  @ApiResponse({ status: HttpStatus.CONFLICT, type: ApiHttpErrorDto })
  async create(
    @Body() body: CreateCategoryDto,
    @CurrentAuth() auth: CurrentAuthData,
    @Req() request: CategoryRequestContext,
  ): Promise<CategoryResponseDto> {
    assertCategoryBody(body);
    return executeCategoryCommand(() =>
      this.manageCategories.create({
        ...body,
        actorId: auth.userId,
        requestId: getRequestId(request),
      }),
    );
  }

  @Patch(":categoryId")
  @ApiParam({ name: "categoryId", format: "uuid" })
  @ApiOperation({ summary: "Изменить категорию" })
  @ApiResponse({ status: 200, type: CategoryResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiValidationErrorDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ApiHttpErrorDto })
  @ApiResponse({ status: HttpStatus.CONFLICT, type: ApiHttpErrorDto })
  async update(
    @Param("categoryId") categoryId: string,
    @Body() body: UpdateCategoryDto,
    @CurrentAuth() auth: CurrentAuthData,
    @Req() request: CategoryRequestContext,
  ): Promise<CategoryResponseDto> {
    assertCategoryId(categoryId);
    assertCategoryBody(body);
    return executeCategoryCommand(() =>
      this.manageCategories.update({
        ...body,
        categoryId,
        actorId: auth.userId,
        requestId: getRequestId(request),
      }),
    );
  }

  @Post("reorder")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Переупорядочить все категории" })
  @ApiResponse({ status: 200, type: CategoryResponseDto, isArray: true })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiValidationErrorDto })
  @ApiResponse({ status: HttpStatus.CONFLICT, type: ApiHttpErrorDto })
  async reorder(
    @Body() body: ReorderCategoriesDto,
    @CurrentAuth() auth: CurrentAuthData,
    @Req() request: CategoryRequestContext,
  ): Promise<CategoryResponseDto[]> {
    if (!Array.isArray(body?.categoryIds))
      throw validationError([
        { path: "categoryIds", reason: "Must be an array of UUIDs" },
      ]);
    if (body.categoryIds.some((id) => !isUuid(id)))
      throw validationError([
        { path: "categoryIds", reason: "Must contain UUIDs" },
      ]);
    return executeCategoryCommand(() =>
      this.manageCategories.reorder({
        ...body,
        actorId: auth.userId,
        requestId: getRequestId(request),
      }),
    );
  }

  @Delete(":categoryId")
  @ApiParam({ name: "categoryId", format: "uuid" })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Архивировать категорию" })
  @ApiResponse({ status: 204 })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiValidationErrorDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ApiHttpErrorDto })
  @ApiResponse({ status: HttpStatus.CONFLICT, type: ApiHttpErrorDto })
  async archive(
    @Param("categoryId") categoryId: string,
    @CurrentAuth() auth: CurrentAuthData,
    @Req() request: CategoryRequestContext,
  ): Promise<void> {
    assertCategoryId(categoryId);
    await executeCategoryAction(() =>
      this.manageCategories.archive({
        categoryId,
        actorId: auth.userId,
        requestId: getRequestId(request),
      }),
    );
  }
}

function assertCategoryBody(body: CreateCategoryDto): void {
  if (typeof body?.name !== "string" || body.name.trim() === "")
    throw validationError([
      { path: "name", reason: "Must be a non-empty string" },
    ]);
  if (typeof body.description !== "string")
    throw validationError([
      { path: "description", reason: "Must be a string" },
    ]);
  if (
    !Number.isInteger(body.sortOrder) ||
    body.sortOrder < 0 ||
    body.sortOrder > maximumCategorySortOrder
  )
    throw validationError([
      { path: "sortOrder", reason: "Must be a non-negative int32" },
    ]);
  if (typeof body.isActive !== "boolean")
    throw validationError([{ path: "isActive", reason: "Must be a boolean" }]);
}

function assertCategoryId(categoryId: string): void {
  if (!isUuid(categoryId))
    throw validationError([{ path: "categoryId", reason: "Must be a UUID" }]);
}

function isUuid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}

function getRequestId(request: CategoryRequestContext): string {
  if (typeof request.requestId !== "string" || request.requestId === "") {
    throw validationError([{ path: "requestId", reason: "Must be present" }]);
  }
  return request.requestId;
}

async function executeCategoryCommand(
  command: () => Promise<AdminCategory>,
): Promise<CategoryResponseDto>;
async function executeCategoryCommand(
  command: () => Promise<AdminCategory[]>,
): Promise<CategoryResponseDto[]>;
async function executeCategoryCommand(
  command: () => Promise<AdminCategory | AdminCategory[]>,
): Promise<CategoryResponseDto | CategoryResponseDto[]> {
  try {
    const result = await command();
    return Array.isArray(result)
      ? result.map(toCategoryDto)
      : toCategoryDto(result);
  } catch (error) {
    throwCategoryError(error);
  }
}

async function executeCategoryAction(
  command: () => Promise<void>,
): Promise<void> {
  try {
    await command();
  } catch (error) {
    throwCategoryError(error);
  }
}

function toCategoryDto(category: AdminCategory): CategoryDto {
  return {
    id: category.id,
    name: category.name,
    description: category.description,
    sortOrder: category.sortOrder,
    isActive: category.isActive,
  };
}

function throwCategoryError(error: unknown): never {
  if (!(error instanceof CategoryAdminError)) throw error;
  if (error.code === "CATEGORY_NOT_FOUND")
    throw new HttpException(
      categoryErrorResponses.notFound,
      HttpStatus.NOT_FOUND,
    );
  if (error.code === "CATEGORY_ARCHIVED")
    throw new HttpException(
      categoryErrorResponses.archived,
      HttpStatus.CONFLICT,
    );
  if (error.code === "CATEGORY_POSITION_CONFLICT")
    throw new HttpException(
      categoryErrorResponses.positionConflict,
      HttpStatus.CONFLICT,
    );
  if (error.code === "CATEGORY_REORDER_INVALID")
    throw new HttpException(
      categoryErrorResponses.reorderInvalid,
      HttpStatus.CONFLICT,
    );
  throw validationError(error.fields);
}

import {
  Body,
  Controller,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  Put,
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
import {
  CategoryModifierGroupsError,
  ManageCategoryModifiersUseCase,
} from "../application/manage-category-modifiers.use-case";
import { CategoryAdminError } from "../domain/category-admin.policy";
import type { CategoryModifierGroup } from "../application/category-modifiers.repository.types";
import {
  catalogCategoryModifiersApiTag,
  catalogCategoryModifiersControllerPath,
  categoryModifierGroupsErrorResponses,
} from "./catalog-category-modifiers.controller.constants";
import {
  CategoryModifierGroupResponseDto,
  ReplaceCategoryModifierGroupsDto,
} from "./catalog-category-modifiers.controller.dto";
import type {
  CategoryModifierGroupDto,
  CategoryModifierGroupsRequestContext,
} from "./catalog-category-modifiers.controller.dto.types";
import { validationError } from "./catalog-validation-error";

@ApiTags(catalogCategoryModifiersApiTag)
@Controller(catalogCategoryModifiersControllerPath)
@UseGuards(SessionGuard, RolesGuard)
@Roles("Administrator")
@ApiBearerAuth()
@ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ApiHttpErrorDto })
@ApiResponse({ status: HttpStatus.FORBIDDEN, type: ApiHttpErrorDto })
@ApiResponse({
  status: HttpStatus.INTERNAL_SERVER_ERROR,
  type: ApiHttpErrorDto,
})
export class CatalogCategoryModifiersController {
  constructor(
    private readonly manageCategoryModifiers: ManageCategoryModifiersUseCase,
  ) {}

  @Put(":categoryId/modifier-groups")
  @ApiParam({ name: "categoryId", format: "uuid" })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Заменить группы добавок категории" })
  @ApiResponse({
    status: 200,
    type: CategoryModifierGroupResponseDto,
    isArray: true,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiValidationErrorDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ApiHttpErrorDto })
  async replace(
    @Param("categoryId") categoryId: string,
    @Body() body: ReplaceCategoryModifierGroupsDto,
    @CurrentAuth() auth: CurrentAuthData,
    @Req() request: CategoryModifierGroupsRequestContext,
  ): Promise<CategoryModifierGroupResponseDto[]> {
    if (!isUuid(categoryId))
      throw validationError([{ path: "categoryId", reason: "Must be a UUID" }]);
    if (!Array.isArray(body?.groupIds))
      throw validationError([
        { path: "groupIds", reason: "Must be an array of UUIDs" },
      ]);
    if (body.groupIds.some((groupId) => !isUuid(groupId)))
      throw validationError([
        { path: "groupIds", reason: "Must contain UUIDs" },
      ]);
    if (new Set(body.groupIds).size !== body.groupIds.length)
      throw validationError([
        { path: "groupIds", reason: "Must not contain duplicates" },
      ]);
    const requestId = request.requestId;
    if (typeof requestId !== "string" || requestId === "") {
      throw validationError([{ path: "requestId", reason: "Must be present" }]);
    }

    try {
      const groups = await this.manageCategoryModifiers.replace({
        categoryId,
        groupIds: body.groupIds,
        actorId: auth.userId,
        requestId,
      });
      return groups.map(toCategoryModifierGroupDto);
    } catch (error) {
      if (
        error instanceof CategoryAdminError &&
        error.code === "CATEGORY_NOT_FOUND"
      ) {
        throw new HttpException(
          categoryModifierGroupsErrorResponses.categoryNotFound,
          HttpStatus.NOT_FOUND,
        );
      }
      if (error instanceof CategoryModifierGroupsError)
        throw validationError(error.fields);
      throw error;
    }
  }
}

function isUuid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}

function toCategoryModifierGroupDto(
  group: CategoryModifierGroup,
): CategoryModifierGroupDto {
  return {
    categoryId: group.categoryId,
    groupId: group.groupId,
    sortOrder: group.sortOrder,
  };
}

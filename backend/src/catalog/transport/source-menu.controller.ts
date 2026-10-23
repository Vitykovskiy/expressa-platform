import {
  Body,
  Controller,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { CurrentAuth } from "../../auth/transport/current-auth.decorator";
import type { CurrentAuth as Auth } from "../../auth/transport/current-auth.decorator.types";
import { Roles } from "../../auth/transport/roles.decorator";
import { RolesGuard } from "../../auth/transport/roles.guard";
import { SessionGuard } from "../../auth/transport/session.guard";
import {
  ApiHttpErrorDto,
  ApiValidationErrorDto,
} from "../../platform/observability/http-error.dto";
import { ManageSourceCategoriesUseCase } from "../application/manage-source-categories.use-case";
import { ManageSourceModifiersUseCase } from "../application/manage-source-modifiers.use-case";
import { ManageSourceProductsUseCase } from "../application/manage-source-products.use-case";
import {
  ModifierGroupResponseDto,
  ModifierOptionResponseDto,
} from "./catalog-modifiers.controller.dto";
import {
  SourceCategoryCreateDto,
  SourceCategoryUpdateDto,
  SourceCategoryResponseDto,
  SourceGroupDto,
  SourceOptionDto,
  SourceProductDto,
} from "./source-menu.dto";
import {
  parseSourceCategory,
  parseSourceGroup,
  parseSourceOption,
  parseSourceProduct,
  parseSourceRequestId,
  parseSourceUuid,
} from "./source-menu.validation";
import {
  sourceCategoryResponse,
  sourceGroupResponse,
  sourceOptionResponse,
  sourceProductResponse,
} from "./source-menu.response";
import { V3ProductResponseDto } from "./catalog-products-v3.dto";
import { executeSourceCommand } from "./source-menu.error";

@ApiTags("source-menu")
@Controller("api/v3/backoffice/menu")
@UseGuards(SessionGuard, RolesGuard)
@Roles("Administrator")
@ApiBearerAuth()
@ApiResponse({ status: 400, type: ApiValidationErrorDto })
@ApiResponse({ status: 401, type: ApiHttpErrorDto })
@ApiResponse({ status: 403, type: ApiHttpErrorDto })
@ApiResponse({ status: 404, type: ApiHttpErrorDto })
@ApiResponse({
  status: 409,
  type: ApiHttpErrorDto,
  description: "Archived target or catalog state conflict",
})
@ApiResponse({ status: 500, type: ApiHttpErrorDto })
export class SourceMenuController {
  constructor(
    private readonly categories: ManageSourceCategoriesUseCase,
    private readonly modifiers: ManageSourceModifiersUseCase,
    private readonly products: ManageSourceProductsUseCase,
  ) {}

  @Post("categories")
  @ApiOperation({ summary: "Create category and selected groups atomically" })
  @ApiBody({ type: SourceCategoryCreateDto })
  @ApiResponse({ status: 201, type: SourceCategoryResponseDto })
  async createCategory(
    @Body() body: unknown,
    @CurrentAuth() auth: Auth,
    @Req() request: { requestId?: string },
  ): Promise<SourceCategoryResponseDto> {
    const input = parseSourceCategory(body, true);
    const actor = {
      actorId: auth.userId,
      requestId: parseSourceRequestId(request.requestId),
    };
    return executeSourceCommand(async () =>
      sourceCategoryResponse(await this.categories.save(input, actor, null)),
    );
  }

  @Patch("categories/:categoryId")
  @ApiOperation({
    summary: "Save category; omitted groups preserve all associations",
  })
  @ApiParam({ name: "categoryId", format: "uuid" })
  @ApiBody({ type: SourceCategoryUpdateDto })
  @ApiResponse({ status: 200, type: SourceCategoryResponseDto })
  async updateCategory(
    @Param("categoryId") categoryId: string,
    @Body() body: unknown,
    @CurrentAuth() auth: Auth,
    @Req() request: { requestId?: string },
  ): Promise<SourceCategoryResponseDto> {
    const id = parseSourceUuid(categoryId, "categoryId");
    const input = parseSourceCategory(body, false);
    const actor = {
      actorId: auth.userId,
      requestId: parseSourceRequestId(request.requestId),
    };
    return executeSourceCommand(async () =>
      sourceCategoryResponse(await this.categories.save(input, actor, id)),
    );
  }

  @Post("option-groups")
  @ApiOperation({
    summary: "Create empty option group with single-selection flag",
  })
  @ApiBody({ type: SourceGroupDto })
  @ApiResponse({ status: 201, type: ModifierGroupResponseDto })
  async createGroup(
    @Body() body: unknown,
    @CurrentAuth() auth: Auth,
    @Req() request: { requestId?: string },
  ): Promise<ModifierGroupResponseDto> {
    const input = parseSourceGroup(body);
    const actor = {
      actorId: auth.userId,
      requestId: parseSourceRequestId(request.requestId),
    };
    return executeSourceCommand(async () =>
      sourceGroupResponse(await this.modifiers.saveGroup(input, actor, null)),
    );
  }

  @Patch("option-groups/:groupId")
  @ApiOperation({
    summary: "Save group name and single-selection flag preserving options",
  })
  @ApiParam({ name: "groupId", format: "uuid" })
  @ApiBody({ type: SourceGroupDto })
  @ApiResponse({ status: 200, type: ModifierGroupResponseDto })
  async updateGroup(
    @Param("groupId") groupId: string,
    @Body() body: unknown,
    @CurrentAuth() auth: Auth,
    @Req() request: { requestId?: string },
  ): Promise<ModifierGroupResponseDto> {
    const id = parseSourceUuid(groupId, "groupId");
    const input = parseSourceGroup(body);
    const actor = {
      actorId: auth.userId,
      requestId: parseSourceRequestId(request.requestId),
    };
    return executeSourceCommand(async () =>
      sourceGroupResponse(await this.modifiers.saveGroup(input, actor, id)),
    );
  }

  @Post("option-groups/:groupId/options")
  @ApiOperation({ summary: "Append explicitly priced option" })
  @ApiParam({ name: "groupId", format: "uuid" })
  @ApiBody({ type: SourceOptionDto })
  @ApiResponse({ status: 201, type: ModifierOptionResponseDto })
  async createOption(
    @Param("groupId") groupId: string,
    @Body() body: unknown,
    @CurrentAuth() auth: Auth,
    @Req() request: { requestId?: string },
  ): Promise<ModifierOptionResponseDto> {
    const id = parseSourceUuid(groupId, "groupId");
    const input = parseSourceOption(body);
    const actor = {
      actorId: auth.userId,
      requestId: parseSourceRequestId(request.requestId),
    };
    return executeSourceCommand(async () =>
      sourceOptionResponse(
        await this.modifiers.saveOption(input, actor, { groupId: id }),
      ),
    );
  }

  @Patch("options/:optionId")
  @ApiOperation({
    summary: "Save option preserving order, defaults and availability",
  })
  @ApiParam({ name: "optionId", format: "uuid" })
  @ApiBody({ type: SourceOptionDto })
  @ApiResponse({ status: 200, type: ModifierOptionResponseDto })
  async updateOption(
    @Param("optionId") optionId: string,
    @Body() body: unknown,
    @CurrentAuth() auth: Auth,
    @Req() request: { requestId?: string },
  ): Promise<ModifierOptionResponseDto> {
    const id = parseSourceUuid(optionId, "optionId");
    const input = parseSourceOption(body);
    const actor = {
      actorId: auth.userId,
      requestId: parseSourceRequestId(request.requestId),
    };
    return executeSourceCommand(async () =>
      sourceOptionResponse(
        await this.modifiers.saveOption(input, actor, { optionId: id }),
      ),
    );
  }

  @Post("products")
  @ApiOperation({ summary: "Create source product using canonical v3 prices" })
  @ApiBody({ type: SourceProductDto })
  @ApiResponse({ status: 201, type: V3ProductResponseDto })
  async createProduct(
    @Body() body: unknown,
    @CurrentAuth() auth: Auth,
    @Req() request: { requestId?: string },
  ): Promise<V3ProductResponseDto> {
    const input = parseSourceProduct(body);
    const actor = {
      actorId: auth.userId,
      requestId: parseSourceRequestId(request.requestId),
    };
    return executeSourceCommand(async () =>
      sourceProductResponse(await this.products.save(input, actor, null)),
    );
  }

  @Patch("products/:productId")
  @ApiOperation({
    summary: "Save complete price branch preserving unexposed product fields",
  })
  @ApiParam({ name: "productId", format: "uuid" })
  @ApiBody({ type: SourceProductDto })
  @ApiResponse({ status: 200, type: V3ProductResponseDto })
  async updateProduct(
    @Param("productId") productId: string,
    @Body() body: unknown,
    @CurrentAuth() auth: Auth,
    @Req() request: { requestId?: string },
  ): Promise<V3ProductResponseDto> {
    const id = parseSourceUuid(productId, "productId");
    const input = parseSourceProduct(body);
    const actor = {
      actorId: auth.userId,
      requestId: parseSourceRequestId(request.requestId),
    };
    return executeSourceCommand(async () =>
      sourceProductResponse(await this.products.save(input, actor, id)),
    );
  }
}

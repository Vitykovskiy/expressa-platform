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
import { ManageV3ProductsUseCase } from "../application/manage-products.use-case";
import { ProductAdminError } from "../domain/product-admin.policy";
import {
  V3ProductDto,
  V3ProductResponseDto,
  V3ReorderProductsDto,
} from "./catalog-products-v3.dto";
import { validationError } from "./catalog-validation-error";

@ApiTags("catalog-v3")
@Controller("api/v3/backoffice/catalog/products")
@UseGuards(SessionGuard, RolesGuard)
@Roles("Administrator")
@ApiBearerAuth()
export class CatalogProductsV3Controller {
  constructor(private readonly products: ManageV3ProductsUseCase) {}

  @Post()
  @ApiOperation({ summary: "Create a v3 catalog product" })
  @ApiResponse({ status: 201, type: V3ProductResponseDto })
  async create(
    @Body() body: V3ProductDto,
    @CurrentAuth() auth: Auth,
    @Req() request: { requestId?: string },
  ): Promise<V3ProductResponseDto> {
    assertProductBody(body);
    return execute(() =>
      this.products.create({
        ...body,
        actorId: auth.userId,
        requestId: request.requestId ?? "unknown-request",
      }),
    );
  }

  @Patch(":productId")
  @ApiOperation({ summary: "Update a v3 catalog product" })
  @ApiParam({ name: "productId", format: "uuid" })
  @ApiResponse({ status: 200, type: V3ProductResponseDto })
  async update(
    @Param("productId") productId: string,
    @Body() body: V3ProductDto,
    @CurrentAuth() auth: Auth,
    @Req() request: { requestId?: string },
  ): Promise<V3ProductResponseDto> {
    assertUuid(productId, "productId");
    assertProductBody(body);
    return execute(() =>
      this.products.update({
        ...body,
        productId,
        actorId: auth.userId,
        requestId: request.requestId ?? "unknown-request",
      }),
    );
  }

  @Post("reorder")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Reorder all current v3 products in a category" })
  @ApiResponse({ status: 200, type: V3ProductResponseDto, isArray: true })
  async reorder(
    @Body() body: V3ReorderProductsDto,
    @CurrentAuth() auth: Auth,
    @Req() request: { requestId?: string },
  ): Promise<V3ProductResponseDto[]> {
    assertUuid(body?.categoryId, "categoryId");
    if (
      !Array.isArray(body.productIds) ||
      body.productIds.some((id) => !isUuid(id))
    )
      throw validationError([
        { path: "productIds", reason: "Must be an array of UUIDs" },
      ]);
    return execute(() =>
      this.products.reorder({
        ...body,
        actorId: auth.userId,
        requestId: request.requestId ?? "unknown-request",
      }),
    );
  }

  @Delete(":productId")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Archive a v3 catalog product" })
  @ApiParam({ name: "productId", format: "uuid" })
  @ApiResponse({ status: 204 })
  async archive(
    @Param("productId") productId: string,
    @CurrentAuth() auth: Auth,
    @Req() request: { requestId?: string },
  ): Promise<void> {
    assertUuid(productId, "productId");
    return execute(() =>
      this.products.archive({
        productId,
        actorId: auth.userId,
        requestId: request.requestId ?? "unknown-request",
      }),
    );
  }
}

function assertProductBody(body: V3ProductDto): void {
  if (!isUuid(body?.categoryId))
    throw validationError([{ path: "categoryId", reason: "Must be a UUID" }]);
  if (typeof body.name !== "string" || body.name.trim() === "")
    throw validationError([
      { path: "name", reason: "Must be a non-empty string" },
    ]);
  if (typeof body.description !== "string")
    throw validationError([
      { path: "description", reason: "Must be a string" },
    ]);
  if (
    typeof body.isActive !== "boolean" ||
    typeof body.isAvailable !== "boolean"
  )
    throw validationError([{ path: "body", reason: "Invalid product" }]);
  if (!isInt32(body.sortOrder))
    throw validationError([
      { path: "sortOrder", reason: "Must be a non-negative int32" },
    ]);
  if (!(body.price === null || isInt32(body.price)))
    throw validationError([
      { path: "price", reason: "Must be a non-negative int32 or null" },
    ]);
  if (!(body.portionLabel === null || typeof body.portionLabel === "string"))
    throw validationError([
      { path: "portionLabel", reason: "Must be a string or null" },
    ]);
  if (!Array.isArray(body.priceChoices))
    throw validationError([
      { path: "priceChoices", reason: "Must be an array" },
    ]);
  body.priceChoices.forEach((choice, index) => {
    if (
      typeof choice?.portionLabel !== "string" ||
      choice.portionLabel.trim() === ""
    )
      throw validationError([
        {
          path: `priceChoices.${index}.portionLabel`,
          reason: "Must be a non-empty string",
        },
      ]);
    if (
      !isInt32(choice.price) ||
      !isInt32(choice.sortOrder) ||
      typeof choice.isAvailable !== "boolean"
    )
      throw validationError([
        { path: `priceChoices.${index}`, reason: "Invalid price choice" },
      ]);
    if (choice.id !== undefined && !isUuid(choice.id))
      throw validationError([
        { path: `priceChoices.${index}.id`, reason: "Must be a UUID" },
      ]);
  });
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
function isInt32(value: unknown): value is number {
  return (
    Number.isInteger(value) &&
    (value as number) >= 0 &&
    (value as number) <= 2_147_483_647
  );
}
async function execute<Result>(action: () => Promise<Result>): Promise<Result> {
  try {
    return await action();
  } catch (error) {
    if (error instanceof ProductAdminError) {
      if (error.code === "PRODUCT_INVALID") throw validationError(error.fields);
      throw new HttpException(
        { code: error.code, message: "Invalid catalog command" },
        error.code === "PRODUCT_NOT_FOUND" ||
          error.code === "PRODUCT_CATEGORY_NOT_FOUND"
          ? 404
          : 409,
      );
    }
    throw error;
  }
}

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
import { ManageProductsUseCase } from "../application/manage-products.use-case";
import { ProductAdminError } from "../domain/product-admin.policy";
import { maximumProductSortOrder } from "../domain/product-admin.policy.constants";
import type { AdminProduct } from "../domain/product-admin.policy.types";
import {
  catalogProductsApiTag,
  catalogProductsControllerPath,
  productErrorResponses,
} from "./catalog-products.controller.constants";
import {
  CreateProductDto,
  ProductResponseDto,
  ReorderProductsDto,
  UpdateProductDto,
} from "./catalog-products.controller.dto";
import type {
  ProductDto,
  ProductRequestContext,
} from "./catalog-products.controller.dto.types";
import { validationError } from "./catalog-validation-error";

@ApiTags(catalogProductsApiTag)
@Controller(catalogProductsControllerPath)
@UseGuards(SessionGuard, RolesGuard)
@Roles("Administrator")
@ApiBearerAuth()
@ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ApiHttpErrorDto })
@ApiResponse({ status: HttpStatus.FORBIDDEN, type: ApiHttpErrorDto })
@ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, type: ApiHttpErrorDto })
export class CatalogProductsController {
  constructor(private readonly manageProducts: ManageProductsUseCase) {}

  @Post()
  @ApiOperation({ summary: "Создать товар" })
  @ApiResponse({ status: 201, type: ProductResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiValidationErrorDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ApiHttpErrorDto })
  @ApiResponse({ status: HttpStatus.CONFLICT, type: ApiHttpErrorDto })
  async create(
    @Body() body: CreateProductDto,
    @CurrentAuth() auth: CurrentAuthData,
    @Req() request: ProductRequestContext,
  ): Promise<ProductResponseDto> {
    assertProductBody(body);
    return execute(() =>
      this.manageProducts.create({
        ...body,
        actorId: auth.userId,
        requestId: getRequestId(request),
      }),
    );
  }

  @Patch(":productId")
  @ApiParam({ name: "productId", format: "uuid" })
  @ApiOperation({ summary: "Изменить товар" })
  @ApiResponse({ status: 200, type: ProductResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiValidationErrorDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ApiHttpErrorDto })
  @ApiResponse({ status: HttpStatus.CONFLICT, type: ApiHttpErrorDto })
  async update(
    @Param("productId") productId: string,
    @Body() body: UpdateProductDto,
    @CurrentAuth() auth: CurrentAuthData,
    @Req() request: ProductRequestContext,
  ): Promise<ProductResponseDto> {
    assertUuid(productId, "productId");
    assertProductBody(body);
    return execute(() =>
      this.manageProducts.update({
        ...body,
        productId,
        actorId: auth.userId,
        requestId: getRequestId(request),
      }),
    );
  }

  @Post("reorder")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Переупорядочить товары категории" })
  @ApiResponse({ status: 200, type: ProductResponseDto, isArray: true })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiValidationErrorDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ApiHttpErrorDto })
  @ApiResponse({ status: HttpStatus.CONFLICT, type: ApiHttpErrorDto })
  async reorder(
    @Body() body: ReorderProductsDto,
    @CurrentAuth() auth: CurrentAuthData,
    @Req() request: ProductRequestContext,
  ): Promise<ProductResponseDto[]> {
    assertUuid(body?.categoryId, "categoryId");
    if (
      !Array.isArray(body.productIds) ||
      body.productIds.some((id) => !isUuid(id))
    )
      throw validationError([
        { path: "productIds", reason: "Must be an array of UUIDs" },
      ]);
    return execute(() =>
      this.manageProducts.reorder({
        ...body,
        actorId: auth.userId,
        requestId: getRequestId(request),
      }),
    );
  }

  @Delete(":productId")
  @ApiParam({ name: "productId", format: "uuid" })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Архивировать товар" })
  @ApiResponse({ status: 204 })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiValidationErrorDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ApiHttpErrorDto })
  @ApiResponse({ status: HttpStatus.CONFLICT, type: ApiHttpErrorDto })
  async archive(
    @Param("productId") productId: string,
    @CurrentAuth() auth: CurrentAuthData,
    @Req() request: ProductRequestContext,
  ): Promise<void> {
    assertUuid(productId, "productId");
    try {
      await this.manageProducts.archive({
        productId,
        actorId: auth.userId,
        requestId: getRequestId(request),
      });
    } catch (error) {
      throwProductError(error);
    }
  }
}

function assertProductBody(body: CreateProductDto): void {
  assertUuid(body?.categoryId, "categoryId");
  if (body.type !== "DRINK" && body.type !== "OTHER")
    throw validationError([{ path: "type", reason: "Must be DRINK or OTHER" }]);
  if (typeof body.name !== "string" || body.name.trim() === "")
    throw validationError([
      { path: "name", reason: "Must be a non-empty string" },
    ]);
  if (typeof body.description !== "string")
    throw validationError([
      { path: "description", reason: "Must be a string" },
    ]);
  if (!(body.priceMinor === null || isInt32(body.priceMinor)))
    throw validationError([
      { path: "priceMinor", reason: "Must be an int32 or null" },
    ]);
  if (!isInt32(body.sortOrder))
    throw validationError([
      { path: "sortOrder", reason: "Must be a non-negative int32" },
    ]);
  if (typeof body.isActive !== "boolean")
    throw validationError([{ path: "isActive", reason: "Must be a boolean" }]);
  if (typeof body.isAvailable !== "boolean")
    throw validationError([
      { path: "isAvailable", reason: "Must be a boolean" },
    ]);
  if (!Array.isArray(body.variants))
    throw validationError([{ path: "variants", reason: "Must be an array" }]);
  body.variants.forEach((variant, index) => {
    if (variant?.size !== "S" && variant?.size !== "M" && variant?.size !== "L")
      throw validationError([
        { path: `variants.${index}.size`, reason: "Must be S, M, or L" },
      ]);
    if (!isInt32(variant.priceMinor))
      throw validationError([
        {
          path: `variants.${index}.priceMinor`,
          reason: "Must be a non-negative int32",
        },
      ]);
    if (!isInt32(variant.sortOrder))
      throw validationError([
        {
          path: `variants.${index}.sortOrder`,
          reason: "Must be a non-negative int32",
        },
      ]);
    if (typeof variant.isAvailable !== "boolean")
      throw validationError([
        { path: `variants.${index}.isAvailable`, reason: "Must be a boolean" },
      ]);
  });
  if (
    body.type === "OTHER" &&
    (body.priceMinor === null || body.variants.length !== 0)
  )
    throw validationError([
      {
        path: body.priceMinor === null ? "priceMinor" : "variants",
        reason: "Must match product type",
      },
    ]);
  if (
    body.type === "DRINK" &&
    (body.priceMinor !== null ||
      body.variants.length === 0 ||
      (body.isActive && !body.variants.some((variant) => variant.isAvailable)))
  )
    throw validationError([
      {
        path: body.priceMinor !== null ? "priceMinor" : "variants",
        reason: "Must match product type",
      },
    ]);
}

function isInt32(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= maximumProductSortOrder
  );
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
function getRequestId(request: ProductRequestContext): string {
  if (typeof request.requestId !== "string" || request.requestId === "")
    throw validationError([{ path: "requestId", reason: "Must be present" }]);
  return request.requestId;
}
async function execute(
  command: () => Promise<AdminProduct>,
): Promise<ProductResponseDto>;
async function execute(
  command: () => Promise<AdminProduct[]>,
): Promise<ProductResponseDto[]>;
async function execute(
  command: () => Promise<AdminProduct | AdminProduct[]>,
): Promise<ProductResponseDto | ProductResponseDto[]> {
  try {
    const result = await command();
    return Array.isArray(result) ? result.map(toDto) : toDto(result);
  } catch (error) {
    throwProductError(error);
  }
}
function toDto(product: AdminProduct): ProductDto {
  return {
    id: product.id,
    categoryId: product.categoryId,
    type: product.type,
    name: product.name,
    description: product.description,
    priceMinor: product.priceMinor,
    sortOrder: product.sortOrder,
    isActive: product.isActive,
    isAvailable: product.isAvailable,
    variants: product.variants
      .filter((variant) => variant.archivedAt === null)
      .map((variant) => ({
        id: variant.id,
        size: variant.size,
        priceMinor: variant.priceMinor,
        sortOrder: variant.sortOrder,
        isAvailable: variant.isAvailable,
      })),
  };
}
function throwProductError(error: unknown): never {
  if (!(error instanceof ProductAdminError)) throw error;
  if (error.code === "PRODUCT_INVALID") throw validationError(error.fields);
  const response =
    error.code === "PRODUCT_NOT_FOUND"
      ? productErrorResponses.notFound
      : error.code === "PRODUCT_ARCHIVED"
        ? productErrorResponses.archived
        : error.code === "PRODUCT_CATEGORY_NOT_FOUND"
          ? productErrorResponses.categoryNotFound
          : error.code === "PRODUCT_POSITION_CONFLICT"
            ? productErrorResponses.positionConflict
            : productErrorResponses.reorderInvalid;
  const status =
    error.code === "PRODUCT_NOT_FOUND" ||
    error.code === "PRODUCT_CATEGORY_NOT_FOUND"
      ? HttpStatus.NOT_FOUND
      : HttpStatus.CONFLICT;
  throw new HttpException(response, status);
}

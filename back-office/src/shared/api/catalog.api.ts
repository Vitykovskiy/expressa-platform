import type { ApiRequestFeedback, ApiRequestReporting } from "./client.types";
import { bearerTokenType } from "./auth.api.constants";
import {
  catalogApiPaths,
  catalogModifierSelectionTypes,
  catalogUuidPattern,
} from "./catalog.api.constants";
import {
  ApiClient,
  ApiError,
  createRequestFeedback,
  requestReceipt,
} from "./client";
import type { ApiTransportKind } from "./client.types";
import type {
  Catalog,
  AdminV3CatalogResponseDto,
  AdminV3ProductDto,
  CatalogApiErrorData,
  CatalogCategory,
  CatalogCategoryDto,
  CatalogCategoryModifierGroupAssignment,
  CatalogCategoryModifierGroupAssignmentDto,
  CatalogModifierGroup,
  CatalogModifierGroupAggregateDto,
  CatalogModifierGroupDto,
  CatalogModifierOption,
  CatalogModifierOptionDto,
  CatalogProduct,
  CatalogValidationField,
  CreateCatalogCategory,
  CreateCatalogModifierOption,
  CreateCatalogProduct,
  UpdateCatalogCategory,
  UpdateCatalogModifierOption,
  UpdateCatalogProduct,
  SaveCatalogModifierGroup,
} from "./catalog.api.types";

export class CatalogApiError extends Error implements CatalogApiErrorData {
  readonly code: string;
  readonly details: unknown;
  readonly fields: readonly CatalogValidationField[];
  readonly occurrenceId: string;
  readonly requestId: string | null;
  readonly status: number | null;
  readonly transportKind: ApiTransportKind;
  readonly settlement?: import("./client.types").ApiRequestReceipt;

  constructor({
    code,
    fields,
    details = fields,
    message,
    occurrenceId = crypto.randomUUID(),
    requestId,
    status,
    transportKind = "response",
    settlement,
  }: CatalogApiErrorData) {
    super(message);
    this.name = "CatalogApiError";
    this.code = code;
    this.details = details;
    this.fields = fields;
    this.occurrenceId = occurrenceId;
    this.requestId = requestId;
    this.status = status;
    this.transportKind = transportKind;
    this.settlement = settlement;
  }
}

export class CatalogApi {
  constructor(private readonly client: ApiClient) {}

  async getCatalog(
    accessToken: string,
    reporting?: ApiRequestReporting,
  ): Promise<Catalog> {
    const response = await this.request<AdminV3CatalogResponseDto>(
      catalogApiPaths.catalog,
      isAdminV3CatalogResponseDto,
      accessToken,
      "GET",
      200,
      undefined,
      createRequestFeedback(reporting, {
        operationKey: "catalog.get",
        resourceKey: "catalog",
        kind: "read",
      }),
    );

    return toCatalogV3(response);
  }

  async createCategory(
    accessToken: string,
    category: CreateCatalogCategory,
    reporting?: ApiRequestReporting,
  ): Promise<CatalogCategory> {
    const response = await this.request(
      catalogApiPaths.categories,
      isCatalogCategoryDto,
      accessToken,
      "POST",
      201,
      category,
      createRequestFeedback(reporting, {
        operationKey: "catalog.category.create",
        resourceKey: "categories",
        kind: "mutation",
      }),
    );

    return toCatalogCategory(response);
  }

  async updateCategory(
    accessToken: string,
    categoryId: string,
    category: UpdateCatalogCategory,
    reporting?: ApiRequestReporting,
  ): Promise<CatalogCategory> {
    const response = await this.request(
      `${catalogApiPaths.categories}/${categoryId}`,
      isCatalogCategoryDto,
      accessToken,
      "PATCH",
      200,
      category,
      createRequestFeedback(reporting, {
        operationKey: "catalog.category.update",
        resourceKey: categoryId,
        kind: "mutation",
      }),
    );

    return toCatalogCategory(response);
  }

  async reorderCategories(
    accessToken: string,
    categoryIds: readonly string[],
    reporting?: ApiRequestReporting,
  ): Promise<readonly CatalogCategory[]> {
    const response = await this.request(
      `${catalogApiPaths.categories}/reorder`,
      isCatalogCategories,
      accessToken,
      "POST",
      200,
      { categoryIds },
      createRequestFeedback(reporting, {
        operationKey: "catalog.category.reorder",
        resourceKey: "categories",
        kind: "mutation",
      }),
    );

    return response.map(toCatalogCategory);
  }

  archiveCategory(
    accessToken: string,
    categoryId: string,
    reporting?: ApiRequestReporting,
  ): Promise<void> {
    return this.request(
      `${catalogApiPaths.categories}/${categoryId}`,
      isUndefined,
      accessToken,
      "DELETE",
      204,
      undefined,
      createRequestFeedback(reporting, {
        operationKey: "catalog.category.archive",
        resourceKey: categoryId,
        kind: "mutation",
      }),
    );
  }

  async createProduct(
    accessToken: string,
    product: CreateCatalogProduct,
    reporting?: ApiRequestReporting,
  ): Promise<CatalogProduct> {
    const response = await this.request(
      catalogApiPaths.products,
      isAdminV3ProductDto,
      accessToken,
      "POST",
      201,
      toV3CatalogProductCommand(product),
      createRequestFeedback(reporting, {
        operationKey: "catalog.product.create",
        resourceKey: product.categoryId,
        kind: "mutation",
      }),
    );

    return toCatalogProductV3(response);
  }

  async updateProduct(
    accessToken: string,
    productId: string,
    product: UpdateCatalogProduct,
    reporting?: ApiRequestReporting,
  ): Promise<CatalogProduct> {
    const response = await this.request(
      `${catalogApiPaths.products}/${productId}`,
      isAdminV3ProductDto,
      accessToken,
      "PATCH",
      200,
      toV3CatalogProductCommand(product),
      createRequestFeedback(reporting, {
        operationKey: "catalog.product.update",
        resourceKey: productId,
        kind: "mutation",
      }),
    );

    return toCatalogProductV3(response);
  }

  async reorderProducts(
    accessToken: string,
    categoryId: string,
    productIds: readonly string[],
    reporting?: ApiRequestReporting,
  ): Promise<readonly CatalogProduct[]> {
    const response = await this.request(
      `${catalogApiPaths.products}/reorder`,
      isAdminV3ProductDtos,
      accessToken,
      "POST",
      200,
      { categoryId, productIds },
      createRequestFeedback(reporting, {
        operationKey: "catalog.product.reorder",
        resourceKey: categoryId,
        kind: "mutation",
      }),
    );

    return response.map(toCatalogProductV3);
  }

  archiveProduct(
    accessToken: string,
    productId: string,
    reporting?: ApiRequestReporting,
  ): Promise<void> {
    return this.request(
      `${catalogApiPaths.products}/${productId}`,
      isUndefined,
      accessToken,
      "DELETE",
      204,
      undefined,
      createRequestFeedback(reporting, {
        operationKey: "catalog.product.archive",
        resourceKey: productId,
        kind: "mutation",
      }),
    );
  }

  archiveModifierGroup(
    accessToken: string,
    groupId: string,
    reporting?: ApiRequestReporting,
  ): Promise<void> {
    return this.request(
      `${catalogApiPaths.modifierGroups}/${groupId}`,
      isUndefined,
      accessToken,
      "DELETE",
      204,
      undefined,
      createRequestFeedback(reporting, {
        operationKey: "catalog.modifierGroup.archive",
        resourceKey: groupId,
        kind: "mutation",
      }),
    );
  }

  async saveModifierGroup(
    accessToken: string,
    group: SaveCatalogModifierGroup,
    reporting?: ApiRequestReporting,
  ): Promise<CatalogModifierGroup> {
    const { id, ...body } = group;
    const response = await this.request<CatalogModifierGroupAggregateDto>(
      id === undefined
        ? catalogApiPaths.modifierGroups
        : `${catalogApiPaths.modifierGroups}/${id}`,
      isCatalogModifierGroupAggregateDto,
      accessToken,
      id === undefined ? "POST" : "PATCH",
      id === undefined ? 201 : 200,
      body,
      createRequestFeedback(reporting, {
        operationKey: "catalog.modifierGroup.save",
        resourceKey: group.id ?? "new",
        kind: "mutation",
      }),
    );

    return toCatalogModifierGroup(response, response.options);
  }

  async createModifierOption(
    accessToken: string,
    groupId: string,
    option: CreateCatalogModifierOption,
    reporting?: ApiRequestReporting,
  ): Promise<CatalogModifierOption> {
    const response = await this.request(
      `${catalogApiPaths.modifierGroups}/${groupId}/options`,
      isCatalogModifierOptionDto,
      accessToken,
      "POST",
      201,
      option,
      createRequestFeedback(reporting, {
        operationKey: "catalog.modifierOption.create",
        resourceKey: groupId,
        kind: "mutation",
      }),
    );

    return toCatalogModifierOption(response);
  }

  async updateModifierOption(
    accessToken: string,
    optionId: string,
    option: UpdateCatalogModifierOption,
    reporting?: ApiRequestReporting,
  ): Promise<CatalogModifierOption> {
    const response = await this.request(
      `${catalogApiPaths.modifierGroups}/options/${optionId}`,
      isCatalogModifierOptionDto,
      accessToken,
      "PATCH",
      200,
      option,
      createRequestFeedback(reporting, {
        operationKey: "catalog.modifierOption.update",
        resourceKey: optionId,
        kind: "mutation",
      }),
    );

    return toCatalogModifierOption(response);
  }

  archiveModifierOption(
    accessToken: string,
    optionId: string,
    reporting?: ApiRequestReporting,
  ): Promise<void> {
    return this.request(
      `${catalogApiPaths.modifierGroups}/options/${optionId}`,
      isUndefined,
      accessToken,
      "DELETE",
      204,
      undefined,
      createRequestFeedback(reporting, {
        operationKey: "catalog.modifierOption.archive",
        resourceKey: optionId,
        kind: "mutation",
      }),
    );
  }

  async replaceCategoryModifierGroups(
    accessToken: string,
    categoryId: string,
    assignments: readonly CatalogCategoryModifierGroupAssignment[],
    reporting?: ApiRequestReporting,
  ): Promise<readonly CatalogCategoryModifierGroupAssignment[]> {
    const response = await this.request(
      `${catalogApiPaths.categories}/${categoryId}/modifier-groups`,
      isCatalogCategoryModifierGroupAssignments,
      accessToken,
      "PUT",
      200,
      {
        groupIds: assignments
          .filter((assignment) => assignment.categoryId === categoryId)
          .slice()
          .sort((left, right) => left.sortOrder - right.sortOrder)
          .map((assignment) => assignment.modifierGroupId),
      },
      createRequestFeedback(reporting, {
        operationKey: "catalog.category.modifiers",
        resourceKey: categoryId,
        kind: "mutation",
      }),
    );

    return response.map(toCatalogCategoryModifierGroupAssignment);
  }

  private async request<T>(
    path: string,
    validate: (value: unknown) => value is T,
    accessToken: string,
    method: string,
    expectedStatus: number,
    body?: unknown,
    feedback?: ApiRequestFeedback,
  ): Promise<T> {
    try {
      return await this.client.request(path, validate, {
        feedback,
        body,
        expectedStatus,
        headers: { authorization: `${bearerTokenType} ${accessToken}` },
        method,
      });
    } catch (error) {
      throw toCatalogApiError(error, requestReceipt(feedback));
    }
  }
}

function toV3CatalogProductCommand(product: CreateCatalogProduct) {
  return {
    categoryId: product.categoryId,
    description: product.description,
    isActive: product.isActive,
    isAvailable: product.isAvailable,
    name: product.name,
    portionLabel: product.portionLabel,
    price: product.price,
    priceChoices: product.priceChoices,
    sortOrder: product.sortOrder,
  };
}

function toCatalogApiError(
  error: unknown,
  receipt?: import("./client.types").ApiRequestReceipt,
): CatalogApiError {
  if (!(error instanceof ApiError)) {
    return new CatalogApiError({
      code: "API_CONTRACT_ERROR",
      details: null,
      fields: [],
      message: "Catalog API returned an invalid error.",
      occurrenceId: receipt?.id ?? crypto.randomUUID(),
      settlement: receipt,
      requestId: null,
      status: null,
      transportKind: "contract",
    });
  }

  const fields =
    error.code === "VALIDATION_ERROR"
      ? toCatalogValidationFields(error.details)
      : [];

  return new CatalogApiError({
    code: fields === null ? "API_CONTRACT_ERROR" : error.code,
    details: error.details,
    fields: fields ?? [],
    message: error.message,
    occurrenceId: error.occurrenceId,
    settlement: error.settlement,
    requestId: error.requestId,
    status: error.status,
    transportKind: error.transportKind,
  });
}

function toCatalogValidationFields(
  value: unknown,
): readonly CatalogValidationField[] | null {
  if (
    !isRecord(value) ||
    !Object.hasOwn(value, "fields") ||
    Object.keys(value).length !== 1 ||
    !Array.isArray(value.fields)
  ) {
    return null;
  }

  return value.fields.every(isCatalogValidationField) ? value.fields : null;
}

function isCatalogValidationField(
  value: unknown,
): value is CatalogValidationField {
  return isRecord(value) && isString(value.path) && isString(value.reason);
}

function toCatalogV3(response: AdminV3CatalogResponseDto): Catalog {
  return {
    categories: response.categories.map(toCatalogCategory),
    categoryModifierGroupAssignments: response.categoryModifierGroups.map(
      toCatalogCategoryModifierGroupAssignment,
    ),
    modifierGroups: response.modifierGroups.map((group) =>
      toCatalogModifierGroup(
        group,
        response.modifierOptions.filter(({ groupId }) => groupId === group.id),
      ),
    ),
    products: response.products.map(toCatalogProductV3),
  };
}

function toCatalogProductV3(product: AdminV3ProductDto): CatalogProduct {
  return {
    categoryId: product.categoryId,
    description: product.description,
    id: product.id,
    isActive: product.isActive,
    isAvailable: product.isAvailable,
    name: product.name,
    portionLabel: product.portionLabel,
    price: product.price,
    priceChoices: product.priceChoices.map((choice) => ({ ...choice })),
    sortOrder: product.sortOrder,
  };
}

function toCatalogCategory(category: CatalogCategoryDto): CatalogCategory {
  return {
    description: category.description,
    id: category.id,
    isActive: category.isActive,
    name: category.name,
    sortOrder: category.sortOrder,
  };
}

function toCatalogModifierGroup(
  group: CatalogModifierGroupDto,
  options: readonly CatalogModifierOptionDto[],
): CatalogModifierGroup {
  return {
    id: group.id,
    isActive: group.isActive,
    maxSelect: group.maxSelect,
    minSelect: group.minSelect,
    name: group.name,
    options: options.map(toCatalogModifierOption),
    selectionType: group.selectionType,
  };
}

function toCatalogModifierOption(
  option: CatalogModifierOptionDto,
): CatalogModifierOption {
  return {
    groupId: option.groupId,
    id: option.id,
    isAvailable: option.isAvailable,
    isDefault: option.isDefault,
    name: option.name,
    priceDelta: option.priceDelta,
    sortOrder: option.sortOrder,
  };
}

function toCatalogCategoryModifierGroupAssignment(
  assignment: CatalogCategoryModifierGroupAssignmentDto,
): CatalogCategoryModifierGroupAssignment {
  return {
    categoryId: assignment.categoryId,
    modifierGroupId: assignment.groupId,
    sortOrder: assignment.sortOrder,
  };
}

function isAdminV3CatalogResponseDto(
  value: unknown,
): value is AdminV3CatalogResponseDto {
  if (!isRecord(value)) return false;
  return (
    isCatalogCategories(value.categories) &&
    Array.isArray(value.products) &&
    value.products.every(isAdminV3ProductDto) &&
    isCatalogModifierGroupDtos(value.modifierGroups) &&
    isCatalogModifierOptions(value.modifierOptions) &&
    isCatalogCategoryModifierGroupAssignments(value.categoryModifierGroups)
  );
}

function isAdminV3ProductDto(value: unknown): value is AdminV3ProductDto {
  if (
    !isRecord(value) ||
    !isUuid(value.id) ||
    !isUuid(value.categoryId) ||
    !isString(value.name) ||
    !isString(value.description) ||
    !(value.price === null || isNonNegativeInteger(value.price)) ||
    !isInteger(value.sortOrder) ||
    typeof value.isActive !== "boolean" ||
    typeof value.isAvailable !== "boolean"
  )
    return false;
  return (
    (value.portionLabel === null || isString(value.portionLabel)) &&
    Array.isArray(value.priceChoices) &&
    value.priceChoices.every(isAdminV3PriceChoiceDto)
  );
}

function isAdminV3ProductDtos(
  value: unknown,
): value is readonly AdminV3ProductDto[] {
  return Array.isArray(value) && value.every(isAdminV3ProductDto);
}

function isAdminV3PriceChoiceDto(value: unknown): boolean {
  return (
    isRecord(value) &&
    isUuid(value.id) &&
    isString(value.portionLabel) &&
    isNonNegativeInteger(value.price) &&
    isInteger(value.sortOrder) &&
    typeof value.isAvailable === "boolean"
  );
}

function isCatalogCategoryDto(value: unknown): value is CatalogCategoryDto {
  return (
    isRecord(value) &&
    isUuid(value.id) &&
    isString(value.name) &&
    isString(value.description) &&
    isInteger(value.sortOrder) &&
    typeof value.isActive === "boolean"
  );
}

function isCatalogCategories(
  value: unknown,
): value is readonly CatalogCategoryDto[] {
  return Array.isArray(value) && value.every(isCatalogCategoryDto);
}

function isCatalogModifierGroupDto(
  value: unknown,
): value is CatalogModifierGroupDto {
  return (
    isRecord(value) &&
    isUuid(value.id) &&
    isString(value.name) &&
    isCatalogModifierSelectionType(value.selectionType) &&
    isInteger(value.minSelect) &&
    isInteger(value.maxSelect) &&
    typeof value.isActive === "boolean"
  );
}

function isCatalogModifierGroupDtos(
  value: unknown,
): value is readonly CatalogModifierGroupDto[] {
  return Array.isArray(value) && value.every(isCatalogModifierGroupDto);
}

function isCatalogModifierGroupAggregateDto(
  value: unknown,
): value is CatalogModifierGroupAggregateDto {
  return (
    isCatalogModifierGroupDto(value) &&
    isRecord(value) &&
    isCatalogModifierOptions(value.options)
  );
}

function isCatalogModifierOptionDto(
  value: unknown,
): value is CatalogModifierOptionDto {
  return (
    isRecord(value) &&
    isUuid(value.id) &&
    isUuid(value.groupId) &&
    isString(value.name) &&
    isNonNegativeInteger(value.priceDelta) &&
    isInteger(value.sortOrder) &&
    typeof value.isDefault === "boolean" &&
    typeof value.isAvailable === "boolean"
  );
}

function isCatalogModifierOptions(
  value: unknown,
): value is readonly CatalogModifierOptionDto[] {
  return Array.isArray(value) && value.every(isCatalogModifierOptionDto);
}

function isCatalogCategoryModifierGroupAssignments(
  value: unknown,
): value is readonly CatalogCategoryModifierGroupAssignmentDto[] {
  return (
    Array.isArray(value) &&
    value.every(
      (assignment) =>
        isRecord(assignment) &&
        isUuid(assignment.categoryId) &&
        isUuid(assignment.groupId) &&
        isInteger(assignment.sortOrder),
    )
  );
}

function isCatalogModifierSelectionType(value: unknown): boolean {
  return catalogModifierSelectionTypes.some((type) => type === value);
}

function isUuid(value: unknown): value is string {
  return isString(value) && catalogUuidPattern.test(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value);
}

function isNonNegativeInteger(value: unknown): value is number {
  return isInteger(value) && value >= 0 && value <= 2_147_483_647;
}

function isUndefined(value: unknown): value is undefined {
  return value === undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

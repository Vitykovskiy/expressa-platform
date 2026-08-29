import { bearerTokenType } from "./auth.api.constants";
import { ApiClient, ApiError } from "./client";
import type {
  Availability,
  AvailabilityApiError,
  AvailabilityCategoryDto,
  AvailabilityCategoryModifierGroupDto,
  AvailabilityEntityType,
  AvailabilityGroup,
  AvailabilityModifierDto,
  AvailabilityModifierGroupDto,
  AvailabilityProductDto,
  AvailabilityResponseDto,
  AvailabilityUpdate,
  AvailabilityVariantDto,
  ServiceIntake,
  ServiceIntakeDto,
} from "./availability.api.types";

export class AvailabilityApi {
  constructor(private readonly client: ApiClient) {}

  async get(accessToken: string): Promise<Availability> {
    const response = await this.request(
      "/backoffice/availability",
      isAvailabilityResponseDto,
      accessToken,
      "GET",
    );

    return toAvailability(response);
  }

  update(
    accessToken: string,
    type: AvailabilityEntityType,
    id: string,
    isAvailable: boolean,
  ): Promise<AvailabilityUpdate> {
    return this.request(
      `/backoffice/availability/${type}/${id}`,
      isAvailabilityUpdate,
      accessToken,
      "PATCH",
      { isAvailable },
    );
  }

  async updateIntake(
    accessToken: string,
    acceptsNewOrders: boolean,
  ): Promise<ServiceIntake> {
    const intake = await this.request(
      "/backoffice/service/intake",
      isServiceIntakeDto,
      accessToken,
      "PATCH",
      { acceptsNewOrders },
    );

    return toServiceIntake(intake);
  }

  private async request<T>(
    path: string,
    validate: (value: unknown) => value is T,
    accessToken: string,
    method: "GET" | "PATCH",
    body?: unknown,
  ): Promise<T> {
    try {
      return await this.client.request(path, validate, {
        body,
        expectedStatus: 200,
        headers: { authorization: `${bearerTokenType} ${accessToken}` },
        method,
      });
    } catch (error) {
      throw toAvailabilityApiError(error);
    }
  }
}

function toAvailabilityApiError(error: unknown): AvailabilityApiError {
  if (error instanceof ApiError) {
    return {
      code: error.code,
      details: error.details,
      message: error.message,
      requestId: error.requestId,
      status: error.status,
    };
  }

  return {
    code: "API_CONTRACT_ERROR",
    details: null,
    message: "Сервис доступности вернул некорректный ответ.",
    requestId: null,
    status: null,
  };
}

function toAvailability(response: AvailabilityResponseDto): Availability {
  const groups = response.categories
    .filter((category) => category.isActive)
    .slice()
    .sort(bySortOrder)
    .map((category) => toAvailabilityGroup(category, response));

  return { groups, intake: toServiceIntake(response.intake) };
}

function toServiceIntake(intake: ServiceIntakeDto): ServiceIntake {
  return {
    acceptsNewOrders: intake.acceptsNewOrders,
    updatedAt: intake.updatedAt,
    updatedByLabel: intake.updatedByLabel,
  };
}

function toAvailabilityGroup(
  category: AvailabilityCategoryDto,
  response: AvailabilityResponseDto,
): AvailabilityGroup {
  const products = response.products
    .filter((product) => product.categoryId === category.id && product.isActive)
    .slice()
    .sort(bySortOrder);
  const productItems = products.flatMap((product) => [
    toProductItem(product),
    ...response.productVariants
      .filter((variant) => variant.productId === product.id)
      .slice()
      .sort(bySortOrder)
      .map((variant) => toVariantItem(product, variant)),
  ]);
  const modifierItems = response.categoryModifierGroups
    .filter((assignment) => assignment.categoryId === category.id)
    .slice()
    .sort(bySortOrder)
    .flatMap((assignment) => {
      const group = response.modifierGroups.find(
        (currentGroup) => currentGroup.id === assignment.groupId,
      );
      if (group === undefined || !group.isActive) return [];

      return response.modifierOptions
        .filter((option) => option.groupId === group.id)
        .slice()
        .sort(bySortOrder)
        .map((option) => toModifierItem(group, option));
    });

  return {
    id: category.id,
    items: [...productItems, ...modifierItems],
    name: category.name,
    sortOrder: category.sortOrder,
  };
}

function toProductItem(product: AvailabilityProductDto) {
  return {
    id: product.id,
    isAvailable: product.isAvailable,
    label: product.name,
    sublabel: "Товар",
    type: "product" as const,
  };
}

function toVariantItem(
  product: AvailabilityProductDto,
  variant: AvailabilityVariantDto,
) {
  return {
    id: variant.id,
    isAvailable: variant.isAvailable,
    label: `${product.name} · ${variant.size}`,
    sublabel: "Размер",
    type: "variant" as const,
  };
}

function toModifierItem(
  group: AvailabilityModifierGroupDto,
  option: AvailabilityModifierDto,
) {
  return {
    id: option.id,
    isAvailable: option.isAvailable,
    label: `${group.name} · ${option.name}`,
    sublabel: "Добавка",
    type: "modifier" as const,
  };
}

function isAvailabilityResponseDto(
  value: unknown,
): value is AvailabilityResponseDto {
  if (!isRecord(value)) return false;

  const {
    categories,
    categoryModifierGroups,
    intake,
    modifierGroups,
    modifierOptions,
    productVariants,
    products,
  } = value;
  if (
    !isAvailabilityCategories(categories) ||
    !isAvailabilityCategoryModifierGroups(categoryModifierGroups) ||
    !isServiceIntakeDto(intake) ||
    !isAvailabilityModifierGroups(modifierGroups) ||
    !isAvailabilityModifiers(modifierOptions) ||
    !isAvailabilityVariants(productVariants) ||
    !isAvailabilityProducts(products)
  ) {
    return false;
  }

  return hasValidReferences({
    categories,
    categoryModifierGroups,
    modifierGroups,
    modifierOptions,
    productVariants,
    products,
  });
}

function isAvailabilityUpdate(value: unknown): value is AvailabilityUpdate {
  return (
    isRecord(value) &&
    isAvailabilityEntityType(value.type) &&
    isUuid(value.id) &&
    typeof value.isAvailable === "boolean"
  );
}

function isServiceIntakeDto(value: unknown): value is ServiceIntakeDto {
  return (
    isRecord(value) &&
    typeof value.acceptsNewOrders === "boolean" &&
    (value.updatedBy === null || isUuid(value.updatedBy)) &&
    (value.updatedByLabel === null || isE164Phone(value.updatedByLabel)) &&
    (value.updatedAt === null || isDateTime(value.updatedAt))
  );
}

function isAvailabilityCategories(
  value: unknown,
): value is readonly AvailabilityCategoryDto[] {
  return Array.isArray(value) && value.every(isAvailabilityCategory);
}

function isAvailabilityCategory(
  value: unknown,
): value is AvailabilityCategoryDto {
  return (
    isRecord(value) &&
    isUuid(value.id) &&
    typeof value.isActive === "boolean" &&
    isString(value.name) &&
    isInteger(value.sortOrder)
  );
}

function isAvailabilityProducts(
  value: unknown,
): value is readonly AvailabilityProductDto[] {
  return Array.isArray(value) && value.every(isAvailabilityProduct);
}

function isAvailabilityProduct(
  value: unknown,
): value is AvailabilityProductDto {
  return (
    isRecord(value) &&
    isUuid(value.categoryId) &&
    isUuid(value.id) &&
    typeof value.isActive === "boolean" &&
    typeof value.isAvailable === "boolean" &&
    isString(value.name) &&
    isInteger(value.sortOrder)
  );
}

function isAvailabilityVariants(
  value: unknown,
): value is readonly AvailabilityVariantDto[] {
  return Array.isArray(value) && value.every(isAvailabilityVariant);
}

function isAvailabilityVariant(
  value: unknown,
): value is AvailabilityVariantDto {
  return (
    isRecord(value) &&
    isUuid(value.id) &&
    typeof value.isAvailable === "boolean" &&
    isUuid(value.productId) &&
    (value.size === "S" || value.size === "M" || value.size === "L") &&
    isInteger(value.sortOrder)
  );
}

function isAvailabilityModifierGroups(
  value: unknown,
): value is readonly AvailabilityModifierGroupDto[] {
  return Array.isArray(value) && value.every(isAvailabilityModifierGroup);
}

function isAvailabilityModifierGroup(
  value: unknown,
): value is AvailabilityModifierGroupDto {
  return (
    isRecord(value) &&
    isUuid(value.id) &&
    typeof value.isActive === "boolean" &&
    isString(value.name)
  );
}

function isAvailabilityModifiers(
  value: unknown,
): value is readonly AvailabilityModifierDto[] {
  return Array.isArray(value) && value.every(isAvailabilityModifier);
}

function isAvailabilityModifier(
  value: unknown,
): value is AvailabilityModifierDto {
  return (
    isRecord(value) &&
    isUuid(value.groupId) &&
    isUuid(value.id) &&
    typeof value.isAvailable === "boolean" &&
    isString(value.name) &&
    isInteger(value.sortOrder)
  );
}

function isAvailabilityCategoryModifierGroups(
  value: unknown,
): value is readonly AvailabilityCategoryModifierGroupDto[] {
  return (
    Array.isArray(value) && value.every(isAvailabilityCategoryModifierGroup)
  );
}

function isAvailabilityCategoryModifierGroup(
  value: unknown,
): value is AvailabilityCategoryModifierGroupDto {
  return (
    isRecord(value) &&
    isUuid(value.categoryId) &&
    isUuid(value.groupId) &&
    isInteger(value.sortOrder)
  );
}

function hasValidReferences(
  response: Pick<
    AvailabilityResponseDto,
    | "categories"
    | "categoryModifierGroups"
    | "modifierGroups"
    | "modifierOptions"
    | "productVariants"
    | "products"
  >,
): boolean {
  const categoryIds = new Set(response.categories.map(({ id }) => id));
  const productIds = new Set(response.products.map(({ id }) => id));
  const modifierGroupIds = new Set(response.modifierGroups.map(({ id }) => id));

  return (
    response.products.every(({ categoryId }) => categoryIds.has(categoryId)) &&
    response.productVariants.every(({ productId }) =>
      productIds.has(productId),
    ) &&
    response.modifierOptions.every(({ groupId }) =>
      modifierGroupIds.has(groupId),
    ) &&
    response.categoryModifierGroups.every(
      ({ categoryId, groupId }) =>
        categoryIds.has(categoryId) && modifierGroupIds.has(groupId),
    )
  );
}

function bySortOrder<T extends { sortOrder: number }>(left: T, right: T) {
  return left.sortOrder - right.sortOrder;
}

function isAvailabilityEntityType(
  value: unknown,
): value is AvailabilityEntityType {
  return value === "modifier" || value === "product" || value === "variant";
}

function isUuid(value: unknown): value is string {
  return (
    isString(value) &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}

function isE164Phone(value: unknown): value is string {
  return isString(value) && /^\+[1-9]\d{1,14}$/.test(value);
}

function isDateTime(value: unknown): value is string {
  return isString(value) && !Number.isNaN(Date.parse(value));
}

function isInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

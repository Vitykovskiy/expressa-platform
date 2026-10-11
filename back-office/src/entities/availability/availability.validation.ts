import { contractFailure, isRecord } from "../../shared/api/transport";
import {
  availabilityDatePattern,
  availabilityInt32Maximum,
  availabilityPhonePattern,
  availabilityUuidPattern,
} from "./availability.constants";
import type {
  AvailabilityDto,
  AvailabilityGroupDto,
  Intake,
} from "./availability.types";

function record(value: unknown) {
  if (!isRecord(value)) return contractFailure();

  return value;
}

function string(value: unknown) {
  if (typeof value !== "string") return contractFailure();

  return value;
}

function uuid(value: unknown) {
  const result = string(value);

  if (!availabilityUuidPattern.test(result)) return contractFailure();

  return result;
}

function boolean(value: unknown) {
  if (typeof value !== "boolean") return contractFailure();

  return value;
}

function integer(value: unknown, signed = false, int32 = false) {
  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value) ||
    (!signed && value < 0) ||
    (int32 && value > availabilityInt32Maximum)
  )
    return contractFailure();

  return value;
}

function array<T>(value: unknown, parse: (entry: unknown) => T): T[] {
  if (!Array.isArray(value)) return contractFailure();

  return value.map(parse);
}

function unique(ids: string[]) {
  if (new Set(ids).size !== ids.length) contractFailure();
}

export function parseIntake(value: unknown): Intake {
  const data = record(value);
  const updatedByLabel =
    data.updatedByLabel === null ? null : string(data.updatedByLabel);
  const updatedAt = data.updatedAt === null ? null : string(data.updatedAt);

  if (updatedByLabel !== null && !availabilityPhonePattern.test(updatedByLabel))
    contractFailure();
  if (
    updatedAt !== null &&
    (!availabilityDatePattern.test(updatedAt) ||
      !Number.isFinite(Date.parse(updatedAt)))
  )
    contractFailure();

  return {
    acceptsNewOrders: boolean(data.acceptsNewOrders),
    updatedBy: data.updatedBy === null ? null : uuid(data.updatedBy),
    updatedByLabel,
    updatedAt,
  };
}

export function parseAvailability(value: unknown): AvailabilityDto {
  const data = record(value);
  const categories = array(data.categories, (entry) => {
    const item = record(entry);

    return {
      id: uuid(item.id),
      name: string(item.name),
      description: string(item.description),
      sortOrder: integer(item.sortOrder, false, true),
      isActive: boolean(item.isActive),
    };
  });
  const products = array(data.products, (entry) => {
    const item = record(entry);

    return {
      id: uuid(item.id),
      categoryId: uuid(item.categoryId),
      name: string(item.name),
      description: string(item.description),
      price: item.price === null ? null : integer(item.price),
      sortOrder: integer(item.sortOrder),
      isActive: boolean(item.isActive),
      isAvailable: boolean(item.isAvailable),
    };
  });
  const priceChoices = array(data.priceChoices, (entry) => {
    const item = record(entry);

    return {
      id: uuid(item.id),
      productId: uuid(item.productId),
      portionLabel: string(item.portionLabel),
      price: integer(item.price, false, true),
      sortOrder: integer(item.sortOrder, false, true),
      isAvailable: boolean(item.isAvailable),
    };
  });
  const modifierGroups = array<AvailabilityGroupDto>(
    data.modifierGroups,
    (entry) => {
      const item = record(entry);
      const selectionType = item.selectionType;

      if (selectionType !== "single" && selectionType !== "multiple")
        return contractFailure();

      return {
        id: uuid(item.id),
        name: string(item.name),
        selectionType,
        minSelect: integer(item.minSelect),
        maxSelect: integer(item.maxSelect),
        isActive: boolean(item.isActive),
      };
    },
  );
  const modifierOptions = array(data.modifierOptions, (entry) => {
    const item = record(entry);

    return {
      id: uuid(item.id),
      groupId: uuid(item.groupId),
      name: string(item.name),
      priceDelta: integer(item.priceDelta, true),
      sortOrder: integer(item.sortOrder),
      isDefault: boolean(item.isDefault),
      isAvailable: boolean(item.isAvailable),
    };
  });
  const categoryModifierGroups = array(data.categoryModifierGroups, (entry) => {
    const item = record(entry);

    return {
      categoryId: uuid(item.categoryId),
      groupId: uuid(item.groupId),
      sortOrder: integer(item.sortOrder),
    };
  });
  const productModifierGroups = array(data.productModifierGroups, (entry) => {
    const item = record(entry);

    return {
      productId: uuid(item.productId),
      groupId: uuid(item.groupId),
      sortOrder: integer(item.sortOrder, false, true),
    };
  });
  const categoryIds = new Set(categories.map((item) => item.id));
  const productIds = new Set(products.map((item) => item.id));
  const groupIds = new Set(modifierGroups.map((item) => item.id));

  for (const items of [
    categories,
    products,
    priceChoices,
    modifierGroups,
    modifierOptions,
  ])
    unique(items.map((item) => item.id));
  unique(
    categoryModifierGroups.map((item) => `${item.categoryId}:${item.groupId}`),
  );
  unique(
    productModifierGroups.map((item) => `${item.productId}:${item.groupId}`),
  );

  if (
    products.some((item) => !categoryIds.has(item.categoryId)) ||
    priceChoices.some((item) => !productIds.has(item.productId)) ||
    modifierOptions.some((item) => !groupIds.has(item.groupId)) ||
    categoryModifierGroups.some(
      (item) =>
        !categoryIds.has(item.categoryId) || !groupIds.has(item.groupId),
    ) ||
    productModifierGroups.some(
      (item) => !productIds.has(item.productId) || !groupIds.has(item.groupId),
    )
  )
    contractFailure();

  return {
    categories,
    products,
    priceChoices,
    modifierGroups,
    modifierOptions,
    categoryModifierGroups,
    productModifierGroups,
    intake: parseIntake(data.intake),
  };
}

export function parseAvailabilityTarget(
  value: unknown,
  kind: string,
  id: string,
  requested: boolean,
) {
  const data = record(value);

  // v3 shape is runtime-derived from repository AvailabilityTarget after COMMIT.
  if (
    data.type !== kind ||
    uuid(data.id) !== id ||
    boolean(data.isAvailable) !== requested
  )
    contractFailure();

  return requested;
}

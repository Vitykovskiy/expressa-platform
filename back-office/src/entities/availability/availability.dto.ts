import { AVAILABILITY_UUID } from "./availability.constants";
import type {
  AvailabilityCategoryDto,
  AvailabilityChoiceDto,
  AvailabilityDto,
  AvailabilityGroupDto,
  AvailabilityIntakeDto,
  AvailabilityTarget,
  AvailabilityModifierDto,
  AvailabilityProductDto,
} from "./availability.types";

export function parseAvailability(value: unknown): AvailabilityDto | null {
  try {
    const source = object(value);
    const categories = collection(source.categories).map(readCategory);
    const modifierGroups = collection(source.modifierGroups).map(
      readModifierGroup,
    );
    const products = collection(source.products).map(readProduct);
    const modifierOptions = collection(source.modifierOptions).map(
      readModifier,
    );
    const priceChoices = collection(source.priceChoices).map(readPriceChoice);

    for (const rows of [
      categories,
      modifierGroups,
      products,
      modifierOptions,
      priceChoices,
    ]) {
      if (new Set(rows.map((row) => row.id)).size !== rows.length) {
        return null;
      }
    }

    if (
      products.some(
        (product) =>
          !categories.some((category) => category.id === product.categoryId),
      )
    ) {
      return null;
    }

    if (
      modifierOptions.some(
        (option) =>
          !modifierGroups.some((group) => group.id === option.groupId),
      )
    ) {
      return null;
    }

    if (
      priceChoices.some(
        (choice) =>
          !products.some((product) => product.id === choice.productId),
      )
    ) {
      return null;
    }

    // Активному товару нужна фиксированная цена или хотя бы один размер.
    if (
      products.some(
        (product) =>
          product.isActive &&
          product.price === null &&
          !priceChoices.some((choice) => choice.productId === product.id),
      )
    ) {
      return null;
    }

    return {
      intake: readIntake(object(source.intake)),
      categories,
      modifierGroups,
      products,
      modifierOptions,
      priceChoices,
    };
  } catch {
    return null;
  }
}

export function confirmsAvailabilityChange(
  value: unknown,
  target: AvailabilityTarget,
  expectedAvailable: boolean,
): boolean {
  if (target.type === "intake") {
    const intake = parseIntake(value);

    return intake !== null && intake.acceptsNewOrders === expectedAvailable;
  }

  if (typeof value !== "object" || value === null) {
    return false;
  }

  const responseType =
    target.type === "price-choice" ? "price_choice" : target.type;

  if (!("type" in value) || value.type !== responseType) {
    return false;
  }

  if (!("id" in value) || value.id !== target.id) {
    return false;
  }

  return "isAvailable" in value && value.isAvailable === expectedAvailable;
}

function readCategory(value: unknown): AvailabilityCategoryDto {
  const row = object(value);

  return {
    id: uuid(row.id),
    name: text(row.name),
    sortOrder: integer(row.sortOrder),
    isActive: boolean(row.isActive),
  };
}

function readModifierGroup(value: unknown): AvailabilityGroupDto {
  const row = object(value);

  return {
    id: uuid(row.id),
    name: text(row.name),
    isActive: boolean(row.isActive),
  };
}

function readProduct(value: unknown): AvailabilityProductDto {
  const row = object(value);

  return {
    id: uuid(row.id),
    categoryId: uuid(row.categoryId),
    name: text(row.name),
    price: row.price === null ? null : integer(row.price),
    sortOrder: integer(row.sortOrder),
    isActive: boolean(row.isActive),
    isAvailable: boolean(row.isAvailable),
  };
}

function readModifier(value: unknown): AvailabilityModifierDto {
  const row = object(value);

  return {
    id: uuid(row.id),
    groupId: uuid(row.groupId),
    name: text(row.name),
    priceDelta: integer(row.priceDelta),
    sortOrder: integer(row.sortOrder),
    isAvailable: boolean(row.isAvailable),
  };
}

function readPriceChoice(value: unknown): AvailabilityChoiceDto {
  const row = object(value);

  return {
    id: uuid(row.id),
    productId: uuid(row.productId),
    portionLabel: text(row.portionLabel),
    isAvailable: boolean(row.isAvailable),
    price: integer(row.price),
    sortOrder: integer(row.sortOrder),
  };
}

function object(value: unknown): Record<string, unknown> {
  if (!isObject(value)) {
    throw new TypeError("Некорректный объект доступности");
  }

  return value;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function collection(value: unknown): readonly unknown[] {
  if (!Array.isArray(value)) {
    throw new TypeError("Некорректная коллекция доступности");
  }

  return value;
}

function text(value: unknown): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new TypeError("Некорректная строка доступности");
  }

  return value;
}

function uuid(value: unknown): string {
  const id = text(value);

  if (!AVAILABILITY_UUID.test(id)) {
    throw new TypeError("Некорректный идентификатор доступности");
  }

  return id;
}

function boolean(value: unknown): boolean {
  if (typeof value !== "boolean") {
    throw new TypeError("Некорректный признак доступности");
  }

  return value;
}

function integer(value: unknown): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    throw new TypeError("Некорректное число доступности");
  }

  return value;
}

export function parseIntake(value: unknown): AvailabilityIntakeDto | null {
  try {
    return readIntake(object(value));
  } catch {
    return null;
  }
}

function readIntake(value: Record<string, unknown>): AvailabilityIntakeDto {
  const label =
    value.updatedByLabel === null ? null : text(value.updatedByLabel);
  const updatedAt = value.updatedAt;

  if (
    updatedAt !== null &&
    (typeof updatedAt !== "string" ||
      !/^\d{4}-\d{2}-\d{2}T/u.test(updatedAt) ||
      !Number.isFinite(Date.parse(updatedAt)))
  ) {
    throw new TypeError("Некорректное время изменения приёма");
  }

  return {
    acceptsNewOrders: boolean(value.acceptsNewOrders),
    updatedByLabel: label,
    updatedAt,
  };
}

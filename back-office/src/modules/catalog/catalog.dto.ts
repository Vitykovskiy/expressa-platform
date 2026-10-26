import { CATALOG_UUID, MAX_CATALOG_MONEY } from "./catalog.constants";
import type {
  CatalogCategory,
  CatalogAssociation,
  CatalogChoice,
  CatalogData,
  CatalogModifierGroup,
  CatalogOption,
  CatalogProduct,
} from "./catalog.types";

export function catalogObject(value: unknown): Record<string, unknown> {
  if (!isObject(value)) {
    throw new TypeError("Некорректный объект каталога");
  }

  return value;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function rows(value: unknown): unknown[] {
  if (!Array.isArray(value)) {
    throw new TypeError("Некорректный список каталога");
  }

  return value;
}

function text(value: unknown, allowEmpty = false): string {
  if (typeof value !== "string" || (!allowEmpty && value.trim() === "")) {
    throw new TypeError("Некорректная строка каталога");
  }

  return value;
}

export function catalogId(value: unknown): string {
  const id = text(value);

  if (!CATALOG_UUID.test(id)) {
    throw new TypeError("Некорректный ID каталога");
  }

  return id;
}

function integer(value: unknown): number {
  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value) ||
    value < 0 ||
    value > MAX_CATALOG_MONEY
  ) {
    throw new TypeError("Некорректное число каталога");
  }

  return value;
}

function flag(value: unknown): boolean {
  if (typeof value !== "boolean") {
    throw new TypeError("Некорректный признак каталога");
  }

  return value;
}

export function parseCategory(value: unknown): CatalogCategory {
  const row = catalogObject(value);

  return {
    id: catalogId(row.id),
    name: text(row.name),
    description: text(row.description, true),
    sortOrder: integer(row.sortOrder),
    isActive: flag(row.isActive),
  };
}

function parseChoice(value: unknown): CatalogChoice {
  const row = catalogObject(value);

  return {
    id: catalogId(row.id),
    portionLabel: text(row.portionLabel),
    price: integer(row.price),
    sortOrder: integer(row.sortOrder),
    isAvailable: flag(row.isAvailable),
  };
}

export function parseProduct(value: unknown): CatalogProduct {
  const product = parseCatalogProduct(value);

  // Ответ сохранения обязан содержать полную цену даже у неактивного товара.
  if (product.price === null && product.priceChoices.length === 0) {
    throw new TypeError("Некорректная ценовая модель");
  }

  return product;
}

function parseCatalogProduct(value: unknown): CatalogProduct {
  const row = catalogObject(value);
  const price = row.price === null ? null : integer(row.price);
  const priceChoices = rows(row.priceChoices).map(parseChoice);
  const categoryFields = parseCategory(value);

  // Административное чтение включает неактивные заготовки без настроенной цены.
  if (
    (categoryFields.isActive && price === null && priceChoices.length === 0) ||
    (price !== null && priceChoices.length !== 0)
  ) {
    throw new TypeError("Некорректная ценовая модель");
  }

  if (
    new Set(priceChoices.map((choice) => choice.id)).size !==
    priceChoices.length
  ) {
    throw new TypeError("Некорректная ценовая модель");
  }

  return {
    ...categoryFields,
    categoryId: catalogId(row.categoryId),
    price,
    portionLabel: row.portionLabel === null ? null : text(row.portionLabel),
    priceChoices,
    isAvailable: flag(row.isAvailable),
  };
}

export function parseGroup(value: unknown): CatalogModifierGroup {
  const row = catalogObject(value);

  if (row.selectionType !== "single" && row.selectionType !== "multiple") {
    throw new TypeError("Некорректный тип группы");
  }

  const minSelect = integer(row.minSelect);
  const maxSelect = integer(row.maxSelect);

  if (
    maxSelect < minSelect ||
    (row.selectionType === "single" && maxSelect !== 1)
  ) {
    throw new TypeError("Некорректные ограничения группы");
  }

  return {
    id: catalogId(row.id),
    name: text(row.name),
    selectionType: row.selectionType,
    minSelect,
    maxSelect,
    isActive: flag(row.isActive),
  };
}

export function parseOption(value: unknown): CatalogOption {
  const row = catalogObject(value);

  return {
    id: catalogId(row.id),
    groupId: catalogId(row.groupId),
    name: text(row.name),
    priceDelta: integer(row.priceDelta),
    sortOrder: integer(row.sortOrder),
    isDefault: flag(row.isDefault),
    isAvailable: flag(row.isAvailable),
  };
}

export function parseCatalog(value: unknown): CatalogData | null {
  try {
    const source = catalogObject(value);
    const categories = rows(source.categories).map(parseCategory);
    const products = rows(source.products).map(parseCatalogProduct);
    const modifierGroups = rows(source.modifierGroups).map(parseGroup);
    const modifierOptions = rows(source.modifierOptions).map(parseOption);
    const categoryModifierGroups = rows(source.categoryModifierGroups).map(
      parseCategoryAssociation,
    );

    for (const collection of [
      categories,
      products,
      modifierGroups,
      modifierOptions,
    ]) {
      if (new Set(collection.map((row) => row.id)).size !== collection.length) {
        return null;
      }
    }

    if (
      products.some(
        (row) => !categories.some((category) => category.id === row.categoryId),
      )
    ) {
      return null;
    }

    if (
      modifierOptions.some(
        (row) => !modifierGroups.some((group) => group.id === row.groupId),
      )
    ) {
      return null;
    }

    if (
      categoryModifierGroups.some(
        (row) =>
          !categories.some((category) => category.id === row.categoryId) ||
          !modifierGroups.some((group) => group.id === row.groupId),
      )
    ) {
      return null;
    }

    return {
      categories,
      products,
      modifierGroups,
      modifierOptions,
      categoryModifierGroups,
    };
  } catch {
    return null;
  }
}

function parseCategoryAssociation(value: unknown): CatalogAssociation {
  const row = catalogObject(value);

  return {
    categoryId: catalogId(row.categoryId),
    groupId: catalogId(row.groupId),
    sortOrder: integer(row.sortOrder),
  };
}

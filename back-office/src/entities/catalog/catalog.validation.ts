import { contractFailure, isRecord } from "../../shared/api/transport";
import { catalogInt32Maximum, catalogUuidPattern } from "./catalog.constants";
import type {
  CatalogDto,
  CatalogGroupDto,
  CatalogProductDto,
  CategoryDto,
  CatalogOptionDto,
  ModifierAggregate,
} from "./catalog.types";
import { normalizePortion } from "./product.mapper";

function record(value: unknown) {
  if (!isRecord(value)) return contractFailure();

  return value;
}

function text(value: unknown) {
  if (typeof value !== "string") return contractFailure();

  return value;
}

function uuid(value: unknown) {
  const result = text(value);

  if (!catalogUuidPattern.test(result)) return contractFailure();

  return result;
}

function flag(value: unknown) {
  if (typeof value !== "boolean") return contractFailure();

  return value;
}

function integer(value: unknown, signed = false) {
  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value) ||
    value > catalogInt32Maximum ||
    (signed ? value < -catalogInt32Maximum - 1 : value < 0)
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

export function parseCategory(value: unknown): CategoryDto {
  const item = record(value);
  const name = text(item.name);

  if (name.trim() === "") contractFailure();

  return {
    id: uuid(item.id),
    name,
    description: text(item.description),
    sortOrder: integer(item.sortOrder),
    isActive: flag(item.isActive),
  };
}

export function parseCategories(value: unknown) {
  const result = array(value, parseCategory);

  unique(result.map((item) => item.id));

  return result;
}

export function parseProduct(value: unknown): CatalogProductDto {
  const item = record(value);
  const product = {
    ...parseCategory(item),
    categoryId: uuid(item.categoryId),
    price: item.price === null ? null : integer(item.price),
    portionLabel: item.portionLabel === null ? null : text(item.portionLabel),
    isAvailable: flag(item.isAvailable),
    priceChoices: array(item.priceChoices, (entry) => {
      const choice = record(entry);

      return {
        id: uuid(choice.id),
        portionLabel: text(choice.portionLabel),
        price: integer(choice.price),
        sortOrder: integer(choice.sortOrder),
        isAvailable: flag(choice.isAvailable),
      };
    }),
  };

  unique(product.priceChoices.map((choice) => choice.id));
  unique(
    product.priceChoices.map((choice) =>
      normalizePortion(choice.portionLabel).toLocaleLowerCase("ru-RU"),
    ),
  );
  unique(product.priceChoices.map((choice) => String(choice.sortOrder)));

  return product;
}

export function parseProducts(value: unknown) {
  const products = array(value, parseProduct);

  unique(products.map((product) => product.id));
  unique(
    products.flatMap((product) =>
      product.priceChoices.map((choice) => choice.id),
    ),
  );

  return products;
}

export function parseModifierOption(value: unknown): CatalogOptionDto {
  const item = record(value);
  const name = text(item.name);

  if (name.trim() === "") contractFailure();

  return {
    id: uuid(item.id),
    groupId: uuid(item.groupId),
    name,
    priceDelta: integer(item.priceDelta),
    sortOrder: integer(item.sortOrder),
    isDefault: flag(item.isDefault),
    isAvailable: flag(item.isAvailable),
  };
}

export function parseModifierOptions(value: unknown) {
  const options = array(value, parseModifierOption);

  unique(options.map((item) => item.id));
  unique(options.map((item) => String(item.sortOrder)));

  return options;
}

export function parseModifier(value: unknown): ModifierAggregate {
  const item = record(value);
  const selectionType = item.selectionType;

  if (selectionType !== "single" && selectionType !== "multiple")
    return contractFailure();
  const group: ModifierAggregate = {
    id: uuid(item.id),
    name: text(item.name),
    selectionType,
    minSelect: integer(item.minSelect),
    maxSelect: integer(item.maxSelect),
    isActive: flag(item.isActive),
    options: parseModifierOptions(item.options),
  };

  if (
    group.name.trim() === "" ||
    group.maxSelect < group.minSelect ||
    (group.selectionType === "single" && group.maxSelect !== 1) ||
    group.options.some((option) => option.groupId !== group.id)
  )
    contractFailure();

  return group;
}

export function parseCatalog(value: unknown): CatalogDto {
  const data = record(value);
  const categories = parseCategories(data.categories);
  const products = parseProducts(data.products);
  const modifierGroups = array<CatalogGroupDto>(
    data.modifierGroups,
    (entry) => {
      const item = record(entry);
      const selectionType = item.selectionType;

      if (selectionType !== "single" && selectionType !== "multiple")
        return contractFailure();

      return {
        id: uuid(item.id),
        name: text(item.name),
        selectionType,
        minSelect: integer(item.minSelect),
        maxSelect: integer(item.maxSelect),
        isActive: flag(item.isActive),
      };
    },
  );
  const modifierOptions = array(data.modifierOptions, (entry) => {
    const item = record(entry);

    return {
      id: uuid(item.id),
      groupId: uuid(item.groupId),
      name: text(item.name),
      priceDelta: integer(item.priceDelta, true),
      sortOrder: integer(item.sortOrder),
      isDefault: flag(item.isDefault),
      isAvailable: flag(item.isAvailable),
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
  const categoryIds = new Set(categories.map((item) => item.id));
  const groupIds = new Set(modifierGroups.map((item) => item.id));

  for (const entries of [products, modifierGroups, modifierOptions])
    unique(entries.map((item) => item.id));
  unique(
    products.flatMap((item) => item.priceChoices.map((choice) => choice.id)),
  );
  unique(
    categoryModifierGroups.map((item) => `${item.categoryId}:${item.groupId}`),
  );
  if (
    products.some((item) => !categoryIds.has(item.categoryId)) ||
    modifierOptions.some((item) => !groupIds.has(item.groupId)) ||
    categoryModifierGroups.some(
      (item) =>
        !categoryIds.has(item.categoryId) || !groupIds.has(item.groupId),
    )
  )
    contractFailure();

  return {
    categories,
    products,
    modifierGroups,
    modifierOptions,
    categoryModifierGroups,
  };
}

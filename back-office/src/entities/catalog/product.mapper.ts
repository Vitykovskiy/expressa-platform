import type { DeepReadonly } from "vue";
import {
  catalogInt32Maximum,
  productChoiceFieldErrors,
  productFieldErrors,
} from "./catalog.constants";
import { sameCategoryFields } from "./catalog.mapper";
import type {
  CatalogProductDto,
  ProductChoiceDraft,
  ProductDraft,
  ProductErrors,
  ProductFields,
} from "./catalog.types";

export function normalizePortion(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function productInteger(value: string) {
  const number = Number(value);

  return value.trim() !== "" &&
    Number.isInteger(number) &&
    number >= 0 &&
    number <= catalogInt32Maximum
    ? number
    : null;
}

export function emptyChoice(key: number): ProductChoiceDraft {
  return {
    key,
    id: null,
    portionLabel: "",
    price: "",
    sortOrder: "",
    isAvailable: false,
  };
}

export function productDraft(
  product?: CatalogProductDto,
  categoryId = "",
): ProductDraft {
  return {
    name: product?.name ?? "",
    description: product?.description ?? "",
    categoryId: product?.categoryId ?? categoryId,
    sortOrder: product ? String(product.sortOrder) : "",
    isActive: product?.isActive ?? false,
    isAvailable: product?.isAvailable ?? false,
    mode: product && product.priceChoices.length > 0 ? "choices" : "single",
    price:
      product?.price === null || product === undefined
        ? ""
        : String(product.price),
    portionLabel: product?.portionLabel ?? "",
    choices: product
      ? [...product.priceChoices]
          .sort((left, right) => left.sortOrder - right.sortOrder)
          .map((choice, key) => ({
            ...choice,
            key,
            price: String(choice.price),
            sortOrder: String(choice.sortOrder),
          }))
      : [],
    removed: [],
  };
}

export function copyProductDraft(
  draft: DeepReadonly<ProductDraft>,
): ProductDraft {
  return {
    ...draft,
    choices: draft.choices.map((choice) => ({ ...choice })),
    removed: draft.removed.map((choice) => ({ ...choice })),
  };
}

export function copyProduct(product: CatalogProductDto): CatalogProductDto {
  return {
    ...product,
    priceChoices: product.priceChoices.map((choice) => ({ ...choice })),
  };
}

export function sameProduct(left: CatalogProductDto, right: CatalogProductDto) {
  return (
    left.id === right.id &&
    sameCategoryFields(left, right) &&
    left.categoryId === right.categoryId &&
    left.price === right.price &&
    left.portionLabel === right.portionLabel &&
    left.isAvailable === right.isAvailable &&
    left.priceChoices.length === right.priceChoices.length &&
    left.priceChoices.every((choice) => {
      const other = right.priceChoices.find((item) => item.id === choice.id);

      return (
        other !== undefined &&
        choice.portionLabel === other.portionLabel &&
        choice.price === other.price &&
        choice.sortOrder === other.sortOrder &&
        choice.isAvailable === other.isAvailable
      );
    })
  );
}

export function validChoiceOrders(choices: readonly ProductChoiceDraft[]) {
  const orders = choices.map((choice) => productInteger(choice.sortOrder));

  return (
    orders.every((order) => order !== null) &&
    new Set(orders).size === orders.length
  );
}

export function productFields(
  draft: ProductDraft,
  categoryIds: readonly string[],
  baseline?: CatalogProductDto,
) {
  const errors: ProductErrors = { fields: {}, choices: {}, form: "" };
  const sortOrder = productInteger(draft.sortOrder);
  const price = draft.mode === "single" ? productInteger(draft.price) : null;

  if (draft.name.trim() === "") errors.fields.name = productFieldErrors.name;
  if (!categoryIds.includes(draft.categoryId))
    errors.fields.categoryId = productFieldErrors.categoryId;
  if (sortOrder === null)
    errors.fields.sortOrder = productFieldErrors.sortOrder;
  if (draft.mode === "single" && price === null)
    errors.fields.price = productFieldErrors.price;

  const choices: ProductFields["priceChoices"] = [];
  const labels = new Set<string>();
  const orders = new Set<number>();
  const ids = new Set<string>();
  const keys = new Set<number>();
  const original = baseline ? productDraft(baseline).choices : [];

  if (draft.mode === "choices") {
    if (draft.choices.length < 2)
      errors.form = "Добавьте хотя бы две ценовые опции";
    for (const choice of draft.choices) {
      const invalid: ProductErrors["choices"][number] = {};
      const label = normalizePortion(choice.portionLabel);
      const folded = label.toLocaleLowerCase("ru-RU");
      const amount = productInteger(choice.price);
      const order = productInteger(choice.sortOrder);

      if (label === "" || labels.has(folded))
        invalid.portionLabel = productChoiceFieldErrors.portionLabel;
      if (amount === null) invalid.price = productChoiceFieldErrors.price;
      if (order === null || orders.has(order))
        invalid.sortOrder = productChoiceFieldErrors.sortOrder;
      if (
        keys.has(choice.key) ||
        !Number.isSafeInteger(choice.key) ||
        choice.key < 0 ||
        (original[choice.key] !== undefined
          ? original[choice.key]!.id !== choice.id
          : choice.id !== null) ||
        (choice.id !== null &&
          (ids.has(choice.id) ||
            !baseline?.priceChoices.some((item) => item.id === choice.id)))
      )
        invalid.row = "Опция не соответствует исходному товару";

      keys.add(choice.key);
      labels.add(folded);
      if (order !== null) orders.add(order);
      if (choice.id !== null) ids.add(choice.id);
      if (Object.keys(invalid).length > 0) errors.choices[choice.key] = invalid;
      if (amount !== null && order !== null)
        choices.push({
          ...(choice.id === null ? {} : { id: choice.id }),
          portionLabel: choice.portionLabel,
          price: amount,
          sortOrder: order,
          isAvailable: choice.isAvailable,
        });
    }
  }

  const fields: ProductFields | null =
    Object.keys(errors.fields).length === 0 &&
    Object.keys(errors.choices).length === 0 &&
    errors.form === "" &&
    sortOrder !== null
      ? {
          name: draft.name,
          description: draft.description,
          categoryId: draft.categoryId,
          sortOrder,
          isActive: draft.isActive,
          isAvailable: draft.isAvailable,
          price,
          portionLabel:
            draft.mode === "single"
              ? normalizePortion(draft.portionLabel) || null
              : null,
          priceChoices: choices,
        }
      : null;

  return { fields, errors };
}

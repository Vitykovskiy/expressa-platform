import { maximumProductSortOrder } from "./product-admin.policy.constants";
import type {
  ProductAdminErrorCode,
  V3ProductDetails,
} from "./product-admin.policy.types";
import type {
  CatalogValidationField,
  CatalogValidationFields,
} from "./catalog-validation.types";

export class ProductAdminError extends Error {
  readonly fields: readonly CatalogValidationField[];

  constructor(code: Exclude<ProductAdminErrorCode, "PRODUCT_INVALID">);
  constructor(code: "PRODUCT_INVALID", fields: CatalogValidationFields);
  constructor(
    readonly code: ProductAdminErrorCode,
    fields?: CatalogValidationFields,
  ) {
    super(code);
    this.fields = fields ?? [];
  }
}

export function assertV3ProductDetails(value: V3ProductDetails): void {
  if (value.name.trim() === "") invalidV3("name", "Must be a non-empty string");
  if (!isSortOrder(value.sortOrder))
    invalidV3("sortOrder", "Must be a non-negative int32");
  if (value.priceChoices.length === 0) {
    if (!isPrice(value.price)) invalidV3("price", "A single price is required");
    if (
      value.portionLabel !== null &&
      normalizeLabel(value.portionLabel) === ""
    )
      invalidV3("portionLabel", "Must not be blank");
    return;
  }
  if (
    value.price !== null ||
    value.portionLabel !== null ||
    value.priceChoices.length < 2
  )
    invalidV3(
      "priceChoices",
      "Must contain at least two choices and no direct price",
    );
  const labels = new Set<string>();
  const orders = new Set<number>();
  value.priceChoices.forEach((choice, index) => {
    const label = normalizeLabel(choice.portionLabel);
    if (label === "" || labels.has(label.toLocaleLowerCase("ru-RU")))
      invalidV3(
        `priceChoices.${index}.portionLabel`,
        "Must be distinct and non-empty",
      );
    if (!isPrice(choice.price))
      invalidV3(`priceChoices.${index}.price`, "Must be a non-negative int32");
    if (!isSortOrder(choice.sortOrder) || orders.has(choice.sortOrder))
      invalidV3(
        `priceChoices.${index}.sortOrder`,
        "Must be unique and non-negative",
      );
    labels.add(label.toLocaleLowerCase("ru-RU"));
    orders.add(choice.sortOrder);
  });
}

export function normalizeLabel(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function invalidV3(path: string, reason: string): never {
  throw new ProductAdminError("PRODUCT_INVALID", [{ path, reason }]);
}

function isPrice(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= maximumProductSortOrder
  );
}
function isSortOrder(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= maximumProductSortOrder
  );
}

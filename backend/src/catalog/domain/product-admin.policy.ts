import { productSizes } from "./catalog.constants";
import { maximumProductSortOrder } from "./product-admin.policy.constants";
import type {
  AdminProduct,
  ProductAdminErrorCode,
  ProductDetails,
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

export function assertProductDetails(value: ProductDetails): void {
  if (value.name.trim() === "")
    throw new ProductAdminError("PRODUCT_INVALID", [
      { path: "name", reason: "Must be a non-empty string" },
    ]);
  if (!isSortOrder(value.sortOrder))
    throw new ProductAdminError("PRODUCT_INVALID", [
      { path: "sortOrder", reason: "Must be a non-negative int32" },
    ]);
  if (value.type === "OTHER") {
    if (!isPrice(value.price))
      throw new ProductAdminError("PRODUCT_INVALID", [
        { path: "price", reason: "Must be a price for OTHER" },
      ]);
    if (value.variants.length !== 0)
      throw new ProductAdminError("PRODUCT_INVALID", [
        { path: "variants", reason: "Must be empty for OTHER" },
      ]);
    return;
  }
  if (
    value.price !== null ||
    value.variants.length === 0 ||
    (value.isActive && !value.variants.some((variant) => variant.isAvailable))
  ) {
    throw new ProductAdminError("PRODUCT_INVALID", [
      {
        path: value.price !== null ? "price" : "variants",
        reason: "Must match product type",
      },
    ]);
  }
  const sizes = new Set<string>();
  const sortOrders = new Set<number>();
  for (const [index, variant] of value.variants.entries()) {
    if (!productSizes.includes(variant.size) || sizes.has(variant.size))
      throw new ProductAdminError("PRODUCT_INVALID", [
        {
          path: `variants.${index}.size`,
          reason: "Must be unique and supported",
        },
      ]);
    if (sortOrders.has(variant.sortOrder) || !isSortOrder(variant.sortOrder))
      throw new ProductAdminError("PRODUCT_INVALID", [
        {
          path: `variants.${index}.sortOrder`,
          reason: "Must be unique and non-negative",
        },
      ]);
    if (!isPrice(variant.price))
      throw new ProductAdminError("PRODUCT_INVALID", [
        {
          path: `variants.${index}.price`,
          reason: "Must be a non-negative int32",
        },
      ]);
    sizes.add(variant.size);
    sortOrders.add(variant.sortOrder);
  }
}

export function assertCurrentProduct(
  product: AdminProduct | null,
): AdminProduct {
  if (product === null) throw new ProductAdminError("PRODUCT_NOT_FOUND");
  if (product.archivedAt !== null)
    throw new ProductAdminError("PRODUCT_ARCHIVED");
  return product;
}

export function assertAvailableActivePosition(
  products: readonly AdminProduct[],
  productId: string | null,
  details: ProductDetails,
): void {
  if (
    details.isActive &&
    products.some(
      (product) =>
        product.id !== productId &&
        product.categoryId === details.categoryId &&
        product.isActive &&
        product.archivedAt === null &&
        product.sortOrder === details.sortOrder,
    )
  ) {
    throw new ProductAdminError("PRODUCT_POSITION_CONFLICT");
  }
}

export function assertFullProductReorder(
  products: readonly AdminProduct[],
  categoryId: string,
  productIds: readonly string[],
): void {
  const currentIds = products
    .filter(
      (product) =>
        product.categoryId === categoryId && product.archivedAt === null,
    )
    .map((product) => product.id);
  if (
    productIds.length !== currentIds.length ||
    new Set(productIds).size !== productIds.length ||
    productIds.some((id) => !currentIds.includes(id))
  ) {
    throw new ProductAdminError("PRODUCT_REORDER_INVALID");
  }
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

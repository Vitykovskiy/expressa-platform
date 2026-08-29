import { productSizes } from "./catalog.constants";
import type { Product } from "./catalog.types";
import type { ProductVariantDraft } from "./AddProductDialog.types";

export function createEditProductVariantDrafts(
  product: Product | null,
): ProductVariantDraft[] {
  const configured = [...(product?.variants ?? [])]
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((variant) => ({
      id: variant?.id,
      size: variant.size,
      price: variant?.price.toString() ?? "",
      isConfigured: true,
      isAvailable: variant?.isAvailable ?? false,
    }));
  const missing = productSizes
    .filter((size) => !configured.some((variant) => variant.size === size))
    .map((size) => ({
      size,
      price: "",
      isConfigured: false,
      isAvailable: false,
    }));

  return [...configured, ...missing];
}

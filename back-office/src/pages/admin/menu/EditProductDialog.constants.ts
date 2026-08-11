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
      priceMinor: variant?.priceMinor.toString() ?? "",
      isConfigured: true,
      isAvailable: variant?.isAvailable ?? false,
    }));
  const missing = productSizes
    .filter((size) => !configured.some((variant) => variant.size === size))
    .map((size) => ({
      size,
      priceMinor: "",
      isConfigured: false,
      isAvailable: false,
    }));

  return [...configured, ...missing];
}

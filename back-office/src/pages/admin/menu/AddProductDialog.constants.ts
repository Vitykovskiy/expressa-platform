import { productSizes } from "./catalog.constants";
import type {
  ProductTypeOption,
  ProductVariantDraft,
} from "./AddProductDialog.types";

export const PRODUCT_TYPE_OPTIONS: readonly ProductTypeOption[] = [
  { value: "DRINK", label: "Напиток" },
  { value: "OTHER", label: "Товар без размеров" },
];

export function createInitialProductVariantDrafts(): ProductVariantDraft[] {
  return productSizes.map((size) => ({
    size,
    price: "",
    isConfigured: true,
    isAvailable: true,
  }));
}

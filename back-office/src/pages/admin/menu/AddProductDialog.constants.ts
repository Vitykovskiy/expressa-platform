import type {
  PriceChoiceDraft,
  ProductVariantDraft,
} from "./AddProductDialog.types";

export const portionLabelSuggestions = [
  "200 мл",
  "250 мл",
  "300 мл",
  "350 мл",
  "400 мл",
  "450 мл",
] as const;

export const customPortionLabelOption = "Свой вариант…";

export function createPriceChoiceDraft(): PriceChoiceDraft {
  return {
    portionLabel: "",
    price: "",
    isAvailable: true,
  };
}

export const PRODUCT_TYPE_OPTIONS = [
  { value: "DRINK", label: "Напиток" },
  { value: "OTHER", label: "Товар без размеров" },
] as const;

export function createInitialProductVariantDrafts(): ProductVariantDraft[] {
  return ["S", "M", "L"].map((size) => ({
    size: size as ProductVariantDraft["size"],
    price: "",
    isConfigured: true,
    isAvailable: true,
  }));
}

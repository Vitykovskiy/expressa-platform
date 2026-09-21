import type { PriceChoiceDraft } from "./AddProductDialog.types";

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

import type { ProductSizeDraft } from "./AddProductDialog.types";

export function createInitialProductSizeDrafts(): ProductSizeDraft[] {
  return [
    { id: "small", size: "S", price: "" },
    { id: "medium", size: "M", price: "" },
    { id: "large", size: "L", price: "" },
  ];
}

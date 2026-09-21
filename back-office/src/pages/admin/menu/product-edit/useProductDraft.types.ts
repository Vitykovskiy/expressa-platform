export interface ProductPriceChoiceDraft {
  clientId: string;
  id?: string;
  isAvailable: boolean;
  portionLabel: string;
  price: string;
}
export type ProductPriceMode = "single" | "multiple";

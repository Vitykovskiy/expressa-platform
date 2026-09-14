import type {
  CatalogStoreError,
  Category,
  CatalogFormSaveOutcome,
} from "./catalog.types";

export type ProductFormField =
  | "categoryId"
  | "type"
  | "name"
  | "description"
  | "price"
  | "portionLabel"
  | "priceChoices"
  | "isActive"
  | "isAvailable"
  | "variants";

export interface PriceChoiceDraft {
  id?: string;
  portionLabel: string;
  price: string;
  isAvailable: boolean;
}

export type PriceChoiceMoveDirection = -1 | 1;

// Compatibility aliases remain internal until the V3 catalog reader replaces the
// legacy projection. They are not exposed as editor controls.
export type ProductVariantMoveDirection = PriceChoiceMoveDirection;

export interface ProductVariantDraft {
  id?: string;
  size: "S" | "M" | "L";
  price: string;
  isConfigured: boolean;
  isAvailable: boolean;
}

export interface PriceChoiceFormData {
  id?: string;
  portionLabel: string;
  price: number;
  sortOrder: number;
  isAvailable: boolean;
}

export interface PriceOptionProductFormData {
  categoryId: string;
  type: "OTHER";
  name: string;
  description: string;
  isActive: boolean;
  isAvailable: boolean;
  price: number | null;
  portionLabel: string | null;
  priceChoices: readonly PriceChoiceFormData[];
  variants: readonly [];
}

export interface LegacyProductVariantFormData {
  id?: string;
  size: "S" | "M" | "L";
  price: number;
  sortOrder: number;
  isAvailable: boolean;
}

export interface LegacyProductFormData {
  categoryId: string;
  type: "DRINK" | "OTHER";
  name: string;
  description: string;
  isActive: boolean;
  isAvailable: boolean;
  price: number | null;
  variants: readonly LegacyProductVariantFormData[];
}

export type ProductFormData =
  PriceOptionProductFormData | LegacyProductFormData;

export interface AddProductDialogProps {
  disabled: boolean;
  categories: readonly Category[];
  fieldErrors?: Partial<Record<ProductFormField, string>>;
  saveError?: CatalogStoreError | null;
  saveOutcome?: CatalogFormSaveOutcome;
}

export interface AddProductDialogEmits {
  confirm: [data: ProductFormData];
  cancel: [];
  refresh: [];
}

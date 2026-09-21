import type {
  CatalogStoreError,
  Category,
  CatalogFormSaveOutcome,
} from "./catalog.types";

export type ProductFormField =
  | "categoryId"
  | "name"
  | "description"
  | "price"
  | "portionLabel"
  | "priceChoices"
  | "isActive"
  | "isAvailable";

export interface PriceChoiceDraft {
  id?: string;
  portionLabel: string;
  price: string;
  isAvailable: boolean;
}

export type PriceChoiceMoveDirection = -1 | 1;

export interface PriceChoiceFormData {
  id?: string;
  portionLabel: string;
  price: number;
  sortOrder: number;
  isAvailable: boolean;
}

export interface CreateProductFormData {
  categoryId: string;
  name: string;
  description: string;
  isActive: boolean;
  isAvailable: boolean;
  price: number | null;
  portionLabel: string | null;
  priceChoices: readonly PriceChoiceFormData[];
}

export interface AddProductDialogProps {
  disabled: boolean;
  categories: readonly Category[];
  fieldErrors?: Partial<Record<ProductFormField, string>>;
  saveError?: CatalogStoreError | null;
  saveOutcome?: CatalogFormSaveOutcome;
}

export interface AddProductDialogEmits {
  confirm: [data: CreateProductFormData];
  cancel: [];
  refresh: [];
}

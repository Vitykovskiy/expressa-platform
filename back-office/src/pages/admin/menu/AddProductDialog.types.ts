import type { Category, ProductSize, ProductType } from "./catalog.types";

export type ProductFormField =
  | "categoryId"
  | "type"
  | "name"
  | "description"
  | "priceMinor"
  | "isActive"
  | "isAvailable"
  | "variants";

export interface ProductVariantDraft {
  id?: string;
  size: ProductSize;
  priceMinor: string;
  isConfigured: boolean;
  isAvailable: boolean;
}

export type ProductVariantMoveDirection = -1 | 1;

export interface ProductVariantFormData {
  id?: string;
  size: ProductSize;
  priceMinor: number;
  sortOrder: number;
  isAvailable: boolean;
}

export interface DrinkProductFormData {
  categoryId: string;
  type: "DRINK";
  name: string;
  description: string;
  isActive: boolean;
  isAvailable: boolean;
  priceMinor: null;
  variants: readonly ProductVariantFormData[];
}

export interface OtherProductFormData {
  categoryId: string;
  type: "OTHER";
  name: string;
  description: string;
  isActive: boolean;
  isAvailable: boolean;
  priceMinor: number;
  variants: readonly [];
}

export type ProductFormData = DrinkProductFormData | OtherProductFormData;

export interface AddProductDialogProps {
  disabled: boolean;
  categories: readonly Category[];
  fieldErrors?: Partial<Record<ProductFormField, string>>;
}

export interface AddProductDialogEmits {
  confirm: [data: ProductFormData];
  cancel: [];
}

export interface ProductTypeOption {
  value: ProductType;
  label: string;
}

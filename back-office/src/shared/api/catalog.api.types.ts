import type {
  catalogModifierSelectionTypes,
  catalogProductSizes,
  catalogProductTypes,
} from "./catalog.api.constants";

export type CatalogProductType = (typeof catalogProductTypes)[number];

export type CatalogProductSize = (typeof catalogProductSizes)[number];

export type CatalogModifierSelectionType =
  (typeof catalogModifierSelectionTypes)[number];

export interface CatalogCategory {
  id: string;
  name: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
}

export interface CatalogProductVariant {
  id: string;
  productId: string;
  size: CatalogProductSize;
  priceMinor: number;
  sortOrder: number;
  isAvailable: boolean;
}

export interface CatalogProduct {
  id: string;
  categoryId: string;
  type: CatalogProductType;
  name: string;
  description: string;
  priceMinor: number | null;
  sortOrder: number;
  isActive: boolean;
  isAvailable: boolean;
  variants: readonly CatalogProductVariant[];
}

export interface CatalogModifierOption {
  id: string;
  groupId: string;
  name: string;
  priceDeltaMinor: number;
  sortOrder: number;
  isDefault: boolean;
  isAvailable: boolean;
}

export interface CatalogModifierGroup {
  id: string;
  name: string;
  selectionType: CatalogModifierSelectionType;
  minSelect: number;
  maxSelect: number;
  isActive: boolean;
  options: readonly CatalogModifierOption[];
}

export interface CatalogCategoryModifierGroupAssignment {
  categoryId: string;
  modifierGroupId: string;
  sortOrder: number;
}

export interface Catalog {
  categories: readonly CatalogCategory[];
  products: readonly CatalogProduct[];
  modifierGroups: readonly CatalogModifierGroup[];
  categoryModifierGroupAssignments: readonly CatalogCategoryModifierGroupAssignment[];
}

export interface CreateCatalogCategory {
  name: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
}

export type UpdateCatalogCategory = CreateCatalogCategory;

export interface CreateCatalogProductVariant {
  size: CatalogProductSize;
  priceMinor: number;
  sortOrder: number;
  isAvailable: boolean;
}

export interface CreateCatalogProduct {
  categoryId: string;
  type: CatalogProductType;
  name: string;
  description: string;
  priceMinor: number | null;
  sortOrder: number;
  isActive: boolean;
  isAvailable: boolean;
  variants: readonly CreateCatalogProductVariant[];
}

export type UpdateCatalogProduct = CreateCatalogProduct;

export interface CreateCatalogModifierGroup {
  name: string;
  selectionType: CatalogModifierSelectionType;
  minSelect: number;
  maxSelect: number;
  isActive: boolean;
}

export interface CatalogModifierGroupOptionInput extends CreateCatalogModifierOption {
  id?: string;
}

export interface SaveCatalogModifierGroup extends CreateCatalogModifierGroup {
  id?: string;
  options: readonly CatalogModifierGroupOptionInput[];
}

export interface CreateCatalogModifierOption {
  name: string;
  priceDeltaMinor: number;
  sortOrder: number;
  isDefault: boolean;
  isAvailable: boolean;
}

export type UpdateCatalogModifierOption = CreateCatalogModifierOption;

export interface CatalogValidationField {
  path: string;
  reason: string;
}

export interface CatalogApiErrorData {
  code: string;
  fields: readonly CatalogValidationField[];
  message: string;
  requestId: string | null;
  status: number | null;
}

export interface CatalogCategoryDto {
  id: string;
  name: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
}

export interface CatalogProductVariantDto {
  id: string;
  size: CatalogProductSize;
  priceMinor: number;
  sortOrder: number;
  isAvailable: boolean;
}

export interface CatalogProductDto {
  id: string;
  categoryId: string;
  type: CatalogProductType;
  name: string;
  description: string;
  priceMinor: number | null;
  sortOrder: number;
  isActive: boolean;
  isAvailable: boolean;
  variants: readonly CatalogProductVariantDto[];
}

export interface CatalogModifierOptionDto {
  id: string;
  groupId: string;
  name: string;
  priceDeltaMinor: number;
  sortOrder: number;
  isDefault: boolean;
  isAvailable: boolean;
}

export interface CatalogModifierGroupDto {
  id: string;
  name: string;
  selectionType: CatalogModifierSelectionType;
  minSelect: number;
  maxSelect: number;
  isActive: boolean;
}

export interface CatalogModifierGroupAggregateDto extends CatalogModifierGroupDto {
  options: readonly CatalogModifierOptionDto[];
}

export interface CatalogCategoryModifierGroupAssignmentDto {
  categoryId: string;
  groupId: string;
  sortOrder: number;
}

export interface CatalogResponseDto {
  categories: readonly CatalogCategoryDto[];
  products: readonly CatalogProductResponseDto[];
  productVariants: readonly CatalogProductVariantResponseDto[];
  modifierGroups: readonly CatalogModifierGroupDto[];
  modifierOptions: readonly CatalogModifierOptionDto[];
  categoryModifierGroups: readonly CatalogCategoryModifierGroupAssignmentDto[];
}

export interface CatalogProductResponseDto {
  id: string;
  categoryId: string;
  type: CatalogProductType;
  name: string;
  description: string;
  priceMinor: number | null;
  sortOrder: number;
  isActive: boolean;
  isAvailable: boolean;
}

export interface CatalogProductVariantResponseDto {
  id: string;
  productId: string;
  size: CatalogProductSize;
  priceMinor: number;
  sortOrder: number;
  isAvailable: boolean;
}

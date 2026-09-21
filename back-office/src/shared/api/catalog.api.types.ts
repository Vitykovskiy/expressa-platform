import type { catalogModifierSelectionTypes } from "./catalog.api.constants";

export type CatalogModifierSelectionType =
  (typeof catalogModifierSelectionTypes)[number];

export interface CatalogCategory {
  id: string;
  name: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
}

export interface CatalogProduct {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number | null;
  portionLabel?: string | null;
  priceChoices?: readonly CatalogPriceChoice[];
  sortOrder: number;
  isActive: boolean;
  isAvailable: boolean;
}

export interface CatalogPriceChoice {
  id: string;
  portionLabel: string;
  price: number;
  sortOrder: number;
  isAvailable: boolean;
}

export interface CatalogModifierOption {
  id: string;
  groupId: string;
  name: string;
  priceDelta: number;
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

export interface CreateCatalogProduct {
  categoryId: string;
  name: string;
  description: string;
  price: number | null;
  portionLabel?: string | null;
  priceChoices?: readonly Omit<CatalogPriceChoice, "id">[];
  sortOrder: number;
  isActive: boolean;
  isAvailable: boolean;
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
  priceDelta: number;
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

export interface CatalogModifierOptionDto {
  id: string;
  groupId: string;
  name: string;
  priceDelta: number;
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

export interface AdminV3CatalogResponseDto {
  categories: readonly CatalogCategoryDto[];
  products: readonly AdminV3ProductDto[];
  modifierGroups: readonly CatalogModifierGroupDto[];
  modifierOptions: readonly CatalogModifierOptionDto[];
  categoryModifierGroups: readonly CatalogCategoryModifierGroupAssignmentDto[];
}

export interface AdminV3PriceChoiceDto {
  id: string;
  portionLabel: string;
  price: number;
  sortOrder: number;
  isAvailable: boolean;
}

export interface AdminV3ProductDto {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number | null;
  portionLabel: string | null;
  priceChoices: readonly AdminV3PriceChoiceDto[];
  sortOrder: number;
  isActive: boolean;
  isAvailable: boolean;
}

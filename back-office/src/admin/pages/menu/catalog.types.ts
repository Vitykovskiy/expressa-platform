import type {
  modifierSelectionTypes,
  productSizes,
  productTypes,
} from "./catalog.constants";
import type { CatalogApi } from "../../../shared/api/catalog.api";
import type {
  Catalog,
  CreateCatalogCategory,
  CreateCatalogModifierOption,
  CreateCatalogProduct,
  SaveCatalogModifierGroup,
  UpdateCatalogCategory,
  UpdateCatalogModifierOption,
  UpdateCatalogProduct,
} from "../../../shared/api/catalog.api.types";

export type ProductType = (typeof productTypes)[number];

export type ProductSize = (typeof productSizes)[number];

export type ModifierSelectionType = (typeof modifierSelectionTypes)[number];

export interface Category {
  id: string;
  name: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
}

export interface Product {
  id: string;
  categoryId: string;
  type: ProductType;
  name: string;
  description: string;
  priceMinor: number | null;
  sortOrder: number;
  isActive: boolean;
  isAvailable: boolean;
  variants: readonly ProductVariant[];
}

export interface ProductVariant {
  id: string;
  productId: string;
  size: ProductSize;
  priceMinor: number;
  sortOrder: number;
  isAvailable: boolean;
}

export interface ModifierGroup {
  id: string;
  name: string;
  selectionType: ModifierSelectionType;
  minSelect: number;
  maxSelect: number;
  isActive: boolean;
  options: readonly ModifierOption[];
}

export interface ModifierOption {
  id: string;
  groupId: string;
  name: string;
  priceDeltaMinor: number;
  sortOrder: number;
  isDefault: boolean;
  isAvailable: boolean;
}

export interface CategoryModifierGroupAssignment {
  categoryId: string;
  modifierGroupId: string;
  sortOrder: number;
}

export type CatalogStoreStatus = "idle" | "loading" | "ready" | "error";

export type CatalogFieldErrors = Readonly<Record<string, string>>;

export interface CatalogStoreError {
  message: string;
  requestId: string | null;
}

export interface CatalogStoreState {
  activeOperation: Promise<void> | null;
  categories: readonly Category[];
  categoryModifierGroupAssignments: readonly CategoryModifierGroupAssignment[];
  error: CatalogStoreError | null;
  fieldErrors: CatalogFieldErrors;
  lastCommandSucceeded: boolean;
  modifierGroups: readonly ModifierGroup[];
  products: readonly Product[];
  status: CatalogStoreStatus;
}

export interface CatalogStoreDependencies {
  catalogApi: Pick<
    CatalogApi,
    | "archiveCategory"
    | "archiveModifierGroup"
    | "archiveModifierOption"
    | "archiveProduct"
    | "createCategory"
    | "createModifierOption"
    | "createProduct"
    | "getCatalog"
    | "reorderCategories"
    | "reorderProducts"
    | "replaceCategoryModifierGroups"
    | "saveModifierGroup"
    | "updateCategory"
    | "updateModifierOption"
    | "updateProduct"
  >;
}

export interface CatalogStoreActions {
  archiveCategory(accessToken: string, categoryId: string): Promise<void>;
  archiveModifierGroup(accessToken: string, groupId: string): Promise<void>;
  archiveModifierOption(accessToken: string, optionId: string): Promise<void>;
  archiveProduct(accessToken: string, productId: string): Promise<void>;
  createCategory(
    accessToken: string,
    category: CreateCatalogCategory,
  ): Promise<void>;
  createModifierOption(
    accessToken: string,
    groupId: string,
    option: CreateCatalogModifierOption,
  ): Promise<void>;
  createProduct(
    accessToken: string,
    product: CreateCatalogProduct,
  ): Promise<void>;
  load(accessToken: string): Promise<void>;
  reorderCategories(
    accessToken: string,
    categoryIds: readonly string[],
  ): Promise<void>;
  reorderProducts(
    accessToken: string,
    categoryId: string,
    productIds: readonly string[],
  ): Promise<void>;
  replaceCategoryModifierGroups(
    accessToken: string,
    categoryId: string,
    assignments: readonly CategoryModifierGroupAssignment[],
  ): Promise<void>;
  saveModifierGroup(
    accessToken: string,
    group: SaveCatalogModifierGroup,
  ): Promise<void>;
  updateCategory(
    accessToken: string,
    categoryId: string,
    category: UpdateCatalogCategory,
  ): Promise<void>;
  updateModifierOption(
    accessToken: string,
    optionId: string,
    option: UpdateCatalogModifierOption,
  ): Promise<void>;
  updateProduct(
    accessToken: string,
    productId: string,
    product: UpdateCatalogProduct,
  ): Promise<void>;
}

export type CatalogApiResult = Catalog;

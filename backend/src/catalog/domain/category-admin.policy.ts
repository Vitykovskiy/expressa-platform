import { maximumCategorySortOrder } from "./category-admin.policy.constants";
import type {
  AdminCategory,
  CategoryAdminErrorCode,
  CategoryDetails,
} from "./category-admin.policy.types";
import type {
  CatalogValidationField,
  CatalogValidationFields,
} from "./catalog-validation.types";

export class CategoryAdminError extends Error {
  readonly fields: readonly CatalogValidationField[];

  constructor(code: Exclude<CategoryAdminErrorCode, "CATEGORY_INVALID">);
  constructor(code: "CATEGORY_INVALID", fields: CatalogValidationFields);
  constructor(
    readonly code: CategoryAdminErrorCode,
    fields?: CatalogValidationFields,
  ) {
    super(code);
    this.fields = fields ?? [];
  }
}

export function assertCategoryDetails(value: CategoryDetails): void {
  if (
    value.name.trim() === "" ||
    !Number.isInteger(value.sortOrder) ||
    value.sortOrder < 0 ||
    value.sortOrder > maximumCategorySortOrder
  ) {
    throw new CategoryAdminError("CATEGORY_INVALID", [
      {
        path: value.name.trim() === "" ? "name" : "sortOrder",
        reason: "Invalid category value",
      },
    ]);
  }
}

export function assertCurrentCategory(
  category: AdminCategory | null,
): AdminCategory {
  if (category === null) throw new CategoryAdminError("CATEGORY_NOT_FOUND");
  if (category.archivedAt !== null)
    throw new CategoryAdminError("CATEGORY_ARCHIVED");
  return category;
}

export function assertAvailableActivePosition(
  categories: readonly AdminCategory[],
  categoryId: string | null,
  details: CategoryDetails,
): void {
  if (!details.isActive) return;

  if (
    categories.some(
      (category) =>
        category.id !== categoryId &&
        category.archivedAt === null &&
        category.isActive &&
        category.sortOrder === details.sortOrder,
    )
  ) {
    throw new CategoryAdminError("CATEGORY_POSITION_CONFLICT");
  }
}

export function assertFullCategoryReorder(
  categories: readonly AdminCategory[],
  categoryIds: readonly string[],
): void {
  const currentIds = categories
    .filter((category) => category.archivedAt === null)
    .map((category) => category.id);
  if (
    categoryIds.length !== currentIds.length ||
    new Set(categoryIds).size !== categoryIds.length
  ) {
    throw new CategoryAdminError("CATEGORY_REORDER_INVALID");
  }

  const currentIdSet = new Set(currentIds);
  if (categoryIds.some((id) => !currentIdSet.has(id))) {
    throw new CategoryAdminError("CATEGORY_REORDER_INVALID");
  }

  const activeCount = categories.filter((category) => category.isActive).length;
  if (activeCount + categoryIds.length - 1 > maximumCategorySortOrder) {
    throw new CategoryAdminError("CATEGORY_INVALID", [
      { path: "categoryIds", reason: "Too many categories" },
    ]);
  }
}

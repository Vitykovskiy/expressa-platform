import type {
  Catalog,
  CatalogDto,
  CategoryDraft,
  CategoryDto,
  CategoryFields,
} from "./catalog.types";

export function mapCatalog(dto: CatalogDto): Catalog {
  return {
    ...dto,
    categories: [...dto.categories].sort(
      (left, right) =>
        left.sortOrder - right.sortOrder || left.id.localeCompare(right.id),
    ),
  };
}

export function categoryDraft(category: CategoryDto): CategoryDraft {
  return {
    name: category.name,
    description: category.description,
    sortOrder: String(category.sortOrder),
    isActive: category.isActive,
  };
}

export function sameCategoryFields(
  left: CategoryFields,
  right: CategoryFields,
) {
  return (
    left.name === right.name &&
    left.description === right.description &&
    left.sortOrder === right.sortOrder &&
    left.isActive === right.isActive
  );
}

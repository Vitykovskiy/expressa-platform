import type {
  AdminCategory,
  CategoryDetails,
} from "../domain/category-admin.policy.types";

export type CategoryAuditAction =
  | "CATEGORY_CREATED"
  | "CATEGORY_UPDATED"
  | "CATEGORY_REORDERED"
  | "CATEGORY_ARCHIVED";

export type CategoryAuditEvent = {
  actorId: string;
  requestId: string;
  action: CategoryAuditAction;
  categoryId: string;
  before: AdminCategory | null;
  after: AdminCategory | null;
};

export interface CategoriesRepository {
  findById(id: string): Promise<AdminCategory | null>;
  findCurrent(): Promise<AdminCategory[]>;
  create(details: CategoryDetails): Promise<AdminCategory>;
  update(id: string, details: CategoryDetails): Promise<AdminCategory>;
  reorder(
    categories: readonly AdminCategory[],
    categoryIds: readonly string[],
  ): Promise<AdminCategory[]>;
  archive(id: string): Promise<AdminCategory>;
  writeAudit(event: CategoryAuditEvent): Promise<void>;
}

export interface CategoriesUnitOfWork {
  run<Result>(
    command: (repository: CategoriesRepository) => Promise<Result>,
    audit: (repository: CategoriesRepository, result: Result) => Promise<void>,
  ): Promise<Result>;
}

export type CreateCategoryCommand = CategoryDetails & {
  actorId: string;
  requestId: string;
};

export type UpdateCategoryCommand = CategoryDetails & {
  actorId: string;
  requestId: string;
  categoryId: string;
};

export type ReorderCategoriesCommand = {
  actorId: string;
  requestId: string;
  categoryIds: string[];
};

export type ArchiveCategoryCommand = {
  actorId: string;
  requestId: string;
  categoryId: string;
};

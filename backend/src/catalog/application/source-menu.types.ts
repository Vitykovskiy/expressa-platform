import type { CategoriesRepository } from "./categories.repository.types";
import type { CategoryModifiersRepository } from "./category-modifiers.repository.types";
import type { AdminCategory } from "../domain/category-admin.policy.types";

export type SourceActor = { actorId: string; requestId: string };
export type SourceCategoryWrite = {
  name: string;
  optionGroupIds?: string[];
};
export type SourceCategoryResult = {
  category: AdminCategory;
  modifierGroupIds: string[];
};
export type SourceCategoryRepositories = {
  categories: CategoriesRepository;
  associations: CategoryModifiersRepository;
};
export interface SourceCategoriesUnitOfWork {
  run<Result>(
    command: (repositories: SourceCategoryRepositories) => Promise<Result>,
    audit: (
      repositories: SourceCategoryRepositories,
      result: Result,
    ) => Promise<void>,
  ): Promise<Result>;
}
export type SourceProductWrite = {
  categoryId: string;
  name: string;
  price: number | null;
  priceChoices: { id?: string; portionLabel: string; price: number }[];
};
export type SourceGroupWrite = { name: string; singleSelection: boolean };
export type SourceOptionWrite = { name: string; priceDelta: number };

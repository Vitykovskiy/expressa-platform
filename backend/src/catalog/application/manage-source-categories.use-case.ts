import {
  assertCategoryDetails,
  assertCurrentCategory,
} from "../domain/category-admin.policy";
import { ModifierAdminError } from "../domain/modifier-admin.policy";
import type {
  SourceActor,
  SourceCategoryWrite,
  SourceCategoryResult,
  SourceCategoriesUnitOfWork,
} from "./source-menu.types";

export class ManageSourceCategoriesUseCase {
  constructor(private readonly unitOfWork: SourceCategoriesUnitOfWork) {}

  save(
    input: SourceCategoryWrite,
    actor: SourceActor,
    categoryId: string | null,
  ): Promise<SourceCategoryResult> {
    return this.unitOfWork
      .run(
        async ({ categories, associations }) => {
          const before =
            categoryId === null
              ? null
              : assertCurrentCategory(await categories.findById(categoryId));
          const details =
            before === null
              ? {
                  name: input.name,
                  description: "",
                  sortOrder: (await categories.findCurrent()).reduce(
                    (order, category) =>
                      Math.max(order, category.sortOrder + 1),
                    0,
                  ),
                  isActive: true,
                }
              : { ...before, name: input.name };
          assertCategoryDetails(details);

          if (input.optionGroupIds !== undefined) {
            const existing = await associations.findCurrentModifierGroupIds([
              ...input.optionGroupIds,
            ]);
            if (
              new Set(input.optionGroupIds).size !==
                input.optionGroupIds.length ||
              existing.length !== input.optionGroupIds.length
            ) {
              throw new ModifierAdminError("MODIFIER_GROUP_NOT_FOUND");
            }
          }

          const category =
            before === null
              ? await categories.create(details)
              : await categories.update(before.id, details);
          const previousLinks = await associations.findByCategoryId(
            category.id,
          );
          let links = previousLinks;
          if (input.optionGroupIds !== undefined) {
            links = await associations.replace(
              category.id,
              input.optionGroupIds,
            );
          }
          return { before, category, previousLinks, links };
        },
        async (
          { categories, associations },
          { before, category, previousLinks, links },
        ) => {
          if (input.optionGroupIds !== undefined) {
            await associations.writeAudit({
              ...actor,
              categoryId: category.id,
              before: previousLinks,
              after: links,
            });
          }
          await categories.writeAudit({
            ...actor,
            categoryId: category.id,
            action: before === null ? "CATEGORY_CREATED" : "CATEGORY_UPDATED",
            before,
            after: category,
          });
        },
      )
      .then(({ category, links }) => ({
        category,
        modifierGroupIds: links.map((link) => link.groupId),
      }));
  }
}

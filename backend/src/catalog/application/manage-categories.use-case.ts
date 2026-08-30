import {
  assertAvailableActivePosition,
  assertCategoryDetails,
  assertCurrentCategory,
  assertFullCategoryReorder,
} from "../domain/category-admin.policy";
import type { AdminCategory } from "../domain/category-admin.policy.types";
import type {
  ArchiveCategoryCommand,
  CategoriesUnitOfWork,
  CreateCategoryCommand,
  ReorderCategoriesCommand,
  UpdateCategoryCommand,
} from "./categories.repository.types";

export class ManageCategoriesUseCase {
  constructor(private readonly unitOfWork: CategoriesUnitOfWork) {}

  async create(command: CreateCategoryCommand): Promise<AdminCategory> {
    assertCategoryDetails(command);
    return this.unitOfWork.run(
      async (repository) => {
        const categories = await repository.findCurrent();
        assertAvailableActivePosition(categories, null, command);
        return repository.create(command);
      },
      (repository, category) =>
        repository.writeAudit({
          actorId: command.actorId,
          requestId: command.requestId,
          action: "CATEGORY_CREATED",
          categoryId: category.id,
          before: null,
          after: category,
        }),
    );
  }

  async update(command: UpdateCategoryCommand): Promise<AdminCategory> {
    assertCategoryDetails(command);
    return this.unitOfWork
      .run(
        async (repository) => {
          const category = assertCurrentCategory(
            await repository.findById(command.categoryId),
          );
          const categories = await repository.findCurrent();
          assertAvailableActivePosition(categories, category.id, command);
          return {
            before: category,
            after: await repository.update(category.id, command),
          };
        },
        (repository, result) =>
          repository.writeAudit({
            actorId: command.actorId,
            requestId: command.requestId,
            action: "CATEGORY_UPDATED",
            categoryId: result.after.id,
            before: result.before,
            after: result.after,
          }),
      )
      .then((result) => result.after);
  }

  async reorder(command: ReorderCategoriesCommand): Promise<AdminCategory[]> {
    return this.unitOfWork
      .run(
        async (repository) => {
          const categories = await repository.findCurrent();
          assertFullCategoryReorder(categories, command.categoryIds);
          return {
            before: categories,
            after: await repository.reorder(categories, command.categoryIds),
          };
        },
        async (repository, result) => {
          for (const category of result.after) {
            const before =
              result.before.find((value) => value.id === category.id) ?? null;
            await repository.writeAudit({
              actorId: command.actorId,
              requestId: command.requestId,
              action: "CATEGORY_REORDERED",
              categoryId: category.id,
              before,
              after: category,
            });
          }
        },
      )
      .then((result) => result.after);
  }

  async archive(command: ArchiveCategoryCommand): Promise<void> {
    await this.unitOfWork.run(
      async (repository) => {
        const category = assertCurrentCategory(
          await repository.findById(command.categoryId),
        );
        return {
          before: category,
          after: await repository.archive(category.id),
        };
      },
      (repository, result) =>
        repository.writeAudit({
          actorId: command.actorId,
          requestId: command.requestId,
          action: "CATEGORY_ARCHIVED",
          categoryId: result.after.id,
          before: result.before,
          after: result.after,
        }),
    );
  }
}

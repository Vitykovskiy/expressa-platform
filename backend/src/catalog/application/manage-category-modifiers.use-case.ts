import { CategoryAdminError } from "../domain/category-admin.policy";
import type { CatalogValidationFields } from "../domain/catalog-validation.types";
import type {
  CategoryModifierGroupsAuditEvent,
  CategoryModifiersUnitOfWork,
  ReplaceCategoryModifierGroupsCommand,
} from "./category-modifiers.repository.types";

export class CategoryModifierGroupsError extends Error {
  readonly fields: CatalogValidationFields;

  constructor(
    readonly code: "CATEGORY_MODIFIER_GROUPS_INVALID",
    fields: CatalogValidationFields,
  ) {
    super(code);
    this.fields = fields;
  }
}

export class ManageCategoryModifiersUseCase {
  constructor(private readonly unitOfWork: CategoryModifiersUnitOfWork) {}

  async replace(command: ReplaceCategoryModifierGroupsCommand) {
    assertUniqueGroupIds(command.groupIds);

    return this.unitOfWork
      .run(
        async (repository) => {
          if (!(await repository.categoryExists(command.categoryId))) {
            throw new CategoryAdminError("CATEGORY_NOT_FOUND");
          }
          const currentGroupIds = await repository.findCurrentModifierGroupIds(
            command.groupIds,
          );
          if (currentGroupIds.length !== command.groupIds.length) {
            throw new CategoryModifierGroupsError(
              "CATEGORY_MODIFIER_GROUPS_INVALID",
              [
                {
                  path: "groupIds",
                  reason: "Must reference current modifier groups",
                },
              ],
            );
          }
          const before = await repository.findByCategoryId(command.categoryId);
          const after = await repository.replace(
            command.categoryId,
            command.groupIds,
          );
          return { before, after };
        },
        (repository, result) =>
          repository.writeAudit(
            createAuditEvent(command, result.before, result.after),
          ),
      )
      .then((result) => result.after);
  }
}

function assertUniqueGroupIds(groupIds: readonly string[]): void {
  if (new Set(groupIds).size !== groupIds.length) {
    throw new CategoryModifierGroupsError("CATEGORY_MODIFIER_GROUPS_INVALID", [
      { path: "groupIds", reason: "Must not contain duplicates" },
    ]);
  }
}

function createAuditEvent(
  command: ReplaceCategoryModifierGroupsCommand,
  before: CategoryModifierGroupsAuditEvent["before"],
  after: CategoryModifierGroupsAuditEvent["after"],
): CategoryModifierGroupsAuditEvent {
  return {
    actorId: command.actorId,
    requestId: command.requestId,
    categoryId: command.categoryId,
    before,
    after,
  };
}

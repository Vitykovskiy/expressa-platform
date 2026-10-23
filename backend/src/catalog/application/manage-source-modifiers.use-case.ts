import {
  assertCurrentModifierGroup,
  assertCurrentModifierOption,
  assertPublishableModifierGroup,
} from "../domain/modifier-admin.policy";
import { normalizeModifierDefaults } from "../domain/modifier-option-defaults";
import type {
  AdminModifierGroup,
  AdminModifierOption,
} from "../domain/modifier-admin.policy.types";
import type { ModifiersUnitOfWork } from "./modifiers.repository.types";
import type {
  SourceActor,
  SourceGroupWrite,
  SourceOptionWrite,
} from "./source-menu.types";
import { saveModifierOptions } from "./save-modifier-options";

export class ManageSourceModifiersUseCase {
  constructor(private readonly unitOfWork: ModifiersUnitOfWork) {}

  saveGroup(
    input: SourceGroupWrite,
    actor: SourceActor,
    groupId: string | null,
  ): Promise<AdminModifierGroup> {
    return this.unitOfWork
      .run(
        async (repository) => {
          let before: AdminModifierGroup | null = null;
          if (groupId !== null) {
            before = assertCurrentModifierGroup(
              await repository.findGroupById(groupId),
            );
          }
          const options = normalizeModifierDefaults(before?.options ?? []);
          const details = {
            name: input.name,
            selectionType: input.singleSelection
              ? ("single" as const)
              : ("multiple" as const),
            minSelect: 0,
            maxSelect: input.singleSelection ? 1 : options.length,
            isActive: before?.isActive ?? true,
          };
          assertPublishableModifierGroup(details, options);
          let after: AdminModifierGroup;
          if (before === null) {
            after = await repository.createGroup(details, options);
          } else {
            after = await repository.updateGroup(before.id, details, options);
          }
          return { before, after };
        },
        (repository, { before, after }) =>
          repository.writeAudit({
            ...actor,
            action:
              before === null
                ? "MODIFIER_GROUP_CREATED"
                : "MODIFIER_GROUP_UPDATED",
            entityType: "modifier_group",
            entityId: after.id,
            before,
            after,
          }),
      )
      .then(({ after }) => after);
  }

  saveOption(
    input: SourceOptionWrite,
    actor: SourceActor,
    target: { groupId: string } | { optionId: string },
  ): Promise<AdminModifierOption> {
    return this.unitOfWork
      .run(
        async (repository) => {
          let before: AdminModifierOption | null = null;
          if ("optionId" in target) {
            before = assertCurrentModifierOption(
              await repository.findOptionById(target.optionId),
            );
          }
          const groupId =
            "groupId" in target ? target.groupId : before?.groupId;
          if (groupId === undefined) {
            throw new Error("Option group identity was not resolved");
          }
          const group = assertCurrentModifierGroup(
            await repository.findGroupById(groupId),
          );
          const details =
            before === null
              ? {
                  ...input,
                  sortOrder: group.options.reduce(
                    (order, option) => Math.max(order, option.sortOrder + 1),
                    0,
                  ),
                  isDefault: false,
                  isAvailable: true,
                }
              : { ...before, ...input };
          const options =
            before === null
              ? [...group.options, details]
              : group.options.map((option) =>
                  option.id === before.id ? details : option,
                );
          const afterGroup = await saveModifierOptions(
            repository,
            group,
            options,
          );
          const after = afterGroup.options.find(
            (option) => option.sortOrder === details.sortOrder,
          );
          if (after === undefined) {
            throw new Error("Saved modifier option was not returned");
          }
          return { before, after, beforeGroup: group, afterGroup };
        },
        (repository, result) =>
          repository.writeAudit({
            ...actor,
            action:
              result.before === null
                ? "MODIFIER_OPTION_CREATED"
                : "MODIFIER_OPTION_UPDATED",
            entityType: "modifier_option",
            entityId: result.after.id,
            before: result.beforeGroup,
            after: result.afterGroup,
          }),
      )
      .then(({ after }) => after);
  }
}

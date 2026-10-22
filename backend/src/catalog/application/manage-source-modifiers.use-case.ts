import {
  assertCurrentModifierGroup,
  assertCurrentModifierOption,
  assertPublishableModifierGroup,
} from "../domain/modifier-admin.policy";
import type {
  AdminModifierGroup,
  AdminModifierOption,
} from "../domain/modifier-admin.policy.types";
import type { ModifiersUnitOfWork } from "./modifiers.repository.types";
import type { SourceActor, SourceOptionWrite } from "./source-menu.types";

export class ManageSourceModifiersUseCase {
  constructor(private readonly unitOfWork: ModifiersUnitOfWork) {}

  saveGroup(
    name: string,
    actor: SourceActor,
    groupId: string | null,
  ): Promise<AdminModifierGroup> {
    return this.unitOfWork
      .run(
        async (repository) => {
          const before =
            groupId === null
              ? null
              : assertCurrentModifierGroup(
                  await repository.findGroupById(groupId),
                );
          const details =
            before === null
              ? {
                  name,
                  selectionType: "single" as const,
                  minSelect: 0,
                  maxSelect: 1,
                  isActive: true,
                }
              : { ...before, name };
          const options = before?.options ?? [];
          assertPublishableModifierGroup(details, options);
          const after =
            before === null
              ? await repository.createGroup(details, options)
              : await repository.updateGroup(before.id, details, options);
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
          const before =
            "optionId" in target
              ? assertCurrentModifierOption(
                  await repository.findOptionById(target.optionId),
                )
              : null;
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
          assertPublishableModifierGroup(group, options);
          const after =
            before === null
              ? await repository.createOption(groupId, details)
              : await repository.updateOption(before.id, details);
          return { before, after };
        },
        (repository, { before, after }) =>
          repository.writeAudit({
            ...actor,
            action:
              before === null
                ? "MODIFIER_OPTION_CREATED"
                : "MODIFIER_OPTION_UPDATED",
            entityType: "modifier_option",
            entityId: after.id,
            before,
            after,
          }),
      )
      .then(({ after }) => after);
  }
}

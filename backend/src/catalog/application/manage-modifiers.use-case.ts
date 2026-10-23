import {
  assertCurrentModifierGroup,
  assertCurrentModifierOption,
  assertFullModifierOptionReorder,
  assertModifierGroupAggregate,
  assertModifierOptionDetails,
  ModifierAdminError,
} from "../domain/modifier-admin.policy";
import { normalizeModifierDefaults } from "../domain/modifier-option-defaults";
import { saveModifierOptions } from "./save-modifier-options";
import type {
  AdminModifierGroup,
  AdminModifierOption,
} from "../domain/modifier-admin.policy.types";
import type {
  ArchiveModifierGroupCommand,
  ArchiveModifierOptionCommand,
  CreateModifierGroupCommand,
  CreateModifierOptionCommand,
  ModifiersUnitOfWork,
  ReorderModifierOptionsCommand,
  UpdateModifierGroupCommand,
  UpdateModifierOptionCommand,
} from "./modifiers.repository.types";

export class ManageModifiersUseCase {
  constructor(private readonly unitOfWork: ModifiersUnitOfWork) {}
  async createGroup(
    command: CreateModifierGroupCommand,
  ): Promise<AdminModifierGroup> {
    const options = normalizeModifierDefaults(command.options);
    assertModifierGroupAggregate(command, options);
    return this.unitOfWork.run(
      (repository) => repository.createGroup(command, options),
      (repository, after) =>
        repository.writeAudit({
          actorId: command.actorId,
          requestId: command.requestId,
          action: "MODIFIER_GROUP_CREATED",
          entityType: "modifier_group",
          entityId: after.id,
          before: null,
          after,
        }),
    );
  }
  async updateGroup(
    command: UpdateModifierGroupCommand,
  ): Promise<AdminModifierGroup> {
    const options = normalizeModifierDefaults(command.options);
    assertModifierGroupAggregate(command, options);
    return this.unitOfWork
      .run(
        async (repository) => {
          const before = assertCurrentModifierGroup(
            await repository.findGroupById(command.groupId),
          );
          assertSubmittedOptionIds(before.options, command.options);
          return {
            before,
            after: await repository.updateGroup(before.id, command, options),
          };
        },
        (repository, result) =>
          repository.writeAudit({
            actorId: command.actorId,
            requestId: command.requestId,
            action: "MODIFIER_GROUP_UPDATED",
            entityType: "modifier_group",
            entityId: result.after.id,
            before: result.before,
            after: result.after,
          }),
      )
      .then((result) => result.after);
  }
  async archiveGroup(command: ArchiveModifierGroupCommand): Promise<void> {
    await this.unitOfWork.run(
      async (repository) => {
        const before = assertCurrentModifierGroup(
          await repository.findGroupById(command.groupId),
        );
        return { before, after: await repository.archiveGroup(before.id) };
      },
      (repository, result) =>
        repository.writeAudit({
          actorId: command.actorId,
          requestId: command.requestId,
          action: "MODIFIER_GROUP_ARCHIVED",
          entityType: "modifier_group",
          entityId: result.after.id,
          before: result.before,
          after: result.after,
        }),
    );
  }
  async createOption(
    command: CreateModifierOptionCommand,
  ): Promise<AdminModifierOption> {
    assertModifierOptionDetails(command);
    return this.unitOfWork
      .run(
        async (repository) => {
          const before = assertCurrentModifierGroup(
            await repository.findGroupById(command.groupId),
          );
          const afterGroup = await saveModifierOptions(repository, before, [
            ...before.options,
            command,
          ]);
          const after = afterGroup.options.find(
            (option) => option.sortOrder === command.sortOrder,
          );
          if (after === undefined) {
            throw new Error("Saved modifier option was not returned");
          }
          return { before, afterGroup, after };
        },
        (repository, result) =>
          repository.writeAudit({
            actorId: command.actorId,
            requestId: command.requestId,
            action: "MODIFIER_OPTION_CREATED",
            entityType: "modifier_option",
            entityId: result.after.id,
            before: result.before,
            after: result.afterGroup,
          }),
      )
      .then(({ after }) => after);
  }

  async updateOption(
    command: UpdateModifierOptionCommand,
  ): Promise<AdminModifierOption> {
    assertModifierOptionDetails(command);
    return this.unitOfWork
      .run(
        async (repository) => {
          const option = assertCurrentModifierOption(
            await repository.findOptionById(command.optionId),
          );
          const before = assertCurrentModifierGroup(
            await repository.findGroupById(option.groupId),
          );
          const options = before.options.map((current) =>
            current.id === option.id ? { ...current, ...command } : current,
          );
          const afterGroup = await saveModifierOptions(
            repository,
            before,
            options,
          );
          const after = afterGroup.options.find(
            (current) => current.id === option.id,
          );
          if (after === undefined) {
            throw new Error("Saved modifier option was not returned");
          }
          return { before, afterGroup, after };
        },
        (repository, result) =>
          repository.writeAudit({
            actorId: command.actorId,
            requestId: command.requestId,
            action: "MODIFIER_OPTION_UPDATED",
            entityType: "modifier_option",
            entityId: result.after.id,
            before: result.before,
            after: result.afterGroup,
          }),
      )
      .then(({ after }) => after);
  }

  async reorderOptions(
    command: ReorderModifierOptionsCommand,
  ): Promise<AdminModifierOption[]> {
    return this.unitOfWork
      .run(
        async (repository) => {
          const before = assertCurrentModifierGroup(
            await repository.findGroupById(command.groupId),
          );
          assertFullModifierOptionReorder(
            before.options,
            command.groupId,
            command.optionIds,
          );
          const ordered = await repository.reorderOptions(
            before.options,
            command.optionIds,
          );
          const after = await saveModifierOptions(repository, before, ordered);
          return { before, after };
        },
        (repository, result) =>
          repository.writeAudit({
            actorId: command.actorId,
            requestId: command.requestId,
            action: "MODIFIER_OPTION_REORDERED",
            entityType: "modifier_group",
            entityId: result.after.id,
            before: result.before,
            after: result.after,
          }),
      )
      .then(({ after }) => after.options);
  }

  async archiveOption(command: ArchiveModifierOptionCommand): Promise<void> {
    await this.unitOfWork.run(
      async (repository) => {
        const option = assertCurrentModifierOption(
          await repository.findOptionById(command.optionId),
        );
        const before = assertCurrentModifierGroup(
          await repository.findGroupById(option.groupId),
        );
        const after = await saveModifierOptions(
          repository,
          before,
          before.options.filter((current) => current.id !== option.id),
        );
        return { before, after, option };
      },
      (repository, result) =>
        repository.writeAudit({
          actorId: command.actorId,
          requestId: command.requestId,
          action: "MODIFIER_OPTION_ARCHIVED",
          entityType: "modifier_option",
          entityId: result.option.id,
          before: result.before,
          after: result.after,
        }),
    );
  }
}
function assertSubmittedOptionIds(
  current: AdminModifierOption[],
  submitted: readonly { id?: string }[],
): void {
  submitted.forEach((option, index) => {
    if (
      option.id !== undefined &&
      !current.some((value) => value.id === option.id)
    ) {
      throw new ModifierAdminError("MODIFIER_INVALID", [
        {
          path: `options.${index}.id`,
          reason: "Must reference a current option",
        },
      ]);
    }
  });
}

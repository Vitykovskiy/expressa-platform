import {
  assertCurrentModifierGroup,
  assertCurrentModifierOption,
  assertFullModifierOptionReorder,
  assertModifierGroupAggregate,
  assertModifierOptionDetails,
  assertPublishableModifierGroup,
  ModifierAdminError,
} from "../domain/modifier-admin.policy";
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
    assertModifierGroupAggregate(command, command.options);
    return this.unitOfWork.run(
      (repository) => repository.createGroup(command, command.options),
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
    assertModifierGroupAggregate(command, command.options);
    return this.unitOfWork
      .run(
        async (repository) => {
          const before = assertCurrentModifierGroup(
            await repository.findGroupById(command.groupId),
          );
          assertSubmittedOptionIds(before.options, command.options);
          return {
            before,
            after: await repository.updateGroup(
              before.id,
              command,
              command.options,
            ),
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
    return this.unitOfWork.run(
      async (repository) => {
        const group = assertCurrentModifierGroup(
          await repository.findGroupById(command.groupId),
        );
        const options = await repository.findCurrentOptionsByGroup(group.id);
        assertPublishableModifierGroup(group, [...options, command]);
        return repository.createOption(group.id, command);
      },
      (repository, after) =>
        repository.writeAudit({
          actorId: command.actorId,
          requestId: command.requestId,
          action: "MODIFIER_OPTION_CREATED",
          entityType: "modifier_option",
          entityId: after.id,
          before: null,
          after,
        }),
    );
  }
  async updateOption(
    command: UpdateModifierOptionCommand,
  ): Promise<AdminModifierOption> {
    assertModifierOptionDetails(command);
    return this.unitOfWork
      .run(
        async (repository) => {
          const before = assertCurrentModifierOption(
            await repository.findOptionById(command.optionId),
          );
          const group = assertCurrentModifierGroup(
            await repository.findGroupById(before.groupId),
          );
          const options = await repository.findCurrentOptionsByGroup(group.id);
          assertPublishableModifierGroup(
            group,
            options.map((option) =>
              option.id === before.id ? command : option,
            ),
          );
          return {
            before,
            after: await repository.updateOption(before.id, command),
          };
        },
        (repository, result) =>
          repository.writeAudit({
            actorId: command.actorId,
            requestId: command.requestId,
            action: "MODIFIER_OPTION_UPDATED",
            entityType: "modifier_option",
            entityId: result.after.id,
            before: result.before,
            after: result.after,
          }),
      )
      .then((result) => result.after);
  }
  async reorderOptions(
    command: ReorderModifierOptionsCommand,
  ): Promise<AdminModifierOption[]> {
    return this.unitOfWork
      .run(
        async (repository) => {
          assertCurrentModifierGroup(
            await repository.findGroupById(command.groupId),
          );
          const before = await repository.findCurrentOptionsByGroup(
            command.groupId,
          );
          assertFullModifierOptionReorder(
            before,
            command.groupId,
            command.optionIds,
          );
          return {
            before,
            after: await repository.reorderOptions(before, command.optionIds),
          };
        },
        async (repository, result) => {
          for (const after of result.after)
            await repository.writeAudit({
              actorId: command.actorId,
              requestId: command.requestId,
              action: "MODIFIER_OPTION_REORDERED",
              entityType: "modifier_option",
              entityId: after.id,
              before:
                result.before.find((option) => option.id === after.id) ?? null,
              after,
            });
        },
      )
      .then((result) => result.after);
  }
  async archiveOption(command: ArchiveModifierOptionCommand): Promise<void> {
    await this.unitOfWork.run(
      async (repository) => {
        const before = assertCurrentModifierOption(
          await repository.findOptionById(command.optionId),
        );
        const group = assertCurrentModifierGroup(
          await repository.findGroupById(before.groupId),
        );
        const options = await repository.findCurrentOptionsByGroup(group.id);
        assertPublishableModifierGroup(
          group,
          options.filter((option) => option.id !== before.id),
        );
        return { before, after: await repository.archiveOption(before.id) };
      },
      (repository, result) =>
        repository.writeAudit({
          actorId: command.actorId,
          requestId: command.requestId,
          action: "MODIFIER_OPTION_ARCHIVED",
          entityType: "modifier_option",
          entityId: result.after.id,
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
    )
      throw new ModifierAdminError("MODIFIER_INVALID", [
        {
          path: `options.${index}.id`,
          reason: "Must reference a current option",
        },
      ]);
  });
}

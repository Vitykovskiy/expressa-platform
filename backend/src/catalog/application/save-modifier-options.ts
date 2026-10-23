import { assertPublishableModifierGroup } from "../domain/modifier-admin.policy";
import { normalizeModifierDefaults } from "../domain/modifier-option-defaults";
import type {
  AdminModifierGroup,
  ModifierOptionInput,
} from "../domain/modifier-admin.policy.types";
import type { ModifiersRepository } from "./modifiers.repository.types";

export async function saveModifierOptions(
  repository: ModifiersRepository,
  group: AdminModifierGroup,
  options: readonly ModifierOptionInput[],
): Promise<AdminModifierGroup> {
  const normalized = normalizeModifierDefaults(options);
  const details = {
    ...group,
    maxSelect:
      group.selectionType === "multiple" && group.minSelect === 0
        ? normalized.length
        : group.maxSelect,
  };
  assertPublishableModifierGroup(details, normalized);
  return repository.updateGroup(group.id, details, normalized);
}

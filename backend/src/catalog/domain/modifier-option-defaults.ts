import type { ModifierOptionInput } from "./modifier-admin.policy.types";

export function normalizeModifierDefaults<Option extends ModifierOptionInput>(
  options: readonly Option[],
): Option[] {
  let first: Option | undefined;
  for (const option of options) {
    if (
      first === undefined ||
      option.sortOrder < first.sortOrder ||
      (option.sortOrder === first.sortOrder &&
        (option.id ?? "") < (first.id ?? ""))
    ) {
      first = option;
    }
  }
  return options.map((option) => ({ ...option, isDefault: option === first }));
}

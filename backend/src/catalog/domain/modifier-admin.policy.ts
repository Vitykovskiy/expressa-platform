import { maximumModifierInteger } from "./modifier-admin.policy.constants";
import type {
  AdminModifierGroup,
  AdminModifierOption,
  ModifierAdminErrorCode,
  ModifierGroupDetails,
  ModifierOptionInput,
  ModifierOptionDetails,
} from "./modifier-admin.policy.types";
import type {
  CatalogValidationField,
  CatalogValidationFields,
} from "./catalog-validation.types";

export class ModifierAdminError extends Error {
  readonly fields: readonly CatalogValidationField[];

  constructor(code: Exclude<ModifierAdminErrorCode, "MODIFIER_INVALID">);
  constructor(code: "MODIFIER_INVALID", fields: CatalogValidationFields);
  constructor(
    readonly code: ModifierAdminErrorCode,
    fields?: CatalogValidationFields,
  ) {
    super(code);
    this.fields = fields ?? [];
  }
}

export function assertModifierGroupDetails(value: ModifierGroupDetails): void {
  if (value.name.trim() === "")
    throw new ModifierAdminError("MODIFIER_INVALID", [
      { path: "name", reason: "Must be a non-empty string" },
    ]);
  if (!isNonNegativeInteger(value.minSelect))
    throw new ModifierAdminError("MODIFIER_INVALID", [
      { path: "minSelect", reason: "Must be a non-negative int32" },
    ]);
  if (
    !isNonNegativeInteger(value.maxSelect) ||
    value.maxSelect < value.minSelect ||
    (value.selectionType === "single" && value.maxSelect !== 1)
  )
    throw new ModifierAdminError("MODIFIER_INVALID", [
      { path: "maxSelect", reason: "Must match selection type and minimum" },
    ]);
  if (value.selectionType !== "single" && value.selectionType !== "multiple")
    throw new ModifierAdminError("MODIFIER_INVALID", [
      { path: "selectionType", reason: "Must be single or multiple" },
    ]);
}
export function assertModifierOptionDetails(
  value: ModifierOptionDetails,
): void {
  if (value.name.trim() === "")
    throw new ModifierAdminError("MODIFIER_INVALID", [
      { path: "name", reason: "Must be a non-empty string" },
    ]);
  if (!isInteger(value.priceDeltaMinor))
    throw new ModifierAdminError("MODIFIER_INVALID", [
      { path: "priceDeltaMinor", reason: "Must be an int32" },
    ]);
  if (!isNonNegativeInteger(value.sortOrder))
    throw new ModifierAdminError("MODIFIER_INVALID", [
      { path: "sortOrder", reason: "Must be a non-negative int32" },
    ]);
}
export function assertPublishableModifierGroup(
  group: ModifierGroupDetails,
  options: readonly ModifierOptionDetails[],
): void {
  assertModifierGroupDetails(group);
  const orders = new Set<number>();
  for (const option of options) {
    assertModifierOptionDetails(option);
    if (orders.has(option.sortOrder))
      throw new ModifierAdminError("MODIFIER_INVALID", [
        { path: "options", reason: "Sort orders must be unique" },
      ]);
    orders.add(option.sortOrder);
  }
  if (!group.isActive || group.minSelect === 0) return;
  const defaults = options.filter(
    (option) => option.isAvailable && option.isDefault,
  );
  if (
    options.filter((option) => option.isAvailable).length < group.minSelect ||
    defaults.length < group.minSelect ||
    defaults.length > group.maxSelect ||
    defaults.some((option) => option.priceDeltaMinor !== 0)
  )
    throw new ModifierAdminError("MODIFIER_INVALID", [
      { path: "options", reason: "Must satisfy active group selection rules" },
    ]);
}
export function assertModifierGroupAggregate(
  group: ModifierGroupDetails,
  options: readonly ModifierOptionInput[],
): void {
  assertModifierGroupDetails(group);
  const errors: CatalogValidationField[] = [];
  const orders = new Set<number>();
  const ids = new Set<string>();
  options.forEach((option, index) => {
    try { assertModifierOptionDetails(option); } catch (error) {
      if (error instanceof ModifierAdminError) errors.push(...error.fields.map((field) => ({ ...field, path: `options.${index}.${field.path}` })));
    }
    if (orders.has(option.sortOrder)) errors.push({ path: `options.${index}.sortOrder`, reason: "Must be unique" });
    orders.add(option.sortOrder);
    if (option.id !== undefined && (ids.has(option.id) || option.id === "")) errors.push({ path: `options.${index}.id`, reason: "Must be unique when present" });
    if (option.id !== undefined) ids.add(option.id);
  });
  if (errors.length > 0) throw new ModifierAdminError("MODIFIER_INVALID", errors as unknown as CatalogValidationFields);
  try { assertPublishableModifierGroup(group, options); } catch (error) {
    if (error instanceof ModifierAdminError && error.code === "MODIFIER_INVALID") throw new ModifierAdminError("MODIFIER_INVALID", error.fields.map((field) => field.path === "options" ? { ...field, path: "options" } : field) as unknown as CatalogValidationFields);
    throw error;
  }
}
export function assertCurrentModifierGroup(
  value: AdminModifierGroup | null,
): AdminModifierGroup {
  if (value === null) throw new ModifierAdminError("MODIFIER_GROUP_NOT_FOUND");
  if (value.archivedAt !== null)
    throw new ModifierAdminError("MODIFIER_GROUP_ARCHIVED");
  return value;
}
export function assertCurrentModifierOption(
  value: AdminModifierOption | null,
): AdminModifierOption {
  if (value === null) throw new ModifierAdminError("MODIFIER_OPTION_NOT_FOUND");
  if (value.archivedAt !== null)
    throw new ModifierAdminError("MODIFIER_OPTION_ARCHIVED");
  return value;
}
export function assertFullModifierOptionReorder(
  options: readonly AdminModifierOption[],
  groupId: string,
  optionIds: readonly string[],
): void {
  const currentIds = options
    .filter(
      (option) => option.groupId === groupId && option.archivedAt === null,
    )
    .map((option) => option.id);
  if (
    optionIds.length !== currentIds.length ||
    new Set(optionIds).size !== optionIds.length ||
    optionIds.some((id) => !currentIds.includes(id))
  )
    throw new ModifierAdminError("MODIFIER_REORDER_INVALID");
}
function isInteger(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= -maximumModifierInteger &&
    value <= maximumModifierInteger
  );
}
function isNonNegativeInteger(value: unknown): value is number {
  return isInteger(value) && value >= 0;
}

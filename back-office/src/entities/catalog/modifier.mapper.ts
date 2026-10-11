import type { DeepReadonly } from "vue";
import { catalogInt32Maximum } from "./catalog.constants";
import {
  modifierFieldErrors,
  modifierOptionFieldErrors,
} from "./modifier.constants";
import type {
  Catalog,
  ModifierAggregate,
  ModifierDraft,
  ModifierErrors,
  ModifierFields,
  ModifierOptionDraft,
} from "./catalog.types";

export function modifierAggregate(
  catalog: DeepReadonly<Catalog>,
  id: string,
): ModifierAggregate | null {
  const group = catalog.modifierGroups.find((item) => item.id === id);

  return group === undefined
    ? null
    : {
        ...group,
        options: catalog.modifierOptions
          .filter((item) => item.groupId === id)
          .map((item) => ({ ...item }))
          .sort(
            (a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id),
          ),
      };
}

export function copyModifier(
  group: DeepReadonly<ModifierAggregate>,
): ModifierAggregate {
  return { ...group, options: group.options.map((item) => ({ ...item })) };
}

export function sameModifier(
  left: DeepReadonly<ModifierAggregate>,
  right: DeepReadonly<ModifierAggregate>,
) {
  return (
    left.id === right.id &&
    left.name === right.name &&
    left.selectionType === right.selectionType &&
    left.minSelect === right.minSelect &&
    left.maxSelect === right.maxSelect &&
    left.isActive === right.isActive &&
    left.options.length === right.options.length &&
    left.options.every((item, index) => {
      const other = right.options[index];

      return (
        other !== undefined &&
        item.id === other.id &&
        item.groupId === other.groupId &&
        item.name === other.name &&
        item.priceDelta === other.priceDelta &&
        item.sortOrder === other.sortOrder &&
        item.isDefault === other.isDefault &&
        item.isAvailable === other.isAvailable
      );
    })
  );
}

export function emptyModifierOption(key: number): ModifierOptionDraft {
  return {
    key,
    id: null,
    name: "",
    priceDelta: "",
    sortOrder: "",
    isDefault: false,
    isAvailable: false,
  };
}

export function modifierDraft(
  group?: DeepReadonly<ModifierAggregate>,
): ModifierDraft {
  return {
    name: group?.name ?? "",
    selectionType: group?.selectionType ?? "",
    minSelect: group ? String(group.minSelect) : "",
    maxSelect: group ? String(group.maxSelect) : "",
    isActive: group?.isActive ?? false,
    options:
      group?.options.map((item, key) => ({
        ...item,
        key,
        priceDelta: String(item.priceDelta),
        sortOrder: String(item.sortOrder),
      })) ?? [],
    removed: [],
  };
}

export function copyModifierDraft(
  draft: DeepReadonly<ModifierDraft>,
): ModifierDraft {
  return {
    ...draft,
    options: draft.options.map((item) => ({ ...item })),
    removed: draft.removed.map((item) => ({ ...item })),
  };
}

export function modifierInteger(value: string) {
  const number = Number(value);

  return value.trim() !== "" &&
    Number.isInteger(number) &&
    number >= 0 &&
    number <= catalogInt32Maximum
    ? number
    : null;
}

export function validModifierOrders(
  options: DeepReadonly<ModifierOptionDraft[]>,
) {
  const orders = options.map((item) => modifierInteger(item.sortOrder));

  return (
    orders.every((value) => value !== null) &&
    new Set(orders).size === orders.length
  );
}

export function modifierFields(
  draft: DeepReadonly<ModifierDraft>,
  baseline?: DeepReadonly<ModifierAggregate>,
): { fields: ModifierFields | null; errors: ModifierErrors } {
  const errors: ModifierErrors = {
    fields: {},
    options: {},
    optionsMessage: "",
    form: "",
  };
  const min = modifierInteger(draft.minSelect);
  const max = modifierInteger(draft.maxSelect);

  if (draft.name.trim() === "") errors.fields.name = modifierFieldErrors.name;
  if (draft.selectionType === "")
    errors.fields.selectionType = modifierFieldErrors.selectionType;
  if (min === null) errors.fields.minSelect = modifierFieldErrors.minSelect;
  if (
    max === null ||
    (min !== null && max < min) ||
    (draft.selectionType === "single" && max !== 1)
  )
    errors.fields.maxSelect = modifierFieldErrors.maxSelect;
  const ids = new Set<string>();
  const keys = new Set<number>();
  const options = draft.options.map((item) => {
    const invalid: ModifierErrors["options"][number] = {};
    const price = modifierInteger(item.priceDelta);
    const order = modifierInteger(item.sortOrder);

    if (item.name.trim() === "") invalid.name = modifierOptionFieldErrors.name;
    if (price === null)
      invalid.priceDelta = modifierOptionFieldErrors.priceDelta;
    if (
      order === null ||
      draft.options.some(
        (other) =>
          other.key !== item.key && modifierInteger(other.sortOrder) === order,
      )
    )
      invalid.sortOrder = modifierOptionFieldErrors.sortOrder;
    if (
      keys.has(item.key) ||
      (item.id !== null &&
        (baseline === undefined ||
          !baseline.options.some((entry) => entry.id === item.id) ||
          ids.has(item.id)))
    )
      invalid.row = modifierOptionFieldErrors.row;
    keys.add(item.key);
    if (item.id !== null) ids.add(item.id);
    if (Object.keys(invalid).length > 0) errors.options[item.key] = invalid;

    return {
      ...(item.id !== null ? { id: item.id } : {}),
      name: item.name,
      priceDelta: price ?? 0,
      sortOrder: order ?? 0,
      isDefault: item.isDefault,
      isAvailable: item.isAvailable,
    };
  });

  if (draft.isActive && min !== null && min > 0 && max !== null) {
    const available = options.filter((item) => item.isAvailable);
    const defaults = available.filter((item) => item.isDefault);

    if (
      available.length < min ||
      defaults.length < min ||
      defaults.length > max ||
      defaults.some((item) => item.priceDelta !== 0)
    )
      errors.optionsMessage =
        "Проверьте доступные добавки и бесплатный выбор по умолчанию в пределах минимума и максимума";
  }

  return {
    errors,
    fields:
      Object.keys(errors.fields).length > 0 ||
      Object.keys(errors.options).length > 0 ||
      errors.optionsMessage !== "" ||
      errors.form !== "" ||
      draft.selectionType === "" ||
      min === null ||
      max === null
        ? null
        : {
            name: draft.name,
            selectionType: draft.selectionType,
            minSelect: min,
            maxSelect: max,
            isActive: draft.isActive,
            options,
          },
  };
}

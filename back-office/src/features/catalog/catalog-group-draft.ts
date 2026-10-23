import type {
  CatalogGroupValues,
  CatalogModifierGroup,
  CatalogOption,
} from "../../entities/catalog/catalog.types";
import type { CatalogGroupDraft } from "./presentation/CatalogEditor.types";
import { parseCatalogMoney } from "./catalog-pricing";
import { MAX_GROUP_SELECTION_COUNT } from "./catalog-editor.constants";

export function createGroupDraft(
  group: CatalogModifierGroup | null,
  options: readonly CatalogOption[],
): CatalogGroupDraft {
  return {
    selectionType: group?.selectionType ?? "single",
    minSelect: String(group?.minSelect ?? 0),
    maxSelect: String(group?.maxSelect ?? 1),
    isActive: group?.isActive ?? true,
    options: [...options]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((option) => ({
        key: option.id,
        id: option.id,
        name: option.name,
        price: String(option.priceDelta),
        sortOrder: option.sortOrder,
        isDefault: option.isDefault,
        isAvailable: option.isAvailable,
      })),
  };
}

export function groupDraftError(draft: CatalogGroupDraft): string | null {
  const min = parseGroupCount(draft.minSelect);
  const max = parseGroupCount(draft.maxSelect);

  if (
    min === null ||
    max === null ||
    max < min ||
    (draft.selectionType === "single" && max !== 1)
  ) {
    return "Проверьте минимальное и максимальное число опций.";
  }

  if (
    draft.options.some(
      (option) =>
        option.name.trim() === "" || parseCatalogMoney(option.price) === null,
    )
  ) {
    return "Укажите название и целую неотрицательную цену каждой опции.";
  }

  if (draft.isActive && min > 0) {
    const available = draft.options.filter((option) => option.isAvailable);
    const defaults = available.filter((option) => option.isDefault);

    if (
      available.length < min ||
      defaults.length < min ||
      defaults.length > max ||
      defaults.some((option) => parseCatalogMoney(option.price) !== 0)
    ) {
      return draft.selectionType === "single"
        ? "Выберите одну доступную бесплатную опцию по умолчанию."
        : "Число бесплатных опций по умолчанию должно соответствовать ограничениям группы.";
    }
  }

  return null;
}

export function readGroupValues(
  draft: CatalogGroupDraft,
): CatalogGroupValues | null {
  if (groupDraftError(draft) !== null) {
    return null;
  }

  const minSelect = parseGroupCount(draft.minSelect);
  const maxSelect = parseGroupCount(draft.maxSelect);

  if (minSelect === null || maxSelect === null) {
    return null;
  }

  const options: CatalogGroupValues["options"][number][] = [];

  for (const option of draft.options) {
    const priceDelta = parseCatalogMoney(option.price);

    if (priceDelta === null) {
      return null;
    }

    options.push({
      ...(option.id === null ? {} : { id: option.id }),
      name: option.name.trim(),
      priceDelta,
      sortOrder: option.sortOrder,
      isDefault: option.isDefault,
      isAvailable: option.isAvailable,
    });
  }

  return {
    selectionType: draft.selectionType,
    minSelect,
    maxSelect,
    isActive: draft.isActive,
    options,
  };
}

function parseGroupCount(value: string): number | null {
  if (!/^\d+$/.test(value)) {
    return null;
  }

  const count = Number(value);

  return Number.isSafeInteger(count) && count <= MAX_GROUP_SELECTION_COUNT
    ? count
    : null;
}

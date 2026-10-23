import { MAX_CATALOG_MONEY } from "../../entities/catalog/catalog.constants";
import type { CatalogChoice } from "../../entities/catalog/catalog.types";
import { CATALOG_SIZES } from "./presentation/CatalogEditor.constants";
import type { CatalogChoiceDraft } from "./presentation/CatalogEditor.types";
import type { CatalogPricedChoice } from "./catalog-pricing.types";

export function parseCatalogMoney(value: string): number | null {
  if (!/^\d+$/.test(value)) {
    return null;
  }

  const amount = Number(value);

  return Number.isSafeInteger(amount) && amount <= MAX_CATALOG_MONEY
    ? amount
    : null;
}

/** Пустая строка исключает опцию; неверная непустая цена отклоняет весь набор. */
export function readPricedChoices(
  drafts: readonly CatalogChoiceDraft[],
): readonly CatalogPricedChoice[] | null {
  const choices: CatalogPricedChoice[] = [];

  for (const draft of drafts) {
    const text = draft.price.trim();

    if (text === "") {
      continue;
    }

    const amount = parseCatalogMoney(text);

    if (amount === null) {
      return null;
    }

    choices.push({ id: draft.id, label: draft.label, amount });
  }

  return choices.length === 0 ? null : choices;
}

export function createChoiceDrafts(
  choices: readonly CatalogChoice[],
): readonly CatalogChoiceDraft[] {
  const ordered = [...choices].sort(
    (left, right) => left.sortOrder - right.sortOrder,
  );
  const presetLabels = new Set<string>(CATALOG_SIZES);
  const isPreset =
    ordered.every((choice) => presetLabels.has(choice.portionLabel)) &&
    new Set(ordered.map((choice) => choice.portionLabel)).size ===
      ordered.length;

  if (!isPreset) {
    return ordered.map((choice) => ({
      key: choice.id,
      id: choice.id,
      label: choice.portionLabel,
      price: String(choice.price),
    }));
  }

  return CATALOG_SIZES.map((label) => {
    const saved = ordered.find((choice) => choice.portionLabel === label);

    return {
      key: saved?.id ?? label,
      id: saved?.id ?? null,
      label,
      price: saved === undefined ? "" : String(saved.price),
    };
  });
}

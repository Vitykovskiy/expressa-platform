import type { ProductPriceChoiceDraft } from "./useProductDraft.types";
import type { ProductChoiceErrors } from "./ProductEdit.validation.types";

export function productNameError(name: string): string {
  const length = name.trim().length;
  if (length === 0) return "Укажите название товара";
  if (length > 120) return "Название должно содержать не более 120 символов";
  return "";
}

export function productDescriptionError(description: string): string {
  return description.trim().length > 240
    ? "Описание должно быть не длиннее 240 символов"
    : "";
}

export function productChoiceErrors(
  choices: readonly ProductPriceChoiceDraft[],
): ProductChoiceErrors {
  const errors: Record<string, { price?: string; portionLabel?: string }> = {};
  const labels = new Map<string, string>();
  for (const choice of choices) {
    const entry: { price?: string; portionLabel?: string } = {};
    if (choice.price === "") entry.price = "Укажите цену";
    else if (!/^\d+$/.test(choice.price) || Number(choice.price) < 0)
      entry.price = "Введите целое неотрицательное значение";
    const normalized = choice.portionLabel
      .trim()
      .replace(/\s+/g, " ")
      .toLocaleLowerCase("ru");
    if (choices.length > 1 && !normalized)
      entry.portionLabel = "Укажите подпись варианта";
    else if (normalized && labels.has(normalized)) {
      entry.portionLabel = "Подписи вариантов не должны повторяться";
      const first = labels.get(normalized);
      if (first && !errors[first]?.portionLabel)
        errors[first] = {
          ...errors[first],
          portionLabel: "Подписи вариантов не должны повторяться",
        };
    } else if (normalized) labels.set(normalized, choice.clientId);
    if (Object.keys(entry).length) errors[choice.clientId] = entry;
  }
  return errors;
}

export function productErrorMessages(
  nameError: string,
  descriptionError: string,
  choices: readonly ProductPriceChoiceDraft[],
  choiceErrors: ProductChoiceErrors,
): readonly string[] {
  return [
    ...(nameError ? [nameError] : []),
    ...(descriptionError ? [descriptionError] : []),
    ...(choices.length === 0 ? ["Добавьте хотя бы один вариант"] : []),
    ...Object.values(choiceErrors).flatMap((entry) =>
      Object.values(entry).filter((message): message is string =>
        Boolean(message),
      ),
    ),
  ];
}

import type { UiSelectOption } from "../../shared/ui/UiSelect/UiSelect.types";
import type { UiFilterOption } from "../../shared/ui/UiFilterGroup/UiFilterGroup.types";
import type { DemoFeedback, DemoRow, SaveState } from "./workbench.types";

export const initialName = "Лимонад с чёрной смородиной";
export const longName =
  "Лимонад с чёрной смородиной и розмарином без добавления сахара";
export const categoryOptions: readonly UiSelectOption[] = [
  { value: "drinks", label: "Напитки" },
  {
    value: "seasonal",
    label:
      "Сезонные напитки без добавления сахара и искусственных ароматизаторов",
  },
  { value: "archive", label: "Архив", disabled: true },
];
export const filterOptions: readonly UiFilterOption[] = [
  { value: "all", label: "Все" },
  { value: "available", label: "Доступные" },
  { value: "unavailable", label: "Недоступные" },
];
export const resultOptions: readonly UiFilterOption[] = [
  { value: "success", label: "Успех" },
  { value: "error", label: "Ошибка" },
];
export const feedbackOptions: readonly UiFilterOption[] = [
  { value: "loading", label: "Загрузка" },
  { value: "empty", label: "Пусто" },
  { value: "error", label: "Ошибка" },
  { value: "success", label: "Успех" },
];
export const saveFeedback: Record<Exclude<SaveState, "idle">, DemoFeedback> = {
  pending: { kind: "loading", text: "Сохранение…" },
  error: {
    kind: "error",
    text: "Не удалось сохранить. Изменения остались в форме.",
  },
  success: { kind: "success", text: "Изменения сохранены" },
};
export const stateFeedback: Record<DemoFeedback["kind"], string> = {
  loading: "Загрузка списка…",
  empty: "Нет позиций",
  error: "Не удалось загрузить список",
  success: "Список обновлён",
};

export const sampleRows: readonly DemoRow[] = [
  {
    id: "currant",
    name: "Лимонад с чёрной смородиной",
    available: true,
    tone: "neutral",
    label: "Доступен",
  },
  {
    id: "rosemary",
    name: "Лимонад с розмарином",
    available: false,
    tone: "warning",
    label: "Требует внимания",
  },
  {
    id: "mors",
    name: "Морс без добавления сахара",
    available: false,
    tone: "danger",
    label: "Ошибка сохранения",
  },
];

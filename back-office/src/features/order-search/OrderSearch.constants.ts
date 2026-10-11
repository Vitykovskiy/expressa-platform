import type { UiSelectOption } from "../../shared/ui/UiSelect/UiSelect.types";

export const stageOptions: readonly UiSelectOption[] = [
  { value: "all", label: "Все" },
  { value: "CREATED", label: "Новые" },
  { value: "ACCEPTED", label: "Принятые" },
  { value: "PREPARING", label: "Готовятся" },
  { value: "READY", label: "Готовы" },
  { value: "ISSUED", label: "Выданы" },
];

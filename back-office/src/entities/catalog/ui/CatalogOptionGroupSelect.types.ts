export interface CatalogSelectOption {
  readonly value: string;
  readonly label: string;
  readonly selectedLabel?: string;
  readonly disabled?: boolean;
}

export interface CatalogOptionGroupSelectProps {
  readonly id: string;
  readonly modelValue: readonly string[];
  readonly options: readonly CatalogSelectOption[];
  readonly disabled: boolean;
}

export interface CatalogOptionGroupSelectEmits {
  /** Порядок выбранных ID сохраняется; черновиком владеет редактор. */
  "update:modelValue": [groupIds: readonly string[]];
}

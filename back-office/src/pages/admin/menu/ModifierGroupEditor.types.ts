import type {
  CatalogFormSaveOutcome,
  CatalogStoreError,
  ModifierGroup,
  ModifierSelectionType,
} from "./catalog.types";
import type { ModifierOptionFormData } from "./ModifierOptionEditor.types";

export type ModifierGroupFormField =
  | "name"
  | "selectionType"
  | "minSelect"
  | "maxSelect"
  | "options"
  | `options.${number}.name`
  | `options.${number}.priceDelta`
  | `options.${number}.isDefault`;

export interface ModifierGroupFormData {
  id?: string;
  name: string;
  selectionType: ModifierSelectionType;
  minSelect: number;
  maxSelect: number;
  isActive: boolean;
  options: readonly ModifierOptionFormData[];
}

export interface ModifierSelectionTypeOption {
  value: ModifierSelectionType;
  label: string;
}

export interface ModifierGroupEditorProps {
  embedded?: boolean;
  formId?: string;
  group: ModifierGroup | null;
  disabled?: boolean;
  loading?: boolean;
  errorMessage?: string;
  fieldErrors?: Partial<Record<ModifierGroupFormField, string>>;
  pendingMessage?: string | null;
  operationKind?: "save" | "archive" | null;
  saveError?: CatalogStoreError | null;
  saveOutcome?: CatalogFormSaveOutcome;
}

export interface ModifierGroupEditorEmits {
  save: [data: ModifierGroupFormData];
  archive: [groupId: string];
  cancel: [];
  refresh: [];
}

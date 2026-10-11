import type {
  CategoryDraft,
  CategoryErrors,
} from "../../entities/catalog/catalog.types";

export interface CategoryFormProps {
  draft: Readonly<CategoryDraft>;
  errors: Readonly<CategoryErrors>;
  title: string;
  creating: boolean;
  readOnly: boolean;
  disabled: boolean;
  mutationDisabled: boolean;
  dirty: boolean;
  busy: boolean;
  attempting: boolean;
  canArchive: boolean;
}
export interface CategoryFormEmits {
  draft: [draft: CategoryDraft];
  save: [];
  cancel: [];
  archive: [];
}

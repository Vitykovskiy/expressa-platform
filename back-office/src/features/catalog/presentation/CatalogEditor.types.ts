export interface CatalogSelectOption {
  readonly value: string;
  readonly label: string;
  readonly disabled?: boolean;
}

export interface CatalogCategoryDraft {
  readonly name: string;
  readonly isOptionGroup: boolean;
  readonly optionGroupId: string;
}

export interface CatalogChoiceDraft {
  readonly key: string;
  readonly id: string | null;
  readonly label: string;
  readonly price: string;
}

export interface CatalogProductDraft {
  readonly categoryId: string;
  readonly name: string;
  readonly hasSizes: boolean;
  readonly price: string;
  readonly choices: readonly CatalogChoiceDraft[];
}

export interface CatalogDialogState {
  readonly open: boolean;
  readonly mode: "create" | "edit";
  readonly summary: string | null;
  readonly pending: boolean;
  readonly canSave: boolean;
  readonly error: string | null;
}

export interface CatalogCategoryDialogProps extends CatalogDialogState {
  readonly draft: CatalogCategoryDraft;
  readonly options: readonly CatalogSelectOption[];
  readonly associationSummary: string | null;
}

export interface CatalogCategoryDialogEmits {
  "update:draft": [draft: CatalogCategoryDraft];
  save: [];
  delete: [];
  close: [];
}

export interface CatalogProductDialogProps extends CatalogDialogState {
  readonly draft: CatalogProductDraft;
  readonly categories: readonly CatalogSelectOption[];
  readonly option: boolean;
}

export interface CatalogProductDialogEmits {
  "update:draft": [draft: CatalogProductDraft];
  save: [];
  delete: [];
  close: [];
}

export interface CatalogDialogHeaderProps {
  readonly title: string;
  readonly titleId: string;
  readonly summary: string | null;
  readonly editing: boolean;
  readonly pending: boolean;
  readonly deleteLabel: string;
}

export interface CatalogDialogHeaderEmits {
  delete: [];
}

export interface CatalogSelectOption {
  readonly value: string;
  readonly label: string;
  readonly disabled?: boolean;
}

export interface CatalogCategoryDraft {
  readonly name: string;
  readonly isOptionGroup: boolean;
  readonly optionGroupId: string;
  readonly group: CatalogGroupDraft;
}

export interface CatalogChoiceDraft {
  readonly key: string;
  readonly id: string | null;
  readonly label: string;
  readonly price: string;
}

export interface CatalogProductDraft {
  readonly modifierGroupIds: readonly string[];
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
  readonly focusOptionKey: string | null;
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
  readonly inheritedGroups: readonly CatalogSelectOption[];
  readonly ownGroups: readonly CatalogSelectOption[];
  readonly draft: CatalogProductDraft;
  readonly categories: readonly CatalogSelectOption[];
}

export interface CatalogGroupOptionDraft {
  readonly key: string;
  readonly id: string | null;
  readonly name: string;
  readonly price: string;
  readonly sortOrder: number;
  readonly isDefault: boolean;
  readonly isAvailable: boolean;
}
export interface CatalogGroupDraft {
  readonly selectionType: "single" | "multiple";
  readonly minSelect: string;
  readonly maxSelect: string;
  readonly isActive: boolean;
  readonly options: readonly CatalogGroupOptionDraft[];
}
export interface CatalogGroupFieldsProps {
  readonly draft: CatalogGroupDraft;
  readonly pending: boolean;
  readonly focusOptionKey: string | null;
}
export interface CatalogGroupFieldsEmits {
  "update:draft": [draft: CatalogGroupDraft];
}
export interface CatalogGroupOptionRowProps {
  readonly option: CatalogGroupOptionDraft;
  readonly pending: boolean;
  readonly focus: boolean;
}
export interface CatalogGroupOptionRowEmits {
  change: [option: CatalogGroupOptionDraft];
  remove: [];
  selectDefault: [];
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

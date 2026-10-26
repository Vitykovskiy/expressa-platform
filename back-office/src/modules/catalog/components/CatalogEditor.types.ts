import type { CatalogSelectOption } from "./CatalogOptionGroupSelect.types";

export interface CatalogCategoryDraft {
  readonly name: string;
  readonly isOptionGroup: boolean;
  /** Порядок выбора участвует в атомарном сохранении связей категории. */
  readonly optionGroupIds: readonly string[];
  readonly singleSelection: boolean;
}

export interface CatalogChoiceDraft {
  /** Локальный ключ строки сохраняется и до появления серверного ID. */
  readonly key: string;
  readonly id: string | null;
  readonly label: string;
  /** Пустую цену и явный "0" различает общий catalog-pricing. */
  readonly price: string;
}

export interface CatalogProductDraft {
  readonly categoryId: string;
  readonly name: string;
  readonly hasSizes: boolean;
  /** Обе ценовые ветки сохраняют ввод при переключении видимого режима. */
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
}

export interface CatalogCategoryDialogEmits {
  "update:draft": [draft: CatalogCategoryDraft];
  save: [];
  delete: [];
  close: [];
}

export interface CatalogProductDialogProps extends CatalogDialogState {
  readonly isOption: boolean;
  readonly draft: CatalogProductDraft;
  readonly categories: readonly CatalogSelectOption[];
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

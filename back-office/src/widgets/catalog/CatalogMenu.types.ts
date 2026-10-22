import type { CatalogItemIdentity } from "../../entities/catalog/catalog.types";

export interface CatalogItemView extends CatalogItemIdentity {
  readonly id: string;
  readonly name: string;
  readonly priceLabel: string;
}

export interface CatalogGroupView {
  readonly id: string;
  readonly name: string;
  readonly countLabel: string;
  readonly items: readonly CatalogItemView[];
}

export interface CatalogMenuProps {
  readonly categories: readonly CatalogGroupView[];
  readonly optionGroups: readonly CatalogGroupView[];
  readonly summary: string;
  readonly loading: boolean;
  readonly error: string | null;
  readonly disabled: boolean;
}

export interface CatalogMenuEmits {
  createCategory: [];
  createProduct: [];
  editCategory: [id: string];
  editOptionGroup: [id: string];
  editProduct: [target: CatalogItemIdentity];
  retry: [];
}

export interface CatalogGroupProps {
  readonly group: CatalogGroupView;
  readonly disabled: boolean;
}

export interface CatalogGroupEmits {
  edit: [id: string];
  editItem: [target: CatalogItemIdentity];
}

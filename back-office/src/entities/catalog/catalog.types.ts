export interface CategoryFields {
  name: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
}
export interface CategoryDto extends CategoryFields {
  id: string;
}
export interface CatalogChoiceDto {
  id: string;
  portionLabel: string;
  price: number;
  sortOrder: number;
  isAvailable: boolean;
}
export interface CatalogProductDto extends CategoryDto {
  categoryId: string;
  price: number | null;
  portionLabel: string | null;
  priceChoices: CatalogChoiceDto[];
  isAvailable: boolean;
}
export interface CatalogGroupDto {
  id: string;
  name: string;
  selectionType: "single" | "multiple";
  minSelect: number;
  maxSelect: number;
  isActive: boolean;
}
export interface CatalogOptionDto {
  id: string;
  groupId: string;
  name: string;
  priceDelta: number;
  sortOrder: number;
  isDefault: boolean;
  isAvailable: boolean;
}
export interface CatalogLinkDto {
  categoryId: string;
  groupId: string;
  sortOrder: number;
}
export interface CatalogDto {
  categories: CategoryDto[];
  products: CatalogProductDto[];
  modifierGroups: CatalogGroupDto[];
  modifierOptions: CatalogOptionDto[];
  categoryModifierGroups: CatalogLinkDto[];
}
export interface Catalog extends CatalogDto {
  categories: CategoryDto[];
}
export interface CategoryDraft {
  name: string;
  description: string;
  sortOrder: string;
  isActive: boolean;
}
export type CategoryField = keyof CategoryDraft;
export type CategoryErrors = Partial<Record<CategoryField, string>>;
export type CategoryTask =
  | { kind: "create"; draft: CategoryDraft }
  | { kind: "edit"; baseline: CategoryDto; draft: CategoryDraft }
  | { kind: "reorder"; baseline: CategoryDto[]; ids: string[] };
export type CategoryIntent =
  | { kind: "create"; fields: CategoryFields; label: string }
  | {
      kind: "update";
      fields: CategoryFields;
      baseline: CategoryDto;
      label: string;
    }
  | { kind: "archive"; baseline: CategoryDto; label: string }
  | {
      kind: "reorder";
      baseline: readonly CategoryDto[];
      ids: readonly string[];
      label: string;
    };
export type CategoryOperationStatus =
  | "checking"
  | "sending"
  | "completed"
  | "rejected"
  | "conflict"
  | "absent"
  | "unknown"
  | "reconciling"
  | "reconciled"
  | "reconciled_ambiguous_create"
  | "abandoned";
export interface CategoryOperation {
  intent: CategoryIntent;
  status: CategoryOperationStatus;
  message: string;
}

export interface ProductChoiceFields {
  id?: string;
  portionLabel: string;
  price: number;
  sortOrder: number;
  isAvailable: boolean;
}
export interface ProductFields extends CategoryFields {
  categoryId: string;
  price: number | null;
  portionLabel: string | null;
  priceChoices: ProductChoiceFields[];
  isAvailable: boolean;
}
export interface ProductChoiceDraft {
  key: number;
  id: string | null;
  portionLabel: string;
  price: string;
  sortOrder: string;
  isAvailable: boolean;
}
export interface ProductDraft extends CategoryDraft {
  categoryId: string;
  isAvailable: boolean;
  mode: "single" | "choices";
  price: string;
  portionLabel: string;
  choices: ProductChoiceDraft[];
  removed: ProductChoiceDraft[];
}
export type ProductField = Exclude<keyof ProductDraft, "choices" | "removed">;
export type ProductChoiceField =
  "portionLabel" | "price" | "sortOrder" | "isAvailable";
export interface ProductErrors {
  fields: Partial<Record<ProductField, string>>;
  choices: Record<number, Partial<Record<ProductChoiceField | "row", string>>>;
  form: string;
}
export type ProductTask =
  | {
      kind: "product-create";
      draft: ProductDraft;
      initialDraft: ProductDraft;
      revision: number;
      nextKey: number;
    }
  | {
      kind: "product-edit";
      baseline: CatalogProductDto;
      category: CategoryDto;
      draft: ProductDraft;
      initialDraft: ProductDraft;
      revision: number;
      nextKey: number;
    }
  | {
      kind: "product-reorder";
      category: CategoryDto;
      baseline: CatalogProductDto[];
      ids: string[];
    };
export type ProductIntent =
  | {
      kind: "product-create";
      fields: ProductFields;
      category: CategoryDto;
      choiceKeys: number[];
      label: string;
    }
  | {
      kind: "product-update";
      fields: ProductFields;
      baseline: CatalogProductDto;
      category: CategoryDto;
      sourceCategory: CategoryDto;
      choiceKeys: number[];
      omittedIds: string[];
      label: string;
    }
  | {
      kind: "product-archive";
      baseline: CatalogProductDto;
      sourceCategory: CategoryDto;
      label: string;
    }
  | {
      kind: "product-reorder";
      category: CategoryDto;
      baseline: CatalogProductDto[];
      ids: string[];
      label: string;
    };
export interface ModifierAggregate extends CatalogGroupDto {
  options: CatalogOptionDto[];
}
export interface ModifierOptionFields {
  id?: string;
  name: string;
  priceDelta: number;
  sortOrder: number;
  isDefault: boolean;
  isAvailable: boolean;
}
export interface ModifierFields {
  name: string;
  selectionType: CatalogGroupDto["selectionType"];
  minSelect: number;
  maxSelect: number;
  isActive: boolean;
  options: ModifierOptionFields[];
}
export interface ModifierOptionDraft {
  key: number;
  id: string | null;
  name: string;
  priceDelta: string;
  sortOrder: string;
  isDefault: boolean;
  isAvailable: boolean;
}
export interface ModifierDraft {
  name: string;
  selectionType: "" | CatalogGroupDto["selectionType"];
  minSelect: string;
  maxSelect: string;
  isActive: boolean;
  options: ModifierOptionDraft[];
  removed: ModifierOptionDraft[];
}
export type ModifierField = Exclude<keyof ModifierDraft, "options" | "removed">;
export type ModifierOptionField = Exclude<keyof ModifierOptionFields, "id">;
export interface ModifierErrors {
  fields: Partial<Record<ModifierField, string>>;
  options: Record<number, Partial<Record<ModifierOptionField | "row", string>>>;
  optionsMessage: string;
  form: string;
}
export type ModifierValidationTarget =
  | { kind: "field"; field: ModifierField }
  | { kind: "option"; key: number; field: ModifierOptionField };
export interface ModifierValidationState {
  fields: ModifierField[];
  options: Record<number, ModifierOptionField[]>;
  submitted: boolean;
  rejected: ModifierErrors;
}
export interface ModifierErrorFocus {
  revision: number;
  sequence: number;
}
export type ModifierTask =
  | {
      kind: "modifier-create";
      draft: ModifierDraft;
      initialDraft: ModifierDraft;
      revision: number;
      nextKey: number;
    }
  | {
      kind: "modifier-edit";
      baseline: ModifierAggregate;
      draft: ModifierDraft;
      initialDraft: ModifierDraft;
      revision: number;
      nextKey: number;
    }
  | { kind: "modifier-reorder"; baseline: ModifierAggregate; ids: string[] };
export type ModifierIntent =
  | {
      kind: "modifier-create";
      fields: ModifierFields;
      optionKeys: number[];
      revision: number;
      label: string;
    }
  | {
      kind: "modifier-update";
      fields: ModifierFields;
      baseline: ModifierAggregate;
      optionKeys: number[];
      omittedIds: string[];
      revision: number;
      label: string;
    }
  | { kind: "modifier-archive"; baseline: ModifierAggregate; label: string }
  | {
      kind: "modifier-reorder";
      baseline: ModifierAggregate;
      ids: string[];
      label: string;
    };
export interface ModifierOmissionConfirmation {
  revision: number;
  groupId: string;
  options: CatalogOptionDto[];
}
export interface AssociationBaseline {
  category: CategoryDto;
  links: CatalogLinkDto[];
  groups: ModifierAggregate[];
}
export interface AssociationTask {
  kind: "category-associations";
  baseline: AssociationBaseline;
  ids: string[];
  revision: number;
}
export interface AssociationIntent {
  kind: "category-associations";
  baseline: AssociationBaseline;
  ids: string[];
  revision: number;
  label: string;
}
export interface AssociationConfirmation {
  intent: AssociationIntent;
  access: number;
  identity: string;
}
export interface AssociationErrors {
  membership: string;
  category: string;
  form: string;
}
export type CatalogTask =
  CategoryTask | ProductTask | ModifierTask | AssociationTask;
export type CatalogIntent =
  CategoryIntent | ProductIntent | ModifierIntent | AssociationIntent;
export interface CatalogOperation {
  intent: CatalogIntent;
  status: CategoryOperationStatus;
  message: string;
}
export interface ProductOmissionConfirmation {
  revision: number;
  productId: string;
  choices: CatalogChoiceDto[];
}

export type CatalogCommandResponse =
  | { target: "association"; value: CatalogLinkDto[] }
  | { target: "modifier"; value: ModifierAggregate | CatalogOptionDto[] | null }
  | { target: "product"; value: CatalogProductDto | CatalogProductDto[] | null }
  | { target: "category"; value: CategoryDto | CategoryDto[] | null };

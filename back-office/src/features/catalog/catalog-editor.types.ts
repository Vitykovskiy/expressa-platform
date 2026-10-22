import type {
  CatalogCommand,
  CatalogTarget,
} from "../../entities/catalog/catalog.types";
import type {
  CatalogCategoryDraft,
  CatalogProductDraft,
} from "./presentation/CatalogEditor.types";

export type CatalogEditor =
  | {
      readonly kind: "category";
      readonly target: CatalogTarget;
      readonly draft: CatalogCategoryDraft;
      readonly originalGroupId: string;
      readonly originalGroups: readonly string[];
      readonly summary: string | null;
    }
  | {
      readonly kind: "product";
      readonly target: CatalogTarget;
      readonly draft: CatalogProductDraft;
      readonly originalChoiceIds: readonly string[];
      readonly summary: string | null;
    };

export interface CatalogConfirmation {
  readonly version: number;
  readonly command: CatalogCommand;
  readonly title: string;
  readonly description: string;
  readonly destructive: boolean;
}

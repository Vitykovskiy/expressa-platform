import type {
  CatalogCommand,
  CatalogTarget,
} from "../../../entities/catalog/catalog.types";
import type {
  CatalogCategoryDraft,
  CatalogProductDraft,
} from "../ui/CatalogEditor.types";

export type CatalogEditor =
  | {
      readonly kind: "category";
      readonly target: CatalogTarget;
      readonly draft: CatalogCategoryDraft;
      readonly originalGroups: readonly string[];
      readonly summary: string | null;
    }
  | {
      readonly kind: "product";
      readonly target: CatalogTarget;
      readonly draft: CatalogProductDraft;
      readonly originalChoices: readonly {
        readonly id: string;
        readonly label: string;
      }[];
      readonly summary: string | null;
    };

export interface CatalogConfirmation {
  readonly version: number;
  readonly command: CatalogCommand;
  readonly title: string;
  readonly description: string;
  readonly destructive: boolean;
}

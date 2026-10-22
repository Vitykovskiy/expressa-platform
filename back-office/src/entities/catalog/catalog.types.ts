export interface CatalogCategory {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly sortOrder: number;
  readonly isActive: boolean;
}

export interface CatalogChoice {
  readonly id: string;
  readonly portionLabel: string;
  readonly price: number;
  readonly sortOrder: number;
  readonly isAvailable: boolean;
}

export interface CatalogProduct extends CatalogCategory {
  readonly categoryId: string;
  readonly price: number | null;
  readonly portionLabel: string | null;
  readonly priceChoices: readonly CatalogChoice[];
  readonly isAvailable: boolean;
}

export interface CatalogOption {
  readonly id: string;
  readonly groupId: string;
  readonly name: string;
  readonly priceDelta: number;
  readonly sortOrder: number;
  readonly isDefault: boolean;
  readonly isAvailable: boolean;
}

export interface CatalogModifierGroup {
  readonly id: string;
  readonly name: string;
  readonly selectionType: "single" | "multiple";
  readonly minSelect: number;
  readonly maxSelect: number;
  readonly isActive: boolean;
}

export interface CatalogAssociation {
  readonly categoryId: string;
  readonly groupId: string;
  readonly sortOrder: number;
}

export interface CatalogData {
  readonly categories: readonly CatalogCategory[];
  readonly products: readonly CatalogProduct[];
  readonly modifierGroups: readonly CatalogModifierGroup[];
  readonly modifierOptions: readonly CatalogOption[];
  readonly categoryModifierGroups: readonly CatalogAssociation[];
}

export interface CatalogContext {
  readonly identityId: string;
  readonly accessToken: string;
}

export type CatalogTarget =
  | {
      readonly kind: "category" | "group" | "product" | "option";
      readonly id: string;
      readonly name: string;
    }
  | {
      readonly kind: "new-category" | "new-group" | "new-product";
      readonly name: string;
    }
  | {
      readonly kind: "new-option";
      readonly groupId: string;
      readonly name: string;
    };

export interface CatalogProductValues {
  readonly name: string;
  readonly categoryId: string;
  readonly pricing:
    | { readonly kind: "fixed"; readonly amount: number }
    | {
        readonly kind: "choices";
        readonly choices: readonly {
          readonly id: string | null;
          readonly label: string;
          readonly amount: number;
        }[];
      };
}

export type CatalogCommand =
  | {
      readonly action: "save-category";
      readonly target: CatalogTarget & {
        readonly kind: "category" | "new-category";
      };
      readonly name: string;
      readonly association:
        | { readonly kind: "keep" }
        | { readonly kind: "replace"; readonly groupId: string | null };
    }
  | {
      readonly action: "save-group";
      readonly target: CatalogTarget & { readonly kind: "group" | "new-group" };
      readonly name: string;
    }
  | {
      readonly action: "save-product";
      readonly target: CatalogTarget & {
        readonly kind: "product" | "new-product";
      };
      readonly values: CatalogProductValues;
    }
  | {
      readonly action: "save-option";
      readonly target: CatalogTarget & {
        readonly kind: "option" | "new-option";
      };
      readonly name: string;
      readonly amount: number;
    }
  | {
      readonly action: "archive";
      readonly target: CatalogTarget & {
        readonly kind: "category" | "group" | "product" | "option";
        readonly id: string;
      };
    };

export type CatalogReadOutcome =
  | { readonly kind: "loaded"; readonly data: CatalogData }
  | { readonly kind: "failed" | "cancelled" | "session-expired" };

export type CatalogWriteOutcome =
  | { readonly kind: "confirmed" | "unknown" | "session-expired" }
  | { readonly kind: "rejected"; readonly message: string };

export interface CatalogPendingCommand {
  readonly command: CatalogCommand;
  readonly phase: "sending" | "unknown";
  readonly checked: boolean;
}

export interface CatalogItemIdentity {
  readonly kind: "product" | "option";
  readonly id: string;
}

export interface CatalogListGroup {
  readonly id: string;
  readonly name: string;
  readonly countLabel: string;
  readonly items: readonly (CatalogItemIdentity & {
    readonly name: string;
    readonly priceLabel: string;
  })[];
}

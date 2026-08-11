import type { CatalogStoreState } from "./catalog.types";

export const productTypes = ["DRINK", "OTHER"] as const;

export const productSizes = ["S", "M", "L"] as const;

export const modifierSelectionTypes = ["single", "multiple"] as const;

export const catalogStoreId = "catalog";

export const catalogStatuses = {
  error: "error",
  idle: "idle",
  loading: "loading",
  ready: "ready",
} as const;

export const catalogStoreMessages = {
  dependenciesNotConfigured: "Зависимости каталога не настроены.",
  requestFailed: "Не удалось выполнить действие с каталогом.",
} as const;

export const initialCatalogStoreState: CatalogStoreState = {
  activeOperation: null,
  categories: [],
  categoryModifierGroupAssignments: [],
  error: null,
  fieldErrors: {},
  lastCommandSucceeded: false,
  modifierGroups: [],
  products: [],
  status: catalogStatuses.idle,
};

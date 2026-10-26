import type { CatalogContext } from "./catalog.types";

export interface CatalogPageProps {
  readonly context: CatalogContext;
}

export interface CatalogPageEmits {
  sessionExpired: [];
}

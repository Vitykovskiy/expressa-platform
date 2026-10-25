import type { CatalogContext } from "../../entities/catalog/catalog.types";

export interface CatalogPageProps {
  readonly context: CatalogContext;
}

export interface CatalogPageEmits {
  sessionExpired: [];
}

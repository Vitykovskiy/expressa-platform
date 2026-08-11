import { CatalogApi } from "../../../shared/api/catalog.api";
import { createApiClient } from "../../../shared/api/client";
import { catalogStoreMessages } from "./catalog.constants";
import type { CatalogStoreDependencies } from "./catalog.types";

let dependencies: CatalogStoreDependencies | undefined = {
  catalogApi: new CatalogApi(createApiClient("/")),
};

export function getCatalogStoreDependencies(): CatalogStoreDependencies {
  if (dependencies === undefined) {
    throw new Error(catalogStoreMessages.dependenciesNotConfigured);
  }

  return dependencies;
}

export function setCatalogStoreDependencies(
  nextDependencies: CatalogStoreDependencies,
): void {
  dependencies = nextDependencies;
}

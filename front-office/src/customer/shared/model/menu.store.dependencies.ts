import { createPublicMenuApi } from "../../../shared/api/public-menu.api";
import type { ApiClient } from "../../../shared/api/client";
import { menuMessages } from "./menu.store.constants";
import type { MenuStoreDependencies } from "./menu.store.types";

let dependencies: MenuStoreDependencies | undefined;

export function configureMenuStoreDependencies(apiClient: ApiClient): void {
  dependencies = { publicMenuApi: createPublicMenuApi(apiClient) };
}

export function getMenuStoreDependencies(): MenuStoreDependencies {
  if (dependencies === undefined) {
    throw new Error(menuMessages.dependenciesNotConfigured);
  }

  return dependencies;
}

export function setMenuStoreDependencies(
  nextDependencies: MenuStoreDependencies,
): void {
  dependencies = nextDependencies;
}

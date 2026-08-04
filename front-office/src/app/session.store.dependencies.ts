import { createAuthApi } from "../shared/api/auth.api";
import type { ApiClient } from "../shared/api/client";
import { sessionMessages } from "./session.store.constants";
import type { SessionDependencies } from "./session.store.types";

let dependencies: SessionDependencies | undefined;

export function configureSessionDependencies(apiClient: ApiClient): void {
  dependencies = {
    authApi: createAuthApi(apiClient),
    now: Date.now,
  };
}

export function getSessionDependencies(): SessionDependencies {
  if (dependencies === undefined) {
    throw new Error(sessionMessages.dependenciesNotConfigured);
  }

  return dependencies;
}

export function setSessionDependencies(
  nextDependencies: SessionDependencies,
): void {
  dependencies = nextDependencies;
}

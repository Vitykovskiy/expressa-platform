import { AuthApi } from "../shared/api/auth.api";
import { createApiClient } from "../shared/api/client";
import type { ApiClient } from "../shared/api/client";
import type { SessionStoreDependencies } from "./session.store.types";

const sessionStoreDependencies: SessionStoreDependencies = {
  authApi: new AuthApi(createApiClient("/")),
};

export function getSessionStoreDependencies(): SessionStoreDependencies {
  return sessionStoreDependencies;
}

export function setSessionStoreDependencies(
  dependencies: SessionStoreDependencies,
): void {
  Object.assign(sessionStoreDependencies, dependencies);
}

export function createSessionStoreDependencies(
  client: ApiClient,
): SessionStoreDependencies {
  return { authApi: new AuthApi(client) };
}

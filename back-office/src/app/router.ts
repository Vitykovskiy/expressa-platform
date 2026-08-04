import { createRouter, createWebHistory } from "vue-router";

import { createNavigationItems } from "./navigation";
import { backOfficeRoutes, routePaths } from "./router.constants";
import { useSessionStore } from "./session.store";
import type { BackOfficeRole } from "./navigation.types";
import type { CreateBackOfficeRouterOptions } from "./router.types";

export { backOfficeRoutes as routes } from "./router.constants";

export function createBackOfficeRouter(
  options: CreateBackOfficeRouterOptions = {},
) {
  const router = createRouter({
    history: options.history ?? createWebHistory(),
    routes: [...backOfficeRoutes],
  });

  router.beforeEach(async (to) => {
    const sessionStore = useSessionStore();

    if (sessionStore.status === "unknown") {
      await sessionStore.restore();
    }

    const defaultPath = getDefaultPath(sessionStore.currentUser?.role ?? null);

    if (sessionStore.status === "authenticated") {
      if (to.path === routePaths.login) return defaultPath;
      if (
        to.meta.requiresStaff &&
        !to.meta.allowedRoles?.includes(sessionStore.currentUser!.role)
      ) {
        return defaultPath;
      }
      return true;
    }

    if (to.meta.requiresStaff) return routePaths.login;
    return true;
  });

  return router;
}

export const router = createBackOfficeRouter();

function getDefaultPath(role: BackOfficeRole | null): string {
  return createNavigationItems(role)[0]?.path ?? routePaths.login;
}

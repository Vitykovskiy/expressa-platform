import { defineStore } from "pinia";

import {
  initialMenuState,
  menuMessages,
  menuStatuses,
  menuStoreId,
} from "./menu.store.constants";
import { getMenuStoreDependencies } from "./menu.store.dependencies";
import type { MenuState } from "./menu.store.types";

export const useMenuStore = defineStore(menuStoreId, {
  state: (): MenuState => ({ ...initialMenuState }),
  actions: {
    load(): Promise<void> {
      if (this.loadPromise !== null) {
        return this.loadPromise;
      }

      if (this.status === menuStatuses.ready) {
        return Promise.resolve();
      }

      this.status = menuStatuses.loading;
      this.errorMessage = null;
      this.menu = null;

      const loadPromise = getMenuStoreDependencies()
        .publicMenuApi.getMenu()
        .then((menu) => {
          this.menu = menu;
          this.status = menuStatuses.ready;
        })
        .catch((error: unknown) => {
          this.errorMessage = getErrorMessage(error);
          this.status = menuStatuses.error;
        })
        .finally(() => {
          this.loadPromise = null;
        });

      this.loadPromise = loadPromise;

      return loadPromise;
    },
  },
});

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : menuMessages.loadFailed;
}

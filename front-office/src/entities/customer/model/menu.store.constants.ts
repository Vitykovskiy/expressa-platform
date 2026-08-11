import type { MenuState } from "./menu.store.types";

export const menuStatuses = {
  error: "error",
  idle: "idle",
  loading: "loading",
  ready: "ready",
} as const;

export const menuStoreId = "menu";

export const menuMessages = {
  dependenciesNotConfigured: "Зависимости меню не настроены.",
  loadFailed: "Не удалось загрузить меню.",
} as const;

export const initialMenuState: MenuState = {
  errorMessage: null,
  loadPromise: null,
  menu: null,
  status: menuStatuses.idle,
};

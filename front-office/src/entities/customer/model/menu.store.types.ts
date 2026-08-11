import type { PublicMenu, PublicMenuApi } from "@/shared/api/public-menu.api";

export type MenuStatus = "idle" | "loading" | "ready" | "error";

export type MenuState = {
  errorMessage: string | null;
  loadPromise: Promise<void> | null;
  menu: PublicMenu | null;
  status: MenuStatus;
};

export type MenuStoreDependencies = {
  publicMenuApi: PublicMenuApi;
};

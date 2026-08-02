import { createRouter, createWebHistory } from "vue-router";
import type { RouteRecordRaw } from "vue-router";

import AvailabilityPage from "../pages/AvailabilityPage.vue";
import LoginPage from "../pages/LoginPage.vue";
import MenuPage from "../pages/MenuPage.vue";
import QueuePage from "../pages/QueuePage.vue";

declare module "vue-router" {
  interface RouteMeta {
    title: string;
  }
}

export const routes: readonly RouteRecordRaw[] = [
  { path: "/", redirect: "/queue", meta: { title: "Expressa back-office" } },
  { path: "/login", component: LoginPage, meta: { title: "Вход" } },
  { path: "/queue", component: QueuePage, meta: { title: "Очередь" } },
  {
    path: "/availability",
    component: AvailabilityPage,
    meta: { title: "Доступность" },
  },
  { path: "/menu", component: MenuPage, meta: { title: "Меню" } },
];

export function createBackOfficeRouter() {
  const router = createRouter({
    history: createWebHistory(),
    routes: [...routes],
  });

  return router;
}

export const router = createBackOfficeRouter();

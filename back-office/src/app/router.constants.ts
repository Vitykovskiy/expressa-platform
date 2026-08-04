import type { RouteRecordRaw } from "vue-router";

import AvailabilityPage from "../pages/AvailabilityPage.vue";
import LoginPage from "../pages/LoginPage.vue";
import MenuPage from "../pages/MenuPage.vue";
import QueuePage from "../pages/QueuePage.vue";
import { navigationDefinitions } from "./navigation.constants";

export const routePaths = {
  availability: navigationDefinitions.availability.path,
  login: "/login",
  menu: navigationDefinitions.menu.path,
  queue: navigationDefinitions.queue.path,
} as const;

export const routeTitles = {
  login: "Вход",
  root: "Expressa back-office",
} as const;

export const backOfficeRoutes = [
  {
    path: "/",
    redirect: navigationDefinitions.queue.path,
    meta: { title: routeTitles.root },
  },
  {
    path: routePaths.login,
    component: LoginPage,
    meta: { title: routeTitles.login },
  },
  {
    path: navigationDefinitions.queue.path,
    component: QueuePage,
    meta: {
      allowedRoles: navigationDefinitions.queue.roles,
      requiresStaff: true,
      section: navigationDefinitions.queue.section,
      title: navigationDefinitions.queue.label,
    },
  },
  {
    path: navigationDefinitions.availability.path,
    component: AvailabilityPage,
    meta: {
      allowedRoles: navigationDefinitions.availability.roles,
      requiresStaff: true,
      section: navigationDefinitions.availability.section,
      title: navigationDefinitions.availability.label,
    },
  },
  {
    path: navigationDefinitions.menu.path,
    component: MenuPage,
    meta: {
      allowedRoles: navigationDefinitions.menu.roles,
      requiresStaff: true,
      section: navigationDefinitions.menu.section,
      title: navigationDefinitions.menu.label,
    },
  },
] satisfies readonly RouteRecordRaw[];

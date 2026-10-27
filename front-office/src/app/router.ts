import { createRouter, createWebHistory } from "vue-router";

import AuthCodePage from "../pages/AuthCodePage.vue";
import AuthPhonePage from "../pages/AuthPhonePage.vue";
import AuthNamePage from "../pages/AuthNamePage.vue";
import CartPage from "../pages/CartPage.vue";
import MenuPage from "../pages/MenuPage.vue";
import OrderPage from "../pages/OrderPage.vue";
import OrdersPage from "../pages/OrdersPage.vue";
import { routePaths } from "@/shared/config/customer-routes.constants";
import { getSessionDependencies } from "./session.store.dependencies";
import { useSessionStore } from "./session.store";
import { getSafeAuthReturnTo } from "../shared/lib/auth-return";
import type { CustomerNavigationGuard } from "./router.types";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", component: MenuPage, meta: { title: "Меню" } },
    { path: "/cart", component: CartPage, meta: { title: "Корзина" } },
    {
      path: "/auth/phone",
      component: AuthPhonePage,
      meta: { title: "Вход по телефону" },
    },
    {
      path: "/auth/code",
      component: AuthCodePage,
      meta: { title: "Подтверждение кода" },
    },
    {
      path: "/auth/name",
      component: AuthNamePage,
      meta: { requiresCustomer: true, title: "Ваше имя" },
    },
    {
      path: "/orders/:id",
      component: OrderPage,
      meta: { requiresCustomer: true, title: "Заказ" },
    },
    {
      path: "/orders",
      component: OrdersPage,
      meta: { requiresCustomer: true, title: "История заказов" },
    },
  ],
});

export const customerNavigationGuard: CustomerNavigationGuard = async (to) => {
  const sessionStore = useSessionStore();
  const destinationPath = to.matched.at(-1)?.path ?? to.path;
  const isAuthDestination =
    destinationPath === routePaths.authPhone ||
    destinationPath === routePaths.authCode ||
    destinationPath === routePaths.authName;
  const needsRegistration =
    isAuthDestination ||
    destinationPath === "/cart" ||
    to.meta.requiresCustomer;
  if (needsRegistration && sessionStore.status === "unknown") {
    await sessionStore.bootstrap();
  }

  if (
    sessionStore.status === "authenticated" &&
    sessionStore.currentUser !== null
  ) {
    if (sessionStore.needsCustomerRegistration) {
      if (needsRegistration && destinationPath !== routePaths.authName) {
        const returnTo = isAuthDestination
          ? getSafeAuthReturnTo(to.query.returnTo)
          : to.fullPath;
        return {
          path: routePaths.authName,
          query: returnTo === undefined ? {} : { returnTo },
        };
      }
    } else if (isAuthDestination) {
      return getSafeAuthReturnTo(to.query.returnTo) ?? routePaths.home;
    }
  }

  if (
    destinationPath === routePaths.authName &&
    sessionStore.status === "anonymous"
  ) {
    const returnTo = getSafeAuthReturnTo(to.query.returnTo);
    return {
      path: routePaths.authPhone,
      query: returnTo === undefined ? {} : { returnTo },
    };
  }

  if (
    destinationPath === routePaths.authCode &&
    (sessionStore.pendingPhone === null ||
      sessionStore.otpExpiresAt === null ||
      getSessionDependencies().now() >= sessionStore.otpExpiresAt)
  ) {
    const returnTo = getSafeAuthReturnTo(to.query.returnTo);

    return {
      path: routePaths.authPhone,
      query: returnTo === undefined ? {} : { returnTo },
    };
  }
  if (!to.meta.requiresCustomer) {
    return true;
  }
  if (sessionStore.status === "authenticated") {
    return true;
  }
  if (sessionStore.status === "unknown") {
    return true;
  }

  return { path: routePaths.authPhone, query: { returnTo: to.fullPath } };
};

router.beforeEach(customerNavigationGuard);

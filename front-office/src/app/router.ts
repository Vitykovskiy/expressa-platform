import { createRouter, createWebHistory } from "vue-router";

import AuthCodePage from "../pages/AuthCodePage.vue";
import AuthPhonePage from "../pages/AuthPhonePage.vue";
import CartPage from "../pages/CartPage.vue";
import MenuPage from "../pages/MenuPage.vue";
import OrderPage from "../pages/OrderPage.vue";
import OrdersPage from "../pages/OrdersPage.vue";

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
    { path: "/orders/:id", component: OrderPage, meta: { title: "Заказ" } },
    {
      path: "/orders",
      component: OrdersPage,
      meta: { title: "История заказов" },
    },
  ],
});

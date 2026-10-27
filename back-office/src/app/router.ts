import { createRouter, createWebHistory } from "vue-router";
import OrdersRoute from "../modules/orders/OrdersRoute.vue";
import AvailabilityPage from "../modules/availability/AvailabilityPage.vue";
import CatalogPage from "../modules/catalog/CatalogPage.vue";
import UsersRoute from "../modules/users/UsersRoute.vue";
import SettingsRoute from "../modules/settings/SettingsRoute.vue";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      redirect: (to) => {
        const query = { ...to.query };

        delete query.section;

        return { name: "orders", query, hash: to.hash };
      },
    },
    {
      path: "/orders",
      name: "orders",
      component: OrdersRoute,
      meta: { title: "Заказы", administratorOnly: false },
    },
    {
      path: "/availability",
      name: "availability",
      component: AvailabilityPage,
      meta: { title: "Доступность", administratorOnly: false },
    },
    {
      path: "/catalog",
      name: "catalog",
      component: CatalogPage,
      meta: { title: "Меню", administratorOnly: true },
    },
    {
      path: "/users",
      name: "users",
      component: UsersRoute,
      meta: { title: "Пользователи", administratorOnly: true },
    },
    {
      path: "/settings",
      name: "settings",
      component: SettingsRoute,
      meta: { title: "Настройки", administratorOnly: true },
    },
    {
      path: "/:pathMatch(.*)*",
      redirect: { name: "orders", query: {}, hash: "" },
    },
  ],
});

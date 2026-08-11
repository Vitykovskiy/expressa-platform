import type { Meta, StoryObj } from "@storybook/vue3-vite";

import AuthCodePage from "@/pages/AuthCodePage.vue";
import AuthPhonePage from "@/pages/AuthPhonePage.vue";
import CartPage from "@/pages/CartPage.vue";
import MenuPage from "@/pages/MenuPage.vue";
import OrderPage from "@/pages/OrderPage.vue";
import OrdersPage from "@/pages/OrdersPage.vue";

const meta = {
  title: "Pages/Routes",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

function routeStory(component: typeof MenuPage): Story {
  return {
    render: () => ({ components: { Page: component }, template: "<Page />" }),
  };
}

export const Menu = routeStory(MenuPage);
export const Cart = routeStory(CartPage);
export const AuthPhone = routeStory(AuthPhonePage);
export const AuthCode = routeStory(AuthCodePage);
export const Order = routeStory(OrderPage);
export const Orders = routeStory(OrdersPage);

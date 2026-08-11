import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, within } from "storybook/test";

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

function routeStory(component: typeof MenuPage, title: string): Story {
  return {
    render: () => ({ components: { Page: component }, template: "<Page />" }),
    play: async ({ canvasElement }) => {
      await expect(
        within(canvasElement).getByRole("heading", { level: 1 }),
      ).toHaveTextContent(title);
    },
  };
}

export const Menu = routeStory(MenuPage, "Меню");
export const Cart = routeStory(CartPage, "Корзина");
export const AuthPhone = routeStory(AuthPhonePage, "Вход по телефону");
export const AuthCode = routeStory(AuthCodePage, "Подтверждение кода");
export const Order = routeStory(OrderPage, "Заказ");
export const Orders = routeStory(OrdersPage, "История заказов");

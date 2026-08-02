import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, userEvent, within } from "storybook/test";
import { shallowRef } from "vue";

import AppHeader from "../../../components/domain-ui/Navigation/AppHeader.vue";
import BottomActionBar from "../../../components/domain-ui/Navigation/BottomActionBar.vue";
import CategoryNavigation from "../../../components/domain-ui/Navigation/CategoryNavigation.vue";

const meta = {
  title: "Navigation/Catalog",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: { viewport: { defaultViewport: "mobile320" } },
  render: () => ({
    components: { AppHeader, BottomActionBar, CategoryNavigation },
    setup() {
      const selectedCategory = shallowRef("coffee");
      const categories = [
        { id: "coffee", title: "Кофе" },
        { id: "tea", title: "Чай" },
        { id: "desserts", title: "Десерты" },
      ];

      return { categories, selectedCategory };
    },
    template: `
      <AppHeader title="Expressa" :cart-count="2" />
      <CategoryNavigation v-model="selectedCategory" :categories="categories" />
      <BottomActionBar label="В корзине 2 товара" detail="498 ₽" />
    `,
  }),
};

export const Disabled: Story = {
  parameters: { viewport: { defaultViewport: "mobile390" } },
  render: () => ({
    components: { BottomActionBar },
    template: `<BottomActionBar label="Корзина пуста" :disabled="true" />`,
  }),
};

export const LongContent: Story = {
  parameters: { viewport: { defaultViewport: "tablet768" } },
  render: () => ({
    components: { BottomActionBar, CategoryNavigation },
    setup() {
      const selectedCategory = shallowRef("seasonal");
      const categories = [
        {
          id: "seasonal",
          title: "Сезонные напитки с очень длинным названием категории",
        },
      ];

      return { categories, selectedCategory };
    },
    template: `
      <CategoryNavigation v-model="selectedCategory" :categories="categories" />
      <BottomActionBar
        label="В корзине напиток с очень длинным названием и дополнительными параметрами"
        detail="12 499 ₽"
      />
    `,
  }),
};

export const KeyboardFocus: Story = {
  render: () => ({
    components: { AppHeader, BottomActionBar, CategoryNavigation },
    setup() {
      const selectedCategory = shallowRef("coffee");
      const categories = [
        { id: "coffee", title: "Кофе" },
        { id: "tea", title: "Чай" },
      ];

      return { categories, selectedCategory };
    },
    template: `
      <AppHeader />
      <CategoryNavigation v-model="selectedCategory" :categories="categories" />
      <BottomActionBar label="Продолжить заказ" />
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.tab();
    await expect(
      canvas.getByRole("button", { name: "Открыть меню" }),
    ).toHaveFocus();
    await userEvent.tab();
    await expect(
      canvas.getByRole("button", { name: "Корзина: 0" }),
    ).toHaveFocus();
    await userEvent.tab();
    await expect(canvas.getByRole("button", { name: "Кофе" })).toHaveFocus();
    await userEvent.tab();
    await expect(canvas.getByRole("button", { name: "Чай" })).toHaveFocus();
    await userEvent.tab();
    await expect(
      canvas.getByRole("button", { name: "Продолжить" }),
    ).toHaveFocus();
  },
};

import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, userEvent, within } from "storybook/test";
import { ref } from "vue";
import MenuPage from "../../components/compositions/MenuPage.vue";

const categories = [
  { id: "coffee", name: "Кофе", active: true, archived: false },
];
const products = [
  { id: "latte", name: "Латте", active: true, archived: false },
];
const meta = {
  title: "Compositions/MenuPage",
  component: MenuPage,
} satisfies Meta<typeof MenuPage>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Navigation: Story = {
  args: { categories, products },
  parameters: { viewport: { defaultViewport: "tablet768" } },
  render: () => ({
    components: { MenuPage },
    setup: () => ({
      categories,
      products,
      opened: ref(""),
      openCategory: (id: string) => "category " + id,
      openProduct: (id: string) => "product " + id,
    }),
    template: `<MenuPage :categories="categories" :products="products" @open-category="opened=openCategory($event)" @open-product="opened=openProduct($event)"/><p role="status">{{ opened }}</p>`,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.tab();
    await expect(canvas.getByRole("button", { name: /Кофе/ })).toHaveFocus();
    await userEvent.click(canvas.getByRole("button", { name: /Кофе/ }));
    await expect(canvas.getByText("category coffee")).toBeVisible();
    await expect(canvasElement.scrollWidth).toBeLessThanOrEqual(
      canvasElement.clientWidth,
    );
  },
};
export const Empty: Story = {
  args: { categories: [], products: [] },
  parameters: { viewport: { defaultViewport: "workspace" } },
};
export const Loading: Story = { args: { categories, products, loading: true } };
export const Error: Story = {
  args: { categories, products, error: "Не удалось загрузить меню" },
  parameters: { viewport: { defaultViewport: "wide" } },
};

import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, userEvent, within } from "storybook/test";
import { shallowRef } from "vue";

import HistoryPage from "../../components/compositions/HistoryPage.vue";

const meta = {
  title: "Compositions/HistoryPage",
  component: HistoryPage,
} satisfies Meta<typeof HistoryPage>;
export default meta;
type Story = StoryObj<typeof meta>;
const orders = [
  {
    number: "#101",
    date: "Сегодня, 12:30",
    stage: "ISSUED" as const,
    total: 498,
  },
  {
    number: "#100",
    date: "Вчера, 09:15",
    stage: "ISSUED" as const,
    total: 249,
  },
  { number: "#99", date: "30 июля", stage: "READY" as const, total: 319 },
];
export const ReadyAndPagination: Story = {
  args: { orders, hasNextPage: true },
  render: () => ({
    components: { HistoryPage },
    setup() {
      const displayedOrders = shallowRef(orders.slice(0, 2));
      const hasNextPage = shallowRef(true);
      function nextPage(): void {
        displayedOrders.value = orders;
        hasNextPage.value = false;
      }
      return { displayedOrders, hasNextPage, nextPage };
    },
    template: `<HistoryPage :orders="displayedOrders" :has-next-page="hasNextPage" @next-page="nextPage" />`,
  }),
  parameters: { viewport: { defaultViewport: "mobile390" } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getAllByRole("button", { name: "Повторить" })[0],
    );
    await expect(
      canvas.getByRole("heading", { name: "Все позиции доступны" }),
    ).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Показать ещё" }));
    await expect(canvas.getByText("Заказ #99")).toBeVisible();
    await expect(
      canvas.queryByRole("button", { name: "Показать ещё" }),
    ).toBeNull();
  },
};
export const Loading: Story = {
  args: { orders: [], state: "loading" },
  parameters: { viewport: { defaultViewport: "mobile320" } },
};
export const Empty: Story = { args: { orders: [] } };
export const Error: Story = { args: { orders: [], state: "error" } };
export const PartialRepeat: Story = {
  args: { orders: [orders[1]] },
  parameters: { viewport: { defaultViewport: "tablet768" } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Повторить" }));
    await expect(
      canvas.getByRole("heading", { name: "Часть позиций недоступна" }),
    ).toBeVisible();
  },
};
export const UnavailableRepeat: Story = {
  args: { orders: [{ ...orders[1], number: "#99" }] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Повторить" }));
    await expect(
      canvas.getByRole("heading", { name: "Повторить нечего" }),
    ).toBeVisible();
    await expect(
      canvas.queryByRole("button", { name: "Подтвердить замену корзины" }),
    ).toBeNull();
  },
};

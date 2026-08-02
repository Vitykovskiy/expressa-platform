import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, userEvent, within } from "storybook/test";
import { ref } from "vue";
import OrderDetailsView from "../../components/compositions/OrderDetailsView.vue";
import OrdersPage from "../../components/compositions/OrdersPage.vue";

const orders = [
  {
    id: "1048",
    number: "1048",
    createdAt: "10:01",
    total: 780,
    status: "created" as const,
  },
  {
    id: "1047",
    number: "1047",
    createdAt: "10:02",
    total: 360,
    status: "preparing" as const,
  },
  {
    id: "1046",
    number: "1046",
    createdAt: "10:03",
    total: 510,
    status: "ready" as const,
  },
];
const meta = {
  title: "Compositions/OrdersPage",
  component: OrdersPage,
  parameters: { viewport: { defaultViewport: "width1280" } },
} satisfies Meta<typeof OrdersPage>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Working: Story = {
  args: { orders },
  parameters: { viewport: { defaultViewport: "tablet768" } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.tab();
    await expect(
      canvas.getByRole("combobox", { name: "Стадия" }),
    ).toHaveFocus();
    await userEvent.selectOptions(
      canvas.getByRole("combobox", { name: "Стадия" }),
      "ready",
    );
    await expect(canvas.getByRole("button", { name: /1046/ })).toBeVisible();
    await expect(canvasElement.scrollWidth).toBeLessThanOrEqual(
      canvasElement.clientWidth,
    );
    await userEvent.type(
      canvas.getByRole("searchbox", { name: "Номер" }),
      "1046",
    );
    await expect(canvas.getByRole("button", { name: /1046/ })).toBeVisible();
  },
};
export const Empty: Story = {
  args: { orders: [] },
  parameters: { viewport: { defaultViewport: "workspace" } },
};
export const Single: Story = {
  args: { orders: orders.slice(0, 1) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button", { name: /1048/ })).toBeVisible();
  },
};
export const Dense: Story = {
  args: {
    orders: [
      ...orders,
      ...orders.map((order) => ({
        ...order,
        id: `dense-${order.id}`,
        number: `9${order.number}`,
      })),
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getAllByRole("button", { name: /Заказ №/ }),
    ).toHaveLength(6);
  },
};
export const Loading: Story = { args: { orders, loading: true } };
export const Error: Story = {
  args: { orders, error: "Нет соединения" },
  parameters: { viewport: { defaultViewport: "wide" } },
};
export const FullDetails: Story = {
  args: { orders },
  render: () => ({
    components: { OrderDetailsView },
    setup: () => ({
      status: ref("created"),
      order: {
        number: "1048",
        customer: "Анна",
        createdAt: "10:01",
        total: 780,
        status: "created" as const,
        snapshot: [
          {
            id: "1",
            name: "Капучино S, овсяное молоко",
            quantity: 1,
            price: 320,
          },
        ],
        events: [],
      },
    }),
    template: `<OrderDetailsView :order="{...order, status}" @advance="status=$event"/>`,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Принять" }));
    await expect(
      canvas.getByRole("button", { name: "Начать готовить" }),
    ).toBeVisible();
  },
};

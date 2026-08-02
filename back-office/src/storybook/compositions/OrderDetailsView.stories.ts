import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, userEvent, within } from "storybook/test";
import { ref } from "vue";
import OrderDetailsView from "../../components/compositions/OrderDetailsView.vue";

const order = {
  number: "1048",
  customer: "Анна",
  createdAt: "10:01",
  total: 780,
  status: "created" as const,
  snapshot: [
    { id: "line", name: "Капучино S, овсяное молоко", quantity: 1, price: 320 },
  ],
  events: [],
};
const meta = {
  title: "Compositions/OrderDetailsView",
  component: OrderDetailsView,
} satisfies Meta<typeof OrderDetailsView>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Working: Story = {
  args: { order },
  parameters: { viewport: { defaultViewport: "tablet768" } },
};
export const StageFlow: Story = {
  args: { order },
  parameters: { viewport: { defaultViewport: "workspace" } },
  render: () => ({
    components: { OrderDetailsView },
    setup: () => ({ status: ref("created") }),
    template: `<OrderDetailsView :order="{...order, status}" @advance="status=$event"/>`,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Принять" }));
    await expect(
      canvas.getByRole("button", { name: "Начать готовить" }),
    ).toBeVisible();
    await expect(canvasElement.scrollWidth).toBeLessThanOrEqual(
      canvasElement.clientWidth,
    );
  },
};
export const Loading: Story = { args: { loading: true } };
export const Empty: Story = { args: {} };
export const Error: Story = {
  args: { error: "Не удалось загрузить заказ" },
  parameters: { viewport: { defaultViewport: "wide" } },
};

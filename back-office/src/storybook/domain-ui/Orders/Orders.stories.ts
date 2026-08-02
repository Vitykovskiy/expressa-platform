import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, userEvent, within } from "storybook/test";
import { ref } from "vue";
import OrderActionBar from "../../../components/domain-ui/Orders/OrderActionBar.vue";
import OrderDetailsPanel from "../../../components/domain-ui/Orders/OrderDetailsPanel.vue";
import OrderQueueList from "../../../components/domain-ui/Orders/OrderQueueList.vue";

const backOfficeViewports = {
  narrow479: {
    name: "479 px",
    styles: { width: "479px", height: "900px" },
    type: "mobile",
  },
  mobile480: {
    name: "480 px",
    styles: { width: "480px", height: "900px" },
    type: "mobile",
  },
  tablet767: {
    name: "767 px",
    styles: { width: "767px", height: "900px" },
    type: "tablet",
  },
  tablet768: {
    name: "768 px",
    styles: { width: "768px", height: "900px" },
    type: "tablet",
  },
  desktop1023: {
    name: "1023 px",
    styles: { width: "1023px", height: "900px" },
    type: "desktop",
  },
  desktop1024: {
    name: "1024 px",
    styles: { width: "1024px", height: "900px" },
    type: "desktop",
  },
  workspace: {
    name: "1280 px",
    styles: { width: "1280px", height: "900px" },
    type: "desktop",
  },
  wide: {
    name: "1440 px",
    styles: { width: "1440px", height: "900px" },
    type: "desktop",
  },
};
const meta = {
  title: "Orders/Canonical",
  component: OrderQueueList,
  parameters: {
    viewport: { defaultViewport: "workspace", viewports: backOfficeViewports },
  },
} satisfies Meta<typeof OrderQueueList>;
export default meta;
type Story = StoryObj;
const orders = [
  {
    id: "1",
    number: "1048",
    createdAt: "2026-08-02 10:01",
    total: 780,
    status: "created" as const,
  },
  {
    id: "accepted",
    number: "1047",
    createdAt: "2026-08-02 10:00",
    total: 360,
    status: "accepted" as const,
  },
  {
    id: "preparing",
    number: "1046",
    createdAt: "2026-08-02 09:59",
    total: 510,
    status: "preparing" as const,
  },
  {
    id: "2",
    number: "1049",
    createdAt: "2026-08-02 10:02",
    total: 420,
    status: "ready" as const,
  },
  {
    id: "3",
    number: "1050",
    createdAt: "2026-08-02 10:03",
    total: 280,
    status: "issued" as const,
  },
];
export const QueueStagesAndDetails: Story = {
  render: () => ({
    components: { OrderQueueList, OrderDetailsPanel, OrderActionBar },
    setup() {
      const status = ref<
        "created" | "accepted" | "preparing" | "ready" | "issued"
      >("created");
      return {
        orders,
        status,
        opened: ref(""),
        advance: (value: typeof status.value) => (status.value = value),
        detail: {
          number: "1048",
          customer: "Анна",
          createdAt: "10:01",
          total: 780,
          status: "created" as const,
          snapshot: [
            {
              id: "line",
              name: "Капучино S, овсяное молоко (снимок на момент оформления)",
              quantity: 1,
              price: 320,
            },
            {
              id: "line2",
              name: "Длинный состав: сироп ваниль, корица, двойной эспрессо",
              quantity: 1,
              price: 460,
            },
          ],
          events: [
            {
              id: "event",
              from: "created" as const,
              to: "accepted" as const,
              author: "Мария",
              at: "10:02",
            },
          ],
        },
      };
    },
    template: `<section><h1>Очередь заказов</h1><OrderQueueList :orders="orders" @open="opened=$event"/><p v-if="opened" role="status">Открыты детали заказа {{ opened }}</p><OrderDetailsPanel :order="detail"/><OrderActionBar :status="status" @advance="advance"/></section>`,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.tab();
    await expect(
      canvas.getByRole("combobox", { name: "Стадия" }),
    ).toHaveFocus();
    await userEvent.tab();
    await expect(
      canvas.getByRole("searchbox", { name: "Номер" }),
    ).toHaveFocus();
    await userEvent.tab();
    const queueButtons = canvas
      .getAllByRole("button")
      .filter((button) => button.textContent?.includes("Заказ №"));
    await expect(queueButtons[0]).toHaveAccessibleName(/Заказ №1046/);
    await userEvent.keyboard("{Enter}");
    await expect(
      canvas.getByText("Открыты детали заказа preparing"),
    ).toBeVisible();
    const card = canvas.getAllByRole("button", { name: /Заказ №1048/ })[0];
    await userEvent.click(card);
    await expect(canvas.getByText("Открыты детали заказа 1")).toBeVisible();
    const stageFilter = canvas.getByRole("combobox", { name: "Стадия" });
    await userEvent.selectOptions(stageFilter, "ready");
    await expect(
      canvas.getByRole("button", { name: /Заказ №1049/ }),
    ).toBeVisible();
    await expect(
      canvas.queryByRole("button", { name: /Заказ №1048/ }),
    ).toBeNull();
    await userEvent.selectOptions(stageFilter, "all");
    const search = canvas.getByRole("searchbox", { name: "Номер" });
    await userEvent.type(search, "1048");
    await expect(
      canvas.getByRole("button", { name: /Заказ №1048/ }),
    ).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Принять" }));
    await expect(
      canvas.getByRole("button", { name: "Начать готовить" }),
    ).toBeVisible();
    await userEvent.click(
      canvas.getByRole("button", { name: "Начать готовить" }),
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Отметить готовым" }),
    );
    await userEvent.click(canvas.getByRole("button", { name: "Выдать" }));
    await expect(canvas.getByText("Заказ выдан. Действий нет.")).toBeVisible();
  },
};
export const Empty: Story = {
  render: () => ({
    components: { OrderQueueList },
    setup: () => ({ empty: [] }),
    template: `<OrderQueueList :orders="empty"/>`,
  }),
};
export const Single: Story = {
  render: () => ({
    components: { OrderQueueList },
    setup: () => ({ orders: orders.slice(0, 1) }),
    template: `<OrderQueueList :orders="orders"/>`,
  }),
};
export const Dense: Story = {
  render: () => ({
    components: { OrderQueueList },
    setup: () => ({
      orders: [
        ...orders,
        ...orders.map((order) => ({
          ...order,
          id: `dense-${order.id}`,
          number: `${order.number}1`,
        })),
      ],
    }),
    template: `<OrderQueueList :orders="orders"/>`,
  }),
};
export const LoadingAndError: Story = {
  render: () => ({
    components: { OrderQueueList },
    setup: () => ({ orders }),
    template: `<section><OrderQueueList :orders="orders" loading/><OrderQueueList :orders="orders" error="Нет соединения"/></section>`,
  }),
};

import type { Meta, StoryObj } from "@storybook/vue3-vite";

import OrdersScreen from "../../../../src/pages/admin/orders/OrdersScreen.vue";

const orders = [
  {
    id: "1",
    number: "20300102-001",
    createdAt: "2030-01-02T10:00:00.000Z",
    totalMinor: 38000,
    stage: "CREATED" as const,
  },
  {
    id: "2",
    number: "20300102-002",
    createdAt: "2030-01-02T10:10:00.000Z",
    totalMinor: 45000,
    stage: "PREPARING" as const,
  },
  {
    id: "3",
    number: "20300102-003",
    createdAt: "2030-01-02T10:20:00.000Z",
    totalMinor: 28000,
    stage: "READY" as const,
  },
];

const meta = {
  title: "Admin/Orders/Screen",
  component: OrdersScreen,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof OrdersScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

const args = {
  actionError: null,
  details: null,
  detailsLoading: false,
  error: null,
  orders,
  search: "",
  selectedOrderId: null,
  stage: "ALL" as const,
  status: "ready" as const,
  transitionLoading: false,
};

export const Queue768: Story = {
  args,
  parameters: { viewport: { defaultViewport: "tablet768" } },
};
export const Queue1280: Story = {
  args,
  parameters: { viewport: { defaultViewport: "workspace" } },
};
export const Queue1440: Story = {
  args,
  parameters: { viewport: { defaultViewport: "wide" } },
};
export const Loading: Story = {
  args: { ...args, orders: [], status: "loading" },
};
export const Empty: Story = { args: { ...args, orders: [] } };
export const Error: Story = {
  args: {
    ...args,
    orders: [],
    status: "error",
    error: {
      code: "ACCESS_DENIED",
      details: null,
      message: "Нет доступа к очереди.",
      requestId: "request-123",
    },
  },
};
export const ActionError: Story = {
  args: {
    ...args,
    actionError: {
      code: "ORDER_STAGE_CONFLICT",
      details: null,
      message: "Стадия заказа уже изменилась.",
      requestId: "request-456",
    },
  },
};

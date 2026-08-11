import type { Meta, StoryObj } from "@storybook/vue3-vite";

import type { Order } from "../../../../src/shared/ui/admin/Admin.types";
import OrdersScreen from "../../../../src/pages/admin/orders/OrdersScreen.vue";
import ConfirmDialog from "../../../../src/shared/ui/admin/confirm-dialog/ConfirmDialog.vue";

const orders: Order[] = [
  {
    id: "1",
    orderNumber: "#1234",
    customerName: "Анна Смирнова",
    items: "Капучино M, Круассан",
    total: 380,
    status: "Created",
    slotTime: "10:00",
    createdAt: new Date("2026-07-27T10:00:00"),
  },
  {
    id: "2",
    orderNumber: "#1235",
    customerName: "Дмитрий Иванов",
    items: "Латте L, Чизкейк",
    total: 450,
    status: "Confirmed",
    slotTime: "10:10",
    createdAt: new Date("2026-07-27T10:10:00"),
  },
  {
    id: "3",
    orderNumber: "#1236",
    customerName: "Елена Петрова",
    items: "Эспрессо, Круассан",
    total: 280,
    status: "Ready for pickup",
    slotTime: "10:20",
    createdAt: new Date("2026-07-27T10:20:00"),
  },
];

const meta = {
  title: "Admin/Orders/Screen",
  component: OrdersScreen,
  argTypes: {
    orders: {
      control: "object",
      description: "Заказы для отображения и фильтрации.",
    },
    onRefresh: {
      action: "refresh",
      description: "Запрашивает обновление списка заказов.",
    },
    "onOrder-action": {
      action: "order-action",
      description: "Передаёт действие над заказом.",
    },
  },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof OrdersScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllStatuses: Story = {
  args: {
    orders,
    onRefresh: () => undefined,
    "onOrder-action": () => undefined,
  },
};

export const FiltersAndRefresh: Story = {
  args: {
    orders,
    onRefresh: () => undefined,
    "onOrder-action": () => undefined,
  },
};

export const StatusActions: Story = {
  args: {
    orders,
    onRefresh: () => undefined,
    "onOrder-action": () => undefined,
  },
};

export const RejectDialog: Story = {
  args: {
    orders,
    onRefresh: () => undefined,
    "onOrder-action": () => undefined,
  },
};

export const RejectDialogVisual: Story = {
  args: {
    orders,
    onRefresh: () => undefined,
    "onOrder-action": () => undefined,
  },
  render: () => ({
    components: { ConfirmDialog },
    setup: () => ({ open: true }),
    template:
      '<ConfirmDialog v-model:open="open" confirm-label="Отклонить" confirm-variant="destructive" description="Укажите причину отклонения заказа" input-placeholder="Причина отклонения" require-input title="Отклонить заказ" />',
  }),
};

export const CloseDialogCancelAndConfirm: Story = {
  args: {
    orders,
    onRefresh: () => undefined,
    "onOrder-action": () => undefined,
  },
};

export const Empty: Story = {
  args: {
    orders: [],
    onRefresh: () => undefined,
    "onOrder-action": () => undefined,
  },
};

export const LongContentNarrow: Story = {
  args: {
    orders: [
      {
        id: "long",
        orderNumber: "#12345678901234567890",
        customerName: "Александра Александровна Константинопольская",
        items:
          "Большой капучино с альтернативным молоком, двойной карамелью, сиропом ваниль и дополнительным круассаном",
        total: 1280,
        status: "Created",
        slotTime: "10:30",
        createdAt: new Date("2026-07-27T10:30:00"),
      },
    ],
    onRefresh: () => undefined,
    "onOrder-action": () => undefined,
  },
  parameters: { viewport: { defaultViewport: "mobile1" } },
};

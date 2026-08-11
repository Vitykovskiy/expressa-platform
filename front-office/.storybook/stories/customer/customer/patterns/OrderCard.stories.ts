import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { shallowRef } from "vue";
import { expect, fn, userEvent, within } from "storybook/test";
import OrderCard from "@/features/orders/OrderCard.vue";
import { createCustomerDefaults } from "../fixtures/customer.fixtures";
import type { Order } from "@/entities/customer/model/customer.types";

type OrderCardStoryArgs = {
  order: Order;
  statusLabel: string;
  expanded: boolean;
  onToggle: () => void;
};

const order = createCustomerDefaults().orders[0];

const meta = {
  title: "Components/Patterns/OrderCard",
  component: OrderCard,
  args: {
    order,
    statusLabel: "Готов",
    expanded: false,
    onToggle: fn(),
  },
  argTypes: {
    order: { control: "object" },
    statusLabel: { control: "text" },
    expanded: { control: "boolean" },
    onToggle: { action: "toggle" },
  },
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Карточка заказа. Контракт: order, statusLabel, expanded и toggle; история управляет раскрытием и обновлением. Показывает статусы и длинные позиции; не вычисляет заказ. Accessibility: toggle сообщает aria-expanded. Источник: src/features/orders/OrderCard.vue.",
      },
    },
  },
  render: (args) => ({
    components: { OrderCard },
    setup: () => {
      const expanded = shallowRef(args.expanded);

      function toggle() {
        expanded.value = !expanded.value;
        args.onToggle();
      }

      return { args, expanded, toggle };
    },
    template:
      '<OrderCard :order="args.order" :status-label="args.statusLabel" :expanded="expanded" @toggle="toggle" />',
  }),
} satisfies Meta<OrderCardStoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Collapsed: Story = {
  play: async ({ args, canvasElement }) => {
    const button = within(canvasElement).getByRole("button", {
      name: /Заказ #/,
    });
    await expect(button).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(button);
    await expect(args.onToggle).toHaveBeenCalledTimes(1);
    await expect(button).toHaveAttribute("aria-expanded", "true");
  },
};

export const Expanded: Story = { args: { expanded: true } };
export const Pending: Story = {
  args: { order: { ...order, status: "pending" }, statusLabel: "Ожидает" },
};
export const Preparing: Story = {
  args: { order: { ...order, status: "preparing" }, statusLabel: "Готовится" },
};
export const Ready: Story = {
  args: { order: { ...order, status: "ready" }, statusLabel: "Готов" },
};
export const Completed: Story = {
  args: { order: { ...order, status: "completed" }, statusLabel: "Выдан" },
};
export const Cancelled: Story = {
  args: { order: { ...order, status: "cancelled" }, statusLabel: "Отменён" },
};

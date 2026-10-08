import type { Meta, StoryObj } from "@storybook/vue3-vite";
import OrderCard from "../../../src/pages/admin/orders/OrderCard.vue";
import { order, orderDetails } from "../../fixtures/catalog";
const meta = {
  title: "Бизнес компоненты/Заказы/Карточка заказа",
  id: "data-display-ordercard",
  component: OrderCard,
  args: {
    order,
    details: null,
    detailsLoading: false,
    transitionLoading: false,
  },
  parameters: { layout: "padded" },
} satisfies Meta<typeof OrderCard>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Created: Story = { name: "Новый заказ" };
export const CreatedDetails: Story = {
  name: "Новый заказ с деталями",
  args: { details: orderDetails },
};
export const Accepted: Story = {
  name: "Принято",
  args: {
    order: { ...order, stage: "ACCEPTED" },
    details: { ...orderDetails, stage: "ACCEPTED" },
  },
};
export const Preparing: Story = {
  name: "Готовится",
  args: {
    order: { ...order, stage: "PREPARING" },
    details: { ...orderDetails, stage: "PREPARING" },
  },
};
export const ReadyPending: Story = {
  name: "Выдача недоступна",
  args: {
    order: { ...order, stage: "READY" },
    details: { ...orderDetails, stage: "READY" },
    transitionLoading: true,
  },
};
export const Issued: Story = {
  name: "Выдан",
  args: {
    order: { ...order, stage: "ISSUED" },
    details: { ...orderDetails, stage: "ISSUED" },
  },
};
export const DetailsLoading: Story = {
  name: "Загрузка деталей",
  args: { detailsLoading: true },
};

export const Ready: Story = {
  name: "Готов к выдаче",
  args: {
    order: { ...order, stage: "READY" },
    details: { ...orderDetails, stage: "READY" },
  },
};

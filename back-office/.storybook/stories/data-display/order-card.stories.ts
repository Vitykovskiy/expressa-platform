import type { Meta, StoryObj } from "@storybook/vue3-vite";
import OrderCard from "../../../src/pages/admin/orders/OrderCard.vue";
import { order, orderDetails } from "../../fixtures/catalog";
const meta = {
  title: "Data display/OrderCard",
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
export const Created: Story = {};
export const CreatedDetails: Story = { args: { details: orderDetails } };
export const Accepted: Story = {
  args: {
    order: { ...order, stage: "ACCEPTED" },
    details: { ...orderDetails, stage: "ACCEPTED" },
  },
};
export const Preparing: Story = {
  args: {
    order: { ...order, stage: "PREPARING" },
    details: { ...orderDetails, stage: "PREPARING" },
  },
};
export const ReadyPending: Story = {
  args: {
    order: { ...order, stage: "READY" },
    details: { ...orderDetails, stage: "READY" },
    transitionLoading: true,
  },
};
export const Issued: Story = {
  args: {
    order: { ...order, stage: "ISSUED" },
    details: { ...orderDetails, stage: "ISSUED" },
  },
};
export const DetailsLoading: Story = { args: { detailsLoading: true } };

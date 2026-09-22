import type { Meta, StoryObj } from "@storybook/vue3-vite";
import OrdersScreen from "../../../src/pages/admin/orders/OrdersScreen.vue";
import { order, orderDetails } from "../../fixtures/catalog";
const meta = {
  title: "Features/Orders/OrdersScreen",
  component: OrdersScreen,
  args: {
    orders: [order],
    search: "",
    stage: "ALL",
    status: "ready",
    selectedOrderId: null,
    details: null,
    detailsLoading: false,
    transitionLoading: false,
  },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof OrdersScreen>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Ready: Story = {};
export const SelectedDetails: Story = {
  args: { selectedOrderId: order.id, details: orderDetails },
};
export const DetailsLoading: Story = {
  args: { selectedOrderId: order.id, detailsLoading: true },
};
export const TransitionPending: Story = {
  args: {
    selectedOrderId: order.id,
    details: orderDetails,
    transitionLoading: true,
  },
};
export const Loading: Story = { args: { status: "loading", orders: [] } };
export const Empty: Story = { args: { orders: [] } };
export const SearchEmpty: Story = { args: { orders: [], search: "123" } };
export const StageEmpty: Story = { args: { orders: [], stage: "READY" } };
export const SearchAndStageEmpty: Story = {
  args: { orders: [], search: "123", stage: "READY" },
};

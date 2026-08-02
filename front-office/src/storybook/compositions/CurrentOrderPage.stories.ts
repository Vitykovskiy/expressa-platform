import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, userEvent, within } from "storybook/test";

import CurrentOrderPage from "../../components/compositions/CurrentOrderPage.vue";

const meta = {
  title: "Compositions/CurrentOrderPage",
  component: CurrentOrderPage,
} satisfies Meta<typeof CurrentOrderPage>;
export default meta;
type Story = StoryObj<typeof meta>;
const order = {
  stage: "PREPARING" as const,
  total: 498,
  items: [
    {
      id: "coffee",
      name: "Капучино",
      details: "M · Овсяное молоко",
      quantity: 2,
      price: 249,
    },
  ],
};
export const NotificationsAllowed: Story = {
  args: { order, permission: "granted" },
  parameters: { viewport: { defaultViewport: "mobile320" } },
};
export const NotificationsDenied: Story = {
  args: { order: { ...order, stage: "READY" }, permission: "denied" },
  parameters: { viewport: { defaultViewport: "tablet768" } },
};
export const Created: Story = {
  args: { order: { ...order, stage: "CREATED" }, permission: "default" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Разрешить" }));
    await expect(canvas.getByRole("status")).toHaveTextContent(
      "Уведомления разрешены",
    );
  },
};
export const Accepted: Story = {
  args: { order: { ...order, stage: "ACCEPTED" }, permission: "granted" },
};
export const Issued: Story = {
  args: { order: { ...order, stage: "ISSUED" }, permission: "denied" },
};

import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, userEvent, within } from "storybook/test";
import { shallowRef } from "vue";

import OrderCard from "../../../components/domain-ui/Orders/OrderCard.vue";
import OrderDetails from "../../../components/domain-ui/Orders/OrderDetails.vue";
import OrderHistoryList from "../../../components/domain-ui/Orders/OrderHistoryList.vue";
import OrderStage from "../../../components/domain-ui/Orders/OrderStage.vue";
import RepeatOrderResult from "../../../components/domain-ui/Orders/RepeatOrderResult.vue";

const meta = { title: "Orders/Catalog" } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
const items = [
  {
    id: "coffee",
    name: "Капучино",
    details: "M · Овсяное молоко",
    quantity: 2,
    price: 249,
  },
];

export const CurrentOrder: Story = {
  parameters: { viewport: { defaultViewport: "mobile320" } },
  render: () => ({
    components: { OrderDetails, OrderStage },
    setup: () => ({ items }),
    template: `<OrderStage stage="PREPARING" /><OrderDetails :items="items" :total="498" />`,
  }),
};
export const Created: Story = {
  render: () => ({
    components: { OrderStage },
    template: `<OrderStage stage="CREATED" />`,
  }),
};
export const Accepted: Story = {
  render: () => ({
    components: { OrderStage },
    template: `<OrderStage stage="ACCEPTED" />`,
  }),
};
export const History: Story = {
  parameters: { viewport: { defaultViewport: "mobile390" } },
  render: () => ({
    components: { OrderHistoryList },
    template: `<OrderHistoryList :orders="[{ number: '#101', date: 'Сегодня, 12:30', stage: 'ISSUED', total: 498 }, { number: '#100', date: 'Вчера, 09:15', stage: 'READY', total: 249 }]" />`,
  }),
};
export const Loading: Story = {
  render: () => ({
    components: { OrderHistoryList },
    template: `<OrderHistoryList :orders="[]" loading />`,
  }),
};
export const Empty: Story = {
  render: () => ({
    components: { OrderHistoryList },
    template: `<OrderHistoryList :orders="[]" />`,
  }),
};
export const Error: Story = {
  render: () => ({
    components: { OrderHistoryList },
    template: `<OrderHistoryList :orders="[]" error="Не удалось загрузить историю. Попробуйте позже." />`,
  }),
};
export const RepeatFull: Story = {
  parameters: { viewport: { defaultViewport: "tablet768" } },
  render: () => ({
    components: { RepeatOrderResult },
    template: `<RepeatOrderResult status="full" :added="2" />`,
  }),
};
export const RepeatPartial: Story = {
  render: () => ({
    components: { RepeatOrderResult },
    template: `<RepeatOrderResult status="partial" :added="1" :skipped="['Сезонный раф: больше недоступен']" />`,
  }),
};
export const RepeatUnavailable: Story = {
  render: () => ({
    components: { RepeatOrderResult },
    template: `<RepeatOrderResult status="unavailable" :added="0" :skipped="['Все позиции больше недоступны']" />`,
  }),
};
export const RepeatInteraction: Story = {
  render: () => ({
    components: { OrderCard, RepeatOrderResult },
    setup() {
      const shown = shallowRef(false);
      return { shown };
    },
    template: `<OrderCard number="#101" date="Сегодня" stage="ISSUED" :total="498" @repeat="shown = true" /><RepeatOrderResult v-if="shown" status="full" :added="2" />`,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Повторить" }));
    await expect(
      canvas.getByRole("heading", { name: "Все позиции доступны" }),
    ).toBeVisible();
  },
};

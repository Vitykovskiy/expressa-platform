import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, userEvent, within } from "storybook/test";
import { shallowRef } from "vue";

import AvailabilityNotice from "../../../components/domain-ui/Cart/AvailabilityNotice.vue";
import CartBadge from "../../../components/domain-ui/Cart/CartBadge.vue";
import CartLine from "../../../components/domain-ui/Cart/CartLine.vue";
import CartSummary from "../../../components/domain-ui/Cart/CartSummary.vue";
import PriceChangeNotice from "../../../components/domain-ui/Cart/PriceChangeNotice.vue";

const meta = { title: "Cart/Catalog" } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: { viewport: { defaultViewport: "mobile320" } },
  render: () => ({
    components: { CartBadge, CartLine, CartSummary },
    setup() {
      const quantity = shallowRef(1);
      return { quantity };
    },
    template: `<CartBadge :count="1" /><CartLine name="Капучино" details="M · Овсяное молоко" :price="249" :quantity="quantity" @update:quantity="quantity = $event" /><CartSummary :items="quantity" :total="249 * quantity" />`,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", { name: "Увеличить количество" }),
    );
    await expect(
      within(canvas.getByLabelText("Итог корзины")).getByText("498 ₽"),
    ).toBeVisible();
  },
};
export const PriceChanged: Story = {
  parameters: { viewport: { defaultViewport: "mobile390" } },
  render: () => ({
    components: { PriceChangeNotice },
    setup() {
      const confirmed = shallowRef(false);
      return { confirmed };
    },
    template: `<p v-if="confirmed" role="status">Цена подтверждена</p><PriceChangeNotice v-else name="Капучино" :old-price="249" :new-price="279" @confirm="confirmed = true" />`,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", { name: "Подтвердить цену" }),
    );
    await expect(canvas.getByRole("status")).toHaveTextContent(
      "Цена подтверждена",
    );
  },
};
export const Unavailable: Story = {
  parameters: { viewport: { defaultViewport: "tablet768" } },
  render: () => ({
    components: { AvailabilityNotice },
    setup() {
      const available = shallowRef(false);
      return { available };
    },
    template: `<p v-if="available" role="status">Позиция удалена из корзины</p><AvailabilityNotice v-else name="Сезонный раф" @remove="available = true" />`,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", { name: "Удалить позицию" }),
    );
    await expect(canvas.getByRole("status")).toHaveTextContent(
      "Позиция удалена из корзины",
    );
  },
};
export const LargeTotal: Story = {
  render: () => ({
    components: { CartLine, CartSummary },
    template: `<CartLine name="Капучино с карамельным сиропом и овсяным молоком большого объёма" details="Очень длинная добавка" :price="12499" :quantity="20" /><CartSummary :items="20" :total="249980" />`,
  }),
};
export const Disabled: Story = {
  render: () => ({
    components: { CartLine },
    template: `<CartLine name="Латте" :price="249" :quantity="1" :max-quantity="1" />`,
  }),
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole("button", {
        name: "Увеличить количество",
      }),
    ).toBeDisabled();
  },
};

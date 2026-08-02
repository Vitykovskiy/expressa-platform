import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, userEvent, within } from "storybook/test";

import AvailabilityState from "../../../components/domain-ui/Menu/AvailabilityState.vue";
import ModifierGroup from "../../../components/domain-ui/Menu/ModifierGroup.vue";
import PriceLabel from "../../../components/domain-ui/Menu/PriceLabel.vue";
import ProductCard from "../../../components/domain-ui/Menu/ProductCard.vue";
import ProductConfigurator from "../../../components/domain-ui/Menu/ProductConfigurator.vue";

const meta = {
  title: "Menu/Catalog",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const DrinkWithM: Story = {
  parameters: { viewport: { defaultViewport: "mobile320" } },
  render: () => ({
    components: {
      AvailabilityState,
      ModifierGroup,
      PriceLabel,
      ProductCard,
      ProductConfigurator,
    },
    template: `
      <ProductCard
        name="Капучино"
        description="Классический кофе с молочной пеной"
        kind="DRINK"
        :price="249"
        :available="true"
      />
      <ProductConfigurator
        name="Капучино"
        :base-price="219"
        :sizes="[
          { id: 's', label: 'S', price: 219 },
          { id: 'm', label: 'M', price: 249 },
          { id: 'l', label: 'L', price: 279 },
        ]"
        :modifiers="[
          { id: 'milk', label: 'Овсяное молоко', default: true },
        ]"
        :min-modifiers="1"
        :max-modifiers="1"
      />
      <PriceLabel :amount="12499" />
      <AvailabilityState :available="true" />
      <ModifierGroup
        title="Добавки"
        :options="[{ id: 'vanilla', label: 'Ванильный сироп', price: 40 }]"
        :model-value="[]"
        :min="0"
        :max="1"
      />
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("radio", { name: "M · 249 ₽" }),
    ).toHaveAttribute("aria-checked", "true");
    await expect(
      canvas.getByRole("checkbox", { name: "Овсяное молоко" }),
    ).toBeChecked();
    await expect(
      canvas.getByRole("button", { name: "В корзину" }),
    ).toBeEnabled();
  },
};

export const DrinkWithoutM: Story = {
  parameters: { viewport: { defaultViewport: "mobile390" } },
  render: () => ({
    components: { ProductCard, ProductConfigurator },
    template: `
      <ProductCard kind="DRINK" name="Сезонный раф" :price="319" :available="true" />
      <ProductConfigurator
        name="Сезонный раф"
        :base-price="299"
        :sizes="[
          { id: 's', label: 'S', price: 299 },
          { id: 'l', label: 'L', price: 359 },
        ]"
      />
    `,
  }),
};

export const Other: Story = {
  parameters: { viewport: { defaultViewport: "tablet768" } },
  render: () => ({
    components: { ProductCard, ProductConfigurator },
    template: `
      <ProductCard
        name="Капучино с карамельным сиропом и овсяным молоком большого объёма"
        description="Длинное описание остаётся читаемым на узком экране и не скрывает действие пользователя."
        kind="OTHER"
        :price="12499"
        :available="true"
      />
      <ProductConfigurator name="Печенье" :base-price="99" />
    `,
  }),
};

export const Unavailable: Story = {
  render: () => ({
    components: { ProductCard },
    template: `<ProductCard kind="DRINK" name="Сезонный раф" :available="true" />`,
  }),
};

export const Validation: Story = {
  render: () => ({
    components: { ProductConfigurator },
    setup() {
      const modifiers = [
        { id: "espresso", label: "Дополнительный эспрессо", price: 60 },
        { id: "vanilla", label: "Ванильный сироп", price: 40 },
      ];
      return { modifiers };
    },
    template: `
      <ProductConfigurator
        name="Латте"
        :base-price="249"
        :modifiers="modifiers"
        :min-modifiers="1"
        :max-modifiers="1"
      />
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("button", { name: "В корзину" }),
    ).toBeDisabled();
    await userEvent.click(
      canvas.getByRole("checkbox", {
        name: "Дополнительный эспрессо +60 ₽",
      }),
    );
    await expect(
      canvas.getByRole("checkbox", { name: "Ванильный сироп +40 ₽" }),
    ).toBeDisabled();
  },
};

export const KeyboardFocus: Story = {
  render: () => ({
    components: { ProductConfigurator },
    template: `<ProductConfigurator name="Американо" :base-price="179" />`,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.tab();
    await expect(
      canvas.getByRole("button", { name: "Увеличить количество" }),
    ).toHaveFocus();
  },
};

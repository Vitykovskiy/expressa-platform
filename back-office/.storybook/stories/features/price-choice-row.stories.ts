import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { shallowRef } from "vue";
import PriceChoiceRow from "../../../src/pages/admin/menu/product-edit/PriceChoiceRow.vue";

const choice = {
  clientId: "choice-1",
  id: "small",
  portionLabel: "300 мл",
  price: "290",
  isAvailable: true,
};
const meta = {
  title: "Бизнес компоненты/Меню/Строка варианта цены",
  id: "features-menu-pricechoicerow",
  component: PriceChoiceRow,
  args: { choice, expanded: true, first: true, last: false },
} satisfies Meta<typeof PriceChoiceRow>;

export default meta;
type Story = StoryObj<typeof meta>;

function render(args: Story["args"]) {
  return {
    components: { PriceChoiceRow },
    setup: () => {
      const choice = shallowRef({ ...args.choice });
      const expanded = shallowRef(args.expanded);

      return { args, choice, expanded };
    },
    template: `
      <PriceChoiceRow
        v-bind="args"
        :choice="choice"
        :expanded="expanded"
        @toggle="expanded = !expanded"
        @update:is-available="choice = { ...choice, isAvailable: $event }"
        @update:portion-label="choice = { ...choice, portionLabel: $event }"
        @update:price="choice = { ...choice, price: $event }"
      />
    `,
  };
}

export const Expanded: Story = { name: "Развёрнуто", render };
export const Collapsed: Story = {
  name: "Свёрнуто",
  args: { expanded: false },
  render,
};
export const Validation: Story = {
  name: "Ошибки ввода",
  args: { errors: { price: "Введите цену" } },
  render,
};
export const Disabled: Story = {
  name: "Недоступно",
  args: { disabled: true },
  render,
};

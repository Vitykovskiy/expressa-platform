import type { Meta, StoryObj } from "@storybook/vue3-vite";
import PriceFields from "../../../src/pages/admin/menu/PriceFields.vue";
import { shallowRef } from "vue";
const meta = {
  title: "Бизнес компоненты/Меню/Поля цены",
  id: "forms-pricefields",
  component: PriceFields,
} satisfies Meta<typeof PriceFields>;
export default meta;
type Story = StoryObj<typeof meta>;
function render(args: Story["args"]) {
  return {
    components: { PriceFields },
    setup: () => ({
      args,
      price: shallowRef("290"),
      portion: shallowRef("300 мл"),
    }),
    template:
      '<PriceFields v-bind="args" v-model:price="price" v-model:portion-label="portion" />',
  };
}
export const Default: Story = { name: "Обычное состояние", render };
export const Validation: Story = {
  name: "Ошибки ввода",
  args: { priceError: "Введите цену" },
  render,
};
export const Disabled: Story = {
  name: "Недоступно",
  args: { disabled: true },
  render,
};

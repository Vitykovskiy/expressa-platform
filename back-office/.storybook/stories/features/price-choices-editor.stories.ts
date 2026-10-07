import type { Meta, StoryObj } from "@storybook/vue3-vite";
import PriceChoicesEditor from "../../../src/pages/admin/menu/product-edit/PriceChoicesEditor.vue";
import { shallowRef } from "vue";
const meta = {
  title: "Бизнес компоненты/Меню/Список вариантов цены",
  id: "features-menu-pricechoiceseditor",
  component: PriceChoicesEditor,
} satisfies Meta<typeof PriceChoicesEditor>;
export default meta;
type Story = StoryObj<typeof meta>;
function render(args: Story["args"]) {
  return {
    components: { PriceChoicesEditor },
    setup: () => ({
      args,
      choices: shallowRef([
        {
          clientId: "choice-1",
          id: "small",
          portionLabel: "300 мл",
          price: "290",
          isAvailable: true,
        },
      ]),
    }),
    template: '<PriceChoicesEditor v-bind="args" v-model="choices" />',
  };
}
export const List: Story = { name: "Список", render };
export const Disabled: Story = {
  name: "Недоступно",
  args: { disabled: true },
  render,
};

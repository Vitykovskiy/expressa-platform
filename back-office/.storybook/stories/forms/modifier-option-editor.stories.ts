import type { Meta, StoryObj } from "@storybook/vue3-vite";
import ModifierOptionEditor from "../../../src/pages/admin/menu/ModifierOptionEditor.vue";
import { shallowRef } from "vue";
const meta = {
  title: "Бизнес компоненты/Меню/Редактор добавки",
  id: "forms-modifieroptioneditor",
  component: ModifierOptionEditor,
  args: {
    modelValue: {
      name: "Овсяное",
      priceDelta: "60",
      isDefault: false,
      isAvailable: true,
    },
  },
  parameters: { layout: "padded" },
} satisfies Meta<typeof ModifierOptionEditor>;
export default meta;
type Story = StoryObj<typeof meta>;
function render(args: Story["args"]) {
  return {
    components: { ModifierOptionEditor },
    setup: () => ({
      args,
      value: shallowRef({
        ...args.modelValue,
      }),
    }),
    template: '<ModifierOptionEditor v-bind="args" v-model="value" />',
  };
}
export const Default: Story = { name: "Обычное состояние", render };
export const Validation: Story = {
  name: "Ошибки ввода",
  args: {
    fieldErrors: {
      name: "Введите название",
      priceDelta: "Укажите изменение цены",
    },
  },
  render,
};
export const Disabled: Story = {
  name: "Недоступно",
  args: { disabled: true },
  render,
};
export const NameValidation: Story = {
  name: "Ошибка названия",
  args: { fieldErrors: { name: "Введите название" } },
  render,
};
export const PriceValidation: Story = {
  name: "Ошибка цены",
  args: { fieldErrors: { priceDelta: "Укажите изменение цены" } },
  render,
};

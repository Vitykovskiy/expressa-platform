import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { shallowRef } from "vue";
import FilterTabs from "../../../src/shared/ui/admin/filter-tabs/FilterTabs.vue";
const items = [
  { value: "all", label: "Все" },
  { value: "active", label: "Активные" },
];
const meta = {
  title: "Компоненты/Формы/Вкладки фильтра",
  id: "forms-filtertabs",
  component: FilterTabs,
  args: { items, modelValue: "all" },
} satisfies Meta<typeof FilterTabs>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Contained: Story = {
  name: "По ширине блока",
  args: { layout: "contained" },
};
export const Intrinsic: Story = {
  name: "По ширине текста",
  args: { layout: "intrinsic" },
};
export const Disabled: Story = { name: "Недоступно", args: { disabled: true } };
export const Responsive: Story = {
  name: "Адаптивные",
  args: { layout: "responsive" },
};
export const Wrapped: Story = {
  name: "С переносом",
  args: { layout: "wrapped" },
};
export const BalancedPairs: Story = {
  name: "Пары на узком экране",
  args: { layout: "balanced-pairs" },
};
const boundedItems = [
  { value: "all", label: "Все" },
  {
    value: "long",
    label: "Кофейные напитки с авторскими добавками и альтернативным молоком",
  },
  {
    value: "unbroken",
    label: "ОченьДлинноеНазваниеКатегорииБезПробеловДляПроверкиПереносаТекста",
  },
  ...Array.from({ length: 12 }, (_, index) => ({
    value: `category-${index}`,
    label: `Категория ${index + 1}`,
  })),
];
function render(args: Story["args"]) {
  return {
    components: { FilterTabs },
    setup: () => ({ args, value: shallowRef(args.modelValue) }),
    template: `<FilterTabs v-bind="args" v-model="value" />`,
  };
}
export const BoundedWrapped: Story = {
  name: "Категории в границах блока",
  render,
  args: { layout: "bounded-wrapped", items: boundedItems, modelValue: "long" },
};
export const BoundedDisabled: Story = {
  name: "Категории недоступны",
  render,
  args: {
    layout: "bounded-wrapped",
    items: boundedItems,
    modelValue: "unbroken",
    disabled: true,
  },
};

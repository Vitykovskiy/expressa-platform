import type { Meta, StoryObj } from "@storybook/vue3-vite";
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

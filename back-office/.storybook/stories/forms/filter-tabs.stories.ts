import type { Meta, StoryObj } from "@storybook/vue3-vite";
import FilterTabs from "../../../src/shared/ui/admin/filter-tabs/FilterTabs.vue";
const items = [
  { value: "all", label: "Все" },
  { value: "active", label: "Активные" },
];
const meta = {
  title: "Forms/FilterTabs",
  component: FilterTabs,
  args: { items, modelValue: "all" },
} satisfies Meta<typeof FilterTabs>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Contained: Story = { args: { layout: "contained" } };
export const Intrinsic: Story = { args: { layout: "intrinsic" } };
export const Disabled: Story = { args: { disabled: true } };

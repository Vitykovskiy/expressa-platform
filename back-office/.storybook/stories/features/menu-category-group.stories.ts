import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { shallowRef } from "vue";
import MenuCategoryGroup from "../../../src/pages/admin/menu/MenuCategoryGroup.vue";
import { category, product } from "../../fixtures/catalog";

const meta = {
  title: "Features/Menu/MenuCategoryGroup",
  component: MenuCategoryGroup,
  args: { category, products: [product], expanded: true, disabled: false },
} satisfies Meta<typeof MenuCategoryGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

function render(args: Story["args"]) {
  return {
    components: { MenuCategoryGroup },
    setup: () => ({ args, expanded: shallowRef(args.expanded) }),
    template:
      '<MenuCategoryGroup v-bind="args" :expanded="expanded" @toggle="expanded = !expanded" />',
  };
}

export const Expanded: Story = { render };
export const Collapsed: Story = { args: { expanded: false }, render };
export const Disabled: Story = { args: { disabled: true }, render };

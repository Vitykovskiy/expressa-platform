import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { shallowRef } from "vue";
import MenuCategoryGroup from "../../../src/pages/admin/menu/MenuCategoryGroup.vue";
import { category, product } from "../../fixtures/catalog";

const meta = {
  title: "Бизнес компоненты/Меню/Группа товаров",
  id: "features-menu-menucategorygroup",
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

export const Expanded: Story = { name: "Развёрнуто", render };
export const Collapsed: Story = {
  name: "Свёрнуто",
  args: { expanded: false },
  render,
};
export const Disabled: Story = {
  name: "Недоступно",
  args: { disabled: true },
  render,
};

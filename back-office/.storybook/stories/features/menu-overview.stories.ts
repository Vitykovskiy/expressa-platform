import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { shallowRef } from "vue";
import MenuOverview from "../../../src/pages/admin/menu/MenuOverview.vue";
import { category, product, modifierGroup } from "../../fixtures/catalog";

const meta = {
  title: "Бизнес компоненты/Меню/Список категорий и добавок",
  id: "features-menu-menuoverview",
  component: MenuOverview,
  args: {
    categories: [category],
    products: [product],
    modifierGroups: [modifierGroup],
    expandedCategoryIds: new Set([category.id]),
  },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof MenuOverview>;

export default meta;
type Story = StoryObj<typeof meta>;

function render(args: Story["args"]) {
  return {
    components: { MenuOverview },
    setup: () => {
      const expandedCategoryIds = shallowRef(new Set(args.expandedCategoryIds));

      function toggleCategory({ id }: { id: string }) {
        const next = new Set(expandedCategoryIds.value);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        expandedCategoryIds.value = next;
      }

      return { args, expandedCategoryIds, toggleCategory };
    },
    template:
      '<MenuOverview v-bind="args" :expanded-category-ids="expandedCategoryIds" @toggle-category="toggleCategory" />',
  };
}

export const Content: Story = { name: "С содержимым", render };
export const Empty: Story = {
  name: "Пусто",
  args: {
    categories: [],
    products: [],
    modifierGroups: [],
    expandedCategoryIds: new Set(),
  },
  render,
};
export const Disabled: Story = {
  name: "Недоступно",
  args: { disabled: true },
  render,
};

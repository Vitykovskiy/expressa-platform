import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { shallowRef } from "vue";
import { createNavigationItems } from "../../../src/app/navigation";
import MenuOverview from "../../../src/pages/admin/menu/MenuOverview.vue";
import MenuReorderPanel from "../../../src/pages/admin/menu/MenuReorderPanel.vue";
import MenuScreenHeading from "../../../src/pages/admin/menu/MenuScreenHeading.vue";
import PageShell from "../../../src/pages/PageShell.vue";
import AdminShell from "../../../src/widgets/admin-shell/AdminShell.vue";
import { category, modifierGroup, product } from "../../fixtures/catalog";

const items = createNavigationItems("administrator");
const teaCategory = { ...category, id: "tea", name: "Чай", sortOrder: 1 };
const teaProduct = {
  ...product,
  id: "black-tea",
  categoryId: teaCategory.id,
  name: "Чёрный чай",
  price: 190,
  sortOrder: 0,
};
const longCategory = {
  ...teaCategory,
  name: "Авторские чайные напитки с сезонными ягодами и пряностями",
};
const longProduct = {
  ...teaProduct,
  name: "Чёрный чай с бергамотом, чабрецом и лесными ягодами",
};
const manyCategories = Array.from({ length: 120 }, (_, index) => ({
  ...category,
  id: `category-${index}`,
  name: `Категория ${index + 1}`,
  sortOrder: index,
}));
const manyProducts = Array.from({ length: 120 }, (_, index) => ({
  ...product,
  id: `product-${index}`,
  categoryId: manyCategories[0]!.id,
  name: `Товар ${index + 1}`,
  sortOrder: index,
}));
const meta = {
  title: "Экраны/Меню",
  id: "screens-menu",
  component: MenuOverview,
  args: {
    categories: [category, teaCategory],
    products: [product, teaProduct],
    modifierGroups: [modifierGroup],
    expandedCategoryIds: new Set([category.id, teaCategory.id]),
  },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof MenuOverview>;
export default meta;
type Story = StoryObj<typeof meta>;
function renderOverview(args: Story["args"]) {
  return {
    components: { AdminShell, PageShell, MenuOverview, MenuScreenHeading },
    setup: () => ({
      args,
      items,
      expandedCategoryIds: shallowRef(new Set(args.expandedCategoryIds)),
    }),
    template: `<AdminShell role="administrator" active-section="menu" :items="items">
      <PageShell><MenuScreenHeading /><MenuOverview v-bind="args" :expanded-category-ids="expandedCategoryIds"
        @toggle-category="({ id }) => { const next = new Set(expandedCategoryIds); next.has(id) ? next.delete(id) : next.add(id); expandedCategoryIds = next }" />
      </PageShell>
    </AdminShell>`,
  };
}
function renderReorder(args: Story["args"]) {
  return {
    components: { AdminShell, PageShell, MenuReorderPanel, MenuScreenHeading },
    setup: () => ({
      args,
      items,
      expandedCategoryIds: shallowRef(new Set(args.expandedCategoryIds)),
    }),
    template: `<AdminShell role="administrator" active-section="menu" :items="items">
      <PageShell><MenuScreenHeading /><MenuReorderPanel :categories="args.categories" :products="args.products" :pending="args.disabled"
        :expanded-category-ids="expandedCategoryIds"
        @update:expanded-category-ids="expandedCategoryIds = $event" />
      </PageShell>
    </AdminShell>`,
  };
}
export const Overview: Story = {
  name: "Обзор",
  render: renderOverview,
  globals: { viewport: "desktop" },
};
export const OverviewMobile: Story = {
  name: "Обзор — мобильный вид",
  render: renderOverview,
  args: { expandedCategoryIds: new Set() },
  globals: { viewport: "mobile" },
};
export const Empty: Story = {
  name: "Пусто",
  render: renderOverview,
  args: {
    categories: [],
    products: [],
    modifierGroups: [],
    expandedCategoryIds: new Set(),
  },
};
export const OverviewLongNames: Story = {
  name: "Обзор — длинные названия",
  render: renderOverview,
  args: {
    categories: [longCategory],
    products: [longProduct],
    expandedCategoryIds: new Set([longCategory.id]),
  },
  globals: { viewport: "mobile" },
};
export const OverviewManyRows: Story = {
  name: "Обзор — много строк",
  render: renderOverview,
  args: {
    categories: manyCategories,
    products: manyProducts,
    expandedCategoryIds: new Set([manyCategories[0]!.id]),
  },
  globals: { viewport: "mobile" },
};
export const Reorder: Story = {
  name: "Изменение порядка",
  render: renderReorder,
  globals: { viewport: "desktop" },
};
export const ReorderMobile: Story = {
  name: "Порядок — мобильный вид",
  render: renderReorder,
  globals: { viewport: "mobile" },
};
export const ReorderPending: Story = {
  name: "Порядок — ожидание",
  render: renderReorder,
  args: { disabled: true },
};
export const ReorderLongNames: Story = {
  name: "Порядок — длинные названия",
  render: renderReorder,
  args: {
    categories: [longCategory],
    products: [longProduct],
    expandedCategoryIds: new Set([longCategory.id]),
  },
  globals: { viewport: "mobile" },
};
export const ReorderManyRows: Story = {
  name: "Порядок — много строк",
  render: renderReorder,
  args: {
    categories: manyCategories,
    products: manyProducts,
    expandedCategoryIds: new Set([manyCategories[0]!.id]),
  },
  globals: { viewport: "mobile" },
};
export const ReorderEmptyCategory: Story = {
  name: "Порядок — пустая категория",
  render: renderReorder,
  args: {
    categories: [teaCategory],
    products: [],
    expandedCategoryIds: new Set([teaCategory.id]),
  },
  globals: { viewport: "mobile" },
};

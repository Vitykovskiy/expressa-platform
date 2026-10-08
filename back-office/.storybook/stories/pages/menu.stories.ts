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
      <PageShell class="menu-page__shell" content-spacing="none" style="min-height: 100%; position: relative"><MenuScreenHeading /><MenuOverview v-bind="args" :expanded-category-ids="expandedCategoryIds"
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
      <PageShell class="menu-page__shell" content-spacing="none" style="min-height: 100%; position: relative"><MenuScreenHeading /><MenuReorderPanel :categories="args.categories" :products="args.products" :pending="args.disabled"
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

export const OverviewEmptyCategory: Story = {
  name: "Обзор — пустая категория",
  render: renderOverview,
  args: {
    categories: [category],
    products: [],
    expandedCategoryIds: new Set([category.id]),
  },
};
export const OverviewNoModifiers: Story = {
  name: "Обзор — без групп добавок",
  render: renderOverview,
  args: { modifierGroups: [] },
};
export const OverviewHighlighted: Story = {
  name: "Обзор — новая категория",
  render: renderOverview,
  args: { highlightedCategoryId: teaCategory.id },
};
export const OverviewSaved: Story = {
  name: "Обзор — порядок сохранён",
  render: renderOverview,
  args: { reorderSaved: true },
};
export const OverviewDisabled: Story = {
  name: "Обзор — действия недоступны",
  render: renderOverview,
  args: { disabled: true },
};
export const OverviewDetailedContent: Story = {
  name: "Обзор — длинные добавки и варианты цены",
  render: renderOverview,
  args: {
    categories: [longCategory],
    products: [
      {
        ...longProduct,
        price: null,
        priceChoices: [
          {
            id: "tea-small",
            portionLabel: "Небольшая чашка · 250 мл",
            price: 190,
            sortOrder: 0,
            isAvailable: true,
          },
          {
            id: "tea-large",
            portionLabel: "Большая чашка с дополнительным настоем · 450 мл",
            price: 290,
            sortOrder: 1,
            isAvailable: true,
          },
          {
            id: "tea-pot",
            portionLabel: "Чайник для двоих · 800 мл",
            price: 490,
            sortOrder: 2,
            isAvailable: true,
          },
        ],
      },
    ],
    expandedCategoryIds: new Set([longCategory.id]),
    modifierGroups: [
      {
        ...modifierGroup,
        name: "Растительное молоко и сливки для авторских напитков",
        options: [
          {
            ...modifierGroup.options[0]!,
            id: "oat-long",
            name: "Овсяное молоко без добавленного сахара с мягким ореховым вкусом",
            sortOrder: 0,
          },
          {
            ...modifierGroup.options[0]!,
            id: "coconut-long",
            name: "Кокосовые сливки для напитков с сезонными ягодами",
            sortOrder: 1,
          },
          {
            ...modifierGroup.options[0]!,
            id: "almond-long",
            name: "Миндальное молоко",
            sortOrder: 2,
          },
        ],
      },
      {
        ...modifierGroup,
        id: "syrups",
        name: "Сиропы",
        options: [
          {
            ...modifierGroup.options[0]!,
            id: "vanilla",
            groupId: "syrups",
            name: "Ванильный",
          },
        ],
      },
    ],
  },
};

export const ReorderMultipleProducts: Story = {
  name: "Порядок — несколько товаров",
  render: renderReorder,
  args: {
    categories: [
      category,
      teaCategory,
      { ...category, id: "bakery", name: "Выпечка", sortOrder: 2 },
    ],
    products: [
      product,
      { ...product, id: "latte", name: "Латте", sortOrder: 1 },
      { ...product, id: "espresso", name: "Эспрессо", sortOrder: 2 },
      teaProduct,
    ],
    expandedCategoryIds: new Set([category.id, teaCategory.id]),
  },
};

export const ReorderTwoLineNames: Story = {
  name: "Порядок — названия в две строки",
  render: renderReorder,
  args: {
    categories: [{ ...category, name: "Кофейные напитки" }],
    products: [{ ...product, name: "Капучино большой" }],
    expandedCategoryIds: new Set([category.id]),
  },
};

export const OverviewPriceStates: Story = {
  name: "Обзор — порция, нулевая цена и отсутствие цены",
  render: renderOverview,
  args: {
    categories: [category],
    expandedCategoryIds: new Set([category.id]),
    products: [
      {
        ...product,
        id: "scalar-portion",
        portionLabel: "Большая чашка · 450 мл",
      },
      {
        ...product,
        id: "zero-price",
        name: "Вода",
        portionLabel: "Стакан · 200 мл",
        price: 0,
        sortOrder: 1,
      },
      {
        ...product,
        id: "no-price",
        name: "Сезонный напиток",
        price: null,
        sortOrder: 2,
      },
    ],
  },
};
export const OverviewRawNames: Story = {
  name: "Обзор — названия без пробелов и длинные порции",
  render: renderOverview,
  args: {
    categories: [
      {
        ...category,
        name: "ОченьДлинноеНазваниеКатегорииБезПробеловДляПроверкиПереносаВКонтейнере",
      },
    ],
    expandedCategoryIds: new Set([category.id]),
    products: [
      {
        ...product,
        name: "ОченьДлинноеНазваниеНапиткаБезПробеловКотороеЧитаетсяЦеликом",
        price: null,
        priceChoices: [
          {
            id: "second",
            portionLabel:
              "Чайник с дополнительным настоем для большой компании · 1200 мл",
            price: 750,
            sortOrder: 2,
            isAvailable: false,
          },
          {
            id: "first",
            portionLabel: "ОченьДлинноеНазваниеПорцииБезПробеловПолностью",
            price: 0,
            sortOrder: 0,
            isAvailable: true,
          },
          {
            id: "middle",
            portionLabel: "Большая чашка · 450 мл",
            price: 390,
            sortOrder: 1,
            isAvailable: true,
          },
        ],
      },
    ],
    modifierGroups: [
      {
        ...modifierGroup,
        name: "ОченьДлинноеНазваниеГруппыДобавокБезПробеловПолностью",
        options: [
          {
            ...modifierGroup.options[0]!,
            id: "paid",
            name: "Дополнительная порция",
            priceDelta: 60,
            sortOrder: 2,
          },
          {
            ...modifierGroup.options[0]!,
            id: "free",
            name: "ОченьДлинноеНазваниеОпцииБезПробеловПолностью",
            priceDelta: 0,
            isDefault: true,
            sortOrder: 0,
          },
          {
            ...modifierGroup.options[0]!,
            id: "negative",
            name: "Без молока",
            priceDelta: -20,
            sortOrder: 1,
          },
        ],
      },
    ],
  },
};
export const OverviewModifiersOnly: Story = {
  name: "Обзор — только группы добавок",
  render: renderOverview,
  args: { categories: [], products: [], expandedCategoryIds: new Set() },
};
export const OverviewEmptyModifierGroup: Story = {
  name: "Обзор — пустая группа добавок",
  render: renderOverview,
  args: { modifierGroups: [{ ...modifierGroup, options: [] }] },
};

import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { shallowRef } from "vue";
import { createNavigationItems } from "../../../src/app/navigation";
import AvailabilityScreen from "../../../src/pages/admin/availability/AvailabilityScreen.vue";
import { AVAILABILITY_ALL_CATEGORY } from "../../../src/pages/admin/availability/AvailabilityScreen.constants";
import AdminShell from "../../../src/widgets/admin-shell/AdminShell.vue";
import { availabilityItems } from "../../fixtures/catalog";

const items = createNavigationItems("administrator");
const meta = {
  title: "Экраны/Доступность",
  id: "screens-availability",
  component: AvailabilityScreen,
  args: {
    groups: [
      {
        id: "coffee",
        name: "Кофе",
        sortOrder: 0,
        items: [
          availabilityItems[0]!,
          {
            id: "latte",
            label: "Латте",
            sublabel: "Несколько размеров",
            type: "product",
            isAvailable: true,
          },
          {
            id: "espresso",
            label: "Эспрессо",
            sublabel: "150 ₽",
            type: "product",
            isAvailable: true,
          },
        ],
      },
      {
        id: "pastry",
        name: "Выпечка",
        sortOrder: 1,
        items: [
          {
            id: "croissant",
            label: "Круассан",
            sublabel: "160 ₽",
            type: "product",
            isAvailable: true,
          },
        ],
      },
      {
        id: "milk",
        name: "Добавки",
        sortOrder: 2,
        items: [availabilityItems[1]!],
      },
    ],
    intake: { acceptsNewOrders: true, updatedAt: null, updatedByLabel: null },
    loading: false,
    saving: false,
    search: "",
    activeCategory: AVAILABILITY_ALL_CATEGORY,
  },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof AvailabilityScreen>;
export default meta;
type Story = StoryObj<typeof meta>;
function render(args: Story["args"]) {
  return {
    components: { AdminShell, AvailabilityScreen },
    setup: () => ({
      args,
      items,
      search: shallowRef(args.search),
      activeCategory: shallowRef(args.activeCategory),
      intake: shallowRef(args.intake),
      groups: shallowRef(
        args.groups.map((group) => ({
          ...group,
          items: group.items.map((item) => ({ ...item })),
        })),
      ),
    }),
    template: `<AdminShell role="administrator" active-section="availability" :items="items">
      <AvailabilityScreen v-bind="args" :groups="groups" :intake="intake" :search="search" :active-category="activeCategory"
        @update:search="search = $event" @update:active-category="activeCategory = $event"
        @intake-change="intake = { ...intake, acceptsNewOrders: $event }"
        @availability-change="(item, value) => groups = groups.map(group => ({ ...group, items: group.items.map(current => current.id === item.id && current.type === item.type ? { ...current, isAvailable: value } : current) }))" />
    </AdminShell>`,
  };
}
export const Ready: Story = {
  name: "Готово",
  render,
  globals: { viewport: "desktop" },
};
export const ReadyMobile: Story = {
  name: "Мобильный вид",
  render,
  globals: { viewport: "mobile" },
};
export const Loading: Story = {
  name: "Загрузка",
  render,
  args: { loading: true, intake: null, groups: [] },
};
export const Empty: Story = { name: "Пусто", render, args: { groups: [] } };
export const FilteredEmpty: Story = {
  name: "Нет совпадений",
  render,
  args: { search: "Несуществующий" },
};
export const Saving: Story = {
  name: "Сохранение",
  render,
  args: { saving: true },
};

export const LongNames: Story = {
  name: "Длинные названия",
  render,
  args: {
    groups: [
      {
        id: "long",
        name: "Кофейные напитки с авторскими добавками и альтернативным молоком",
        sortOrder: 0,
        items: [
          {
            id: "long",
            type: "product",
            label: "Капучино с овсяным молоком и карамельным сиропом",
            sublabel:
              "Большой стакан · 450 мл · 390 ₽ · доступен без дополнительного сахара",
            isAvailable: true,
          },
        ],
      },
      {
        id: "unbroken",
        name: "ОченьДлинноеНазваниеКатегорииБезПробеловДляПроверкиПереносаТекста",
        sortOrder: 1,
        items: [
          {
            id: "unbroken",
            type: "modifier",
            label: "ОченьДлинноеНазваниеДобавкиБезПробеловДляПроверкиПереноса",
            sublabel: "Дополнительная порция",
            isAvailable: false,
          },
        ],
      },
    ],
  },
};
export const ManyCategories: Story = {
  name: "Много категорий и позиций",
  render,
  args: {
    groups: Array.from({ length: 12 }, (_, index) => ({
      id: `category-${index}`,
      name: `Категория ${index + 1}`,
      sortOrder: index,
      items: Array.from({ length: 4 }, (_, itemIndex) => ({
        id: `${index}-${itemIndex}`,
        type: "product" as const,
        label: `Позиция ${index + 1}.${itemIndex + 1}`,
        sublabel: "250 мл · 250 ₽",
        isAvailable: true,
      })),
    })),
  },
};
export const IntakeClosed: Story = {
  name: "Приём закрыт",
  render,
  args: {
    groups: [],
    intake: { acceptsNewOrders: false, updatedAt: null, updatedByLabel: null },
  },
};
export const IntakeAudit: Story = {
  name: "История приёма",
  render,
  args: {
    groups: [],
    intake: {
      acceptsNewOrders: false,
      updatedAt: "2026-10-08T01:00:00+03:00",
      updatedByLabel: "Александра Константиновна администратор утренней смены",
    },
  },
};
export const IntakeUnknownEmployee: Story = {
  name: "Неизвестный сотрудник",
  render,
  args: {
    groups: [],
    intake: {
      acceptsNewOrders: true,
      updatedAt: "2026-10-08T01:00:00+03:00",
      updatedByLabel: null,
    },
  },
};
export const IntakeUnresolved: Story = {
  name: "Приём ещё не получен",
  render,
  args: { intake: null },
};
export const MixedEntities: Story = {
  name: "Товар, размер и общая добавка",
  render,
  args: {
    groups: [
      {
        id: "coffee",
        name: "Кофе",
        sortOrder: 0,
        items: [
          {
            id: "shared",
            type: "product",
            label: "Капучино",
            sublabel: "Несколько размеров",
            isAvailable: true,
          },
          {
            id: "portion",
            type: "priceChoice",
            label: "Капучино · большой",
            sublabel: "450 мл · 390 ₽",
            isAvailable: true,
          },
          {
            id: "shared",
            type: "modifier",
            label: "Овсяное молоко",
            sublabel: "Добавка · 60 ₽",
            isAvailable: false,
          },
        ],
      },
      {
        id: "tea",
        name: "Чай",
        sortOrder: 1,
        items: [
          {
            id: "tea",
            type: "product",
            label: "Чай латте",
            sublabel: "300 мл · 290 ₽",
            isAvailable: true,
          },
          {
            id: "shared",
            type: "modifier",
            label: "Овсяное молоко",
            sublabel: "Добавка · 60 ₽",
            isAvailable: false,
          },
        ],
      },
    ],
  },
};

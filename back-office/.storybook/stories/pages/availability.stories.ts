import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { shallowRef } from "vue";
import { createNavigationItems } from "../../../src/app/navigation";
import AvailabilityScreen from "../../../src/pages/admin/availability/AvailabilityScreen.vue";
import { AVAILABILITY_ALL_CATEGORY } from "../../../src/pages/admin/availability/AvailabilityScreen.constants";
import AdminShell from "../../../src/widgets/admin-shell/AdminShell.vue";
import { availabilityItems } from "../../fixtures/catalog";

const items = createNavigationItems("administrator");
const meta = {
  title: "Screens/Availability",
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
        @availability-change="(item, value) => groups = groups.map(group => ({ ...group, items: group.items.map(current => current.id === item.id ? { ...current, isAvailable: value } : current) }))" />
    </AdminShell>`,
  };
}
export const Ready: Story = { render, globals: { viewport: "desktop" } };
export const ReadyMobile: Story = { render, globals: { viewport: "mobile" } };
export const Loading: Story = {
  render,
  args: { loading: true, intake: null, groups: [] },
};
export const Empty: Story = { render, args: { groups: [] } };
export const FilteredEmpty: Story = {
  render,
  args: { search: "Несуществующий" },
};
export const Saving: Story = { render, args: { saving: true } };

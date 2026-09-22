import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { shallowRef } from "vue";
import type {
  AvailabilityItem,
  ServiceIntake,
} from "../../../src/shared/api/availability.api.types";
import AvailabilityScreen from "../../../src/pages/admin/availability/AvailabilityScreen.vue";
import { availabilityItems } from "../../fixtures/catalog";

const meta = {
  title: "Features/Availability/AvailabilityScreen",
  component: AvailabilityScreen,
  args: {
    groups: [
      { id: "coffee", name: "Кофе", sortOrder: 0, items: availabilityItems },
    ],
    intake: { acceptsNewOrders: true, updatedAt: null, updatedByLabel: null },
    loading: false,
    saving: false,
  },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof AvailabilityScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

function render(args: Story["args"]) {
  return {
    components: { AvailabilityScreen },
    setup: () => {
      const groups = shallowRef(
        args.groups.map((group) => ({
          ...group,
          items: group.items.map((item) => ({ ...item })),
        })),
      );
      const intake = shallowRef<ServiceIntake | null>(args.intake);
      const search = shallowRef(args.search);
      const activeCategory = shallowRef(args.activeCategory);

      function updateAvailability(
        item: AvailabilityItem,
        isAvailable: boolean,
      ) {
        groups.value = groups.value.map((group) => ({
          ...group,
          items: group.items.map((current) =>
            current.id === item.id ? { ...current, isAvailable } : current,
          ),
        }));
      }

      function updateIntake(acceptsNewOrders: boolean) {
        if (intake.value === null) return;

        intake.value = { ...intake.value, acceptsNewOrders };
      }

      return {
        activeCategory,
        args,
        groups,
        intake,
        search,
        updateAvailability,
        updateIntake,
      };
    },
    template: `
      <AvailabilityScreen
        v-bind="args"
        :active-category="activeCategory"
        :groups="groups"
        :intake="intake"
        :search="search"
        @availability-change="updateAvailability"
        @intake-change="updateIntake"
        @update:active-category="activeCategory = $event"
        @update:search="search = $event"
      />
    `,
  };
}

export const Ready: Story = { render };
export const Loading: Story = { args: { loading: true }, render };
export const Empty: Story = { args: { groups: [] }, render };
export const FilteredEmpty: Story = {
  args: { search: "Несуществующий" },
  render,
};
export const Saving: Story = { args: { saving: true }, render };

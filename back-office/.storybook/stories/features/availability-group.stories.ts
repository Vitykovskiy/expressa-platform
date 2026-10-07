import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { shallowRef } from "vue";
import type { AvailabilityItem } from "../../../src/shared/api/availability.api.types";
import AvailabilityGroup from "../../../src/pages/admin/availability/AvailabilityGroup.vue";
import { availabilityItems } from "../../fixtures/catalog";

const meta = {
  title: "Бизнес компоненты/Доступность/Группа позиций",
  id: "features-availability-availabilitygroup",
  component: AvailabilityGroup,
  args: { category: "Кофе", items: availabilityItems },
} satisfies Meta<typeof AvailabilityGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

function render(args: Story["args"]) {
  return {
    components: { AvailabilityGroup },
    setup: () => {
      const items = shallowRef(args.items.map((item) => ({ ...item })));

      function updateAvailability(
        item: AvailabilityItem,
        isAvailable: boolean,
      ) {
        items.value = items.value.map((current) =>
          current.id === item.id ? { ...current, isAvailable } : current,
        );
      }

      return { args, items, updateAvailability };
    },
    template:
      '<AvailabilityGroup v-bind="args" :items="items" @availability-change="updateAvailability" />',
  };
}

export const Default: Story = { name: "Обычное состояние", render };
export const Disabled: Story = {
  name: "Недоступно",
  args: { disabled: true },
  render,
};

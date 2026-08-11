import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { shallowRef } from "vue";
import { VApp } from "vuetify/components";

import FilterTabs from "../../../../src/shared/ui/admin/filter-tabs/FilterTabs.vue";
import ToggleRow from "../../../../src/shared/ui/admin/toggle-row/ToggleRow.vue";

const filterItems = [
  { value: "all", label: "Все" },
  { value: "created", label: "Созданные" },
  { value: "confirmed", label: "Подтверждённые" },
] as const;

type FilterValue = (typeof filterItems)[number]["value"];

const meta = {
  title: "Admin/Shared/Controls",
  parameters: {
    layout: "padded",
  },
  argTypes: {
    onUpdateModelValue: { action: "update:modelValue" },
    items: { table: { disable: true } },
    label: { table: { disable: true } },
    sublabel: { table: { disable: true } },
    disabled: { table: { disable: true } },
    modelValue: { table: { disable: true } },
  },
} satisfies Meta;

export default meta;

type FilterTabsStory = StoryObj<{
  onUpdateModelValue: (value: FilterValue) => void;
}>;

type ToggleRowStory = StoryObj<{
  onUpdateModelValue: (value: boolean) => void;
}>;

type Story = StoryObj;

export const FilterTabsControlled: FilterTabsStory = {
  args: {
    onUpdateModelValue: fn<(value: FilterValue) => void>(),
  },
  render: (args) => ({
    components: { FilterTabs, VApp },
    setup() {
      const selected = shallowRef<FilterValue>("all");

      function updateSelected(value: FilterValue) {
        selected.value = value;
        args.onUpdateModelValue(value);
      }

      return { filterItems, selected, updateSelected };
    },
    template: `
      <v-app>
        <filter-tabs
          :items="filterItems"
          :model-value="selected"
          @update:model-value="updateSelected"
        />
      </v-app>
    `,
  }),
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const createdTab = canvas.getByRole("button", { name: "Созданные" });

    createdTab.focus();
    await userEvent.keyboard("{Enter}");

    await expect(createdTab).toHaveAttribute("aria-pressed", "true");
    await expect(args.onUpdateModelValue).toHaveBeenCalledWith("created");
  },
};

export const ToggleRowControlled: ToggleRowStory = {
  args: {
    onUpdateModelValue: fn<(value: boolean) => void>(),
  },
  render: (args) => ({
    components: { ToggleRow, VApp },
    setup() {
      const available = shallowRef(false);
      function updateAvailable(value: boolean) {
        available.value = value;
        args.onUpdateModelValue(value);
      }

      return { available, updateAvailable };
    },
    template: `
      <v-app>
        <toggle-row
          id="cappuccino"
          label="Капучино"
          sublabel="Несколько размеров"
          :model-value="available"
          @update:model-value="updateAvailable"
        />
      </v-app>
    `,
  }),
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole("switch", { name: "Капучино" });

    await userEvent.click(toggle);

    await expect(toggle).toBeChecked();
    await expect(args.onUpdateModelValue).toHaveBeenCalledWith(true);
  },
};

export const ToggleRowDisabled: ToggleRowStory = {
  args: {
    onUpdateModelValue: fn<(value: boolean) => void>(),
  },
  render: (args) => ({
    components: { ToggleRow, VApp },
    setup() {
      const available = shallowRef(false);
      function updateAvailable(value: boolean) {
        available.value = value;
        args.onUpdateModelValue(value);
      }

      return { available, updateAvailable };
    },
    template: `
      <v-app>
        <toggle-row
          id="disabled-cappuccino"
          label="Капучино"
          sublabel="Временно недоступен"
          disabled
          :model-value="available"
          @update:model-value="updateAvailable"
        />
      </v-app>
    `,
  }),
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole("switch", { name: "Капучино" });

    await expect(toggle).toBeDisabled();
    await expect(toggle).not.toBeChecked();
    await expect(args.onUpdateModelValue).not.toHaveBeenCalled();
  },
};

export const LongLabel: Story = {
  render: () => ({
    components: { ToggleRow, VApp },
    setup() {
      const available = shallowRef(true);

      return { available };
    },
    template: `
      <v-app>
        <toggle-row
          id="long-label"
          label="Капучино с безлактозным молоком и дополнительной карамельной пенкой"
          sublabel="Несколько размеров и добавок"
          v-model="available"
        />
      </v-app>
    `,
  }),
};

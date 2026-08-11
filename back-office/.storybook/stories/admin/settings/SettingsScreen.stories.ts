import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { shallowRef } from "vue";

import { createSettingsFixture } from "../fixtures";
import type { Settings } from "../../../../src/shared/ui/admin/Admin.types";
import SettingsScreen from "../../../../src/pages/admin/settings/SettingsScreen.vue";

const meta = {
  title: "Admin/Settings/SettingsScreen",
  component: SettingsScreen,
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    settings: { control: "object" },
    onSave: { action: "save" },
  },
} satisfies Meta<typeof SettingsScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

function render(args: Story["args"]) {
  return {
    components: { SettingsScreen },
    setup() {
      const currentSettings = shallowRef<Settings>({ ...args.settings });

      function save(nextSettings: Settings) {
        currentSettings.value = { ...nextSettings };
        args?.onSave?.(nextSettings);
      }

      return { currentSettings, save };
    },
    template: '<SettingsScreen :settings="currentSettings" @save="save" />',
  };
}

export const InitialValues: Story = {
  args: {
    settings: createSettingsFixture(),
    onSave: () => undefined,
  },
  render,
};

export const EditAndSaveWithKeyboard: Story = {
  args: {
    settings: createSettingsFixture(),
    onSave: () => undefined,
  },
  render,
};

export const LongContentNarrow: Story = {
  args: {
    settings: {
      workingHoursOpen: "00:00",
      workingHoursClose: "23:59",
      slotCapacity: 50,
    },
    onSave: () => undefined,
  },
  parameters: {
    viewport: { defaultViewport: "mobile1" },
  },
  render,
};

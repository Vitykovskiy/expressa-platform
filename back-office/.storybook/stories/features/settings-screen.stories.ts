import type { Meta, StoryObj } from "@storybook/vue3-vite";
import SettingsScreen from "../../../src/pages/admin/settings/SettingsScreen.vue";
const meta = {
  title: "Features/Settings/SettingsScreen",
  component: SettingsScreen,
  args: {
    settings: {
      workingHoursOpen: "08:00",
      workingHoursClose: "20:00",
      slotCapacity: 10,
    },
  },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof SettingsScreen>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const EveningSchedule: Story = {
  args: {
    settings: {
      workingHoursOpen: "12:00",
      workingHoursClose: "23:00",
      slotCapacity: 4,
    },
  },
};

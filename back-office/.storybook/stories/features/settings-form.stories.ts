import type { Meta, StoryObj } from "@storybook/vue3-vite";
import SettingsForm from "../../../src/pages/admin/settings/SettingsForm.vue";
const meta = {
  title: "Features/Settings/SettingsForm",
  component: SettingsForm,
  args: {
    settings: {
      workingHoursOpen: "08:00",
      workingHoursClose: "20:00",
      slotCapacity: 10,
    },
  },
} satisfies Meta<typeof SettingsForm>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Evening: Story = {
  args: {
    settings: {
      workingHoursOpen: "12:00",
      workingHoursClose: "23:00",
      slotCapacity: 4,
    },
  },
};

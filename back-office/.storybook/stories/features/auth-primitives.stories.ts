import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { shallowRef } from "vue";
import PhoneStep from "../../../src/pages/admin/auth/PhoneStep.vue";

const meta = {
  title: "Features/Authentication/PhoneStep",
  component: PhoneStep,
  args: { phone: "", error: "", valid: false },
} satisfies Meta<typeof PhoneStep>;

export default meta;
type Story = StoryObj<typeof meta>;

function render(args: Story["args"]) {
  return {
    components: { PhoneStep },
    setup: () => ({ args, phone: shallowRef(args.phone) }),
    template:
      '<PhoneStep v-bind="args" :phone="phone" @update:phone="phone = $event" />',
  };
}

export const Default: Story = { render };
export const Error: Story = {
  args: { error: "Введите номер полностью" },
  render,
};

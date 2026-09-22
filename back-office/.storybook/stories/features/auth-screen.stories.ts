import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { shallowRef } from "vue";
import AuthScreen from "../../../src/pages/admin/auth/AuthScreen.vue";

const meta = {
  title: "Features/Authentication/AuthScreen",
  component: AuthScreen,
  args: {
    state: "phone",
    phone: "",
    phoneValid: false,
    otp: "",
    otpValid: false,
    error: "",
    otpMetadata: null,
    resendRemainingSeconds: 0,
  },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof AuthScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

function render(args: Story["args"]) {
  return {
    components: { AuthScreen },
    setup: () => ({
      args,
      phone: shallowRef(args.phone),
      otp: shallowRef(args.otp),
    }),
    template:
      '<AuthScreen v-bind="args" :otp="otp" :phone="phone" @update:otp="otp = $event" @update:phone="phone = $event" />',
  };
}

export const Phone: Story = { render };
export const PhoneError: Story = {
  args: { error: "Введите номер полностью" },
  render,
};
export const Otp: Story = {
  args: {
    state: "otp",
    phone: "+7 900 000-00-00",
    otpMetadata: { expiresInSeconds: 300, retryAfterSeconds: 60 },
  },
  render,
};
export const Loading: Story = { args: { state: "loading" }, render };
export const Denied: Story = {
  args: { state: "denied", error: "У вас нет доступа" },
  render,
};

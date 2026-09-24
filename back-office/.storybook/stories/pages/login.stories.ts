import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { computed, shallowRef } from "vue";
import AuthScreen from "../../../src/pages/admin/auth/AuthScreen.vue";
import {
  loginOtpLength,
  loginPhoneDigitsLength,
} from "../../../src/pages/LoginPage.constants";

const meta = {
  title: "Screens/Login",
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
    setup: () => {
      const phone = shallowRef(args.phone);
      const otp = shallowRef(args.otp);
      return {
        args,
        phone,
        otp,
        phoneValid: computed(
          () =>
            phone.value.replace(/\D/g, "").length === loginPhoneDigitsLength,
        ),
        otpValid: computed(() => otp.value.length === loginOtpLength),
      };
    },
    template:
      '<AuthScreen v-bind="args" :phone="phone" :otp="otp" :phone-valid="phoneValid" :otp-valid="otpValid" @update:phone="phone = $event" @update:otp="otp = $event" />',
  };
}
export const Phone: Story = { render, globals: { viewport: "desktop" } };
export const PhoneMobile: Story = { render, globals: { viewport: "mobile" } };
export const Otp: Story = {
  render,
  args: {
    state: "otp",
    phone: "+7 900 000-00-00",
    otpMetadata: { expiresInSeconds: 300, retryAfterSeconds: 60 },
    resendRemainingSeconds: 60,
  },
  globals: { viewport: "desktop" },
};
export const OtpMobile: Story = { ...Otp, globals: { viewport: "mobile" } };
export const PhoneError: Story = {
  render,
  args: { error: "Введите номер полностью" },
};
export const Denied: Story = {
  render,
  args: { state: "denied", error: "У вас нет доступа" },
};

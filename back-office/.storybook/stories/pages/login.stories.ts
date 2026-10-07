import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { computed, shallowRef } from "vue";
import AuthScreen from "../../../src/pages/admin/auth/AuthScreen.vue";
import {
  loginOtpLength,
  loginPhoneDigitsLength,
} from "../../../src/pages/LoginPage.constants";

const meta = {
  title: "Экраны/Вход",
  id: "screens-login",
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
export const Phone: Story = {
  name: "Ввод телефона",
  render,
  globals: { viewport: "desktop" },
};
export const PhoneMobile: Story = {
  name: "Телефон — мобильный вид",
  render,
  globals: { viewport: "mobile" },
};
export const Otp: Story = {
  name: "Ввод кода",
  render,
  args: {
    state: "otp",
    phone: "+7 900 000-00-00",
    otpMetadata: { expiresInSeconds: 300, retryAfterSeconds: 60 },
    resendRemainingSeconds: 60,
  },
  globals: { viewport: "desktop" },
};
export const OtpMobile: Story = {
  ...Otp,
  name: "Код — мобильный вид",
  globals: { viewport: "mobile" },
};
export const PhoneError: Story = {
  name: "Ошибка телефона",
  render,
  args: { error: "Введите номер полностью" },
};
export const Denied: Story = {
  name: "Нет доступа",
  render,
  args: { state: "denied", error: "У вас нет доступа" },
};

export const Loading: Story = {
  name: "Загрузка",
  args: { state: "loading" },
  render,
};

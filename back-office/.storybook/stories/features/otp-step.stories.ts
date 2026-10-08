import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { computed, shallowRef } from "vue";
import AuthScreen from "../../../src/pages/admin/auth/AuthScreen.vue";
import OtpStep from "../../../src/pages/admin/auth/OtpStep.vue";
import { loginOtpLength } from "../../../src/pages/LoginPage.constants";
const meta = {
  title: "Бизнес компоненты/Вход/Ввод кода",
  id: "features-authentication-otpstep",
  component: OtpStep,
  args: {
    phone: "+7 900 000-00-00",
    otp: "",
    error: "",
    expiresInSeconds: 300,
    resendRemainingSeconds: 60,
    valid: false,
  },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof OtpStep>;
export default meta;
type Story = StoryObj<typeof meta>;
function render(args: Story["args"]) {
  return {
    components: { AuthScreen },
    setup: () => {
      const otp = shallowRef(args.otp);
      const valid = computed(() => otp.value.length === loginOtpLength);
      function updateOtp(value: string) {
        otp.value = value;
        args["onUpdate:otp"]?.(value);
      }
      return { args, otp, valid, updateOtp };
    },
    template: `
      <AuthScreen
        state="otp"
        :phone="args.phone"
        :phone-valid="false"
        :otp="otp"
        :otp-valid="valid"
        :error="args.error"
        :otp-metadata="{ expiresInSeconds: args.expiresInSeconds, retryAfterSeconds: args.resendRemainingSeconds }"
        :resend-remaining-seconds="args.resendRemainingSeconds"
        @update:otp="updateOtp"
        @verify-otp="args.onSubmit?.()"
        @resend-otp="args.onResend?.()"
        @change-phone="args.onChangePhone?.()"
      />
    `,
  };
}
export const Waiting: Story = { name: "Ожидание кода", render };
export const ErrorAndResend: Story = {
  name: "Ошибка и повторная отправка",
  args: {
    otp: "123456",
    error: "Код неверный",
    expiresInSeconds: 0,
    resendRemainingSeconds: 0,
    valid: true,
  },
  render,
};

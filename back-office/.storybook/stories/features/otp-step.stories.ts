import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { computed, shallowRef } from "vue";
import OtpStep from "../../../src/pages/admin/auth/OtpStep.vue";
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
} satisfies Meta<typeof OtpStep>;
export default meta;
type Story = StoryObj<typeof meta>;
function render(args: Story["args"]) {
  return {
    components: { OtpStep },
    setup: () => {
      const otp = shallowRef(args.otp);
      const valid = computed(() => otp.value.length === 6);
      return { args, otp, valid };
    },
    template: `
      <OtpStep
        v-bind="args"
        v-model:otp="otp"
        :valid="valid"
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

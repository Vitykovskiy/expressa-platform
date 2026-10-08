import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { computed, shallowRef } from "vue";
import AuthScreen from "../../../src/pages/admin/auth/AuthScreen.vue";
import PhoneStep from "../../../src/pages/admin/auth/PhoneStep.vue";
import { loginPhoneDigitsLength } from "../../../src/pages/LoginPage.constants";

const meta = {
  title: "Бизнес компоненты/Вход/Ввод телефона",
  id: "features-authentication-phonestep",
  component: PhoneStep,
  args: { phone: "", error: "", valid: false },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof PhoneStep>;

export default meta;
type Story = StoryObj<typeof meta>;

function render(args: Story["args"]) {
  return {
    components: { AuthScreen },
    setup: () => {
      const phone = shallowRef(args.phone);
      const phoneValid = computed(
        () => phone.value.replace(/\D/g, "").length === loginPhoneDigitsLength,
      );
      function updatePhone(value: string) {
        phone.value = value;
        args["onUpdate:phone"]?.(value);
      }
      return { args, phone, phoneValid, updatePhone };
    },
    template: `
      <AuthScreen
        state="phone"
        :phone="phone"
        :phone-valid="phoneValid"
        :error="args.error"
        otp=""
        :otp-valid="false"
        :otp-metadata="null"
        :resend-remaining-seconds="0"
        @update:phone="updatePhone"
        @request-otp="args.onSubmit?.()"
      />
    `,
  };
}

export const Default: Story = { name: "Обычное состояние", render };
export const Error: Story = {
  name: "Ошибка ввода",
  args: { error: "Введите номер полностью" },
  render,
};

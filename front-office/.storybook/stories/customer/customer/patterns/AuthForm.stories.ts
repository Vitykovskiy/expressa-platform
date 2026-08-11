import type { Meta, StoryObj } from "@storybook/vue3-vite";
import AuthForm from "@/features/auth/AuthForm.vue";
import type { AuthState } from "@/entities/customer/model/customer.types";

type AuthFormStoryArgs = {
  state: AuthState;
  onSendCode: () => void;
  onUpdateOtp: (otp: string) => void;
  onVerifyOtp: (otp: string) => void;
};

const meta = {
  title: "Components/Patterns/AuthForm",
  component: AuthForm,
  args: {
    state: {
      step: "phone",
      phone: "+7 (900) 123-45-67",
      name: "",
      errorMessage: "",
      verified: false,
    },
    onSendCode: () => undefined,
    onUpdateOtp: () => undefined,
    onVerifyOtp: () => undefined,
  },
  argTypes: {
    state: { control: "object" },
    onSendCode: { action: "sendCode" },
    onUpdateOtp: { action: "updateOtp" },
    onVerifyOtp: { action: "verifyOtp" },
  },
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Форма подтверждения телефона. Контракт: state и события updatePhone, sendCode, updateOtp, verifyOtp, updateName, submitName, backToPhone; владелец меняет шаг и проверяет код. Рендерит phone, otp и register; ошибка OTP выводится внутри otp. Повторная отправка очищает локальный OTP и вызывает sendCode; loading блокирует действие. Accessibility: поля телефона и имени имеют внешние связанные подписи; ошибка OTP использует alert. Источник: src/features/auth/AuthForm.vue.",
      },
    },
  },
  render: (args) => ({
    components: { AuthForm },
    setup: () => ({ args }),
    template:
      '<AuthForm :state="args.state" @send-code="args.onSendCode" @update-otp="args.onUpdateOtp" @verify-otp="args.onVerifyOtp" />',
  }),
} satisfies Meta<AuthFormStoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Phone: Story = {};

export const Otp: Story = {
  args: {
    state: {
      step: "otp",
      phone: "+7 (900) 123-45-67",
      name: "",
      errorMessage: "",
      verified: false,
    },
  },
};

export const OtpError: Story = {
  args: {
    state: {
      step: "otp",
      phone: "+7 (900) 123-45-67",
      name: "",
      errorMessage: "Код неверный или истёк",
      verified: false,
    },
  },
};

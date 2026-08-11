import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { computed, shallowRef } from "vue";
import AuthScreen from "@/features/auth/AuthScreen.vue";
import type { AuthState } from "@/entities/customer/model/customer.types";

type AuthStoryArgs = {
  step: AuthState["step"];
  phone: string;
  name: string;
  errorMessage: string;
  onUpdatePhone: (value: string) => void;
  onSendCode: () => void;
  onUpdateOtp: (value: string) => void;
  onVerifyOtp: (value: string) => void;
  onUpdateName: (value: string) => void;
  onSubmitName: () => void;
  onBackToPhone: () => void;
  onContinue: () => void;
};
function state(args: AuthStoryArgs): AuthState {
  return {
    step: args.step,
    phone: args.phone,
    name: args.name,
    errorMessage: args.errorMessage,
    verified: args.step === "success",
  };
}

const meta = {
  title: "Customer/Screens/Auth",
  component: AuthScreen,
  args: {
    step: "phone",
    phone: "+7 (900) 123-45-67",
    name: "",
    errorMessage: "",
    onUpdatePhone: () => undefined,
    onSendCode: () => undefined,
    onUpdateOtp: () => undefined,
    onVerifyOtp: () => undefined,
    onUpdateName: () => undefined,
    onSubmitName: () => undefined,
    onBackToPhone: () => undefined,
    onContinue: () => undefined,
  },
  argTypes: {
    state: { control: false, table: { disable: true } },
    step: {
      control: "select",
      options: ["phone", "otp", "loading", "register", "success"],
      description: "Текущее явное состояние auth flow.",
    },
    phone: {
      control: "text",
      description: "Телефон; для отправки нужно не менее 10 цифр.",
    },
    name: {
      control: "text",
      description: "Имя; для отправки нужно минимум 2 символа.",
    },
    errorMessage: { control: "text", description: "Текст ошибки OTP." },
    onUpdatePhone: { action: "updatePhone" },
    onSendCode: { action: "sendCode" },
    onUpdateOtp: { action: "updateOtp" },
    onVerifyOtp: { action: "verifyOtp" },
    onUpdateName: { action: "updateName" },
    onSubmitName: { action: "submitName" },
    onBackToPhone: { action: "backToPhone" },
    onContinue: { action: "continue" },
  },
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Назначение: экран подтверждения телефона Customer. Используйте как screen recipe auth flow; не используйте как переиспользуемое поле. Public props: step, phone, name, errorMessage, verified; actions соответствуют emits AuthScreen; slots отсутствуют. Состояния: Phone, Otp, Loading, Register, Success; ошибка OTP выводится внутри Otp. Повторная отправка очищает локальный OTP и вызывает sendCode; loading подавляет действия. Валидация источника: phone — не менее 10 цифр, OTP — ровно 6 цифр, name — минимум 2 символа. Accessibility: поля телефона и имени имеют внешние связанные подписи; ошибка OTP использует alert, loading — один status с progressbar. Экран mobile-first и занимает доступную ширину. Render adapter строит AuthState только для AuthScreen; state не является public control. Источник: src/features/auth/AuthScreen.vue, .storybook/stories/customer/Auth.stories.ts.",
      },
    },
  },
  tags: ["autodocs"],
  render: (args) => ({
    components: { AuthScreen },
    setup: () => {
      const phone = shallowRef(args.phone);
      const name = shallowRef(args.name);
      const screenState = computed(() =>
        state({ ...args, phone: phone.value, name: name.value }),
      );
      function updatePhone(value: string) {
        phone.value = value;
        args.onUpdatePhone(value);
      }
      function updateOtp(value: string) {
        args.onUpdateOtp(value);
      }
      function updateName(value: string) {
        name.value = value;
        args.onUpdateName(value);
      }
      return { args, screenState, updateName, updateOtp, updatePhone };
    },
    template:
      '<AuthScreen :state="screenState" @update-phone="updatePhone" @send-code="args.onSendCode" @update-otp="updateOtp" @verify-otp="args.onVerifyOtp" @update-name="updateName" @submit-name="args.onSubmitName" @back-to-phone="args.onBackToPhone" @continue="args.onContinue" />',
  }),
} satisfies Meta<AuthStoryArgs & { state?: never }>;
export default meta;
type Story = StoryObj<AuthStoryArgs>;
export const Phone: Story = {};

export const PhoneVisual: Story = {
  args: Phone.args,
};

export const Otp: Story = {
  args: { step: "otp", phone: "+7 (900) 123-45-67" },
};
export const Loading: Story = {
  args: { step: "loading" },
};

export const LoadingVisual: Story = {
  args: Loading.args,
};

export const Register: Story = {
  args: { step: "register", name: "Анна" },
};
export const OtpError: Story = {
  args: {
    step: "otp",
    phone: "+7 (900) 123-45-67",
    errorMessage: "Код неверный или истёк",
  },
};

export const OtpErrorVisual: Story = {
  args: OtpError.args,
};

export const Success: Story = {
  args: { step: "success", phone: "+7 (900) 123-45-67", name: "Клиент" },
};
export const InvalidPhone: Story = {
  args: {
    phone: "+7 (900) 12",
    errorMessage: "Номер неполный: введите 10 цифр после +7.",
  },
};
export const PhoneNineDigits: Story = {
  args: { phone: "790012345" },
};
export const PhoneTenDigits: Story = {
  args: { phone: "7900123456" },
};
export const ShortOtp: Story = {
  args: { step: "otp", phone: "+7 (900) 123-45-67" },
};
export const ShortName: Story = {
  args: { step: "register", name: " A " },
};

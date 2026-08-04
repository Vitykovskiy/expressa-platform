import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { computed, shallowRef } from "vue";
import { expect, fn, userEvent, within } from "storybook/test";
import AuthScreen from "../../customer/pages/auth/AuthScreen.vue";
import type { AuthState } from "../../customer/shared/model/customer.types";

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
    onUpdatePhone: fn(),
    onSendCode: fn(),
    onUpdateOtp: fn(),
    onVerifyOtp: fn(),
    onUpdateName: fn(),
    onSubmitName: fn(),
    onBackToPhone: fn(),
    onContinue: fn(),
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
          "Назначение: экран подтверждения телефона Customer. Используйте как screen recipe auth flow; не используйте как переиспользуемое поле. Public props: step, phone, name, errorMessage, verified; actions соответствуют emits AuthScreen; slots отсутствуют. Состояния: Phone, Otp, Loading, Register, Success; ошибка OTP выводится внутри Otp. Повторная отправка очищает локальный OTP и вызывает sendCode; loading подавляет действия. Валидация источника: phone — не менее 10 цифр, OTP — ровно 6 цифр, name — минимум 2 символа. Accessibility: поля телефона и имени имеют внешние связанные подписи; ошибка OTP использует alert, loading — один status с progressbar. Экран mobile-first и занимает доступную ширину. Render adapter строит AuthState только для AuthScreen; state не является public control. Источник: src/customer/pages/auth/AuthScreen.vue, src/stories/customer/Auth.stories.ts.",
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
export const Phone: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const phone = canvas.getByRole("textbox", { name: "Номер телефона" });

    await expect(phone).toHaveAttribute("id", "auth-phone");
    await expect(phone).toHaveAttribute("placeholder", "+7 (___) ___-__-__");
    await userEvent.click(phone);
    await expect(phone).toHaveFocus();
    await userEvent.click(
      canvas.getByRole("button", { name: "Отправить код" }),
    );
    await expect(args.onSendCode).toHaveBeenCalledTimes(1);
  },
};

export const PhoneVisual: Story = {
  args: Phone.args,
};

export const Otp: Story = {
  args: { step: "otp", phone: "+7 (900) 123-45-67" },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const otp = canvas.getByRole("textbox", { name: "Код из сообщения" });

    await userEvent.type(otp, "1234");
    await userEvent.click(
      canvas.getByRole("button", { name: "Отправить код ещё раз" }),
    );
    await expect(args.onUpdateOtp).toHaveBeenLastCalledWith("");
    await expect(args.onSendCode).toHaveBeenCalledTimes(1);

    await userEvent.type(otp, "567890");
    await userEvent.click(canvas.getByRole("button", { name: "Подтвердить" }));
    await expect(args.onVerifyOtp).toHaveBeenCalledWith("567890");
  },
};
export const Loading: Story = {
  args: { step: "loading" },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const status = canvas.getByRole("status");
    await expect(status).toHaveAccessibleName("Обрабатываем запрос...");
    await expect(canvas.getAllByRole("progressbar")).toHaveLength(1);
    await expect(canvas.getByRole("heading")).toBeVisible();
    await userEvent.tab();
    await expect(args.onUpdatePhone).not.toHaveBeenCalled();
    await expect(args.onSendCode).not.toHaveBeenCalled();
    await expect(args.onUpdateOtp).not.toHaveBeenCalled();
    await expect(args.onVerifyOtp).not.toHaveBeenCalled();
    await expect(args.onUpdateName).not.toHaveBeenCalled();
    await expect(args.onSubmitName).not.toHaveBeenCalled();
  },
};

export const LoadingVisual: Story = {
  args: Loading.args,
};

export const Register: Story = {
  args: { step: "register", name: "Анна" },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const name = canvas.getByRole("textbox", { name: "Ваше имя" });

    await expect(name).toHaveAttribute("id", "auth-name");
    await expect(
      canvas.getByText("Ваше имя", { selector: "label" }),
    ).toHaveAttribute("for", "auth-name");
    await userEvent.click(canvas.getByRole("button", { name: "Продолжить" }));
    await expect(args.onSubmitName).toHaveBeenCalledTimes(1);
  },
};
export const OtpError: Story = {
  args: {
    step: "otp",
    phone: "+7 (900) 123-45-67",
    errorMessage: "Код неверный или истёк",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByRole("alert")).toHaveTextContent(
      "Код неверный или истёк",
    );
    await expect(canvas.getByText("Код неверный или истёк")).toBeVisible();
  },
};

export const OtpErrorVisual: Story = {
  args: OtpError.args,
};

export const Success: Story = {
  args: { step: "success", phone: "+7 (900) 123-45-67", name: "Клиент" },
};
export const InvalidPhone: Story = {
  args: { phone: "+7 (900) 12" },
  play: async ({ args, canvasElement }) => {
    const button = within(canvasElement).getByRole("button", {
      name: "Отправить код",
    });
    await expect(button).toBeDisabled();
    button.click();
    await expect(args.onSendCode).not.toHaveBeenCalled();
  },
};
export const PhoneNineDigits: Story = {
  args: { phone: "790012345" },
  play: async ({ args, canvasElement }) => {
    const button = within(canvasElement).getByRole("button", {
      name: "Отправить код",
    });
    await expect(button).toBeDisabled();
    button.click();
    await expect(args.onSendCode).not.toHaveBeenCalled();
  },
};
export const PhoneTenDigits: Story = {
  args: { phone: "7900123456" },
  play: async ({ args, canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", { name: "Отправить код" }),
    );
    await expect(args.onSendCode).toHaveBeenCalledTimes(1);
  },
};
export const ShortOtp: Story = {
  args: { step: "otp", phone: "+7 (900) 123-45-67" },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(
      canvas.getByRole("textbox", { name: "Код из сообщения" }),
      "123",
    );
    const button = canvas.getByRole("button", { name: "Подтвердить" });
    await expect(button).toBeDisabled();
    button.click();
    await expect(args.onVerifyOtp).not.toHaveBeenCalled();
  },
};
export const ShortName: Story = {
  args: { step: "register", name: " A " },
  play: async ({ args, canvasElement }) => {
    const button = within(canvasElement).getByRole("button", {
      name: "Продолжить",
    });
    await expect(button).toBeDisabled();
    button.click();
    await expect(args.onSubmitName).not.toHaveBeenCalled();
  },
};

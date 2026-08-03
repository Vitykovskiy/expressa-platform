import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import AuthForm from "../../../customer/pages/auth/AuthForm.vue";
import type { AuthState } from "../../../customer/shared/model/customer.types";

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
    onSendCode: fn(),
    onUpdateOtp: fn(),
    onVerifyOtp: fn(),
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
          "Форма подтверждения телефона. Контракт: state и события updatePhone, sendCode, updateOtp, verifyOtp, updateName, submitName, backToPhone; владелец меняет шаг и проверяет код. Рендерит phone, otp и register; ошибка OTP выводится внутри otp. Повторная отправка очищает локальный OTP и вызывает sendCode; loading блокирует действие. Accessibility: поля телефона и имени имеют внешние связанные подписи; ошибка OTP использует alert. Источник: src/customer/pages/auth/AuthForm.vue.",
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
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const otp = canvas.getByRole("textbox", { name: "Код из сообщения" });

    await userEvent.type(otp, "1234");
    await userEvent.click(
      canvas.getByRole("button", { name: "Отправить код ещё раз" }),
    );
    await expect(args.onUpdateOtp).toHaveBeenLastCalledWith("");
    await expect(args.onSendCode).toHaveBeenCalledTimes(1);

    await userEvent.type(otp, "5678");
    await userEvent.click(canvas.getByRole("button", { name: "Подтвердить" }));

    await expect(args.onVerifyOtp).toHaveBeenCalledWith("5678");
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
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole("alert")).toHaveTextContent(
      "Код неверный или истёк",
    );
  },
};

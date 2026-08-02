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
          "Форма подтверждения телефона. Контракт: state и события updatePhone, sendCode, updateOtp, verifyOtp, updateName, submitName, backToPhone, retryOtp, reset; владелец меняет шаг и проверяет код. Рендерит только phone, otp, register и error. Accessibility: именованные поля и блокировка повторного действия. Источник: src/customer/pages/auth/AuthForm.vue.",
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
    await userEvent.click(
      within(canvasElement).getByRole("button", { name: "Отправить код" }),
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

    await userEvent.type(
      canvas.getByRole("textbox", { name: "Код из сообщения" }),
      "1234",
    );
    await userEvent.click(canvas.getByRole("button", { name: "Подтвердить" }));

    await expect(args.onUpdateOtp).toHaveBeenLastCalledWith("1234");
    await expect(args.onVerifyOtp).toHaveBeenCalledWith("1234");
  },
};

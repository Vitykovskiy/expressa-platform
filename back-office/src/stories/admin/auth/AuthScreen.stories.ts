import { computed, shallowRef } from "vue";
import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, userEvent, within } from "storybook/test";

import AuthScreen from "../../../admin/pages/auth/AuthScreen.vue";
import type { AuthScreenState } from "../../../admin/pages/auth/AuthScreen.types";

const meta = {
  title: "Admin/Auth/AuthScreen",
  component: AuthScreen,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof AuthScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

const phone = "+7 900 123-45-67";
const otpMetadata = { expiresInSeconds: 300, retryAfterSeconds: 60 };

function renderAuthScreen(initialState: AuthScreenState = "phone") {
  return () => ({
    components: { AuthScreen },
    setup() {
      const state = shallowRef<AuthScreenState>(initialState);
      const currentPhone = shallowRef("");
      const otp = shallowRef("");
      const error = shallowRef("");
      const phoneValid = computed(
        () => currentPhone.value.replace(/\D/g, "").length === 11,
      );
      const otpValid = computed(() => otp.value.length === 6);

      function requestOtp(): void {
        if (!phoneValid.value) {
          error.value = "Введите корректный номер телефона";
          return;
        }

        error.value = "";
        state.value = "otp";
      }

      function verifyOtp(): void {
        if (!otpValid.value) {
          error.value = "Введите код из сообщения";
          return;
        }

        error.value = "";
        state.value = "success";
      }

      function reset(): void {
        currentPhone.value = "";
        otp.value = "";
        error.value = "";
        state.value = "phone";
      }

      return {
        currentPhone,
        error,
        otp,
        otpMetadata,
        otpValid,
        phoneValid,
        requestOtp,
        reset,
        state,
        verifyOtp,
      };
    },
    template: `
      <AuthScreen
        :error="error"
        :otp="otp"
        :otp-metadata="otpMetadata"
        :otp-valid="otpValid"
        :phone="currentPhone"
        :phone-valid="phoneValid"
        :state="state"
        @change-phone="reset"
        @request-otp="requestOtp"
        @resend-otp="requestOtp"
        @retry="reset"
        @update:otp="otp = $event"
        @update:phone="currentPhone = $event"
        @verify-otp="verifyOtp"
      />
    `,
  });
}

export const PhoneValidation: Story = {
  args: {
    error: "",
    otp: "",
    otpMetadata: null,
    otpValid: false,
    phone: "",
    phoneValid: false,
    state: "phone",
  },
  render: renderAuthScreen(),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByLabelText("Телефон");

    await expect(input).toHaveFocus();
    await userEvent.type(input, "+7 900");
    await userEvent.keyboard("{Enter}");
    await expect(input).toHaveAttribute("aria-invalid", "true");
    await expect(input).toHaveAttribute("aria-describedby", "auth-phone-error");
    await expect(canvas.getByRole("alert")).toHaveTextContent(
      "Введите корректный номер телефона",
    );
  },
};

export const PhoneValidationVisual: Story = {
  args: {
    error: "Введите корректный номер телефона",
    otp: "",
    otpMetadata: null,
    otpValid: false,
    phone: "+7 900",
    phoneValid: false,
    state: "phone",
  },
};

const playOtpValidation: NonNullable<Story["play"]> = async ({
  canvasElement,
}) => {
  const canvas = within(canvasElement);
  const phoneInput = canvas.getByLabelText("Телефон");

  await userEvent.click(phoneInput);
  await userEvent.type(phoneInput, phone);
  await userEvent.keyboard("{Enter}");
  const otp = await canvas.findByLabelText("Код из сообщения");
  await expect(otp).toHaveFocus();
  await expect(
    await canvas.findByRole("heading", { name: "Введите код из сообщения" }),
  ).toBeVisible();
  await expect(
    canvas.getByText(
      "Код действует 300 сек. Повторная отправка доступна через 60 сек.",
    ),
  ).toBeVisible();
  await userEvent.click(
    canvas.getByRole("button", { name: "Отправить код повторно" }),
  );
  await userEvent.type(otp, "12");
  await userEvent.keyboard("{Enter}");
  await expect(otp).toHaveAttribute("aria-invalid", "true");
  await expect(otp).toHaveAttribute("aria-describedby", "auth-otp-error");
  await expect(canvas.getByRole("alert")).toHaveTextContent(
    "Введите код из сообщения",
  );
  await userEvent.clear(otp);
  await userEvent.type(otp, "654321");
  await userEvent.keyboard("{Enter}");
  await expect(await canvas.findByText("Вход выполнен")).toBeVisible();
};

export const OtpValidation: Story = {
  args: {
    error: "",
    otp: "",
    otpMetadata: null,
    otpValid: false,
    phone: "",
    phoneValid: false,
    state: "phone",
  },
  render: renderAuthScreen(),
  play: playOtpValidation,
};

export const OtpValidationVisual: Story = {
  args: {
    error: "",
    otp: "12",
    otpMetadata,
    otpValid: false,
    phone,
    phoneValid: true,
    state: "otp",
  },
};

export const Denied: Story = {
  args: {
    error: "",
    otp: "",
    otpMetadata: null,
    otpValid: false,
    phone,
    phoneValid: true,
    state: "denied",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByRole("alert")).toHaveTextContent(
      "Доступ запрещён",
    );
  },
};

export const Success: Story = {
  args: {
    error: "",
    otp: "",
    otpMetadata: null,
    otpValid: false,
    phone,
    phoneValid: true,
    state: "success",
  },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByText("Вход выполнен"),
    ).toBeVisible();
  },
};

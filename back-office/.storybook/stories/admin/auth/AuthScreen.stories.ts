import { computed, shallowRef } from "vue";
import type { Meta, StoryObj } from "@storybook/vue3-vite";

import AuthScreen from "../../../../src/pages/admin/auth/AuthScreen.vue";
import type { AuthScreenState } from "../../../../src/pages/admin/auth/AuthScreen.types";

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
};

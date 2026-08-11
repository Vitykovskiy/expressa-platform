<template>
  <AuthScreen
    :error="formError || sessionStore.error?.message || ''"
    :otp="otp"
    :otp-metadata="otpMetadata"
    :otp-valid="otpValid"
    :phone="phone"
    :phone-valid="phoneValid"
    :state="screenState"
    @change-phone="changePhone"
    @request-otp="requestOtp"
    @resend-otp="requestOtp"
    @retry="retry"
    @update:otp="updateOtp"
    @update:phone="updatePhone"
    @verify-otp="verifyOtp"
  />
</template>

<script setup lang="ts">
import { computed, shallowRef } from "vue";
import { useRouter } from "vue-router";

import AuthScreen from "./admin/auth/AuthScreen.vue";
import type { AuthScreenState } from "./admin/auth/AuthScreen.types";
import type { AuthOtpMetadata } from "../shared/api/auth.api.types";
import { useSessionStore } from "../app/session.store";
import {
  loginOtpLength,
  loginOtpValidationMessage,
  loginPhoneDigitsLength,
  loginPhoneValidationMessage,
  loginWorkspacePath,
} from "./LoginPage.constants";
import type { LoginOtpMetadata } from "./LoginPage.types";

const sessionStore = useSessionStore();
const router = useRouter();
const screenState = shallowRef<AuthScreenState>("phone");
const phone = shallowRef("");
const otp = shallowRef("");
const otpMetadata = shallowRef<LoginOtpMetadata | null>(null);
const formError = shallowRef("");

const phoneValid = computed(
  () => phone.value.replace(/\D/g, "").length === loginPhoneDigitsLength,
);
const otpValid = computed(() => otp.value.length === loginOtpLength);

async function requestOtp(): Promise<void> {
  if (!phoneValid.value) {
    formError.value = loginPhoneValidationMessage;
    return;
  }

  formError.value = "";
  screenState.value = "loading";
  const metadata = await sessionStore.requestOtp(phone.value);

  if (metadata === null) {
    screenState.value = "phone";
    return;
  }

  otpMetadata.value = toLoginOtpMetadata(metadata);
  otp.value = "";
  screenState.value = "otp";
}

async function verifyOtp(): Promise<void> {
  if (!otpValid.value) {
    formError.value = loginOtpValidationMessage;
    return;
  }

  formError.value = "";
  screenState.value = "loading";
  await sessionStore.verifyOtp(phone.value, otp.value);
  await showSessionResult("otp");
}

function updatePhone(value: string): void {
  phone.value = formatPhone(value);
  formError.value = "";
}

function updateOtp(value: string): void {
  otp.value = value;
  formError.value = "";
}

function changePhone(): void {
  otp.value = "";
  otpMetadata.value = null;
  formError.value = "";
  screenState.value = "phone";
}

function retry(): void {
  phone.value = "";
  otp.value = "";
  otpMetadata.value = null;
  formError.value = "";
  screenState.value = "phone";
}

async function showSessionResult(
  fallbackState: "phone" | "otp",
): Promise<void> {
  if (sessionStore.status === "authenticated") {
    screenState.value = "success";
    await router.replace(loginWorkspacePath);
    return;
  }

  if (sessionStore.status === "denied") {
    screenState.value = "denied";
    return;
  }

  screenState.value =
    sessionStore.status === "anonymous" ? "phone" : fallbackState;
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, loginPhoneDigitsLength);

  if (!digits) {
    return "";
  }

  let formattedPhone = "+7";

  if (digits.length > 1) {
    formattedPhone += ` ${digits.slice(1, 4)}`;
  }

  if (digits.length > 4) {
    formattedPhone += ` ${digits.slice(4, 7)}`;
  }

  if (digits.length > 7) {
    formattedPhone += `-${digits.slice(7, 9)}`;
  }

  if (digits.length > 9) {
    formattedPhone += `-${digits.slice(9, loginPhoneDigitsLength)}`;
  }

  return formattedPhone;
}

function toLoginOtpMetadata(metadata: AuthOtpMetadata): LoginOtpMetadata {
  return {
    expiresInSeconds: metadata.expiresInSeconds,
    retryAfterSeconds: metadata.retryAfterSeconds,
  };
}
</script>

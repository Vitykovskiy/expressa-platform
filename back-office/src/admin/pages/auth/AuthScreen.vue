<template>
  <main class="auth-screen">
    <LoadingState v-if="presentation.content === 'loading'" />
    <section
      v-else-if="presentation.content === 'denied'"
      class="auth-screen__card"
    >
      <DeniedState @retry="retry" />
    </section>
    <p
      v-else-if="presentation.content === 'success'"
      class="auth-screen__success"
      role="status"
    >
      Вход выполнен
    </p>
    <section v-else class="auth-screen__card">
      <header class="auth-screen__header">
        <p>Expressa Admin</p>
        <h1>{{ presentation.title }}</h1>
      </header>
      <PhoneStep
        v-if="presentation.content === 'phone'"
        :error="error"
        :phone="phone"
        :valid="phoneValid"
        @submit="sendCode"
        @update:phone="handlePhoneUpdate"
      />
      <OtpStep
        v-else
        :error="error"
        :otp="otp"
        :phone="phone"
        :valid="otpValid"
        @change-phone="changePhone"
        @submit="confirmOtp"
        @update:otp="handleOtpUpdate"
      />
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, shallowRef } from "vue";
import { AUTH_SCREEN_PRESENTATION } from "./AuthScreen.constants";
import type { AuthScreenProps, AuthStep } from "./AuthScreen.types";
import DeniedState from "./DeniedState.vue";
import LoadingState from "./LoadingState.vue";
import OtpStep from "./OtpStep.vue";
import PhoneStep from "./PhoneStep.vue";

const props = defineProps<AuthScreenProps>();
const step = shallowRef<AuthStep>("phone");
const phone = shallowRef("");
const otp = shallowRef("");
const error = shallowRef("");
let transitionTimer: ReturnType<typeof globalThis.setTimeout> | undefined;

const phoneValid = computed(() => phone.value.replace(/\D/g, "").length === 11);
const otpValid = computed(() => otp.value.length >= 4);
const presentation = computed(() => AUTH_SCREEN_PRESENTATION[step.value]);

function clearTransitionTimer(): void {
  if (transitionTimer !== undefined) {
    globalThis.clearTimeout(transitionTimer);
    transitionTimer = undefined;
  }
}

function scheduleTransition(delay: number, transition: () => void): void {
  clearTransitionTimer();
  step.value = "loading";
  transitionTimer = globalThis.setTimeout(() => {
    transitionTimer = undefined;
    transition();
  }, delay);
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (!digits) return "";

  let result = "+7";
  if (digits.length > 1) result += ` ${digits.slice(1, 4)}`;
  if (digits.length > 4) result += ` ${digits.slice(4, 7)}`;
  if (digits.length > 7) result += `-${digits.slice(7, 9)}`;
  if (digits.length > 9) result += `-${digits.slice(9, 11)}`;
  return result;
}

function handlePhoneUpdate(value: string): void {
  phone.value = formatPhone(value);
  error.value = "";
}

function handleOtpUpdate(value: string): void {
  otp.value = value;
  error.value = "";
}

function sendCode(): void {
  if (!phoneValid.value) {
    error.value = "Введите корректный номер телефона";
    return;
  }

  error.value = "";
  scheduleTransition(1000, () => {
    step.value = "otp";
  });
}

function confirmOtp(): void {
  if (!otpValid.value) {
    error.value = "Введите код из сообщения";
    return;
  }

  if (otp.value !== "1234") {
    error.value = "Код неверный или истёк";
    return;
  }

  error.value = "";
  scheduleTransition(700, () => {
    step.value = props.login(phone.value) === "ok" ? "success" : "denied";
  });
}

function changePhone(): void {
  clearTransitionTimer();
  step.value = "phone";
  otp.value = "";
  error.value = "";
}

function retry(): void {
  clearTransitionTimer();
  step.value = "phone";
  phone.value = "";
  otp.value = "";
  error.value = "";
}

onBeforeUnmount(clearTransitionTimer);
</script>

<style scoped lang="scss">
.auth-screen {
  display: grid;
  min-height: 100%;
  padding: var(--expressa-space-lg);
  place-items: center;
  background: var(--expressa-color-surface-raised);
}

.auth-screen__card {
  width: min(100%, var(--expressa-size-auth-card-max-width));
  padding: var(--expressa-space-xl);
  background: var(--expressa-color-surface);
  border: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
  border-radius: var(--expressa-radius-lg);
}

.auth-screen__header {
  margin-bottom: var(--expressa-space-lg);
}

.auth-screen__header p,
.auth-screen__header h1,
.auth-screen__success {
  margin: 0;
}

.auth-screen__header p {
  color: var(--expressa-color-text-muted);
  font-size: var(--expressa-font-size-caption);
  font-weight: var(--expressa-font-weight-medium);
}

.auth-screen__header h1 {
  color: var(--expressa-color-text-primary);
  font-size: var(--expressa-font-size-heading);
  line-height: var(--expressa-line-height-tight);
}

.auth-screen__success {
  color: var(--expressa-color-status-success);
  font-size: var(--expressa-font-size-action);
  text-align: center;
}
</style>

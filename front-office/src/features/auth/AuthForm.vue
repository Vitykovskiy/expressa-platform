<template>
  <form
    v-if="props.state.step === 'phone'"
    class="auth-form"
    @submit.prevent="sendCode"
  >
    <ui-text-field
      id="auth-phone"
      autocomplete="tel"
      aria-label="Номер телефона"
      autofocus
      base-color="var(--customer-border)"
      bg-color="var(--customer-color-surface-subtle)"
      color="var(--customer-text)"
      hide-details
      inputmode="tel"
      label="Номер телефона"
      placeholder="+7 (___) ___-__-__"
      variant="outlined"
      class="auth-form__field"
      :disabled="isLoading"
      :model-value="props.state.phone"
      @update:model-value="updatePhone"
    >
      <template #prepend-inner>
        <Phone class="auth-form__field-icon" aria-hidden="true" />
      </template>
    </ui-text-field>
    <UiFieldMessage
      class="auth-form__error-message"
      :message="props.state.errorMessage"
      tone="error"
    />
    <ui-btn
      block
      class="auth-form__primary-button"
      color="surface"
      :disabled="!canSendCode || isLoading"
      :loading="isLoading"
      size="x-large"
      type="submit"
    >
      Отправить код
    </ui-btn>
  </form>

  <form
    v-else-if="props.state.step === 'otp'"
    class="auth-form"
    @submit.prevent="verifyOtp"
  >
    <ui-text-field
      autocomplete="one-time-code"
      aria-label="Код из сообщения"
      autofocus
      base-color="var(--customer-border)"
      bg-color="var(--customer-color-surface-subtle)"
      color="var(--customer-text)"
      hide-details
      inputmode="numeric"
      label="Код из сообщения"
      maxlength="6"
      placeholder="000000"
      variant="outlined"
      class="auth-form__field"
      :disabled="isLoading"
      :model-value="props.otp"
      @update:model-value="updateOtp"
    />
    <UiFieldMessage
      class="auth-form__error-message"
      :message="props.state.errorMessage"
      tone="error"
    />
    <ui-btn
      block
      class="auth-form__primary-button"
      color="surface"
      :disabled="!canVerifyOtp || isLoading"
      :loading="isLoading"
      size="x-large"
      type="submit"
    >
      Подтвердить
    </ui-btn>
    <div class="auth-form__resend">
      <p
        v-if="props.resendRemainingSeconds > 0"
        aria-live="polite"
        class="auth-form__cooldown"
      >
        Повторная отправка доступна через
        {{ props.resendRemainingSeconds }} сек.
      </p>
      <ui-btn
        v-else
        class="auth-form__ghost-button"
        :disabled="isLoading"
        variant="text"
        @click="resendCode"
      >
        Отправить код ещё раз
      </ui-btn>
    </div>
    <ui-btn
      class="auth-form__ghost-button"
      :disabled="isLoading"
      variant="text"
      @click="emit('backToPhone')"
    >
      <ArrowLeft aria-hidden="true" :size="14" :stroke-width="2.5" />
      Изменить номер
    </ui-btn>
  </form>

  <form
    v-else-if="props.state.step === 'register'"
    class="auth-form"
    @submit.prevent="submitName"
  >
    <ui-text-field
      id="auth-name"
      autocomplete="name"
      aria-label="Ваше имя"
      autofocus
      base-color="var(--customer-border)"
      bg-color="var(--customer-color-surface-subtle)"
      color="var(--customer-text)"
      hide-details
      placeholder="Ваше имя"
      variant="outlined"
      class="auth-form__field"
      :disabled="isLoading"
      :model-value="props.state.name"
      @update:model-value="updateName"
    >
      <template #prepend-inner>
        <UserRound class="auth-form__field-icon" aria-hidden="true" />
      </template>
    </ui-text-field>
    <ui-btn
      block
      class="auth-form__primary-button"
      color="surface"
      :disabled="!canSubmitName || isLoading"
      size="x-large"
      type="submit"
    >
      Продолжить
    </ui-btn>
  </form>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { ArrowLeft, Phone, UserRound } from "lucide-vue-next";
import UiBtn from "@/shared/ui/customer/btn/UiBtn.vue";
import UiFieldMessage from "@/shared/ui/customer/field-message/UiFieldMessage.vue";
import UiTextField from "@/shared/ui/customer/text-field/UiTextField.vue";
import { authFormLimits } from "./AuthForm.constants";
import type { AuthFormEmits, AuthFormProps } from "./AuthForm.types";

const props = defineProps<AuthFormProps>();
const emit = defineEmits<AuthFormEmits>();

const phoneDigits = computed(() => props.state.phone.replace(/\D/g, ""));
const canSendCode = computed(
  () => phoneDigits.value.length >= authFormLimits.phoneDigits,
);
const canVerifyOtp = computed(
  () => props.otp.length === authFormLimits.otpLength,
);
const canSubmitName = computed(() => props.state.name.trim().length >= 2);
const isLoading = computed(() => props.isLoading ?? false);

function updatePhone(phone: string) {
  if (!isLoading.value) emit("updatePhone", formatPhone(phone));
}

function updateOtp(value: string) {
  emit("updateOtp", value.replace(/\D/g, ""));
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  const localDigits = digits.startsWith("8") ? `7${digits.slice(1)}` : digits;
  const number = localDigits.startsWith("7")
    ? localDigits.slice(1)
    : localDigits;

  if (number.length === 0) return "";
  if (number.length <= 3) return `+7 (${number}`;
  if (number.length <= 6)
    return `+7 (${number.slice(0, 3)}) ${number.slice(3)}`;
  if (number.length <= 8) {
    return `+7 (${number.slice(0, 3)}) ${number.slice(3, 6)}-${number.slice(6)}`;
  }

  return `+7 (${number.slice(0, 3)}) ${number.slice(3, 6)}-${number.slice(6, 8)}-${number.slice(8, 10)}`;
}

function updateName(name: string) {
  if (!isLoading.value) emit("updateName", name);
}

function sendCode() {
  if (canSendCode.value && !isLoading.value) emit("sendCode");
}

function resendCode() {
  if (isLoading.value || props.resendRemainingSeconds > 0) return;
  emit("sendCode");
}

function verifyOtp() {
  if (canVerifyOtp.value && !isLoading.value) emit("verifyOtp", props.otp);
}

function submitName() {
  if (canSubmitName.value && !isLoading.value) emit("submitName");
}
</script>

<style scoped lang="scss">
.auth-form {
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: var(--customer-space-6);
}

.auth-form__field-icon {
  width: 1.0625rem;
  height: 1.0625rem;
  color: var(--customer-color-text-muted-on-brand);
}

.auth-form__primary-button {
  min-height: var(--customer-size-control-xl);
  border-radius: var(--customer-radius-sm);
  font-size: var(--customer-font-size-lg);
  font-weight: var(--customer-font-weight-black);
}

.auth-form__ghost-button {
  align-self: center;
  gap: var(--customer-space-3);
  color: var(--customer-color-white-55);
  font-size: var(--customer-font-size-sm);
  font-weight: var(--customer-font-weight-bold);
}

.auth-form__ghost-button.auth-form__ghost-button {
  /* Overrides the shared text-variant compact height for the touch target. */
  min-height: 2.75rem;
}

.auth-form__resend {
  display: flex;
  justify-content: center;
  min-height: 2.75rem;
}

.auth-form :deep(.auth-form__error-message.v-alert) {
  /* Vuetify's tonal error color is unreadable over the auth background. */
  background: var(--customer-color-blue-700) !important;
  border: 1px solid var(--customer-danger-pale);
  color: var(--customer-color-white) !important;
  font-weight: var(--customer-font-weight-semibold);
}

.auth-form__cooldown {
  align-self: center;
  margin: 0;
  color: var(--customer-color-text-muted-on-brand);
  font-size: var(--customer-font-size-sm);
  font-weight: var(--customer-font-weight-bold);
  line-height: var(--customer-line-height-body);
  text-align: center;
}
</style>

<template>
  <form
    v-if="props.state.step === 'phone'"
    class="auth-form"
    @submit.prevent="sendCode"
  >
    <ui-text-field
      id="auth-phone"
      autocomplete="tel"
      autofocus
      base-color="var(--customer-border)"
      bg-color="var(--customer-color-surface-subtle)"
      color="var(--customer-text)"
      hint="Формат: +7 (___) ___-__-__"
      inputmode="tel"
      label="Номер телефона"
      placeholder="+7 (___) ___-__-__"
      persistent-hint
      variant="outlined"
      :disabled="isLoading"
      :model-value="props.state.phone"
      @update:model-value="updatePhone"
    >
      <template #prepend-inner>
        <Phone class="auth-form__field-icon" aria-hidden="true" />
      </template>
    </ui-text-field>
    <UiFieldMessage :message="props.state.errorMessage" tone="error" />
    <ui-btn
      block
      color="surface"
      :disabled="!canSendCode || isLoading"
      size="x-large"
      type="submit"
    >
      Отправить код
    </ui-btn>
    <p class="auth-form__info">
      Корзина, выбор времени и история заказов доступны только после
      подтверждения номера.
    </p>
  </form>

  <form
    v-else-if="props.state.step === 'otp'"
    class="auth-form"
    @submit.prevent="verifyOtp"
  >
    <ui-text-field
      autocomplete="one-time-code"
      autofocus
      base-color="var(--customer-border)"
      bg-color="var(--customer-color-surface-subtle)"
      color="var(--customer-text)"
      hint="Введите код из сообщения"
      inputmode="numeric"
      label="Код из сообщения"
      maxlength="6"
      placeholder="______"
      persistent-hint
      variant="outlined"
      :disabled="isLoading"
      :model-value="otp"
      @update:model-value="updateOtp"
    />
    <UiFieldMessage :message="props.state.errorMessage" tone="error" />
    <ui-btn
      block
      color="surface"
      :disabled="!canVerifyOtp || isLoading"
      size="x-large"
      type="submit"
    >
      Подтвердить
    </ui-btn>
    <ui-btn
      class="auth-form__ghost-button"
      :disabled="isLoading"
      variant="text"
      @click="resendCode"
    >
      Отправить код ещё раз
    </ui-btn>
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
      autofocus
      base-color="var(--customer-border)"
      bg-color="var(--customer-color-surface-subtle)"
      color="var(--customer-text)"
      hint="Имя появится в заказах и истории"
      label="Ваше имя"
      placeholder="Ваше имя"
      persistent-hint
      variant="outlined"
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
import { computed, shallowRef, watch } from "vue";
import { ArrowLeft, Phone, UserRound } from "lucide-vue-next";
import UiBtn from "@/shared/ui/customer/btn/UiBtn.vue";
import UiFieldMessage from "@/shared/ui/customer/field-message/UiFieldMessage.vue";
import UiTextField from "@/shared/ui/customer/text-field/UiTextField.vue";
import { authFormLimits } from "./AuthForm.constants";
import type { AuthFormEmits, AuthFormProps } from "./AuthForm.types";

const props = defineProps<AuthFormProps>();
const emit = defineEmits<AuthFormEmits>();

const otp = shallowRef("");
const phoneDigits = computed(() => props.state.phone.replace(/\D/g, ""));
const canSendCode = computed(
  () => phoneDigits.value.length >= authFormLimits.phoneDigits,
);
const canVerifyOtp = computed(
  () => otp.value.length === authFormLimits.otpLength,
);
const canSubmitName = computed(() => props.state.name.trim().length >= 2);
const isLoading = computed(() => props.state.step === "loading");

watch(
  () => props.state.step,
  (step) => {
    if (step === "phone") otp.value = "";
  },
);

function updatePhone(phone: string) {
  if (!isLoading.value) emit("updatePhone", formatPhone(phone));
}

function updateOtp(value: string) {
  otp.value = value.replace(/\D/g, "");
  emit("updateOtp", otp.value);
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
  if (isLoading.value) return;

  otp.value = "";
  emit("updateOtp", "");
  emit("sendCode");
}

function verifyOtp() {
  if (canVerifyOtp.value && !isLoading.value) emit("verifyOtp", otp.value);
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
  width: var(--customer-size-icon-sm);
  height: var(--customer-size-icon-sm);
  color: var(--customer-color-text-muted-on-brand);
}

.auth-form__ghost-button {
  align-self: center;
  gap: var(--customer-space-3);
  color: var(--customer-color-text-muted-on-brand);
  font-size: var(--customer-font-size-sm);
  font-weight: var(--customer-font-weight-bold);
}

.auth-form__info {
  margin: 0;
  padding: var(--customer-space-9) var(--customer-space-11);
  border: 1px solid var(--customer-border);
  border-radius: 1rem;
  background: var(--customer-color-surface-subtle);
  color: var(--customer-color-text-muted-on-brand);
  font-size: var(--customer-font-size-sm);
  font-weight: var(--customer-font-weight-semibold);
  line-height: var(--customer-line-height-relaxed);
}
</style>

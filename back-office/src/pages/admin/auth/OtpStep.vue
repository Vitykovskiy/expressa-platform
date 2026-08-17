<template>
  <form class="auth-step" @submit.prevent="emit('submit')">
    <p class="auth-step__description">
      Код отправлен на <strong>{{ props.phone }}</strong>
    </p>
    <div class="auth-step__control">
      <label class="auth-step__label" for="auth-otp">Код из сообщения</label>
      <AdminTextField
        id="auth-otp"
        ref="otpInput"
        v-model="otpModel"
        class="auth-step__input auth-step__input--otp"
        :aria-describedby="error ? 'auth-otp-error' : 'auth-otp-hint'"
        :aria-invalid="Boolean(error)"
        autocomplete="one-time-code"
        autofocus
        inputmode="numeric"
        maxlength="6"
        name="otp"
        placeholder="• • • •"
        @keydown.enter.prevent="emit('submit')"
      />
    </div>
    <p v-if="error" id="auth-otp-error" class="auth-step__error" role="alert">
      <CircleAlert aria-hidden="true" class="auth-step__error-icon" />
      <span>{{ error }}</span>
    </p>
    <p v-else id="auth-otp-hint" class="auth-step__hint">
      Код действует {{ props.expiresInSeconds }} сек. Повторная отправка
      доступна через {{ props.retryAfterSeconds }} сек.
    </p>
    <AdminButton class="auth-step__button" :disabled="!valid" type="submit">
      Подтвердить
    </AdminButton>
    <AdminButton
      class="auth-step__button"
      variant="ghost"
      @click="emit('resend')"
    >
      Отправить код повторно
    </AdminButton>
    <AdminButton
      class="auth-step__button"
      variant="ghost"
      @click="emit('changePhone')"
    >
      <ArrowLeft aria-hidden="true" class="auth-step__back-icon" />
      Изменить номер
    </AdminButton>
  </form>
</template>

<script setup lang="ts">
import { ArrowLeft, CircleAlert } from "lucide-vue-next";
import { computed, onMounted, useTemplateRef } from "vue";
import AdminButton from "../../../shared/ui/admin/admin-button/AdminButton.vue";
import AdminTextField from "../../../shared/ui/admin/admin-text-field/AdminTextField.vue";
import type { OtpStepEmits, OtpStepProps } from "./OtpStep.types";

const props = defineProps<OtpStepProps>();

const otpModel = computed({
  get: () => props.otp,
  set: (value: string) => emit("update:otp", value.replace(/\D/g, "")),
});

const otpInput =
  useTemplateRef<InstanceType<typeof AdminTextField>>("otpInput");

onMounted(() => otpInput.value?.focus());
const emit = defineEmits<OtpStepEmits>();
</script>

<style scoped lang="scss">
.auth-step {
  display: grid;
  gap: var(--expressa-space-button-inline);
}
.auth-step__control {
  display: grid;
  gap: var(--expressa-space-field-label);
}
.auth-step__description,
.auth-step__error,
.auth-step__hint {
  margin: 0;
}
.auth-step__description {
  color: var(--expressa-color-text-secondary);
  font-size: var(--expressa-font-size-action);
  line-height: var(--expressa-line-height-body);
}
.auth-step__description strong {
  color: var(--expressa-color-text-primary);
  font-weight: var(--expressa-font-weight-semibold);
}
.auth-step__label {
  display: block;
  color: var(--expressa-color-text-secondary);
  font-size: var(--expressa-font-size-action);
  font-weight: var(--expressa-font-weight-medium);
}
.auth-step__input {
  display: block;
  width: 100%;
  padding: var(--expressa-space-control-block)
    var(--expressa-space-control-inline);
  color: var(--expressa-color-text-primary);
  background: var(--expressa-color-surface);
  border: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
  border-radius: var(--expressa-radius-md);
  font: inherit;
}
.auth-step__input[aria-invalid="true"] {
  border-color: var(--expressa-color-border);
}
.auth-step__input:focus-visible {
  outline: var(--expressa-border-width-strong) solid rgb(26 26 255 / 10%);
  outline-offset: 0;
  border-color: var(--expressa-color-accent);
}
.auth-step__input--otp {
  font-size: var(--expressa-font-size-title);
  letter-spacing: var(--expressa-letter-spacing-otp);
  text-align: center;
}
.auth-step__error {
  display: flex;
  align-items: flex-start;
  gap: var(--expressa-space-sm);
  color: var(--expressa-color-status-error);
  font-size: var(--expressa-font-size-caption);
  line-height: var(--expressa-line-height-body);
}
.auth-step__hint {
  color: #bbb;
  font-size: 11px;
  line-height: 1.5;
  text-align: center;
}
.auth-step__error-icon {
  flex: 0 0 13px;
  width: 13px;
  height: 13px;
  margin-top: var(--expressa-space-2xs);
}
.auth-step__button {
  display: flex;
  width: 100%;
  padding: 12px 0;
  align-items: center;
  justify-content: center;
  gap: var(--expressa-space-sm);
  font-size: 14px;
  font-weight: var(--expressa-font-weight-semibold);
  line-height: 21px;
}
.auth-step__back-icon {
  flex: 0 0 auto;
  width: 14px;
  height: 14px;
}
</style>

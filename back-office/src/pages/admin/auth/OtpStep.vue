<template>
  <form class="auth-step" @submit.prevent="emit('submit')">
    <p class="auth-step__description">
      Код отправлен на <strong>{{ props.phone }}</strong>
    </p>
    <AdminFieldWrapper
      id="auth-otp"
      v-slot="field"
      :error="error"
      label="Код из сообщения"
      required
    >
      <AdminTextField
        :id="field.controlId"
        :model-value="props.otp"
        autocomplete="one-time-code"
        inputmode="numeric"
        name="otp"
        presentation="code"
        :required="field.required"
        @input="normalizeOtpInput"
      />
    </AdminFieldWrapper>
    <AdminButton class="auth-step__button" :disabled="!valid" type="submit">
      Подтвердить
    </AdminButton>
    <div class="auth-step__secondary">
      <AdminButton
        class="auth-step__button"
        :disabled="props.resendRemainingSeconds > 0"
        variant="ghost"
        @click="emit('resend')"
      >
        {{
          props.resendRemainingSeconds > 0
            ? "Ожидайте"
            : "Отправить код повторно"
        }}
      </AdminButton>
      <AdminButton
        class="auth-step__button"
        variant="ghost"
        @click="emit('changePhone')"
      >
        <AdminIcon :icon="ArrowLeft" />
        Изменить номер
      </AdminButton>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ArrowLeft } from "lucide-vue-next";
import AdminButton from "../../../shared/ui/admin/admin-button/AdminButton.vue";
import AdminIcon from "../../../shared/ui/admin/admin-icon/AdminIcon.vue";
import AdminFieldWrapper from "../../../shared/ui/admin/field-wrapper/AdminFieldWrapper.vue";
import AdminTextField from "../../../shared/ui/admin/admin-text-field/AdminTextField.vue";
import type { OtpStepEmits, OtpStepProps } from "./OtpStep.types";

const props = defineProps<OtpStepProps>();

const emit = defineEmits<OtpStepEmits>();

function normalizeOtpInput(event: Event): void {
  const input = event.target;

  if (!(input instanceof HTMLInputElement)) return;

  const rawValue = input.value;
  const selectionStart = input.selectionStart ?? rawValue.length;
  const normalizedValue = normalizeOtp(rawValue);

  if (rawValue !== normalizedValue) {
    const normalizedCursor = normalizeOtp(
      rawValue.slice(0, selectionStart),
    ).length;
    input.value = normalizedValue;
    input.setSelectionRange(normalizedCursor, normalizedCursor);
  }

  emit("update:otp", normalizedValue);
}

function normalizeOtp(value: string): string {
  return value.replace(/\D/g, "").slice(0, 6);
}
</script>

<style scoped lang="scss">
.auth-step {
  display: grid;
  gap: var(--expressa-space-button-inline);
}
.auth-step__description {
  margin: 0;
  color: var(--expressa-color-text-secondary);
  font-size: var(--expressa-font-size-action);
  line-height: var(--expressa-line-height-body);
}
.auth-step__secondary {
  display: grid;
  gap: var(--expressa-space-xs);
}
.auth-step__description strong {
  color: var(--expressa-color-text-primary);
  font-weight: var(--expressa-font-weight-semibold);
  display: inline-block;
  white-space: nowrap;
}
.auth-step__button {
  width: 100%;
}
</style>

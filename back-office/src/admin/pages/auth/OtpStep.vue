<template>
  <form class="auth-step" @submit.prevent="emit('submit')">
    <p class="auth-step__description">
      Код отправлен на <strong>{{ props.phone }}</strong>
    </p>
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
    <p v-if="error" id="auth-otp-error" class="auth-step__error" role="alert">
      {{ error }}
    </p>
    <p v-else id="auth-otp-hint" class="auth-step__hint">
      Для теста: <strong>1234</strong>
    </p>
    <AdminButton :disabled="!valid" type="submit"> Подтвердить </AdminButton>
    <AdminButton variant="ghost" @click="emit('changePhone')">
      Изменить номер
    </AdminButton>
  </form>
</template>

<script setup lang="ts">
import { computed, onMounted, useTemplateRef } from "vue";
import AdminButton from "../../shared/ui/admin-button/AdminButton.vue";
import AdminTextField from "../../shared/ui/admin-text-field/AdminTextField.vue";
import type { OtpStepEmits, OtpStepProps } from "./OtpStep.types";

const props = defineProps<OtpStepProps>();

const otpModel = computed({
  get: () => props.otp,
  set: (value: string) => emit("update:otp", value.replace(/\D/g, "")),
});

const otpInput =
  useTemplateRef<InstanceType<typeof AdminTextField>>("otpInput");

onMounted(() => otpInput.value?.$el.focus());
const emit = defineEmits<OtpStepEmits>();
</script>

<style scoped lang="scss">
.auth-step {
  display: grid;
  gap: var(--expressa-space-md);
}
.auth-step__description,
.auth-step__error,
.auth-step__hint {
  margin: 0;
  font-size: var(--expressa-font-size-action);
  line-height: var(--expressa-line-height-body);
}
.auth-step__description {
  color: var(--expressa-color-text-secondary);
}
.auth-step__label {
  color: var(--expressa-color-text-secondary);
  font-size: var(--expressa-font-size-action);
  font-weight: var(--expressa-font-weight-medium);
}
.auth-step__input {
  width: 100%;
  min-height: var(--expressa-size-control-min-height);
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
  border-color: var(--expressa-color-status-error);
}
.auth-step__input--otp {
  font-size: var(--expressa-font-size-title);
  letter-spacing: var(--expressa-letter-spacing-otp);
  text-align: center;
}
.auth-step__error {
  color: var(--expressa-color-status-error);
}
.auth-step__hint {
  color: var(--expressa-color-text-muted);
}
</style>

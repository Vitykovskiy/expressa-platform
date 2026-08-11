<template>
  <form class="auth-step" @submit.prevent="emit('submit')">
    <label class="auth-step__label" for="auth-phone">Телефон</label>
    <div class="auth-step__field">
      <span class="auth-step__phone-prefix" aria-hidden="true">
        <svg class="auth-step__phone-icon" viewBox="0 0 24 24">
          <path
            d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .8 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.4 1.8.7 2.8.8a2 2 0 0 1 1.7 2Z"
          />
        </svg>
      </span>
      <AdminTextField
        id="auth-phone"
        ref="phoneInput"
        v-model="phoneModel"
        class="auth-step__input"
        :aria-describedby="error ? 'auth-phone-error' : 'auth-phone-hint'"
        :aria-invalid="Boolean(error)"
        autocomplete="tel"
        autofocus
        inputmode="tel"
        name="phone"
        placeholder="+7 900 000-00-00"
        type="tel"
        @keydown.enter.prevent="emit('submit')"
      />
    </div>
    <p v-if="error" id="auth-phone-error" class="auth-step__error" role="alert">
      <svg aria-hidden="true" class="auth-step__error-icon" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4m0 4h.01" />
      </svg>
      <span>{{ error }}</span>
    </p>
    <p v-else id="auth-phone-hint" class="auth-step__hint">
      Для входа используйте номер телефона, зарегистрированный администратором.
    </p>
    <AdminButton class="auth-step__button" :disabled="!valid" type="submit">
      Отправить код
    </AdminButton>
  </form>
</template>

<script setup lang="ts">
import { computed, onMounted, useTemplateRef } from "vue";
import AdminButton from "../../../shared/ui/admin/admin-button/AdminButton.vue";
import AdminTextField from "../../../shared/ui/admin/admin-text-field/AdminTextField.vue";

import type { PhoneStepEmits, PhoneStepProps } from "./PhoneStep.types";

const props = defineProps<PhoneStepProps>();

const emit = defineEmits<PhoneStepEmits>();

const phoneModel = computed({
  get: () => props.phone,
  set: (value: string) => emit("update:phone", value),
});

const phoneInput =
  useTemplateRef<InstanceType<typeof AdminTextField>>("phoneInput");

onMounted(() => phoneInput.value?.focus());
</script>

<style scoped lang="scss">
.auth-step {
  display: block;
}
.auth-step__label {
  display: block;
  margin-bottom: var(--expressa-space-field-label);
  color: var(--expressa-color-text-secondary);
  font-size: var(--expressa-font-size-action);
  font-weight: var(--expressa-font-weight-medium);
}
.auth-step__input {
  width: 100%;
  padding: var(--expressa-space-control-block)
    var(--expressa-space-control-inline);
  color: var(--expressa-color-text-primary);
  background: var(--expressa-color-surface);
  border: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
  border-radius: var(--expressa-radius-md);
  font-size: 14px;
  line-height: 21px;
}
.auth-step__field {
  display: flex;
  position: relative;
  align-items: center;
}
.auth-step__phone-prefix {
  display: flex;
  position: absolute;
  left: var(--expressa-space-control-inline);
  align-items: center;
  color: #aaa;
  pointer-events: none;
}
.auth-step__phone-icon {
  width: 15px;
  height: 15px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: var(--expressa-stroke-width-icon);
}
.auth-step__field .auth-step__input {
  min-height: auto;
  padding-left: 36px;
}
.auth-step__input[aria-invalid="true"] {
  border-color: var(--expressa-color-border);
}
.auth-step__error,
.auth-step__hint {
  margin: 0;
}
.auth-step__error {
  display: flex;
  margin-top: var(--expressa-space-button-inline);
  align-items: flex-start;
  gap: var(--expressa-space-sm);
  color: var(--expressa-color-status-error);
  font-size: var(--expressa-font-size-caption);
  line-height: var(--expressa-line-height-body);
}
.auth-step__error-icon {
  flex: 0 0 13px;
  width: 13px;
  height: 13px;
  margin-top: var(--expressa-space-2xs);
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: var(--expressa-stroke-width-icon);
}
.auth-step__hint {
  margin-top: var(--expressa-space-button-inline);
  color: #bbb;
  font-size: 11px;
  line-height: 1.625;
  text-align: center;
}
.auth-step__button {
  display: flex;
  width: 100%;
  padding: 12px 0;
  margin-top: var(--expressa-space-button-inline);
  align-items: center;
  justify-content: center;
  gap: var(--expressa-space-sm);
  font-size: 14px;
  font-weight: var(--expressa-font-weight-semibold);
  line-height: 21px;
}
</style>

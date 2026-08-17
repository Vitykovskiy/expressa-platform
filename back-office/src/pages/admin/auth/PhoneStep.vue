<template>
  <form class="auth-step" @submit.prevent="emit('submit')">
    <div class="auth-step__control">
      <label class="auth-step__label" for="auth-phone">Телефон</label>
      <div class="auth-step__field">
        <Phone aria-hidden="true" class="auth-step__phone-icon" />
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
    </div>
    <p v-if="error" id="auth-phone-error" class="auth-step__error" role="alert">
      <CircleAlert aria-hidden="true" class="auth-step__error-icon" />
      <span>{{ error }}</span>
    </p>
    <AdminButton class="auth-step__button" :disabled="!valid" type="submit">
      Отправить код
    </AdminButton>
    <p v-if="!error" id="auth-phone-hint" class="auth-step__hint">
      Для входа используйте номер телефона, зарегистрированный администратором.
    </p>
  </form>
</template>

<script setup lang="ts">
import { CircleAlert, Phone } from "lucide-vue-next";
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
  display: grid;
  gap: var(--expressa-space-button-inline);
}
.auth-step__control {
  display: grid;
  gap: var(--expressa-space-field-label);
}
.auth-step__label {
  display: block;
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
.auth-step__phone-icon {
  position: absolute;
  z-index: 1;
  left: var(--expressa-space-control-inline);
  width: 15px;
  height: 15px;
  color: #aaa;
  pointer-events: none;
}
.auth-step__field .auth-step__input {
  min-height: auto;
  padding-left: 36px;
}
.auth-step__input[aria-invalid="true"] {
  border-color: var(--expressa-color-border);
}
.auth-step__input:focus-visible {
  outline: var(--expressa-border-width-strong) solid rgb(26 26 255 / 10%);
  outline-offset: 0;
  border-color: var(--expressa-color-accent);
}
.auth-step__error,
.auth-step__hint {
  margin: 0;
}
.auth-step__error {
  display: flex;
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
}
.auth-step__hint {
  color: #bbb;
  font-size: 11px;
  line-height: 1.625;
  text-align: center;
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
</style>

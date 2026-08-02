<template>
  <form class="auth-step" @submit.prevent="emit('submit')">
    <label class="auth-step__label" for="auth-phone">Телефон</label>
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
    <p v-if="error" id="auth-phone-error" class="auth-step__error" role="alert">
      {{ error }}
    </p>
    <p v-else id="auth-phone-hint" class="auth-step__hint">
      Для входа используйте номер телефона, зарегистрированный администратором.
    </p>
    <AdminButton :disabled="!valid" type="submit"> Отправить код </AdminButton>
  </form>
</template>

<script setup lang="ts">
import { computed, onMounted, useTemplateRef } from "vue";
import AdminButton from "../../shared/ui/admin-button/AdminButton.vue";
import AdminTextField from "../../shared/ui/admin-text-field/AdminTextField.vue";

import type { PhoneStepEmits, PhoneStepProps } from "./PhoneStep.types";

const props = defineProps<PhoneStepProps>();

const emit = defineEmits<PhoneStepEmits>();

const phoneModel = computed({
  get: () => props.phone,
  set: (value: string) => emit("update:phone", value),
});

const phoneInput =
  useTemplateRef<InstanceType<typeof AdminTextField>>("phoneInput");

onMounted(() => phoneInput.value?.$el.focus());
</script>

<style scoped lang="scss">
.auth-step {
  display: grid;
  gap: var(--expressa-space-md);
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
.auth-step__error,
.auth-step__hint {
  margin: 0;
  font-size: var(--expressa-font-size-caption);
  line-height: var(--expressa-line-height-caption);
}
.auth-step__error {
  color: var(--expressa-color-status-error);
}
.auth-step__hint {
  color: var(--expressa-color-text-muted);
}
</style>

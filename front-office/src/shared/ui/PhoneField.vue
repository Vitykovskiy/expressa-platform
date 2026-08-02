<template>
  <label class="phone-field" :class="{ 'phone-field--error': error }">
    <span class="phone-field-label">Телефон</span>
    <span class="phone-field-wrap"
      ><input
        v-bind="$attrs"
        v-model="formatted"
        class="phone-field-input"
        type="tel"
        autocomplete="tel"
        inputmode="tel"
        placeholder="+7 999 123-45-67"
        :disabled="disabled || loading"
        :aria-invalid="Boolean(error)"
        :aria-describedby="error ? errorId : undefined" /><span
        v-if="loading"
        class="phone-field-spinner"
        aria-label="Загрузка"
        role="status"
    /></span>
    <span v-if="error" :id="errorId" class="phone-field-error">{{
      error
    }}</span>
  </label>
</template>

<script setup lang="ts">
import { computed, useId } from "vue";

defineOptions({ name: "PhoneField", inheritAttrs: false });
withDefaults(
  defineProps<{ disabled?: boolean; error?: string; loading?: boolean }>(),
  { disabled: false, error: "", loading: false },
);
const model = defineModel<string>({ default: "" });
const errorId = useId();
const formatted = computed({
  get: () => model.value,
  set: (value: string) => {
    model.value = value.replace(/[^\d+\s()-]/g, "");
  },
});
</script>

<style scoped>
.phone-field {
  display: grid;
  gap: var(--fo-space-2);
  color: var(--fo-text);
  font: 600 0.875rem/1.3 var(--fo-font);
}
.phone-field-wrap {
  position: relative;
  display: block;
}
.phone-field-input {
  width: 100%;
  min-height: 2.875rem;
  border: 1px solid var(--fo-border);
  border-radius: var(--fo-radius-md);
  padding: 0.75rem;
  color: var(--fo-text);
  background: var(--fo-surface);
  font: 400 1rem/1.2 var(--fo-font);
}
.phone-field--error .phone-field-input {
  border-color: var(--fo-danger);
}
.phone-field-input:disabled {
  color: var(--fo-muted);
  background: var(--fo-surface-muted);
  cursor: not-allowed;
}
.phone-field-error {
  color: var(--fo-danger);
  font: 400 0.8125rem/1.3 var(--fo-font);
}
.phone-field-spinner {
  position: absolute;
  top: 50%;
  right: 0.875rem;
  width: 1rem;
  height: 1rem;
  border: 0.125rem solid var(--fo-brand);
  border-right-color: transparent;
  border-radius: 50%;
  transform: translateY(-50%);
  animation: spin 0.7s linear infinite;
}
@keyframes spin {
  to {
    transform: translateY(-50%) rotate(360deg);
  }
}
@media (prefers-reduced-motion: reduce) {
  .phone-field-spinner {
    animation: none;
  }
}
</style>

<template>
  <label class="field" :class="{ 'field--error': error }">
    <span class="field-label">{{ label }}</span>
    <span class="field-input-wrap"
      ><input
        v-bind="$attrs"
        v-model="model"
        class="field-input"
        type="text"
        :placeholder="placeholder"
        :disabled="disabled || loading"
        :aria-invalid="Boolean(error)"
        :aria-describedby="error ? errorId : undefined" /><span
        v-if="loading"
        class="field-spinner"
        aria-label="Загрузка"
        role="status"
    /></span>
    <span v-if="error" :id="errorId" class="field-error">{{ error }}</span>
  </label>
</template>

<script setup lang="ts">
import { useId } from "vue";

defineOptions({ name: "TextField", inheritAttrs: false });
withDefaults(
  defineProps<{
    disabled?: boolean;
    error?: string;
    label: string;
    loading?: boolean;
    placeholder?: string;
  }>(),
  { disabled: false, error: "", loading: false, placeholder: "" },
);
const model = defineModel<string>({ default: "" });
const errorId = useId();
</script>

<style scoped>
.field {
  display: grid;
  gap: var(--fo-space-2);
  color: var(--fo-text);
  font: 600 0.875rem/1.3 var(--fo-font);
}
.field-input-wrap {
  position: relative;
  display: block;
}
.field-input {
  width: 100%;
  min-height: 2.875rem;
  border: 1px solid var(--fo-border);
  border-radius: var(--fo-radius-md);
  padding: 0.75rem;
  color: var(--fo-text);
  background: var(--fo-surface);
  font: 400 1rem/1.2 var(--fo-font);
}
.field--error .field-input {
  border-color: var(--fo-danger);
}
.field-input:disabled {
  color: var(--fo-muted);
  background: var(--fo-surface-muted);
  cursor: not-allowed;
}
.field-error {
  color: var(--fo-danger);
  font: 400 0.8125rem/1.3 var(--fo-font);
}
.field-spinner {
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
  .field-spinner {
    animation: none;
  }
}
</style>

<template>
  <div class="checkbox" :class="{ 'checkbox--error': error }">
    <label class="checkbox-label"
      ><input
        v-bind="$attrs"
        v-model="model"
        class="checkbox-input"
        type="checkbox"
        :disabled="disabled || loading"
        :aria-invalid="Boolean(error)"
        :aria-busy="loading || undefined"
      /><span>{{ label }}</span></label
    >
    <span v-if="loading" class="checkbox-loading" role="status">Загрузка…</span>
    <span v-if="error" class="checkbox-error">{{ error }}</span>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: "UiCheckbox", inheritAttrs: false });
withDefaults(
  defineProps<{
    disabled?: boolean;
    error?: string;
    label: string;
    loading?: boolean;
  }>(),
  { disabled: false, error: "", loading: false },
);
const model = defineModel<boolean>({ default: false });
</script>

<style scoped>
.checkbox {
  display: grid;
  gap: var(--fo-space-1);
  color: var(--fo-text);
  font: 400 1rem/1.35 var(--fo-font);
}
.checkbox-label {
  display: flex;
  min-height: 2.75rem;
  align-items: center;
  gap: var(--fo-space-2);
  cursor: pointer;
}
.checkbox-input {
  width: 1.25rem;
  height: 1.25rem;
  accent-color: var(--fo-brand);
}
.checkbox-input:disabled + span {
  color: var(--fo-muted);
  cursor: not-allowed;
}
.checkbox-error {
  color: var(--fo-danger);
  font-size: 0.8125rem;
}
.checkbox-loading {
  color: var(--fo-muted);
  font-size: 0.8125rem;
}
</style>

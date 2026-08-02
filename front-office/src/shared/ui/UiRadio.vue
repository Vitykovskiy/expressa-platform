<template>
  <div class="radio" :class="{ 'radio--error': error }">
    <label class="radio-label"
      ><input
        v-bind="$attrs"
        v-model="model"
        class="radio-input"
        type="radio"
        :value="value"
        :disabled="disabled || loading"
        :aria-invalid="Boolean(error)"
        :aria-busy="loading || undefined"
      /><span>{{ label }}</span></label
    >
    <span v-if="loading" class="radio-loading" role="status">Загрузка…</span>
    <span v-if="error" class="radio-error">{{ error }}</span>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: "UiRadio", inheritAttrs: false });
withDefaults(
  defineProps<{
    disabled?: boolean;
    error?: string;
    label: string;
    loading?: boolean;
    value: string;
  }>(),
  { disabled: false, error: "", loading: false },
);
const model = defineModel<string>({ default: "" });
</script>

<style scoped>
.radio {
  display: grid;
  gap: var(--fo-space-1);
  color: var(--fo-text);
  font: 400 1rem/1.35 var(--fo-font);
}
.radio-label {
  display: flex;
  min-height: 2.75rem;
  align-items: center;
  gap: var(--fo-space-2);
  cursor: pointer;
}
.radio-input {
  width: 1.25rem;
  height: 1.25rem;
  accent-color: var(--fo-brand);
}
.radio-input:disabled + span {
  color: var(--fo-muted);
  cursor: not-allowed;
}
.radio-error {
  color: var(--fo-danger);
  font-size: 0.8125rem;
}
.radio-loading {
  color: var(--fo-muted);
  font-size: 0.8125rem;
}
</style>

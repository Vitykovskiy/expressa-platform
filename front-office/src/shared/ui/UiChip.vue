<template>
  <button
    v-bind="$attrs"
    class="chip"
    :class="{ 'chip--selected': model }"
    type="button"
    :aria-pressed="model"
    :disabled="disabled || loading"
    :aria-busy="loading || undefined"
    @click="model = !model"
  >
    <slot>{{ loading ? "Загрузка…" : label }}</slot>
  </button>
</template>

<script setup lang="ts">
defineOptions({ name: "UiChip", inheritAttrs: false });
withDefaults(
  defineProps<{ disabled?: boolean; label: string; loading?: boolean }>(),
  { disabled: false, loading: false },
);
const model = defineModel<boolean>({ default: false });
defineSlots<{ default?: () => unknown }>();
</script>

<style scoped>
.chip {
  min-height: 2.75rem;
  border: 1px solid var(--fo-border);
  border-radius: 999px;
  padding: 0.375rem 0.75rem;
  color: var(--fo-brand-dark);
  background: var(--fo-surface);
  font: 600 0.875rem/1.2 var(--fo-font);
  cursor: pointer;
}
.chip--selected {
  border-color: var(--fo-brand);
  color: white;
  background: var(--fo-brand);
}
.chip:disabled {
  color: var(--fo-muted);
  background: var(--fo-surface-muted);
  cursor: not-allowed;
}
</style>

<template>
  <button
    v-bind="$attrs"
    class="button"
    :class="`button--${variant}`"
    :disabled="disabled || loading"
    :aria-busy="loading || undefined"
    type="button"
    @click="emit('click', $event)"
  >
    <span v-if="loading" class="button-spinner" aria-hidden="true" />
    <slot>{{ loading ? "Загрузка…" : "Продолжить" }}</slot>
  </button>
</template>

<script setup lang="ts">
defineOptions({ name: "UiButton", inheritAttrs: false });

withDefaults(
  defineProps<{
    disabled?: boolean;
    loading?: boolean;
    variant?: "primary" | "secondary";
  }>(),
  { disabled: false, loading: false, variant: "primary" },
);
const emit = defineEmits<{ click: [event: MouseEvent] }>();
defineSlots<{ default?: () => unknown }>();
</script>

<style scoped>
.button {
  display: inline-flex;
  min-height: 2.75rem;
  align-items: center;
  justify-content: center;
  gap: var(--fo-space-2);
  border: 0;
  border-radius: var(--fo-radius-md);
  padding: 0.625rem 1rem;
  font: 700 1rem/1.2 var(--fo-font);
  cursor: pointer;
  transition:
    background-color 150ms ease,
    transform 150ms ease;
}
.button--primary {
  color: white;
  background: var(--fo-brand);
  box-shadow: var(--fo-shadow-sm);
}
.button--secondary {
  border: 1px solid var(--fo-border);
  color: var(--fo-brand-dark);
  background: var(--fo-surface-muted);
}
.button:not(:disabled):active {
  transform: scale(0.98);
}
.button:disabled {
  cursor: not-allowed;
  opacity: 0.58;
}
.button-spinner {
  width: 1rem;
  height: 1rem;
  border: 0.125rem solid currentcolor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
@media (prefers-reduced-motion: reduce) {
  .button {
    transition: none;
  }
  .button-spinner {
    animation: none;
  }
}
</style>

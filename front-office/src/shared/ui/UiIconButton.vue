<template>
  <button
    v-bind="$attrs"
    class="icon-button"
    :disabled="disabled || loading"
    :aria-busy="loading || undefined"
    :aria-label="label"
    type="button"
    @click="emit('click', $event)"
  >
    <span v-if="loading" class="icon-button-spinner" aria-hidden="true" />
    <slot v-else>
      <span aria-hidden="true">{{ icon }}</span>
    </slot>
  </button>
</template>

<script setup lang="ts">
defineOptions({ name: "UiIconButton", inheritAttrs: false });
withDefaults(
  defineProps<{
    disabled?: boolean;
    icon?: string;
    label: string;
    loading?: boolean;
  }>(),
  { disabled: false, icon: "×", loading: false },
);
const emit = defineEmits<{ click: [event: MouseEvent] }>();
defineSlots<{ default?: () => unknown }>();
</script>

<style scoped>
.icon-button {
  display: inline-grid;
  width: 2.75rem;
  height: 2.75rem;
  place-items: center;
  border: 1px solid var(--fo-border);
  border-radius: 50%;
  color: var(--fo-brand-dark);
  background: var(--fo-surface);
  font: 1.5rem/1 var(--fo-font);
  cursor: pointer;
}
.icon-button:disabled {
  cursor: not-allowed;
  opacity: 0.58;
}
.icon-button-spinner {
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
  .icon-button-spinner {
    animation: none;
  }
}
</style>

<template>
  <button
    v-bind="attrs"
    class="admin-button"
    :class="[
      `admin-button--${props.variant}`,
      `admin-button--${props.size}`,
      { 'admin-button--row': props.presentation === 'row' },
    ]"
    :disabled="props.disabled || props.pending"
    :type="props.type"
    @click="emit('click', $event)"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
import { useAttrs } from "vue";
import { ADMIN_BUTTON_DEFAULTS } from "./AdminButton.constants";
import type { AdminButtonEmits, AdminButtonProps } from "./AdminButton.types";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<AdminButtonProps>(),
  ADMIN_BUTTON_DEFAULTS,
);
const emit = defineEmits<AdminButtonEmits>();
const attrs = useAttrs();
defineSlots<{ default(): unknown }>();
</script>

<style scoped lang="scss">
.admin-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--expressa-space-sm);
  min-height: var(--expressa-size-button-min-height);
  padding: var(--expressa-space-button-block)
    var(--expressa-space-button-inline);
  border: var(--expressa-border-width-none) solid
    var(--expressa-color-transparent);
  border-radius: var(--expressa-radius-md);
  font: inherit;
  font-size: var(--expressa-font-size-action);
  font-weight: var(--expressa-font-weight-medium);
  line-height: var(--expressa-line-height-body);
  cursor: pointer;
  transition:
    background-color var(--expressa-motion-duration-control) ease-out,
    border-color var(--expressa-motion-duration-control) ease-out,
    color var(--expressa-motion-duration-control) ease-out,
    opacity var(--expressa-motion-duration-fast) ease-out;
}

.admin-button:disabled {
  pointer-events: none;
  cursor: not-allowed;
  opacity: var(--expressa-state-disabled-opacity);
}

.admin-button:active:not(:disabled) {
  opacity: var(--expressa-state-pressed-opacity);
}

.admin-button--primary {
  color: var(--expressa-color-text-on-accent);
  background: var(--expressa-color-accent);
}

.admin-button--primary:hover:not(:disabled) {
  background: var(--expressa-color-accent-hover);
}

.admin-button--primary:active:not(:disabled) {
  background: var(--expressa-color-accent-active);
}

.admin-button--secondary {
  color: var(--expressa-color-text-primary);
  background: var(--expressa-color-surface);
  border-width: var(--expressa-border-width-default);
  border-color: var(--expressa-color-border);
}

.admin-button--secondary:hover:not(:disabled) {
  background: var(--expressa-color-control-hover-surface);
  border-color: var(--expressa-color-border-strong);
}

.admin-button--ghost:hover:not(:disabled) {
  color: var(--expressa-color-text-primary);
  background: var(--expressa-color-control-hover-surface);
}

.admin-button--destructive {
  color: var(--expressa-color-status-error);
  background: var(--expressa-color-surface);
  border-width: var(--expressa-border-width-default);
  border-color: var(--expressa-color-status-error);
}

.admin-button--destructive:hover:not(:disabled) {
  background: var(--expressa-color-control-hover-surface);
}

.admin-button--destructive:active:not(:disabled) {
  color: var(--expressa-color-status-error-active);
  border-color: var(--expressa-color-status-error-active);
}

.admin-button--ghost {
  color: var(--expressa-color-text-secondary);
  background: var(--expressa-color-transparent);
}
.admin-button:has(> .admin-icon:only-child) {
  min-width: var(--expressa-size-control-min-height);
  padding-inline: 0;
}
.admin-button--compact {
  min-height: var(--expressa-size-control-compact-min-height);
  padding: var(--expressa-space-xs) var(--expressa-space-control-inline);
}

.admin-button--row,
.admin-button--row:has(> .admin-icon:only-child) {
  min-width: var(--expressa-size-control-min-height);
  min-height: var(--expressa-size-control-min-height);
  justify-content: flex-start;
  padding: var(--expressa-space-sm) var(--expressa-space-md);
  border-width: var(--expressa-border-width-none);
  border-radius: var(--expressa-radius-row);
  color: var(--expressa-color-text-primary);
  background: var(--expressa-color-transparent);
  text-align: start;
  white-space: normal;
  overflow-wrap: anywhere;
}
.admin-button--row:hover:not(:disabled),
.admin-button--row:active:not(:disabled) {
  color: var(--expressa-color-text-primary);
  background: var(--expressa-color-control-hover-surface);
}
</style>

<template>
  <button
    v-bind="attrs"
    class="admin-button"
    :class="`admin-button--${props.variant}`"
    :disabled="props.disabled"
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
  min-height: var(--expressa-size-control-min-height);
  padding: var(--expressa-space-control-block)
    var(--expressa-space-button-inline);
  border: var(--expressa-border-width-none) solid
    var(--expressa-color-transparent);
  border-radius: var(--expressa-radius-md);
  font: inherit;
  font-size: var(--expressa-font-size-action);
  font-weight: var(--expressa-font-weight-medium);
  line-height: var(--expressa-line-height-body);
  cursor: pointer;
  transition: opacity var(--expressa-motion-duration-control) ease-in-out;
}

.admin-button:disabled {
  pointer-events: none;
  cursor: not-allowed;
  opacity: var(--expressa-state-disabled-opacity);
}

.admin-button:active:not(:disabled) {
  opacity: var(--expressa-state-pressed-opacity);
}

.admin-button:focus-visible {
  outline: var(--expressa-focus-ring);
  outline-offset: var(--expressa-space-2xs);
}

.admin-button--primary {
  color: var(--expressa-color-text-on-accent);
  background: var(--expressa-color-accent);
}

.admin-button--secondary {
  color: var(--expressa-color-text-primary);
  background: var(--expressa-color-surface-raised);
  border-width: var(--expressa-border-width-default);
  border-color: var(--expressa-color-border);
}

.admin-button--destructive {
  color: var(--expressa-color-status-error);
  background: var(--expressa-color-status-error-surface);
}

.admin-button--ghost {
  color: var(--expressa-color-text-secondary);
  background: var(--expressa-color-transparent);
}
</style>

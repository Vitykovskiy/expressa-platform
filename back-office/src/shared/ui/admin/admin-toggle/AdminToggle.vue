<template>
  <button
    v-bind="attrs"
    class="admin-toggle"
    :aria-checked="props.modelValue === true"
    :disabled="props.disabled"
    role="switch"
    type="button"
    @click="toggle"
  >
    <span class="admin-toggle__track" aria-hidden="true">
      <span class="admin-toggle__thumb" />
    </span>
  </button>
</template>

<script setup lang="ts">
import { useAttrs } from "vue";
import { ADMIN_TOGGLE_DEFAULTS } from "./AdminToggle.constants";
import type { AdminToggleEmits, AdminToggleProps } from "./AdminToggle.types";

// VSwitch's public `hide-details` root is 56px; this switch has a 44px boolean target.
defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<AdminToggleProps>(),
  ADMIN_TOGGLE_DEFAULTS,
);
const emit = defineEmits<AdminToggleEmits>();
const attrs = useAttrs();

function toggle(): void {
  if (!props.disabled) {
    emit("update:modelValue", props.modelValue !== true);
  }
}
</script>

<style scoped lang="scss">
.admin-toggle {
  display: inline-flex;
  width: var(--expressa-size-control-min-height);
  min-width: var(--expressa-size-control-min-height);
  min-height: var(--expressa-size-control-min-height);
  align-items: center;
  justify-content: center;
  padding: var(--expressa-space-2xs) 0;
  border: var(--expressa-border-width-none);
  background: var(--expressa-color-transparent);
  cursor: pointer;
}

.admin-toggle__track {
  display: inline-flex;
  box-sizing: border-box;
  width: var(--expressa-size-switch-track-inline);
  height: var(--expressa-size-switch-track-block);
  align-items: center;
  padding: var(--expressa-space-2xs);
  border-radius: var(--expressa-radius-pill);
  background: var(--expressa-color-border-strong);
  transition: background var(--expressa-motion-duration-control)
    var(--expressa-motion-ease-state);
}

.admin-toggle[aria-checked="true"] .admin-toggle__track {
  justify-content: flex-end;
  background: var(--expressa-color-accent);
}

.admin-toggle:disabled {
  cursor: not-allowed;
  color: var(--expressa-color-text-muted);
}

.admin-toggle:disabled .admin-toggle__track {
  background: var(--expressa-color-control-disabled-surface);
  border: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
}

.admin-toggle:focus-visible {
  outline: var(--expressa-focus-ring);
  outline-offset: var(--expressa-focus-offset);
}

.admin-toggle__thumb {
  width: var(--expressa-size-switch-thumb);
  height: var(--expressa-size-switch-thumb);
  border-radius: var(--expressa-radius-pill);
  background: var(--expressa-color-surface);
}
</style>

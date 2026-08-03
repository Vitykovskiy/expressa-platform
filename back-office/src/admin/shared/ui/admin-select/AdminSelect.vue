<template>
  <select
    v-bind="attrs"
    class="admin-select"
    :value="props.modelValue"
    @change="
      emit('update:modelValue', ($event.target as HTMLSelectElement).value);
      emit('change', $event);
    "
    @input="emit('input', $event)"
  >
    <slot />
  </select>
</template>

<script setup lang="ts">
import { useAttrs } from "vue";
import { ADMIN_SELECT_DEFAULTS } from "./AdminSelect.constants";
import type { AdminSelectEmits, AdminSelectProps } from "./AdminSelect.types";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<AdminSelectProps>(),
  ADMIN_SELECT_DEFAULTS,
);
const emit = defineEmits<AdminSelectEmits>();
const attrs = useAttrs();
defineSlots<{ default(): unknown }>();
</script>

<style scoped lang="scss">
.admin-select {
  width: 100%;
  min-height: var(--expressa-size-control-min-height);
  padding: var(--expressa-space-sm) var(--expressa-space-md);
  border: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
  border-radius: var(--expressa-radius-md);
  color: var(--expressa-color-text-primary);
  background: var(--expressa-color-surface);
  font: inherit;
}

.admin-select:disabled {
  cursor: not-allowed;
  opacity: var(--expressa-state-disabled-opacity);
  background: var(--expressa-color-control-disabled-surface);
}

.admin-select:focus-visible {
  outline: var(--expressa-focus-ring);
  outline-offset: var(--expressa-space-2xs);
}
</style>

<template>
  <input
    v-bind="attrs"
    class="admin-text-field"
    :value="props.modelValue"
    @change="emit('change', $event)"
    @input="
      emit('update:modelValue', ($event.target as HTMLInputElement).value);
      emit('input', $event);
    "
  />
</template>

<script setup lang="ts">
import { useAttrs } from "vue";
import { ADMIN_TEXT_FIELD_DEFAULTS } from "./AdminTextField.constants";
import type {
  AdminTextFieldEmits,
  AdminTextFieldProps,
} from "./AdminTextField.types";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<AdminTextFieldProps>(),
  ADMIN_TEXT_FIELD_DEFAULTS,
);
const emit = defineEmits<AdminTextFieldEmits>();
const attrs = useAttrs();
</script>

<style scoped lang="scss">
.admin-text-field {
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

.admin-text-field:disabled {
  cursor: not-allowed;
  opacity: var(--expressa-state-disabled-opacity);
  background: var(--expressa-color-control-disabled-surface);
}

.admin-text-field:focus-visible {
  outline: var(--expressa-focus-ring);
  outline-offset: var(--expressa-space-2xs);
}

.admin-text-field::placeholder {
  color: var(--expressa-color-text-muted);
}
</style>

<template>
  <div class="admin-radio-group">
    <button
      v-for="item in props.items"
      :key="item.value"
      :disabled="props.disabled"
      :data-selected="props.modelValue === item.value"
      class="admin-radio-group__option"
      type="button"
      @click="select(item.value)"
    >
      <span class="admin-radio-group__mark" />
      {{ item.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { ADMIN_RADIO_GROUP_DEFAULTS } from "./AdminRadioGroup.constants";
import type {
  AdminRadioGroupEmits,
  AdminRadioGroupProps,
} from "./AdminRadioGroup.types";

const props = withDefaults(
  defineProps<AdminRadioGroupProps>(),
  ADMIN_RADIO_GROUP_DEFAULTS,
);
const emit = defineEmits<AdminRadioGroupEmits>();

function select(value: string): void {
  if (!props.disabled) emit("update:modelValue", value);
}
</script>

<style scoped lang="scss">
.admin-radio-group {
  display: grid;
  gap: var(--expressa-space-sm);
  min-width: 0;
}
.admin-radio-group__option {
  display: inline-flex;
  min-height: var(--expressa-size-control-min-height);
  align-items: center;
  gap: var(--expressa-space-sm);
  padding: var(--expressa-space-xs) var(--expressa-space-sm);
  border: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
  border-radius: var(--expressa-radius-md);
  color: var(--expressa-color-text-primary);
  background: var(--expressa-color-surface);
  font: inherit;
  text-align: start;
}
.admin-radio-group__mark {
  width: var(--expressa-size-checkbox);
  height: var(--expressa-size-checkbox);
  border: var(--expressa-border-width-default) solid
    var(--expressa-color-border-strong);
  border-radius: var(--expressa-radius-pill);
}
.admin-radio-group__option[data-selected="true"] {
  border-color: var(--expressa-color-accent);
  background: var(--expressa-color-control-selected-surface);
}
.admin-radio-group__option[data-selected="true"] .admin-radio-group__mark {
  border: var(--expressa-space-4) solid var(--expressa-color-accent);
}
.admin-radio-group__option:disabled {
  color: var(--expressa-color-text-muted);
  background: var(--expressa-color-control-disabled-surface);
}
</style>

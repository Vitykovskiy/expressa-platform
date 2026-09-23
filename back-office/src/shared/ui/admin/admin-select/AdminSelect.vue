<template>
  <select
    v-bind="attrs"
    class="admin-select"
    :value="props.modelValue"
    @change="handleChange"
  >
    <option v-if="props.placeholder" value="" disabled>
      {{ props.placeholder }}
    </option>
    <option
      v-for="item in props.items"
      :key="item.value"
      :value="item.value"
      :disabled="item.disabled"
    >
      {{ item.title }}
    </option>
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

function handleChange(event: Event): void {
  emit("update:modelValue", (event.target as HTMLSelectElement).value);
}
</script>

<style scoped lang="scss">
.admin-select {
  inline-size: 100%;
  min-block-size: var(--expressa-size-control-min-height);
  padding: var(--expressa-space-control-block)
    var(--expressa-space-control-inline);
  border: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
  border-radius: var(--expressa-radius-md);
  color: var(--expressa-color-text-primary);
  background: var(--expressa-color-surface);
  font: inherit;
  line-height: var(--expressa-line-height-body);
}
.admin-select:disabled {
  cursor: not-allowed;
  color: var(--expressa-color-text-secondary);
  background: var(--expressa-color-control-disabled-surface);
}
</style>

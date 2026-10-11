<template>
  <label class="ui-checkbox" :class="{ 'ui-checkbox--disabled': disabled }">
    <input
      v-bind="$attrs"
      class="ui-checkbox__input"
      type="checkbox"
      :checked="modelValue"
      :disabled="disabled"
      @change="update"
    />
    <span class="ui-checkbox__label">{{ label }}</span>
  </label>
</template>

<script setup lang="ts">
import type { UiCheckboxEmits, UiCheckboxProps } from "./UiCheckbox.types";

defineOptions({ inheritAttrs: false });

const props = defineProps<UiCheckboxProps>();
const emit = defineEmits<UiCheckboxEmits>();

function update(event: Event) {
  if (props.disabled || !(event.target instanceof HTMLInputElement)) {
    return;
  }

  emit("update:modelValue", event.target.checked);
}
</script>

<style scoped>
.ui-checkbox {
  display: flex;
  gap: var(--space-md);
  align-items: center;
  min-block-size: var(--control-height);
  cursor: pointer;
}
.ui-checkbox__input {
  inline-size: var(--icon-size);
  block-size: var(--icon-size);
  flex: none;
  accent-color: var(--color-primary);
}
.ui-checkbox__label {
  font-size: var(--font-label);
  line-height: var(--line-label);
  overflow-wrap: anywhere;
}
.ui-checkbox--disabled {
  color: var(--color-foreground-muted);
  cursor: default;
}
</style>

<template>
  <button
    class="ui-switch"
    :class="{ 'ui-switch--on': modelValue }"
    type="button"
    role="switch"
    :aria-checked="modelValue"
    :aria-busy="pending || undefined"
    :disabled="blocked"
    @click="update"
  >
    <span class="ui-switch__track" aria-hidden="true"
      ><span class="ui-switch__thumb"
    /></span>
    <span class="ui-switch__label">{{ label }}</span>
    <span class="ui-switch__state" aria-hidden="true">{{ stateText }}</span>
  </button>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { UiSwitchEmits, UiSwitchProps } from "./UiSwitch.types";

const props = defineProps<UiSwitchProps>();
const emit = defineEmits<UiSwitchEmits>();
const blocked = computed(() => props.disabled || props.pending);
const stateText = computed(() =>
  props.pending ? "Сохранение…" : props.modelValue ? "Да" : "Нет",
);

function update() {
  if (blocked.value) {
    return;
  }

  emit("update:modelValue", !props.modelValue);
}
</script>

<style scoped>
.ui-switch {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  text-align: start;
  min-block-size: var(--control-height);
  padding: 0;
  background: transparent;
  border: 0;
  color: var(--color-foreground);
  cursor: pointer;
}
.ui-switch__track {
  display: flex;
  flex: none;
  align-items: center;
  inline-size: var(--switch-width);
  block-size: var(--space-xl);
  padding: var(--border-width);
  border: var(--border-width) solid var(--color-control-border);
  border-radius: var(--radius-control);
  background: var(--color-surface-muted);
}
.ui-switch__thumb {
  inline-size: var(--switch-thumb);
  block-size: var(--switch-thumb);
  border-radius: calc(var(--radius-control) - var(--border-width));
  background: var(--color-foreground-muted);
}
.ui-switch--on .ui-switch__track {
  justify-content: end;
  background: var(--color-primary);
  border-color: var(--color-primary);
}
.ui-switch--on .ui-switch__thumb {
  background: var(--color-on-primary);
}
.ui-switch__label {
  font-size: var(--font-label);
  overflow-wrap: anywhere;
}
.ui-switch__state {
  font-size: var(--font-label);
  color: var(--color-foreground-muted);
}
.ui-switch:disabled {
  cursor: default;
  color: var(--color-foreground-muted);
}
</style>

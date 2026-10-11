<template>
  <button
    class="ui-button"
    :class="variantClass"
    :type="type"
    :disabled="blocked"
    :aria-busy="loading || undefined"
    @click="activate"
  >
    <span
      class="ui-button__label"
      :class="{ 'ui-button__label--loading': loading }"
      ><slot
    /></span>
    <span v-if="loading" class="ui-button__busy" aria-hidden="true">···</span>
  </button>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { buttonDefaults } from "./UiButton.constants";
import type {
  UiButtonEmits,
  UiButtonProps,
  UiButtonSlots,
} from "./UiButton.types";

const props = withDefaults(defineProps<UiButtonProps>(), buttonDefaults);
const emit = defineEmits<UiButtonEmits>();

defineSlots<UiButtonSlots>();

const blocked = computed(() => props.disabled || props.loading);
const variantClass = computed(() => `ui-button--${props.variant}`);

function activate(event: MouseEvent) {
  if (blocked.value) {
    return;
  }

  emit("activate", event);
}
</script>

<style scoped>
.ui-button {
  position: relative;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  min-block-size: var(--control-height);
  min-inline-size: var(--control-height);
  max-inline-size: 100%;
  padding: var(--space-sm) var(--space-lg);
  border: var(--border-width) solid var(--color-control-border);
  border-radius: var(--button-radius);
  background: var(--color-surface);
  color: var(--color-foreground);
  font-size: var(--font-label);
  font-weight: var(--weight-label);
  line-height: var(--line-label);
  cursor: pointer;
  transition:
    background var(--duration-feedback),
    color var(--duration-feedback);
}
.ui-button__label {
  overflow-wrap: anywhere;
}
.ui-button__label--loading {
  opacity: 0;
}
.ui-button__busy {
  position: absolute;
  font-size: var(--font-section-title);
}
.ui-button:hover:not(:disabled) {
  background: var(--color-surface-muted);
}
.ui-button:active:not(:disabled) {
  background: var(--color-selected);
}
.ui-button--primary {
  background: var(--color-primary);
  color: var(--color-on-primary);
  border-color: var(--color-primary);
}
.ui-button--primary:hover:not(:disabled) {
  background: var(--color-primary-hover);
}
.ui-button--primary:active:not(:disabled) {
  background: var(--color-primary-pressed);
}
.ui-button--quiet {
  border-color: transparent;
  background: transparent;
}
.ui-button--danger {
  color: var(--color-danger);
  border-color: var(--color-danger);
}
.ui-button--danger:hover:not(:disabled) {
  background: var(--color-danger-muted);
}
.ui-button:disabled {
  cursor: default;
  background: var(--color-surface-muted);
  color: var(--color-foreground-muted);
  border-color: var(--color-border);
}
</style>

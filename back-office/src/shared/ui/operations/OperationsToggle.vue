<template>
  <div class="operations-toggle" :class="rowClasses">
    <div class="operations-toggle__copy">
      <p class="operations-toggle__label">{{ props.label }}</p>
      <p class="operations-toggle__description">{{ props.description }}</p>
    </div>
    <button
      class="operations-toggle__control"
      role="switch"
      type="button"
      :aria-label="props.label"
      :aria-checked="props.modelValue"
      :disabled="props.disabled"
      @click="emit('update:modelValue', !props.modelValue)"
    >
      <img :src="icon" alt="" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { TOGGLE_DEFAULTS, TOGGLE_ICONS } from "./OperationsToggle.constants";
import type {
  OperationsToggleEmits,
  OperationsToggleProps,
} from "./OperationsToggle.types";

const props = withDefaults(
  defineProps<OperationsToggleProps>(),
  TOGGLE_DEFAULTS,
);
const emit = defineEmits<OperationsToggleEmits>();
const icon = computed(() =>
  props.modelValue ? TOGGLE_ICONS.checked : TOGGLE_ICONS.unchecked,
);
const rowClasses = computed(() => ({
  "operations-toggle--divider": props.divider,
}));
</script>

<style scoped>
.operations-toggle {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding-block: 12px;
  font-family: Inter, sans-serif;
}
.operations-toggle--divider {
  box-shadow: inset 0 -1px var(--color-border);
}
.operations-toggle__copy {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.operations-toggle__label {
  margin: 0;
  color: var(--color-foreground);
  font-size: 15px;
  font-weight: 600;
  line-height: 22.5px;
}
.operations-toggle__description {
  margin: 0;
  color: var(--color-foreground-muted);
  font-size: 12px;
  font-weight: 400;
  line-height: 16px;
}
.operations-toggle__control {
  display: block;
  flex-shrink: 0;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}
.operations-toggle__control img {
  display: block;
}
.operations-toggle__control:disabled {
  opacity: var(--opacity-disabled);
  cursor: default;
}
</style>

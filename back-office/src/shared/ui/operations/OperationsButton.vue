<template>
  <button
    class="operations-button"
    :class="buttonClasses"
    :type="props.type"
    :form="props.form"
    :disabled="props.disabled"
    @click="emit('click', $event)"
  >
    {{ props.label }}
  </button>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { BUTTON_DEFAULTS } from "./OperationsButton.constants";
import type {
  OperationsButtonEmits,
  OperationsButtonProps,
} from "./OperationsButton.types";
import "./operations.tokens.css";

const props = withDefaults(
  defineProps<OperationsButtonProps>(),
  BUTTON_DEFAULTS,
);
const emit = defineEmits<OperationsButtonEmits>();
const buttonClasses = computed(() => [
  `operations-button--${props.kind}`,
  { "operations-button--compact": props.compact },
]);
</script>

<style scoped>
.operations-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  max-width: 100%;
  padding: 10px 20px;
  border: 0;
  border-radius: var(--radius-control);
  font-family: Inter, sans-serif;
  font-size: 13px;
  font-weight: 500;
  line-height: 19.5px;
  white-space: nowrap;
  cursor: pointer;
}
.operations-button--primary {
  background: var(--color-primary);
  color: var(--color-on-primary);
}
.operations-button--secondary {
  border: 1px solid var(--color-border);
  background: var(--color-background);
  color: var(--color-foreground);
}
.operations-button--destructive {
  background: var(--operations-danger-surface);
  color: var(--color-danger);
}
.operations-button--ghost {
  background: transparent;
  color: var(--color-foreground-muted);
}
.operations-button--compact {
  padding-inline: 16px;
}
.operations-button:disabled {
  opacity: var(--opacity-disabled);
  cursor: default;
}
</style>

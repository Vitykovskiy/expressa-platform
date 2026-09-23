<template>
  <textarea
    v-bind="attrs"
    class="admin-textarea"
    :value="props.modelValue"
    @change="emit('change', $event)"
    @input="handleInput"
  />
</template>

<script setup lang="ts">
import { useAttrs } from "vue";
import { ADMIN_TEXTAREA_DEFAULTS } from "./AdminTextarea.constants";
import type {
  AdminTextareaEmits,
  AdminTextareaProps,
} from "./AdminTextarea.types";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<AdminTextareaProps>(),
  ADMIN_TEXTAREA_DEFAULTS,
);
const emit = defineEmits<AdminTextareaEmits>();
const attrs = useAttrs();

function handleInput(event: InputEvent): void {
  const target = event.target;

  if (!(target instanceof HTMLTextAreaElement)) return;

  emit("update:modelValue", target.value);
  emit("input", event);
}
</script>

<style scoped lang="scss">
.admin-textarea {
  width: 100%;
  min-height: var(--expressa-size-textarea-min-height);
  padding: var(--expressa-space-control-block)
    var(--expressa-space-control-inline);
  border: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
  border-radius: var(--expressa-radius-md);
  color: var(--expressa-color-text-primary);
  background: var(--expressa-color-surface);
  font: inherit;
  line-height: var(--expressa-line-height-body);
  resize: vertical;
  transition:
    border-color var(--expressa-motion-duration-control) ease-out,
    background-color var(--expressa-motion-duration-control) ease-out;
}

.admin-textarea:disabled {
  cursor: not-allowed;
  color: var(--expressa-color-text-secondary);
  background: var(--expressa-color-control-disabled-surface);
}

.admin-textarea::placeholder {
  color: var(--expressa-color-text-muted);
}
</style>

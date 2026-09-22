<template>
  <div
    class="admin-text-field-shell"
    :class="{ 'admin-text-field-shell--with-prepend': slots.prepend }"
    @click="activateInput"
  >
    <span
      v-if="slots.prepend"
      class="admin-text-field__prepend"
      aria-hidden="true"
    >
      <slot name="prepend" />
    </span>
    <input
      ref="input"
      v-bind="attrs"
      class="admin-text-field"
      :value="props.modelValue"
      @change="emit('change', $event)"
      @input="handleInput"
    />
  </div>
</template>

<script setup lang="ts">
import { useAttrs, useSlots, useTemplateRef } from "vue";
import { ADMIN_TEXT_FIELD_DEFAULTS } from "./AdminTextField.constants";
import type {
  AdminTextFieldEmits,
  AdminTextFieldProps,
} from "./AdminTextField.types";

// VTextField public chrome differs from React by 1,327–1,406 pixels at six widths.
defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<AdminTextFieldProps>(),
  ADMIN_TEXT_FIELD_DEFAULTS,
);
const emit = defineEmits<AdminTextFieldEmits>();
const attrs = useAttrs();
const slots = useSlots();
const input = useTemplateRef<{ focus(): void }>("input");

function handleInput(event: AdminTextFieldEmits["input"][0]): void {
  const target = event.target;

  if (!target || !("value" in target) || typeof target.value !== "string") {
    return;
  }

  emit("update:modelValue", target.value);
  emit("input", event);
}

function focus(): void {
  input.value?.focus();
}

function activateInput(event: MouseEvent): void {
  if (event.target !== input.value) focus();
}

defineExpose({ focus });
</script>

<style scoped lang="scss">
.admin-text-field-shell {
  display: flex;
  width: 100%;
  min-height: var(--expressa-size-control-min-height);
  align-items: center;
  padding: var(--expressa-space-sm) var(--expressa-space-md);
  border: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
  border-radius: var(--expressa-radius-md);
  background: var(--expressa-color-surface);
  transition:
    border-color var(--expressa-motion-duration-control) ease-out,
    background-color var(--expressa-motion-duration-control) ease-out;
}

.admin-text-field-shell:has(.admin-text-field:disabled) {
  cursor: not-allowed;
  opacity: var(--expressa-state-disabled-opacity);
  background: var(--expressa-color-control-disabled-surface);
}

.admin-text-field-shell:focus-within {
  outline: var(--expressa-focus-ring);
  outline-offset: var(--expressa-focus-offset);
}

.admin-text-field {
  width: 100%;
  min-width: 0;
  padding: 0;
  border: var(--expressa-border-width-none);
  outline: none;
  color: var(--expressa-color-text-primary);
  background: var(--expressa-color-transparent);
  font: inherit;
}

.admin-text-field__prepend {
  display: inline-grid;
  flex: 0 0 auto;
  width: var(--expressa-size-checkbox);
  height: var(--expressa-size-checkbox);
  margin-right: var(--expressa-space-sm);
  place-items: center;
  color: var(--expressa-color-text-muted);
}

.admin-text-field::placeholder {
  color: var(--expressa-color-text-muted);
}
</style>

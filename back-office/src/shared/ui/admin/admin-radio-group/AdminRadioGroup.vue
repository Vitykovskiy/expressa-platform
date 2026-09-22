<template>
  <div
    :aria-label="props['aria-label']"
    class="admin-radio-group"
    role="radiogroup"
  >
    <button
      v-for="item in props.items"
      :key="item.value"
      :aria-checked="props.modelValue === item.value"
      :disabled="props.disabled"
      :tabindex="focusedValue === item.value ? 0 : -1"
      class="admin-radio-group__option"
      role="radio"
      type="button"
      @click="select(item.value)"
      @focus="focusedValue = item.value"
      @keydown="onKeydown($event, item.value)"
    >
      <span aria-hidden="true" class="admin-radio-group__mark" />
      {{ item.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { shallowRef, watch } from "vue";
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
const focusedValue = shallowRef(props.modelValue);

watch(
  () => props.modelValue,
  (value) => {
    focusedValue.value = value;
  },
);

function select(value: string): void {
  if (!props.disabled) emit("update:modelValue", value);
}

function onKeydown(event: KeyboardEvent, value: string): void {
  const index = props.items.findIndex((item) => item.value === value);
  if (index < 0) return;
  let nextIndex: number | undefined;
  if (event.key === "ArrowDown" || event.key === "ArrowRight")
    nextIndex = (index + 1) % props.items.length;
  else if (event.key === "ArrowUp" || event.key === "ArrowLeft")
    nextIndex = (index - 1 + props.items.length) % props.items.length;
  else if (event.key === "Home") nextIndex = 0;
  else if (event.key === "End") nextIndex = props.items.length - 1;
  else if (event.key === " " || event.key === "Enter") {
    event.preventDefault();
    select(value);
    return;
  } else return;
  event.preventDefault();
  if (nextIndex === undefined) return;
  const next = props.items[nextIndex];
  if (!next) return;
  focusedValue.value = next.value;
  select(next.value);
  const button = event.currentTarget as HTMLButtonElement;
  button.parentElement
    ?.querySelectorAll<HTMLButtonElement>("[role=radio]")
    [nextIndex]?.focus();
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
.admin-radio-group__option[aria-checked="true"] {
  border-color: var(--expressa-color-accent);
  background: var(--expressa-color-control-selected-surface);
}
.admin-radio-group__option[aria-checked="true"] .admin-radio-group__mark {
  border: var(--expressa-space-4) solid var(--expressa-color-accent);
}
.admin-radio-group__option:disabled {
  color: var(--expressa-color-text-muted);
  background: var(--expressa-color-control-disabled-surface);
}
.admin-radio-group__option:focus-visible {
  outline: var(--expressa-focus-ring);
  outline-offset: var(--expressa-focus-offset);
}
</style>

<template>
  <label
    class="slot-option"
    :class="{
      'slot-option--selected': props.selected,
      'slot-option--unavailable': !props.available,
    }"
  >
    <input
      class="slot-option__input"
      type="radio"
      name="pickup-time"
      :value="props.value"
      :checked="props.selected"
      :disabled="props.disabled || !props.available"
      @change="emit('select', props.value)"
    />
    <span class="slot-option__label">{{ props.label }}</span>
    <span v-if="!props.available" class="slot-option__occupied">Занято</span>
    <img
      v-else
      :src="props.selected ? checkedIcon : uncheckedIcon"
      width="24"
      height="24"
      alt=""
    />
  </label>
</template>

<script setup lang="ts">
import checkedIcon from "./assets/radio-checked.svg";
import uncheckedIcon from "./assets/radio-unchecked.svg";
import type { SlotOptionEmits, SlotOptionProps } from "./SlotOption.types";

const props = defineProps<SlotOptionProps>();
const emit = defineEmits<SlotOptionEmits>();
</script>

<style scoped>
.slot-option {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--customer-space-7);
  min-height: 64px; /* Высота строки принятого макета; отдельного token нет. */
  padding: var(--customer-space-9);
  color: var(--customer-text-on-surface);
  background: var(--customer-surface);
  border: 1px solid var(--customer-border-subtle-on-surface);
  border-radius: var(--customer-radius-sm);
  cursor: pointer;
}
.slot-option--selected {
  background: var(--customer-color-blue-500-10);
  border: 2px solid var(--customer-background);
  padding: calc(var(--customer-space-9) - 1px);
}
.slot-option--unavailable {
  color: var(--customer-color-text-secondary-on-surface);
  cursor: not-allowed;
}
.slot-option:has(input:disabled) {
  cursor: not-allowed;
}
.slot-option:has(input:focus-visible) {
  outline: 2px solid var(--customer-focus-ring);
  outline-offset: 2px;
}
.slot-option__input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
}
.slot-option__label {
  flex: 1;
  min-width: 0;
  overflow-wrap: anywhere;
  font-weight: var(--customer-font-weight-bold);
}
.slot-option__occupied {
  font-size: var(--customer-font-size-sm);
}
.slot-option img {
  flex-shrink: 0;
}
@media (max-width: 767px) {
  .slot-option {
    min-height: 56px;
  }
}
</style>

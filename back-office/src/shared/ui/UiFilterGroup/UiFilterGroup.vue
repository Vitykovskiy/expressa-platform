<template>
  <fieldset class="ui-filter-group" :disabled="disabled">
    <legend class="ui-label ui-filter-group__legend">{{ label }}</legend>
    <div class="ui-filter-group__options">
      <label
        v-for="option in options"
        :key="option.value"
        class="ui-filter-group__option"
        :class="{
          'ui-filter-group__option--selected': option.value === modelValue,
        }"
      >
        <input
          class="ui-filter-group__radio"
          type="radio"
          :name="groupId"
          :value="option.value"
          :checked="option.value === modelValue"
          @click="reselect(option.value)"
          @change="select(option.value)"
        />
        <span>{{ option.label }}</span>
      </label>
    </div>
  </fieldset>
</template>

<script setup lang="ts">
import { useId } from "vue";
import type {
  UiFilterGroupEmits,
  UiFilterGroupProps,
} from "./UiFilterGroup.types";

const props = defineProps<UiFilterGroupProps>();
const emit = defineEmits<UiFilterGroupEmits>();
const groupId = useId();

function reselect(value: string) {
  if (value === props.modelValue) {
    select(value);
  }
}

function select(value: string) {
  if (props.disabled) {
    return;
  }

  emit("update:modelValue", value);
}
</script>

<style scoped>
.ui-filter-group {
  margin: 0;
  padding: 0;
  min-inline-size: 0;
  border: 0;
}
.ui-filter-group__legend {
  margin-block-end: var(--space-sm);
}
.ui-filter-group__options {
  display: flex;
  flex-wrap: wrap;
  gap: var(--control-gap);
}
.ui-filter-group__option {
  position: relative;
  display: flex;
  align-items: center;
  min-block-size: var(--control-height);
  padding: var(--space-sm) var(--space-md);
  border: var(--border-width) solid var(--color-control-border);
  border-radius: var(--radius-control);
  color: var(--color-foreground-muted);
  font-size: var(--font-label);
  line-height: var(--line-label);
  overflow-wrap: anywhere;
  cursor: pointer;
}
.ui-filter-group__radio {
  position: absolute;
  opacity: 0;
  inline-size: 100%;
  block-size: 100%;
  inset: 0;
  margin: 0;
  cursor: inherit;
}
.ui-filter-group__option--selected {
  border-color: var(--color-primary);
  background: var(--color-selected);
  color: var(--color-on-selected);
}
.ui-filter-group__option:has(:focus-visible) {
  outline: var(--focus-width) solid var(--color-focus);
  outline-offset: var(--focus-offset);
}
.ui-filter-group__radio:focus-visible {
  outline: none;
}
.ui-filter-group:disabled .ui-filter-group__option {
  cursor: default;
  background: var(--color-surface-muted);
  color: var(--color-foreground-muted);
  border-color: var(--color-border);
}
</style>

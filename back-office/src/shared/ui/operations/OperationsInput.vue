<template>
  <label class="operations-field" :class="fieldClasses">
    <span class="operations-field__label" :class="labelClasses">{{
      props.label
    }}</span>
    <span class="operations-field__control">
      <img
        v-if="isSearchField"
        class="operations-field__search"
        :src="SEARCH_ICON"
        alt=""
      />
      <select
        v-if="isSelectField"
        v-bind="{ ...$attrs, ...nativeFieldAttributes }"
        class="operations-field__input operations-field__input--select"
        @change="emitNativeValue"
      >
        <option
          v-for="option in props.options"
          :key="option.value"
          :value="option.value"
          :disabled="option.disabled"
        >
          {{ option.label }}
        </option>
      </select>
      <input
        v-else
        v-bind="{ ...$attrs, ...nativeFieldAttributes }"
        class="operations-field__input"
        :type="inputType"
        :placeholder="props.placeholder"
        :step="props.step"
        :inputmode="props.inputmode"
        @input="emitNativeValue"
      />
    </span>
  </label>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { INPUT_DEFAULTS, SEARCH_ICON } from "./OperationsInput.constants";
import type {
  OperationsInputEmits,
  OperationsInputProps,
} from "./OperationsInput.types";

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<OperationsInputProps>(), INPUT_DEFAULTS);
const emit = defineEmits<OperationsInputEmits>();

const isSearchField = computed(() => props.type === "search");
const isSelectField = computed(() => props.type === "select");

// reason задаёт оформление причины, а браузер получает обычное текстовое поле.
const inputType = computed(() =>
  props.type === "reason" ? "text" : props.type,
);

// Обе нативные ветки получают один контракт; явные props важнее $attrs.
const nativeFieldAttributes = computed(() => ({
  value: props.modelValue,
  disabled: props.disabled,
  required: props.required,
  autocomplete: props.autocomplete,
  autofocus: props.autofocus,
  "aria-describedby": props["aria-describedby"],
}));

const fieldClasses = computed(() => ({
  "operations-field--disabled": props.disabled,
  "operations-field--search": isSearchField.value,
  "operations-field--reason": props.type === "reason",
}));
const labelClasses = computed(() => ({
  "operations-field__label--hidden": props.hideLabel,
}));

function emitNativeValue(event: globalThis.Event) {
  const target = event.target;

  if (
    target instanceof globalThis.HTMLInputElement ||
    target instanceof globalThis.HTMLSelectElement
  ) {
    emit("update:modelValue", target.value);
  }
}
</script>

<style scoped>
.operations-field {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  min-width: 0;
  font-family: Inter, sans-serif;
}
.operations-field__label {
  color: var(--color-foreground-muted);
  font-size: 13px;
  font-weight: 500;
  line-height: 19.5px;
}
.operations-field__label--hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
}
.operations-field__control {
  position: relative;
  display: block;
  width: 100%;
}
.operations-field__input {
  display: block;
  width: 100%;
  min-width: 0;
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  outline: none;
  background: var(--color-surface);
  color: var(--color-foreground);
  font:
    400 14px/20px Inter,
    sans-serif;
}
.operations-field__input::placeholder {
  color: var(--color-foreground-muted);
  opacity: 1;
}

/* Reset Vuetify скрывает нативную стрелку; select должен оставаться видимым выбором. */
.operations-field__input--select {
  appearance: auto;
}

.operations-field__input[type="time"] {
  box-sizing: border-box;
  height: 42px;
}
.operations-field__input:focus {
  border-color: var(--color-primary);
}
.operations-field--disabled {
  opacity: var(--opacity-disabled);
}
.operations-field--disabled .operations-field__input,
.operations-field--search .operations-field__input {
  background: var(--color-background);
}
.operations-field--search .operations-field__input {
  padding-left: 36px;
  font-size: 13px;
  line-height: 19.5px;
}
.operations-field__search {
  position: absolute;
  z-index: 1;
  top: 12px;
  left: 11px;
  display: block;
  pointer-events: none;
}

.operations-field--reason .operations-field__input {
  padding: 12px;
}
</style>

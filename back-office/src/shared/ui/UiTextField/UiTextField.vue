<template>
  <div class="ui-field">
    <label class="ui-label" :for="inputId">{{ label }}</label>
    <input
      v-bind="$attrs"
      :id="inputId"
      class="ui-text-field"
      :class="{ 'ui-text-field--error': error }"
      :value="modelValue"
      :name="name"
      :type="type"
      :disabled="disabled"
      :readonly="readOnly"
      :aria-invalid="Boolean(error)"
      :aria-describedby="messageId"
      @input="update"
    />
    <p
      v-if="message"
      :id="messageId"
      class="ui-message"
      :class="{ 'ui-message--error': error }"
    >
      {{ message }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, useId } from "vue";
import { textFieldDefaults } from "./UiTextField.constants";
import type { UiTextFieldEmits, UiTextFieldProps } from "./UiTextField.types";

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<UiTextFieldProps>(), textFieldDefaults);
const emit = defineEmits<UiTextFieldEmits>();
const generatedId = useId();
const inputId = computed(() => props.id ?? generatedId);
const message = computed(() => props.error || props.hint);
const messageId = computed(() =>
  message.value ? `${inputId.value}-message` : undefined,
);

function update(event: Event) {
  if (
    props.disabled ||
    props.readOnly ||
    !(event.target instanceof HTMLInputElement)
  ) {
    return;
  }

  emit("update:modelValue", event.target.value);
}
</script>

<style scoped>
.ui-text-field {
  min-inline-size: 0;
  inline-size: 100%;
  min-block-size: var(--control-height);
  padding: var(--space-sm) var(--space-md);
  border: var(--border-width) solid var(--color-control-border);
  border-radius: var(--field-radius);
  background: var(--color-surface);
  color: var(--color-foreground);
  font-size: var(--font-body);
  line-height: var(--line-label);
}
.ui-text-field--error {
  border-color: var(--color-danger);
}
.ui-text-field:disabled,
.ui-text-field:read-only {
  background: var(--color-surface-muted);
  color: var(--color-foreground-muted);
}
</style>

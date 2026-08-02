<template>
  <UiTextField
    :aria-describedby="attrs['aria-describedby']"
    :aria-label="attrs['aria-label']"
    :class="attrs.class"
    :model-value="modelValue"
    :label="label"
    autocomplete="off"
    :disabled="disabled"
    :error-message="errorMessage"
    inputmode="search"
    :data-testid="attrs['data-testid']"
    @blur="forwardBlur"
    @focus="forwardFocus"
    @keydown="forwardKeydown"
    @update:model-value="emit('update:modelValue', $event)"
  />
</template>

<script setup lang="ts">
import { useAttrs } from "vue";
import UiTextField from "./UiTextField.vue";

defineOptions({ inheritAttrs: false });
withDefaults(
  defineProps<{
    modelValue: string;
    label?: string;
    disabled?: boolean;
    errorMessage?: string;
  }>(),
  { label: "Поиск", disabled: false, errorMessage: "" },
);
const attrs = useAttrs();
const emit = defineEmits<{ "update:modelValue": [value: string] }>();
const forwardBlur = attrs.onBlur as ((event: FocusEvent) => void) | undefined;
const forwardFocus = attrs.onFocus as ((event: FocusEvent) => void) | undefined;
const forwardKeydown = attrs.onKeydown as
  ((event: KeyboardEvent) => void) | undefined;
</script>

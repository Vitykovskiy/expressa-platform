<template>
  <VTextField
    :aria-describedby="attrs['aria-describedby']"
    :aria-label="attrs['aria-label']"
    :class="['ui-text-field', attrs.class]"
    :autocomplete="autocomplete"
    :disabled="disabled"
    :error-messages="errorMessage"
    :inputmode="inputmode"
    :label="label"
    :model-value="modelValue"
    :data-testid="attrs['data-testid']"
    @blur="forwardBlur"
    @focus="forwardFocus"
    @keydown="forwardKeydown"
    @update:model-value="emit('update:modelValue', String($event ?? ''))"
  />
</template>

<script setup lang="ts">
import { useAttrs } from "vue";
import { VTextField } from "vuetify/components";

defineOptions({ inheritAttrs: false });
withDefaults(
  defineProps<{
    modelValue: string;
    label: string;
    autocomplete?: string;
    disabled?: boolean;
    errorMessage?: string;
    inputmode?: "email" | "numeric" | "search" | "tel" | "text" | "url";
  }>(),
  { autocomplete: "off", disabled: false, errorMessage: "", inputmode: "text" },
);
const attrs = useAttrs();
const emit = defineEmits<{ "update:modelValue": [value: string] }>();
const forwardBlur = attrs.onBlur as ((event: FocusEvent) => void) | undefined;
const forwardFocus = attrs.onFocus as ((event: FocusEvent) => void) | undefined;
const forwardKeydown = attrs.onKeydown as
  ((event: KeyboardEvent) => void) | undefined;
</script>

<style scoped>
.ui-text-field {
  min-height: var(--expressa-touch-target-min);
}
</style>

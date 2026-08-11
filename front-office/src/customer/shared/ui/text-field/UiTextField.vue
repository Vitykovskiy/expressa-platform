<template>
  <v-text-field
    v-bind="$attrs"
    class="ui-text-field"
    :model-value="props.modelValue"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template v-if="$slots['prepend-inner']" #prepend-inner="slotProps">
      <slot name="prepend-inner" v-bind="slotProps" />
    </template>
    <template v-if="$slots.loader" #loader="slotProps">
      <slot name="loader" v-bind="slotProps" />
    </template>
  </v-text-field>
</template>

<script setup lang="ts">
import type { ComputedRef, Ref } from "vue";
import { UI_TEXT_FIELD_DEFAULTS } from "./UiTextField.constants";
import type { UiTextFieldEmits, UiTextFieldProps } from "./UiTextField.types";

type UiTextFieldInputSlotProps = {
  isActive: Ref<boolean>;
  isFocused: Ref<boolean>;
  iconColor: ComputedRef<string | undefined>;
  controlRef: Ref<InstanceType<typeof globalThis.HTMLElement> | undefined>;
  focus: () => void;
  blur: () => void;
};

type UiTextFieldLoaderSlotProps = {
  color: string | undefined;
  isActive: boolean;
};

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<UiTextFieldProps>(),
  UI_TEXT_FIELD_DEFAULTS,
);
const emit = defineEmits<UiTextFieldEmits>();
defineSlots<{
  "prepend-inner"?: (props: UiTextFieldInputSlotProps) => unknown;
  loader?: (props: UiTextFieldLoaderSlotProps) => unknown;
}>();
</script>

<style scoped lang="scss">
.ui-text-field {
  width: 100%;
}

.ui-text-field :deep(.v-field) {
  --v-input-control-height: var(--customer-size-field);
  --v-field-padding-start: var(--customer-space-9);
  --v-field-padding-end: var(--customer-space-9);

  min-height: var(--customer-size-field);
  color: var(--customer-text);
  background: var(--customer-color-white-13);
  border-radius: var(--customer-radius-md);
}

.ui-text-field :deep(.v-field__outline) {
  --v-field-border-width: 1.5px;
  color: var(--customer-color-white-22);
  --v-field-border-opacity: 1;
}

.ui-text-field :deep(.v-field--focused .v-field__outline) {
  color: var(--customer-focus-ring);
}

.ui-text-field :deep(.v-field--error .v-field__outline) {
  color: var(--customer-error);
}

.ui-text-field :deep(.v-field__input) {
  font-size: var(--customer-font-size-lg);
  font-weight: var(--customer-font-weight-bold);
}

.ui-text-field :deep(.v-messages) {
  color: var(--customer-color-text-muted-on-brand);
  font-size: var(--customer-font-size-xs);
  font-weight: var(--customer-font-weight-semibold);
  line-height: normal;
}

.ui-text-field :deep(input::placeholder) {
  color: var(--customer-text-faint-on-brand);
  opacity: 1;
}

.ui-text-field :deep(input[inputmode="numeric"]) {
  text-align: center;
  font-size: var(--customer-font-size-6xl);
  letter-spacing: var(--customer-letter-spacing-otp);
}
</style>

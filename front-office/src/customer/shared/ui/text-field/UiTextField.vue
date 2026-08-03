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
  border-radius: var(--customer-radius);
}
</style>

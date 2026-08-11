<template>
  <v-text-field
    v-bind="$attrs"
    class="ui-phone-input"
    :model-value="props.modelValue"
    :label="props.label"
    :loading="props.loading"
    :disabled="props.disabled || props.loading"
    :readonly="props.readonly"
    type="tel"
    inputmode="tel"
    autocomplete="tel"
    @update:model-value="emit('update:modelValue', $event)"
    ><template v-if="$slots.loader" #loader="slotProps"
      ><slot name="loader" v-bind="slotProps" /></template
  ></v-text-field>
</template>

<script setup lang="ts">
import { UI_PHONE_INPUT_DEFAULTS } from "./UiPhoneInput.constants";
import type {
  UiPhoneInputEmits,
  UiPhoneInputProps,
} from "./UiPhoneInput.types";
defineOptions({ inheritAttrs: false });
const props = withDefaults(
  defineProps<UiPhoneInputProps>(),
  UI_PHONE_INPUT_DEFAULTS,
);
const emit = defineEmits<UiPhoneInputEmits>();
defineSlots<{
  loader?: (props: { isActive: boolean; color?: string }) => unknown;
}>();
</script>
<style scoped>
.ui-phone-input {
  width: 100%;
}
</style>

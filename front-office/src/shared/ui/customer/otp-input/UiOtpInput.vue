<template>
  <v-text-field
    v-bind="$attrs"
    class="ui-otp-input"
    :model-value="props.modelValue"
    :label="props.label"
    :loading="props.loading"
    :disabled="props.disabled || props.loading"
    :readonly="props.readonly"
    inputmode="numeric"
    autocomplete="one-time-code"
    maxlength="6"
    @update:model-value="updateModelValue"
    ><template v-if="$slots.loader" #loader="slotProps"
      ><slot name="loader" v-bind="slotProps" /></template
  ></v-text-field>
</template>

<script setup lang="ts">
import { UI_OTP_INPUT_DEFAULTS } from "./UiOtpInput.constants";
import type { UiOtpInputEmits, UiOtpInputProps } from "./UiOtpInput.types";
defineOptions({ inheritAttrs: false });
const props = withDefaults(
  defineProps<UiOtpInputProps>(),
  UI_OTP_INPUT_DEFAULTS,
);
const emit = defineEmits<UiOtpInputEmits>();
defineSlots<{
  loader?: (props: { isActive: boolean; color?: string }) => unknown;
}>();
function updateModelValue(value: string) {
  emit("update:modelValue", value.replace(/\D/g, "").slice(0, 6));
}
</script>
<style scoped>
.ui-otp-input {
  width: 100%;
}
</style>

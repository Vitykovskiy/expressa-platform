<template>
  <v-switch
    v-bind="$attrs"
    class="ui-toggle"
    :disabled="props.disabled"
    :model-value="props.modelValue"
    color="primary"
    hide-details
    inset
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template v-if="$slots.label" #label="slotProps">
      <slot name="label" v-bind="slotProps" />
    </template>
  </v-switch>
</template>

<script setup lang="ts">
import { UI_TOGGLE_DEFAULTS } from "./UiToggle.constants";
import type {
  UiToggleEmits,
  UiToggleProps,
  UiToggleLabelSlotProps,
} from "./UiToggle.types";

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<UiToggleProps>(), UI_TOGGLE_DEFAULTS);
const emit = defineEmits<UiToggleEmits>();

defineSlots<{
  label?: (props: UiToggleLabelSlotProps) => unknown;
}>();
</script>

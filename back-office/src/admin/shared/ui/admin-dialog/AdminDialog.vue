<template>
  <v-dialog
    v-bind="dialogAttrs"
    :max-width="props.maxWidth"
    :model-value="props.modelValue"
    @after-enter="emit('afterEnter')"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <slot />
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, useAttrs } from "vue";
import { ADMIN_DIALOG_DEFAULTS } from "./AdminDialog.constants";
import type { AdminDialogEmits, AdminDialogProps } from "./AdminDialog.types";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<AdminDialogProps>(),
  ADMIN_DIALOG_DEFAULTS,
);
const emit = defineEmits<AdminDialogEmits>();
const attrs = useAttrs();
const dialogAttrs = computed(() => ({
  "aria-describedby": attrs["aria-describedby"],
  "aria-labelledby": attrs["aria-labelledby"],
  class: attrs.class,
  "data-testid": attrs["data-testid"],
  style: attrs.style,
}));
defineSlots<{ default(): unknown }>();
</script>

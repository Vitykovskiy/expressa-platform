<template>
  <v-switch
    v-bind="toggleAttrs"
    class="admin-toggle"
    :disabled="props.disabled"
    :model-value="props.modelValue"
    color="primary"
    hide-details
    inset
    role="switch"
    @update:model-value="emit('update:modelValue', $event)"
  />
</template>

<script setup lang="ts">
import { computed, useAttrs } from "vue";
import { ADMIN_TOGGLE_DEFAULTS } from "./AdminToggle.constants";
import type { AdminToggleEmits, AdminToggleProps } from "./AdminToggle.types";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<AdminToggleProps>(),
  ADMIN_TOGGLE_DEFAULTS,
);
const emit = defineEmits<AdminToggleEmits>();
const attrs = useAttrs();
const toggleAttrs = computed(() => ({
  "aria-label": attrs["aria-label"],
  "aria-labelledby": attrs["aria-labelledby"],
  class: attrs.class,
  "data-testid": attrs["data-testid"],
  style: attrs.style,
}));
</script>

<style scoped lang="scss">
.admin-toggle:has(input:focus-visible) {
  outline: var(--expressa-focus-ring);
  outline-offset: var(--expressa-space-2xs);
}
</style>

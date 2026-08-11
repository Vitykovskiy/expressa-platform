<template>
  <v-chip
    v-bind="$attrs"
    class="ui-badge"
    :color="UI_BADGE_COLORS[props.tone]"
    size="small"
    variant="tonal"
  >
    <slot />
  </v-chip>
</template>

<script setup lang="ts">
import { UI_BADGE_COLORS, UI_BADGE_DEFAULTS } from "./UiBadge.constants";
import type { UiBadgeProps } from "./UiBadge.types";

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<UiBadgeProps>(), UI_BADGE_DEFAULTS);
defineSlots<{
  default(): unknown;
}>();
</script>

<style scoped lang="scss">
.ui-badge {
  max-width: 100%;
}
</style>

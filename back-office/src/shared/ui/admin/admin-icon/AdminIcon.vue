<template>
  <component
    :is="props.icon"
    aria-hidden="true"
    class="admin-icon"
    :class="`admin-icon--${props.size}`"
    focusable="false"
  />
</template>

<script setup lang="ts">
import { ADMIN_ICON_DEFAULTS } from "./AdminIcon.constants";
import type { AdminIconProps } from "./AdminIcon.types";

const props = withDefaults(defineProps<AdminIconProps>(), ADMIN_ICON_DEFAULTS);
</script>

<style scoped lang="scss">
.admin-icon {
  display: block;
  flex: 0 0 auto;
  stroke-width: var(--expressa-stroke-width-icon);
}
.admin-icon--action {
  width: var(--expressa-size-icon-action);
  height: var(--expressa-size-icon-action);
}
.admin-icon--status {
  width: var(--expressa-size-icon-clock);
  height: var(--expressa-size-icon-clock);
}
</style>

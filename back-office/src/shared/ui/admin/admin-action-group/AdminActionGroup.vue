<template>
  <div class="admin-action-group" :class="`admin-action-group--${props.align}`">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { ADMIN_ACTION_GROUP_DEFAULTS } from "./AdminActionGroup.constants";
import type { AdminActionGroupProps } from "./AdminActionGroup.types";

const props = withDefaults(
  defineProps<AdminActionGroupProps>(),
  ADMIN_ACTION_GROUP_DEFAULTS,
);
defineSlots<{ default(): unknown }>();
</script>

<style scoped lang="scss">
.admin-action-group {
  display: flex;
  flex-wrap: wrap;
  gap: var(--expressa-space-sm);
  min-width: 0;
}
.admin-action-group--start {
  justify-content: flex-start;
}
.admin-action-group--end {
  justify-content: flex-end;
}
.admin-action-group--between {
  justify-content: space-between;
}
</style>

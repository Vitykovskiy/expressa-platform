<template>
  <span
    class="status-badge"
    :class="STATUS_PRESENTATION[props.status].className"
  >
    {{ STATUS_PRESENTATION[props.status].label }}
  </span>
</template>

<script setup lang="ts">
import { STATUS_PRESENTATION } from "./StatusBadge.constants";
import type { StatusBadgeProps } from "./StatusBadge.types";

const props = defineProps<StatusBadgeProps>();
</script>

<style scoped lang="scss">
.status-badge {
  display: inline-flex;
  align-items: center;
  padding: var(--expressa-space-2xs) var(--expressa-space-control-block);
  border-radius: var(--expressa-radius-pill);
  font-size: var(--expressa-font-size-caption);
  line-height: var(--expressa-line-height-caption-compact);
  white-space: nowrap;
}

.status-badge--created {
  color: var(--expressa-color-accent);
  background: var(--expressa-color-status-info-surface);
}

.status-badge--confirmed {
  color: var(--expressa-color-status-success);
  background: var(--expressa-color-status-success-surface);
}

.status-badge--ready {
  color: var(--expressa-color-status-warning);
  background: var(--expressa-color-status-warning-surface);
}

.status-badge--rejected {
  color: var(--expressa-color-status-error);
  background: var(--expressa-color-status-error-surface);
}

.status-badge--closed {
  color: var(--expressa-color-status-neutral);
  background: var(--expressa-color-status-neutral-surface);
}
</style>

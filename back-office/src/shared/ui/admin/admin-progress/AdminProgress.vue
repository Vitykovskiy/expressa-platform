<template>
  <p class="admin-progress">
    <span class="admin-progress__indicator" />
    {{ props.label }}
  </p>
</template>

<script setup lang="ts">
import type { AdminProgressProps } from "./AdminProgress.types";

const props = defineProps<AdminProgressProps>();
</script>

<style scoped lang="scss">
.admin-progress {
  display: inline-flex;
  align-items: center;
  gap: var(--expressa-space-sm);
  margin: 0;
  color: var(--expressa-color-text-secondary);
  font-size: var(--expressa-font-size-action);
  line-height: var(--expressa-line-height-body);
}
.admin-progress__indicator {
  width: var(--expressa-size-icon-clock);
  height: var(--expressa-size-icon-clock);
  border: var(--expressa-border-width-strong) solid var(--expressa-color-border);
  border-top-color: var(--expressa-color-accent);
  border-radius: var(--expressa-radius-pill);
  animation: admin-progress-spin var(--expressa-motion-duration-disclosure)
    linear infinite;
}
@keyframes admin-progress-spin {
  to {
    transform: rotate(1turn);
  }
}
</style>

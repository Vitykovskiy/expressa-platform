<template>
  <section class="empty-state" role="status">
    <h2 class="empty-state__title">
      {{ title }}
    </h2>
    <p class="empty-state__description">
      {{ description }}
    </p>
  </section>
</template>

<script setup lang="ts">
import type { EmptyStateProps } from "./EmptyState.types";

defineProps<EmptyStateProps>();
</script>

<style scoped lang="scss">
.empty-state {
  display: grid;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  justify-items: center;
  gap: var(--expressa-space-sm);
  padding: var(--expressa-space-empty-state-block) var(--expressa-space-lg);
  color: var(--expressa-color-text-muted);
  text-align: center;
}

.empty-state__title {
  width: 100%;
  min-width: 0;
  max-width: min(100%, 48ch);
  margin: 0;
  color: var(--expressa-color-text-primary);
  font-size: var(--expressa-font-size-title);
  font-weight: var(--expressa-font-weight-semibold);
  line-height: var(--expressa-line-height-title);
  overflow-wrap: anywhere;
}

.empty-state__description {
  width: 100%;
  min-width: 0;
  max-width: min(100%, 48ch);
  margin: 0;
  font-size: var(--expressa-font-size-body);
  line-height: var(--expressa-line-height-body);
  overflow-wrap: anywhere;
}
</style>

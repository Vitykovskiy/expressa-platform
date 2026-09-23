<template>
  <section v-bind="attrs" class="empty-state">
    <div v-if="$slots.icon" class="empty-state__icon">
      <slot name="icon" />
    </div>
    <h2 class="empty-state__title">
      {{ title }}
    </h2>
  </section>
</template>

<script setup lang="ts">
import { useAttrs } from "vue";
import type { EmptyStateProps } from "./EmptyState.types";

defineOptions({ inheritAttrs: false });

defineProps<EmptyStateProps>();
const attrs = useAttrs();
defineSlots<{
  icon?(): unknown;
}>();
</script>

<style scoped lang="scss">
.empty-state {
  display: grid;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  justify-items: center;
  gap: var(--expressa-space-md);
  padding: var(--expressa-space-empty-state-block) var(--expressa-space-lg);
  color: var(--expressa-color-text-muted);
  text-align: center;
}

.empty-state__icon {
  display: flex;
  min-width: var(--expressa-space-48);
  min-height: var(--expressa-space-48);
  align-items: center;
  justify-content: center;
  color: var(--expressa-color-text-muted);
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
</style>

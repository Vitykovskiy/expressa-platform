<template>
  <article
    class="ui-surface-card"
    :class="{ 'ui-surface-card--muted': props.muted }"
  >
    <slot
      ><h2 v-if="props.title">{{ props.title }}</h2>
      <p v-if="props.content">{{ props.content }}</p>
      <footer v-if="props.footer">{{ props.footer }}</footer>
      <p v-if="!props.title && !props.content && !props.footer" role="status">
        Нет данных для отображения
      </p></slot
    >
  </article>
</template>

<script setup lang="ts">
import { UI_SURFACE_CARD_DEFAULTS } from "./UiSurfaceCard.constants";
import type { UiSurfaceCardProps } from "./UiSurfaceCard.types";
const props = withDefaults(
  defineProps<UiSurfaceCardProps>(),
  UI_SURFACE_CARD_DEFAULTS,
);
defineSlots<{ default?: () => unknown }>();
</script>
<style scoped>
.ui-surface-card {
  padding: var(--customer-space-10);
  color: var(--customer-text-on-surface);
  background: var(--customer-surface);
  border-radius: var(--customer-radius);
}
.ui-surface-card--muted {
  background: var(--customer-surface-subtle);
}
h2,
p {
  overflow-wrap: anywhere;
}
</style>

<template>
  <div class="story-canvas"><slot /></div>
</template>

<script setup lang="ts">
defineSlots<{ default(): unknown }>();
</script>

<style scoped>
.story-canvas {
  min-height: 100%;
  padding: var(--expressa-space-4);
  color: rgb(var(--v-theme-on-surface));
  background: rgb(var(--v-theme-background));
  font-family: var(--expressa-font-family-ui);
}
:slotted(.foundation-page),
:slotted(.control-page) {
  display: grid;
  gap: var(--expressa-space-4);
  min-width: 0;
  max-width: 45rem;
}
:slotted(h1) {
  margin: 0;
  font-size: var(--expressa-font-size-heading);
  line-height: var(--expressa-line-height-heading);
}
:slotted(.control-row),
:slotted(.status-list) {
  display: flex;
  flex-wrap: wrap;
  gap: var(--expressa-space-2);
}
/* Default slot supplies this story-only root; deep is limited to its wrapping rule. */
:deep(.foundation-page) {
  overflow-wrap: anywhere;
}
/* Default slot supplies this story-only root; deep is limited to its wrapping rule. */
:deep(.control-page) {
  overflow-wrap: anywhere;
}
/* Default slot supplies this token grid; deep does not reach runtime UI. */
:deep(.token-grid) {
  display: grid;
  gap: var(--expressa-space-2);
  grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
}
/* Default slot supplies this icon grid; deep does not reach runtime UI. */
:deep(.icon-grid) {
  display: grid;
  gap: var(--expressa-space-2);
  grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
}
/* Default slot supplies this status list; deep does not reach runtime UI. */
:deep(.status-list) {
  display: grid;
  gap: var(--expressa-space-2);
  grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
}
/* Default slot supplies this token card; deep is scoped to its specimen surface. */
:deep(.token-card) {
  padding: var(--expressa-space-4);
  border: 0.0625rem solid rgb(var(--v-theme-primary));
  border-radius: var(--expressa-radius-control);
  background: rgb(var(--v-theme-surface));
}
/* Default slot supplies this icon card; deep is scoped to its specimen surface. */
:deep(.icon-card) {
  padding: var(--expressa-space-4);
  border: 0.0625rem solid rgb(var(--v-theme-primary));
  border-radius: var(--expressa-radius-control);
  background: rgb(var(--v-theme-surface));
}
/* Default slot supplies this density row; deep is scoped to its specimen surface. */
:deep(.density-row) {
  padding: var(--expressa-space-4);
  border: 0.0625rem solid rgb(var(--v-theme-primary));
  border-radius: var(--expressa-radius-control);
  background: rgb(var(--v-theme-surface));
}
/* Default slot supplies token swatches; deep is limited to their specimen decoration. */
:deep(.token-swatch) {
  min-height: var(--expressa-touch-target-min);
  border-radius: var(--expressa-radius-control);
}
/* Default slot supplies the grid specimen; deep is limited to its twelve-column layout. */
:deep(.workspace-content) {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: var(--expressa-space-2);
}
/* Default slot supplies the density specimen; deep is limited to its list layout. */
:deep(.density-list) {
  display: grid;
  gap: var(--expressa-space-2);
}
/* Default slot supplies typography specimen text; deep applies product tokens only to these classes. */
:deep(.type-sample) {
  display: grid;
  gap: var(--expressa-space-2);
}
/* Default slot supplies this title specimen; deep applies product typography tokens only. */
:deep(.type-sample-title) {
  font-size: var(--expressa-font-size-heading);
  font-weight: var(--expressa-font-weight-strong);
  line-height: var(--expressa-line-height-heading);
}
/* Default slot supplies this subtitle specimen; deep applies product typography tokens only. */
:deep(.type-sample-subtitle) {
  font-size: var(--expressa-font-size-title);
  font-weight: var(--expressa-font-weight-strong);
  line-height: var(--expressa-line-height-title);
}
/* Default slot supplies this body specimen; deep applies product typography tokens only. */
:deep(.type-sample-body) {
  font-size: var(--expressa-font-size-body);
  line-height: var(--expressa-line-height-body);
}
/* Default slot supplies this caption specimen; deep applies product typography tokens only. */
:deep(.type-sample-caption) {
  font-size: var(--expressa-font-size-caption);
  line-height: var(--expressa-line-height-caption);
  opacity: var(--expressa-text-muted-opacity);
}
@media (prefers-reduced-motion: reduce) {
  .story-canvas {
    scroll-behavior: auto;
  }
}
</style>

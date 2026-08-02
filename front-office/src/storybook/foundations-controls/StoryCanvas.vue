<template>
  <main class="story-canvas" :style="{ maxWidth: width }">
    <slot />
  </main>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ width?: string }>(), { width: "24.375rem" });
defineSlots<{ default?: () => unknown }>();
</script>

<style scoped>
.story-canvas {
  display: grid;
  width: 100%;
  gap: var(--fo-space-5);
  padding: var(--fo-space-4);
  border: 1px solid var(--fo-border);
  border-radius: var(--fo-radius-md);
  color: var(--fo-text);
  background: var(--fo-surface);
  font-family: var(--fo-font);
}
</style>

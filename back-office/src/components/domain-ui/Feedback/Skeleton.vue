<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="skeleton" role="status" aria-label="Загрузка">
    <span v-for="part in lines" :key="part" />
  </div>
</template>
<script setup lang="ts">
withDefaults(defineProps<{ lines?: number }>(), { lines: 3 });
</script>
<style scoped>
.skeleton {
  display: grid;
  gap: var(--expressa-space-2);
}
.skeleton span {
  height: var(--expressa-touch-target-min);
  background: rgb(var(--v-theme-surface-variant));
  border-radius: var(--expressa-radius-control);
}
</style>

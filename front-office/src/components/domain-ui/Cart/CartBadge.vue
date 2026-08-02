<template>
  <span class="badge" :aria-label="`В корзине ${count} позиций`">{{
    count
  }}</span>
</template>
<script setup lang="ts">
defineOptions({ name: "FoCartBadge" });
defineProps<{ count: number }>();
</script>
<style scoped>
.badge {
  display: inline-grid;
  min-width: 1.5rem;
  min-height: 1.5rem;
  place-items: center;
  border-radius: var(--fo-radius-lg);
  padding: 0 var(--fo-space-1);
  color: var(--fo-surface);
  background: var(--fo-brand);
  font: 700 0.75rem/1 var(--fo-font);
}
</style>

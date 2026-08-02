<template>
  <p v-if="change" class="meta">
    Изменил(а): {{ change.author }}, {{ change.at }}
  </p>
  <p v-else class="meta">Изменений ещё не было</p>
</template>
<script setup lang="ts">
defineProps<{ change?: { author: string; at: string } }>();
</script>
<style scoped>
.meta {
  margin: 0;
  font-size: var(--expressa-font-size-caption);
  opacity: var(--expressa-text-muted-opacity);
}
</style>

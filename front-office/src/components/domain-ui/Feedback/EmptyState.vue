<template>
  <section class="state" role="status">
    <span aria-hidden="true">○</span>
    <h2>{{ title }}</h2>
    <p v-if="description">{{ description }}</p>
    <button v-if="actionLabel" type="button" @click="emit('action')">
      {{ actionLabel }}
    </button>
  </section>
</template>
<script setup lang="ts">
defineOptions({ name: "FoEmptyState" });
defineProps<{ title: string; description?: string; actionLabel?: string }>();
const emit = defineEmits<{ action: [] }>();
</script>
<style scoped>
.state {
  display: grid;
  justify-items: center;
  gap: var(--fo-space-2);
  padding: var(--fo-space-6) var(--fo-space-3);
  color: var(--fo-text);
  text-align: center;
  font: 400 1rem/1.3 var(--fo-font);
}
.state span {
  color: var(--fo-muted);
  font-size: 3rem;
}
.state h2,
.state p {
  margin: 0;
  overflow-wrap: anywhere;
}
.state p {
  color: var(--fo-muted);
}
.state button {
  min-height: 2.75rem;
  border: 1px solid var(--fo-brand);
  border-radius: var(--fo-radius-sm);
  padding: 0 var(--fo-space-3);
  color: var(--fo-brand-dark);
  background: var(--fo-surface);
  font: 700 0.875rem/1 var(--fo-font);
  cursor: pointer;
}
</style>

<template>
  <aside class="notice notice--danger" role="alert">
    <strong>{{ name }} больше недоступен</strong>
    <span>Удалите позицию, чтобы оформить заказ.</span>
    <button class="notice-action" type="button" @click="emit('remove')">
      Удалить позицию
    </button>
  </aside>
</template>

<script setup lang="ts">
defineOptions({ name: "FoAvailabilityNotice" });

defineProps<{ name: string }>();
const emit = defineEmits<{ remove: [] }>();
</script>

<style scoped>
.notice {
  display: grid;
  gap: var(--fo-space-2);
  padding: var(--fo-space-3);
  border-left: 0.25rem solid var(--fo-danger);
  background: var(--fo-surface-muted);
  color: var(--fo-text);
  font: 400 0.875rem/1.3 var(--fo-font);
  overflow-wrap: anywhere;
}
.notice-action {
  justify-self: start;
  min-height: 2.75rem;
  border: 0;
  border-radius: var(--fo-radius-sm);
  padding: 0 var(--fo-space-3);
  color: var(--fo-surface);
  background: var(--fo-danger);
  font: 700 0.875rem/1 var(--fo-font);
  cursor: pointer;
}
</style>

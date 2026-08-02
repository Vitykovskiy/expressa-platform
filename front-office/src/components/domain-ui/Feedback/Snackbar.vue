<template>
  <aside v-if="open" class="snackbar" role="status">
    <span>{{ message }}</span
    ><button
      type="button"
      aria-label="Закрыть уведомление"
      @click="emit('close')"
    >
      ×
    </button>
  </aside>
</template>
<script setup lang="ts">
defineOptions({ name: "FoSnackbar" });
defineProps<{ message: string; open: boolean }>();
const emit = defineEmits<{ close: [] }>();
</script>
<style scoped>
.snackbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--fo-space-3);
  padding: var(--fo-space-3);
  border-radius: var(--fo-radius-md);
  color: var(--fo-surface);
  background: var(--fo-text);
  font: 400 0.875rem/1.3 var(--fo-font);
}
.snackbar span {
  overflow-wrap: anywhere;
}
.snackbar button {
  flex: none;
  width: 2.75rem;
  min-height: 2.75rem;
  border: 0;
  border-radius: var(--fo-radius-lg);
  color: var(--fo-surface);
  background: transparent;
  font: 400 1.25rem/1 var(--fo-font);
  cursor: pointer;
}
</style>

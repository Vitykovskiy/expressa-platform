<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div v-if="model" class="snackbar" role="status">
    <span>{{ message }}</span
    ><button
      type="button"
      aria-label="Закрыть уведомление"
      @click="model = false"
    >
      ×
    </button>
  </div>
</template>
<script setup lang="ts">
const model = defineModel<boolean>({ default: false });
defineProps<{ message: string }>();
</script>
<style scoped>
.snackbar {
  display: flex;
  justify-content: space-between;
  gap: var(--expressa-space-2);
  padding: var(--expressa-space-4);
  background: rgb(var(--v-theme-inverse-surface));
  color: rgb(var(--v-theme-on-surface));
}
.snackbar button {
  min-width: var(--expressa-touch-target-min);
  min-height: var(--expressa-touch-target-min);
}
</style>

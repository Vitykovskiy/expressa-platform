<template>
  <section aria-label="Загрузка" class="auth-state" role="status">
    <AdminProgress label="Подождите…" />
  </section>
</template>

<script setup lang="ts">
import AdminProgress from "../../../shared/ui/admin/admin-progress/AdminProgress.vue";
</script>

<style scoped lang="scss">
.auth-state {
  display: flex;
  flex-direction: column;
  min-height: var(--expressa-size-loading-state-min-height);
  align-items: center;
  gap: var(--expressa-space-control-inline);
  justify-content: center;
  color: var(--expressa-color-text-secondary);
  font-size: var(--expressa-font-size-action);
  line-height: var(--expressa-line-height-body);
  -webkit-font-smoothing: auto;
  text-align: center;
}
</style>

<template>
  <section class="auth-denied">
    <div class="auth-denied__icon">
      <AdminIcon :icon="ShieldX" />
    </div>
    <h2>Доступ запрещён</h2>
    <AdminButton
      class="auth-denied__button"
      variant="ghost"
      @click="emit('retry')"
    >
      Попробовать снова
    </AdminButton>
  </section>
</template>

<script setup lang="ts">
import { ShieldX } from "lucide-vue-next";
import AdminButton from "../../../shared/ui/admin/admin-button/AdminButton.vue";
import AdminIcon from "../../../shared/ui/admin/admin-icon/AdminIcon.vue";
import type { DeniedStateEmits } from "./DeniedState.types";

const emit = defineEmits<DeniedStateEmits>();
</script>

<style scoped lang="scss">
.auth-denied {
  color: var(--expressa-color-text-secondary);
  text-align: center;
}
.auth-denied__icon {
  display: grid;
  width: var(--expressa-size-control-coarse-min-height);
  height: var(--expressa-size-control-coarse-min-height);
  margin: 0 auto var(--expressa-space-md);
  place-items: center;
  color: var(--expressa-color-status-error);
  background: var(--expressa-color-status-error-surface);
}
.auth-denied h2,
.auth-denied p {
  margin: 0;
}
.auth-denied h2 {
  color: var(--expressa-color-text-primary);
  font-size: var(--expressa-font-size-title);
  font-weight: var(--expressa-font-weight-semibold);
  line-height: var(--expressa-line-height-title);
  margin-bottom: var(--expressa-space-sm);
}
.auth-denied__button {
  display: flex;
  width: 100%;
  padding: var(--expressa-space-control-block) 0;
  align-items: center;
  justify-content: center;
  gap: var(--expressa-space-sm);
  color: var(--expressa-color-text-secondary);
  font-size: var(--expressa-font-size-action);
  font-weight: var(--expressa-font-weight-semibold);
  line-height: var(--expressa-line-height-control);
}
</style>

<template>
  <section class="auth-denied" role="alert">
    <div class="auth-denied__icon" aria-hidden="true">
      <ShieldX :size="24" :stroke-width="2" />
    </div>
    <h2>Доступ запрещён</h2>
    <p>
      Этот номер телефона не имеет доступа к backoffice. Проверьте, что номер
      зарегистрирован и не заблокирован администратором системы.
    </p>
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
import type { DeniedStateEmits } from "./DeniedState.types";

const emit = defineEmits<DeniedStateEmits>();
</script>

<style scoped lang="scss">
.auth-denied {
  color: #777;
  text-align: center;
}
.auth-denied__icon {
  display: grid;
  width: 48px;
  height: 48px;
  margin: 0 auto var(--expressa-space-md);
  place-items: center;
  color: var(--expressa-color-status-error);
  background: var(--expressa-color-status-error-surface);
  border-radius: var(--expressa-radius-pill);
}
.auth-denied h2,
.auth-denied p {
  margin: 0;
}
.auth-denied h2 {
  color: var(--expressa-color-text-primary);
  font-size: 17px;
  font-weight: var(--expressa-font-weight-semibold);
  line-height: 25.5px;
  margin-bottom: var(--expressa-space-sm);
}
.auth-denied p {
  color: #777;
  font-size: 13px;
  line-height: 1.625;
  margin-bottom: var(--expressa-space-button-inline);
}
.auth-denied__button {
  display: flex;
  width: 100%;
  padding: 12px 0;
  align-items: center;
  justify-content: center;
  gap: var(--expressa-space-sm);
  color: #777;
  font-size: 14px;
  font-weight: var(--expressa-font-weight-semibold);
  line-height: 21px;
}
</style>

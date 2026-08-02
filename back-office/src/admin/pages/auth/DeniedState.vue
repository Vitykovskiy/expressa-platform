<template>
  <section class="auth-denied" role="alert">
    <h2>Доступ запрещён</h2>
    <p>
      Этот номер телефона не имеет доступа к backoffice. Проверьте, что номер
      зарегистрирован и не заблокирован администратором системы.
    </p>
    <AdminButton variant="ghost" @click="emit('retry')">
      Попробовать снова
    </AdminButton>
  </section>
</template>

<script setup lang="ts">
import type { DeniedStateEmits } from "./DeniedState.types";
import AdminButton from "../../shared/ui/admin-button/AdminButton.vue";

const emit = defineEmits<DeniedStateEmits>();
</script>

<style scoped lang="scss">
.auth-denied {
  display: grid;
  gap: var(--expressa-space-md);
  color: var(--expressa-color-text-secondary);
  text-align: center;
}
.auth-denied h2,
.auth-denied p {
  margin: 0;
}
.auth-denied h2 {
  color: var(--expressa-color-text-primary);
  font-size: var(--expressa-font-size-title);
}
.auth-denied p {
  line-height: var(--expressa-line-height-body);
}
</style>

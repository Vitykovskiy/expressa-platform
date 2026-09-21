<template>
  <form class="product-edit-form" @submit.prevent="emit('save')">
    <div class="product-edit-form__content"><slot /></div>
    <footer class="product-edit-form__footer">
      <AdminButton
        :disabled="pending"
        type="button"
        variant="ghost"
        @click="emit('cancel')"
        >Отмена</AdminButton
      >
      <AdminButton :disabled="pending || !dirty || !valid" type="submit">{{
        pending ? "Сохраняем…" : "Сохранить изменения"
      }}</AdminButton>
    </footer>
  </form>
</template>
<script setup lang="ts">
import AdminButton from "../../../../shared/ui/admin/admin-button/AdminButton.vue";
defineProps<{ dirty: boolean; pending: boolean; valid: boolean }>();
const emit = defineEmits<{ cancel: []; save: [] }>();
</script>
<style scoped lang="scss">
.product-edit-form {
  width: 100%;
  max-width: 800px;
}
.product-edit-form__content {
  display: grid;
  gap: 40px;
  padding-bottom: 88px;
  scroll-padding-block-end: 88px;
}
.product-edit-form__footer {
  position: sticky;
  z-index: 1;
  bottom: 0;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  min-height: 72px;
  padding: 14px 0;
  border-top: 1px solid var(--expressa-color-border);
  background: var(--expressa-color-surface);
}
@media (max-width: 599px) {
  .product-edit-form__content {
    padding-bottom: 88px;
    scroll-padding-block-end: 88px;
  }
  .product-edit-form__footer {
    padding-bottom: 16px;
  }
}
@media (max-width: 399px) {
  .product-edit-form__footer {
    display: grid;
  }
  .product-edit-form__footer .admin-button {
    width: 100%;
  }
}
</style>

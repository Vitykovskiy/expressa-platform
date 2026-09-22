<template>
  <form class="product-edit-form" @submit.prevent="emit('save')">
    <div class="product-edit-form__content"><slot /></div>
    <AdminActionGroup align="end" class="product-edit-form__footer">
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
    </AdminActionGroup>
  </form>
</template>
<script setup lang="ts">
import AdminButton from "../../../../shared/ui/admin/admin-button/AdminButton.vue";
import AdminActionGroup from "../../../../shared/ui/admin/admin-action-group/AdminActionGroup.vue";
defineProps<{ dirty: boolean; pending: boolean; valid: boolean }>();
const emit = defineEmits<{ cancel: []; save: [] }>();
</script>
<style scoped lang="scss">
.product-edit-form {
  width: 100%;
  max-width: var(--expressa-size-users-content-max-width);
}
.product-edit-form__content {
  display: grid;
  gap: var(--expressa-space-xl);
  padding-bottom: calc(var(--expressa-size-row-min) + var(--expressa-space-md));
  scroll-padding-block-end: calc(
    var(--expressa-size-row-min) + var(--expressa-space-md)
  );
}
.product-edit-form__footer {
  position: sticky;
  z-index: 1;
  bottom: 0;
  justify-content: flex-end;
  min-height: var(--expressa-size-row-min);
  padding: var(--expressa-space-control-block) 0;
  border-top: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
  background: var(--expressa-color-surface);
}
@media (max-width: 599px) {
  .product-edit-form__content {
    padding-bottom: calc(
      var(--expressa-size-row-min) + var(--expressa-space-md)
    );
    scroll-padding-block-end: calc(
      var(--expressa-size-row-min) + var(--expressa-space-md)
    );
  }
  .product-edit-form__footer {
    padding-bottom: var(--expressa-space-16);
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

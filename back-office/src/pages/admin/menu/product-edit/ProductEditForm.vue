<template>
  <form class="product-edit-form" @submit.prevent="emit('save')">
    <div class="product-edit-form__content"><slot /></div>
    <AdminActionGroup align="end" class="product-edit-form__footer">
      <AdminButton
        :disabled="pending"
        size="compact"
        type="button"
        variant="ghost"
        @click="emit('cancel')"
        >Отмена</AdminButton
      >
      <AdminButton
        :disabled="pending || !dirty || !valid"
        size="compact"
        type="submit"
        >{{ pending ? "Сохраняем…" : "Сохранить" }}</AdminButton
      >
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
}
.product-edit-form__content {
  display: grid;
  gap: var(--expressa-space-16);
  padding-bottom: var(--expressa-space-16);
}
.product-edit-form__footer {
  position: sticky;
  z-index: 1;
  bottom: 0;
  justify-content: flex-end;
  flex-wrap: wrap;
  min-height: var(--expressa-size-control-min-height);
  padding: var(--expressa-space-16) 0 0;
  border-top: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
  background: var(--expressa-color-surface);
}
@media (max-width: 599px) {
  .product-edit-form__footer {
    margin: 0 calc(-1 * var(--expressa-space-16));
    padding: var(--expressa-space-8) var(--expressa-space-16);
    box-shadow: var(--expressa-shadow-tab-bar);
  }
}
@media (max-width: 374px) {
  .product-edit-form__footer {
    gap: var(--expressa-space-4);
  }
}
</style>

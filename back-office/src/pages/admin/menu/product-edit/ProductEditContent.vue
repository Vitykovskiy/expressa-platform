<template>
  <main class="product-edit-content">
    <nav class="product-edit-content__navigation">
      <AdminButton
        size="compact"
        type="button"
        variant="ghost"
        @click="emit('back')"
      >
        <AdminIcon :icon="ArrowLeft" />Меню</AdminButton
      >
    </nav>
    <div class="product-edit-content__sheet">
      <h1>Редактировать товар</h1>
      <ProductEditForm
        :dirty="dirty"
        :pending="pending"
        :valid="valid"
        @cancel="emit('cancel')"
        @save="emit('save')"
      >
        <ProductEditFields
          v-model:name="name"
          v-model:category-id="categoryId"
          v-model:description="description"
          v-model:choices="choices"
          v-model:is-active="isActive"
          :category-options="categoryOptions"
          :choice-errors="choiceErrors"
          :description-error="descriptionError"
          :name-error="nameError"
          :pending="pending"
          @archive="emit('archive')"
        />
      </ProductEditForm>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ArrowLeft } from "lucide-vue-next";
import AdminButton from "../../../../shared/ui/admin/admin-button/AdminButton.vue";
import AdminIcon from "../../../../shared/ui/admin/admin-icon/AdminIcon.vue";
import ProductEditFields from "./ProductEditFields.vue";
import ProductEditForm from "./ProductEditForm.vue";
import type { ProductPriceChoiceDraft } from "./useProductDraft.types";

defineProps<{
  categoryOptions: readonly { id: string; label: string }[];
  choiceErrors: Readonly<
    Record<string, { price?: string; portionLabel?: string }>
  >;
  descriptionError: string;
  dirty: boolean;
  nameError: string;
  pending: boolean;
  saved: boolean;
  valid: boolean;
}>();
const emit = defineEmits<{ archive: []; back: []; cancel: []; save: [] }>();
const name = defineModel<string>("name", { required: true });
const categoryId = defineModel<string>("categoryId", { required: true });
const description = defineModel<string>("description", { required: true });
const choices = defineModel<ProductPriceChoiceDraft[]>("choices", {
  required: true,
});
const isActive = defineModel<boolean>("isActive", { required: true });
</script>

<style scoped lang="scss">
.product-edit-content {
  width: 100%;
  max-width: var(--expressa-size-settings-content-max-width);
  margin: auto;
  padding: var(--expressa-space-24) 0;
}
.product-edit-content__navigation {
  margin-bottom: var(--expressa-space-16);
  color: var(--expressa-color-text-secondary);
  font-size: var(--expressa-font-size-body);
}
.product-edit-content__sheet {
  padding: var(--expressa-space-16);
  border: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
  border-radius: var(--expressa-radius-panel);
  background: var(--expressa-color-surface);
  box-shadow: var(--expressa-shadow-card);
}
.product-edit-content__sheet h1 {
  margin: 0 0 var(--expressa-space-16);
  font-size: var(--expressa-font-size-title);
  line-height: var(--expressa-line-height-heading);
}
@media (max-width: 767px) {
  .product-edit-content {
    width: auto;
    max-width: none;
    margin: calc(-1 * (var(--expressa-space-24) + var(--expressa-space-16)))
      calc(-1 * var(--expressa-space-16));
    padding: 0;
  }
  .product-edit-content__navigation {
    display: flex;
    align-items: center;
    min-height: var(--expressa-size-top-bar-min-height);
    margin: 0;
    padding: 0 var(--expressa-space-16);
    border-bottom: var(--expressa-border-width-default) solid
      var(--expressa-color-border);
    background: var(--expressa-color-surface);
  }
  .product-edit-content__sheet {
    padding: var(--expressa-space-16);
    border: 0;
    border-radius: 0;
    box-shadow: none;
  }
}
</style>

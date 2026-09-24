<template>
  <AdminFieldWrapper
    :id="nameFieldId"
    v-slot="field"
    label="Название товара"
    :error="nameError"
    required
  >
    <AdminTextField
      :id="field.controlId"
      v-model="name"
      :disabled="pending"
      :required="field.required"
    />
  </AdminFieldWrapper>
  <AdminFieldWrapper
    :id="categoryFieldId"
    v-slot="field"
    label="Категория"
    required
  >
    <AdminCombobox
      :id="field.controlId"
      v-model="categoryId"
      :options="categoryOptions"
      :disabled="pending"
      :required="field.required"
    />
  </AdminFieldWrapper>
  <AdminFieldWrapper
    :id="descriptionFieldId"
    v-slot="field"
    :error="descriptionError"
    label="Описание"
  >
    <AdminTextarea
      :id="field.controlId"
      v-model="description"
      class="product-edit-fields__description"
      :disabled="pending"
      :required="field.required"
    />
  </AdminFieldWrapper>
  <section class="product-edit-fields__section">
    <h2>Цены и порции</h2>
    <PriceChoicesEditor
      v-model="choices"
      :disabled="pending"
      :errors="choiceErrors"
    />
  </section>
  <section class="product-edit-fields__section">
    <h2>Публикация</h2>
    <div class="product-edit-fields__toggle">
      <strong :id="publicationLabelId">Показывать в меню</strong>
      <AdminToggle v-model="isActive" :disabled="pending" />
    </div>
  </section>
  <section class="product-edit-fields__archive">
    <h2>Архив</h2>
    <AdminButton
      :disabled="pending"
      type="button"
      variant="destructive"
      @click="emit('archive')"
      >Архивировать товар</AdminButton
    >
  </section>
</template>

<script setup lang="ts">
import { useId } from "vue";
import AdminButton from "../../../../shared/ui/admin/admin-button/AdminButton.vue";
import AdminCombobox from "../../../../shared/ui/admin/admin-combobox/AdminCombobox.vue";
import AdminFieldWrapper from "../../../../shared/ui/admin/field-wrapper/AdminFieldWrapper.vue";
import AdminTextarea from "../../../../shared/ui/admin/admin-textarea/AdminTextarea.vue";
import AdminTextField from "../../../../shared/ui/admin/admin-text-field/AdminTextField.vue";
import AdminToggle from "../../../../shared/ui/admin/admin-toggle/AdminToggle.vue";
import PriceChoicesEditor from "./PriceChoicesEditor.vue";
import type { ProductPriceChoiceDraft } from "./useProductDraft.types";

defineProps<{
  categoryOptions: readonly { id: string; label: string }[];
  choiceErrors: Readonly<
    Record<string, { price?: string; portionLabel?: string }>
  >;
  descriptionError: string;
  nameError: string;
  pending: boolean;
}>();
const emit = defineEmits<{ archive: [] }>();
const name = defineModel<string>("name", { required: true });
const categoryId = defineModel<string>("categoryId", { required: true });
const description = defineModel<string>("description", { required: true });
const choices = defineModel<ProductPriceChoiceDraft[]>("choices", {
  required: true,
});
const isActive = defineModel<boolean>("isActive", { required: true });
const publicationLabelId = `product-publication-${useId()}`;
const nameFieldId = `product-name-${useId()}`;
const categoryFieldId = `product-category-${useId()}`;
const descriptionFieldId = `product-description-${useId()}`;
</script>

<style scoped lang="scss">
.product-edit-fields__section {
  display: grid;
  gap: var(--expressa-space-16);
  padding-top: var(--expressa-space-24);
  border-top: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
}
.product-edit-fields__section h2,
.product-edit-fields__archive h2 {
  margin: 0;
  font-size: var(--expressa-font-size-body-strong);
  line-height: var(--expressa-line-height-body);
}
.product-edit-fields__description {
  min-height: var(--expressa-size-textarea-min-height);
}
.product-edit-fields__toggle {
  display: flex;
  justify-content: space-between;
  min-height: var(--expressa-size-control-min-height);
  align-items: center;
}
.product-edit-fields__archive {
  border-top: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
  display: grid;
  justify-items: start;
  gap: var(--expressa-space-16);
  padding-top: var(--expressa-space-24);
}
</style>

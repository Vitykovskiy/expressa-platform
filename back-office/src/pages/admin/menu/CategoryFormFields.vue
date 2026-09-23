<template>
  <div class="category-form-fields">
    <AdminFieldWrapper
      :id="nameId"
      v-slot="field"
      :error="props.errors.name"
      label="Название категории"
      required
    >
      <AdminTextField
        :id="field.controlId"
        :disabled="props.disabled"
        :model-value="props.name"
        :required="field.required"
        type="text"
        @blur="emit('blurName')"
        @update:model-value="emit('update:name', $event)"
      />
    </AdminFieldWrapper>
    <AdminFieldWrapper
      :id="descriptionId"
      v-slot="field"
      :error="props.errors.description"
      label="Описание"
    >
      <AdminTextarea
        :id="field.controlId"
        :disabled="props.disabled"
        :model-value="props.description"
        :required="field.required"
        @update:model-value="emit('update:description', $event)"
      />
    </AdminFieldWrapper>
    <AdminFieldWrapper
      :id="visibilityControlId"
      v-slot="field"
      label="Показывать категорию в меню"
      layout="row"
    >
      <AdminToggle
        :id="field.controlId"
        :disabled="props.disabled"
        :model-value="props.isActive"
        @update:model-value="emit('update:isActive', $event === true)"
      />
    </AdminFieldWrapper>
  </div>
</template>

<script setup lang="ts">
import { useId } from "vue";
import AdminFieldWrapper from "../../../shared/ui/admin/field-wrapper/AdminFieldWrapper.vue";
import AdminTextarea from "../../../shared/ui/admin/admin-textarea/AdminTextarea.vue";
import AdminTextField from "../../../shared/ui/admin/admin-text-field/AdminTextField.vue";
import AdminToggle from "../../../shared/ui/admin/admin-toggle/AdminToggle.vue";
import type {
  CategoryFormFieldsEmits,
  CategoryFormFieldsProps,
} from "./CategoryFormFields.types";

const props = defineProps<CategoryFormFieldsProps>();
const emit = defineEmits<CategoryFormFieldsEmits>();
const nameId = `category-name-${useId()}`;
const descriptionId = `category-description-${useId()}`;
const visibilityControlId = `category-visibility-control-${useId()}`;
</script>

<style scoped lang="scss">
.category-form-fields {
  display: grid;
  gap: var(--expressa-space-button-inline);
}
.category-form-fields__label {
  color: var(--expressa-color-text-secondary);
  font-size: var(--expressa-font-size-action);
  font-weight: var(--expressa-font-weight-medium);
  line-height: var(--expressa-line-height-body);
}
</style>

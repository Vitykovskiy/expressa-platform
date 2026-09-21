<template>
  <div class="category-form-fields">
    <div class="category-form-fields__field">
      <label :for="nameId">Название категории</label>
      <AdminTextField
        :id="nameId"
        ref="nameInput"
        :aria-invalid="Boolean(props.errors.name)"
        :autofocus="props.nameAutofocus"
        :disabled="props.disabled"
        :model-value="props.name"
        placeholder="Например, Кофе и чай"
        type="text"
        @blur="emit('blurName')"
        @keydown.enter.prevent="emit('submit')"
        @update:model-value="emit('update:name', $event)"
      />
      <p
        v-if="props.errors.name"
        class="category-form-fields__error"
        role="alert"
      >
        {{ props.errors.name }}
      </p>
    </div>
    <div class="category-form-fields__field">
      <label :for="descriptionId">Описание — необязательно</label>
      <p class="category-form-fields__hint">Короткое описание для гостей</p>
      <AdminTextarea
        :id="descriptionId"
        :aria-invalid="Boolean(props.errors.description)"
        :disabled="props.disabled"
        :model-value="props.description"
        placeholder="Например, напитки на основе эспрессо и молока"
        @update:model-value="emit('update:description', $event)"
      />
      <p
        v-if="props.description.length >= counterThreshold"
        class="category-form-fields__hint"
      >
        {{ props.description.length }} из {{ descriptionLimit }}
      </p>
      <p
        v-if="props.errors.description"
        class="category-form-fields__error"
        role="alert"
      >
        {{ props.errors.description }}
      </p>
    </div>
    <div class="category-form-fields__toggle">
      <strong :id="visibilityLabelId">Показывать категорию в меню</strong>
      <AdminToggle
        :aria-labelledby="visibilityLabelId"
        :disabled="props.disabled"
        :model-value="props.isActive"
        @update:model-value="emit('update:isActive', $event === true)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useId, useTemplateRef } from "vue";
import AdminTextarea from "../../../shared/ui/admin/admin-textarea/AdminTextarea.vue";
import AdminTextField from "../../../shared/ui/admin/admin-text-field/AdminTextField.vue";
import AdminToggle from "../../../shared/ui/admin/admin-toggle/AdminToggle.vue";
import {
  CATEGORY_FORM_DESCRIPTION_COUNTER_THRESHOLD,
  CATEGORY_FORM_DESCRIPTION_LIMIT,
} from "./CategoryFormFields.constants";
import type {
  CategoryFormFieldsEmits,
  CategoryFormFieldsProps,
} from "./CategoryFormFields.types";

const props = withDefaults(defineProps<CategoryFormFieldsProps>(), {
  nameAutofocus: false,
});
const emit = defineEmits<CategoryFormFieldsEmits>();
const nameId = `category-name-${useId()}`;
const descriptionId = `category-description-${useId()}`;
const visibilityLabelId = `category-visibility-${useId()}`;
const nameInput =
  useTemplateRef<InstanceType<typeof AdminTextField>>("nameInput");
const counterThreshold = CATEGORY_FORM_DESCRIPTION_COUNTER_THRESHOLD;
const descriptionLimit = CATEGORY_FORM_DESCRIPTION_LIMIT;

function focusName(): void {
  nameInput.value?.focus();
}
defineExpose({ focusName });
</script>

<style scoped lang="scss">
.category-form-fields {
  display: grid;
  gap: 24px;
}
.category-form-fields__field {
  display: grid;
  gap: 8px;
}
.category-form-fields__field label {
  color: var(--expressa-color-text-secondary);
  font-size: var(--expressa-font-size-action);
  font-weight: var(--expressa-font-weight-medium);
}
.category-form-fields__toggle {
  display: flex;
  min-height: 52px;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px solid var(--expressa-color-border);
}
.category-form-fields__hint,
.category-form-fields__error {
  margin: 0;
  font-size: var(--expressa-font-size-caption);
}
.category-form-fields__hint {
  color: var(--expressa-color-text-muted);
}
.category-form-fields__error {
  color: var(--expressa-color-status-error);
}
</style>

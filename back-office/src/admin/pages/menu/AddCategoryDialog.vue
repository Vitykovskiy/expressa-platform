<template>
  <AdminDialog
    :model-value="open"
    max-width="448"
    @after-enter="focusFirstField"
    @update:model-value="updateOpen"
  >
    <v-card class="add-dialog">
      <v-card-title>Новая категория</v-card-title>
      <v-card-text>Создайте новую категорию для товаров меню</v-card-text>
      <v-card-text class="add-dialog-fields">
        <label :for="nameId">Название категории</label>
        <AdminTextField
          :id="nameId"
          ref="nameInput"
          v-model="name"
          :aria-describedby="nameError ? nameErrorId : undefined"
          :aria-invalid="Boolean(nameError)"
          autofocus
          class="add-dialog-input"
          placeholder="Например: Кофе, Чай, Десерты"
          type="text"
          @keydown="submitOnEnter"
          @update:model-value="dismissFieldError('name')"
        />
        <p
          v-if="nameError"
          :id="nameErrorId"
          class="add-dialog-error"
          role="alert"
        >
          {{ nameError }}
        </p>
        <label :for="descriptionId">Описание</label>
        <AdminTextField
          :id="descriptionId"
          v-model="description"
          :aria-describedby="descriptionError ? descriptionErrorId : undefined"
          :aria-invalid="Boolean(descriptionError)"
          class="add-dialog-input"
          placeholder="Например: Горячие напитки"
          type="text"
          @update:model-value="dismissFieldError('description')"
        />
        <p
          v-if="descriptionError"
          :id="descriptionErrorId"
          class="add-dialog-error"
          role="alert"
        >
          {{ descriptionError }}
        </p>
        <div class="add-dialog-toggle">
          <strong :id="activeLabelId">Категория активна</strong>
          <AdminToggle
            v-model="isActive"
            :aria-labelledby="activeLabelId"
            @update:model-value="dismissFieldError('isActive')"
          />
        </div>
        <p v-if="activeError" class="add-dialog-error" role="alert">
          {{ activeError }}
        </p>
      </v-card-text>
      <v-card-actions class="add-dialog-actions admin-dialog-actions">
        <AdminButton
          :disabled="props.disabled || !isFormValid"
          type="button"
          @click="confirm"
        >
          Добавить категорию
        </AdminButton>
        <AdminButton
          :disabled="props.disabled"
          type="button"
          variant="ghost"
          @click="cancel"
        >
          Отмена
        </AdminButton>
      </v-card-actions>
    </v-card>
  </AdminDialog>
</template>

<script setup lang="ts">
import { computed, shallowRef, useId, useTemplateRef, watch } from "vue";

import AdminButton from "../../shared/ui/admin-button/AdminButton.vue";
import AdminDialog from "../../shared/ui/admin-dialog/AdminDialog.vue";
import AdminTextField from "../../shared/ui/admin-text-field/AdminTextField.vue";
import AdminToggle from "../../shared/ui/admin-toggle/AdminToggle.vue";
import { ADD_CATEGORY_DIALOG_DEFAULTS } from "./AddCategoryDialog.constants";
import { useDialogFocusLifecycle } from "./composables/useDialogFocusLifecycle";
import type {
  AddCategoryDialogEmits,
  AddCategoryDialogProps,
  CategoryFormField,
} from "./AddCategoryDialog.types";

const props = withDefaults(
  defineProps<AddCategoryDialogProps>(),
  ADD_CATEGORY_DIALOG_DEFAULTS,
);
const open = defineModel<boolean>("open", { required: true });
const emit = defineEmits<AddCategoryDialogEmits>();
const name = shallowRef("");
const description = shallowRef("");
const isActive = shallowRef(true);
const dismissedFieldErrors = shallowRef<ReadonlySet<CategoryFormField>>(
  new Set(),
);
const { captureReturnFocus, restoreFocus } = useDialogFocusLifecycle();
const nameId = `add-category-name-${useId()}`;
const descriptionId = `add-category-description-${useId()}`;
const activeLabelId = `add-category-active-${useId()}`;
const nameErrorId = `add-category-name-error-${useId()}`;
const descriptionErrorId = `add-category-description-error-${useId()}`;
const nameInput =
  useTemplateRef<InstanceType<typeof AdminTextField>>("nameInput");
const nameError = computed(() =>
  name.value.trim() ? serverFieldError("name") : "Введите название категории",
);
const descriptionError = computed(() => serverFieldError("description"));
const activeError = computed(() => serverFieldError("isActive"));
const isFormValid = computed(() => !nameError.value);

function resetDraft() {
  name.value = "";
  description.value = "";
  isActive.value = true;
  dismissedFieldErrors.value = new Set();
}

function serverFieldError(field: CategoryFormField) {
  return dismissedFieldErrors.value.has(field)
    ? undefined
    : props.fieldErrors[field];
}

function dismissFieldError(field: CategoryFormField) {
  if (!props.fieldErrors[field] || dismissedFieldErrors.value.has(field))
    return;

  dismissedFieldErrors.value = new Set(dismissedFieldErrors.value).add(field);
}

function cancel() {
  resetDraft();
  open.value = false;
  emit("cancel");
}

function updateOpen(value: boolean) {
  if (value) open.value = true;
  else cancel();
}

function confirm() {
  if (!isFormValid.value) return;

  dismissedFieldErrors.value = new Set();

  emit("confirm", {
    name: name.value.trim(),
    description: description.value.trim(),
    isActive: isActive.value,
  });
}

function submitOnEnter(event: { key: string; preventDefault: () => void }) {
  if (event.key === "Enter" && isFormValid.value) {
    event.preventDefault();
    confirm();
  }
}

function focusFirstField() {
  nameInput.value?.$el.focus();
}

watch(open, (value, previous) => {
  if (value && !previous) {
    captureReturnFocus();
  }

  if (!value && previous) {
    resetDraft();
    restoreFocus();
  }
});

watch(
  () => props.fieldErrors,
  () => {
    dismissedFieldErrors.value = new Set();
  },
);
</script>

<style scoped lang="scss">
.add-dialog {
  color: var(--expressa-color-text-primary);
  background: var(--expressa-color-surface);
}
.add-dialog-fields {
  display: grid;
  gap: var(--expressa-space-sm);
}
.add-dialog-fields label {
  color: var(--expressa-color-text-secondary);
  font-size: var(--expressa-font-size-action);
  font-weight: var(--expressa-font-weight-medium);
}
.add-dialog-input {
  width: 100%;
  min-height: var(--expressa-size-control-min-height);
  padding: var(--expressa-space-control-block)
    var(--expressa-space-control-inline);
  border: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
  border-radius: var(--expressa-radius-md);
  color: var(--expressa-color-text-primary);
  background: var(--expressa-color-surface);
  font: inherit;
}
.add-dialog-input:disabled {
  opacity: var(--expressa-state-disabled-opacity);
  background: var(--expressa-color-control-disabled-surface);
}
.add-dialog-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--expressa-space-md);
  padding: var(--expressa-space-control-inline) 0;
  border-bottom: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
}
.add-dialog-toggle strong,
.add-dialog-toggle span {
  display: block;
}
.add-dialog-toggle strong {
  font-size: var(--expressa-font-size-body-strong);
}
.add-dialog-toggle span,
.add-dialog-hint {
  color: var(--expressa-color-text-muted);
  font-size: var(--expressa-font-size-caption);
}
.add-dialog-error {
  margin: 0;
  color: var(--expressa-color-status-error);
  font-size: var(--expressa-font-size-caption);
}
.add-dialog-input[aria-invalid="true"] {
  border-color: var(--expressa-color-status-error);
}
.add-dialog-actions {
  padding: var(--expressa-space-lg);
}
</style>

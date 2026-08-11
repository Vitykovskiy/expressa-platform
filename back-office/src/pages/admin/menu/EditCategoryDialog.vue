<template>
  <AdminDialog
    :aria-describedby="`edit-category-description-${nameId}`"
    :aria-labelledby="`edit-category-title-${nameId}`"
    :model-value="open"
    max-width="448"
    @after-enter="focusFirstField"
    @update:model-value="updateOpen"
  >
    <v-card class="edit-dialog">
      <v-card-title
        :id="`edit-category-title-${nameId}`"
        class="edit-dialog-title"
      >
        <span>Редактировать категорию</span>
        <button
          aria-label="Закрыть диалог"
          class="edit-dialog-close"
          title="Закрыть диалог"
          type="button"
          @click="closeAsCancelled"
        >
          <svg
            aria-hidden="true"
            fill="none"
            height="20"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            viewBox="0 0 24 24"
            width="20"
          >
            <path d="m6 6 12 12" />
            <path d="m18 6-12 12" />
          </svg>
        </button>
      </v-card-title>
      <v-card-text :id="`edit-category-description-${nameId}`"
        >Измените данные категории.</v-card-text
      >
      <v-card-text class="edit-dialog-fields">
        <label :for="nameId">Название категории</label>
        <AdminTextField
          :id="nameId"
          ref="nameInput"
          v-model="name"
          :aria-describedby="nameError ? nameErrorId : undefined"
          :aria-invalid="Boolean(nameError)"
          autofocus
          class="edit-dialog-input"
          placeholder="Например: Кофе, Чай, Десерты"
          type="text"
          @keydown="submitOnEnter"
          @update:model-value="dismissFieldError('name')"
        />
        <p
          v-if="nameError"
          :id="nameErrorId"
          class="edit-dialog-error"
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
          class="edit-dialog-input"
          type="text"
          @update:model-value="dismissFieldError('description')"
        />
        <p
          v-if="descriptionError"
          :id="descriptionErrorId"
          class="edit-dialog-error"
          role="alert"
        >
          {{ descriptionError }}
        </p>
        <div class="edit-dialog-toggle">
          <strong :id="activeLabelId">Категория активна</strong>
          <AdminToggle
            v-model="isActive"
            :aria-labelledby="activeLabelId"
            @update:model-value="dismissFieldError('isActive')"
          />
        </div>
        <p v-if="activeError" class="edit-dialog-error" role="alert">
          {{ activeError }}
        </p>
      </v-card-text>
      <button
        :disabled="props.disabled"
        class="edit-dialog-delete-zone"
        type="button"
        @click="openArchiveConfirmation"
      >
        Архивировать категорию
      </button>
      <v-card-actions class="edit-dialog-actions">
        <AdminButton
          :disabled="props.disabled"
          type="button"
          variant="ghost"
          @click="closeAsCancelled"
          >Отмена</AdminButton
        >
        <AdminButton
          :disabled="props.disabled || !isFormValid"
          type="button"
          @click="save"
          >Сохранить изменения</AdminButton
        >
      </v-card-actions>
    </v-card>
  </AdminDialog>
  <ConfirmDialog
    v-model:open="archiveOpen"
    confirm-label="Архивировать"
    confirm-variant="destructive"
    description="Категория больше не будет доступна в меню."
    title="Архивировать категорию?"
    @confirm="confirmArchive"
  />
</template>

<script setup lang="ts">
import { computed, shallowRef, useId, useTemplateRef, watch } from "vue";

import AdminButton from "../../../shared/ui/admin/admin-button/AdminButton.vue";
import AdminDialog from "../../../shared/ui/admin/admin-dialog/AdminDialog.vue";
import AdminTextField from "../../../shared/ui/admin/admin-text-field/AdminTextField.vue";
import AdminToggle from "../../../shared/ui/admin/admin-toggle/AdminToggle.vue";
import ConfirmDialog from "../../../shared/ui/admin/confirm-dialog/ConfirmDialog.vue";
import { EDIT_CATEGORY_DIALOG_DEFAULTS } from "./EditCategoryDialog.constants";
import { useDialogFocusLifecycle } from "./composables/useDialogFocusLifecycle";
import type {
  EditCategoryDialogEmits,
  EditCategoryDialogProps,
} from "./EditCategoryDialog.types";
import type { CategoryFormField } from "./AddCategoryDialog.types";

const props = withDefaults(
  defineProps<EditCategoryDialogProps>(),
  EDIT_CATEGORY_DIALOG_DEFAULTS,
);
const open = defineModel<boolean>("open", { required: true });
const emit = defineEmits<EditCategoryDialogEmits>();
const name = shallowRef("");
const description = shallowRef("");
const isActive = shallowRef(true);
const archiveOpen = shallowRef(false);
const dismissedFieldErrors = shallowRef<ReadonlySet<CategoryFormField>>(
  new Set(),
);
const { captureReturnFocus, restoreFocus } = useDialogFocusLifecycle();
const nameId = `edit-category-name-${useId()}`;
const descriptionId = `edit-category-description-${useId()}`;
const activeLabelId = `edit-category-active-${useId()}`;
const nameErrorId = `edit-category-name-error-${useId()}`;
const descriptionErrorId = `edit-category-description-error-${useId()}`;
const nameInput =
  useTemplateRef<InstanceType<typeof AdminTextField>>("nameInput");
const nameError = computed(() =>
  name.value.trim() ? serverFieldError("name") : "Введите название категории",
);
const descriptionError = computed(() => serverFieldError("description"));
const activeError = computed(() => serverFieldError("isActive"));
const isFormValid = computed(() => !nameError.value);

function resetDraft() {
  name.value = props.category?.name ?? "";
  description.value = props.category?.description ?? "";
  isActive.value = props.category?.isActive ?? true;
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

function closeDialog() {
  archiveOpen.value = false;
  resetDraft();
  open.value = false;
  restoreFocus();
}

function closeAsCancelled() {
  closeDialog();
  emit("cancel");
}

function updateOpen(value: boolean) {
  if (value) open.value = true;
  else closeAsCancelled();
}

function save() {
  if (!isFormValid.value) return;
  dismissedFieldErrors.value = new Set();
  emit("save", {
    name: name.value.trim(),
    description: description.value.trim(),
    isActive: isActive.value,
  });
}

function confirmArchive() {
  if (props.disabled) return;
  if (!props.category) return;
  emit("archive", props.category.id);
  closeDialog();
}

function openArchiveConfirmation() {
  if (!props.disabled) archiveOpen.value = true;
}

function submitOnEnter(event: { key: string; preventDefault: () => void }) {
  if (event.key === "Enter" && isFormValid.value) {
    event.preventDefault();
    save();
  }
}

function focusFirstField() {
  nameInput.value?.$el.focus();
}

watch(
  [open, () => props.category],
  ([isOpen, category], [wasOpen, previousCategory]) => {
    if (isOpen && (!wasOpen || category !== previousCategory)) resetDraft();
    if (isOpen && !wasOpen) captureReturnFocus();
    if (!isOpen && wasOpen) {
      archiveOpen.value = false;
      resetDraft();
      restoreFocus();
    }
  },
);

watch(
  () => props.fieldErrors,
  () => {
    dismissedFieldErrors.value = new Set();
  },
);
</script>

<style scoped lang="scss">
.edit-dialog {
  color: var(--expressa-color-text-primary);
  background: var(--expressa-color-surface);
}
.edit-dialog-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--expressa-space-sm);
}
.edit-dialog-close {
  display: grid;
  flex: 0 0 var(--expressa-size-control-min-height);
  width: var(--expressa-size-control-min-height);
  height: var(--expressa-size-control-min-height);
  place-items: center;
  padding: 0;
  border: var(--expressa-border-width-default) solid
    var(--expressa-color-transparent);
  border-radius: var(--expressa-radius-md);
  color: var(--expressa-color-text-secondary);
  background: var(--expressa-color-transparent);
  cursor: pointer;
}
.edit-dialog-close:active,
.edit-dialog-delete-zone:active {
  opacity: var(--expressa-state-pressed-opacity);
}
.edit-dialog-close:focus-visible,
.edit-dialog-delete-zone:focus-visible {
  outline: var(--expressa-focus-ring);
  outline-offset: var(--expressa-space-2xs);
}
.edit-dialog-fields {
  display: grid;
  gap: calc(var(--expressa-space-md) + var(--expressa-space-xs));
  padding: 0 var(--expressa-space-lg) var(--expressa-space-lg);
}
.edit-dialog-fields label {
  color: var(--expressa-color-text-secondary);
  font-size: var(--expressa-font-size-action);
  font-weight: var(--expressa-font-weight-medium);
  line-height: var(--expressa-line-height-body);
}
.edit-dialog-input {
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
.edit-dialog-input[aria-invalid="true"] {
  border-color: var(--expressa-color-status-error);
}
.edit-dialog-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--expressa-border-width-none);
  padding: var(--expressa-space-control-inline) 0;
  border-bottom: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
}
.edit-dialog-error {
  margin: 0;
  color: var(--expressa-color-status-error);
  font-size: var(--expressa-font-size-caption);
}
.edit-dialog-actions {
  display: grid;
  gap: var(--expressa-space-sm);
  padding: 0 var(--expressa-space-lg) var(--expressa-space-lg);
}
.edit-dialog-actions .admin-button {
  width: 100%;
}
.edit-dialog-delete-zone {
  width: calc(100% - var(--expressa-space-lg) * 2);
  min-height: var(--expressa-size-control-min-height);
  margin: var(--expressa-space-sm) var(--expressa-space-lg) 0;
  padding: var(--expressa-space-control-block)
    var(--expressa-space-button-inline);
  border: var(--expressa-border-width-default) solid
    var(--expressa-color-status-error);
  border-radius: var(--expressa-radius-md);
  color: var(--expressa-color-status-error);
  background: var(--expressa-color-status-error-surface);
  font: inherit;
  font-size: var(--expressa-font-size-action);
  font-weight: var(--expressa-font-weight-medium);
  cursor: pointer;
}
@media (min-width: 768px) {
  .edit-dialog-actions {
    display: flex;
    justify-content: flex-end;
  }
  .edit-dialog-actions .admin-button {
    width: auto;
  }
}
</style>

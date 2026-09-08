<template>
  <AdminDialog
    :aria-describedby="`edit-category-description-${nameId}`"
    :aria-labelledby="`edit-category-title-${nameId}`"
    :model-value="open"
    max-width="448"
    :persistent="isProtected"
    @after-enter="focusFirstField"
    @update:model-value="updateOpen"
  >
    <v-card class="edit-dialog">
      <v-card-title
        :id="`edit-category-title-${nameId}`"
        class="edit-dialog-title"
      >
        <span class="edit-dialog-title-text">Редактировать категорию</span>
        <button
          aria-label="Закрыть диалог"
          :disabled="isProtected"
          class="edit-dialog-close"
          title="Закрыть диалог"
          type="button"
          @click="closeAsCancelled"
        >
          <X aria-hidden="true" :size="20" />
        </button>
      </v-card-title>
      <v-card-text :id="`edit-category-description-${nameId}`"
        >Измените данные категории.</v-card-text
      >
      <section
        v-if="props.disabled || hasSaveOutcome"
        class="edit-dialog-outcome"
        aria-live="polite"
      >
        <p v-if="props.disabled" role="status">Сохраняем категорию…</p>
        <p
          v-else-if="props.saveOutcome === 'rejected'"
          class="edit-dialog-error"
          role="alert"
        >
          Не удалось сохранить категорию. Исправьте отмеченные поля и сохраните
          ещё раз.
        </p>
        <template v-else-if="props.saveOutcome === 'unconfirmed'"
          ><p class="edit-dialog-error" role="alert">
            Не удалось подтвердить сохранение категории. Обновите меню и
            проверьте категорию перед повторным сохранением.
          </p>
          <AdminButton
            :disabled="props.disabled"
            type="button"
            @click="emit('refresh')"
            >Обновить меню</AdminButton
          ></template
        >
        <p v-else-if="props.saveOutcome === 'saved'" role="status">
          Меню обновлено. Закройте форму и проверьте категорию в меню перед
          повторным сохранением.
        </p>
        <details v-if="props.saveError" class="edit-dialog-technical-details">
          <summary>Технические сведения</summary>
          <p>{{ props.saveError.message }}</p>
          <p v-if="props.saveError.requestId">
            Идентификатор запроса: {{ props.saveError.requestId }}
          </p>
        </details>
        <AdminButton
          v-if="canDiscardDraft"
          type="button"
          variant="ghost"
          @click="discardDraft"
          >Закрыть форму</AdminButton
        >
      </section>
      <v-card-text class="edit-dialog-fields">
        <label :for="nameId">Название категории</label>
        <AdminTextField
          :id="nameId"
          ref="nameInput"
          v-model="name"
          :aria-describedby="nameError ? nameErrorId : undefined"
          :aria-invalid="Boolean(nameError)"
          :disabled="isProtected"
          autofocus
          class="edit-dialog-input"
          placeholder="Например: Кофе, Чай, Десерты"
          type="text"
          @blur="touchName"
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
          :disabled="isProtected"
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
            :aria-describedby="activeError ? activeErrorId : undefined"
            :aria-invalid="Boolean(activeError)"
            :disabled="isProtected"
            @update:model-value="dismissFieldError('isActive')"
          />
        </div>
        <p
          v-if="activeError"
          :id="activeErrorId"
          class="edit-dialog-error"
          role="alert"
        >
          {{ activeError }}
        </p>
      </v-card-text>
      <button
        :disabled="isProtected"
        class="edit-dialog-delete-zone"
        type="button"
        @click="openArchiveConfirmation"
      >
        Архивировать категорию
      </button>
      <v-card-actions class="edit-dialog-actions">
        <AdminButton
          :disabled="isProtected"
          type="button"
          variant="ghost"
          @click="closeAsCancelled"
          >Отмена</AdminButton
        >
        <AdminButton :disabled="isProtected" type="button" @click="save"
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
import { X } from "lucide-vue-next";

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
const nameTouched = shallowRef(false);
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
const activeErrorId = `edit-category-active-error-${useId()}`;
const nameInput =
  useTemplateRef<InstanceType<typeof AdminTextField>>("nameInput");
const rawNameError = computed(() =>
  name.value.trim() ? undefined : "Введите название категории",
);
const nameError = computed(
  () =>
    serverFieldError("name") ??
    (nameTouched.value ? rawNameError.value : undefined),
);
const descriptionError = computed(() => serverFieldError("description"));
const activeError = computed(() => serverFieldError("isActive"));
const isRawFormValid = computed(
  () =>
    !rawNameError.value &&
    !serverFieldError("name") &&
    !serverFieldError("description") &&
    !serverFieldError("isActive"),
);
const hasSaveOutcome = computed(() => props.saveOutcome !== "idle");
const isProtected = computed(
  () =>
    props.disabled ||
    props.saveOutcome === "unconfirmed" ||
    props.saveOutcome === "saved",
);
const canDiscardDraft = computed(
  () =>
    !props.disabled &&
    (props.saveOutcome === "unconfirmed" || props.saveOutcome === "saved"),
);

function resetDraft() {
  name.value = props.category?.name ?? "";
  description.value = props.category?.description ?? "";
  isActive.value = props.category?.isActive ?? true;
  nameTouched.value = false;
  dismissedFieldErrors.value = new Set();
}

function touchName(): void {
  if (!open.value) return;
  nameTouched.value = true;
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

function closeDialog(): boolean {
  if (isProtected.value) return false;
  archiveOpen.value = false;
  resetDraft();
  open.value = false;
  restoreFocus();
  return true;
}

function closeAsCancelled() {
  if (closeDialog()) emit("cancel");
}

function discardDraft() {
  if (!canDiscardDraft.value) return;
  archiveOpen.value = false;
  resetDraft();
  open.value = false;
  emit("cancel");
}

function updateOpen(value: boolean) {
  if (value) open.value = true;
  else closeAsCancelled();
}

function save() {
  nameTouched.value = true;
  if (isProtected.value || !isRawFormValid.value) return;
  dismissedFieldErrors.value = new Set();
  emit("save", {
    name: name.value.trim(),
    description: description.value.trim(),
    isActive: isActive.value,
  });
}

function confirmArchive() {
  if (isProtected.value) return;
  if (!props.category) return;
  emit("archive", props.category.id);
  closeDialog();
}

function openArchiveConfirmation() {
  if (!isProtected.value) archiveOpen.value = true;
}

function submitOnEnter(event: { key: string; preventDefault: () => void }) {
  if (event.key === "Enter") {
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
    if (isOpen && (!wasOpen || category?.id !== previousCategory?.id))
      resetDraft();
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
  min-inline-size: 0;
}
.edit-dialog-title-text {
  flex: 1 1 auto;
  min-inline-size: 0;
  overflow-wrap: anywhere;
  white-space: normal;
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
.edit-dialog-outcome {
  padding: 0 var(--expressa-space-lg) var(--expressa-space-md);
}
.edit-dialog-technical-details {
  overflow-wrap: anywhere;
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

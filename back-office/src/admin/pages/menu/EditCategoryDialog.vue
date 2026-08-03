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
        <span>Редактировать группу</span>
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
      <v-card-text :id="`edit-category-description-${nameId}`">
        {{ productCountLabel }}
      </v-card-text>
      <v-card-text class="edit-dialog-fields">
        <section class="edit-dialog-section" aria-labelledby="basicLabelId">
          <p :id="basicLabelId" class="edit-dialog-section-label">Основное</p>
          <label :for="nameId">Название группы</label>
          <AdminTextField
            :id="nameId"
            ref="nameInput"
            v-model="name"
            :aria-describedby="isNameValid ? undefined : nameErrorId"
            :aria-invalid="!isNameValid"
            autofocus
            class="edit-dialog-input"
            placeholder="Например: Кофе, Чай, Десерты"
            type="text"
            @keydown="submitOnEnter"
          />
          <p
            v-if="!isNameValid"
            :id="nameErrorId"
            class="edit-dialog-error"
            role="alert"
          >
            Введите название группы
          </p>
        </section>
        <section class="edit-dialog-section" aria-labelledby="typeLabelId">
          <p :id="typeLabelId" class="edit-dialog-section-label">Тип группы</p>
          <div class="edit-dialog-toggle">
            <div>
              <strong :id="optionLabelId">Группа опций</strong>
              <span>Используйте её как набор опций в других группах.</span>
            </div>
            <AdminToggle
              v-model="draftIsOptionGroup"
              :aria-labelledby="optionLabelId"
            />
          </div>
          <template v-if="!draftIsOptionGroup">
            <label :for="parentId">Выбрать группу опций</label>
            <AdminSelect
              :id="parentId"
              :disabled="!hasAvailableOptionGroups"
              :model-value="parentGroupSelectValue"
              class="edit-dialog-input"
              @update:model-value="updateParentGroupId"
            >
              <option v-if="!hasAvailableOptionGroups" value="">
                Нет доступных групп опций
              </option>
              <template v-else>
                <option value="">Не выбрано</option>
                <option
                  v-for="group in availableOptionGroups"
                  :key="group"
                  :value="group"
                >
                  {{ group }}
                </option>
              </template>
            </AdminSelect>
          </template>
        </section>
      </v-card-text>
      <button
        class="edit-dialog-delete-zone"
        type="button"
        @click="deleteOpen = true"
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
          <path d="M3 6h18" />
          <path d="M8 6V4h8v2" />
          <path d="M19 6l-1 14H6L5 6" />
          <path d="M10 11v5" />
          <path d="M14 11v5" />
        </svg>
        Удалить группу
      </button>
      <v-card-actions class="edit-dialog-actions">
        <AdminButton type="button" variant="ghost" @click="closeAsCancelled">
          Отмена
        </AdminButton>
        <AdminButton :disabled="!isNameValid" type="button" @click="save">
          Сохранить изменения
        </AdminButton>
      </v-card-actions>
    </v-card>
  </AdminDialog>
  <ConfirmDialog
    v-model:open="deleteOpen"
    confirm-label="Удалить"
    confirm-variant="destructive"
    :description="deleteDescription"
    :title="deleteTitle"
    @confirm="confirmDelete"
  />
</template>

<script setup lang="ts">
import { computed, shallowRef, useId, useTemplateRef, watch } from "vue";

import AdminButton from "../../shared/ui/admin-button/AdminButton.vue";
import AdminDialog from "../../shared/ui/admin-dialog/AdminDialog.vue";
import AdminSelect from "../../shared/ui/admin-select/AdminSelect.vue";
import AdminTextField from "../../shared/ui/admin-text-field/AdminTextField.vue";
import AdminToggle from "../../shared/ui/admin-toggle/AdminToggle.vue";
import { EDIT_CATEGORY_DIALOG_DEFAULTS } from "./EditCategoryDialog.constants";
import { useDialogFocusLifecycle } from "./composables/useDialogFocusLifecycle";
import type {
  EditCategoryDialogEmits,
  EditCategoryDialogProps,
} from "./EditCategoryDialog.types";
import ConfirmDialog from "../../shared/ui/confirm-dialog/ConfirmDialog.vue";

const props = withDefaults(
  defineProps<EditCategoryDialogProps>(),
  EDIT_CATEGORY_DIALOG_DEFAULTS,
);
const open = defineModel<boolean>("open", { required: true });
const emit = defineEmits<EditCategoryDialogEmits>();
const name = shallowRef("");
const draftIsOptionGroup = shallowRef(false);
const draftParentGroupId = shallowRef("");
const deleteOpen = shallowRef(false);
const { captureReturnFocus, restoreFocus } = useDialogFocusLifecycle();
const nameId = `edit-category-name-${useId()}`;
const nameErrorId = `edit-category-name-error-${nameId}`;
const basicLabelId = `edit-category-basic-${useId()}`;
const typeLabelId = `edit-category-type-${useId()}`;
const optionLabelId = `edit-category-option-${useId()}`;
const parentId = `edit-category-parent-${useId()}`;
const nameInput =
  useTemplateRef<InstanceType<typeof AdminTextField>>("nameInput");
const isNameValid = computed(() => Boolean(name.value.trim()));
const availableOptionGroups = computed(() =>
  props.optionGroups.filter((group) => group !== props.categoryName),
);
const hasAvailableOptionGroups = computed(
  () => availableOptionGroups.value.length > 0,
);
const parentGroupSelectValue = computed(() =>
  hasAvailableOptionGroups.value ? draftParentGroupId.value : "",
);
const productCountLabel = computed(
  () => `${props.productCount} ${productNoun(props.productCount)} в группе`,
);
const deleteTitle = computed(
  () => `Удалить группу «${props.categoryName ?? ""}»?`,
);
const deleteDescription = computed(() => {
  if (props.productCount === 0) {
    return `Группа «${props.categoryName ?? ""}» будет удалена без возможности восстановления.`;
  }

  const productLabel = `${props.productCount} ${productNoun(props.productCount)}`;
  const deleteVerb =
    productNoun(props.productCount) === "товар"
      ? "Будет удалён"
      : "Будут удалены";

  return `Группа «${props.categoryName ?? ""}» будет удалена. ${deleteVerb} ${productLabel} без возможности восстановления.`;
});

function productNoun(count: number) {
  const remainder = Math.abs(count) % 100;
  const lastDigit = remainder % 10;

  if (remainder > 10 && remainder < 20) return "товаров";
  if (lastDigit === 1) return "товар";
  if (lastDigit > 1 && lastDigit < 5) return "товара";
  return "товаров";
}

function resetDraft() {
  name.value = props.categoryName ?? "";
  draftIsOptionGroup.value = props.isOptionGroup;
  draftParentGroupId.value = props.parentGroupId ?? "";
}

function closeDialog() {
  deleteOpen.value = false;
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

function updateParentGroupId(value: string) {
  draftParentGroupId.value = value;
}

function save() {
  if (!isNameValid.value) return;

  emit("save", {
    newName: name.value.trim(),
    isOptionGroup: draftIsOptionGroup.value,
    parentGroupId: draftIsOptionGroup.value
      ? undefined
      : draftParentGroupId.value || undefined,
  });
  closeDialog();
}

function confirmDelete() {
  emit("delete");
  closeDialog();
}

function submitOnEnter(event: { key: string; preventDefault: () => void }) {
  if (event.key === "Enter" && isNameValid.value) {
    event.preventDefault();
    save();
  }
}

function focusFirstField() {
  nameInput.value?.$el.focus();
}

watch(
  [
    open,
    () => props.categoryName,
    () => props.isOptionGroup,
    () => props.parentGroupId,
  ],
  (
    [isOpen, categoryName, optionGroup, parentGroup],
    [wasOpen, previousCategoryName, previousOptionGroup, previousParentGroup],
  ) => {
    if (
      isOpen &&
      (!wasOpen ||
        categoryName !== previousCategoryName ||
        optionGroup !== previousOptionGroup ||
        parentGroup !== previousParentGroup)
    ) {
      resetDraft();
    }

    if (isOpen && !wasOpen) {
      captureReturnFocus();
    }

    if (!isOpen && wasOpen) {
      deleteOpen.value = false;
      resetDraft();
      restoreFocus();
    }
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

.edit-dialog-close:active {
  opacity: var(--expressa-state-pressed-opacity);
}

.edit-dialog-close:focus-visible {
  outline: var(--expressa-focus-ring);
  outline-offset: var(--expressa-space-2xs);
}

.edit-dialog-fields {
  display: grid;
  gap: var(--expressa-space-sm);
}

.edit-dialog-section {
  display: grid;
  gap: var(--expressa-space-sm);
}

.edit-dialog-section-label {
  margin: 0;
  color: var(--expressa-color-text-muted);
  font-size: var(--expressa-font-size-caption);
  font-weight: var(--expressa-font-weight-semibold);
}

.edit-dialog-fields label {
  color: var(--expressa-color-text-secondary);
  font-size: var(--expressa-font-size-action);
  font-weight: var(--expressa-font-weight-medium);
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

.edit-dialog-input:disabled {
  opacity: var(--expressa-state-disabled-opacity);
  background: var(--expressa-color-control-disabled-surface);
}

.edit-dialog-input[aria-invalid="true"] {
  border-color: var(--expressa-color-status-error);
}

.edit-dialog-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--expressa-space-md);
  padding: var(--expressa-space-control-inline) 0;
  border-bottom: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
}

.edit-dialog-toggle strong,
.edit-dialog-toggle span {
  display: block;
}

.edit-dialog-toggle strong {
  font-size: var(--expressa-font-size-body-strong);
}

.edit-dialog-toggle span,
.edit-dialog-hint,
.edit-dialog-error {
  margin: 0;
  font-size: var(--expressa-font-size-caption);
}

.edit-dialog-toggle span,
.edit-dialog-hint {
  color: var(--expressa-color-text-muted);
}

.edit-dialog-error {
  color: var(--expressa-color-status-error);
}

.edit-dialog-actions {
  display: grid;
  gap: var(--expressa-space-sm);
  padding: var(--expressa-space-lg);
}

.edit-dialog-actions .admin-button {
  width: 100%;
}

.edit-dialog-delete-zone {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--expressa-space-sm);
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
  line-height: var(--expressa-line-height-control);
  cursor: pointer;
}

.edit-dialog-delete-zone:active {
  opacity: var(--expressa-state-pressed-opacity);
}

.edit-dialog-delete-zone:focus-visible {
  outline: var(--expressa-focus-ring);
  outline-offset: var(--expressa-space-2xs);
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

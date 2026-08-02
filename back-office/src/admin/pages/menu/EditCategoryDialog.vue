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
      <v-card-title :id="`edit-category-title-${nameId}`">
        Редактировать группу
      </v-card-title>
      <v-card-text :id="`edit-category-description-${nameId}`">
        {{ productCountLabel }}
      </v-card-text>
      <v-card-text class="edit-dialog-fields">
        <label :for="nameId"> Название группы </label>
        <AdminTextField
          :id="nameId"
          ref="nameInput"
          v-model="name"
          autofocus
          class="edit-dialog-input"
          placeholder="Например: Кофе, Чай, Десерты"
          type="text"
          @keydown="submitOnEnter"
        />
        <div class="edit-dialog-toggle">
          <div>
            <strong :id="optionLabelId">Группа опций</strong>
            <span>Эта группа является набором опций для другой группы</span>
          </div>
          <AdminToggle
            v-model="draftIsOptionGroup"
            :aria-labelledby="optionLabelId"
          />
        </div>
        <label :for="parentId"> Выбрать группу опций </label>
        <AdminSelect
          :id="parentId"
          v-model="draftParentGroupId"
          :disabled="draftIsOptionGroup"
          class="edit-dialog-input"
        >
          <option value="">Не выбрано</option>
          <option
            v-for="group in availableOptionGroups"
            :key="group"
            :value="group"
          >
            {{ group }}
          </option>
        </AdminSelect>
        <p
          v-if="!draftIsOptionGroup && !availableOptionGroups.length"
          class="edit-dialog-hint"
        >
          Нет доступных групп опций
        </p>
      </v-card-text>
      <v-card-actions class="edit-dialog-actions">
        <AdminButton :disabled="!isNameValid" type="button" @click="save">
          Сохранить изменения
        </AdminButton>
        <AdminButton
          type="button"
          variant="destructive"
          @click="deleteOpen = true"
        >
          Удалить группу
        </AdminButton>
        <AdminButton type="button" variant="ghost" @click="closeAsCancelled">
          Отмена
        </AdminButton>
      </v-card-actions>
    </v-card>
  </AdminDialog>
  <ConfirmDialog
    v-model:open="deleteOpen"
    confirm-label="Удалить"
    confirm-variant="destructive"
    description="Группа и товары в ней будут удалены без возможности восстановления."
    title="Удалить группу?"
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
const optionLabelId = `edit-category-option-${useId()}`;
const parentId = `edit-category-parent-${useId()}`;
const nameInput =
  useTemplateRef<InstanceType<typeof AdminTextField>>("nameInput");
const isNameValid = computed(() => Boolean(name.value.trim()));
const availableOptionGroups = computed(() =>
  props.optionGroups.filter((group) => group !== props.categoryName),
);
const productCountLabel = computed(
  () =>
    `${props.productCount} ${props.productCount === 1 ? "товар" : "товаров"} в группе`,
);

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

.edit-dialog-fields {
  display: grid;
  gap: var(--expressa-space-sm);
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
.edit-dialog-hint {
  margin: 0;
  color: var(--expressa-color-text-muted);
  font-size: var(--expressa-font-size-caption);
}

.edit-dialog-actions {
  display: grid;
  gap: var(--expressa-space-sm);
  padding: var(--expressa-space-lg);
}

.edit-dialog-actions .admin-button {
  width: 100%;
}
</style>

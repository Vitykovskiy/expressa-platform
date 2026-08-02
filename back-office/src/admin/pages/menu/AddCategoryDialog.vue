<template>
  <AdminDialog
    :model-value="open"
    max-width="448"
    @after-enter="focusFirstField"
    @update:model-value="updateOpen"
  >
    <v-card class="add-dialog">
      <v-card-title>Новая группа</v-card-title>
      <v-card-text
        >Создайте новую группу для организации товаров в меню</v-card-text
      >
      <v-card-text class="add-dialog-fields">
        <label :for="nameId">Название группы</label>
        <AdminTextField
          :id="nameId"
          ref="nameInput"
          v-model="name"
          autofocus
          class="add-dialog-input"
          placeholder="Например: Кофе, Чай, Десерты"
          type="text"
          @keydown="submitOnEnter"
        />
        <div class="add-dialog-toggle">
          <div>
            <strong :id="optionLabelId">Группа опций</strong>
            <span>Эта группа является набором опций для другой группы</span>
          </div>
          <AdminToggle
            v-model="isOptionGroup"
            :aria-labelledby="optionLabelId"
          />
        </div>
        <label :for="parentId">Выбрать группу опций</label>
        <AdminSelect
          :id="parentId"
          v-model="parentGroupId"
          :disabled="isOptionGroup"
          class="add-dialog-input"
        >
          <option value="">Не выбрано</option>
          <option
            v-for="group in props.optionGroups"
            :key="group"
            :value="group"
          >
            {{ group }}
          </option>
        </AdminSelect>
        <p
          v-if="!isOptionGroup && !props.optionGroups.length"
          class="add-dialog-hint"
        >
          Нет доступных групп опций
        </p>
      </v-card-text>
      <v-card-actions class="add-dialog-actions">
        <AdminButton :disabled="!isNameValid" type="button" @click="confirm">
          Добавить категорию
        </AdminButton>
        <AdminButton type="button" variant="ghost" @click="cancel">
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
import AdminSelect from "../../shared/ui/admin-select/AdminSelect.vue";
import AdminTextField from "../../shared/ui/admin-text-field/AdminTextField.vue";
import AdminToggle from "../../shared/ui/admin-toggle/AdminToggle.vue";
import { ADD_CATEGORY_DIALOG_DEFAULTS } from "./AddCategoryDialog.constants";
import { useDialogFocusLifecycle } from "./composables/useDialogFocusLifecycle";
import type {
  AddCategoryDialogEmits,
  AddCategoryDialogProps,
} from "./AddCategoryDialog.types";

const props = withDefaults(
  defineProps<AddCategoryDialogProps>(),
  ADD_CATEGORY_DIALOG_DEFAULTS,
);
const open = defineModel<boolean>("open", { required: true });
const emit = defineEmits<AddCategoryDialogEmits>();
const name = shallowRef("");
const isOptionGroup = shallowRef(false);
const parentGroupId = shallowRef("");
const { captureReturnFocus, restoreFocus } = useDialogFocusLifecycle();
const nameId = `add-category-name-${useId()}`;
const optionLabelId = `add-category-option-${useId()}`;
const parentId = `add-category-parent-${useId()}`;
const nameInput =
  useTemplateRef<InstanceType<typeof AdminTextField>>("nameInput");
const isNameValid = computed(() => Boolean(name.value.trim()));

function resetDraft() {
  name.value = "";
  isOptionGroup.value = false;
  parentGroupId.value = "";
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
  if (!isNameValid.value) return;

  emit("confirm", {
    categoryName: name.value.trim(),
    isOptionGroup: isOptionGroup.value,
    parentGroupId: isOptionGroup.value
      ? undefined
      : parentGroupId.value || undefined,
  });
  resetDraft();
  open.value = false;
}

function submitOnEnter(event: { key: string; preventDefault: () => void }) {
  if (event.key === "Enter" && isNameValid.value) {
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
.add-dialog-actions {
  display: grid;
  gap: var(--expressa-space-sm);
  padding: var(--expressa-space-lg);
}
.add-dialog-actions .admin-button {
  width: 100%;
}
</style>

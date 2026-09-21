<template>
  <AdminDialog
    :aria-labelledby="titleId"
    full-screen-below-600
    :model-value="open"
    max-width="560"
    :persistent="props.disabled"
    @after-enter="focusFirstField"
    @update:model-value="requestClose"
  >
    <v-card class="category-dialog">
      <header class="category-dialog__header">
        <h2 :id="titleId" class="category-dialog__title">Новая категория</h2>
        <button
          aria-label="Закрыть диалог"
          :disabled="props.disabled"
          class="category-dialog__close"
          type="button"
          @click="requestClose(false)"
        >
          ×
        </button>
      </header>
      <section
        v-if="props.saveOutcome === 'rejected'"
        ref="saveError"
        class="category-dialog__outcome"
        role="alert"
        tabindex="-1"
      >
        Не удалось создать категорию. Проверьте данные и повторите попытку.
      </section>
      <v-card-text class="category-dialog__fields">
        <CategoryFormFields
          ref="fields"
          :description="draft.description.value"
          :disabled="props.disabled"
          :errors="errors"
          :is-active="draft.isActive.value"
          :name="draft.name.value"
          name-autofocus
          @blur-name="nameTouched = true"
          @submit="confirm"
          @update:description="draft.description.value = $event"
          @update:is-active="draft.isActive.value = $event"
          @update:name="draft.name.value = $event"
        />
      </v-card-text>
      <v-card-actions class="category-dialog__actions">
        <AdminButton
          :disabled="props.disabled"
          type="button"
          variant="ghost"
          @click="requestClose(false)"
          >Отмена</AdminButton
        >
        <AdminButton
          :disabled="props.disabled || !canSave"
          type="button"
          @click="confirm"
          >{{ props.disabled ? "Создаём…" : "Создать категорию" }}</AdminButton
        >
      </v-card-actions>
    </v-card>
  </AdminDialog>
  <ConfirmDialog
    v-model:open="discardOpen"
    confirm-label="Закрыть без сохранения"
    cancel-label="Продолжить редактирование"
    confirm-variant="destructive"
    description="Введённые данные будут потеряны."
    title="Закрыть без сохранения?"
    @confirm="closeDiscarded"
  />
</template>

<script setup lang="ts">
import {
  computed,
  nextTick,
  shallowRef,
  useId,
  useTemplateRef,
  watch,
} from "vue";
import AdminButton from "../../../shared/ui/admin/admin-button/AdminButton.vue";
import AdminDialog from "../../../shared/ui/admin/admin-dialog/AdminDialog.vue";
import ConfirmDialog from "../../../shared/ui/admin/confirm-dialog/ConfirmDialog.vue";
import CategoryFormFields from "./CategoryFormFields.vue";
import { ADD_CATEGORY_DIALOG_DEFAULTS } from "./AddCategoryDialog.constants";
import { useCategoryDraft } from "./composables/useCategoryDraft";
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
const titleId = `add-category-title-${useId()}`;
const fields =
  useTemplateRef<InstanceType<typeof CategoryFormFields>>("fields");
const nameTouched = shallowRef(false);
const discardOpen = shallowRef(false);
const saveError = useTemplateRef<HTMLElement>("saveError");
const { captureReturnFocus, restoreFocus } = useDialogFocusLifecycle();
const draft = useCategoryDraft({
  categories: () => props.categories ?? [],
  initial: () => ({ name: "", description: "", isActive: true }),
});
const errors = computed(() => ({
  name: nameTouched.value ? draft.validation.value.name : undefined,
  description: draft.validation.value.description,
  ...props.fieldErrors,
}));
const canSave = computed(() => draft.isDirty.value && draft.isValid.value);

function focusFirstField(): void {
  fields.value?.focusName();
}
function confirm(): void {
  nameTouched.value = true;
  if (props.disabled || !canSave.value) return;
  emit("confirm", draft.data.value);
}
function requestClose(value: boolean): void {
  if (value || props.disabled) {
    if (value) open.value = true;
    return;
  }
  if (draft.isDirty.value) discardOpen.value = true;
  else closeDiscarded();
}
function closeDiscarded(): void {
  discardOpen.value = false;
  open.value = false;
  emit("cancel");
}
watch(open, (isOpen, wasOpen) => {
  if (isOpen && !wasOpen) {
    draft.reset();
    nameTouched.value = false;
    captureReturnFocus();
  }
  if (!isOpen && wasOpen) restoreFocus();
});
watch(
  () => props.saveOutcome,
  (outcome) => {
    if (outcome === "rejected") void nextTick(() => saveError.value?.focus());
  },
);
</script>

<style scoped lang="scss">
.category-dialog {
  color: var(--expressa-color-text-primary);
  background: var(--expressa-color-surface);
}
.category-dialog__title {
  margin: 0;
  padding: 24px 24px 16px;
  font-size: var(--expressa-font-size-title);
}
.category-dialog__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
}
.category-dialog__header .category-dialog__title {
  padding: 0;
}
.category-dialog__close {
  width: 44px;
  height: 44px;
  border: 0;
  background: transparent;
  font: inherit;
  font-size: 28px;
}
.category-dialog__fields {
  padding: 0 24px 24px;
}
.category-dialog__outcome {
  margin: 0 24px 16px;
  color: var(--expressa-color-status-error);
}
.category-dialog__actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 0 24px 24px;
}
@media (max-width: 599px) {
  .category-dialog__title {
    padding: 16px 16px;
  }
  .category-dialog__fields {
    padding: 0 16px 16px;
  }
  .category-dialog__actions {
    position: sticky;
    bottom: 0;
    padding: 16px;
    background: var(--expressa-color-surface);
  }
}
@media (max-width: 399px) {
  .category-dialog__actions {
    display: grid;
  }
  .category-dialog__actions .admin-button {
    width: 100%;
  }
}
</style>

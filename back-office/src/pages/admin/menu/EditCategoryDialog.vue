<template>
  <AdminDialog
    :aria-labelledby="titleId"
    full-screen-below-600
    :model-value="open"
    max-width="560"
    :persistent="props.disabled || props.archivePending"
    @after-enter="focusFirstField"
    @update:model-value="requestClose"
  >
    <v-card class="category-dialog">
      <header class="category-dialog__header">
        <h2 :id="titleId" class="category-dialog__title">
          Редактировать категорию
        </h2>
        <button
          aria-label="Закрыть диалог"
          :disabled="props.disabled || props.archivePending"
          class="category-dialog__close"
          type="button"
          @click="requestClose(false)"
        >
          <X :size="20" aria-hidden="true" />
        </button>
      </header>
      <section
        v-if="props.saveOutcome === 'rejected'"
        ref="saveError"
        class="category-dialog__outcome"
        role="alert"
        tabindex="-1"
      >
        Не удалось сохранить изменения. Повторите попытку.
      </section>
      <v-card-text class="category-dialog__fields"
        ><CategoryFormFields
          ref="fields"
          :description="draft.description.value"
          :disabled="props.disabled || props.archivePending"
          :errors="errors"
          :is-active="draft.isActive.value"
          :name="draft.name.value"
          name-autofocus
          @blur-name="nameTouched = true"
          @submit="save"
          @update:description="draft.description.value = $event"
          @update:is-active="draft.isActive.value = $event"
          @update:name="draft.name.value = $event"
      /></v-card-text>
      <section class="category-dialog__danger">
        <h3>Архив</h3>
        <p>
          Категория и товары внутри будут скрыты из меню. История заказов
          сохранится.
        </p>
        <AdminButton
          :disabled="props.disabled || props.archivePending"
          type="button"
          variant="destructive"
          @click="archiveOpen = true"
          >Архивировать категорию</AdminButton
        >
      </section>
      <v-card-actions class="category-dialog__actions"
        ><AdminButton
          :disabled="props.disabled || props.archivePending"
          type="button"
          variant="ghost"
          @click="requestClose(false)"
          >Отмена</AdminButton
        ><AdminButton
          :disabled="props.disabled || props.archivePending || !canSave"
          type="button"
          @click="save"
          >{{
            props.disabled ? "Сохраняем…" : "Сохранить изменения"
          }}</AdminButton
        ></v-card-actions
      >
    </v-card>
  </AdminDialog>
  <ConfirmDialog
    v-model:open="archiveOpen"
    confirm-label="Архивировать категорию"
    confirm-variant="destructive"
    :description="`Категория «${props.category?.name ?? ''}» и товары внутри будут скрыты из меню. История заказов сохранится.`"
    :error="props.archiveError ?? undefined"
    :pending="props.archivePending"
    :title="`Архивировать категорию «${props.category?.name ?? ''}»?`"
    @confirm="confirmArchive"
  />
  <ConfirmDialog
    v-model:open="discardOpen"
    confirm-label="Выйти без сохранения"
    cancel-label="Продолжить редактирование"
    confirm-variant="destructive"
    description="Несохранённые изменения будут потеряны."
    title="Выйти без сохранения?"
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
import { X } from "lucide-vue-next";
import AdminButton from "../../../shared/ui/admin/admin-button/AdminButton.vue";
import AdminDialog from "../../../shared/ui/admin/admin-dialog/AdminDialog.vue";
import ConfirmDialog from "../../../shared/ui/admin/confirm-dialog/ConfirmDialog.vue";
import CategoryFormFields from "./CategoryFormFields.vue";
import { EDIT_CATEGORY_DIALOG_DEFAULTS } from "./EditCategoryDialog.constants";
import { useCategoryDraft } from "./composables/useCategoryDraft";
import { useDialogFocusLifecycle } from "./composables/useDialogFocusLifecycle";
import type {
  EditCategoryDialogEmits,
  EditCategoryDialogProps,
} from "./EditCategoryDialog.types";

const props = withDefaults(
  defineProps<EditCategoryDialogProps>(),
  EDIT_CATEGORY_DIALOG_DEFAULTS,
);
const open = defineModel<boolean>("open", { required: true });
const emit = defineEmits<EditCategoryDialogEmits>();
const titleId = `edit-category-title-${useId()}`;
const fields =
  useTemplateRef<InstanceType<typeof CategoryFormFields>>("fields");
const saveError = useTemplateRef<HTMLElement>("saveError");
const nameTouched = shallowRef(false);
const archiveOpen = shallowRef(false);
const discardOpen = shallowRef(false);
const { captureReturnFocus, restoreFocus } = useDialogFocusLifecycle();
const draft = useCategoryDraft({
  categories: () => props.categories ?? [],
  excludedCategoryId: () => props.category?.id,
  initial: () => ({
    name: props.category?.name ?? "",
    description: props.category?.description ?? "",
    isActive: props.category?.isActive ?? true,
  }),
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
function save(): void {
  nameTouched.value = true;
  if (props.disabled || props.archivePending || !canSave.value) return;
  emit("save", draft.data.value);
}
function requestClose(value: boolean): void {
  if (value || props.disabled || props.archivePending) {
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
function confirmArchive(): void {
  if (props.category && !props.archivePending)
    emit("archive", props.category.id);
}
watch(
  [open, () => props.category?.id],
  ([isOpen, categoryId], [wasOpen, previousId]) => {
    if (isOpen && (!wasOpen || categoryId !== previousId)) {
      draft.reset();
      nameTouched.value = false;
    }
    if (isOpen && !wasOpen) captureReturnFocus();
    if (!isOpen && wasOpen) restoreFocus();
    if (!isOpen) archiveOpen.value = false;
  },
);
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
.category-dialog__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
}
.category-dialog__title {
  margin: 0;
  font-size: var(--expressa-font-size-title);
}
.category-dialog__close {
  width: 44px;
  height: 44px;
  border: 0;
  background: transparent;
}
.category-dialog__fields {
  padding: 0 24px 24px;
}
.category-dialog__outcome {
  margin: 0 24px 16px;
  color: var(--expressa-color-status-error);
}
.category-dialog__danger {
  margin: 8px 24px 0;
  padding: 24px 0 0;
  border-top: 1px solid var(--expressa-color-border);
}
.category-dialog__danger h3,
.category-dialog__danger p {
  margin: 0 0 8px;
}
.category-dialog__danger p {
  color: var(--expressa-color-text-secondary);
}
.category-dialog__actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 24px;
}
@media (max-width: 599px) {
  .category-dialog__header {
    padding: 16px;
  }
  .category-dialog__fields {
    padding: 0 16px 16px;
  }
  .category-dialog__danger {
    margin-inline: 16px;
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

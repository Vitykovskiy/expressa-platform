<template>
  <AdminDialog
    :aria-labelledby="titleId"
    cancel-label="Отмена"
    full-screen-below-600
    :model-value="open"
    max-width="560"
    :pending="props.disabled || props.archivePending"
    submit-form="edit-category-dialog-form"
    :submit-disabled="props.disabled || props.archivePending || !canSave"
    submit-label="Сохранить изменения"
    submit-pending-label="Сохраняем…"
    title="Редактировать категорию"
    @after-enter="focusFirstField"
    @update:model-value="requestClose"
  >
    <form
      id="edit-category-dialog-form"
      class="category-dialog"
      @submit.prevent="save"
    >
      <section
        v-if="props.saveOutcome === 'rejected'"
        ref="saveError"
        class="category-dialog__outcome"
        role="alert"
        tabindex="-1"
      >
        Не удалось сохранить изменения. Повторите попытку.
      </section>
      <div class="category-dialog__fields">
        <CategoryFormFields
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
        />
      </div>
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
    </form>
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
.category-dialog__fields {
  padding: 0 var(--expressa-space-lg) var(--expressa-space-lg);
}
.category-dialog__outcome {
  margin: 0 var(--expressa-space-lg) var(--expressa-space-md);
  color: var(--expressa-color-status-error);
}
.category-dialog__danger {
  margin: var(--expressa-space-sm) var(--expressa-space-lg) 0;
  padding: var(--expressa-space-lg) 0 0;
}
.category-dialog__danger h3,
.category-dialog__danger p {
  margin: 0 0 var(--expressa-space-sm);
}
.category-dialog__danger p {
  color: var(--expressa-color-text-secondary);
}
@media (max-width: 599px) {
  .category-dialog__fields {
    padding: 0 var(--expressa-space-md) var(--expressa-space-md);
  }
  .category-dialog__danger {
    margin-inline: var(--expressa-space-md);
  }
}
</style>

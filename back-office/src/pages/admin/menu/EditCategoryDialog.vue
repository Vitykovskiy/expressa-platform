<template>
  <AdminDialog
    cancel-label="Отмена"
    destructive-label="В архив"
    :destructive-disabled="props.disabled || props.archivePending"
    :model-value="open"
    max-width="560"
    :pending="props.disabled || props.archivePending"
    submit-form="edit-category-dialog-form"
    :submit-disabled="props.disabled || props.archivePending || !canSave"
    submit-label="Сохранить"
    title="Редактировать категорию"
    @destructive="archiveOpen = true"
    @update:model-value="requestClose"
  >
    <form
      id="edit-category-dialog-form"
      class="category-dialog"
      @submit.prevent="save"
    >
      <div class="category-dialog__fields">
        <CategoryFormFields
          :description="draft.description.value"
          :disabled="props.disabled || props.archivePending"
          :errors="errors"
          :is-active="draft.isActive.value"
          :name="draft.name.value"
          @blur-name="nameTouched = true"
          @submit="save"
          @update:description="draft.description.value = $event"
          @update:is-active="draft.isActive.value = $event"
          @update:name="draft.name.value = $event"
        />
      </div>
    </form>
  </AdminDialog>
  <ConfirmDialog
    v-model:open="archiveOpen"
    confirm-label="Архивировать категорию"
    confirm-variant="destructive"
    :description="`Категория «${props.category?.name ?? ''}» и товары внутри будут скрыты из меню. История заказов сохранится.`"
    :pending="props.archivePending"
    :title="`Архивировать категорию «${props.category?.name ?? ''}»?`"
    @confirm="confirmArchive"
  />
  <ConfirmDialog
    v-model:open="discardOpen"
    confirm-label="Закрыть"
    cancel-label="Вернуться"
    confirm-variant="destructive"
    description="Несохранённые изменения будут потеряны."
    title="Выйти без сохранения?"
    :pending="props.disabled || props.archivePending"
    @confirm="closeDiscarded"
  />
</template>

<script setup lang="ts">
import { computed, shallowRef, watch } from "vue";
import AdminDialog from "../../../shared/ui/admin/admin-dialog/AdminDialog.vue";
import ConfirmDialog from "../../../shared/ui/admin/confirm-dialog/ConfirmDialog.vue";
import CategoryFormFields from "./CategoryFormFields.vue";
import { EDIT_CATEGORY_DIALOG_DEFAULTS } from "./EditCategoryDialog.constants";
import { useCategoryDraft } from "./composables/useCategoryDraft";
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
const nameTouched = shallowRef(false);
const archiveOpen = shallowRef(false);
const discardOpen = shallowRef(false);
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
  if (props.category && !props.disabled && !props.archivePending)
    emit("archive", props.category.id);
}
watch(
  [open, () => props.category?.id],
  ([isOpen, categoryId], [wasOpen, previousId]) => {
    if (isOpen && (!wasOpen || categoryId !== previousId)) {
      draft.reset();
      nameTouched.value = false;
    }
    if (!isOpen) archiveOpen.value = false;
  },
);
</script>

<style scoped lang="scss">
.category-dialog__fields {
  display: grid;
  gap: var(--expressa-space-md);
}
</style>

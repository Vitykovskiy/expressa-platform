<template>
  <AdminDialog
    cancel-label="Отмена"
    :model-value="open"
    max-width="560"
    :pending="props.disabled"
    submit-form="add-category-dialog-form"
    :submit-disabled="props.disabled || !canSave"
    submit-label="Сохранить"
    title="Новая категория"
    @update:model-value="requestClose"
  >
    <form
      id="add-category-dialog-form"
      class="category-dialog"
      @submit.prevent="confirm"
    >
      <div class="category-dialog__fields">
        <CategoryFormFields
          :description="draft.description.value"
          :disabled="props.disabled"
          :errors="errors"
          :is-active="draft.isActive.value"
          :name="draft.name.value"
          @blur-name="nameTouched = true"
          @submit="confirm"
          @update:description="draft.description.value = $event"
          @update:is-active="draft.isActive.value = $event"
          @update:name="draft.name.value = $event"
        />
      </div>
    </form>
  </AdminDialog>
  <ConfirmDialog
    v-model:open="discardOpen"
    confirm-label="Закрыть"
    cancel-label="Вернуться"
    confirm-variant="destructive"
    description="Введённые данные будут потеряны."
    title="Закрыть без сохранения?"
    @confirm="closeDiscarded"
  />
</template>

<script setup lang="ts">
import { computed, shallowRef, watch } from "vue";
import AdminDialog from "../../../shared/ui/admin/admin-dialog/AdminDialog.vue";
import ConfirmDialog from "../../../shared/ui/admin/confirm-dialog/ConfirmDialog.vue";
import CategoryFormFields from "./CategoryFormFields.vue";
import { ADD_CATEGORY_DIALOG_DEFAULTS } from "./AddCategoryDialog.constants";
import { useCategoryDraft } from "./composables/useCategoryDraft";
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
const nameTouched = shallowRef(false);
const discardOpen = shallowRef(false);
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
  }
});
</script>

<style scoped lang="scss">
.category-dialog__fields {
  display: grid;
  gap: var(--expressa-space-md);
}
</style>

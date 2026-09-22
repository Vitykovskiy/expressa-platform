<template>
  <AdminDialog
    :aria-labelledby="titleId"
    cancel-label="Отмена"
    full-screen-below-600
    :model-value="open"
    max-width="560"
    :pending="props.disabled"
    submit-form="add-category-dialog-form"
    :submit-disabled="props.disabled || !canSave"
    submit-label="Создать категорию"
    submit-pending-label="Создаём…"
    title="Новая категория"
    @after-enter="focusFirstField"
    @update:model-value="requestClose"
  >
    <form
      id="add-category-dialog-form"
      class="category-dialog"
      @submit.prevent="confirm"
    >
      <section
        v-if="props.saveOutcome === 'rejected'"
        ref="saveError"
        class="category-dialog__outcome"
        role="alert"
        tabindex="-1"
      >
        Не удалось создать категорию.
      </section>
      <div class="category-dialog__fields">
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
      </div>
    </form>
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
.category-dialog__fields {
  padding: 0 var(--expressa-space-lg) var(--expressa-space-lg);
}
.category-dialog__outcome {
  margin: 0 var(--expressa-space-lg) var(--expressa-space-md);
  color: var(--expressa-color-status-error);
}
@media (max-width: 599px) {
  .category-dialog__fields {
    padding: 0 var(--expressa-space-md) var(--expressa-space-md);
  }
}
</style>

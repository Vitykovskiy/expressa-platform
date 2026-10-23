<template>
  <OperationsModal
    class="catalog-category-dialog"
    :open="props.open"
    :title="title"
    :persistent="props.pending"
    bottom-sheet
    :width="modalWidth"
    @close="close"
  >
    <template #header="{ titleId }">
      <CatalogDialogHeader
        :title="title"
        :title-id="titleId"
        :summary="props.summary"
        :editing="editing"
        :pending="props.pending"
        :delete-label="deleteLabel"
        @delete="remove"
      />
    </template>
    <form
      :id="formId"
      class="catalog-category-form"
      :aria-busy="props.pending"
      @submit.prevent="save"
    >
      <OperationsInput
        :label="nameLabel"
        :model-value="props.draft.name"
        :disabled="props.pending"
        :placeholder="namePlaceholder"
        required
        autocomplete="off"
        @update:model-value="update('name', $event)"
      />
      <OperationsToggle
        v-if="!editing"
        label="Группа опций"
        description="Опции, которые можно выбрать для товара"
        :model-value="props.draft.isOptionGroup"
        :disabled="kindDisabled"
        @update:model-value="update('isOptionGroup', $event)"
      />
      <div class="catalog-category-form__association">
        <CatalogGroupFields
          v-if="props.draft.isOptionGroup"
          :draft="props.draft.group"
          :pending="props.pending"
          :focus-option-key="props.focusOptionKey"
          @update:draft="update('group', $event)"
        />
        <OperationsInput
          v-else
          label="Выбрать группу опций"
          type="select"
          :model-value="props.draft.optionGroupId"
          :disabled="associationDisabled"
          :options="selectOptions"
          @update:model-value="update('optionGroupId', $event)"
        />
        <p v-if="showNoOptions" class="catalog-category-form__hint">
          Нет доступных групп опций
        </p>
        <p v-if="props.associationSummary" class="catalog-category-form__hint">
          {{ props.associationSummary }}
        </p>
      </div>
      <p v-if="props.error" class="catalog-category-form__error" role="alert">
        {{ props.error }}
      </p>
    </form>
    <template #actions>
      <OperationsButton
        label="Отмена"
        kind="ghost"
        compact
        :disabled="props.pending"
        @click="close"
      />
      <OperationsButton
        :label="saveLabel"
        compact
        type="submit"
        :form="formId"
        :disabled="saveDisabled"
      />
    </template>
  </OperationsModal>
</template>

<script setup lang="ts">
import { computed, useId } from "vue";
import OperationsButton from "../../../shared/ui/operations/OperationsButton.vue";
import OperationsInput from "../../../shared/ui/operations/OperationsInput.vue";
import OperationsModal from "../../../shared/ui/operations/OperationsModal.vue";
import OperationsToggle from "../../../shared/ui/operations/OperationsToggle.vue";
import CatalogDialogHeader from "./CatalogDialogHeader.vue";
import CatalogGroupFields from "./CatalogGroupFields.vue";
import type {
  CatalogCategoryDialogEmits,
  CatalogCategoryDialogProps,
  CatalogCategoryDraft,
} from "./CatalogEditor.types";

const props = defineProps<CatalogCategoryDialogProps>();
const emit = defineEmits<CatalogCategoryDialogEmits>();
const formId = useId();

const editing = computed(() => props.mode === "edit");
const deleteLabel = computed(() =>
  props.draft.isOptionGroup ? "Удалить группу опций" : "Удалить категорию",
);
const modalWidth = computed(() => (props.draft.isOptionGroup ? 560 : 448));
const kindDisabled = computed(() => editing.value || props.pending);
const title = computed(() => {
  if (editing.value) {
    return props.draft.isOptionGroup
      ? "Редактировать группу опций"
      : "Редактировать категорию";
  }

  return props.draft.isOptionGroup ? "Новая группа опций" : "Новая категория";
});
const nameLabel = computed(() =>
  props.draft.isOptionGroup ? "Название группы опций" : "Название категории",
);
const namePlaceholder = computed(() =>
  props.draft.isOptionGroup
    ? "Например: Сахар, Молоко, Сироп"
    : "Например: Кофе, Чай, Десерты",
);
const associationDisabled = computed(
  () => props.pending || props.draft.isOptionGroup,
);
const showNoOptions = computed(
  () => !props.draft.isOptionGroup && props.options.length === 0,
);
const selectOptions = computed(() => [
  { value: "", label: "Не выбрано" },
  ...props.options,
]);
const saveLabel = computed(() => {
  if (props.pending) {
    return "Сохранение…";
  }

  return editing.value ? "Сохранить" : "Добавить";
});
const saveDisabled = computed(() => props.pending || !props.canSave);

function update<Key extends keyof CatalogCategoryDraft>(
  key: Key,
  value: CatalogCategoryDraft[Key],
) {
  if (!props.pending) {
    emit("update:draft", { ...props.draft, [key]: value });
  }
}

function save() {
  if (!saveDisabled.value) {
    emit("save");
  }
}

function remove() {
  if (editing.value && !props.pending) {
    emit("delete");
  }
}

function close() {
  if (!props.pending) {
    emit("close");
  }
}
</script>

<style scoped>
.catalog-category-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
}
:global(.catalog-category-dialog .operations-button),
:global(.catalog-category-dialog .catalog-dialog-header__delete),
:global(.catalog-category-dialog .operations-toggle__control) {
  min-height: 44px;
  min-width: 44px;
}
.catalog-category-form__association {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.catalog-category-form__hint {
  margin: 0;
  color: var(--color-foreground-muted);
  font-size: 12px;
  line-height: 16px;
}
.catalog-category-form__error {
  margin: 0;
  color: var(--color-danger);
  font-size: 13px;
  line-height: 19.5px;
}
</style>

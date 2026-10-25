<template>
  <OperationsModal
    class="catalog-category-dialog"
    :open="props.open"
    :title="title"
    :persistent="props.pending"
    bottom-sheet
    @close="requestClose"
  >
    <template #header="{ titleId }">
      <CatalogDialogHeader
        :title="title"
        :title-id="titleId"
        :summary="props.summary"
        :editing="isEditing"
        :pending="props.pending"
        :delete-label="deleteLabel"
        @delete="requestDelete"
      />
    </template>
    <form
      :id="formId"
      class="catalog-category-form"
      :aria-busy="props.pending"
      @submit.prevent="requestSave"
    >
      <OperationsInput
        :label="nameLabel"
        :model-value="props.draft.name"
        :disabled="props.pending"
        :placeholder="namePlaceholder"
        required
        autocomplete="off"
        @update:model-value="emitDraftField('name', $event)"
      />
      <OperationsToggle
        v-if="!isEditing"
        label="Группа опций"
        description="Опции, которые можно выбрать для товара"
        :model-value="props.draft.isOptionGroup"
        :disabled="kindDisabled"
        @update:model-value="emitDraftField('isOptionGroup', $event)"
      />
      <OperationsToggle
        v-if="props.draft.isOptionGroup"
        label="Единственное значение"
        description="Можно выбрать только одно значение группы"
        :divider="false"
        :model-value="props.draft.singleSelection"
        :disabled="props.pending"
        @update:model-value="emitDraftField('singleSelection', $event)"
      />
      <div v-else class="catalog-category-form__association">
        <label :for="groupsId">Выбрать группы опций</label>
        <CatalogOptionGroupSelect
          :id="groupsId"
          :model-value="props.draft.optionGroupIds"
          :options="props.options"
          :disabled="props.pending"
          @update:model-value="emitDraftField('optionGroupIds', $event)"
        />
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
        @click="requestClose"
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
import CatalogOptionGroupSelect from "../../../entities/catalog/ui/CatalogOptionGroupSelect.vue";
import type {
  CatalogCategoryDialogEmits,
  CatalogCategoryDialogProps,
  CatalogCategoryDraft,
} from "./CatalogEditor.types";

const props = defineProps<CatalogCategoryDialogProps>();
const emit = defineEmits<CatalogCategoryDialogEmits>();
const formId = useId();
const groupsId = useId();

const isEditing = computed(() => props.mode === "edit");

const deleteLabel = computed(() =>
  props.draft.isOptionGroup ? "Удалить группу опций" : "Удалить категорию",
);

const kindDisabled = computed(() => isEditing.value || props.pending);

const title = computed(() => {
  if (isEditing.value) {
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

const saveLabel = computed(() => {
  if (props.pending) {
    return "Сохранение…";
  }

  return isEditing.value ? "Сохранить" : "Добавить";
});

const saveDisabled = computed(() => props.pending || !props.canSave);

function emitDraftField<Key extends keyof CatalogCategoryDraft>(
  key: Key,
  value: CatalogCategoryDraft[Key],
) {
  if (props.pending) {
    return;
  }

  emit("update:draft", { ...props.draft, [key]: value });
}

function requestSave() {
  if (saveDisabled.value) {
    return;
  }

  emit("save");
}

function requestDelete() {
  if (!isEditing.value || props.pending) {
    return;
  }

  emit("delete");
}

function requestClose() {
  if (props.pending) {
    return;
  }

  emit("close");
}
</script>

<style scoped>
/* Интервалы исходной формы и подписи локальны; tokens для них нет. */
.catalog-category-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
}
/* В этой форме исходные элементы управления сохраняют цель нажатия 44px. */
:global(.catalog-category-dialog .operations-button),
:global(.catalog-category-dialog .catalog-dialog-header__delete),
:global(.catalog-category-dialog .operations-toggle__control) {
  min-height: 44px;
  min-width: 44px;
}
.catalog-category-form__association {
  min-width: 0;
  font-size: 13px;
  color: var(--color-foreground-muted);
  display: flex;
  flex-direction: column;
  gap: 6px;
}
/* Размер и межстрочный интервал исходной ошибки не заданы tokens темы. */
.catalog-category-form__error {
  margin: 0;
  color: var(--color-danger);
  font-size: 13px;
  line-height: 19.5px;
}
</style>

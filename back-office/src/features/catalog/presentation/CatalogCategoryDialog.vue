<template>
  <OperationsModal
    class="catalog-category-dialog"
    :open="props.open"
    :title="title"
    :persistent="props.pending"
    bottom-sheet
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
      <OperationsToggle
        v-if="props.draft.isOptionGroup"
        label="Единственное значение"
        description="Можно выбрать только одно значение группы"
        :divider="false"
        :model-value="props.draft.singleSelection"
        :disabled="props.pending"
        @update:model-value="update('singleSelection', $event)"
      />
      <div v-else class="catalog-category-form__association">
        <label :for="groupsId">Выбрать группы опций</label>
        <VSelect
          :id="groupsId"
          class="catalog-category-form__groups"
          :model-value="props.draft.optionGroupIds"
          :items="props.options"
          item-title="label"
          item-value="value"
          :disabled="props.pending"
          :menu-icon="CATALOG_GROUP_MENU_ICON"
          multiple
          chips
          hide-details
          variant="outlined"
          density="compact"
          placeholder="Не выбрано"
          @update:model-value="updateGroups"
        >
          <template #item="{ props: itemProps }">
            <VListItem v-bind="{ ...itemProps, role: 'option', tag: 'div' }">
              <template #prepend="{ isSelected }">
                <svg
                  class="catalog-category-form__check"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    :d="
                      isSelected
                        ? CATALOG_GROUP_CHECK_ICONS.checked
                        : CATALOG_GROUP_CHECK_ICONS.unchecked
                    "
                  />
                </svg>
              </template>
            </VListItem>
          </template>
        </VSelect>
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
import { VSelect } from "vuetify/components/VSelect";
import { VListItem } from "vuetify/components/VList";
import {
  CATALOG_GROUP_MENU_ICON,
  CATALOG_GROUP_CHECK_ICONS,
} from "./CatalogEditor.constants";
import type {
  CatalogCategoryDialogEmits,
  CatalogCategoryDialogProps,
  CatalogCategoryDraft,
} from "./CatalogEditor.types";

const props = defineProps<CatalogCategoryDialogProps>();
const emit = defineEmits<CatalogCategoryDialogEmits>();
const formId = useId();
const groupsId = useId();

const editing = computed(() => props.mode === "edit");
const deleteLabel = computed(() =>
  props.draft.isOptionGroup ? "Удалить группу опций" : "Удалить категорию",
);
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

function updateGroups(value: unknown) {
  if (
    Array.isArray(value) &&
    value.every((entry): entry is string => typeof entry === "string")
  ) {
    update("optionGroupIds", value);
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
  min-width: 0;
  font-size: 13px;
  color: var(--color-foreground-muted);
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.catalog-category-form__groups :deep(.v-field) {
  border-radius: 12px;
  color: var(--color-foreground);
  font-family: Inter, sans-serif;
  font-size: 14px;
}
.catalog-category-form__groups :deep(.v-field__input) {
  min-height: 44px;
  padding-block: 6px;
}
.catalog-category-form__check {
  width: 24px;
  height: 24px;
  margin-right: 16px;
  fill: currentColor;
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

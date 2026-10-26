<template>
  <OperationsModal
    class="catalog-product-dialog"
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
      class="catalog-product-form"
      :aria-busy="props.pending"
      @submit.prevent="requestSave"
    >
      <OperationsInput
        v-if="showParentBeforeName"
        :label="parentLabel"
        type="select"
        :model-value="props.draft.categoryId"
        :options="categoryOptions"
        :disabled="parentSelectionDisabled"
        required
        @update:model-value="emitDraftField('categoryId', $event)"
      />
      <OperationsInput
        :label="nameLabel"
        :model-value="props.draft.name"
        :disabled="props.pending"
        :placeholder="namePlaceholder"
        required
        autocomplete="off"
        @update:model-value="emitDraftField('name', $event)"
      />
      <OperationsInput
        v-if="!showParentBeforeName"
        :label="parentLabel"
        type="select"
        :model-value="props.draft.categoryId"
        :options="categoryOptions"
        :disabled="parentSelectionDisabled"
        required
        @update:model-value="emitDraftField('categoryId', $event)"
      />
      <OperationsToggle
        v-if="!props.isOption"
        :label="choicesLabel"
        :description="choicesDescription"
        :model-value="props.draft.hasSizes"
        :disabled="props.pending"
        @update:model-value="emitDraftField('hasSizes', $event)"
      />
      <div
        v-if="showChoicePrices"
        class="catalog-product-form__sizes"
        role="group"
        aria-label="Цены по размерам, ₽"
      >
        <p class="catalog-product-form__size-label">Цены по размерам, ₽</p>
        <div
          v-for="choice in props.draft.choices"
          :key="choice.key"
          class="catalog-product-form__size-row"
        >
          <span class="catalog-product-form__size">{{ choice.label }}</span>
          <OperationsInput
            :label="`Цена ${choice.label}, ₽`"
            hide-label
            inputmode="decimal"
            :model-value="choice.price"
            :disabled="props.pending"
            placeholder="Введите цену"
            @update:model-value="emitChoicePrice(choice.key, $event)"
          />
        </div>
      </div>
      <OperationsInput
        v-else
        label="Цена, ₽"
        inputmode="decimal"
        :model-value="props.draft.price"
        :disabled="props.pending"
        placeholder="Введите цену"
        required
        @update:model-value="emitDraftField('price', $event)"
      />
      <p v-if="props.error" class="catalog-product-form__error" role="alert">
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
import { CATALOG_SIZES } from "./CatalogEditor.constants";
import type {
  CatalogProductDialogEmits,
  CatalogProductDialogProps,
  CatalogProductDraft,
} from "./CatalogEditor.types";

const props = defineProps<CatalogProductDialogProps>();
const emit = defineEmits<CatalogProductDialogEmits>();
const formId = useId();

const isEditing = computed(() => props.mode === "edit");

const hasDefaultSizeLabels = computed(
  () =>
    props.draft.choices.length === CATALOG_SIZES.length &&
    props.draft.choices.every(
      (choice, index) => choice.label === CATALOG_SIZES[index],
    ),
);

const choicesLabel = computed(() =>
  hasDefaultSizeLabels.value ? "Размеры S / M / L" : "Ценовые опции",
);

const choicesDescription = computed(() =>
  hasDefaultSizeLabels.value
    ? "Включить разные размеры с отдельными ценами"
    : "Включить варианты с отдельными ценами",
);

const title = computed(() => {
  if (props.isOption) {
    return isEditing.value ? "Редактировать опцию" : "Новая опция";
  }

  return isEditing.value ? "Редактировать товар" : "Новый товар";
});

const deleteLabel = computed(() =>
  props.isOption ? "Удалить опцию" : "Удалить товар",
);

const nameLabel = computed(() =>
  props.isOption ? "Название опции" : "Название товара",
);

const namePlaceholder = computed(() =>
  props.isOption ? "Например: Обычное молоко" : "Например: Капучино, Латте",
);

const parentLabel = computed(() => {
  if (props.isOption) {
    return "Группа опций";
  }

  return isEditing.value ? "Категория" : "Категория / группа опций";
});

const showParentBeforeName = computed(
  () => !isEditing.value && !props.isOption,
);

const parentSelectionDisabled = computed(
  () => props.pending || (isEditing.value && props.isOption),
);

const showChoicePrices = computed(
  () => !props.isOption && props.draft.hasSizes,
);

const saveLabel = computed(() => {
  if (props.pending) {
    return "Сохранение…";
  }

  return isEditing.value ? "Сохранить" : "Добавить";
});

const saveDisabled = computed(() => props.pending || !props.canSave);

const categoryOptions = computed(() => [
  { value: "", label: "Выберите категорию или группу", disabled: true },
  ...props.categories.map((option) => ({
    ...option,
    label:
      props.isOption && option.value === props.draft.categoryId
        ? (option.selectedLabel ?? option.label)
        : option.label,
  })),
]);

function emitDraftField<Key extends keyof CatalogProductDraft>(
  key: Key,
  value: CatalogProductDraft[Key],
) {
  if (props.pending) {
    return;
  }

  emit("update:draft", { ...props.draft, [key]: value });
}

function emitChoicePrice(choiceKey: string, price: string) {
  const choices = props.draft.choices.map((choice) =>
    choice.key === choiceKey ? { ...choice, price } : choice,
  );

  emitDraftField("choices", choices);
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
/* Геометрия исходной формы и строк цен локальна; подходящих tokens нет. */
.catalog-product-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
}
/* Цель нажатия исходных действий и переключателя сохраняется в 44px. */
:global(.catalog-product-dialog .operations-button),
:global(.catalog-product-dialog .catalog-dialog-header__delete),
:global(.catalog-product-dialog .operations-toggle__control) {
  min-height: 44px;
  min-width: 44px;
}
/* Исходные размеры, интервалы и типографика ценовых строк не имеют tokens. */
.catalog-product-form__sizes {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.catalog-product-form__size-label {
  margin: 0;
  color: var(--color-foreground-muted);
  font-size: 13px;
  font-weight: 500;
  line-height: 19.5px;
}
.catalog-product-form__size-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.catalog-product-form__size {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  max-width: 45%;
  padding-inline: 8px;
  overflow-wrap: anywhere;
  height: 40px;
  border-radius: 8px;
  background: var(--color-background);
  color: var(--color-foreground-muted);
  font-size: 13px;
  font-weight: 500;
  line-height: 19.5px;
}
/* Типографика исходной ошибки локальна; цвет принадлежит теме. */
.catalog-product-form__error {
  margin: 0;
  color: var(--color-danger);
  font-size: 13px;
  line-height: 19.5px;
}
</style>

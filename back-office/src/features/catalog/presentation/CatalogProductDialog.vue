<template>
  <OperationsModal
    class="catalog-product-dialog"
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
        :delete-label="props.isOption ? 'Удалить опцию' : 'Удалить товар'"
        @delete="remove"
      />
    </template>
    <form
      :id="formId"
      class="catalog-product-form"
      :aria-busy="props.pending"
      @submit.prevent="save"
    >
      <OperationsInput
        v-if="!editing && !props.isOption"
        :label="parentLabel"
        type="select"
        :model-value="props.draft.categoryId"
        :options="categoryOptions"
        :disabled="props.pending || (editing && props.isOption)"
        required
        @update:model-value="update('categoryId', $event)"
      />
      <OperationsInput
        :label="props.isOption ? 'Название опции' : 'Название товара'"
        :model-value="props.draft.name"
        :disabled="props.pending"
        :placeholder="
          props.isOption
            ? 'Например: Обычное молоко'
            : 'Например: Капучино, Латте'
        "
        required
        autocomplete="off"
        @update:model-value="update('name', $event)"
      />
      <OperationsInput
        v-if="editing || props.isOption"
        :label="parentLabel"
        type="select"
        :model-value="props.draft.categoryId"
        :options="categoryOptions"
        :disabled="props.pending || (editing && props.isOption)"
        required
        @update:model-value="update('categoryId', $event)"
      />
      <OperationsToggle
        v-if="!props.isOption"
        :label="choicesLabel"
        :description="choicesDescription"
        :model-value="props.draft.hasSizes"
        :disabled="props.pending"
        @update:model-value="update('hasSizes', $event)"
      />
      <div
        v-if="!props.isOption && props.draft.hasSizes"
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
            @update:model-value="updateChoice(choice.key, $event)"
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
        @update:model-value="update('price', $event)"
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
import { CATALOG_SIZES } from "./CatalogEditor.constants";
import type {
  CatalogProductDialogEmits,
  CatalogProductDialogProps,
  CatalogProductDraft,
} from "./CatalogEditor.types";

const props = defineProps<CatalogProductDialogProps>();
const emit = defineEmits<CatalogProductDialogEmits>();
const formId = useId();

const editing = computed(() => props.mode === "edit");
const preset = computed(
  () =>
    props.draft.choices.length === CATALOG_SIZES.length &&
    props.draft.choices.every(
      (choice, index) => choice.label === CATALOG_SIZES[index],
    ),
);
const choicesLabel = computed(() =>
  preset.value ? "Размеры S / M / L" : "Ценовые опции",
);
const choicesDescription = computed(() =>
  preset.value
    ? "Включить разные размеры с отдельными ценами"
    : "Включить варианты с отдельными ценами",
);
const title = computed(() => {
  if (props.isOption) {
    return editing.value ? "Редактировать опцию" : "Новая опция";
  }

  return editing.value ? "Редактировать товар" : "Новый товар";
});
const parentLabel = computed(() =>
  props.isOption
    ? "Группа опций"
    : editing.value
      ? "Категория"
      : "Категория / группа опций",
);
const saveLabel = computed(() => {
  if (props.pending) {
    return "Сохранение…";
  }

  return editing.value ? "Сохранить" : "Добавить";
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

function update<Key extends keyof CatalogProductDraft>(
  key: Key,
  value: CatalogProductDraft[Key],
) {
  if (!props.pending) {
    emit("update:draft", { ...props.draft, [key]: value });
  }
}

function updateChoice(key: string, value: string) {
  update(
    "choices",
    props.draft.choices.map((choice) =>
      choice.key === key ? { ...choice, price: value } : choice,
    ),
  );
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
.catalog-product-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
}
:global(.catalog-product-dialog .operations-button),
:global(.catalog-product-dialog .catalog-dialog-header__delete),
:global(.catalog-product-dialog .operations-toggle__control) {
  min-height: 44px;
  min-width: 44px;
}
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
.catalog-product-form__error {
  margin: 0;
  color: var(--color-danger);
  font-size: 13px;
  line-height: 19.5px;
}
</style>

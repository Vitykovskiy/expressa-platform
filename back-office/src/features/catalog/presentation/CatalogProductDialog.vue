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
        delete-label="Удалить товар"
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
        v-if="!editing"
        label="Категория"
        type="select"
        :model-value="props.draft.categoryId"
        :options="categoryOptions"
        :disabled="props.pending"
        required
        @update:model-value="update('categoryId', $event)"
      />
      <OperationsInput
        label="Название товара"
        :model-value="props.draft.name"
        :disabled="props.pending"
        placeholder="Например: Капучино, Латте"
        required
        autocomplete="off"
        @update:model-value="update('name', $event)"
      />
      <OperationsInput
        v-if="editing"
        label="Категория"
        type="select"
        :model-value="props.draft.categoryId"
        :options="categoryOptions"
        :disabled="props.pending"
        required
        @update:model-value="update('categoryId', $event)"
      />
      <OperationsToggle
        :label="choicesLabel"
        :description="choicesDescription"
        :model-value="props.draft.hasSizes"
        :disabled="props.pending"
        @update:model-value="update('hasSizes', $event)"
      />
      <div
        v-if="props.draft.hasSizes"
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
      <section
        v-if="hasInheritedGroups"
        class="catalog-product-form__groups"
        aria-label="Опции категории"
      >
        <h3>Опции категории</h3>
        <p
          v-for="group in props.inheritedGroups"
          :key="group.value"
          class="catalog-product-form__inherited"
        >
          {{ group.label }}
        </p>
      </section>
      <fieldset v-if="hasOwnGroups" class="catalog-product-form__groups">
        <legend>Дополнительные группы опций</legend>
        <label
          v-for="group in props.ownGroups"
          :key="group.value"
          class="catalog-product-form__group-check"
          ><input
            type="checkbox"
            :value="group.value"
            :checked="props.draft.modifierGroupIds.includes(group.value)"
            :disabled="props.pending"
            @change="toggleGroup(group.value)"
          /><span>{{ group.label }}</span></label
        >
      </fieldset>
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
const hasInheritedGroups = computed(() => props.inheritedGroups.length > 0);
const hasOwnGroups = computed(() => props.ownGroups.length > 0);
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
const title = computed(() =>
  editing.value ? "Редактировать товар" : "Новый товар",
);
const saveLabel = computed(() => {
  if (props.pending) {
    return "Сохранение…";
  }

  return editing.value ? "Сохранить" : "Добавить";
});
const saveDisabled = computed(() => props.pending || !props.canSave);
const categoryOptions = computed(() => [
  { value: "", label: "Выберите категорию", disabled: true },
  ...props.categories,
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

function toggleGroup(id: string) {
  const groups = props.draft.modifierGroupIds;

  update(
    "modifierGroupIds",
    groups.includes(id)
      ? groups.filter((current) => current !== id)
      : [...groups, id],
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
.catalog-product-form__groups {
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  border: 0;
  min-width: 0;
}
.catalog-product-form__groups h3,
.catalog-product-form__groups legend {
  margin: 0;
  padding: 0;
  font-size: 13px;
  font-weight: 500;
  line-height: 20px;
  color: var(--color-foreground-muted);
}
.catalog-product-form__inherited {
  margin: 0;
  font-size: 14px;
  line-height: 24px;
  overflow-wrap: anywhere;
}
.catalog-product-form__group-check {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  font-size: 14px;
  cursor: pointer;
}
.catalog-product-form__group-check input {
  width: 18px;
  height: 18px;
  accent-color: var(--color-primary);
  flex-shrink: 0;
}
.catalog-product-form__group-check span {
  min-width: 0;
  overflow-wrap: anywhere;
}
</style>

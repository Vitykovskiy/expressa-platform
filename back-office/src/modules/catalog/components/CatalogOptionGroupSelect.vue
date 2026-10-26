<template>
  <VSelect
    :id="props.id"
    class="catalog-option-group-select"
    :model-value="props.modelValue"
    :items="props.options"
    item-title="label"
    item-value="value"
    :disabled="props.disabled"
    :menu-icon="CATALOG_GROUP_MENU_ICON"
    multiple
    chips
    hide-details
    variant="outlined"
    density="compact"
    placeholder="Не выбрано"
    @update:model-value="emitSelection"
  >
    <template #item="{ props: itemProps }">
      <VListItem v-bind="{ ...itemProps, role: 'option', tag: 'div' }">
        <template #prepend="{ isSelected }">
          <svg
            class="catalog-option-group-select__check"
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
</template>

<script setup lang="ts">
import { VSelect } from "vuetify/components/VSelect";
import { VListItem } from "vuetify/components/VList";
import {
  CATALOG_GROUP_MENU_ICON,
  CATALOG_GROUP_CHECK_ICONS,
} from "./CatalogOptionGroupSelect.constants";
import type {
  CatalogOptionGroupSelectEmits,
  CatalogOptionGroupSelectProps,
} from "./CatalogOptionGroupSelect.types";

const props = defineProps<CatalogOptionGroupSelectProps>();
const emit = defineEmits<CatalogOptionGroupSelectEmits>();

function emitSelection(value: unknown) {
  if (!Array.isArray(value)) {
    return;
  }

  if (
    !value.every((groupId): groupId is string => typeof groupId === "string")
  ) {
    return;
  }

  emit("update:modelValue", value);
}
</script>

<style scoped>
/* VSelect 3.13.7 не предоставляет props для отдельных внутренних отступов
   и min-height ввода. Исходные 44px/6px и радиус 12px сохраняются только
   в этом адаптере вместе со шрифтом Inter 14px; подходящих tokens для них нет. */
.catalog-option-group-select :deep(.v-field) {
  border-radius: 12px;
  color: var(--color-foreground);
  font-family: Inter, sans-serif;
  font-size: 14px;
}
.catalog-option-group-select :deep(.v-field__input) {
  min-height: 44px;
  padding-block: 6px;
}
/* Размер и интервал исходной отметки меню не имеют product tokens. */
.catalog-option-group-select__check {
  width: 24px;
  height: 24px;
  margin-right: 16px;
  fill: currentColor;
}
</style>

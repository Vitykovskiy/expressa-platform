<template>
  <div class="availability-search">
    <UiFilterGroup
      :model-value="mode"
      label="Показать"
      :options="availabilityModes"
      @update:model-value="changeMode"
    />
    <div class="availability-search__fields">
      <UiTextField
        :model-value="search"
        label="Поиск"
        type="search"
        @update:model-value="emit('search', $event)"
      />
      <UiSelect
        :model-value="categoryId"
        label="Категория"
        :options="categories"
        @update:model-value="emit('category', $event)"
      />
      <UiButton
        v-if="showRefresh"
        variant="quiet"
        :loading="loading"
        :disabled="refreshDisabled"
        @activate="emit('refresh')"
        >Обновить</UiButton
      >
    </div>
  </div>
</template>

<script setup lang="ts">
import UiFilterGroup from "../../shared/ui/UiFilterGroup/UiFilterGroup.vue";
import UiTextField from "../../shared/ui/UiTextField/UiTextField.vue";
import UiSelect from "../../shared/ui/UiSelect/UiSelect.vue";
import UiButton from "../../shared/ui/UiButton/UiButton.vue";
import { availabilityModes } from "./AvailabilitySearch.constants";
import type {
  AvailabilitySearchEmits,
  AvailabilitySearchProps,
} from "./AvailabilitySearch.types";

defineProps<AvailabilitySearchProps>();
const emit = defineEmits<AvailabilitySearchEmits>();

function changeMode(value: string) {
  if (value === "products" || value === "addons") emit("mode", value);
}
</script>

<style scoped>
.availability-search {
  display: grid;
  gap: var(--space-lg);
}
.availability-search__fields {
  display: grid;
  align-items: end;
  gap: var(--space-md);
  min-inline-size: 0;
}
@media (min-width: 37.5rem) {
  .availability-search__fields {
    grid-template-columns: minmax(0, 2fr) minmax(0, 1fr) auto;
  }
}
</style>

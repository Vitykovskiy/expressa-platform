<template>
  <div class="product-search">
    <UiTextField
      label="Поиск товаров"
      :model-value="search"
      :disabled="disabled"
      @update:model-value="emit('search', $event)"
    />
    <UiSelect
      label="Категория товаров"
      :model-value="categoryId"
      :options="options"
      :disabled="disabled"
      @update:model-value="emit('category', $event ?? '')"
    />
    <UiButton
      v-if="showRefresh"
      variant="quiet"
      :disabled="disabled"
      :loading="loading"
      @activate="emit('refresh')"
      >Обновить</UiButton
    >
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import UiButton from "../../shared/ui/UiButton/UiButton.vue";
import UiTextField from "../../shared/ui/UiTextField/UiTextField.vue";
import UiSelect from "../../shared/ui/UiSelect/UiSelect.vue";
import type {
  ProductSearchProps,
  ProductSearchEmits,
} from "./ProductSearch.types";

const props = defineProps<ProductSearchProps>();
const emit = defineEmits<ProductSearchEmits>();
const options = computed(() => [
  { value: "", label: "Все категории" },
  ...props.categories.map((category) => ({
    value: category.id,
    label: `${category.name} · Порядок ${category.sortOrder}`,
  })),
]);
</script>

<style scoped>
.product-search {
  display: grid;
  gap: var(--space-lg);
  min-inline-size: 0;
  justify-items: stretch;
}
.product-search > :last-child {
  justify-self: start;
}
</style>

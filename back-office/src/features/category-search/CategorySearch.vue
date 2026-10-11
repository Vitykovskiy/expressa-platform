<template>
  <div class="category-search">
    <UiTextField
      :model-value="search"
      label="Поиск категорий"
      type="search"
      @update:model-value="emit('search', $event)"
    />
    <UiButton
      v-if="showRefresh"
      variant="quiet"
      :loading="loading"
      :disabled="disabled"
      @activate="emit('refresh')"
      >Обновить</UiButton
    >
  </div>
</template>

<script setup lang="ts">
import UiTextField from "../../shared/ui/UiTextField/UiTextField.vue";
import UiButton from "../../shared/ui/UiButton/UiButton.vue";
import type {
  CategorySearchProps,
  CategorySearchEmits,
} from "./CategorySearch.types";

defineProps<CategorySearchProps>();
const emit = defineEmits<CategorySearchEmits>();
</script>

<style scoped>
.category-search {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: var(--space-md);
}
.category-search > :first-child {
  flex: 1;
  min-inline-size: 0;
}
</style>

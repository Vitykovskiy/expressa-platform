<template>
  <div class="modifier-search">
    <UiTextField
      id="modifier-search"
      name="modifier-search"
      autocomplete="off"
      label="Поиск групп"
      type="search"
      :model-value="search"
      :disabled="disabled"
      @update:model-value="emit('search', $event)"
    />
    <UiButton
      v-if="showRefresh"
      variant="secondary"
      :disabled="disabled"
      :loading="loading"
      @activate="emit('refresh')"
      >Обновить</UiButton
    >
  </div>
</template>

<script setup lang="ts">
import UiTextField from "../../shared/ui/UiTextField/UiTextField.vue";
import UiButton from "../../shared/ui/UiButton/UiButton.vue";
import type {
  ModifierSearchProps,
  ModifierSearchEmits,
} from "./ModifierSearch.types";

defineProps<ModifierSearchProps>();
const emit = defineEmits<ModifierSearchEmits>();
</script>

<style scoped>
.modifier-search {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: var(--space-md);
  min-inline-size: 0;
}
.modifier-search > :first-child {
  flex: 1;
  min-inline-size: min(100%, 14rem);
}
</style>

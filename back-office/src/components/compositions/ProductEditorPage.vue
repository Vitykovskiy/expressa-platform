<template>
  <section class="page">
    <h1>Редактор товара</h1>
    <ProductForm
      :initial="initial"
      :server-errors="serverErrors"
      @save="saved"
    />
    <ModifierGroupEditor
      :initial="modifierGroup"
      :categories="categories"
      :server-errors="modifierServerErrors"
      @save="savedModifierGroup"
    />
    <ModifierOptionEditor
      :initial="modifierOption"
      @save="savedModifierOption"
    />
    <Snackbar v-model="success" message="Товар сохранён" />
  </section>
</template>

<script setup lang="ts">
import { shallowRef } from "vue";
import Snackbar from "../domain-ui/Feedback/Snackbar.vue";
import type { Category } from "../domain-ui/Menu/CategoryListItem.vue";
import ModifierGroupEditor, {
  type ModifierGroupDraft,
} from "../domain-ui/Menu/ModifierGroupEditor.vue";
import ModifierOptionEditor, {
  type ModifierOption,
} from "../domain-ui/Menu/ModifierOptionEditor.vue";
import ProductForm, { type Draft } from "../domain-ui/Menu/ProductForm.vue";
withDefaults(
  defineProps<{
    initial: Draft;
    serverErrors?: Record<string, string>;
    categories?: Category[];
    modifierGroup?: ModifierGroupDraft;
    modifierOption?: ModifierOption;
    modifierServerErrors?: Record<string, string>;
  }>(),
  {
    categories: () => [],
    modifierGroup: () => ({
      name: "",
      categoryId: "",
      required: false,
      mode: "multiple",
      min: "0",
      max: "1",
    }),
    modifierOption: () => ({
      id: "new",
      name: "",
      price: "0",
      defaultFree: false,
    }),
    serverErrors: undefined,
    modifierServerErrors: undefined,
  },
);
const emit = defineEmits<{
  save: [value: Draft];
  "save-modifier-group": [value: ModifierGroupDraft];
  "save-modifier-option": [value: ModifierOption];
}>();
const success = shallowRef(false);
function saved(value: Draft) {
  success.value = true;
  emit("save", value);
}
function savedModifierGroup(value: ModifierGroupDraft) {
  success.value = true;
  emit("save-modifier-group", value);
}
function savedModifierOption(value: ModifierOption) {
  success.value = true;
  emit("save-modifier-option", value);
}
</script>

<style scoped>
.page {
  display: grid;
  gap: var(--expressa-space-4);
}
h1 {
  margin: 0;
}
</style>

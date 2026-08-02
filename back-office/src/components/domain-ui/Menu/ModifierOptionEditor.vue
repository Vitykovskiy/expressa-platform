<template>
  <fieldset>
    <legend>Вариант добавки</legend>
    <UiTextField
      v-model="draft.name"
      label="Название варианта"
      :error-message="error"
    /><UiTextField
      v-model="draft.price"
      label="Цена варианта"
      inputmode="numeric"
    /><UiToggle
      v-model="draft.defaultFree"
      label="Бесплатен по умолчанию"
    /><UiButton type="button" @click="save">Сохранить вариант</UiButton>
  </fieldset>
</template>
<script setup lang="ts">
import { computed, reactive } from "vue";
import UiButton from "../../../shared/ui/UiButton.vue";
import UiTextField from "../../../shared/ui/UiTextField.vue";
import UiToggle from "../../../shared/ui/UiToggle.vue";
export interface ModifierOption {
  id: string;
  name: string;
  price: string;
  defaultFree: boolean;
}
const props = defineProps<{ initial: ModifierOption }>();
const emit = defineEmits<{ save: [value: ModifierOption] }>();
const draft = reactive({ ...props.initial });
const error = computed(() => (draft.name.trim() ? "" : "Название обязательно"));
function save() {
  if (!error.value) emit("save", { ...draft });
}
</script>
<style scoped>
fieldset {
  display: grid;
  gap: var(--expressa-space-2);
}
</style>

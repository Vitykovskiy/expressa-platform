<template>
  <form @submit.prevent="submit">
    <UiTextField
      v-model="draft.name"
      label="Название группы"
      :error-message="errors.name"
    /><label
      >Категория
      <select v-model="draft.categoryId">
        <option value="">Выберите категорию</option>
        <option
          v-for="category in categories"
          :key="category.id"
          :value="category.id"
        >
          {{ category.name }}
        </option>
      </select></label
    ><UiToggle v-model="draft.required" label="Группа обязательна" /><label
      >Выбор
      <select v-model="draft.mode">
        <option value="single">Один вариант</option>
        <option value="multiple">Несколько вариантов</option>
      </select></label
    ><UiTextField
      v-model="draft.min"
      label="Минимум вариантов"
      inputmode="numeric"
    /><UiTextField
      v-model="draft.max"
      label="Максимум вариантов"
      inputmode="numeric"
    /><FormErrors :errors="errors" /><UiButton type="submit"
      >Сохранить группу</UiButton
    >
  </form>
</template>
<script setup lang="ts">
import { reactive } from "vue";
import UiButton from "../../../shared/ui/UiButton.vue";
import UiTextField from "../../../shared/ui/UiTextField.vue";
import UiToggle from "../../../shared/ui/UiToggle.vue";
import FormErrors from "../Feedback/FormErrors.vue";
import type { Category } from "./CategoryListItem.vue";
export interface ModifierGroupDraft {
  name: string;
  categoryId: string;
  required: boolean;
  mode: "single" | "multiple";
  min: string;
  max: string;
}
const props = defineProps<{
  initial: ModifierGroupDraft;
  categories: Category[];
  serverErrors?: Record<string, string>;
}>();
const emit = defineEmits<{ save: [value: ModifierGroupDraft] }>();
const draft = reactive({ ...props.initial });
const errors = reactive({ ...props.serverErrors } as Record<string, string>);
function submit() {
  errors.name = draft.name.trim() ? "" : "Название обязательно";
  errors.categoryId = props.categories.some(
    (category) => category.id === draft.categoryId,
  )
    ? ""
    : "Выберите существующую категорию";
  const min = Number(draft.min),
    max = Number(draft.max);
  errors.limits =
    Number.isInteger(min) &&
    Number.isInteger(max) &&
    min >= 0 &&
    max >= min &&
    (draft.mode !== "single" || max <= 1)
      ? ""
      : "Проверьте пределы выбора";
  if (!Object.values(errors).some(Boolean)) emit("save", { ...draft });
}
</script>
<style scoped>
form {
  display: grid;
  gap: var(--expressa-space-2);
}
select {
  min-height: var(--expressa-touch-target-min);
}
</style>

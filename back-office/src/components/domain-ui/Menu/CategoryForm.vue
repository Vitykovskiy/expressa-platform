<template>
  <form @submit.prevent="submit">
    <UiTextField
      v-model="draft.name"
      label="Название категории"
      :error-message="errors.name"
    /><UiToggle v-model="draft.active" label="Категория активна" /><FormErrors
      :errors="errors"
    /><UiButton type="submit">Сохранить категорию</UiButton>
  </form>
</template>
<script setup lang="ts">
import { reactive } from "vue";
import UiButton from "../../../shared/ui/UiButton.vue";
import UiTextField from "../../../shared/ui/UiTextField.vue";
import UiToggle from "../../../shared/ui/UiToggle.vue";
import FormErrors from "../Feedback/FormErrors.vue";
const props = defineProps<{
  initial: { name: string; active: boolean };
  serverErrors?: Record<string, string>;
}>();
const emit = defineEmits<{
  save: [value: { name: string; active: boolean }];
}>();
const draft = reactive({ ...props.initial });
const errors = reactive({ ...props.serverErrors } as Record<string, string>);
function submit() {
  errors.name = draft.name.trim() ? "" : "Название обязательно";
  if (!errors.name) emit("save", { ...draft });
}
</script>

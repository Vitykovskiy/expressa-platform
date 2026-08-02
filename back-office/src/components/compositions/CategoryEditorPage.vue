<template>
  <section class="page">
    <h1>Редактор категории</h1>
    <CategoryForm
      :initial="initial"
      :server-errors="serverErrors"
      @save="saved"
    /><Snackbar v-model="success" message="Категория сохранена" />
  </section>
</template>

<script setup lang="ts">
import { shallowRef } from "vue";
import Snackbar from "../domain-ui/Feedback/Snackbar.vue";
import CategoryForm from "../domain-ui/Menu/CategoryForm.vue";
const props = defineProps<{
  initial: { name: string; active: boolean };
  serverErrors?: Record<string, string>;
}>();
const emit = defineEmits<{
  save: [value: { name: string; active: boolean }];
}>();
const success = shallowRef(false);
function saved(value: { name: string; active: boolean }) {
  success.value = true;
  emit("save", value);
}
void props;
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

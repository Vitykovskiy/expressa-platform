<template>
  <section class="state" role="alert">
    <h2>{{ title }}</h2>
    <p>{{ message }}</p>
    <UiButton @click="emit('retry')">Повторить</UiButton>
  </section>
</template>
<script setup lang="ts">
import UiButton from "../../../shared/ui/UiButton.vue";
withDefaults(defineProps<{ title?: string; message: string }>(), {
  title: "Что-то пошло не так",
});
const emit = defineEmits<{ retry: [] }>();
</script>
<style scoped>
.state {
  padding: var(--expressa-space-6);
  border: 1px solid rgb(var(--v-theme-error));
  text-align: center;
}
</style>

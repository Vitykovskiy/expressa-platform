<template>
  <div v-if="messages.length" class="errors" role="alert">
    <p v-for="message in messages" :key="message">{{ message }}</p>
  </div>
</template>
<script setup lang="ts">
import { computed } from "vue";
const props = defineProps<{ errors: Record<string, string | string[]> }>();
const messages = computed(() =>
  Object.entries(props.errors).flatMap(([field, value]) =>
    (Array.isArray(value) ? value : [value]).map(
      (message) => `${field}: ${message}`,
    ),
  ),
);
</script>
<style scoped>
.errors {
  color: rgb(var(--v-theme-error));
}
</style>

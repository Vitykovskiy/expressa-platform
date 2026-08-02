<template>
  <section class="state" role="alert">
    <h2>{{ heading }}</h2>
    <p>{{ description }}</p>
    <button v-if="retryLabel" type="button" @click="emit('retry')">
      {{ retryLabel }}
    </button>
  </section>
</template>
<script setup lang="ts">
import { computed } from "vue";
defineOptions({ name: "FoErrorState" });
const props = defineProps<{
  title?: string;
  description: string;
  retryLabel?: string;
}>();
const emit = defineEmits<{ retry: [] }>();
const heading = computed(() => props.title ?? "Не удалось загрузить");
</script>
<style scoped>
.state {
  display: grid;
  justify-items: center;
  gap: var(--fo-space-2);
  padding: var(--fo-space-6) var(--fo-space-3);
  border: 1px solid var(--fo-danger);
  border-radius: var(--fo-radius-md);
  color: var(--fo-text);
  text-align: center;
  font: 400 1rem/1.3 var(--fo-font);
}
.state h2,
.state p {
  margin: 0;
  overflow-wrap: anywhere;
}
.state h2 {
  color: var(--fo-danger);
}
.state button {
  min-height: 2.75rem;
  border: 0;
  border-radius: var(--fo-radius-sm);
  padding: 0 var(--fo-space-3);
  color: var(--fo-surface);
  background: var(--fo-danger);
  font: 700 0.875rem/1 var(--fo-font);
  cursor: pointer;
}
</style>

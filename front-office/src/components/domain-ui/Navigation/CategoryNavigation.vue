<template>
  <nav class="category-navigation" aria-label="Категории">
    <button
      v-for="category in categories"
      :key="category.id"
      class="category-navigation-item"
      :class="{
        'category-navigation-item--active': category.id === modelValue,
      }"
      :aria-current="category.id === modelValue ? 'page' : undefined"
      type="button"
      @click="select(category.id)"
    >
      {{ category.title }}
    </button>
  </nav>
</template>

<script setup lang="ts">
interface Category {
  id: string;
  title: string;
}

defineOptions({ name: "FoCategoryNavigation" });

defineProps<{ categories: readonly Category[]; modelValue: string }>();
const emit = defineEmits<{ "update:modelValue": [id: string] }>();

function select(id: string): void {
  emit("update:modelValue", id);
}
</script>

<style scoped>
.category-navigation {
  display: flex;
  gap: var(--fo-space-2);
  overflow-x: auto;
  padding: var(--fo-space-2);
  background: var(--fo-surface);
}

.category-navigation-item {
  flex: 0 0 auto;
  min-height: 2.75rem;
  border: 1px solid var(--fo-border);
  border-radius: var(--fo-radius-lg);
  padding: 0 var(--fo-space-3);
  color: var(--fo-text);
  background: var(--fo-surface);
  font: 600 0.875rem/1.2 var(--fo-font);
  cursor: pointer;
}

.category-navigation-item--active {
  border-color: var(--fo-brand);
  color: var(--fo-surface);
  background: var(--fo-brand);
}
</style>

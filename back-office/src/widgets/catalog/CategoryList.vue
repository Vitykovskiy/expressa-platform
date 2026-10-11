<template>
  <ul class="category-list">
    <li v-for="(category, index) in categories" :key="category.id">
      <button
        :id="`category-${category.id}`"
        class="category-list__row"
        :disabled="disabled && category.id !== selectedId"
        :aria-disabled="disabled"
        :aria-pressed="category.id === selectedId"
        :aria-label="`${category.name}, ${category.isActive ? 'активна' : 'неактивна'}, порядок ${category.sortOrder}, запись ${index + 1}`"
        @click="select(category.id)"
      >
        <span class="category-list__name">{{ category.name }}</span>
        <span class="category-list__metadata"
          >{{ category.isActive ? "Активна" : "Неактивна" }} · Порядок
          {{ category.sortOrder }}</span
        >
      </button>
      <button
        :id="`category-associations-${category.id}`"
        class="category-list__associations"
        type="button"
        :disabled="disabled"
        :aria-label="`Группы добавок: ${category.name}, ${category.isActive ? 'активна' : 'неактивна'}, порядок ${category.sortOrder}, запись ${index + 1}`"
        @click="associations(category.id)"
      >
        Группы добавок
      </button>
    </li>
  </ul>
</template>

<script setup lang="ts">
import type {
  CategoryListProps,
  CategoryListEmits,
} from "./CategoryList.types";

const props = defineProps<CategoryListProps>();
const emit = defineEmits<CategoryListEmits>();

function select(id: string) {
  if (!props.disabled) emit("select", id);
}

function associations(id: string) {
  if (!props.disabled) emit("associations", id);
}
</script>

<style scoped>
.category-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.category-list li + li {
  border-block-start: var(--border-width) solid var(--color-border);
}
.category-list li {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--space-sm);
  padding-block-end: var(--space-sm);
}
.category-list__associations {
  justify-self: start;
  min-block-size: var(--control-height);
  max-inline-size: 100%;
  padding: var(--space-sm) var(--space-lg);
  border: 0;
  border-radius: var(--radius-control);
  background: transparent;
  color: var(--color-foreground);
  text-align: start;
  overflow-wrap: anywhere;
  cursor: pointer;
}
.category-list__associations:disabled {
  color: var(--color-foreground-muted);
  cursor: default;
}
.category-list__associations:hover:not(:disabled) {
  background: var(--color-surface-muted);
}
.category-list__associations:active:not(:disabled) {
  background: var(--color-selected);
}
.category-list__row {
  display: grid;
  gap: var(--space-sm);
  inline-size: 100%;
  min-block-size: var(--control-height);
  padding: var(--space-lg);
  text-align: start;
  border: 0;
  border-radius: var(--radius-control);
  background: transparent;
  color: var(--color-foreground);
  overflow-wrap: anywhere;
  cursor: pointer;
}
.category-list__row[aria-pressed="true"] {
  background: var(--color-selected);
  color: var(--color-on-selected);
}
.category-list__row:disabled,
.category-list__row[aria-disabled="true"] {
  cursor: default;
}
.category-list__name {
  font-weight: var(--weight-label);
}
.category-list__metadata {
  font-size: var(--font-data);
}
</style>

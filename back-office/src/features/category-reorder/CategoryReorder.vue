<template>
  <section class="category-reorder">
    <h2
      id="category-reorder-heading"
      class="foundation-section-title"
      tabindex="-1"
    >
      Порядок категорий
    </h2>
    <p v-if="dirty">Порядок не сохранён</p>
    <ol class="category-reorder__list">
      <li
        v-for="(category, index) in categories"
        :id="`reorder-${category.id}`"
        :key="category.id"
        tabindex="-1"
      >
        <div class="category-reorder__row">
          <div class="category-reorder__identity">
            <span>{{ category.name }}</span>
            <span class="category-reorder__metadata"
              >{{ category.isActive ? "Активна" : "Неактивна" }} · Порядок
              {{ category.sortOrder }}</span
            >
          </div>
          <div class="ui-actions">
            <UiButton
              :id="`reorder-up-${category.id}`"
              variant="quiet"
              :disabled="disabled || readOnly || index === 0"
              :aria-label="`Выше: ${category.name}, позиция ${index + 1}`"
              @activate="move(category.id, -1)"
              >Выше</UiButton
            >
            <UiButton
              :id="`reorder-down-${category.id}`"
              variant="quiet"
              :disabled="
                disabled || readOnly || index === categories.length - 1
              "
              :aria-label="`Ниже: ${category.name}, позиция ${index + 1}`"
              @activate="move(category.id, 1)"
              >Ниже</UiButton
            >
          </div>
        </div>
      </li>
    </ol>
    <p v-if="announcement" role="status" aria-atomic="true">
      {{ announcement }}
    </p>
    <div v-if="!readOnly || attempting" class="ui-actions">
      <UiButton
        :disabled="disabled || readOnly || !dirty"
        :loading="busy"
        @activate="emit('save')"
        >Сохранить порядок</UiButton
      >
      <UiButton
        variant="secondary"
        :disabled="disabled || readOnly"
        @activate="emit('cancel')"
        >Отменить</UiButton
      >
    </div>
  </section>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from "vue";
import UiButton from "../../shared/ui/UiButton/UiButton.vue";
import type {
  CategoryReorderProps,
  CategoryReorderEmits,
} from "./CategoryReorder.types";

const props = defineProps<CategoryReorderProps>();
const emit = defineEmits<CategoryReorderEmits>();
const announcement = ref("");

watch(
  () => props.readOnly,
  (readOnly) => {
    if (readOnly && document.activeElement?.closest(".category-reorder"))
      document.getElementById("category-reorder-heading")?.focus();
  },
  { flush: "sync" },
);

async function move(id: string, direction: -1 | 1) {
  emit("move", id, direction);
  await nextTick();
  const index = props.categories.findIndex((category) => category.id === id);
  const category = props.categories[index];

  if (category === undefined) return;

  announcement.value = `${category.name}: позиция ${index + 1} из ${props.categories.length}`;
  const button = document.getElementById(
    `reorder-${direction === -1 ? "up" : "down"}-${id}`,
  );

  (button?.matches(":disabled")
    ? document.getElementById(`reorder-${id}`)
    : button
  )?.focus();
}
</script>

<style scoped>
.category-reorder {
  display: grid;
  gap: var(--space-xl);
  min-inline-size: 0;
  overflow-wrap: anywhere;
}
.category-reorder__list {
  padding-inline-start: var(--space-xl);
  margin: 0;
}
.category-reorder__list li {
  padding-block: var(--space-lg);
}
.category-reorder__list li + li {
  border-block-start: var(--border-width) solid var(--color-border);
}
.category-reorder__row {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-md);
}
.category-reorder__identity {
  display: grid;
  gap: var(--space-sm);
  min-inline-size: 0;
  flex: 1;
  font-weight: var(--weight-label);
}
.category-reorder__metadata {
  font-size: var(--font-data);
  font-weight: var(--weight-body);
  color: var(--color-foreground-muted);
}
</style>

<template>
  <div class="operations-tabs" role="group" :aria-label="props.label">
    <button
      v-for="option in props.options"
      :key="option.id"
      class="operations-tabs__item"
      type="button"
      :aria-pressed="option.id === props.modelValue"
      @click="emit('update:modelValue', option.id)"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
import type {
  OperationsTabsEmits,
  OperationsTabsProps,
} from "./OperationsTabs.types";
import "./operations.tokens.css";

const props = defineProps<OperationsTabsProps>();
const emit = defineEmits<OperationsTabsEmits>();
</script>

<style scoped>
/* Интервалы этой полосы общие для фильтров заказов и пользователей;
   tokens для их плотности нет. Узкая полоса прокручивается без сжатия кнопок. */
.operations-tabs {
  display: flex;
  gap: 8px;
  padding-block: 12px;
  overflow-x: auto;
  background: var(--color-surface);
}
/* Отступы и типографика сохраняют размер исходной кнопки фильтра.
   Тема задаёт цвета и pill-радиус, но не эти локальные размеры. */
.operations-tabs__item {
  flex-shrink: 0;
  padding: 8px 16px;
  border: 0;
  border-radius: var(--operations-radius-pill);
  background: var(--color-background);
  color: var(--color-foreground-muted);
  font-family: Inter, sans-serif;
  font-size: 13px;
  font-weight: 500;
  line-height: 19.5px;
  white-space: nowrap;
  cursor: pointer;
}
.operations-tabs__item[aria-pressed="true"] {
  background: var(--color-primary);
  color: var(--color-on-primary);
}
</style>

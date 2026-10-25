<template>
  <div class="operations-empty">
    <img class="operations-empty__icon" :src="EMPTY_STATE_ICON" alt="" />
    <h2 class="operations-empty__title">{{ props.title }}</h2>
    <p class="operations-empty__description">{{ props.description }}</p>
  </div>
</template>

<script setup lang="ts">
import { EMPTY_STATE_ICON } from "./OperationsEmptyState.constants";
import type { OperationsEmptyStateProps } from "./OperationsEmptyState.types";

const props = defineProps<OperationsEmptyStateProps>();
</script>

<style scoped>
/* Свободное место вокруг сообщения и короткий интервал между строками
   сохраняют композицию пустого состояния; соответствующих tokens нет. */
.operations-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  width: 100%;
  padding: 48px 24px;
  font-family: Inter, sans-serif;
  text-align: center;
}
.operations-empty__icon {
  flex-shrink: 0;
  display: block;
}
/* Заголовок и описание имеют собственную иерархию пустого состояния;
   типографических tokens нет, цвета продолжают задаваться темой. */
.operations-empty__title {
  margin: 0;
  color: var(--color-foreground);
  font-size: 18px;
  font-weight: 600;
  line-height: 28px;
}
.operations-empty__description {
  width: 100%;
  margin: 0;
  color: var(--color-foreground-muted);
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
}
</style>

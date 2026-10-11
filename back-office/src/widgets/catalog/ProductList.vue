<template>
  <ul class="product-list">
    <li v-for="(row, index) in rows" :key="row.id">
      <button
        :id="`product-${row.id}`"
        type="button"
        class="product-list__row"
        :class="{ 'product-list__row--selected': row.id === selectedId }"
        :disabled="disabled"
        :aria-pressed="row.id === selectedId"
        :aria-label="`${row.name}, ${row.category}, порядок ${row.sortOrder}, запись ${index + 1}`"
        @click="emit('select', row.id)"
      >
        <span class="product-list__name">{{ row.name }}</span>
        <span>{{ row.category }}</span>
        <span class="product-list__metadata"
          >{{ row.pricing }} · {{ row.isActive ? "Активен" : "Неактивен" }} ·
          Порядок {{ row.sortOrder }}</span
        >
      </button>
    </li>
  </ul>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { ProductListProps, ProductListEmits } from "./ProductList.types";

const props = defineProps<ProductListProps>();
const emit = defineEmits<ProductListEmits>();
const rows = computed(() =>
  props.products.map((product) => ({
    ...product,
    category: props.categories.find(
      (category) => category.id === product.categoryId,
    )?.name,
    pricing:
      product.price === null
        ? product.priceChoices.length === 0
          ? "Цена не задана"
          : `Ценовых опций: ${product.priceChoices.length}`
        : `${product.price} ₽`,
  })),
);
</script>

<style scoped>
.product-list {
  list-style: none;
  padding: 0;
  margin: 0;
  min-inline-size: 0;
}
.product-list li + li {
  border-block-start: var(--border-width) solid var(--color-border);
}
.product-list__row {
  display: grid;
  gap: var(--space-sm);
  text-align: start;
  inline-size: 100%;
  min-block-size: var(--control-height);
  padding: var(--space-lg);
  color: var(--color-foreground);
  background: transparent;
  border: 0;
  border-radius: var(--field-radius);
  overflow-wrap: anywhere;
}
.product-list__row--selected {
  background: var(--color-selected);
  color: var(--color-on-selected);
}
.product-list__row:disabled {
  cursor: default;
}
.product-list__name {
  font-weight: var(--weight-label);
}
.product-list__metadata {
  color: var(--color-foreground-muted);
  font-size: var(--font-data);
}
</style>

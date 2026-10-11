<template>
  <section class="product-reorder">
    <h2
      id="product-reorder-heading"
      class="foundation-section-title"
      tabindex="-1"
    >
      Порядок товаров: {{ categoryName }}
    </h2>
    <p v-if="dirty">Порядок не сохранён</p>
    <ol>
      <li
        v-for="(product, index) in products"
        :id="`product-reorder-${product.id}`"
        :key="product.id"
        tabindex="-1"
      >
        <div class="product-reorder__row">
          <div>
            <span>{{ product.name }}</span>
            <p class="product-reorder__metadata">
              {{ product.isActive ? "Активен" : "Неактивен" }} · Порядок
              {{ product.sortOrder }}
            </p>
          </div>
          <div class="ui-actions">
            <UiButton
              :id="`product-reorder-up-${product.id}`"
              variant="quiet"
              :disabled="disabled || readOnly || index === 0"
              :aria-label="`Выше: ${product.name}, позиция ${index + 1}`"
              @activate="move(product.id, -1)"
              >Выше</UiButton
            >
            <UiButton
              :id="`product-reorder-down-${product.id}`"
              variant="quiet"
              :disabled="disabled || readOnly || index === products.length - 1"
              :aria-label="`Ниже: ${product.name}, позиция ${index + 1}`"
              @activate="move(product.id, 1)"
              >Ниже</UiButton
            >
          </div>
        </div>
      </li>
    </ol>
    <p v-if="announcement" role="status" aria-atomic="true">
      {{ announcement }}
    </p>
    <div v-if="showActions" class="ui-actions">
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
import { computed, nextTick, ref, watch } from "vue";
import UiButton from "../../shared/ui/UiButton/UiButton.vue";
import type {
  ProductReorderProps,
  ProductReorderEmits,
} from "./ProductReorder.types";

const props = defineProps<ProductReorderProps>();
const emit = defineEmits<ProductReorderEmits>();
const announcement = ref("");
const showActions = computed(() => !props.readOnly || props.attempting);

watch(
  () => props.readOnly,
  (readOnly) => {
    if (readOnly && document.activeElement?.closest(".product-reorder"))
      document.getElementById("product-reorder-heading")?.focus();
  },
  { flush: "sync" },
);

async function move(id: string, direction: -1 | 1) {
  emit("move", id, direction);
  await nextTick();
  const index = props.products.findIndex((product) => product.id === id);
  const product = props.products[index];

  if (product === undefined) return;

  announcement.value = `${product.name}: позиция ${index + 1} из ${props.products.length}`;
  const button = document.getElementById(
    `product-reorder-${direction === -1 ? "up" : "down"}-${id}`,
  );

  (button?.matches(":disabled")
    ? document.getElementById(`product-reorder-${id}`)
    : button
  )?.focus();
}
</script>

<style scoped>
.product-reorder {
  display: grid;
  gap: var(--space-xl);
  min-inline-size: 0;
  overflow-wrap: anywhere;
}
.product-reorder ol {
  margin: 0;
  padding-inline-start: var(--space-xl);
}
.product-reorder li {
  padding-block: var(--space-lg);
}
.product-reorder li + li {
  border-block-start: var(--border-width) solid var(--color-border);
}
.product-reorder__row {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-md);
}
.product-reorder__row > :first-child {
  min-inline-size: 0;
  flex: 1;
  font-weight: var(--weight-label);
}
.product-reorder__metadata {
  font-weight: var(--weight-body);
  font-size: var(--font-data);
  color: var(--color-foreground-muted);
}
</style>

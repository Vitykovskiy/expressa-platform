<template>
  <section class="order-list" aria-labelledby="order-list-heading">
    <h2 id="order-list-heading" class="order-list__heading" tabindex="-1">
      {{ heading }}
    </h2>
    <div v-if="error" class="order-list__feedback" aria-live="polite">
      <p class="order-list__error">{{ error }}</p>
      <p v-if="updatedAt">Подтверждено {{ formatOrderDate(updatedAt) }}</p>
      <UiButton
        variant="secondary"
        :disabled="loading"
        @activate="emit('retry')"
        >Повторить</UiButton
      >
    </div>
    <p v-if="initialLoading" role="status" class="order-list__state">
      Загружаем заказы
    </p>
    <template v-else-if="empty">
      <p class="order-list__state">{{ emptyLabel }}</p>
      <UiButton v-if="filtered" variant="quiet" @activate="emit('reset')"
        >Сбросить фильтры</UiButton
      >
    </template>
    <ul v-if="orders !== null" class="order-list__rows">
      <li v-for="order in orders" :key="order.id">
        <button
          :id="`order-row-${order.id}`"
          type="button"
          class="order-list__row"
          :class="{ 'order-list__row--selected': order.id === selectedId }"
          :aria-current="order.id === selectedId ? 'true' : undefined"
          @click="emit('select', order.id)"
        >
          <strong class="order-list__number">{{ order.number }}</strong>
          <span class="order-list__stage">{{ stageLabels[order.stage] }}</span>
          <time class="order-list__time" :datetime="order.createdAt">{{
            formatOrderDate(order.createdAt)
          }}</time>
          <span class="order-list__total">{{ formatRubles(order.total) }}</span>
        </button>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import UiButton from "../../shared/ui/UiButton/UiButton.vue";
import { stageLabels } from "../../entities/order/order.constants";
import {
  formatOrderDate,
  formatRubles,
} from "../../entities/order/order.format";
import type { OrderListEmits, OrderListProps } from "./OrderList.types";

const props = defineProps<OrderListProps>();
const emit = defineEmits<OrderListEmits>();
const heading = computed(() =>
  props.orders === null ? "Очередь заказов" : `Найдено ${props.orders.length}`,
);
const initialLoading = computed(() => props.orders === null && props.loading);
const empty = computed(
  () => props.orders !== null && props.orders.length === 0,
);
const emptyLabel = computed(() =>
  props.filtered ? "Заказы не найдены" : "Заказов пока нет",
);
</script>

<style scoped>
.order-list {
  min-inline-size: 0;
}
.order-list__heading {
  font-size: var(--font-section-title);
  line-height: var(--line-section-title);
  padding-block: var(--space-sm);
}
.order-list__rows {
  list-style: none;
  padding: 0;
  margin: 0;
}
.order-list__row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  inline-size: 100%;
  gap: var(--space-sm) var(--space-lg);
  min-block-size: var(--control-height);
  padding: var(--space-lg) var(--space-md);
  border-block-end: var(--border-width) solid var(--color-border);
  text-align: start;
  color: var(--color-foreground);
  background: transparent;
  font-size: var(--font-data);
  line-height: var(--line-data);
  overflow-wrap: anywhere;
  cursor: pointer;
}
.order-list__row:hover {
  background: var(--color-surface-muted);
}
.order-list__row:active {
  background: var(--color-selected);
}
.order-list__row--selected {
  background: var(--color-selected);
  color: var(--color-on-selected);
}
.order-list__stage {
  justify-self: end;
  border: var(--border-width) solid var(--color-border);
  border-radius: var(--radius-badge);
  padding-inline: var(--space-sm);
}
.order-list__number {
  font-size: var(--font-body);
}
.order-list__time {
  color: var(--color-foreground-muted);
  font-variant-numeric: tabular-nums;
}
.order-list__total {
  text-align: end;
  font-variant-numeric: tabular-nums;
}
.order-list__feedback {
  display: grid;
  justify-items: start;
  gap: var(--space-sm);
  font-size: var(--font-data);
  margin-block: var(--space-lg);
}
.order-list__error {
  color: var(--color-danger);
}
.order-list__state {
  padding-block: var(--space-xl);
}
</style>

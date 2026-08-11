<template>
  <section
    class="orders-history"
    aria-labelledby="orders-history-title"
    :aria-busy="refreshing"
  >
    <header class="orders-history__header">
      <div>
        <p class="orders-history__eyebrow">{{ orders.length }} заказов</p>
        <h1 id="orders-history-title" class="orders-history__title">История</h1>
      </div>
      <ui-icon-btn
        class="orders-history__refresh"
        :loading="refreshing"
        aria-label="Обновить историю заказов"
        type="button"
        @click="emit('refresh')"
      >
        <template #loader>
          <v-progress-circular
            aria-label="Обновление истории заказов"
            indeterminate
          />
        </template>
        <RefreshCw aria-hidden="true" />
      </ui-icon-btn>
    </header>

    <p v-if="orders.length === 0" class="orders-history__empty" role="status">
      История заказов пуста
    </p>

    <ul v-else class="orders-history__list" aria-label="История заказов">
      <li v-for="order in orders" :key="order.id">
        <OrderCard
          :order="order"
          :status-label="statusLabels[order.status]"
          :expanded="isExpanded(order.id)"
          @toggle="toggleOrder(order.id)"
        />
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { shallowRef, watch } from "vue";
import { RefreshCw } from "lucide-vue-next";
import UiIconBtn from "@/shared/ui/customer/icon-btn/UiIconBtn.vue";
import OrderCard from "./OrderCard.vue";
import type {
  OrdersHistoryScreenEmits,
  OrdersHistoryScreenProps,
} from "./OrdersHistoryScreen.types";

const props = withDefaults(defineProps<OrdersHistoryScreenProps>(), {
  refreshing: false,
  expandedOrderIds: () => [],
});
const emit = defineEmits<OrdersHistoryScreenEmits>();
const expandedOrderIds = shallowRef([...props.expandedOrderIds]);

watch(
  () => props.expandedOrderIds,
  (orderIds) => {
    expandedOrderIds.value = [...orderIds];
  },
);

function isExpanded(orderId: string): boolean {
  return expandedOrderIds.value.includes(orderId);
}

function toggleOrder(orderId: string): void {
  const expanded = !isExpanded(orderId);
  expandedOrderIds.value = expanded
    ? [...expandedOrderIds.value, orderId]
    : expandedOrderIds.value.filter((id) => id !== orderId);
  emit("toggleOrder", orderId, expanded);
}
</script>

<style scoped lang="scss">
.orders-history {
  display: flex;
  flex: 1;
  flex-direction: column;
  width: 100%;
  min-height: 100%;
  padding-bottom: var(--customer-space-13);
  color: var(--customer-text);
  background: var(--customer-background);
}

.orders-history__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: var(--customer-space-13) var(--customer-space-9)
    var(--customer-space-15);
}

.orders-history__eyebrow {
  margin: 0 0 var(--customer-space-4);
  color: var(--customer-text-subtle-on-brand);
  font-size: var(--customer-font-size-xs);
  font-weight: var(--customer-font-weight-bold);
  letter-spacing: var(--customer-letter-spacing-overline);
  text-transform: uppercase;
}

.orders-history__title {
  margin: 0;
  font-size: var(--customer-font-size-display);
  font-weight: var(--customer-font-weight-black);
  letter-spacing: var(--customer-letter-spacing-tight);
  line-height: var(--customer-line-height-tight);
}

.orders-history__refresh {
  color: var(--customer-text);
  background: var(--customer-surface-subtle);
}

.orders-history__empty {
  display: grid;
  flex: 1;
  place-items: center;
  margin: 0;
  padding: var(--customer-space-18) var(--customer-space-9);
  color: var(--customer-text-subtle-on-brand);
  font-weight: var(--customer-font-weight-bold);
  text-align: center;
}

.orders-history__list {
  display: grid;
  gap: var(--customer-space-6);
  margin: 0;
  padding: 0 var(--customer-space-9);
  list-style: none;
}

@media (min-width: 768px) {
  .orders-history__header {
    width: 100%;
    padding-right: max(
      var(--customer-space-16),
      calc(
        (100% - var(--customer-size-content-detail)) / 2 +
          var(--customer-space-16)
      )
    );
    padding-left: max(
      var(--customer-space-16),
      calc(
        (100% - var(--customer-size-content-detail)) / 2 +
          var(--customer-space-16)
      )
    );
  }

  .orders-history__list {
    width: 100%;
    max-width: var(--customer-size-content-detail);
    margin: 0 auto;
    padding: var(--customer-space-13) var(--customer-space-16)
      var(--customer-space-15);
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1024px) {
  .orders-history__list {
    max-width: none;
    margin: 0;
  }

  .orders-history__header {
    padding: var(--customer-space-13) var(--customer-space-16)
      var(--customer-space-15);
  }

  .orders-history__list {
    padding: 0 var(--customer-space-16);
  }
}
</style>

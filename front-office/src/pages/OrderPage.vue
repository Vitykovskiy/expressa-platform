<template>
  <section class="order-page" aria-labelledby="order-title">
    <template v-if="order">
      <header class="order-page__header">
        <p class="order-page__stage">{{ stageLabel }}</p>
        <h1 id="order-title">Заказ №{{ order.number }}</h1>
      </header>

      <ul class="order-page__items" aria-label="Состав заказа">
        <li v-for="item in order.items" :key="itemKey(item)">
          <div class="order-page__item-heading">
            <strong>{{ item.productName }}</strong>
            <span
              >{{ item.quantity }} ×
              {{ formatMinor(item.unitTotalMinor) }}</span
            >
          </div>
          <p v-if="item.size" class="order-page__configuration">
            Размер {{ item.size }}
          </p>
          <p
            v-for="modifier in item.modifiers"
            :key="modifier.modifierOptionId"
            class="order-page__configuration"
          >
            + {{ modifier.modifierName }}
          </p>
          <strong class="order-page__line-total">
            {{ formatMinor(item.lineTotalMinor) }}
          </strong>
        </li>
      </ul>

      <p class="order-page__total">
        <span>Итого</span><strong>{{ formatMinor(order.totalMinor) }}</strong>
      </p>
    </template>

    <div v-else class="order-page__empty" role="status">
      <h1 id="order-title">Заказ</h1>
      <p>{{ orderPageMessages.unavailable }}</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";

import { useCheckoutStore } from "../customer/pages/checkout/checkout.store";
import { formatMinorAmount } from "../customer/shared/model/money";
import { orderPageMessages, orderPageStageLabels } from "./OrderPage.constants";
import type { OrderPageItem, OrderPageOrder } from "./OrderPage.types";

const route = useRoute();
const checkoutStore = useCheckoutStore();
const order = computed<OrderPageOrder | null>(() => {
  const currentOrder = checkoutStore.order;

  return currentOrder?.id === route.params.id ? currentOrder : null;
});
const stageLabel = computed(() =>
  order.value === null ? "" : orderPageStageLabels[order.value.stage],
);

function formatMinor(value: number): string {
  return formatMinorAmount(value);
}

function itemKey(item: OrderPageItem): string {
  return [
    item.productId,
    item.variantId ?? "other",
    ...item.modifiers.map((modifier) => modifier.modifierOptionId),
  ].join(":");
}
</script>

<style scoped>
.order-page {
  display: grid;
  gap: var(--customer-space-9);
  max-width: 48rem;
  margin: 0 auto;
  padding: var(--customer-space-9);
}
.order-page__header h1,
.order-page__configuration,
.order-page__total,
.order-page__empty p {
  margin: 0;
}
.order-page__stage {
  margin: 0 0 var(--customer-space-3);
  color: var(--customer-success);
  font-weight: var(--customer-font-weight-bold);
}
.order-page__items {
  display: grid;
  gap: var(--customer-space-5);
  padding: 0;
  margin: 0;
  list-style: none;
}
.order-page__items li {
  display: grid;
  min-width: 0;
  gap: var(--customer-space-3);
  padding: var(--customer-space-7);
  color: var(--customer-text-on-surface);
  background: var(--customer-surface);
  border-radius: var(--customer-radius);
}
.order-page__item-heading,
.order-page__total {
  display: flex;
  gap: var(--customer-space-5);
  justify-content: space-between;
}
.order-page__item-heading > strong {
  min-width: 0;
  overflow-wrap: anywhere;
}
.order-page__item-heading > span {
  flex: 0 0 auto;
}
.order-page__configuration {
  color: var(--customer-text-secondary-on-surface);
  overflow-wrap: anywhere;
}
.order-page__line-total {
  justify-self: end;
}
.order-page__total {
  padding-top: var(--customer-space-7);
  border-top: 1px solid var(--customer-border);
  font-size: var(--customer-font-size-xl);
}
</style>

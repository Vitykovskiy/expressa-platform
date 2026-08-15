<template>
  <OrdersHistoryScreen
    v-bind="screenProps"
    @load-more="loadMore"
    @retry="reload"
  />
</template>

<script setup lang="ts">
import { computed, inject, onMounted, ref } from "vue";

import { useSessionStore } from "@/app/session.store";
import OrdersHistoryScreen from "@/features/orders/OrdersHistoryScreen.vue";
import type { OrdersHistoryScreenProps } from "@/features/orders/OrdersHistoryScreen.types";
import { apiClientKey } from "@/shared/api/client";
import { createOrdersApi, type CustomerOrder } from "@/shared/api/orders.api";

const apiClient = inject(apiClientKey);
const sessionStore = useSessionStore();
const orders = ref<CustomerOrder[]>([]);
const nextCursor = ref<string | null>(null);
const loading = ref(false);
const errorMessage = ref<string | null>(null);
const screenProps = computed<OrdersHistoryScreenProps>(() => ({
  errorMessage: errorMessage.value,
  hasMore: nextCursor.value !== null,
  loading: loading.value,
  orders: orders.value,
}));

onMounted(() => void reload());
async function reload(): Promise<void> {
  orders.value = [];
  nextCursor.value = null;
  await loadPage();
}
async function loadMore(): Promise<void> {
  await loadPage(nextCursor.value ?? undefined);
}
async function loadPage(cursor?: string): Promise<void> {
  if (
    loading.value ||
    apiClient === undefined ||
    sessionStore.accessToken === null
  )
    return;
  loading.value = true;
  errorMessage.value = null;
  try {
    const page = await createOrdersApi(apiClient).listOrders(
      sessionStore.accessToken,
      cursor,
    );
    const knownIds = new Set(orders.value.map((order) => order.id));
    orders.value = [
      ...orders.value,
      ...page.orders.filter((order) => !knownIds.has(order.id)),
    ];
    nextCursor.value = page.nextCursor;
  } catch (error) {
    errorMessage.value =
      error instanceof Error
        ? error.message
        : "Не удалось загрузить историю заказов.";
  } finally {
    loading.value = false;
  }
}
</script>

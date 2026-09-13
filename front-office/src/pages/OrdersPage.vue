<template>
  <OrdersHistoryScreen
    v-bind="screenProps"
    @load-more="loadMore"
    @repeat="repeatOrder"
    @retry="retry"
    @sign-out="logout"
  />
</template>

<script setup lang="ts">
import { computed, inject, onMounted, onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";

import { useSessionStore } from "@/app/session.store";
import OrdersHistoryScreen from "@/features/orders/OrdersHistoryScreen.vue";
import type { OrdersHistoryScreenProps } from "@/features/orders/OrdersHistoryScreen.types";
import { apiClientKey } from "@/shared/api/client";
import { createOrdersApi, type CustomerOrder } from "@/shared/api/orders.api";

const apiClient = inject(apiClientKey);
const router = useRouter();
const sessionStore = useSessionStore();
const orders = ref<CustomerOrder[]>([]);
const nextCursor = ref<string | null>(null);
const loading = ref(false);
const errorMessage = ref<string | null>(null);
const staleMessage = ref<string | null>(null);
const activeRefreshPending = ref(false);
let pollingTimer: ReturnType<typeof setInterval> | null = null;
let isMounted = false;
let protectedReadOwner = 0;
const screenProps = computed<OrdersHistoryScreenProps>(() => ({
  errorMessage: errorMessage.value,
  hasMore: nextCursor.value !== null,
  loading: loading.value,
  orders: orders.value,
  staleMessage: staleMessage.value,
}));

onMounted(() => {
  isMounted = true;
  document.addEventListener("visibilitychange", syncPolling);
  void reload();
});
onUnmounted(() => {
  isMounted = false;
  protectedReadOwner += 1;
  document.removeEventListener("visibilitychange", syncPolling);
  stopPolling();
});
async function reload(): Promise<void> {
  orders.value = [];
  nextCursor.value = null;
  await loadPage();
}
async function retry(): Promise<void> {
  if (!hasAuthenticatedSession()) {
    await sessionStore.bootstrap();
    if (!hasAuthenticatedSession()) return;
  }
  if (staleMessage.value !== null) {
    await refreshActiveOrders();
    return;
  }
  await reload();
}
function hasAuthenticatedSession(): boolean {
  return sessionStore.status === "authenticated";
}
async function loadMore(): Promise<void> {
  await loadPage(nextCursor.value ?? undefined);
}
async function repeatOrder(orderId: string): Promise<void> {
  await router.push({ path: `/orders/${orderId}`, query: { repeat: "1" } });
}
async function logout(): Promise<void> {
  await sessionStore.logout();
  await router.replace("/");
}
async function loadPage(cursor?: string): Promise<void> {
  if (
    loading.value ||
    apiClient === undefined ||
    sessionStore.accessToken === null
  )
    return;
  loading.value = true;
  const owner = ++protectedReadOwner;
  errorMessage.value = null;
  try {
    const page = await sessionStore.readProtected(
      (accessToken) =>
        createOrdersApi(apiClient).listOrders(accessToken, cursor),
      () => ownsProtectedRead(owner),
      clearOrdersForSessionBoundary,
    );
    if (!ownsProtectedRead(owner)) return;
    const knownIds = new Set(orders.value.map((order) => order.id));
    orders.value = [
      ...orders.value,
      ...page.orders.filter((order) => !knownIds.has(order.id)),
    ];
    nextCursor.value = page.nextCursor;
    staleMessage.value = null;
  } catch {
    if (sessionStore.status !== "authenticated")
      clearOrdersForSessionBoundary();
    errorMessage.value = "Не удалось загрузить историю заказов.";
  } finally {
    loading.value = false;
    syncPolling();
  }
}
function hasActiveOrders(): boolean {
  return orders.value.some((order) => order.stage !== "ISSUED");
}
function syncPolling(): void {
  if (document.hidden || !hasActiveOrders()) return stopPolling();
  if (pollingTimer === null)
    pollingTimer = setInterval(() => void refreshActiveOrders(), 10_000);
}
function stopPolling(): void {
  if (pollingTimer !== null) clearInterval(pollingTimer);
  pollingTimer = null;
}
function clearOrdersForSessionBoundary(): void {
  stopPolling();
  orders.value = [];
  nextCursor.value = null;
  staleMessage.value = null;
}
function ownsProtectedRead(owner: number): boolean {
  return isMounted && protectedReadOwner === owner;
}
async function refreshActiveOrders(): Promise<void> {
  if (
    activeRefreshPending.value ||
    apiClient === undefined ||
    sessionStore.accessToken === null ||
    document.hidden ||
    !hasActiveOrders()
  )
    return;
  activeRefreshPending.value = true;
  const owner = ++protectedReadOwner;
  let refreshFailed = false;
  try {
    const api = createOrdersApi(apiClient);
    const activeOrders = orders.value.filter(
      (order) => order.stage !== "ISSUED",
    );
    const refreshed = await Promise.all(
      activeOrders.map((order) =>
        sessionStore.readProtected(
          (accessToken) => api.getOrder(accessToken, order.id),
          () => ownsProtectedRead(owner),
          clearOrdersForSessionBoundary,
        ),
      ),
    );
    if (!ownsProtectedRead(owner)) return;
    const byId = new Map(refreshed.map((order) => [order.id, order]));
    orders.value = orders.value.map((order) => byId.get(order.id) ?? order);
    staleMessage.value = null;
  } catch {
    if (sessionStore.status !== "authenticated") {
      clearOrdersForSessionBoundary();
      return;
    }
    refreshFailed = true;
    staleMessage.value =
      "Не удалось обновить статус заказа. Показаны последние доступные данные.";
    stopPolling();
  } finally {
    activeRefreshPending.value = false;
    if (!refreshFailed) syncPolling();
  }
}
</script>

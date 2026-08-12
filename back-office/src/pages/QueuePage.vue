<template>
  <OrdersScreen
    :action-error="actionError"
    :details="details"
    :details-loading="detailsLoading"
    :error="queueError"
    :orders="orders"
    :search="search"
    :selected-order-id="selectedOrderId"
    :stage="stage"
    :status="queueStatus"
    :transition-loading="transitionLoading"
    @open="toggleDetails"
    @refresh="loadQueue"
    @transition="transitionSelectedOrder"
    @update:search="search = $event"
    @update:stage="stage = $event"
  />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, shallowRef, watch } from "vue";

import { useSessionStore } from "../app/session.store";
import OrdersScreen from "./admin/orders/OrdersScreen.vue";
import { createApiClient } from "../shared/api/client";
import { OrdersApi } from "../shared/api/orders.api";
import type {
  OrderApiError,
  OrderDetails,
  OrderListItem,
} from "../shared/api/orders.api.types";
import type { QueueFilter } from "./admin/orders/OrdersScreen.types";

const ordersApi = new OrdersApi(createApiClient("/"));
const sessionStore = useSessionStore();
const orders = shallowRef<readonly OrderListItem[]>([]);
const search = shallowRef("");
const stage = shallowRef<QueueFilter>("ALL");
const queueStatus = shallowRef<"error" | "loading" | "ready">("loading");
const queueError = shallowRef<OrderApiError | null>(null);
const selectedOrderId = shallowRef<string | null>(null);
const details = shallowRef<OrderDetails | null>(null);
const detailsLoading = shallowRef(false);
const transitionLoading = shallowRef(false);
const actionError = shallowRef<OrderApiError | null>(null);
let queueRequest = 0;
let detailsRequest = 0;
let pollingTimer: ReturnType<typeof setInterval> | null = null;

watch([search, stage], () => void loadQueue());

onMounted(() => {
  void loadQueue();
  pollingTimer = setInterval(() => void loadQueue(), 5000);
});

onBeforeUnmount(() => {
  if (pollingTimer !== null) clearInterval(pollingTimer);
});

async function loadQueue(): Promise<void> {
  const request = ++queueRequest;
  const accessToken = sessionStore.accessToken;
  if (accessToken === null) {
    setQueueError(request, unauthorizedError());
    return;
  }

  queueStatus.value = "loading";
  queueError.value = null;
  try {
    const nextOrders = await ordersApi.list(accessToken, {
      number: search.value,
      stage: stage.value === "ALL" ? null : stage.value,
    });
    if (request !== queueRequest) return;
    orders.value = nextOrders;
    queueStatus.value = "ready";
    if (selectedOrderId.value !== null) void loadDetails(selectedOrderId.value);
  } catch (error) {
    setQueueError(request, toOrderApiError(error));
  }
}

async function toggleDetails(orderId: string): Promise<void> {
  if (selectedOrderId.value === orderId) {
    selectedOrderId.value = null;
    details.value = null;
    return;
  }

  selectedOrderId.value = orderId;
  await loadDetails(orderId);
}

async function loadDetails(orderId: string): Promise<void> {
  const request = ++detailsRequest;
  const accessToken = sessionStore.accessToken;
  details.value = null;
  detailsLoading.value = true;
  actionError.value = null;
  if (accessToken === null) {
    detailsLoading.value = false;
    actionError.value = unauthorizedError();
    return;
  }

  try {
    const nextDetails = await ordersApi.details(accessToken, orderId);
    if (request !== detailsRequest || selectedOrderId.value !== orderId) return;
    details.value = nextDetails;
  } catch (error) {
    if (request === detailsRequest && selectedOrderId.value === orderId) {
      actionError.value = toOrderApiError(error);
    }
  } finally {
    if (request === detailsRequest && selectedOrderId.value === orderId) {
      detailsLoading.value = false;
    }
  }
}

async function transitionSelectedOrder(): Promise<void> {
  const accessToken = sessionStore.accessToken;
  const currentDetails = details.value;
  if (
    accessToken === null ||
    currentDetails === null ||
    transitionLoading.value
  )
    return;

  transitionLoading.value = true;
  actionError.value = null;
  try {
    const nextDetails = await ordersApi.transition(accessToken, currentDetails);
    if (selectedOrderId.value !== currentDetails.id) return;
    details.value = nextDetails;
    orders.value = orders.value.map((order) =>
      order.id === nextDetails.id
        ? { ...order, stage: nextDetails.stage }
        : order,
    );
  } catch (error) {
    if (
      selectedOrderId.value === currentDetails.id &&
      details.value?.id === currentDetails.id
    ) {
      actionError.value = toOrderApiError(error);
    }
  } finally {
    transitionLoading.value = false;
  }
}

function setQueueError(request: number, error: OrderApiError): void {
  if (request !== queueRequest) return;
  orders.value = [];
  queueError.value = error;
  queueStatus.value = "error";
}

function toOrderApiError(error: unknown): OrderApiError {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "message" in error &&
    "requestId" in error &&
    typeof error.code === "string" &&
    typeof error.message === "string" &&
    (typeof error.requestId === "string" || error.requestId === null)
  ) {
    return {
      code: error.code,
      details: "details" in error ? error.details : null,
      message: error.message,
      requestId: error.requestId,
    };
  }

  return {
    code: "API_CONTRACT_ERROR",
    details: null,
    message: "Сервис заказов вернул некорректный ответ.",
    requestId: null,
  };
}

function unauthorizedError(): OrderApiError {
  return {
    code: "UNAUTHORIZED",
    details: null,
    message: "Сессия сотрудника недоступна.",
    requestId: null,
  };
}
</script>

<template>
  <OrdersScreen
    :action-error="actionError"
    :access-recovery-pending="accessRecoveryPending"
    :requires-access-recovery="authorizationEpisode"
    :details="details"
    :details-error="detailsError"
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
    @restore-access="restoreAccess"
    @transition="transitionSelectedOrder"
    @update:search="search = $event"
    @update:stage="stage = $event"
  />
</template>

<script setup lang="ts">
import { inject, onBeforeUnmount, onMounted, shallowRef, watch } from "vue";
import { useRouter } from "vue-router";

import { routePaths } from "../app/router.constants";
import { useSessionStore } from "../app/session.store";
import OrdersScreen from "./admin/orders/OrdersScreen.vue";
import { apiClientKey } from "../shared/api/client";
import { ApiError } from "../shared/api/client";
import { OrdersApi } from "../shared/api/orders.api";
import type {
  OrderApiError,
  OrderDetails,
  OrderListItem,
} from "../shared/api/orders.api.types";
import type { QueueFilter } from "./admin/orders/OrdersScreen.types";

const apiClient = inject(apiClientKey);
if (apiClient === undefined) {
  throw new Error("QueuePage requires an ApiClient provider.");
}
const ordersApi = new OrdersApi(apiClient);
const sessionStore = useSessionStore();
const router = useRouter();
const orders = shallowRef<readonly OrderListItem[]>([]);
const search = shallowRef("");
const stage = shallowRef<QueueFilter>("ALL");
const queueStatus = shallowRef<"error" | "loading" | "ready">("loading");
const queueError = shallowRef<OrderApiError | null>(null);
const accessRecoveryPending = shallowRef(false);
const selectedOrderId = shallowRef<string | null>(null);
const details = shallowRef<OrderDetails | null>(null);
const detailsError = shallowRef<OrderApiError | null>(null);
const detailsLoading = shallowRef(false);
const transitionLoading = shallowRef(false);
const actionError = shallowRef<OrderApiError | null>(null);
let queueRequest = 0;
let detailsRequest = 0;
let pollingTimer: ReturnType<typeof setInterval> | null = null;
let resumedPollingTimer: ReturnType<typeof setTimeout> | null = null;
let authorizationEpisode = false;
let pageIsActive = true;

watch([search, stage], () => void loadQueue());

onMounted(() => {
  void loadQueue();
  startPolling();
});

onBeforeUnmount(() => {
  pageIsActive = false;
  queueRequest++;
  detailsRequest++;
  stopPolling();
});

async function loadQueue(): Promise<void> {
  if (authorizationEpisode) return;

  const request = ++queueRequest;
  const accessToken = sessionStore.accessToken;
  if (accessToken === null) {
    setQueueError(request, unauthorizedError());
    return;
  }

  if (queueStatus.value !== "error" || queueError.value === null) {
    queueStatus.value = "loading";
    queueError.value = null;
  }
  try {
    const nextOrders = await ordersApi.list(accessToken, {
      number: search.value,
      stage: stage.value === "ALL" ? null : stage.value,
    });
    if (request !== queueRequest) return;
    orders.value = nextOrders;
    queueError.value = null;
    queueStatus.value = "ready";
    if (selectedOrderId.value !== null) void loadDetails(selectedOrderId.value);
  } catch (error) {
    const queueError = toOrderApiError(error);
    if (isUnauthorized(error)) {
      startAuthorizationEpisode(request, queueError);
      return;
    }

    setQueueError(request, queueError);
  }
}

async function restoreAccess(): Promise<void> {
  if (!authorizationEpisode || accessRecoveryPending.value) return;

  accessRecoveryPending.value = true;
  try {
    await sessionStore.restore();
  } catch {
    return;
  } finally {
    accessRecoveryPending.value = false;
  }

  if (sessionStore.status === "anonymous" || sessionStore.status === "denied") {
    await router.replace(routePaths.login);
    return;
  }

  if (!pageIsActive) return;

  if (sessionStore.status !== "authenticated" || sessionStore.error !== null) {
    return;
  }

  authorizationEpisode = false;
  await loadQueue();
  if (!pageIsActive) return;

  if (!authorizationEpisode && queueStatus.value === "ready") {
    scheduleResumedPolling();
  }
}

async function toggleDetails(orderId: string): Promise<void> {
  if (selectedOrderId.value === orderId) {
    if (detailsError.value !== null) {
      await loadDetails(orderId);
      return;
    }
    selectedOrderId.value = null;
    details.value = null;
    detailsError.value = null;
    return;
  }

  selectedOrderId.value = orderId;
  detailsError.value = null;
  await loadDetails(orderId);
}

async function loadDetails(orderId: string): Promise<void> {
  const request = ++detailsRequest;
  const accessToken = sessionStore.accessToken;
  details.value = null;
  detailsError.value = null;
  detailsLoading.value = true;
  if (accessToken === null) {
    detailsLoading.value = false;
    detailsError.value = unauthorizedError();
    return;
  }

  try {
    const nextDetails = await ordersApi.details(accessToken, orderId);
    if (request !== detailsRequest || selectedOrderId.value !== orderId) return;
    details.value = nextDetails;
  } catch (error) {
    if (request === detailsRequest && selectedOrderId.value === orderId) {
      detailsError.value = toOrderApiError(error);
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

function startAuthorizationEpisode(
  request: number,
  error: OrderApiError,
): void {
  if (request !== queueRequest) return;

  authorizationEpisode = true;
  stopPolling();
  setQueueError(request, error);
}

function startPolling(): void {
  if (pollingTimer !== null) return;

  pollingTimer = setInterval(() => void loadQueue(), 5000);
}

function scheduleResumedPolling(): void {
  if (resumedPollingTimer !== null) return;

  resumedPollingTimer = setTimeout(() => {
    resumedPollingTimer = null;
    if (authorizationEpisode) return;

    void loadQueue();
    startPolling();
  }, 5200);
}

function stopPolling(): void {
  if (pollingTimer !== null) {
    clearInterval(pollingTimer);
    pollingTimer = null;
  }

  if (resumedPollingTimer !== null) {
    clearTimeout(resumedPollingTimer);
    resumedPollingTimer = null;
  }
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

function isUnauthorized(error: unknown): error is ApiError {
  return error instanceof ApiError && error.status === 401;
}
</script>

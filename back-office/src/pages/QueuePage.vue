<template>
  <OrdersScreen
    :action-error="actionError"
    :access-recovery-pending="accessRecoveryPending"
    :requires-access-recovery="authorizationEpisode"
    :details="details"
    :details-error="detailsError"
    :details-loading="detailsLoading"
    :error="queueError"
    :refresh-error="backgroundRefreshError"
    :error-focus="errorFocus"
    :orders="orders"
    :search="search"
    :selected-order-id="selectedOrderId"
    :stage="stage"
    :status="queueStatus"
    :transition-recovery-pending="transitionRecoveryPending"
    :requires-transition-recovery="requiresTransitionRecovery"
    :transition-loading="transitionLoading"
    @open="toggleDetails"
    @go-back="router.back()"
    @refresh="loadQueue(false, true)"
    @recover-transition="recoverTransitionState"
    @restore-access="restoreAccess"
    @transition="transitionSelectedOrder"
    @update:search="search = $event"
    @update:stage="stage = $event"
  />
</template>

<script setup lang="ts">
import { inject, onBeforeUnmount, onMounted, shallowRef, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

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
import type {
  QueueFilter,
  QueueScreenError,
} from "./admin/orders/OrdersScreen.types";

const apiClient = inject(apiClientKey);
if (apiClient === undefined) {
  throw new Error("QueuePage requires an ApiClient provider.");
}
const ordersApi = new OrdersApi(apiClient);
const sessionStore = useSessionStore();
const router = useRouter();
const route = useRoute();
const orders = shallowRef<readonly OrderListItem[]>([]);
const search = shallowRef(readQueryValue("q"));
const stage = shallowRef<QueueFilter>(readStageQuery());
const queueStatus = shallowRef<"error" | "loading" | "ready">("loading");
const queueError = shallowRef<QueueScreenError | null>(null);
const backgroundRefreshError = shallowRef<QueueScreenError | null>(null);
const accessRecoveryPending = shallowRef(false);
const selectedOrderId = shallowRef<string | null>(null);
const details = shallowRef<OrderDetails | null>(null);
const detailsError = shallowRef<OrderApiError | null>(null);
const detailsLoading = shallowRef(false);
const transitionLoading = shallowRef(false);
const actionError = shallowRef<OrderApiError | null>(null);
const transitionRecoveryPending = shallowRef(false);
const requiresTransitionRecovery = shallowRef(false);
const errorFocus = shallowRef(false);
let queueRequest = 0;
let detailsRequest = 0;
let pollingTimer: ReturnType<typeof setInterval> | null = null;
const authorizationEpisode = shallowRef(false);

watch([search, stage], () => {
  void persistQuery();
  void loadQueue();
});

onMounted(() => {
  void loadQueue();
  startPolling();
});

onBeforeUnmount(() => {
  queueRequest++;
  detailsRequest++;
  stopPolling();
});

async function loadQueue(
  isBackgroundRefresh = false,
  userInitiated = false,
): Promise<void> {
  if (authorizationEpisode.value) return;

  const request = ++queueRequest;
  const accessToken = sessionStore.accessToken;
  if (accessToken === null) {
    startAuthorizationEpisode(request, unauthorizedError(), userInitiated);
    return;
  }

  const keepsConfirmedQueue =
    isBackgroundRefresh && queueStatus.value === "ready";
  if (!keepsConfirmedQueue) {
    queueStatus.value = "loading";
    queueError.value = null;
    backgroundRefreshError.value = null;
    errorFocus.value = false;
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
    if (
      selectedOrderId.value !== null &&
      detailsError.value === null &&
      !detailsLoading.value
    ) {
      void loadDetails(selectedOrderId.value);
    }
  } catch (error) {
    const queueError = toOrderApiError(error);
    if (isUnauthorized(error)) {
      startAuthorizationEpisode(request, queueError, userInitiated);
      return;
    }

    if (keepsConfirmedQueue) {
      if (request === queueRequest) backgroundRefreshError.value = queueError;
      return;
    }
    setQueueError(request, queueError, userInitiated);
  }
}

async function restoreAccess(): Promise<void> {
  if (!authorizationEpisode.value || accessRecoveryPending.value) return;

  accessRecoveryPending.value = true;
  try {
    await router.push({
      path: routePaths.login,
      query: { returnTo: route.fullPath },
    });
  } catch {
    setQueueError(
      queueRequest,
      {
        code: "LOGIN_NAVIGATION_ERROR",
        details: null,
        message: "",
        requestId: null,
      },
      true,
    );
  } finally {
    accessRecoveryPending.value = false;
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
  actionError.value = null;
  requiresTransitionRecovery.value = false;
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
    startAuthorizationEpisode(queueRequest, unauthorizedError(), true);
    return;
  }

  try {
    const nextDetails = await ordersApi.details(accessToken, orderId);
    if (request !== detailsRequest || selectedOrderId.value !== orderId) return;
    details.value = nextDetails;
  } catch (error) {
    if (isUnauthorized(error)) {
      startAuthorizationEpisode(queueRequest, toOrderApiError(error), true);
      return;
    }
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
  if (accessToken === null) {
    startAuthorizationEpisode(queueRequest, unauthorizedError(), true);
    return;
  }
  if (currentDetails === null || transitionLoading.value) return;

  transitionLoading.value = true;
  actionError.value = null;
  requiresTransitionRecovery.value = false;
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
    if (isUnauthorized(error)) {
      startAuthorizationEpisode(queueRequest, toOrderApiError(error), true);
      return;
    }
    if (
      selectedOrderId.value === currentDetails.id &&
      details.value?.id === currentDetails.id
    ) {
      actionError.value = toOrderApiError(error);
      requiresTransitionRecovery.value = true;
      await recoverTransitionState();
    }
  } finally {
    transitionLoading.value = false;
  }
}

async function recoverTransitionState(): Promise<void> {
  const orderId = selectedOrderId.value;
  const accessToken = sessionStore.accessToken;
  if (orderId === null || transitionRecoveryPending.value) return;
  if (accessToken === null) {
    startAuthorizationEpisode(queueRequest, unauthorizedError(), true);
    return;
  }

  const request = ++detailsRequest;
  transitionRecoveryPending.value = true;
  try {
    const nextDetails = await ordersApi.details(accessToken, orderId);
    if (request !== detailsRequest || selectedOrderId.value !== orderId) return;

    details.value = nextDetails;
    detailsError.value = null;
    orders.value = orders.value.map((order) =>
      order.id === nextDetails.id
        ? { ...order, stage: nextDetails.stage }
        : order,
    );
    actionError.value = null;
    requiresTransitionRecovery.value = false;
  } catch (error) {
    if (isUnauthorized(error)) {
      startAuthorizationEpisode(queueRequest, toOrderApiError(error), true);
      return;
    }
    if (request === detailsRequest && selectedOrderId.value === orderId) {
      actionError.value = toOrderApiError(error);
      requiresTransitionRecovery.value = true;
    }
  } finally {
    if (request === detailsRequest && selectedOrderId.value === orderId) {
      transitionRecoveryPending.value = false;
    }
  }
}

function setQueueError(
  request: number,
  error: OrderApiError,
  userInitiated = false,
): void {
  if (request !== queueRequest) return;
  backgroundRefreshError.value = null;
  orders.value = [];
  queueError.value = error;
  queueStatus.value = "error";
  errorFocus.value = userInitiated;
}

function startAuthorizationEpisode(
  request: number,
  error: QueueScreenError,
  userInitiated: boolean,
): void {
  if (request !== queueRequest) return;

  authorizationEpisode.value = true;
  stopPolling();
  setQueueError(request, error, userInitiated);
}

async function persistQuery(): Promise<void> {
  await router.replace({
    query: {
      ...(search.value ? { q: search.value } : {}),
      ...(stage.value !== "ALL" ? { stage: stage.value } : {}),
    },
  });
}

function readQueryValue(key: "q"): string {
  const value = route.query[key];
  return typeof value === "string" ? value : "";
}

function readStageQuery(): QueueFilter {
  const value = route.query.stage;
  return value === "CREATED" ||
    value === "ACCEPTED" ||
    value === "PREPARING" ||
    value === "READY" ||
    value === "ISSUED"
    ? value
    : "ALL";
}

function startPolling(): void {
  if (pollingTimer !== null) return;

  pollingTimer = setInterval(() => void loadQueue(true), 5000);
}

function stopPolling(): void {
  if (pollingTimer !== null) {
    clearInterval(pollingTimer);
    pollingTimer = null;
  }
}

function toOrderApiError(error: unknown): QueueScreenError {
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
      status:
        "status" in error &&
        (typeof error.status === "number" || error.status === null)
          ? error.status
          : null,
    };
  }

  return {
    code: "API_CONTRACT_ERROR",
    details: null,
    message: "Сервис заказов вернул некорректный ответ.",
    requestId: null,
    status: null,
  };
}

function unauthorizedError(): QueueScreenError {
  return {
    code: "UNAUTHORIZED",
    details: null,
    message: "Сессия сотрудника недоступна.",
    requestId: null,
    status: 401,
  };
}

function isUnauthorized(error: unknown): error is ApiError {
  return error instanceof ApiError && error.status === 401;
}
</script>

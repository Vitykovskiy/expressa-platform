<template>
  <OrdersScreen
    :details="details"
    :details-loading="detailsLoading"
    :orders="orders"
    :search="search"
    :selected-order-id="selectedOrderId"
    :stage="stage"
    :status="queueStatus"
    :requires-transition-recovery="requiresTransitionRecovery"
    :transition-loading="transitionLoading"
    @open="toggleDetails"
    @refresh="loadQueue()"
    @transition="transitionSelectedOrder"
    @update:search="search = $event"
    @update:stage="stage = $event"
  />
</template>

<script setup lang="ts">
import { inject, onBeforeUnmount, onMounted, shallowRef, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import { useSessionStore } from "../app/session.store";
import OrdersScreen from "./admin/orders/OrdersScreen.vue";
import { apiClientKey } from "../shared/api/client";
import { OrdersApi } from "../shared/api/orders.api";
import type {
  OrderDetails,
  OrderListItem,
} from "../shared/api/orders.api.types";
import type { QueueFilter } from "./admin/orders/OrdersScreen.types";
import {
  getOperationPort,
  type OperationContext,
  type ApiRequestReporting,
  type OperationResult,
} from "../shared/lib/operations/operation-port";

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
const queueStatus = shallowRef<"loading" | "ready" | "unresolved">("loading");
const selectedOrderId = shallowRef<string | null>(null);
const details = shallowRef<OrderDetails | null>(null);
const detailsLoading = shallowRef(false);
const transitionLoading = shallowRef(false);
const requiresTransitionRecovery = shallowRef(false);
let queueRequest = 0;
let detailsRequest = 0;
let pollingTimer: ReturnType<typeof setInterval> | null = null;
let pageActive = true;
const pageEpoch = crypto.randomUUID();
const operationPort = getOperationPort();
const recoveryDisposers = new Map<string, () => void>();

watch([search, stage], () => {
  void persistQuery();
  void loadQueue();
});

onMounted(() => {
  void loadQueue();
  startPolling();
});

onBeforeUnmount(() => {
  pageActive = false;
  queueRequest++;
  detailsRequest++;
  stopPolling();
  recoveryDisposers.forEach((dispose) => dispose());
  recoveryDisposers.clear();
  operationPort.clearSession(pageEpoch);
});

async function loadQueue(isBackgroundRefresh = false): Promise<void> {
  const request = ++queueRequest;
  const accessToken = sessionStore.accessToken;
  if (accessToken === null) return;

  const keepsConfirmedQueue =
    isBackgroundRefresh && queueStatus.value === "ready";
  if (!keepsConfirmedQueue) {
    queueStatus.value = "loading";
  }
  const query = {
    number: search.value,
    stage: stage.value === "ALL" ? null : stage.value,
  };
  const activeRequest = () => pageActive && request === queueRequest;
  const result = isBackgroundRefresh
    ? await operationPort.run(
        {
          ...operationContext(
            "orders.poll",
            "queue",
            "read",
            "automatic",
            false,
          ),
          ownerIsActive: activeRequest,
        },
        (reporting) => ordersApi.list(accessToken, query, reporting),
      )
    : await runRead(
        "orders.list",
        "queue",
        (reporting) => ordersApi.list(accessToken, query, reporting),
        { operationKey: "orders.list", resourceKey: JSON.stringify(query) },
        activeRequest,
        () =>
          pageActive &&
          JSON.stringify({
            number: search.value,
            stage: stage.value === "ALL" ? null : stage.value,
          }) === JSON.stringify(query),
      );
  if (request === queueRequest && result.status === "success") {
    orders.value = result.value;
    queueStatus.value = "ready";
    if (selectedOrderId.value !== null && !detailsLoading.value) {
      void loadDetails(selectedOrderId.value);
    }
  } else if (
    request === queueRequest &&
    !isBackgroundRefresh &&
    result.status !== "cancelled"
  ) {
    queueStatus.value = orders.value.length > 0 ? "ready" : "unresolved";
  }
}

async function toggleDetails(orderId: string): Promise<void> {
  if (selectedOrderId.value === orderId) {
    selectedOrderId.value = null;
    details.value = null;
    return;
  }

  selectedOrderId.value = orderId;
  requiresTransitionRecovery.value = false;
  await loadDetails(orderId);
}

async function loadDetails(orderId: string): Promise<void> {
  const request = ++detailsRequest;
  const accessToken = sessionStore.accessToken;
  details.value = null;
  detailsLoading.value = true;
  if (accessToken === null) {
    detailsLoading.value = false;
    return;
  }
  const result = await runRead(`orders.details`, orderId, (reporting) =>
    ordersApi.details(accessToken, orderId, reporting),
  );
  if (request === detailsRequest && selectedOrderId.value === orderId) {
    if (result.status === "success") details.value = result.value;
    detailsLoading.value = false;
  }
}

async function transitionSelectedOrder(): Promise<void> {
  const accessToken = sessionStore.accessToken;
  const currentDetails = details.value;
  if (accessToken === null) return;
  if (currentDetails === null || transitionLoading.value) return;

  transitionLoading.value = true;
  requiresTransitionRecovery.value = false;
  const result = await operationPort.run(
    operationContext(
      "orders.transition",
      currentDetails.id,
      "mutation",
      "user",
    ),
    (reporting) => ordersApi.transition(accessToken, currentDetails, reporting),
  );
  if (result.status === "success") {
    const nextDetails = result.value;
    if (selectedOrderId.value !== currentDetails.id) return;
    details.value = nextDetails;
    orders.value = orders.value.map((order) =>
      order.id === nextDetails.id
        ? { ...order, stage: nextDetails.stage }
        : order,
    );
  } else if (
    result.status !== "cancelled" &&
    selectedOrderId.value === currentDetails.id &&
    details.value?.id === currentDetails.id
  ) {
    requiresTransitionRecovery.value = true;
    await recoverTransitionState();
  }
  transitionLoading.value = false;
}

async function recoverTransitionState(): Promise<void> {
  const orderId = selectedOrderId.value;
  const accessToken = sessionStore.accessToken;
  if (orderId === null) return;
  if (accessToken === null) return;

  const request = ++detailsRequest;
  const result = await runRead(
    "orders.transition.reconcile",
    orderId,
    (reporting) => ordersApi.details(accessToken, orderId, reporting),
  );
  if (result.status === "success") {
    const nextDetails = result.value;
    if (request !== detailsRequest || selectedOrderId.value !== orderId) return;

    details.value = nextDetails;
    orders.value = orders.value.map((order) =>
      order.id === nextDetails.id
        ? { ...order, stage: nextDetails.stage }
        : order,
    );
    requiresTransitionRecovery.value = false;
  }
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

function operationContext(
  operationKey: string,
  resourceKey: string,
  kind: OperationContext["kind"],
  origin: OperationContext["origin"] = "user",
  reportFailure = true,
): OperationContext {
  return {
    attemptId: crypto.randomUUID(),
    epoch: pageEpoch,
    kind,
    operationKey,
    origin,
    ownerIsActive: () => pageActive,
    reportFailure,
    resourceKey,
  };
}

async function runRead<T>(
  operationKey: string,
  resourceKey: string,
  execute: (reporting: ApiRequestReporting) => Promise<T>,
  requestTarget?: OperationContext["requestTarget"],
  ownerIsActive?: OperationContext["ownerIsActive"],
  recoveryIsActive?: OperationContext["ownerIsActive"],
): Promise<OperationResult<T>> {
  const context = {
    ...operationContext(operationKey, resourceKey, "read"),
    requestTarget,
    ...(ownerIsActive === undefined ? {} : { ownerIsActive }),
  };
  const recoveryKey = JSON.stringify([operationKey, resourceKey]);
  recoveryDisposers.get(recoveryKey)?.();
  recoveryDisposers.delete(recoveryKey);
  const dispose = operationPort.registerRecovery(
    {
      ...context,
      ...(recoveryIsActive === undefined
        ? {}
        : { ownerIsActive: recoveryIsActive }),
    },
    {
      actionLabel: "Повторить",
      safety: "read",
      execute: (invocation) => invocation.run(execute),
    },
  );
  const result = await operationPort.run(context, execute);
  if (result.status === "success" || result.status === "cancelled") dispose();
  else recoveryDisposers.set(recoveryKey, dispose);
  return result;
}
</script>

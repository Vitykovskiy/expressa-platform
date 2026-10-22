<template>
  <OrdersPage
    ref="page"
    :orders="cards"
    :filter="filter"
    :phase="pagePhase"
    :error-message="orders.readError"
    :commands-disabled="orders.commandsDisabled"
    :pending-order-id="pendingOrderId"
    :expanded-order-id="orders.selectedOrderId"
    :selected-order="extraSelectedCard"
    @select-filter="selectFilter"
    @refresh="orders.refresh"
    @confirm="confirm"
    @ready="ready"
    @reject="openReject"
    @issue="openIssue"
    @toggle-details="toggleDetails"
  >
    <template #feedback>
      <div v-if="orders.phase === 'error'" class="orders-feedback">
        <OperationsButton
          label="Повторить чтение"
          kind="secondary"
          @click="orders.refresh"
        />
      </div>
      <div v-if="orders.detailLoading" class="orders-feedback" role="status">
        Загружаем выбранный заказ…
      </div>
      <div v-if="orders.detailMessage" class="orders-feedback">
        <p class="orders-feedback__copy" role="alert">
          {{ orders.detailMessage }}
        </p>
        <OperationsButton
          label="Повторить чтение заказа"
          kind="secondary"
          @click="orders.loadSelectedOrder"
        />
      </div>
      <section
        v-if="recovery"
        class="orders-feedback"
        aria-label="Проверка результата команды"
      >
        <p class="orders-feedback__copy">Заказ #{{ recovery.order.number }}</p>
        <p class="orders-feedback__copy" role="status">{{ orders.message }}</p>
        <p v-if="checkedState" class="orders-feedback__copy">
          Текущее состояние: {{ checkedState }}
        </p>
        <p v-if="recovery.action === 'reject'" class="orders-feedback__copy">
          Причина отклонения: {{ recovery.reason }}
        </p>
        <OperationsButton
          v-if="recovery.phase !== 'reconciled'"
          label="Проверить состояние заказа"
          kind="secondary"
          :disabled="
            recovery.phase === 'checking' || orders.intent.kind === 'invalid'
          "
          @click="orders.checkCommand"
        />
        <OperationsButton
          v-else
          label="Завершить сверку"
          kind="secondary"
          @click="orders.finishReconciliation"
        />
      </section>
      <p
        v-else-if="
          orders.message && orders.phase !== 'error' && orders.dialog === null
        "
        class="orders-feedback__copy orders-feedback__notice"
        role="status"
      >
        {{ orders.message }}
      </p>
    </template>
  </OrdersPage>
  <OrderActionDialog
    :mode="dialogMode"
    :reason="orders.dialog?.reason ?? ''"
    :pending="orders.command?.phase === 'sending'"
    :error-message="orders.dialog?.error ?? null"
    @update:reason="orders.updateReason"
    @close="orders.closeDialog"
    @reject="reject"
    @issue="orders.submitDialog"
  />
</template>

<script setup lang="ts">
import {
  computed,
  nextTick,
  onMounted,
  onScopeDispose,
  onActivated,
  onDeactivated,
  useTemplateRef,
  watch,
} from "vue";
import { useOrdersStore } from "../../entities/orders/orders.store";
import { ORDER_STAGE_LABELS } from "../../entities/orders/orders.constants";
import type { OrderNavigationRequest } from "../../entities/orders/orders.types";
import {
  readOrdersIntent,
  ordersNavigationHref,
} from "../../features/orders/orders-navigation";
import { toOrderCard } from "../../features/orders/presentation/orders.presenter";
import OrderActionDialog from "../../features/orders/presentation/OrderActionDialog.vue";
import OperationsButton from "../../shared/ui/operations/OperationsButton.vue";
import OrdersPage from "./OrdersPage.vue";
import {
  ORDER_FILTER_TO_VIEW,
  ORDER_VIEW_TO_FILTER,
} from "./OrdersRoute.constants";
import type { OrdersPageHandle, OrderFilter } from "./OrdersPage.types";
import type { OrdersRouteProps, OrdersRouteEmits } from "./OrdersRoute.types";

defineOptions({ inheritAttrs: false });

const props = defineProps<OrdersRouteProps>();
const emit = defineEmits<OrdersRouteEmits>();
const orders = useOrdersStore();
const page = useTemplateRef<OrdersPageHandle>("page");
let routeActive = true;
let needsRestore = true;

const cards = computed(() => orders.orders.map(toOrderCard));
const filter = computed(() => ORDER_VIEW_TO_FILTER[orders.view]);
const pagePhase = computed(() =>
  orders.phase === "idle" ? "loading" : orders.phase,
);
const pendingOrderId = computed(() =>
  orders.command?.phase === "sending" ? orders.command.order.id : null,
);
const extraSelectedCard = computed(() =>
  orders.selectedOrder !== null &&
  !orders.orders.some((order) => order.id === orders.selectedOrder?.id)
    ? toOrderCard(orders.selectedOrder)
    : null,
);
const recovery = computed(() =>
  orders.command !== null && orders.command.phase !== "sending"
    ? orders.command
    : null,
);
const dialogMode = computed(() =>
  recovery.value === null &&
  orders.dialog !== null &&
  orders.intent.kind === "valid"
    ? orders.dialog.mode
    : null,
);
const checkedState = computed(() => {
  if (orders.checkedOrder === null) {
    return null;
  }

  if (orders.checkedOrder.rejection !== null) {
    return `Отклонён · ${orders.checkedOrder.rejection.reason}`;
  }

  return ORDER_STAGE_LABELS[orders.checkedOrder.stage];
});

async function syncRoute() {
  if (!routeActive) {
    return;
  }

  await orders.activate(props.context, readOrdersIntent(props.search));
  await nextTick();

  if (routeActive && needsRestore && page.value !== null) {
    page.value.restoreScroll(orders.scrollPosition);
    needsRestore = false;
  }
}

function navigate(request: OrderNavigationRequest | null) {
  if (routeActive && request !== null) {
    emit("navigate", ordersNavigationHref(globalThis.location.href, request));
  }
}

async function selectFilter(selected: OrderFilter) {
  const owner = props.context;
  const request = await orders.selectView(ORDER_FILTER_TO_VIEW[selected]);

  if (props.context === owner) {
    navigate(request);
  }
}

async function toggleDetails(id: string) {
  const owner = props.context;
  const request = await orders.selectOrder(
    orders.selectedOrderId === id ? null : id,
  );

  if (props.context === owner) {
    navigate(request);
  }
}

function confirm(id: string) {
  void orders.perform(id, "accept");
}

function ready(id: string) {
  void orders.perform(id, "ready");
}

function openReject(id: string) {
  orders.openDialog(id, "reject");
}

function openIssue(id: string) {
  orders.openDialog(id, "issue");
}

function reject(reason: string) {
  orders.updateReason(reason);
  void orders.submitDialog();
}

function rememberAndDeactivate() {
  if (page.value !== null) {
    orders.rememberScroll(page.value.captureScroll());
  }

  routeActive = false;
  orders.deactivate();
}

watch(() => [props.context, props.search] as const, syncRoute, {
  immediate: true,
});
watch(
  () => orders.sessionExpired,
  (expired) => {
    if (expired && routeActive) {
      emit("sessionExpired");
    }
  },
);

onMounted(async () => {
  globalThis.document.title = "Заказы · Expressa";
  await nextTick();

  if (routeActive) {
    page.value?.focusHeading();
  }
});

onActivated(() => {
  if (!routeActive) {
    routeActive = true;
    needsRestore = true;
    globalThis.document.title = "Заказы · Expressa";
    void syncRoute();
    page.value?.focusHeading();
  }
});
onDeactivated(rememberAndDeactivate);
onScopeDispose(rememberAndDeactivate);
</script>

<style scoped>
.orders-feedback {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
  padding: 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-surface);
  background: var(--color-surface);
}
.orders-feedback__copy {
  margin: 0;
  color: var(--color-foreground-muted);
  font-size: 14px;
  line-height: 20px;
  overflow-wrap: anywhere;
}
.orders-feedback__notice {
  margin-bottom: 16px;
}
</style>

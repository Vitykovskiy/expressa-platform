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
    :selected-order="selectedCardOutsideQueue"
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
        v-if="commandRecovery"
        class="orders-feedback"
        aria-label="Проверка результата команды"
      >
        <p class="orders-feedback__copy">
          Заказ #{{ commandRecovery.order.number }}
        </p>
        <p class="orders-feedback__copy" role="status">{{ orders.message }}</p>
        <p v-if="checkedOrderState" class="orders-feedback__copy">
          Текущее состояние: {{ checkedOrderState }}
        </p>
        <OperationsButton
          v-if="commandRecovery.phase !== 'reconciled'"
          label="Проверить состояние заказа"
          kind="secondary"
          :disabled="recoveryCheckDisabled"
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
        v-else-if="showCommandNotice"
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
    :commands-disabled="orders.commandsDisabled"
    :error-message="issueDialogError"
    @update:reason="orders.updateReason"
    @close="orders.closeDialog"
    @reject="reject"
    @issue="orders.submitDialog"
  />
  <Teleport to="body">
    <div v-if="orders.rejectionError" class="orders-rejection-toast">
      <SourceToast type="error" :message="orders.rejectionError" />
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import {
  computed,
  nextTick,
  onMounted,
  onScopeDispose,
  useTemplateRef,
  watch,
} from "vue";
import { useRoute, useRouter } from "vue-router";
import { useOrdersStore } from "./orders.store";
import { ORDER_STAGE_LABELS } from "./orders.constants";
import type { OrderNavigationRequest } from "./orders.types";
import { readOrdersIntent, ordersLocation } from "./orders-navigation";
import { toOrderCard } from "./components/orders.presenter";
import OrderActionDialog from "./components/OrderActionDialog.vue";
import OperationsButton from "../../shared/ui/operations/OperationsButton.vue";
import SourceToast from "../../shared/ui/SourceToast/SourceToast.vue";
import OrdersPage from "./OrdersPage.vue";
import {
  ORDER_FILTER_TO_VIEW,
  ORDER_VIEW_TO_FILTER,
  ORDERS_DOCUMENT_TITLE,
} from "./OrdersRoute.constants";
import type { OrdersPageHandle, OrderFilter } from "./OrdersPage.types";
import type { OrdersRouteProps, OrdersRouteEmits } from "./OrdersRoute.types";

defineOptions({ inheritAttrs: false });

const props = defineProps<OrdersRouteProps>();
const emit = defineEmits<OrdersRouteEmits>();
const orders = useOrdersStore();
const route = useRoute();
const router = useRouter();
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

const selectedCardOutsideQueue = computed(() => {
  const selected = orders.selectedOrder;

  if (selected === null) {
    return null;
  }

  if (orders.orders.some((order) => order.id === selected.id)) {
    return null;
  }

  return toOrderCard(selected);
});

const commandRecovery = computed(() => {
  const command = orders.command;

  if (command === null) {
    return null;
  }

  // Ошибка отклонения остаётся у формы и SourceToast, без отдельной сверки.
  if (command.action === "reject" || command.phase === "sending") {
    return null;
  }

  return command;
});

const recoveryCheckDisabled = computed(
  () =>
    commandRecovery.value?.phase === "checking" ||
    orders.intent.kind === "invalid",
);

const dialogMode = computed(() => {
  if (commandRecovery.value !== null) {
    return null;
  }

  if (orders.dialog === null || orders.intent.kind !== "valid") {
    return null;
  }

  return orders.dialog.mode;
});

const issueDialogError = computed(() =>
  orders.dialog?.mode === "issue" ? orders.dialog.error : null,
);

const showCommandNotice = computed(
  () =>
    Boolean(orders.message) &&
    orders.phase !== "error" &&
    orders.dialog === null,
);

const checkedOrderState = computed(() => {
  const checked = orders.checkedOrder;

  if (checked === null) {
    return null;
  }

  if (checked.rejection !== null) {
    return `Отклонён · ${checked.rejection.reason}`;
  }

  return ORDER_STAGE_LABELS[checked.stage];
});

async function syncRoute() {
  if (!routeActive) {
    return;
  }

  await orders.activate(props.context, readOrdersIntent(props.query));
  await nextTick();

  if (!routeActive || !needsRestore || page.value === null) {
    return;
  }

  page.value.restoreScroll(orders.scrollPosition);
  needsRestore = false;
}

function navigate(request: OrderNavigationRequest | null) {
  if (routeActive && request !== null) {
    // App сообщает ошибку router.onError; команда и выбор не переигрываются.
    void router
      .push(ordersLocation(route.query, route.hash, request))
      .catch(() => undefined);
  }
}

async function selectFilter(selected: OrderFilter) {
  const selectionContext = props.context;
  const request = await orders.selectView(ORDER_FILTER_TO_VIEW[selected]);

  // Завершение выбора прежнего сеанса не меняет адрес нового контекста.
  if (props.context === selectionContext) {
    navigate(request);
  }
}

async function toggleDetails(id: string) {
  const selectionContext = props.context;
  const nextOrderId = orders.selectedOrderId === id ? null : id;
  const request = await orders.selectOrder(nextOrderId);

  if (props.context === selectionContext) {
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

watch(
  [
    () => props.context,
    () => props.query.number,
    () => props.query.stage,
    () => props.query.order,
  ],
  syncRoute,
  {
    immediate: true,
  },
);

watch(
  () => orders.sessionExpired,
  (expired) => {
    if (expired && routeActive) {
      emit("sessionExpired");
    }
  },
);

onMounted(async () => {
  globalThis.document.title = ORDERS_DOCUMENT_TITLE;
  await nextTick();

  if (routeActive) {
    page.value?.focusHeading();
  }
});

onScopeDispose(rememberAndDeactivate);
</script>

<style scoped>
/* Локальное размещение toast над страницей: tokens не задают слой и отступы. */
.orders-rejection-toast {
  position: fixed;
  z-index: 2500;
  top: 24px;
  left: 50%;
  transform: translateX(-50%);
  max-width: calc(100% - 32px);
}

@media (max-width: 767px) {
  .orders-rejection-toast {
    top: 16px;
  }
}

/* Локальная геометрия блока обратной связи: общих tokens отступов нет. */
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
/* Типографика обратной связи не имеет общей шкалы в tokens приложения. */
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

<template>
  <main class="orders-page">
    <p class="orders-page__announcement" role="status" aria-atomic="true">
      {{ announcement }}
    </p>
    <OrderTransition
      v-if="retainedOperation"
      :order="null"
      :operation="orders.operation"
      :blocked="session.busy"
      :recovery-blocked="session.busy"
      :retained="true"
      :show-back="showBack"
      @reconcile="reconcile"
      @back="emit('back')"
    />
    <div v-if="navigationError" class="orders-page__error">
      <p role="alert">{{ navigationError }}</p>
      <UiButton variant="secondary" @activate="emit('reset-address')"
        >Сбросить фильтры</UiButton
      >
    </div>
    <template v-else>
      <div v-show="showList">
        <OrderSearch
          :filters="filters"
          :pending="listLoading"
          :refresh-disabled="orders.commandLocked"
          @search="emit('search', $event)"
          @refresh="orders.refresh"
          @dirty="emit('search-dirty', $event)"
        />
      </div>
      <UiButton
        v-if="showBack"
        class="orders-page__back"
        variant="quiet"
        @activate="emit('back')"
        >Назад к заказам</UiButton
      >
      <div
        class="orders-page__workspace"
        :class="{ 'orders-page__workspace--wide': wide }"
      >
        <OrderList
          v-show="showList"
          :orders="orders.orders"
          :selected-id="selectedId"
          :loading="listLoading"
          :error="orders.error"
          :updated-at="orders.updatedAt"
          :filtered="filtered"
          @select="emit('select', $event)"
          @retry="orders.refresh"
          @reset="reset"
        />
        <OrderDetail
          v-show="showDetail"
          :order="orders.detail"
          :selected="selectedId !== null"
          :loading="detailLoading"
          :error="visibleDetailError"
          :updated-at="orders.detailUpdatedAt"
          @retry="orders.refreshDetail"
        >
          <template #action>
            <OrderTransition
              :order="orders.detail"
              :operation="detailOperation"
              :blocked="actionBlocked"
              :recovery-blocked="session.busy"
              :retained="false"
              :show-back="showBack"
              @transition="transition"
              @reconcile="reconcile"
              @back="emit('back')"
            />
          </template>
        </OrderDetail>
      </div>
    </template>
  </main>
</template>

<script setup lang="ts">
import {
  computed,
  nextTick,
  onActivated,
  onDeactivated,
  onUnmounted,
  ref,
  watch,
} from "vue";
import { useSessionStore } from "../entities/session/session.store";
import { useOrderStore } from "../entities/order/order.store";
import { orderPollMs } from "../entities/order/order.constants";
import type {
  OrderFilters,
  OrderTransition as OrderTransitionContext,
} from "../entities/order/order.types";
import OrderTransition from "../features/order-transition/OrderTransition.vue";
import { orderActionCopy } from "../features/order-transition/OrderTransition.constants";
import OrderSearch from "../features/order-search/OrderSearch.vue";
import OrderList from "../widgets/orders/OrderList.vue";
import OrderDetail from "../widgets/orders/OrderDetail.vue";
import UiButton from "../shared/ui/UiButton/UiButton.vue";
import { wideWorkspaceQuery } from "./OrdersPage.constants";
import type { OrdersPageEmits, OrdersPageProps } from "./OrdersPage.types";

const props = defineProps<OrdersPageProps>();
const emit = defineEmits<OrdersPageEmits>();
const orders = useOrderStore();
const session = useSessionStore();
const active = ref(false);
const listLoading = computed(
  () => orders.loading || (session.busy && orders.orders === null),
);
const detailLoading = computed(
  () =>
    orders.detailLoading ||
    (session.busy && props.selectedId !== null && orders.detail === null),
);
const media = window.matchMedia(wideWorkspaceQuery);
const wide = ref(media.matches);
const showList = computed(() => wide.value || props.selectedId === null);
const showDetail = computed(() => wide.value || props.selectedId !== null);
const showBack = computed(() => !wide.value && props.selectedId !== null);
const filtered = computed(
  () => props.filters.number !== null || props.filters.stage !== null,
);
const detailOperation = computed(() =>
  orders.operation?.id === props.selectedId ? orders.operation : null,
);
const retainedOperation = computed(
  () =>
    orders.operation !== null &&
    (props.navigationError !== "" || orders.operation.id !== props.selectedId),
);
const actionBlocked = computed(
  () =>
    session.busy ||
    orders.commandLocked ||
    detailLoading.value ||
    orders.detailError !== "",
);
const visibleDetailError = computed(() =>
  detailOperation.value !== null &&
  (orders.commandLocked || detailOperation.value.status === "absent")
    ? ""
    : orders.detailError,
);
const announcement = computed(() => {
  const operation = orders.operation;

  if (operation === null) {
    return "";
  }

  const copy = orderActionCopy[operation.action];
  const message =
    operation.status === "sending"
      ? copy.pending
      : operation.status === "completed"
        ? copy.completion
        : operation.message;

  return `Заказ ${operation.number}. ${message}`;
});

let timer: ReturnType<typeof setInterval> | null = null;
let previousId: string | null = null;
let savedScroll = 0;
let disposed = false;
let activatedOnce = false;
let currentFilters: OrderFilters | null = null;

async function runAction(run: () => Promise<void>) {
  const initiating = document.activeElement;
  const region = initiating?.closest(".order-transition");
  const id = props.selectedId;
  const originalId = orders.commandLocked ? orders.operation?.id : id;
  let moved = false;

  function trackFocus(event: FocusEvent) {
    if (event.target instanceof Node && !region?.contains(event.target)) {
      moved = true;
    }
  }

  document.addEventListener("focusin", trackFocus);

  try {
    await run();
    await nextTick();

    if (
      !disposed &&
      active.value &&
      !moved &&
      region != null &&
      id === originalId &&
      id === props.selectedId
    ) {
      document
        .getElementById("order-detail-heading")
        ?.focus({ preventScroll: true });
    }
  } finally {
    document.removeEventListener("focusin", trackFocus);
  }
}

function transition(context: OrderTransitionContext) {
  if (active.value && props.navigationError === "")
    void runAction(() => orders.transition(context));
}

function reconcile() {
  if (active.value && props.navigationError === "")
    void runAction(orders.reconcile);
}

function reset() {
  emit("search", { number: null, stage: null });
}

async function focusLocation(returnId: string | null) {
  const id = props.selectedId;
  const user = session.user?.id;
  const focused = document.activeElement;

  await nextTick();

  if (
    disposed ||
    !active.value ||
    session.status !== "staff" ||
    session.busy ||
    user !== session.user?.id ||
    id !== props.selectedId ||
    focused !== document.activeElement ||
    document.querySelector('dialog[open], [aria-modal="true"]') !== null
  ) {
    return;
  }

  if (props.selectedId !== null) {
    document
      .getElementById("order-detail-heading")
      ?.focus({ preventScroll: true });
    if (!wide.value) window.scrollTo({ top: 0 });
  } else if (returnId !== null && props.selectedId === null) {
    const row = document.getElementById(`order-row-${returnId}`);

    (row ?? document.getElementById("order-list-heading"))?.focus({
      preventScroll: true,
    });
    window.scrollTo({ top: savedScroll });
  }
}

async function synchronize(focus = true) {
  if (!active.value) return;
  if (props.navigationError !== "") {
    orders.cancelRequests();
    currentFilters = null;

    return;
  }

  if (session.busy) {
    return;
  }

  const oldId = previousId;

  if (oldId === null && props.selectedId !== null) {
    savedScroll = window.scrollY;
  }

  previousId = props.selectedId;
  if (
    currentFilters === null ||
    currentFilters.number !== props.filters.number ||
    currentFilters.stage !== props.filters.stage
  ) {
    currentFilters = { ...props.filters };
    void orders.applyFilters(props.filters);
  }

  void orders.select(props.selectedId);
  if (focus) await focusLocation(oldId);
}

function resize() {
  if (!active.value) return;
  const wasWide = wide.value;

  wide.value = media.matches;

  if (wasWide !== wide.value && props.selectedId !== null) {
    if (wide.value) {
      document
        .getElementById(`order-row-${props.selectedId}`)
        ?.focus({ preventScroll: true });
    } else {
      void focusLocation(null);
    }
  }
}

function refreshVisible() {
  if (
    active.value &&
    !document.hidden &&
    !session.busy &&
    props.navigationError === ""
  ) {
    void orders.refresh();
  }
}

function visibility() {
  if (document.hidden) {
    orders.cancelRequests();

    if (timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  } else {
    refreshVisible();
    startPolling();
  }
}

function startPolling() {
  if (active.value && timer === null && !document.hidden) {
    timer = setInterval(refreshVisible, orderPollMs);
  }
}

watch(
  () => [
    session.busy,
    props.filters.number,
    props.filters.stage,
    props.selectedId,
    props.navigationError,
  ],
  () => synchronize(),
);

function deactivate() {
  active.value = false;
  orders.cancelRequests();

  if (timer !== null) {
    clearInterval(timer);
    timer = null;
  }

  media.removeEventListener("change", resize);
  document.removeEventListener("visibilitychange", visibility);
}

onActivated(() => {
  active.value = true;
  wide.value = media.matches;
  void synchronize(!activatedOnce);
  if (activatedOnce) refreshVisible();
  activatedOnce = true;
  startPolling();
  media.addEventListener("change", resize);
  document.addEventListener("visibilitychange", visibility);
});
onDeactivated(deactivate);
onUnmounted(() => {
  disposed = true;
  deactivate();
});
</script>

<style scoped>
.orders-page {
  min-inline-size: 0;
}
.orders-page__announcement {
  /* Visually hidden live status; one owner survives operation-region relocation. */
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
.orders-page__workspace {
  display: grid;
  min-inline-size: 0;
  gap: var(--space-xl);
}
/* U02's two-column working geometry; no viewport-locked panels. */
.orders-page__workspace--wide {
  grid-template-columns: minmax(0, 3fr) minmax(22rem, 2fr);
}
.orders-page__back {
  margin-block-end: var(--space-lg);
}
.orders-page__error {
  display: grid;
  justify-items: start;
  gap: var(--space-lg);
  color: var(--color-danger);
}
</style>
